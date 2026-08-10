(function initProject01CardSwap() {
  "use strict";

  const PAGE_MATERIAL_INDEX = 3;
  const PAGE_INDEX = 4;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const params = new URLSearchParams(window.location.search);
  if (params.get("cardSwap") === "off") return;

  const CARD_NAMES = ["首页", "诊断测试题", "知识图谱"];
  const CARD_SOURCES = [
    "card-swap-home.png",
    "card-swap-diagnostic.png",
    "card-swap-knowledge-map.png",
  ];
  const CANVAS_WIDTH = 1050;
  const CANVAS_HEIGHT = 600;
  const CARD_WIDTH = 420;
  const CARD_HEIGHT = 336;
  const HEADER_HEIGHT = 38;
  const SWAP_INTERVAL = 5000;
  const DUR_DROP = 2;
  const DUR_MOVE = 2;
  const DUR_RETURN = 2;
  const PROMOTE_OVERLAP = 0.9;
  const RETURN_DELAY = 0.05;
  const PROMOTE_STAGGER = 0.15;
  const DROP_DISTANCE = 500;
  const SWAP_DURATION = 2350;
  const CARD_DISTANCE = 50;
  const VERTICAL_DISTANCE = 59;
  const PERSPECTIVE = 756;
  const SKEW_RADIANS = (6 * Math.PI) / 180;
  const STATIC_POSITIONS = [
    { x: 740, y: 390, z: 0, zIndex: 3, scale: 1, skew: SKEW_RADIANS, opacity: 1 },
    { x: 740 + CARD_DISTANCE, y: 390 - VERTICAL_DISTANCE, z: -76, zIndex: 2, scale: PERSPECTIVE / (PERSPECTIVE + 76), skew: SKEW_RADIANS, opacity: 1 },
    { x: 740 + CARD_DISTANCE * 2, y: 390 - VERTICAL_DISTANCE * 2, z: -152, zIndex: 1, scale: PERSPECTIVE / (PERSPECTIVE + 152), skew: SKEW_RADIANS, opacity: 1 },
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getGsap() {
    if (window.gsap) return window.gsap;
    try {
      const parcelModule = window.parcelRequire && window.parcelRequire("TpQl");
      return parcelModule && (parcelModule.gsap || parcelModule.default);
    } catch (error) {
      return null;
    }
  }

  function roundedPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawContain(ctx, image, x, y, width, height) {
    if (!image || !image.naturalWidth) {
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(x, y, width, height);
      return;
    }
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const boxRatio = width / height;
    let drawWidth = width;
    let drawHeight = height;
    if (imageRatio > boxRatio) {
      drawHeight = width / imageRatio;
    } else {
      drawWidth = height * imageRatio;
    }
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(x, y, width, height);
    ctx.drawImage(image, x + (width - drawWidth) * 0.5, y + (height - drawHeight) * 0.5, drawWidth, drawHeight);
  }

  function mount(view, material) {
    const THREE = window.THREE;
    const shader = material && material.userData && material.userData.shader;
    if (!THREE || !shader || !shader.uniforms.map4 || material.__project01CardSwap) return false;
    material.__project01CardSwap = true;

    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.display = "none";
    const ctx = canvas.getContext("2d", { alpha: true });
    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    const originalMap = shader.uniforms.map4.value;
    shader.uniforms.map4.value = texture;

    const images = CARD_SOURCES.map((source) => {
      const image = new Image();
      image.decoding = "async";
      image.src = source;
      return image;
    });
    const gsap = getGsap();
    if (!gsap) return false;
    const motion = CARD_SOURCES.map(() => ({
      x: 0,
      y: 0,
      z: 0,
      zIndex: 0,
      scale: 1,
      skew: SKEW_RADIANS,
      opacity: 1,
    }));
    const state = (window.__PROJECT01_CARD_SWAP__ = {
      enabled: true,
      pageIndex: PAGE_INDEX,
      names: CARD_NAMES.slice(),
      order: [0, 1, 2],
      activeLayer: 0,
      transition: 0,
      texture,
      canvas,
      reducedMotion,
      originalMap,
      geometry: {
        skewDegrees: 6,
        cardDistance: CARD_DISTANCE,
        verticalDistance: VERTICAL_DISTANCE,
        perspective: PERSPECTIVE,
      },
      timing: {
        interval: SWAP_INTERVAL,
        duration: SWAP_DURATION,
        drop: DUR_DROP * 1000,
        move: DUR_MOVE * 1000,
        return: DUR_RETURN * 1000,
        promoteAt: DUR_DROP * (1 - PROMOTE_OVERLAP) * 1000,
        returnAt: (DUR_DROP * (1 - PROMOTE_OVERLAP) + DUR_MOVE * RETURN_DELAY) * 1000,
        stagger: PROMOTE_STAGGER * 1000,
      },
      wasActive: false,
      disable() {
        this.enabled = false;
        this.swapTimeline?.kill();
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("blur", resetPointer);
        shader.uniforms.map4.value = originalMap;
        texture.dispose();
        window.__PROJECT01_CARD_SWAP__.status = "disabled";
      },
    });

    const pointer = { x: 0, y: 0 };
    function onPointerMove(event) {
      pointer.x = clamp((event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1, -1, 1);
      pointer.y = clamp((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1, -1, 1);
    }
    function resetPointer() {
      pointer.x = 0;
      pointer.y = 0;
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", resetPointer, { passive: true });

    function drawCard(item, position, index) {
      const image = images[item.cardIndex];
      const width = CARD_WIDTH;
      const height = CARD_HEIGHT;
      const x = -CARD_WIDTH / 2;
      const y = -CARD_HEIGHT / 2;
      const radius = 12;
      ctx.save();
      ctx.globalAlpha = position.opacity;
      ctx.translate(position.x, position.y);
      ctx.scale(position.scale, position.scale);
      ctx.transform(1, Math.tan(position.skew), 0, 1, 0, 0);
      ctx.shadowColor = "rgba(20, 20, 28, .42)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 15;
      roundedPath(ctx, x, y, width, height, radius);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      roundedPath(ctx, x, y, width, height, radius);
      ctx.strokeStyle = "rgba(22,24,31,.32)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.save();
      roundedPath(ctx, x, y, width, height, radius);
      ctx.clip();
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(x, y + HEADER_HEIGHT, CARD_WIDTH, CARD_HEIGHT - HEADER_HEIGHT);
      drawContain(ctx, image, x, y + HEADER_HEIGHT, CARD_WIDTH, CARD_HEIGHT - HEADER_HEIGHT);
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(x, y + HEADER_HEIGHT);
      ctx.lineTo(x + CARD_WIDTH, y + HEADER_HEIGHT);
      ctx.strokeStyle = "rgba(22,24,31,.18)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#252833";
      ctx.font = '400 15px "Alibaba PuHuiTi 2.0", sans-serif';
      ctx.textBaseline = "middle";
      ctx.fillText(CARD_NAMES[item.cardIndex], x + 15, y + HEADER_HEIGHT * 0.5);
      ctx.restore();
    }

    function slotPosition(layer) {
      return STATIC_POSITIONS[layer];
    }

    function placeOrder() {
      state.order.forEach((cardIndex, layer) => {
        Object.assign(motion[cardIndex], slotPosition(layer));
      });
    }

    function resetCycle(now) {
      state.swapTimeline?.kill();
      state.swapTimeline = null;
      state.swapStarted = null;
      state.transition = 0;
      state.order = [0, 1, 2];
      state.cycleStarted = now;
      placeOrder();
    }

    function startSwap(now) {
      if (state.swapTimeline || state.order.length < 2) return;
      const [front, ...rest] = state.order;
      const frontMotion = motion[front];
      const backSlot = slotPosition(state.order.length - 1);
      const timeline = gsap.timeline({
        paused: false,
        onUpdate() {
          state.transition = timeline.progress();
        },
        onComplete() {
          state.order = [...rest, front];
          placeOrder();
          state.cycleStarted = performance.now();
          state.swapStarted = null;
          state.swapTimeline = null;
          state.transition = 0;
        },
      });
      state.swapStarted = now;
      state.swapTimeline = timeline;
      timeline.to(frontMotion, {
        y: `+=${DROP_DISTANCE}`,
        duration: DUR_DROP,
        ease: "elastic.out(0.6,0.9)",
      });
      timeline.addLabel("promote", `-=${DUR_DROP * PROMOTE_OVERLAP}`);
      rest.forEach((cardIndex, index) => {
        const target = slotPosition(index);
        timeline.set(motion[cardIndex], { zIndex: target.zIndex }, "promote");
        timeline.to(
          motion[cardIndex],
          {
            x: target.x,
            y: target.y,
            z: target.z,
            scale: target.scale,
            duration: DUR_MOVE,
            ease: "elastic.out(0.6,0.9)",
          },
          `promote+=${index * PROMOTE_STAGGER}`,
        );
      });
      timeline.addLabel("return", `promote+=${DUR_MOVE * RETURN_DELAY}`);
      timeline.set(frontMotion, { zIndex: backSlot.zIndex }, "return");
      timeline.to(frontMotion, {
        x: backSlot.x,
        y: backSlot.y,
        z: backSlot.z,
        scale: backSlot.scale,
        duration: DUR_RETURN,
        ease: "elastic.out(0.6,0.9)",
      }, "return");
    }

    function draw(now) {
      if (!state.enabled) return;
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const isActive = view.currPageIndex === PAGE_INDEX;
      if (isActive && !state.wasActive) {
        resetCycle(now);
      } else if (!isActive && state.wasActive) {
        resetCycle(now);
      }
      state.wasActive = isActive;
      const elapsed = now - state.cycleStarted;
      if (!reducedMotion && isActive && !state.swapTimeline && elapsed >= SWAP_INTERVAL) {
        startSwap(now);
      }
      const items = state.order.map((cardIndex, layer) => ({ cardIndex, layer }));
      items.forEach((item) => {
        item.position = { ...motion[item.cardIndex] };
        item.position.x += pointer.x * (6 - item.layer * 1.8);
        item.position.y += pointer.y * (5 - item.layer * 1.4);
        item.position.skew += pointer.x * 0.012;
      });
      items.sort((left, right) => left.position.zIndex - right.position.zIndex);
      items.forEach((item, index) => drawCard(item, item.position, index));
      texture.needsUpdate = true;
      state.activeLayer = state.order[0];
      state.status = isActive ? "active" : "parked";
      state.pageActive = isActive;
    }

    state.cycleStarted = performance.now();
    state.swapStarted = null;
    state.swapTimeline = null;
    placeOrder();
    state.forceSwap = () => startSwap(performance.now());
    state.seekSwap = (seconds) => {
      if (!state.swapTimeline) startSwap(performance.now());
      state.swapTimeline.pause(clamp(seconds, 0, SWAP_DURATION / 1000));
      draw(performance.now());
      return state.order.map((cardIndex) => ({
        cardIndex,
        x: motion[cardIndex].x,
        y: motion[cardIndex].y,
        z: motion[cardIndex].z,
        zIndex: motion[cardIndex].zIndex,
        scale: motion[cardIndex].scale,
      }));
    };
    images.forEach((image) => image.addEventListener("load", () => draw(performance.now()), { once: true }));

    let animationFrame = 0;
    function render(now) {
      animationFrame = requestAnimationFrame(render);
      draw(now);
    }
    render(performance.now());
    state.stop = () => cancelAnimationFrame(animationFrame);
    return true;
  }

  function poll() {
    const view = window.Main && window.Main.maskRevealView;
    const material = view && view.pageMaterials && view.pageMaterials[PAGE_MATERIAL_INDEX];
    if (mount(view, material)) return;
    window.setTimeout(poll, 100);
  }

  window.addEventListener("load", () => window.setTimeout(poll, 650));
})();
