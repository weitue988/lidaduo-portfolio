import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "/Users/lidaduo/.cursor/skills/pixel-diff/tools/node_modules/playwright-core/index.mjs";

const url = process.argv[2] || "http://127.0.0.1:4194/?mobilePreview=1&autoOpen=off";
const output = resolve(process.argv[3] || "../qa/mobile-landscape-20260820/wechat-orientation");
const chrome = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 MicroMessenger/8.0.61 NetType/WIFI Language/zh_CN";

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const errors = [];

function observeErrors(page, label) {
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${label} console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`${label} page: ${error.message}`));
  page.on("requestfailed", (request) => {
    errors.push(`${label} request: ${request.url()} ${request.failure()?.errorText || "failed"}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${label} http ${response.status()}: ${response.url()}`);
  });
}

async function createWechatPage({ suppressOrientationEvents = false } = {}) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent,
  });
  if (suppressOrientationEvents) {
    await page.addInitScript(() => {
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function addEventListenerWithoutOrientationSignals(type, listener, options) {
        const blockedTarget = this === window || this === window.visualViewport || this === window.screen?.orientation;
        if (blockedTarget && ["resize", "orientationchange", "change"].includes(type)) return;
        return originalAddEventListener.call(this, type, listener, options);
      };
    });
  }
  return page;
}

const pollingPage = await createWechatPage({ suppressOrientationEvents: true });
observeErrors(pollingPage, "polling");
await pollingPage.goto(url, { waitUntil: "load", timeout: 60_000 });
await pollingPage.waitForFunction(() => document.documentElement.dataset.mobileOrientation === "portrait");
await pollingPage.setViewportSize({ width: 844, height: 390 });
await pollingPage.waitForFunction(() => document.documentElement.dataset.mobileOrientation === "landscape", null, { timeout: 5_000 });
await pollingPage.waitForFunction(() => window.Main?.maskRevealView && window.__MOBILE_LANDSCAPE__?.runtimeReady, null, { timeout: 60_000 });
const polling = await pollingPage.evaluate(() => ({
  orientation: document.documentElement.dataset.mobileOrientation,
  runtimeStarted: window.__MOBILE_LANDSCAPE__?.runtimeStarted,
  runtimeReady: window.__MOBILE_LANDSCAPE__?.runtimeReady,
  forced: window.__MOBILE_LANDSCAPE__?.orientation?.forced,
  canvasCount: document.querySelectorAll("canvas").length,
}));
await pollingPage.screenshot({ path: `${output}/01-polling-landscape.png` });
await pollingPage.close();

const fallbackPage = await createWechatPage();
observeErrors(fallbackPage, "fallback");
await fallbackPage.goto(url, { waitUntil: "load", timeout: 60_000 });
const continueButton = fallbackPage.locator(".mobile-orientation-continue");
await fallbackPage.waitForFunction(() => document.querySelector(".mobile-orientation-continue")?.classList.contains("is-visible"), null, { timeout: 6_000 });
await continueButton.evaluate((element) => element.click());
await fallbackPage.waitForFunction(() => document.documentElement.dataset.mobileOrientation === "landscape" && window.__MOBILE_LANDSCAPE__?.orientation?.forced === true, null, { timeout: 5_000 });
await fallbackPage.waitForFunction(() => window.Main?.maskRevealView && window.__MOBILE_LANDSCAPE__?.runtimeReady, null, { timeout: 60_000 });
const fallback = await fallbackPage.evaluate(() => ({
  orientation: document.documentElement.dataset.mobileOrientation,
  runtimeStarted: window.__MOBILE_LANDSCAPE__?.runtimeStarted,
  runtimeReady: window.__MOBILE_LANDSCAPE__?.runtimeReady,
  forced: window.__MOBILE_LANDSCAPE__?.orientation?.forced,
  canvasCount: document.querySelectorAll("canvas").length,
}));
await fallbackPage.screenshot({ path: `${output}/02-manual-fallback.png` });
await fallbackPage.close();

const result = { url, userAgent, polling, fallback, errors };
await writeFile(`${output}/runtime-verification.json`, `${JSON.stringify(result, null, 2)}\n`);
await browser.close();

const failed = errors.length > 0 ||
  polling.orientation !== "landscape" || !polling.runtimeStarted || !polling.runtimeReady || polling.forced || polling.canvasCount !== 1 ||
  fallback.orientation !== "landscape" || !fallback.runtimeStarted || !fallback.runtimeReady || !fallback.forced || fallback.canvasCount !== 1;
if (failed) {
  console.error(JSON.stringify(result, null, 2));
  process.exitCode = 1;
} else {
  console.log(`verified WeChat orientation polling and fallback at ${url}`);
}
