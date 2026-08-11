import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "/Users/lidaduo/.cursor/skills/pixel-diff/tools/node_modules/playwright-core/index.mjs";

const url = process.argv[2] || "http://127.0.0.1:4192/?skipIntro=1";
const output = resolve(
  process.argv[3] || "../qa/project03-adjacent-page-bleed-fix-20260811/full-regression",
);
const chrome =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

await mkdir(output, { recursive: true });

const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
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
  if (response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`);
});

await page.goto(url, { waitUntil: "load", timeout: 60_000 });
await page.waitForFunction(
  () => document.body.classList.contains("loaded") && window.Main?.maskRevealView,
  null,
  { timeout: 60_000 },
);

if (!await page.evaluate(() => window.Main.maskRevealView.ENTERED)) {
  await page.locator(".enterButton").click();
  await page.waitForFunction(() => window.Main.maskRevealView.ENTERED === true, null, {
    timeout: 15_000,
  });
}

const pageStates = [];
for (let index = 1; index <= 11; index += 1) {
  await page.evaluate((target) => window.Main.maskRevealView.setCurrentPage(target), index);
  await page.waitForFunction(
    (target) =>
      window.Main.maskRevealView.currPageIndex === target &&
      Math.abs(
        window.Main.maskRevealView.flipTimeline.progress() -
        target / (window.Main.maskRevealView.pageDatas.length + 1),
      ) < 0.001,
    index,
    { timeout: 10_000 },
  );
  await page.waitForTimeout(180);
  await page.screenshot({
    path: `${output}/${String(index).padStart(2, "0")}-spread.png`,
  });
  pageStates.push(await page.evaluate(() => {
    const root = document.querySelector("#project03Case001Root");
    const style = root ? getComputedStyle(root) : null;
    return {
      index: window.Main.maskRevealView.currPageIndex,
      timelineProgress: window.Main.maskRevealView.flipTimeline.progress(),
      project03Display: style?.display || null,
      project03Opacity: style?.opacity || null,
      project03PointerEvents: style?.pointerEvents || null,
    };
  }));
}

await page.evaluate(() => window.Main.maskRevealView.setCurrentPage(12));
await page.waitForFunction(
  () =>
    window.Main.maskRevealView.currPageIndex === 12 &&
    Math.abs(window.Main.maskRevealView.flipTimeline.progress() - 1) < 0.001,
  null,
  { timeout: 10_000 },
);
await page.waitForTimeout(180);
await page.screenshot({ path: `${output}/12-final-resources.png` });

const finalState = await page.evaluate(() => ({
  currentPageIndex: window.Main.maskRevealView.currPageIndex,
  pageDataCount: window.Main.maskRevealView.pageDatas.length,
  pageMeshCount: window.Main.maskRevealView.pages.length,
  canvasCount: document.querySelectorAll("canvas").length,
  resourcesVisible: getComputedStyle(document.querySelector(".extraResources")).visibility,
  resourcesPointerEvents: getComputedStyle(document.querySelector(".extraResources")).pointerEvents,
  adapterMarker: [...document.scripts]
    .map((script) => script.src)
    .find((src) => src.includes("project-03-case001-holographic-adapter.js")) || null,
}));

const result = { url, pageStates, finalState, errors };
await writeFile(`${output}/runtime-verification.json`, `${JSON.stringify(result, null, 2)}\n`);
await browser.close();

const hiddenOnAdjacentPages = [5, 7].every((index) => {
  const state = pageStates.find((candidate) => candidate.index === index);
  return Number(state?.project03Opacity) === 0 && state?.project03PointerEvents === "none";
});
const stableOnProject03 = (() => {
  const state = pageStates.find((candidate) => candidate.index === 6);
  return state?.project03Display !== "none" && Number(state?.project03Opacity) === 1;
})();
const failed =
  pageStates.length !== 11 ||
  pageStates.some((state, offset) => state.index !== offset + 1) ||
  !hiddenOnAdjacentPages ||
  !stableOnProject03 ||
  finalState.currentPageIndex !== 12 ||
  finalState.pageDataCount !== 11 ||
  finalState.pageMeshCount !== 11 ||
  finalState.canvasCount !== 1 ||
  finalState.resourcesVisible !== "visible" ||
  finalState.resourcesPointerEvents !== "all" ||
  !finalState.adapterMarker?.includes("8c392359351c") ||
  errors.length > 0;

if (failed) {
  process.stderr.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`verified full 11-spread portfolio at ${url}\n`);
}
