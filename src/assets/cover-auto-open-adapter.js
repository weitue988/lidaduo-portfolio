(function initCoverAutoOpen() {
  "use strict";

  // The landing pose remains the original settled cover. The 5s dwell belongs
  // to the post-click near-cover pose, before the original opening tweens.
  const params = new URLSearchParams(window.location.search);
  if (params.get("autoOpen") === "off") return;

  // The source timeline finishes the book position/rotation at 3.10s and does
  // not begin the first page-opening tween until 3.15s. Pause on that exact
  // boundary so the approach remains continuous and the cover is fully front-on.
  const nearCoverAt = 3.15;
  const visibleDwellMs = 5000;
  let started = false;
  let animationFrame = 0;
  let lastFrame = performance.now();
  let elapsed = 0;
  let dwellTimeline = null;

  const state = (window.__COVER_AUTO_OPEN__ = {
    visibleDwellMs,
    nearCoverAt,
    elapsedMs: 0,
    status: "waiting-for-interaction",
    triggered: false,
    timelineDuration: 0,
    timelineTime: 0,
  });

  function publishStatus() {
    document.documentElement.dataset.coverAutoOpenStatus = state.status;
    document.documentElement.dataset.coverAutoOpenElapsed = String(state.elapsedMs);
    document.documentElement.dataset.coverAutoOpenTriggered = String(state.triggered);
    document.documentElement.dataset.coverAutoOpenTimelineTime = String(state.timelineTime);
  }

  function updateTimelineState() {
    if (!dwellTimeline) return;
    state.timelineTime = Number(dwellTimeline.time().toFixed(3));
    state.timelineDuration = Number(dwellTimeline.totalDuration().toFixed(3));
  }

  function onVisibilityChange() {
    lastFrame = performance.now();
    publishStatus();
  }

  function finishDwell() {
    if (!dwellTimeline) return;
    updateTimelineState();
    state.status = "opening";
    publishStatus();
    dwellTimeline.resume();
  }

  function tick(now) {
    animationFrame = requestAnimationFrame(tick);
    if (!dwellTimeline) return;

    // Let the source approach play continuously. Pause only when the original
    // timeline reaches the first page-opening boundary.
    if (dwellTimeline.paused() === false) {
      updateTimelineState();
      if (
        state.status === "approaching-front-cover" &&
        state.timelineTime >= nearCoverAt
      ) {
        dwellTimeline.pause(nearCoverAt);
        elapsed = 0;
        state.elapsedMs = 0;
        state.status = "front-cover-dwell";
      }
      publishStatus();
      return;
    }

    if (document.visibilityState !== "visible") {
      lastFrame = now;
      state.status = "front-cover-paused-hidden";
      publishStatus();
      return;
    }

    const delta = Math.min(100, Math.max(0, now - lastFrame));
    lastFrame = now;
    elapsed += delta;
    state.elapsedMs = Math.round(elapsed);
    state.status = "front-cover-dwell";
    updateTimelineState();
    publishStatus();

    if (elapsed >= visibleDwellMs) finishDwell();
  }

  function findEnterTimeline(view, before) {
    const parent = view.flipTimeline && view.flipTimeline._dp;
    if (!parent || typeof parent.getChildren !== "function") return null;
    const after = parent.getChildren(true, true, true);
    return after.find((candidate) => {
      if (before.includes(candidate) || candidate === view.flipTimeline) return false;
      if (typeof candidate.totalDuration !== "function" || typeof candidate.getChildren !== "function") return false;
      return candidate.totalDuration() > 7 && candidate.getChildren(true, true, true).length >= 18;
    }) || null;
  }

  function startAfterClick(view, event, originalEnter) {
    if (started || view.ENTERING || view.ENTERED) return;
    started = true;
    state.triggered = true;
    state.status = "approaching-near-cover";
    publishStatus();

    const parent = view.flipTimeline && view.flipTimeline._dp;
    const before = parent && parent.getChildren ? parent.getChildren(true, true, true) : [];
    originalEnter.call(view, event);
    dwellTimeline = findEnterTimeline(view, before);

    if (!dwellTimeline) {
      // Keep the original behavior if the bundled GSAP internals change.
      state.status = "opening-fallback";
      publishStatus();
      return;
    }

    updateTimelineState();
    state.elapsedMs = 0;
    state.status = "approaching-front-cover";
    publishStatus();
  }

  function install(view) {
    if (!view || !view.enterButton || view.enterButton.__coverDwellInstalled) return false;
    view.enterButton.__coverDwellInstalled = true;
    const originalEnter = view.enterBook;

    // The original listener is on body. Capture here so the landing pose is
    // never mistaken for the post-click dwell state.
    view.enterButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      startAfterClick(view, event, originalEnter);
    }, { capture: true });

    document.documentElement.dataset.coverAutoOpenStatus = state.status;
    publishStatus();
    animationFrame = requestAnimationFrame(tick);

    return true;
  }

  function poll() {
    const view = window.Main && window.Main.maskRevealView;
    if (view && install(view)) return;
    window.setTimeout(poll, 50);
  }

  document.addEventListener("visibilitychange", onVisibilityChange, { passive: true });
  publishStatus();
  poll();

  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(animationFrame);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }, { once: true });
})();
