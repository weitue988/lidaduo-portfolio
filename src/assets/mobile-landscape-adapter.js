(function initMobileLandscapeAdapter() {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const mobileByUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const mobileByInput = navigator.maxTouchPoints > 0 &&
    window.matchMedia("(pointer: coarse)").matches &&
    Math.min(screen.width || innerWidth, screen.height || innerHeight) <= 1024;
  const mobile = params.get("mobilePreview") === "1" || mobileByUserAgent || mobileByInput;
  if (!mobile) return;

  const state = (window.__MOBILE_LANDSCAPE__ = {
    mobile: true,
    mode: "initializing",
    nativeLoaded: false,
    runtimeStarted: false,
    runtimeReady: false,
    fallback: false,
    currentPage: 0,
    rendererPixelRatio: null,
  });

  const originalWindowLoad = window.onload;
  let fallbackTimer = 0;
  let readinessTimer = 0;
  let updateTimer = 0;
  let orientationPollTimer = 0;
  let gateFallbackTimer = 0;
  let disposed = false;
  let forceLandscape = false;
  let gate = null;
  let fallback = null;
  let gestureHint = null;

  const pageSlides = [
    ["images_webp/01/front-directory.webp", "目录"],
    ["images_webp/02/front-profile.webp", "个人简介"],
    ["images_webp/03/front-capability.webp", "能力价值"],
    ["images_webp/04/project-01.webp", "iPublish × AI 审校"],
    ["images_webp/05/project-02.webp", "AI 设计驱动"],
    ["images_webp/06/project-03.webp", "升级日志"],
    ["images_webp/07/project-04.webp", "小 U 智能语言训练舱"],
    ["images_webp/08/project-05.webp", "U 校园 AI 体验优化"],
    ["images_webp/09/project-06.webp", "IntuitionX"],
    ["images_webp/010/project-07.webp", "体系与团队"],
    ["images_webp/011/project-08.webp", "联系 · Let's Talk"],
  ];

  function installStyles() {
    const style = document.createElement("style");
    style.id = "mobileLandscapeStyles";
    style.textContent = `
      :root {
        --mobile-visual-height: 100dvh;
        --mobile-safe-top: max(10px, env(safe-area-inset-top));
        --mobile-safe-right: max(12px, env(safe-area-inset-right));
        --mobile-safe-bottom: max(10px, env(safe-area-inset-bottom));
        --mobile-safe-left: max(12px, env(safe-area-inset-left));
      }
      #mobileOrientationGate,
      #mobileRuntimeFallback {
        font-family: "AlibabaPuHuiTi", "Alibaba PuHuiTi", system-ui, -apple-system, sans-serif;
      }
      #mobileOrientationGate {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: none;
        align-items: center;
        justify-content: center;
        padding: max(28px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right))
          max(28px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
        color: #f7f7f5;
        background:
          radial-gradient(circle at 50% 42%, rgba(132, 147, 115, .24), transparent 34%),
          radial-gradient(circle at 50% 115%, rgba(121, 87, 147, .18), transparent 42%),
          #0b0a10;
        text-align: center;
        opacity: 0;
        transition: opacity .28s ease;
      }
      html[data-mobile-orientation="portrait"] #mobileOrientationGate {
        display: flex;
        opacity: 1;
      }
      .mobile-orientation-content { width: min(100%, 340px); }
      .mobile-orientation-mark {
        position: relative;
        width: 108px;
        height: 74px;
        margin: 0 auto 28px;
      }
      .mobile-orientation-phone {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 74px;
        height: 42px;
        border: 2px solid rgba(255, 255, 255, .82);
        border-radius: 12px;
        transform: translate(-50%, -50%) rotate(-8deg);
        box-shadow: 0 16px 40px rgba(0, 0, 0, .42), inset 0 0 0 1px rgba(255, 255, 255, .08);
      }
      .mobile-orientation-phone::before {
        content: "";
        position: absolute;
        left: 7px;
        right: 7px;
        top: 7px;
        bottom: 7px;
        border-radius: 5px;
        background: linear-gradient(135deg, rgba(218, 232, 186, .30), rgba(131, 102, 161, .24));
      }
      .mobile-orientation-phone::after {
        content: "";
        position: absolute;
        right: 3px;
        top: 50%;
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: rgba(255, 255, 255, .76);
        transform: translateY(-50%);
      }
      .mobile-orientation-arrow {
        position: absolute;
        inset: 0;
        border: 1px solid transparent;
        border-top-color: rgba(223, 235, 194, .85);
        border-right-color: rgba(223, 235, 194, .85);
        border-radius: 50%;
        transform: rotate(34deg);
      }
      .mobile-orientation-arrow::after {
        content: "";
        position: absolute;
        right: 5px;
        top: 5px;
        width: 8px;
        height: 8px;
        border-top: 1px solid rgba(223, 235, 194, .85);
        border-right: 1px solid rgba(223, 235, 194, .85);
        transform: rotate(20deg);
      }
      .mobile-orientation-eyebrow {
        margin: 0 0 10px;
        color: rgba(223, 235, 194, .72);
        font-size: 11px;
        letter-spacing: .18em;
        text-transform: uppercase;
      }
      .mobile-orientation-title {
        margin: 0;
        color: #fff;
        font-size: clamp(23px, 7vw, 30px);
        font-weight: 500;
        line-height: 1.25;
        letter-spacing: .01em;
      }
      .mobile-orientation-copy {
        margin: 12px auto 0;
        max-width: 290px;
        color: rgba(255, 255, 255, .58);
        font-size: 14px;
        line-height: 1.7;
      }
      .mobile-orientation-footnote {
        margin-top: 30px;
        color: rgba(255, 255, 255, .32);
        font-size: 11px;
        letter-spacing: .04em;
      }
      .mobile-orientation-continue {
        display: block;
        min-width: 164px;
        min-height: 44px;
        margin: 18px auto 0;
        padding: 0 18px;
        border: 1px solid rgba(223, 235, 194, .28);
        border-radius: 999px;
        color: rgba(245, 247, 240, .86);
        background: rgba(255, 255, 255, .06);
        font: 13px/1 "AlibabaPuHuiTi", "Alibaba PuHuiTi", system-ui, sans-serif;
        letter-spacing: .02em;
        opacity: 0;
        pointer-events: none;
        transform: translateY(6px);
        transition: opacity .25s ease, transform .25s ease, background .2s ease;
        -webkit-tap-highlight-color: transparent;
      }
      .mobile-orientation-continue.is-visible {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
      }
      .mobile-orientation-continue:active { background: rgba(255, 255, 255, .12); }
      html[data-mobile-orientation="portrait"],
      html[data-mobile-orientation="portrait"] body {
        width: 100%;
        height: var(--mobile-visual-height);
        overflow: hidden !important;
        background: #0b0a10 !important;
        overscroll-behavior: none;
      }
      html[data-mobile-orientation="portrait"] #canvasContainer,
      html[data-mobile-orientation="portrait"] body > .logo,
      html[data-mobile-orientation="portrait"] body > .helloMondayLink,
      html[data-mobile-orientation="portrait"] body > .rightLinks {
        visibility: hidden !important;
        pointer-events: none !important;
      }
      html[data-mobile-orientation="landscape"],
      html[data-mobile-orientation="landscape"] body {
        position: fixed !important;
        inset: 0 !important;
        width: 100% !important;
        height: var(--mobile-visual-height) !important;
        min-height: 0 !important;
        overflow: hidden !important;
        overscroll-behavior: none;
        background: #000 !important;
      }
      html[data-mobile-orientation="landscape"] body::before,
      html[data-mobile-orientation="landscape"] body::after {
        content: none !important;
        display: none !important;
      }
      html[data-mobile-orientation="landscape"] #canvasContainer {
        position: fixed !important;
        inset: 0 !important;
        width: 100% !important;
        height: var(--mobile-visual-height) !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }
      html[data-mobile-orientation="landscape"] #canvasContainer > canvas {
        width: 100% !important;
        height: 100% !important;
      }
      html[data-mobile-orientation="landscape"] .draggable {
        height: 100% !important;
        touch-action: none !important;
        overscroll-behavior: none;
      }
      html[data-mobile-orientation="landscape"] .pretext {
        position: absolute !important;
        inset: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: 100% !important;
        padding: 0 !important;
        justify-content: flex-end !important;
        pointer-events: none !important;
      }
      html[data-mobile-orientation="landscape"] .pretext > .wrapper,
      html[data-mobile-orientation="landscape"] body.loaded .pretext > .wrapper {
        position: absolute !important;
        left: 50% !important;
        bottom: var(--mobile-safe-bottom) !important;
        width: auto !important;
        min-width: 150px;
        transform: translateX(-50%) !important;
        opacity: 1;
      }
      html[data-mobile-orientation="landscape"] .pretext.hide > .wrapper {
        opacity: 0 !important;
        transform: translateX(-50%) translateY(12px) !important;
      }
      html[data-mobile-orientation="landscape"] .pretext .text {
        position: static !important;
        transform: none !important;
        margin: 0 !important;
        padding: 0 !important;
        font-size: 11px !important;
      }
      html[data-mobile-orientation="landscape"] .pretext .text > p:not(.loading) {
        display: none !important;
      }
      html[data-mobile-orientation="landscape"] .pretext .text .loading {
        margin-top: 8px !important;
        font-size: 11px !important;
      }
      html[data-mobile-orientation="landscape"] .pretext .enterButton {
        position: relative !important;
        top: auto !important;
        width: 148px !important;
        min-height: 44px !important;
        -webkit-tap-highlight-color: transparent;
      }
      html[data-mobile-orientation="landscape"] .logo {
        top: var(--mobile-safe-top) !important;
        left: 50% !important;
        transform: translateX(-50%) scale(.76);
        transform-origin: top center;
      }
      html[data-mobile-orientation="landscape"] .helloMondayLink,
      html[data-mobile-orientation="landscape"] .rightLinks,
      html[data-mobile-orientation="landscape"] .captions {
        display: none !important;
      }
      html[data-mobile-orientation="landscape"] .navArrow {
        position: fixed !important;
        visibility: visible !important;
        display: flex !important;
        top: 0 !important;
        bottom: 0 !important;
        width: 72px !important;
        min-width: 44px !important;
        height: var(--mobile-visual-height) !important;
        padding: 0 !important;
        z-index: 2147483000 !important;
        align-items: center !important;
        justify-content: center !important;
        touch-action: manipulation;
      }
      html[data-mobile-orientation="landscape"] .navArrow.left {
        left: 0 !important;
        padding-left: var(--mobile-safe-left) !important;
      }
      html[data-mobile-orientation="landscape"] .navArrow:not(.left) {
        right: 0 !important;
        padding-right: var(--mobile-safe-right) !important;
      }
      html[data-mobile-orientation="landscape"] body.loaded .navArrow {
        pointer-events: auto !important;
      }
      html[data-mobile-orientation="landscape"] .navArrow::before {
        display: block !important;
        width: 34px !important;
        height: 14px !important;
        opacity: .88;
      }
      html[data-mobile-orientation="landscape"] .navArrow:hover::before,
      html[data-mobile-orientation="landscape"] .navArrow:hover.left::before {
        transform: none;
      }
      html[data-mobile-orientation="landscape"] .navArrow:not(.left)::before {
        transform: scaleX(-1) !important;
      }
      html[data-mobile-orientation="landscape"] .extraResources {
        top: 0 !important;
        right: var(--mobile-safe-right) !important;
        width: min(48vw, 420px) !important;
        min-width: 0 !important;
        height: var(--mobile-visual-height) !important;
        padding: var(--mobile-safe-top) 12px var(--mobile-safe-bottom) 28px !important;
      }
      html[data-mobile-orientation="landscape"] .extraResources p,
      html[data-mobile-orientation="landscape"] .extraResources span {
        font-size: 11px !important;
        line-height: 1.35 !important;
      }
      html[data-mobile-orientation="landscape"] .extraResources li {
        padding-bottom: 9px !important;
      }
      #mobileGestureHint {
        position: fixed;
        left: 50%;
        bottom: var(--mobile-safe-bottom);
        z-index: 1000002;
        display: none;
        padding: 7px 12px;
        border: 1px solid rgba(255, 255, 255, .12);
        border-radius: 999px;
        color: rgba(255, 255, 255, .72);
        background: rgba(8, 8, 10, .56);
        backdrop-filter: blur(10px);
        font-size: 11px;
        letter-spacing: .02em;
        pointer-events: none;
        transform: translateX(-50%);
        opacity: 0;
        transition: opacity .35s ease;
      }
      html[data-mobile-orientation="landscape"] #mobileGestureHint.is-visible {
        display: block;
        opacity: 1;
      }
      #mobileRuntimeFallback {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        display: none;
        overflow: hidden;
        color: #fff;
        background: #08080b;
      }
      #mobileRuntimeFallback.is-visible { display: block; }
      .mobile-fallback-stage { position: absolute; inset: 0; display: grid; place-items: center; }
      .mobile-fallback-image {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: var(--mobile-safe-top) 62px var(--mobile-safe-bottom);
      }
      .mobile-fallback-header {
        position: absolute;
        top: var(--mobile-safe-top);
        left: 50%;
        z-index: 2;
        max-width: 60vw;
        color: rgba(255, 255, 255, .76);
        font-size: 12px;
        text-align: center;
        transform: translateX(-50%);
      }
      .mobile-fallback-status {
        position: absolute;
        left: 50%;
        bottom: var(--mobile-safe-bottom);
        z-index: 2;
        padding: 6px 10px;
        border-radius: 999px;
        color: rgba(255, 255, 255, .68);
        background: rgba(0, 0, 0, .55);
        font-size: 11px;
        transform: translateX(-50%);
      }
      .mobile-fallback-nav {
        position: absolute;
        top: 0;
        bottom: 0;
        z-index: 3;
        width: 60px;
        border: 0;
        color: #fff;
        background: transparent;
        font-size: 28px;
        opacity: .72;
        -webkit-tap-highlight-color: transparent;
      }
      .mobile-fallback-nav:disabled { opacity: .18; }
      .mobile-fallback-nav.prev { left: 0; padding-left: var(--mobile-safe-left); }
      .mobile-fallback-nav.next { right: 0; padding-right: var(--mobile-safe-right); }
      @media (prefers-reduced-motion: reduce) {
        #mobileOrientationGate, #mobileGestureHint { transition: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function createGate() {
    gate = document.createElement("section");
    gate.id = "mobileOrientationGate";
    gate.setAttribute("role", "status");
    gate.setAttribute("aria-live", "polite");
    gate.innerHTML = `
      <div class="mobile-orientation-content">
        <div class="mobile-orientation-mark" aria-hidden="true">
          <span class="mobile-orientation-arrow"></span>
          <span class="mobile-orientation-phone"></span>
        </div>
        <p class="mobile-orientation-eyebrow">LIXIANG · SELECTED WORK</p>
        <h1 class="mobile-orientation-title">请将手机横屏观看</h1>
        <p class="mobile-orientation-copy">横屏后将自动进入完整 3D 作品集，可左右滑动或点击箭头翻页。</p>
        <p class="mobile-orientation-footnote">建议使用 Safari 或 Chrome 浏览器</p>
        <button class="mobile-orientation-continue" type="button">已横屏，继续进入</button>
      </div>
    `;
    document.body.appendChild(gate);

    const continueButton = gate.querySelector(".mobile-orientation-continue");
    continueButton.addEventListener("click", () => {
      forceLandscape = true;
      updateMode(true);
    });
    gateFallbackTimer = window.setTimeout(() => {
      if (!isPortrait()) return;
      continueButton.classList.add("is-visible");
    }, 3200);

    gestureHint = document.createElement("div");
    gestureHint.id = "mobileGestureHint";
    gestureHint.textContent = "左右滑动，或点击两侧箭头翻页";
    document.body.appendChild(gestureHint);
  }

  function setVisualHeight() {
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--mobile-visual-height", `${Math.round(height)}px`);
  }

  function getOrientationSnapshot() {
    const viewport = window.visualViewport;
    const width = viewport ? viewport.width : window.innerWidth;
    const height = viewport ? viewport.height : window.innerHeight;
    const screenOrientationType = screen.orientation && screen.orientation.type || "";
    const legacyAngle = Number(window.orientation);
    const mediaLandscape = window.matchMedia("(orientation: landscape)").matches;
    const landscape = forceLandscape ||
      width > height ||
      window.innerWidth > window.innerHeight ||
      /^landscape/.test(screenOrientationType) ||
      Math.abs(legacyAngle) === 90 ||
      mediaLandscape;
    return {
      landscape,
      width,
      height,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      screenOrientationType,
      legacyAngle: Number.isFinite(legacyAngle) ? legacyAngle : null,
      mediaLandscape,
      forced: forceLandscape,
    };
  }

  function isPortrait() {
    return !getOrientationSnapshot().landscape;
  }

  function supportsWebGL() {
    if (params.get("mobileFallback") === "1") return false;
    try {
      const canvas = document.createElement("canvas");
      return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      return false;
    }
  }

  function enforceMobileRenderer(view) {
    if (!view || !view.renderer || isPortrait()) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    view.renderer.setPixelRatio(ratio);
    view.renderer.setSize(view.dim.x, view.dim.y, false);
    state.rendererPixelRatio = ratio;
    const canvas = view.renderer.domElement;
    if (canvas) canvas.setAttribute("aria-label", "3D interactive portfolio book");
  }

  function showGestureHint() {
    if (!gestureHint || isPortrait()) return;
    gestureHint.classList.add("is-visible");
    window.setTimeout(() => gestureHint && gestureHint.classList.remove("is-visible"), 4200);
  }

  function watchRuntime() {
    clearTimeout(readinessTimer);
    const view = window.Main && window.Main.maskRevealView;
    if (!view) {
      readinessTimer = window.setTimeout(watchRuntime, 50);
      return;
    }

    const modelsReady = view.modelsLoaded === 2 && view.texturesLoaded &&
      Array.isArray(view.pages) && view.pages.length > 0 &&
      view.lastPageBookMoveTween && view.flipTimeline;
    if (!modelsReady) {
      readinessTimer = window.setTimeout(watchRuntime, 50);
      return;
    }

    state.runtimeReady = true;
    state.mode = "landscape-ready";
    document.documentElement.dataset.mobileRuntime = "ready";
    clearTimeout(fallbackTimer);
    if (typeof view.resize === "function") view.resize();
    enforceMobileRenderer(view);

    const canvas = view.renderer && view.renderer.domElement;
    if (canvas && !canvas.__mobileContextGuard) {
      canvas.__mobileContextGuard = true;
      canvas.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        showFallback("3D 模式暂不可用，已切换为作品阅读模式");
      });
    }

    const originalEnter = view.enterBook;
    if (typeof originalEnter === "function" && !view.__mobileEnterWrapped) {
      view.__mobileEnterWrapped = true;
      view.enterBook = function mobileEnterWrapper(event) {
        const result = originalEnter.call(this, event);
        window.setTimeout(showGestureHint, 6500);
        return result;
      };
    }

    window.setTimeout(() => {
      enforceMobileRenderer(view);
      if (view.ENTERED) showGestureHint();
    }, 80);
  }

  function bootRuntime(loadEvent) {
    if (state.runtimeStarted || state.fallback || !state.nativeLoaded || isPortrait()) return;
    if (!supportsWebGL()) {
      showFallback("当前浏览器未能启动 3D 模式，已切换为作品阅读模式");
      return;
    }

    state.runtimeStarted = true;
    state.mode = "landscape-loading";
    document.documentElement.dataset.mobileRuntime = "loading";
    try {
      if (typeof originalWindowLoad === "function") originalWindowLoad.call(window, loadEvent || new Event("load"));
      watchRuntime();
      fallbackTimer = window.setTimeout(() => {
        if (!state.runtimeReady) showFallback("3D 内容加载时间较长，已切换为作品阅读模式");
      }, 45000);
    } catch (error) {
      console.error("mobile landscape runtime boot failed", error);
      showFallback("3D 模式启动失败，已切换为作品阅读模式");
    }
  }

  function pauseRuntimeForPortrait() {
    const view = window.Main && window.Main.maskRevealView;
    if (!view) return;
    state.currentPage = view.currPageIndex || 0;
    if (typeof view.isActive === "function") view.isActive(false);
    if (view.draggable && typeof view.draggable.disable === "function") view.draggable.disable();
  }

  function resumeRuntimeForLandscape() {
    const view = window.Main && window.Main.maskRevealView;
    if (!view) return;
    if (typeof view.resize === "function") view.resize();
    enforceMobileRenderer(view);
    if (typeof view.isActive === "function") view.isActive(true);
    if (view.ENTERED && view.draggable && typeof view.draggable.enable === "function") view.draggable.enable();
  }

  function createFallback() {
    fallback = document.createElement("section");
    fallback.id = "mobileRuntimeFallback";
    fallback.setAttribute("aria-label", "Portfolio reading mode");
    fallback.innerHTML = `
      <p class="mobile-fallback-header"></p>
      <div class="mobile-fallback-stage"><img class="mobile-fallback-image" alt=""></div>
      <button class="mobile-fallback-nav prev" type="button" aria-label="上一页">‹</button>
      <button class="mobile-fallback-nav next" type="button" aria-label="下一页">›</button>
      <p class="mobile-fallback-status"></p>
    `;
    document.body.appendChild(fallback);
    let index = 0;
    let touchStartX = 0;
    const image = fallback.querySelector(".mobile-fallback-image");
    const header = fallback.querySelector(".mobile-fallback-header");
    const status = fallback.querySelector(".mobile-fallback-status");
    const previous = fallback.querySelector(".prev");
    const next = fallback.querySelector(".next");

    function render() {
      const [source, title] = pageSlides[index];
      image.src = source;
      image.alt = `${title}，第 ${index + 1} 页`;
      header.textContent = title;
      status.textContent = `${index + 1} / ${pageSlides.length} · 左右滑动浏览`;
      previous.disabled = index === 0;
      next.disabled = index === pageSlides.length - 1;
      state.currentPage = index + 1;
    }

    previous.addEventListener("click", () => { index = Math.max(0, index - 1); render(); });
    next.addEventListener("click", () => { index = Math.min(pageSlides.length - 1, index + 1); render(); });
    fallback.addEventListener("touchstart", (event) => {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    fallback.addEventListener("touchend", (event) => {
      const delta = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) < 42) return;
      index = delta < 0 ? Math.min(pageSlides.length - 1, index + 1) : Math.max(0, index - 1);
      render();
    }, { passive: true });
    render();
  }

  function showFallback(reason) {
    if (state.fallback) return;
    state.fallback = true;
    state.mode = "fallback";
    clearTimeout(fallbackTimer);
    clearTimeout(readinessTimer);
    pauseRuntimeForPortrait();
    if (!fallback) createFallback();
    fallback.dataset.reason = reason;
    fallback.classList.add("is-visible");
    document.documentElement.dataset.mobileRuntime = "fallback";
  }

  function updateMode(immediate = false) {
    if (disposed) return;
    clearTimeout(updateTimer);
    const applyMode = () => {
      setVisualHeight();
      const portrait = isPortrait();
      state.orientation = getOrientationSnapshot();
      state.mode = portrait ? "portrait-gate" : (state.fallback ? "fallback" : "landscape");
      document.documentElement.dataset.mobileOrientation = portrait ? "portrait" : "landscape";
      const continueButton = gate && gate.querySelector(".mobile-orientation-continue");
      if (!portrait) {
        clearTimeout(gateFallbackTimer);
        if (continueButton) continueButton.classList.remove("is-visible");
      }
      if (fallback) fallback.classList.toggle("is-visible", !portrait && state.fallback);
      if (portrait) {
        pauseRuntimeForPortrait();
      } else if (!state.runtimeStarted && !state.fallback) {
        bootRuntime(new Event("load"));
      } else {
        resumeRuntimeForLandscape();
      }
    };
    if (immediate) applyMode();
    else updateTimer = window.setTimeout(applyMode, 80);
  }

  function pollOrientation() {
    if (disposed) return;
    const next = getOrientationSnapshot();
    const previous = state.orientation;
    if (!previous || next.landscape !== previous.landscape ||
      next.width !== previous.width || next.height !== previous.height ||
      next.legacyAngle !== previous.legacyAngle ||
      next.screenOrientationType !== previous.screenOrientationType) {
      updateMode(true);
    }
    orientationPollTimer = window.setTimeout(pollOrientation, 250);
  }

  installStyles();
  createGate();
  setVisualHeight();
  document.documentElement.dataset.mobileOrientation = isPortrait() ? "portrait" : "landscape";

  window.onload = function mobileDeferredWindowLoad(event) {
    state.nativeLoaded = true;
    if (isPortrait()) {
      state.mode = "portrait-gate";
      return;
    }
    bootRuntime(event);
  };

  window.addEventListener("resize", updateMode, { passive: true });
  window.addEventListener("orientationchange", updateMode, { passive: true });
  window.addEventListener("pageshow", updateMode, { passive: true });
  document.addEventListener("visibilitychange", updateMode, { passive: true });
  if (screen.orientation && typeof screen.orientation.addEventListener === "function") {
    screen.orientation.addEventListener("change", updateMode, { passive: true });
  }
  if (window.visualViewport) window.visualViewport.addEventListener("resize", updateMode, { passive: true });
  state.orientation = getOrientationSnapshot();
  orientationPollTimer = window.setTimeout(pollOrientation, 250);

  if (document.readyState === "complete") window.setTimeout(() => window.onload(new Event("load")), 0);

  window.addEventListener("pagehide", () => {
    disposed = true;
    clearTimeout(fallbackTimer);
    clearTimeout(readinessTimer);
    clearTimeout(updateTimer);
    clearTimeout(orientationPollTimer);
    clearTimeout(gateFallbackTimer);
    window.removeEventListener("resize", updateMode);
    window.removeEventListener("orientationchange", updateMode);
    window.removeEventListener("pageshow", updateMode);
    document.removeEventListener("visibilitychange", updateMode);
    if (screen.orientation && typeof screen.orientation.removeEventListener === "function") {
      screen.orientation.removeEventListener("change", updateMode);
    }
    if (window.visualViewport) window.visualViewport.removeEventListener("resize", updateMode);
  }, { once: true });
})();
