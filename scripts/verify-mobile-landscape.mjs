import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "/Users/lidaduo/.cursor/skills/pixel-diff/tools/node_modules/playwright-core/index.mjs";

const url = process.argv[2] || "http://127.0.0.1:4194/?skipIntro=1&mobilePreview=1";
const output = resolve(process.argv[3] || "../qa/mobile-landscape-20260820/runtime");
const chrome = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
});
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
page.on("requestfailed", (request) => errors.push(`request: ${request.url()} ${request.failure()?.errorText || "failed"}`));
page.on("response", (response) => { if (response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`); });

await page.goto(url, { waitUntil: "load", timeout: 60_000 });
await page.waitForTimeout(1000);
const portrait = await page.evaluate(() => ({
  orientation: document.documentElement.dataset.mobileOrientation,
  gateDisplay: getComputedStyle(document.querySelector("#mobileOrientationGate")).display,
  gateText: document.querySelector("#mobileOrientationGate")?.textContent.trim() || "",
  canvasCount: document.querySelectorAll("canvas").length,
  runtimeStarted: window.__MOBILE_LANDSCAPE__?.runtimeStarted,
  runtimeMode: window.__MOBILE_LANDSCAPE__?.mode,
}));
await page.screenshot({ path: `${output}/01-portrait-gate.png` });

await page.setViewportSize({ width: 844, height: 390 });
await page.waitForFunction(() => document.documentElement.dataset.mobileOrientation === "landscape", null, { timeout: 10_000 });
await page.waitForFunction(() => window.Main?.maskRevealView && window.__MOBILE_LANDSCAPE__?.runtimeReady, null, { timeout: 60_000 });
await page.waitForFunction(() => getComputedStyle(document.querySelector(".enterButton")).pointerEvents === "auto", null, { timeout: 20_000 });
await page.waitForTimeout(250);
const landscapeBefore = await page.evaluate(() => ({
  orientation: document.documentElement.dataset.mobileOrientation,
  runtime: window.__MOBILE_LANDSCAPE__,
  entered: window.Main.maskRevealView.ENTERED,
  index: window.Main.maskRevealView.currPageIndex,
  canvasCount: document.querySelectorAll("canvas").length,
  canvas: [document.querySelector("canvas")?.width, document.querySelector("canvas")?.height],
  bodyBefore: getComputedStyle(document.body, "::before").content,
  arrows: [...document.querySelectorAll(".navArrow")].map((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return { display: style.display, opacity: Number(style.opacity), pointerEvents: style.pointerEvents, width: rect.width, height: rect.height };
  }),
}));
await page.screenshot({ path: `${output}/02-landscape-landing.png` });

const enter = page.locator(".enterButton");
if (await enter.count() && await enter.evaluate((element) => getComputedStyle(element).pointerEvents !== "none")) {
  await enter.click({ force: true });
  await page.waitForFunction(() => window.Main.maskRevealView.ENTERED === true, null, { timeout: 15_000 });
}
await page.waitForTimeout(450);
const entered = await page.evaluate(() => ({
  index: window.Main.maskRevealView.currPageIndex,
  entered: window.Main.maskRevealView.ENTERED,
  arrows: [...document.querySelectorAll(".navArrow")].map((element) => ({ opacity: Number(getComputedStyle(element).opacity), pointerEvents: getComputedStyle(element).pointerEvents })),
  hint: document.querySelector("#mobileGestureHint")?.className || "",
}));
await page.screenshot({ path: `${output}/03-landscape-entered.png` });

await page.locator(".navArrow:not(.left)").click({ force: true });
await page.waitForFunction(() => window.Main.maskRevealView.currPageIndex >= 2, null, { timeout: 10_000 });
await page.waitForTimeout(250);
const arrowPage = await page.evaluate(() => ({ index: window.Main.maskRevealView.currPageIndex, project03: getComputedStyle(document.querySelector("#project03Case001Root") || document.body).opacity }));
await page.screenshot({ path: `${output}/04-landscape-arrow-page-02.png` });

const canvas = page.locator("canvas");
const box = await canvas.boundingBox();
await page.mouse.move(box.x + box.width * .72, box.y + box.height * .5);
await page.mouse.down();
await page.mouse.move(box.x + box.width * .20, box.y + box.height * .5, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(1200);
const dragPage = await page.evaluate(() => ({ index: window.Main.maskRevealView.currPageIndex, timeline: window.Main.maskRevealView.flipTimeline.progress() }));
await page.screenshot({ path: `${output}/05-landscape-drag-page.png` });

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForFunction(() => document.documentElement.dataset.mobileOrientation === "portrait", null, { timeout: 10_000 });
await page.waitForTimeout(300);
const rotatedPortrait = await page.evaluate(() => ({
  orientation: document.documentElement.dataset.mobileOrientation,
  runtimeMode: window.__MOBILE_LANDSCAPE__?.mode,
  currentPage: window.__MOBILE_LANDSCAPE__?.currentPage,
  gateDisplay: getComputedStyle(document.querySelector("#mobileOrientationGate")).display,
}));
await page.screenshot({ path: `${output}/06-rotated-portrait.png` });

await page.setViewportSize({ width: 932, height: 430 });
await page.waitForFunction(() => document.documentElement.dataset.mobileOrientation === "landscape", null, { timeout: 10_000 });
await page.waitForTimeout(1000);
const rotatedLandscape = await page.evaluate(() => ({
  orientation: document.documentElement.dataset.mobileOrientation,
  runtimeMode: window.__MOBILE_LANDSCAPE__?.mode,
  currentPage: window.Main?.maskRevealView?.currPageIndex ?? null,
  runtimeCurrentPage: window.__MOBILE_LANDSCAPE__?.currentPage ?? null,
  canvasCount: document.querySelectorAll("canvas").length,
}));
await page.screenshot({ path: `${output}/07-rotated-landscape.png` });

const result = { url, portrait, landscapeBefore, entered, arrowPage, dragPage, rotatedPortrait, rotatedLandscape, errors };
await writeFile(`${output}/runtime-verification.json`, `${JSON.stringify(result, null, 2)}\n`);
await browser.close();
const failed = errors.length > 0 || portrait.orientation !== "portrait" || portrait.gateDisplay !== "flex" || portrait.runtimeStarted || landscapeBefore.orientation !== "landscape" || landscapeBefore.bodyBefore !== "none" || landscapeBefore.canvasCount !== 1 || landscapeBefore.arrows.some((arrow) => arrow.width < 44 || arrow.height < 44) || entered.index !== 1 || arrowPage.index !== 2 || dragPage.index < 2 || rotatedPortrait.orientation !== "portrait" || rotatedLandscape.orientation !== "landscape" || rotatedLandscape.canvasCount !== 1;
if (failed) {
  console.error(JSON.stringify(result, null, 2));
  process.exitCode = 1;
} else {
  console.log(`verified mobile landscape runtime at ${url}`);
}
