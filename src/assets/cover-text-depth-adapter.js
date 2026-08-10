(function initTextDepth() {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const enabled = params.get("textDepth") !== "off" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.dataset.textDepth = enabled ? "waiting" : "off";
  // Case 001's approved holographic text uses a pointer depth coefficient of
  // 10 with 0.16 smoothing. Apply the same readable strength in cover UVs.
  const MAX_COVER_OFFSET_X = 10 / 1050;
  const MAX_COVER_OFFSET_Y = 8 / 1200;
  const transparentTextureBytes = new Uint8Array([0, 0, 0, 0]);

  let animationFrame = 0;
  let disposed = false;
  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };

  function makeTransparentTexture(THREE) {
    const texture = new THREE.DataTexture(
      transparentTextureBytes,
      1,
      1,
      THREE.RGBAFormat,
    );
    texture.needsUpdate = true;
    return texture;
  }

  function setupCover(view, THREE) {
    const material = view.coverMaterial;
    if (!material || material.__textDepthAdapterInstalled) return false;
    material.__textDepthAdapterInstalled = true;
    const previous = material.onBeforeCompile;
    const state = { shader: null, texture: null };
    material.onBeforeCompile = (shader, renderer) => {
      if (typeof previous === "function") previous(shader, renderer);
      shader.uniforms.coverTextMap = { value: state.texture || makeTransparentTexture(THREE) };
      shader.uniforms.coverTextOffset = { value: new THREE.Vector2(0, 0) };
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_pars_fragment>",
        `#include <map_pars_fragment>
          uniform sampler2D coverTextMap;
          uniform vec2 coverTextOffset;
        `,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>
          vec4 coverTextSample = mapTexelToLinear(texture2D(coverTextMap, vUv + coverTextOffset));
          diffuseColor.rgb = mix(diffuseColor.rgb, coverTextSample.rgb, coverTextSample.a);
        `,
      );
      state.shader = shader;
      material.userData.textDepthShader = shader;
      if (state.texture) shader.uniforms.coverTextMap.value = state.texture;
    };
    material.needsUpdate = true;

    new THREE.TextureLoader().load("cover-text-overlay.png", (texture) => {
      texture.flipY = false;
      texture.premultiplyAlpha = !!(window.Main && window.Main.PREMULTIPLIEDALPHA);
      texture.needsUpdate = true;
      state.texture = texture;
      if (state.shader) state.shader.uniforms.coverTextMap.value = texture;
    });
    return true;
  }

  function setupPages(view, THREE) {
    if (!view.pageMaterials) return false;
    const empty = makeTransparentTexture(THREE);
    let ready = true;
    view.pageMaterials.forEach((material) => {
      const shader = material.userData && material.userData.shader;
      if (!shader) { ready = false; return; }
      if (!material.__textDepthAdapterPage) {
        material.__textDepthAdapterPage = true;
        material.__textDepthAdapterOriginalMap2 = shader.uniforms.map2 && shader.uniforms.map2.value;
      }
      // Every spread already contains its complete typography in the base map.
      // Keep the legacy parallax slot transparent in every mode to prevent the
      // duplicate text layer from returning after a rebuild or reduced-motion run.
      if (shader.uniforms.map2) shader.uniforms.map2.value = empty;
      if (shader.uniforms.map2Offset) shader.uniforms.map2Offset.value.set(0, 0);
      if (shader.uniforms.moveFactor) shader.uniforms.moveFactor.value.set(0, 0);
    });
    return ready;
  }

  function onPointerMove(event) {
    pointer.x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
    pointer.y = (event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
  }

  function resetPointer() {
    pointer.x = 0;
    pointer.y = 0;
  }

  function poll() {
    const view = window.Main && window.Main.maskRevealView;
    const THREE = window.THREE;
    if (!view || !THREE) {
      window.setTimeout(poll, 50);
      return;
    }
    setupCover(view, THREE);
    if (!setupPages(view, THREE)) {
      window.setTimeout(poll, 100);
      return;
    }
    if (!enabled) {
      window.__TEXT_DEPTH__ = { enabled: false, status: "static-title" };
      document.documentElement.dataset.textDepth = "static-title";
      return;
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", resetPointer, { passive: true });
    window.addEventListener("blur", resetPointer, { passive: true });
    function render() {
      if (disposed) return;
      animationFrame = requestAnimationFrame(render);
      eased.x += (pointer.x - eased.x) * 0.16;
      eased.y += (pointer.y - eased.y) * 0.16;
      const coverShader = view.coverMaterial && view.coverMaterial.userData && view.coverMaterial.userData.textDepthShader;
      if (coverShader && coverShader.uniforms.coverTextOffset) {
        coverShader.uniforms.coverTextOffset.value.set(
          eased.x * MAX_COVER_OFFSET_X,
          -eased.y * MAX_COVER_OFFSET_Y,
        );
      }
    }
    window.__TEXT_DEPTH__ = { enabled: true, status: "active" };
    document.documentElement.dataset.textDepth = "active";
    animationFrame = requestAnimationFrame(render);
  }

  window.addEventListener("pagehide", () => {
    disposed = true;
    cancelAnimationFrame(animationFrame);
    window.removeEventListener("pointermove", onPointerMove);
    document.documentElement.removeEventListener("pointerleave", resetPointer);
    window.removeEventListener("blur", resetPointer);
  }, { once: true });
  poll();
})();
