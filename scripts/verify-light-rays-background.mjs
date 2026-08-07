import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "/Users/lidaduo/.cursor/skills/pixel-diff/tools/node_modules/playwright-core/index.mjs";

const url = process.argv[2] || "http://127.0.0.1:4185/";
const output = resolve(
  process.argv[3] || "../qa/light-rays-background-20260805",
);
const chrome =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

await mkdir(output, { recursive: true });

const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
});
const errors = [];

page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
page.on("requestfailed", (request) => {
  errors.push(`request: ${request.url()} ${request.failure()?.errorText || "failed"}`);
});
page.on("response", (response) => {
  if (response.status() >= 400) {
    errors.push(`http ${response.status()}: ${response.url()}`);
  }
});

await page.goto(url, { waitUntil: "load", timeout: 60_000 });
await page.waitForFunction(
  () =>
    document.body.classList.contains("loaded") &&
    window.__LIGHT_RAYS_BACKGROUND__?.material,
  null,
  { timeout: 60_000 },
);
await page.waitForTimeout(11_500);
await page.screenshot({ path: `${output}/01-cover-settled.png` });

await page.mouse.move(160, 160);
await page.waitForTimeout(1_000);
const mouseLeft = await page.evaluate(() => {
  const value = window.__LIGHT_RAYS_BACKGROUND__.material.uniforms.mousePos.value;
  return value.toArray();
});
await page.screenshot({ path: `${output}/02-cover-mouse-left.png` });

await page.mouse.move(1120, 160);
await page.waitForTimeout(1_000);
const mouseRight = await page.evaluate(() => {
  const value = window.__LIGHT_RAYS_BACKGROUND__.material.uniforms.mousePos.value;
  return value.toArray();
});
await page.screenshot({ path: `${output}/03-cover-mouse-right.png` });

await page.locator(".enterButton").click();
await page.waitForFunction(() => window.Main?.maskRevealView?.ENTERED === true, null, {
  timeout: 15_000,
});
await page.waitForTimeout(1_100);
await page.screenshot({ path: `${output}/04-opened-settled.png` });

const openedState = await page.evaluate(() => {
  const view = window.Main.maskRevealView;
  const arrows = [...document.querySelectorAll(".navArrow")].map((element) => ({
    opacity: getComputedStyle(element).opacity,
    pointerEvents: getComputedStyle(element).pointerEvents,
  }));

  return {
    currentPageIndex: view.currPageIndex,
    pageDataCount: view.pageDatas.length,
    pageMeshCount: view.pages.length,
    menuVisible: view.menu.visible,
    arrows,
  };
});

await page.keyboard.press("ArrowRight");
await page.waitForTimeout(1_700);
const keyboardIndex = await page.evaluate(
  () => window.Main.maskRevealView.currPageIndex,
);

await page.locator(".navArrow").nth(1).click();
await page.waitForTimeout(1_700);
const arrowIndex = await page.evaluate(
  () => window.Main.maskRevealView.currPageIndex,
);

const canvas = page.locator("canvas");
const canvasBox = await canvas.boundingBox();
if (canvasBox) {
  await page.mouse.move(
    canvasBox.x + canvasBox.width * 0.72,
    canvasBox.y + canvasBox.height * 0.5,
  );
  await page.mouse.down();
  await page.mouse.move(
    canvasBox.x + canvasBox.width * 0.22,
    canvasBox.y + canvasBox.height * 0.5,
    { steps: 20 },
  );
  await page.mouse.up();
  await page.waitForTimeout(1_900);
}
const dragIndex = await page.evaluate(
  () => window.Main.maskRevealView.currPageIndex,
);

await page.evaluate(() => window.Main.maskRevealView.setCurrentPage(12));
await page.waitForTimeout(2_000);
await page.screenshot({ path: `${output}/05-final-resources.png` });
const finalState = await page.evaluate(() => ({
  currentPageIndex: window.Main.maskRevealView.currPageIndex,
  resourcesVisible: getComputedStyle(document.querySelector(".extraResources"))
    .visibility,
  resourcesPointerEvents: getComputedStyle(
    document.querySelector(".extraResources"),
  ).pointerEvents,
}));

const fallbackPage = await browser.newPage({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
});
await fallbackPage.goto(`${url}${url.includes("?") ? "&" : "?"}lightRays=off`, {
  waitUntil: "load",
  timeout: 60_000,
});
await fallbackPage.waitForFunction(
  () => document.body.classList.contains("loaded"),
  null,
  { timeout: 60_000 },
);
const fallbackState = await fallbackPage.evaluate(() => ({
  adapterMounted: Boolean(window.__LIGHT_RAYS_BACKGROUND__),
  materialType: window.Main?.maskRevealView?.groundPlane?.material?.type,
}));
await fallbackPage.close();

const result = {
  url,
  mouseLeft,
  mouseRight,
  openedState,
  keyboardIndex,
  arrowIndex,
  dragIndex,
  finalState,
  fallbackState,
  errors,
};

await writeFile(
  `${output}/runtime-verification.json`,
  `${JSON.stringify(result, null, 2)}\n`,
);
await browser.close();

const mouseMoved =
  mouseLeft[0] < 0.3 &&
  mouseRight[0] > 0.7 &&
  mouseRight[0] - mouseLeft[0] > 0.4;
const arrowsVisible = openedState.arrows.every(
  (arrow) => Number(arrow.opacity) > 0 && arrow.pointerEvents === "auto",
);
const failed =
  !mouseMoved ||
  openedState.currentPageIndex !== 1 ||
  openedState.pageDataCount !== 11 ||
  openedState.pageMeshCount !== 11 ||
  !openedState.menuVisible ||
  !arrowsVisible ||
  keyboardIndex !== 2 ||
  arrowIndex !== 3 ||
  dragIndex !== 4 ||
  finalState.currentPageIndex !== 12 ||
  finalState.resourcesVisible !== "visible" ||
  finalState.resourcesPointerEvents !== "all" ||
  fallbackState.adapterMounted ||
  fallbackState.materialType !== "MeshStandardMaterial" ||
  errors.length > 0;

if (failed) {
  process.stderr.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`verified Light Rays background at ${url}\n`);
}
