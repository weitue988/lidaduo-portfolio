(function initProject06MetallicPaint() {
  "use strict";

  // ReactBits Metallic Paint adapted to the book's existing Three renderer.
  // The output replaces only page 9's UV-space overlay texture.
  const pageMaterialIndex = 8;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  const vertexShader = `
    varying vec2 vP;
    void main() {
      vP = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision highp float;
    varying vec2 vP;
    uniform sampler2D u_tex;
    uniform float u_time, u_ratio, u_imgRatio, u_seed, u_scale, u_refract, u_blur, u_liquid;
    uniform float u_bright, u_contrast, u_angle, u_fresnel, u_sharp, u_wave, u_noise, u_chroma;
    uniform float u_distort, u_contour;
    uniform vec3 u_lightColor, u_darkColor, u_tint;
    vec3 sC, sM;

    vec3 pW(vec3 v) {
      vec3 i = floor(v), f = fract(v), s = sign(fract(v * .5) - .5);
      vec3 h = fract(sM * i + i.yzx), c = f * (f - 1.);
      return s * c * ((h * 16. - 4.) * c - 1.);
    }
    vec3 aF(vec3 b, vec3 c) { return pW(b + c.zxy - pW(b.zxy + c.yzx) + pW(b.yzx + c.xyz)); }
    vec3 lM(vec3 s, vec3 p) { return (p + aF(s, p)) * .5; }
    vec2 fA() {
      vec2 c = vP - .5;
      c.x *= u_ratio > u_imgRatio ? u_ratio / u_imgRatio : 1.;
      c.y *= u_ratio > u_imgRatio ? 1. : u_imgRatio / u_ratio;
      return vec2(c.x + .5, .5 - c.y);
    }
    vec2 rot(vec2 p, float r) { float c = cos(r), s = sin(r); return vec2(p.x * c + p.y * s, p.y * c - p.x * s); }
    float bM(vec2 c, float t) {
      vec2 l = smoothstep(vec2(0.), vec2(t), c), u = smoothstep(vec2(0.), vec2(t), 1. - c);
      return l.x * l.y * u.x * u.y;
    }
    float mG(float hi, float lo, float t, float sh, float cv) {
      sh *= (2. - u_sharp);
      float ci = smoothstep(.15, .85, cv), r = lo;
      float e1 = .08 / u_scale;
      r = mix(r, hi, smoothstep(0., sh * 1.5, t));
      r = mix(r, lo, smoothstep(e1 - sh, e1 + sh, t));
      float e2 = e1 + .05 / u_scale * (1. - ci * .35);
      r = mix(r, hi, smoothstep(e2 - sh, e2 + sh, t));
      float e3 = e2 + .025 / u_scale * (1. - ci * .45);
      r = mix(r, lo, smoothstep(e3 - sh, e3 + sh, t));
      float e4 = e1 + .1 / u_scale;
      r = mix(r, hi, smoothstep(e4 - sh, e4 + sh, t));
      float rm = 1. - e4, gT = clamp((t - e4) / rm, 0., 1.);
      return mix(r, mix(hi, lo, smoothstep(0., 1., gT)), smoothstep(e4 - sh * .5, e4 + sh * .5, t));
    }
    void main() {
      sC = fract(vec3(.7548, .5698, .4154) * (u_seed + 17.31)) + .5;
      sM = fract(sC.zxy - sC.yzx * 1.618);
      vec2 sc = vec2(vP.x * u_ratio, 1. - vP.y);
      sc = rot(sc - .5, u_angle * 3.14159 / 180.) + .5;
      sc = clamp(sc, 0., 1.);
      float sl = sc.x - sc.y, an = u_time * .001;
      vec2 iC = fA();
      vec4 texSample = texture2D(u_tex, iC);
      float dp = texSample.r, shapeMask = texSample.a;
      vec3 hi = u_lightColor * u_bright, lo = u_darkColor * (2. - u_bright);
      vec2 fC = sc - .5;
      float rd = length(fC + vec2(0., sl * .15));
      vec2 ag = rot(fC, (.22 - sl * .18) * 3.14159);
      float cv = 1. - pow(rd * 1.65, 1.15);
      cv *= pow(sc.y, .35);
      float vs = shapeMask;
      vs *= bM(iC, .01);
      vs = min(vs + pow(1. - cv, u_fresnel) * .3 * vs, 1.);
      float mT = an * .0625;
      vec3 wO = vec3(-1.05, 1.35, 1.55);
      vec3 wA = aF(vec3(31., 73., 56.), mT + wO) * .22 * u_wave;
      vec3 wB = aF(vec3(24., 64., 42.), mT - wO.yzx) * .22 * u_wave;
      vec2 nC = sc * 45. * u_noise;
      nC += aF(sC.zxy, an * .17 * sC.yzx - sc.yxy * .35).xy * 18. * u_wave;
      vec3 tC = lM(sC + 1.618, lM(sC, vec3(.00041, .00053, .00076) * mT + wB * nC.x + wA * nC.y));
      float tb = sin(tC.x * 3.14159);
      float noiseVal = pW(vec3(sc * 8. + an, an * .5)).x;
      float edgeFactor = smoothstep(0., .5, dp) * smoothstep(1., .5, dp);
      float lD = dp + (1. - dp) * u_liquid * tb + noiseVal * u_distort * .15 * edgeFactor;
      float fl = ag.x + sl + noiseVal * sl * u_distort * edgeFactor;
      fl *= mix(1., 1. - dp * .5, u_contour);
      fl -= dp * u_contour * .8;
      float eI = smoothstep(0., 1., lD) * smoothstep(1., 0., lD);
      fl -= tb * sl * 1.8 * eI;
      float cA = cv * clamp(pow(sc.y, .12), .25, 1.);
      fl *= (.12 + (1.05 - lD) * cA) * smoothstep(1., .65, lD);
      fl += smoothstep(.08, .18, sc.y) * smoothstep(.38, .18, sc.y) * .16;
      fl += smoothstep(.08, .18, 1. - sc.y) * smoothstep(.38, .18, 1. - sc.y) * .025;
      fl *= (.45 + pow(sc.y, 2.) * .55) * u_scale - an;
      float rO = clamp(1. - cv, 0., 1.) + cv * tb * .025;
      rO += smoothstep(-.12, .18, sc.y) * smoothstep(.48, .08, sc.y) * smoothstep(.35, .55, cv) * smoothstep(.95, .35, cv) * 4.5;
      rO -= sl;
      float bO = clamp(1. - cv, 0., 1.) * 1.25 + smoothstep(-.02, .35, sc.y) * smoothstep(.75, .08, sc.y) * smoothstep(.35, .55, cv) * smoothstep(.75, .35, cv) * .9 - lD * .18;
      rO *= u_refract * u_chroma;
      bO *= u_refract * u_chroma;
      vec3 col = vec3(
        mG(hi.r, lo.r, fract(fl + rO), u_blur + .018 + u_refract * cv * .025, cv),
        mG(hi.g, lo.g, fract(fl), u_blur + .008 / max(.01, 1. - sl), cv),
        mG(hi.b, lo.b, fract(fl - bO), u_blur + .008, cv)
      );
      col = clamp((col - .5) * u_contrast + .5, 0., 1.);
      col = mix(col, 1. - min(vec3(1.), (1. - col) / max(u_tint, vec3(.001))), length(u_tint - 1.) * .5);
      gl_FragColor = vec4(col * vs, vs);
    }
  `;

  function mount(view, material) {
    const THREE = window.THREE;
    const shader = material && material.userData && material.userData.shader;
    if (!THREE || !shader || !view.renderer || !shader.uniforms.map4) return false;

    const target = new THREE.WebGLRenderTarget(1050, 600, {
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });
    target.texture.flipY = false;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const materialPaint = new THREE.ShaderMaterial({
      uniforms: {
        u_tex: { value: null }, u_time: { value: 0 }, u_ratio: { value: 1.75 }, u_imgRatio: { value: 1.75 },
        u_seed: { value: 42 }, u_scale: { value: 4 }, u_refract: { value: 0.016 }, u_blur: { value: 0.015 },
        u_liquid: { value: 0.75 }, u_bright: { value: 2 }, u_contrast: { value: 0.5 }, u_angle: { value: 0 },
        u_fresnel: { value: 1 }, u_sharp: { value: 1 }, u_wave: { value: 1 }, u_noise: { value: 0.5 },
        u_chroma: { value: 2 }, u_distort: { value: 1 }, u_contour: { value: 0.2 },
        u_lightColor: { value: new THREE.Color("#ffffff") }, u_darkColor: { value: new THREE.Color("#000000") },
        u_tint: { value: new THREE.Color("#94a3b8") },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), materialPaint);
    scene.add(quad);
    const isolatedLoadingManager = new THREE.LoadingManager();
    new THREE.TextureLoader(isolatedLoadingManager).load("project-06-metallic-depth.png", (mask) => {
      mask.flipY = true;
      mask.minFilter = THREE.LinearFilter;
      mask.magFilter = THREE.LinearFilter;
      materialPaint.uniforms.u_tex.value = mask;
    });

    const originalMap = shader.uniforms.map4.value;
    shader.uniforms.map4.value = target.texture;
    window.__PROJECT06_METALLIC__ = {
      target, scene, camera, materialPaint, originalMap,
      disable() {
        shader.uniforms.map4.value = originalMap;
        target.dispose();
        materialPaint.dispose();
        window.__PROJECT06_METALLIC__.disabled = true;
      },
    };
    let time = 0;
    let lastTime = performance.now();
    let frame;
    const originalClearAlpha = view.renderer.getClearAlpha();
    const render = (now) => {
      frame = requestAnimationFrame(render);
      if (!materialPaint.uniforms.u_tex.value || window.__PROJECT06_METALLIC__.disabled) return;
      const current = view.currPageIndex || 0;
      if (Math.abs(current - 9) > 1) return;
      const delta = Math.min(50, Math.max(0, now - lastTime));
      lastTime = now;
      time += delta * 0.3;
      materialPaint.uniforms.u_time.value = time;
      view.renderer.setRenderTarget(target);
      view.renderer.setClearAlpha(0);
      view.renderer.clear();
      view.renderer.render(scene, camera);
      view.renderer.setRenderTarget(null);
      view.renderer.setClearAlpha(originalClearAlpha);
    };
    render();
    window.__PROJECT06_METALLIC__.stop = () => cancelAnimationFrame(frame);
    return true;
  }

  function poll() {
    const view = window.Main && window.Main.maskRevealView;
    const material = view && view.pageMaterials && view.pageMaterials[pageMaterialIndex];
    if (mount(view, material)) return;
    window.setTimeout(poll, 200);
  }

  window.addEventListener("load", () => window.setTimeout(poll, 600));
})();
