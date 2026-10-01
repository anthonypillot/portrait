# Repository agent notes

## Commands and prerequisites

- Install with `npm ci`; the locked Vite 8 requires Node `^20.19.0 || >=22.12.0`.
- `npm run dev` and `npm run preview` use port **9393**. Preserve `server.allowedHosts: ["anthonypillot.fr"]` in `vite.config.ts`.
- `npm run build` typechecks both `src/` and `scripts/`, then builds `dist/`. For typechecking alone, use `npx tsc --noEmit`.
- `npm run render` requires `ffmpeg` on `PATH`; `npm run verify` requires `ffprobe`. Both commands need an installed Chromium browser: `playwright-core` does not bundle one. `scripts/browser.ts` detects Brave/Chrome on macOS and Chromium/Chrome on Linux; set `CHROME_PATH` to override the executable.
- Render and verify start their own Vite servers on **5178** and **5179**, respectively, with `strictPort: true`; those ports must be free.

## Media pipeline

- The homepage plays the pre-rendered `/movie.mp4`, not the canvas animation. Changes to `src/film.ts`, `src/timeline.ts`, or `scripts/soundtrack.ts` require `npm run render` to update the visible film.
- Rendering regenerates the tracked `public/movie.mp4`, `public/poster.jpg`, and `public/soundtrack.wav`. For media changes, run **`npm run render` → `npm run build` → `npm run verify`** so `dist/` includes the updated assets. The renderer atomically replaces the MP4 via the ignored `public/.movie-render.mp4`.
- `src/timeline.ts` exports `FILM`, shared by animation, soundtrack, player, renderer, and verifier. Keep timing and scene definitions there; adding a scene also requires its entry in `SCENE_RENDERERS` in `src/film.ts`.
- `index.html` loads `src/main.ts`; `?render` switches that entrypoint to a canvas. Render/verify depend on `window.filmReady` after fonts load and `window.renderAt(seconds)` returning a JPEG data URL.
- Keep `renderFilm(ctx, seconds)` deterministic and periodic. Verification compares the frames at zero and `FILM.duration`, checks the visual seam, and checks the soundtrack's end-to-start sample jump.
- `npm run verify` is the integration/media check, with no individual-test filter. It checks source through its own Vite server and existing media; it neither regenerates media nor tests `dist/`. Review outputs are written to ignored `artifacts/`: `film-*.png`, `encoded-scene-*.png`, and `portrait-{desktop,mobile}.png`. Use `npm run preview` to inspect the production build.

## Product constraints

- Preserve the three-bar **portrait.** identity, accent `#7C87FF`, navy `#111827`, and English copy. Verification enforces branding, the portfolio/GitHub/LinkedIn links, and the absence of download-film controls.
- Assets use root-absolute URLs; serve `dist/` at the domain root. Canonical and social URLs identify `https://anthonypillot.fr/`; `https://anthonypillot.com` is the separate portfolio.
- Keep native looping video with muted autoplay, a paused introduction for reduced motion, and visibility-aware pause/resume that respects whether the visitor was already paused.
