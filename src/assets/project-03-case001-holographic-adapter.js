(function initProject03Case001HolographicCard() {
  "use strict";

  const PAGE_INDEX = 6;
  const TARGET_PROGRESS = 0.5;
  const PROGRESS_EPSILON = 0.003;
  const TRANSITION_TEXTURE_URL = "images/06/project-03-transition.png";
  const params = new URLSearchParams(window.location.search);
  if (params.get("project03Case001") === "off") return;

  const motion = {
    pointerNormalizeBase: 150,
    pointerClamp: 1.25,
    smoothing: 0.16,
    tiltMaxX: 18,
    tiltMaxY: 18,
    tiltBase: 14,
    shineCenterBase: 50,
    shineCenterRange: 30,
    shineCenterClampMin: 8,
    shineCenterClampMax: 92,
    foilAngleBase: 70,
    foilAngleRange: 80,
    foilOpacityMin: 0.78,
    foilOpacityMax: 0.96,
    foilSaturationMin: 1.48,
    foilSaturationMax: 2.3,
    grainOpacityMin: 0.3,
    grainOpacityMax: 0.5,
    rimLightMin: 0.12,
    rimLightMax: 0.36,
    liveSpinMultiplier: 0.82,
    spinDistanceThreshold: 150,
    snapDuration: 620,
    snapWobbleMin: 8,
    snapWobbleMax: 10,
    tiltSettleDuration: 820,
    tiltSettleDecay: 4.8,
    tiltSettleOscillation: 5.2,
    panelParallaxDepth: 7,
    avatarParallaxDepth: 19,
    textParallaxDepth: 10,
  };

  const style = document.createElement("style");
  style.id = "project03-case001-holographic-style";
  style.textContent = `
    #project03Case001Root {
      --p03-scale: 1;
      --p03-page-x: 0px;
      --p03-page-y: 0px;
      --p03-page-rotate: 0deg;
      --p03-page-scale-x: 1;
      --p03-page-opacity: 1;
      position: fixed;
      left: 50%;
      top: 50%;
      width: 460px;
      height: 500px;
      /* The original full-page drag surface is z-index 1006; the card must receive pointer input only in its own bounds. */
      z-index: 1010;
      perspective: 1100px;
      transform: translate(-50%, -50%) scale(var(--p03-scale));
      transform-origin: center;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 140ms ease;
      contain: layout style;
    }

    #project03Case001Root.is-visible {
      opacity: 1;
      visibility: visible;
    }

    #project03Case001Root .p03-showcase {
      transform: translate3d(var(--p03-page-x), var(--p03-page-y), 0)
        rotateY(var(--p03-page-rotate))
        scaleX(var(--p03-page-scale-x));
      transform-origin: 0% 50%;
      opacity: var(--p03-page-opacity);
      will-change: transform, opacity;
    }

    #project03Case001Root.is-flipping .p03-showcase {
      pointer-events: none;
    }

    #project03Case001Root.is-interactive {
      pointer-events: none;
    }

    #project03Case001Root .p03-showcase {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 18px;
      box-sizing: border-box;
      color: #f5f7f6;
      background-color: #0b1011;
      background-image: radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px);
      background-size: 12px 12px;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.035), 0 26px 46px rgba(0,0,0,.34);
      pointer-events: none;
    }

    #project03Case001Root .p03-showcase::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: radial-gradient(circle at 50% 47%, rgba(104,255,211,.08), transparent 30%), radial-gradient(circle at 65% 56%, rgba(255,72,227,.08), transparent 34%), linear-gradient(180deg, transparent 65%, rgba(0,0,0,.22));
    }

    #project03Case001Root .p03-showcase-header {
      position: absolute;
      inset: 16px 16px auto;
      z-index: 4;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
    }

    #project03Case001Root .p03-showcase-title {
      max-width: 286px;
      margin: 0;
      color: #f7f8f8;
      font-family: "Alimama ShuHeiTi","Alibaba PuHuiTi 2.0","Alibaba PuHuiTi","PingFang SC","Microsoft YaHei",sans-serif;
      font-size: 19px;
      line-height: 1.02;
      letter-spacing: 0;
      font-weight: 800;
      text-wrap: balance;
    }

    #project03Case001Root .p03-viewport-switcher {
      display: flex;
      gap: 3px;
      padding: 3px;
      border: 1px solid rgba(255,255,255,.13);
      border-radius: 999px;
      background: rgba(0,0,0,.34);
      pointer-events: auto;
      flex: 0 0 auto;
    }

    #project03Case001Root .p03-viewport-btn {
      min-width: 34px;
      height: 26px;
      padding: 0 8px;
      border: 0;
      border-radius: 999px;
      color: rgba(240,244,244,.62);
      background: rgba(255,255,255,.08);
      font: 11px/1 "Alibaba PuHuiTi 2.0","Alibaba PuHuiTi","PingFang SC",sans-serif;
      cursor: pointer;
      transition: color 180ms ease, background 180ms ease, transform 180ms ease;
    }

    #project03Case001Root .p03-viewport-btn:hover { color: #111617; background: #d8e0e1; transform: translateY(-1px); }
    #project03Case001Root .p03-viewport-btn.is-active { color: #101516; background: #d8e0e1; }

    #project03Case001Root .p03-card-stage {
      position: absolute;
      inset: 56px 16px 40px;
      z-index: 2;
      display: grid;
      place-items: center;
      pointer-events: none;
    }

    #project03Case001Root .p03-card-wrap {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 258px;
      height: 356px;
      transform: translate(-50%, -48%) scale(.60);
      transform-origin: center;
      pointer-events: none;
      transition: transform 360ms cubic-bezier(.2,.85,.2,1);
    }

    #project03Case001Root[data-viewport="pc"] .p03-card-wrap { transform: translate(-50%, -48%) scale(.67); }
    #project03Case001Root[data-viewport="app"] .p03-card-wrap { transform: translate(-50%, -48%) scale(.54); }
    #project03Case001Root[data-viewport="module"] .p03-card-wrap { transform: translate(-50%, -48%) scale(.60); }

    #project03Case001Root .p03-card-wrap > #project03Case001Card { pointer-events: auto; }

    #project03Case001Root .p03-showcase-tip {
      position: absolute;
      left: 14px;
      right: 14px;
      bottom: 13px;
      z-index: 4;
      margin: 0;
      color: rgba(232,238,238,.70);
      font: 13px/1.2 "Alibaba PuHuiTi 2.0","Alibaba PuHuiTi","PingFang SC",sans-serif;
      text-align: center;
      pointer-events: none;
    }

    #project03Case001Card {
      --tilt-x: 0deg;
      --tilt-y: 0deg;
      --tilt-z: 0deg;
      --spin: 0deg;
      --panel-x: 0px;
      --panel-y: 0px;
      --avatar-x: 0px;
      --avatar-y: 0px;
      --text-x: 0px;
      --text-y: 0px;
      --shine-x: 34%;
      --shine-y: 22%;
      --foil-angle: 70deg;
      --foil-opacity: .86;
      --foil-saturation: 1.65;
      --grain-opacity: .32;
      --rim-light: .22;
      --rim-light-pink: .16;
      position: relative;
      width: 258px;
      height: 356px;
      border-radius: 22px;
      transform-style: preserve-3d;
      transform: translateY(-4px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y)) rotateZ(var(--tilt-z)) rotateY(var(--spin));
      transform-origin: 48% 48%;
      transition: transform 420ms cubic-bezier(.2,.85,.2,1), filter 240ms ease;
      filter: drop-shadow(0 28px 26px rgba(0,0,0,.58)) drop-shadow(-18px 4px 34px rgba(45,255,210,.22)) drop-shadow(18px 2px 30px rgba(255,88,235,.16));
      cursor: grab;
      will-change: transform, filter;
      user-select: none;
      touch-action: none;
    }

    #project03Case001Card.is-dragging {
      cursor: grabbing;
      transition: none;
      filter: drop-shadow(0 32px 28px rgba(0,0,0,.62)) drop-shadow(-22px -8px 30px rgba(45,255,210,.24)) drop-shadow(18px -10px 24px rgba(255,88,235,.18));
    }

    #project03Case001Card.is-inertia { transition: none; }

    #project03Case001Card .p03-card-face {
      position: absolute;
      inset: 0;
      border-radius: 22px;
      overflow: hidden;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      transform-style: preserve-3d;
      clip-path: inset(0 round 22px);
      border: 1px solid rgba(255,255,255,.26);
      isolation: isolate;
      background: radial-gradient(circle at 22% 64%, rgba(67,255,151,.46), transparent 34%), radial-gradient(circle at 82% 18%, rgba(255,95,232,.42), transparent 28%), linear-gradient(135deg,#effff1 0%,#8dffe1 18%,#bfefff 35%,#918dff 52%,#ff9de8 69%,#fbffad 85%,#f3fbea 100%);
      -webkit-mask-image: -webkit-radial-gradient(white, black);
      transition: opacity 80ms linear;
    }

    #project03Case001Card .p03-card-front {
      opacity: 1;
      transform: translateZ(8px);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.26), inset -18px 0 28px rgba(26,255,214,var(--rim-light)), inset 16px 0 30px rgba(255,88,235,var(--rim-light-pink));
    }

    #project03Case001Card .p03-card-front::before,
    #project03Case001Card .p03-card-back::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      z-index: 1;
      background: radial-gradient(circle at var(--shine-x) var(--shine-y),rgba(255,255,255,.74),transparent 11%), radial-gradient(circle at calc(100% - var(--shine-x)) 56%,rgba(255,38,210,.58),transparent 24%), radial-gradient(circle at 85% 48%,rgba(255,54,33,.46),transparent 22%), radial-gradient(circle at 93% 68%,rgba(255,232,60,.56),transparent 18%), radial-gradient(circle at 8% 30%,rgba(143,52,255,.58),transparent 24%), radial-gradient(circle at 16% 72%,rgba(64,185,255,.46),transparent 26%), conic-gradient(from var(--foil-angle) at var(--shine-x) var(--shine-y),rgba(255,255,255,.22),rgba(40,255,198,.86),rgba(55,112,255,.68),rgba(160,62,255,.76),rgba(255,43,210,.88),rgba(255,68,37,.74),rgba(255,244,66,.78),rgba(255,255,255,.22)), linear-gradient(var(--foil-angle),rgba(255,255,255,.26) 0%,rgba(65,255,195,.86) 12%,rgba(67,169,255,.64) 28%,rgba(119,72,255,.70) 45%,rgba(255,48,214,.90) 61%,rgba(255,78,45,.70) 72%,rgba(255,245,72,.76) 84%,rgba(255,255,255,.28) 100%);
      opacity: var(--foil-opacity);
      filter: saturate(var(--foil-saturation)) contrast(1.22) brightness(1.03);
      pointer-events: none;
    }

    #project03Case001Card .p03-card-front::after,
    #project03Case001Card .p03-card-back::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      z-index: 7;
      background: repeating-radial-gradient(circle at 12% 18%,rgba(255,255,255,.18) 0 1px,rgba(0,0,0,.10) 1px 2px,transparent 2px 4px), repeating-linear-gradient(119deg,rgba(8,14,10,.16) 0 1px,transparent 1px 5px), repeating-linear-gradient(83deg,rgba(255,255,255,.11) 0 1px,transparent 1px 7px);
      opacity: var(--grain-opacity);
      mix-blend-mode: overlay;
      pointer-events: none;
    }

    #project03Case001Card .p03-card-back {
      opacity: 0;
      transform: scaleX(-1) translateZ(8px);
      backface-visibility: visible;
      -webkit-backface-visibility: visible;
      display: grid;
      place-items: center;
      text-align: center;
      background: radial-gradient(circle at 20% 18%,rgba(238,255,236,.58),transparent 27%), radial-gradient(circle at 17% 63%,rgba(255,20,226,.64),transparent 28%), radial-gradient(circle at 74% 47%,rgba(255,58,34,.50),transparent 22%), radial-gradient(circle at 92% 70%,rgba(255,242,54,.62),transparent 24%), radial-gradient(circle at 16% 84%,rgba(82,72,255,.62),transparent 30%), radial-gradient(circle at 86% 88%,rgba(20,225,255,.60),transparent 28%), linear-gradient(132deg,#dcfff0 0%,#42f5d0 18%,#49baff 34%,#7058ff 48%,#ee24cd 63%,#ff7041 76%,#fff061 90%,#e7ffd8 100%);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.26), inset 0 -28px 38px rgba(29,38,38,.16), inset -18px 0 28px rgba(26,255,214,var(--rim-light)), inset 16px 0 30px rgba(255,88,235,var(--rim-light-pink)), inset 0 0 42px rgba(255,255,255,.16);
    }

    #project03Case001Card .p03-card-back::before {
      opacity: calc(var(--foil-opacity) - .16);
      filter: saturate(calc(var(--foil-saturation) - .12)) contrast(1.18) brightness(.98);
      mix-blend-mode: screen;
    }

    #project03Case001Card .p03-card-back::after { opacity: calc(var(--grain-opacity) + .06); }
    #project03Case001Card.is-flipped .p03-card-front { opacity: 0; }
    #project03Case001Card.is-flipped .p03-card-back { opacity: 1; }

    #project03Case001Card .p03-holo-panel {
      position: absolute;
      left: 28px;
      top: 72px;
      width: 202px;
      height: 150px;
      border-radius: 14px;
      z-index: 3;
      transform: translate3d(var(--panel-x),var(--panel-y),36px);
      background: radial-gradient(circle at 30% 38%,rgba(38,88,72,.86),transparent 44%),linear-gradient(130deg,#263d40,#4b665d 52%,#2a2f38);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.10),0 16px 24px rgba(0,0,0,.22);
    }

    #project03Case001Card .p03-holo-panel::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(var(--foil-angle),transparent 18%,rgba(255,255,255,.24) 48%,transparent 72%);
      opacity: .28;
      mix-blend-mode: screen;
      pointer-events: none;
    }

    #project03Case001Card .p03-avatar-layer {
      position: absolute;
      left: 28px;
      top: 72px;
      width: 202px;
      height: 150px;
      z-index: 5;
      display: grid;
      place-items: center;
      padding: 8px 14px 10px;
      box-sizing: border-box;
      border-radius: 14px;
      transform: translate3d(var(--avatar-x),var(--avatar-y),44px);
      filter: drop-shadow(0 24px 18px rgba(0,0,0,.34)) drop-shadow(-12px -8px 12px rgba(87,255,215,.18)) drop-shadow(12px -8px 12px rgba(255,80,225,.16));
      pointer-events: none;
    }

    #project03Case001Card .p03-avatar-img {
      display: block;
      width: 108px;
      height: 143px;
      object-fit: contain;
      object-position: center;
      filter: drop-shadow(0 8px 10px rgba(0,0,0,.16));
      user-select: none;
    }

    #project03Case001Card .p03-card-label,
    #project03Case001Card .p03-card-footer {
      position: absolute;
      z-index: 6;
      color: #102016;
      font-family: "Alibaba PuHuiTi 2.0","Alibaba PuHuiTi","Alimama ShuHeiTi","PingFang SC","Microsoft YaHei",sans-serif;
      transform: translate3d(var(--text-x),var(--text-y),58px);
      filter: drop-shadow(0 6px 10px rgba(0,0,0,.16));
      text-shadow: 0 1px 0 rgba(255,255,255,.34),0 18px 18px rgba(0,0,0,.28),0 0 14px rgba(255,255,255,.06),-2px -1px 0 rgba(88,255,218,.22),2px -1px 0 rgba(255,82,226,.20);
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
      pointer-events: none;
    }

    #project03Case001Card .p03-studio { left:28px;top:26px;font-size:21px;line-height:1.02;font-weight:800; }
    #project03Case001Card .p03-name { left:28px;top:246px;font-size:22px;line-height:1;font-weight:850; }
    #project03Case001Card .p03-stars { right:30px;top:248px;font-size:18px;font-weight:900;line-height:1; }
    #project03Case001Card .p03-desc { left:28px;top:276px;width:197px;font-size:12px;line-height:18px;font-weight:400;opacity:.78; }

    #project03Case001Card .p03-card-footer {
      left: 28px;
      bottom: 23px;
      width: 200px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    #project03Case001Card .p03-footer-left { max-width:142px;overflow:hidden;white-space:nowrap;font-size:12px;letter-spacing:5px;font-weight:400;opacity:.66; }
    #project03Case001Card .p03-footer-right { flex:none;white-space:nowrap;font-size:12px;letter-spacing:2px;font-weight:400;opacity:.72; }

    #project03Case001Card .p03-back-mark {
      position: relative;
      z-index: 8;
      color: #142016;
      transform: translateZ(58px);
      filter: drop-shadow(0 8px 12px rgba(0,0,0,.18));
      text-shadow: 0 1px 0 rgba(255,255,255,.18),0 12px 14px rgba(0,0,0,.24),-1px 0 rgba(45,255,210,.10),1px 0 rgba(255,68,220,.10);
      pointer-events: none;
    }

    #project03Case001Card .p03-back-mark strong { display:block;font-size:42px;letter-spacing:1px;line-height:1; }
    #project03Case001Card .p03-back-mark span { display:block;margin-top:12px;font-size:13px;letter-spacing:2px;font-weight:850;opacity:.68; }

    @media (prefers-reduced-motion: reduce) {
      #project03Case001Root,
      #project03Case001Card { transition: none; }
    }
  `;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "project03Case001Root";
  root.dataset.viewport = "module";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <section class="p03-showcase" aria-label="案例 001 3D 全息卡片交互动效模板验证">
      <header class="p03-showcase-header">
        <h2 class="p03-showcase-title">3D 全息卡片交互动效模板验证</h2>
        <div class="p03-viewport-switcher" role="group" aria-label="预览模式">
          <button class="p03-viewport-btn" type="button" data-p03-viewport="pc">PC</button>
          <button class="p03-viewport-btn" type="button" data-p03-viewport="app">App</button>
          <button class="p03-viewport-btn is-active" type="button" data-p03-viewport="module">Module</button>
        </div>
      </header>
      <div class="p03-card-stage">
        <div class="p03-card-wrap">
          <div id="project03Case001Card" role="img" aria-label="案例 001 3D 全息卡片，可移动鼠标倾斜并点击或拖拽翻面">
            <div class="p03-card-face p03-card-front">
              <div class="p03-holo-panel"></div>
              <div class="p03-avatar-layer"><img class="p03-avatar-img" src="project-03-lion-avatar.png" alt="" draggable="false"></div>
              <div class="p03-card-label p03-studio">Duo's Studio</div>
              <div class="p03-card-label p03-name">Duo</div>
              <div class="p03-card-label p03-stars">★★★★★</div>
              <div class="p03-card-label p03-desc">爱就像彩虹，雨后的天空。</div>
              <div class="p03-card-footer"><span class="p03-footer-left">HOLOGRAPHIC</span><span class="p03-footer-right">✦ 1 / 1</span></div>
            </div>
            <div class="p03-card-face p03-card-back">
              <div class="p03-back-mark"><strong>DUO</strong><span>HOLOGRAPHIC<br>STUDIO PASS</span></div>
            </div>
          </div>
        </div>
      </div>
      <p class="p03-showcase-tip">移动鼠标倾斜卡片，点击或长按翻面。</p>
    </section>
  `;
  document.body.appendChild(root);

  const card = root.querySelector("#project03Case001Card");
  const state = {
    enabled: true,
    active: false,
    occupying: false,
    spin: 0,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    pressStartAt: 0,
    suppressNextClick: false,
    lastX: 0,
    lastY: 0,
    dragEnergy: 0,
    pointerMoved: false,
    smoothX: 0,
    smoothY: 0,
    inertiaFrame: 0,
    view: null,
    face: "front",
    status: "mounting",
    transitionTexture: null,
    transitionTextureLoading: false,
    transitionProxyReady: false,
    transitionProxyActive: false,
    transitionProxyError: null,
    pageMaterial: null,
    originalPageTexture: null,
  };
  window.__PROJECT03_CASE001__ = state;

  root.querySelectorAll("[data-p03-viewport]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const viewport = button.dataset.p03Viewport || "module";
      root.dataset.viewport = viewport;
      root.querySelectorAll("[data-p03-viewport]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
    });
  });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function easeOutQuart(value) {
    return 1 - Math.pow(1 - value, 4);
  }

  function easeOutQuint(value) {
    return 1 - Math.pow(1 - value, 5);
  }

  function projectedDelta(dx, dy) {
    return dx * 0.95 + dy * 0.35;
  }

  function nearestFrontSpin(spin) {
    return Math.round(spin / 360) * 360;
  }

  function nextHalfTurnTarget(direction) {
    const normalizedDirection = direction >= 0 ? 1 : -1;
    let target = normalizedDirection > 0
      ? Math.floor(state.spin / 180) * 180 + 180
      : Math.ceil(state.spin / 180) * 180 - 180;
    if (normalizedDirection > 0 && target <= state.spin + 24) target += 180;
    if (normalizedDirection < 0 && target >= state.spin - 24) target -= 180;
    return target;
  }

  function rotationsFromGesture(holdDuration, dragEnergy, pointerMoved) {
    const holdRotations = holdDuration < 220 ? 1 : 1 + Math.floor((holdDuration - 220) / 520);
    const dragRotations = pointerMoved ? Math.ceil(Math.abs(dragEnergy) / motion.spinDistanceThreshold) : 0;
    return clamp(Math.max(1, holdRotations, dragRotations), 1, 6);
  }

  function frontSpinTarget(rotations, direction) {
    const safeRotations = Math.max(1, Math.round(rotations));
    const normalizedDirection = direction >= 0 ? 1 : -1;
    const restingFront = normalizedDirection > 0
      ? Math.floor(state.spin / 360) * 360
      : Math.ceil(state.spin / 360) * 360;
    let target = restingFront + normalizedDirection * safeRotations * 360;
    if (normalizedDirection > 0 && target <= state.spin + 24) target += 360;
    if (normalizedDirection < 0 && target >= state.spin - 24) target -= 360;
    return target;
  }

  function isBackVisible() {
    const normalized = ((state.spin % 360) + 360) % 360;
    return normalized > 90 && normalized < 270;
  }

  function setPose(tiltX, tiltY, tiltZ, layerX, layerY) {
    card.style.setProperty("--tilt-x", `${tiltX}deg`);
    card.style.setProperty("--tilt-y", `${tiltY}deg`);
    card.style.setProperty("--tilt-z", `${tiltZ}deg`);
    card.style.setProperty("--panel-x", `${layerX * motion.panelParallaxDepth}px`);
    card.style.setProperty("--panel-y", `${layerY * motion.panelParallaxDepth}px`);
    card.style.setProperty("--avatar-x", `${layerX * motion.avatarParallaxDepth}px`);
    card.style.setProperty("--avatar-y", `${layerY * motion.avatarParallaxDepth}px`);
    card.style.setProperty("--text-x", `${layerX * motion.textParallaxDepth}px`);
    card.style.setProperty("--text-y", `${layerY * motion.textParallaxDepth}px`);
  }

  function setFoilByPointer(pointerX, pointerY) {
    const x = pointerX == null ? state.smoothX : pointerX;
    const y = pointerY == null ? state.smoothY : pointerY;
    const shineX = clamp(motion.shineCenterBase + x * motion.shineCenterRange, motion.shineCenterClampMin, motion.shineCenterClampMax);
    const shineY = clamp(motion.shineCenterBase + y * motion.shineCenterRange, motion.shineCenterClampMin, motion.shineCenterClampMax);
    const pointerIntensity = clamp(Math.hypot(x, y) / motion.pointerClamp, 0, 1);
    const interactionBoost = state.dragging || card.classList.contains("is-pressing") || card.classList.contains("is-inertia") ? 1 : 0;
    const foilAngle = motion.foilAngleBase + x * motion.foilAngleRange * 1.42;
    const glint = (Math.sin((state.spin + x * 168 - y * 112) * Math.PI / 180) + 1) / 2;
    const laserBoost = clamp(pointerIntensity * 0.38 + interactionBoost * 0.24, 0, 0.56);
    const foilOpacity = clamp(motion.foilOpacityMin + glint * (motion.foilOpacityMax - motion.foilOpacityMin) + laserBoost * 0.22, 0.78, 1);
    const foilSaturation = clamp((motion.foilSaturationMin + glint * (motion.foilSaturationMax - motion.foilSaturationMin)) * (1 + pointerIntensity * 0.34 + interactionBoost * 0.2), 1.45, 3.25);
    const grainOpacity = clamp(motion.grainOpacityMin + glint * (motion.grainOpacityMax - motion.grainOpacityMin) + laserBoost * 0.2, 0.28, 0.72);
    const rimLight = clamp(motion.rimLightMin + glint * (motion.rimLightMax - motion.rimLightMin) + laserBoost * 0.26, 0.12, 0.58);
    card.style.setProperty("--shine-x", `${shineX}%`);
    card.style.setProperty("--shine-y", `${shineY}%`);
    card.style.setProperty("--foil-angle", `${foilAngle}deg`);
    card.style.setProperty("--foil-opacity", `${foilOpacity}`);
    card.style.setProperty("--foil-saturation", `${foilSaturation}`);
    card.style.setProperty("--grain-opacity", `${grainOpacity}`);
    card.style.setProperty("--rim-light", `${rimLight}`);
    card.style.setProperty("--rim-light-pink", `${clamp(0.08 + glint * 0.18 + laserBoost * 0.18, 0.08, 0.48)}`);
  }

  function updateCard() {
    card.style.setProperty("--spin", `${state.spin}deg`);
    setFoilByPointer();
    const backVisible = isBackVisible();
    card.classList.toggle("is-flipped", backVisible);
    state.face = backVisible ? "back" : "front";
  }

  function setPoseFromPointer(event, speedLift, spinInfluence, immediate) {
    const rect = card.getBoundingClientRect();
    const scale = Math.max(parseFloat(getComputedStyle(root).getPropertyValue("--p03-scale")) || 1, 0.01);
    const normalizeBase = motion.pointerNormalizeBase * scale;
    const targetX = clamp((event.clientX - rect.left - rect.width / 2) / normalizeBase, -motion.pointerClamp, motion.pointerClamp);
    const targetY = clamp((event.clientY - rect.top - rect.height / 2) / normalizeBase, -motion.pointerClamp, motion.pointerClamp);
    if (immediate) {
      state.smoothX = targetX;
      state.smoothY = targetY;
    } else {
      state.smoothX += (targetX - state.smoothX) * motion.smoothing;
      state.smoothY += (targetY - state.smoothY) * motion.smoothing;
    }
    const tiltX = clamp(-state.smoothY * motion.tiltBase - (speedLift || 0), -motion.tiltMaxX, motion.tiltMaxX);
    const tiltY = clamp(state.smoothX * motion.tiltBase + (spinInfluence || 0), -motion.tiltMaxY, motion.tiltMaxY);
    const tiltZ = clamp(state.smoothX * -1.8 + state.smoothY * 1.8, -3.5, 3.5);
    setPose(tiltX, tiltY, tiltZ, state.smoothX, state.smoothY);
    setFoilByPointer(state.smoothX, state.smoothY);
  }

  function stopInertia() {
    if (state.inertiaFrame) cancelAnimationFrame(state.inertiaFrame);
    state.inertiaFrame = 0;
    card.classList.remove("is-inertia", "is-pressing");
  }

  function startSnap(targetSpin, direction, didFlip, options) {
    const config = options || {};
    stopInertia();
    card.classList.add("is-inertia");
    const fromSpin = state.spin;
    const fromX = state.smoothX;
    const fromY = state.smoothY;
    const start = performance.now();
    const lockedTarget = config.targetLock === "exact" ? targetSpin : nearestFrontSpin(targetSpin);
    const rotations = Math.max(1, Math.abs(lockedTarget - fromSpin) / 360);
    const duration = config.duration || (didFlip
      ? clamp(motion.snapDuration + rotations * 180 + (config.holdDuration || 0) * 0.08, 760, 1860)
      : motion.tiltSettleDuration);
    const wobble = didFlip
      ? clamp(motion.snapWobbleMax + rotations * 1.4, motion.snapWobbleMax, 18)
      : motion.snapWobbleMin;

    function tick(now) {
      const progress = clamp((now - start) / duration, 0, 1);
      const eased = didFlip ? easeOutQuart(progress) : easeOutQuint(progress);
      const settleProgress = clamp((progress - 0.48) / 0.52, 0, 1);
      const decay = Math.exp(-(didFlip ? 3.6 : motion.tiltSettleDecay) * settleProgress);
      const oscillation = Math.sin(settleProgress * Math.PI * (didFlip ? 3.25 : motion.tiltSettleOscillation));
      const wobbleDegrees = direction * wobble * decay * oscillation * (1 - settleProgress);
      state.spin = fromSpin + (lockedTarget - fromSpin) * eased + wobbleDegrees;
      state.smoothX = fromX * (1 - eased);
      state.smoothY = fromY * (1 - eased);
      const poseX = clamp(-state.smoothY * motion.tiltBase - Math.abs(wobbleDegrees) * 0.22, -motion.tiltMaxX, motion.tiltMaxX);
      const poseY = clamp(state.smoothX * motion.tiltBase + wobbleDegrees * 0.35, -motion.tiltMaxY, motion.tiltMaxY);
      setPose(poseX, poseY, clamp(wobbleDegrees * 0.18, -3.5, 3.5), state.smoothX, state.smoothY);
      updateCard();
      if (progress < 1 && state.active) {
        state.inertiaFrame = requestAnimationFrame(tick);
        return;
      }
      state.spin = state.active ? lockedTarget : 0;
      state.smoothX = 0;
      state.smoothY = 0;
      setPose(0, 0, 0, 0, 0);
      card.classList.remove("is-inertia", "is-pressing");
      updateCard();
      state.inertiaFrame = 0;
    }
    state.inertiaFrame = requestAnimationFrame(tick);
  }

  function flipToNextSide() {
    startSnap(nextHalfTurnTarget(1), 1, true, { targetLock: "exact" });
  }

  function startDrag(event) {
    if (!state.active || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    stopInertia();
    state.dragging = true;
    state.pointerMoved = false;
    state.pressStartAt = performance.now();
    state.dragStartX = event.clientX;
    state.dragStartY = event.clientY;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.dragEnergy = 0;
    card.classList.add("is-dragging", "is-pressing");
    card.setPointerCapture?.(event.pointerId);
    setPoseFromPointer(event, 0, 0, true);
  }

  function moveDrag(event) {
    if (!state.dragging) return;
    event.preventDefault();
    event.stopPropagation();
    const dx = event.clientX - state.lastX;
    const dy = event.clientY - state.lastY;
    const totalDx = event.clientX - state.dragStartX;
    const totalDy = event.clientY - state.dragStartY;
    const energy = projectedDelta(dx, dy);
    state.dragEnergy += energy;
    state.spin += energy * motion.liveSpinMultiplier;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.pointerMoved = Math.hypot(totalDx, totalDy) > 8;
    const gesture = clamp(state.dragEnergy / motion.spinDistanceThreshold, -motion.pointerClamp, motion.pointerClamp);
    updateCard();
    setPoseFromPointer(event, 0, gesture * 2.2, false);
  }

  function releaseDrag(event) {
    if (!state.dragging) return;
    event.preventDefault();
    event.stopPropagation();
    state.dragging = false;
    card.classList.remove("is-dragging");
    try { card.releasePointerCapture?.(event.pointerId); } catch (error) {}
    const direction = (state.dragEnergy || 1) >= 0 ? 1 : -1;
    const holdDuration = Math.max(0, performance.now() - state.pressStartAt);
    if (!state.pointerMoved && holdDuration < 220) {
      card.classList.remove("is-pressing");
      return;
    }
    const rotations = rotationsFromGesture(holdDuration, state.dragEnergy, state.pointerMoved);
    state.suppressNextClick = true;
    startSnap(frontSpinTarget(rotations, direction), direction, true, { holdDuration, rotations });
  }

  function resetCard() {
    stopInertia();
    state.dragging = false;
    state.spin = 0;
    state.smoothX = 0;
    state.smoothY = 0;
    state.dragEnergy = 0;
    state.pointerMoved = false;
    state.suppressNextClick = false;
    card.classList.remove("is-dragging", "is-pressing", "is-flipped");
    setPose(0, 0, 0, 0, 0);
    updateCard();
  }

  card.addEventListener("pointerdown", startDrag);
  card.addEventListener("pointermove", function onCardPointerMove(event) {
    if (!state.active || state.dragging) return;
    event.stopPropagation();
    setPoseFromPointer(event, 0, 0, false);
  });
  card.addEventListener("pointerleave", function onCardPointerLeave() {
    if (!state.dragging && !state.inertiaFrame) {
      startSnap(state.spin, 1, false, { targetLock: "exact" });
    }
  });
  card.addEventListener("click", function onCardClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!state.active) return;
    if (state.suppressNextClick) {
      state.suppressNextClick = false;
      return;
    }
    if (state.pointerMoved) return;
    flipToNextSide();
  });
  card.addEventListener("contextmenu", function preventContextMenu(event) {
    event.preventDefault();
    event.stopPropagation();
  });
  window.addEventListener("pointermove", moveDrag, { passive: false });
  window.addEventListener("pointerup", releaseDrag, { passive: false });
  window.addEventListener("pointercancel", releaseDrag, { passive: false });

  function getView() {
    return window.Main && window.Main.maskRevealView;
  }

  function ensureTransitionProxy(view) {
    if (state.transitionTexture || state.transitionTextureLoading || !window.THREE) return;
    const pageMaterial = view && view.pageMaterials && view.pageMaterials[PAGE_INDEX - 1];
    if (!pageMaterial || !pageMaterial.map) return;

    state.pageMaterial = pageMaterial;
    state.originalPageTexture = pageMaterial.textures && pageMaterial.textures[0]
      ? pageMaterial.textures[0]
      : pageMaterial.map;
    state.transitionTextureLoading = true;
    const transitionLoadingManager = new window.THREE.LoadingManager();
    new window.THREE.TextureLoader(transitionLoadingManager).load(
      TRANSITION_TEXTURE_URL,
      (texture) => {
        const original = state.originalPageTexture;
        texture.flipY = original.flipY;
        texture.encoding = original.encoding;
        texture.anisotropy = original.anisotropy;
        texture.wrapS = original.wrapS;
        texture.wrapT = original.wrapT;
        texture.minFilter = original.minFilter;
        texture.magFilter = original.magFilter;
        texture.needsUpdate = true;
        state.transitionTexture = texture;
        state.transitionTextureLoading = false;
        state.transitionProxyReady = true;
      },
      undefined,
      (error) => {
        state.transitionTextureLoading = false;
        state.transitionProxyError = error && error.message
          ? error.message
          : "transition texture failed to load";
      },
    );
  }

  function setTransitionProxyVisible(view, visible) {
    ensureTransitionProxy(view);
    const material = state.pageMaterial;
    const texture = visible ? state.transitionTexture : state.originalPageTexture;
    if (!material || !texture || state.transitionProxyActive === visible) return;

    material.map = texture;
    const shader = material.userData && material.userData.shader;
    if (shader && shader.uniforms && shader.uniforms.map) shader.uniforms.map.value = texture;
    state.transitionProxyActive = visible;
  }

  function isStableProject03(view) {
    const state = getPageEmbedState(view);
    return state.stable;
  }

  function getPageEmbedState(view) {
    if (!view || view.ENTERED !== true || document.hidden) {
      return { occupied: false, stable: false, phase: 0, direction: 0, progress: -1 };
    }

    const timelineProgress = view.flipTimeline && typeof view.flipTimeline.progress === "function"
      ? view.flipTimeline.progress()
      : -1;
    const pageCount = Number(view.pageDatas && view.pageDatas.length) + 1 || 12;
    const segment = 1 / pageCount;
    const delta = timelineProgress - TARGET_PROGRESS;
    const isAdjacentPage = view.currPageIndex === PAGE_INDEX - 1
      || view.currPageIndex === PAGE_INDEX
      || view.currPageIndex === PAGE_INDEX + 1;
    const stable = view.currPageIndex === PAGE_INDEX && Math.abs(delta) < PROGRESS_EPSILON;
    const phase = delta < 0
      ? clamp((delta + segment) / segment, 0, 1)
      : clamp(1 - delta / segment, 0, 1);
    const occupied = isAdjacentPage && (stable || phase > PROGRESS_EPSILON);

    return {
      occupied,
      stable,
      phase,
      direction: delta >= 0 ? -1 : 1,
      progress: timelineProgress,
    };
  }

  function setPageLocalPose(embedState) {
    const phase = embedState.phase;
    const edgeAmount = 1 - phase;
    const pageRotate = embedState.stable ? 0 : embedState.direction * 82 * edgeAmount;
    const pageScaleX = embedState.stable ? 1 : phase;
    const pageOpacity = embedState.stable ? 1 : clamp(phase * 1.25, 0, 1);
    const pageX = embedState.stable ? 0 : -10 * edgeAmount;

    root.style.setProperty("--p03-page-x", `${pageX}px`);
    root.style.setProperty("--p03-page-y", "0px");
    root.style.setProperty("--p03-page-rotate", `${pageRotate}deg`);
    root.style.setProperty("--p03-page-scale-x", `${pageScaleX}`);
    root.style.setProperty("--p03-page-opacity", `${pageOpacity}`);
  }

  function positionRoot(view) {
    const bookPixelWidth = Number(view.bookPixelWidth) || Math.min(window.innerWidth * 0.72, 1038);
    const scale = clamp(bookPixelWidth / 1038, 0.62, 1.05);
    const centerX = window.innerWidth / 2 + bookPixelWidth * 0.25;
    const centerY = window.innerHeight / 2 + 10;
    root.style.left = `${centerX}px`;
    root.style.top = `${centerY}px`;
    root.style.setProperty("--p03-scale", `${scale}`);
    state.layout = { bookPixelWidth, centerX, centerY, scale };
  }

  function frame() {
    const view = getView();
    if (view) state.view = view;
    const embedState = getPageEmbedState(view);
    const active = embedState.stable;
    setTransitionProxyVisible(view, !active && embedState.occupied);
    if (active) {
      positionRoot(view);
      setPageLocalPose({ stable: true, phase: 1, direction: 0 });
      state.active = true;
      state.occupying = true;
      state.status = "active";
      root.classList.remove("is-flipping");
      root.classList.add("is-visible");
      root.classList.add("is-interactive");
      root.setAttribute("aria-hidden", "false");
    } else if (state.occupying) {
      state.active = false;
      state.occupying = false;
      state.status = embedState.occupied ? "page-texture-proxy" : "hidden";
      root.classList.remove("is-visible", "is-interactive", "is-flipping");
      root.setAttribute("aria-hidden", "true");
      resetCard();
      setPageLocalPose({ stable: true, phase: 1, direction: 0 });
    } else if (!view) {
      state.status = "waiting-for-view";
    } else if (embedState.occupied) {
      state.status = state.transitionProxyReady ? "page-texture-proxy" : "page-texture-loading";
    } else {
      state.status = "outside-page-window";
    }
    requestAnimationFrame(frame);
  }

  document.addEventListener("visibilitychange", function onVisibilityChange() {
    if (document.hidden && state.occupying) {
      state.active = false;
      state.occupying = false;
      root.classList.remove("is-visible", "is-interactive");
      resetCard();
    }
    if (document.hidden) setTransitionProxyVisible(state.view, false);
  });

  updateCard();
  state.status = "ready";
  requestAnimationFrame(frame);
})();
