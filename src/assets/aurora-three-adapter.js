(function initAuroraCover() {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  if (params.get("aurora") === "off") {
    document.documentElement.dataset.aurora = "off";
    return;
  }

  const config = Object.freeze({
    amplitude: 1,
    blend: 0.5,
    colors: ["#5EE7FF", "#7BFFB2", "#C86BFF"],
    speed: 0.18,
    mouseInfluence: 0.2,
  });
  let animationFrame = 0;
  let disposed = false;
  const pointer = { x: 0.5, y: 0.5 };
  const eased = { x: 0.5, y: 0.5 };

  function mount(view) {
    const THREE = window.THREE;
    const material = view && view.coverMaterial;
    if (!THREE || !material || material.__auroraCoverInstalled) return false;
    material.__auroraCoverInstalled = true;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const previous = material.onBeforeCompile;
    const state = (window.__AURORA_COVER__ = {
      config,
      shader: null,
      textMask: null,
      reducedMotion,
      disable() {
        disposed = true;
        cancelAnimationFrame(animationFrame);
        if (this.shader) this.shader.uniforms.uAuroraStrength.value = 0;
        window.removeEventListener("pointermove", onPointerMove);
        document.documentElement.dataset.aurora = "off";
      },
    });

    material.onBeforeCompile = (shader, renderer) => {
      if (typeof previous === "function") previous(shader, renderer);
      shader.uniforms.uAuroraTime = { value: 0 };
      shader.uniforms.uAuroraStrength = { value: config.blend };
      shader.uniforms.uAuroraMouse = { value: new THREE.Vector2(0.5, 0.5) };
      shader.uniforms.uAuroraColor1 = { value: new THREE.Color(config.colors[0]) };
      shader.uniforms.uAuroraColor2 = { value: new THREE.Color(config.colors[1]) };
      shader.uniforms.uAuroraColor3 = { value: new THREE.Color(config.colors[2]) };
      shader.uniforms.uAuroraTextMask = {
        value: state.textMask || new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat),
      };
      shader.uniforms.uAuroraTextMask.value.needsUpdate = true;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        `#include <common>
          uniform float uAuroraTime;
          uniform float uAuroraStrength;
          uniform vec2 uAuroraMouse;
          uniform vec3 uAuroraColor1;
          uniform vec3 uAuroraColor2;
          uniform vec3 uAuroraColor3;
          uniform sampler2D uAuroraTextMask;

          float auroraHash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }
          float auroraNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(auroraHash(i), auroraHash(i + vec2(1.0, 0.0)), f.x),
              mix(auroraHash(i + vec2(0.0, 1.0)), auroraHash(i + vec2(1.0, 1.0)), f.x),
              f.y
            );
          }
          float auroraRibbon(vec2 uv, float offset, float frequency, float phase) {
            float drift = uAuroraTime * ${config.speed.toFixed(2)} * (0.7 + phase * 0.2);
            float wave = sin(uv.x * frequency + drift + phase * 6.2831) * 0.11;
            wave += sin(uv.x * frequency * 0.47 - drift * 0.8 + phase) * 0.07;
            wave += (auroraNoise(vec2(uv.x * 2.4 + phase, drift * 0.16)) - 0.5) * 0.06;
            float center = 0.58 + offset + wave * ${config.amplitude.toFixed(1)};
            float width = 0.15 + 0.035 * sin(uv.x * 2.0 + phase);
            return 1.0 - smoothstep(0.0, width, abs(uv.y - center));
          }
          vec3 auroraCoverColor(vec2 uv) {
            uv += (uAuroraMouse - 0.5) * ${config.mouseInfluence.toFixed(1)} * 0.08;
            float r1 = auroraRibbon(uv, -0.20, 4.7, 0.0);
            float r2 = auroraRibbon(uv, 0.02, 3.7, 1.8);
            float r3 = auroraRibbon(uv, 0.24, 5.6, 3.4);
            float glow = clamp(r1 + r2 * 0.82 + r3 * 0.68, 0.0, 1.35);
            vec3 color = mix(uAuroraColor1, uAuroraColor2, clamp(uv.x, 0.0, 1.0));
            color = mix(color, uAuroraColor3, smoothstep(0.48, 1.0, uv.x) * 0.54);
            vec3 darkBase = vec3(0.027, 0.031, 0.047);
            return darkBase + color * glow * 0.46;
          }
        `,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>
          vec4 auroraTextMask = texture2D(uAuroraTextMask, vUv);
          vec3 auroraColor = auroraCoverColor(vUv);
          float auroraMix = uAuroraStrength * (1.0 - auroraTextMask.a);
          diffuseColor.rgb = mix(diffuseColor.rgb, auroraColor, auroraMix);
        `,
      );
      state.shader = shader;
      material.userData.auroraShader = shader;
      if (state.textMask) shader.uniforms.uAuroraTextMask.value = state.textMask;
    };
    material.needsUpdate = true;

    new THREE.TextureLoader().load("cover-text-mask.png", (texture) => {
      texture.flipY = false;
      texture.needsUpdate = true;
      state.textMask = texture;
      if (state.shader) state.shader.uniforms.uAuroraTextMask.value = texture;
    });

    function onPointerMove(event) {
      pointer.x = event.clientX / Math.max(window.innerWidth, 1);
      pointer.y = 1 - event.clientY / Math.max(window.innerHeight, 1);
    }
    function render(now) {
      if (disposed) return;
      animationFrame = requestAnimationFrame(render);
      if (!state.shader) return;
      if (!reducedMotion) state.shader.uniforms.uAuroraTime.value = now * 0.001;
      if (!reducedMotion) {
        eased.x += (pointer.x - eased.x) * 0.08;
        eased.y += (pointer.y - eased.y) * 0.08;
        state.shader.uniforms.uAuroraMouse.value.set(eased.x, eased.y);
      }
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.dataset.aurora = reducedMotion ? "frozen-cover" : "active-cover";
    animationFrame = requestAnimationFrame(render);
    return true;
  }

  function poll() {
    const view = window.Main && window.Main.maskRevealView;
    if (view && mount(view)) return;
    window.setTimeout(poll, 50);
  }

  poll();
})();
