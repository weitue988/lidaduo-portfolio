# Light Rays Background State Contract

## Scope

- Selected platform: desktop first; mobile behavior requires separate QA.
- Evidence source: ReactBits Background Studio URL supplied by the user.
- Selected parameters: `raysOrigin=top-center`, `raysColor=#ebf3a8`, `raysSpeed=1`, `lightSpread=0.5`, `rayLength=3`, `pulsating=true`, `fadeDistance=1`, `saturation=1.3`, `followMouse=true`, `mouseInfluence=0.2`, `noiseAmount=0`, `distortion=0`.

## Locked Baseline

- Default visual source: `qa/cloudflare-pages-20260805/06-formal-opened.png` and the deployed runtime at `https://lidaduo-portfolio.pages.dev`.
- Reading/final state source: `qa/cloudflare-pages-20260805/07-formal-final.png`.
- The book model, page images, footer, Open book control, navigation arrows, resource links and all settled coordinates are locked.
- Existing Three.js, GSAP, page morph, camera, lighting and interaction controllers must not change.

## Motion-Only Envelope

- Installation stage: only new LightRays component/config files and required dependencies may change.
- Integration stage: only a new background layer behind the existing canvas may animate.
- The LightRays layer must use `pointer-events: none`; mouse input may be observed globally but must never block book hover, click, drag, keyboard or resource links.
- Existing background may be hidden only after a side-by-side visual review; it must remain recoverable through one class or feature flag.

## Forbidden Effects

- No React migration of the existing runtime.
- No changes to book position, scale, material, lighting, shadows or page contrast during installation.
- No additional blur, glow, particles, noise or distortion beyond the supplied ReactBits parameters.
- No canvas layer above the book or footer.
- No mobile rollout before desktop performance and interaction QA pass.

## QA Gates

- `npm run build` passes and the existing byte-validation behavior remains understood.
- Installation-only settled screenshots must remain identical because the component is not mounted.
- After future integration: first frame, opened state and final resource state must be captured at 1280x720.
- Open book, 11 page turns, keyboard, arrows, drag and resource links must still pass with zero console/page/network errors.
- User approval is required before deploying the new background.
