(function initLightRaysBackground() {
  "use strict";

  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get("lightRays") === "off") return;

  const config = Object.freeze({
    raysOrigin: "top-center",
    raysColor: "#ebf3a8",
    canvasColor: "#120f17",
    raysSpeed: 1,
    lightSpread: 0.5,
    rayLength: 3,
    pulsating: true,
    fadeDistance: 1,
    saturation: 1.3,
    followMouse: true,
    mouseInfluence: 0.2,
    noiseAmount: 0,
    distortion: 0,
  });

  const vertexShader = `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision highp float;

    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec2 rayPos;
    uniform vec2 rayDir;
    uniform vec3 raysColor;
    uniform vec3 canvasColor;
    uniform float raysSpeed;
    uniform float lightSpread;
    uniform float rayLength;
    uniform float pulsating;
    uniform float fadeDistance;
    uniform float saturation;
    uniform vec2 mousePos;
    uniform float mouseInfluence;
    uniform float noiseAmount;
    uniform float distortion;

    varying vec2 vUv;

    float noise(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float rayStrength(
      vec2 raySource,
      vec2 rayRefDirection,
      vec2 coord,
      float seedA,
      float seedB,
      float speed
    ) {
      vec2 sourceToCoord = coord - raySource;
      vec2 dirNorm = normalize(sourceToCoord);
      float cosAngle = dot(dirNorm, rayRefDirection);
      float distortedAngle = cosAngle
        + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
      float spreadFactor = pow(
        max(distortedAngle, 0.0),
        1.0 / max(lightSpread, 0.001)
      );
      float distanceToSource = length(sourceToCoord);
      float maxDistance = iResolution.x * rayLength;
      float lengthFalloff = clamp(
        (maxDistance - distanceToSource) / maxDistance,
        0.0,
        1.0
      );
      float fadeFalloff = clamp(
        (iResolution.x * fadeDistance - distanceToSource)
          / (iResolution.x * fadeDistance),
        0.5,
        1.0
      );
      float pulse = pulsating > 0.5
        ? 0.8 + 0.2 * sin(iTime * speed * 3.0)
        : 1.0;
      float baseStrength = clamp(
        (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed))
          + (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
        0.0,
        1.0
      );

      return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
    }

    void main() {
      vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);
      vec2 finalRayDir = rayDir;

      if (mouseInfluence > 0.0) {
        vec2 mouseScreenPos = mousePos * iResolution.xy;
        vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
        finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
      }

      vec4 rays1 = vec4(1.0) * rayStrength(
        rayPos,
        finalRayDir,
        coord,
        36.2214,
        21.11349,
        1.5 * raysSpeed
      );
      vec4 rays2 = vec4(1.0) * rayStrength(
        rayPos,
        finalRayDir,
        coord,
        22.3991,
        18.0234,
        1.1 * raysSpeed
      );
      vec4 rays = rays1 * 0.5 + rays2 * 0.4;

      if (noiseAmount > 0.0) {
        float n = noise(coord * 0.01 + iTime * 0.1);
        rays.rgb *= 1.0 - noiseAmount + noiseAmount * n;
      }

      float brightness = 1.0 - coord.y / iResolution.y;
      rays.r *= 0.1 + brightness * 0.8;
      rays.g *= 0.3 + brightness * 0.6;
      rays.b *= 0.5 + brightness * 0.5;

      if (saturation != 1.0) {
        float gray = dot(rays.rgb, vec3(0.299, 0.587, 0.114));
        rays.rgb = mix(vec3(gray), rays.rgb, saturation);
      }

      rays.rgb *= raysColor;
      float rayAlpha = clamp(rays.a, 0.0, 1.0);
      vec3 composedColor = rays.rgb * rayAlpha + canvasColor * (1.0 - rayAlpha);
      gl_FragColor = vec4(composedColor, 1.0);
    }
  `;

  const mouse = { x: 0.5, y: 0.5 };
  const smoothMouse = { x: 0.5, y: 0.5 };
  let animationFrame = 0;
  let disposed = false;

  function hexToRgb(THREE, hex) {
    return new THREE.Color(hex);
  }

  function updatePlacement(view, uniforms) {
    const renderer = view.renderer;
    const size = new window.THREE.Vector2();
    renderer.getDrawingBufferSize(size);
    const width = Math.max(size.x, 1);
    const height = Math.max(size.y, 1);

    uniforms.iResolution.value.set(width, height);
    uniforms.rayPos.value.set(width * 0.5, height * -0.2);
    uniforms.rayDir.value.set(0, 1);
  }

  function mount(view) {
    const THREE = window.THREE;
    if (!THREE || !view.groundPlane || !view.renderer) return false;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2(1, 1) },
      rayPos: { value: new THREE.Vector2(0, 0) },
      rayDir: { value: new THREE.Vector2(0, 1) },
      raysColor: { value: hexToRgb(THREE, config.raysColor) },
      canvasColor: { value: hexToRgb(THREE, config.canvasColor) },
      raysSpeed: { value: config.raysSpeed },
      lightSpread: { value: config.lightSpread },
      rayLength: { value: config.rayLength },
      pulsating: { value: config.pulsating && !reducedMotion ? 1 : 0 },
      fadeDistance: { value: config.fadeDistance },
      saturation: { value: config.saturation },
      mousePos: { value: new THREE.Vector2(0.5, 0.5) },
      mouseInfluence: {
        value: config.followMouse && !reducedMotion ? config.mouseInfluence : 0,
      },
      noiseAmount: { value: config.noiseAmount },
      distortion: { value: config.distortion },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: true,
      depthTest: true,
      transparent: false,
    });
    const originalClearColor = view.renderer.getClearColor(new THREE.Color()).clone();
    const originalClearAlpha = view.renderer.getClearAlpha();

    window.__LIGHT_RAYS_BACKGROUND__ = {
      config,
      originalMaterial: view.groundPlane.material,
      originalClearColor,
      originalClearAlpha,
      material,
      disable() {
        disposed = true;
        cancelAnimationFrame(animationFrame);
        view.groundPlane.material = this.originalMaterial;
        view.renderer.setClearColor(this.originalClearColor, this.originalClearAlpha);
        material.dispose();
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("mousemove", handleMouseMove);
      },
    };

    view.renderer.setClearColor(config.canvasColor, 1);
    view.groundPlane.material = material;

    function handleResize() {
      updatePlacement(view, uniforms);
    }

    function handleMouseMove(event) {
      mouse.x = event.clientX / Math.max(window.innerWidth, 1);
      mouse.y = event.clientY / Math.max(window.innerHeight, 1);
    }

    function render(time) {
      if (disposed) return;
      if (!reducedMotion) uniforms.iTime.value = time * 0.001;

      if (config.followMouse && !reducedMotion) {
        const smoothing = 0.92;
        smoothMouse.x = smoothMouse.x * smoothing + mouse.x * (1 - smoothing);
        smoothMouse.y = smoothMouse.y * smoothing + mouse.y * (1 - smoothing);
        uniforms.mousePos.value.set(smoothMouse.x, smoothMouse.y);
      }

      animationFrame = requestAnimationFrame(render);
    }

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    updatePlacement(view, uniforms);
    animationFrame = requestAnimationFrame(render);
    return true;
  }

  function waitForBookRuntime() {
    const view = window.Main && window.Main.maskRevealView;
    if (view && mount(view)) return;
    window.setTimeout(waitForBookRuntime, 50);
  }

  waitForBookRuntime();
})();
