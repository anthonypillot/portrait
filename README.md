# portrait.

The branded welcome page for **[anthonypillot.fr](https://anthonypillot.fr)**, Anthony Pillot’s personal server. A home for the things he builds, hosts, and shares, with links to his portfolio, GitHub, and LinkedIn.

The three-bar **portrait.** identity pairs **`#7C87FF`** with dark navy **`#111827`**. The English copy is inspired by [anthonypillot.com](https://anthonypillot.com): lead full-stack engineering, architecture through deployment, and open-source advocacy.

## Run locally

```sh
npm install
npm run dev
```

Open **http://localhost:9393**. The welcome page plays a muted **30-second film in six five-second scenes** on repeat. Controls include play/pause, restart, scrubbing with scene markers, optional sound, and fullscreen. Keyboard shortcuts: **Space** for play/pause, **M** for sound, and **← / →** to seek one second.

Visitors who prefer reduced motion see a paused introduction and can choose to play it. Playback pauses when the tab is hidden and resumes when the visitor returns if it was playing.

## Film

| Time | Main text | Supporting message |
| --- | --- | --- |
| 0–5 s | Anthony Pillot | Lead Full-Stack Engineer · Open-source advocate |
| 5–10 s | Architect. Build. Deploy. | From idea to production. |
| 10–15 s | Agents. Tools. Connections. | Building agentic systems & MCP integrations. |
| 15–20 s | Engineering. With a human side. | Software engineering meets work psychology. |
| 20–25 s | Built in the open. | Open-source advocate. |
| 25–30 s | Build. Host. Share. | anthonypillot.fr · My personal server |

Each scene has its own motion language: orbital branding, a full-stack pipeline, an agent/tool network, particle-based human silhouettes, branching open-source contributions, and a self-hosted asset stack. The closing reveal continues into the opening frame.

The original electronic score uses periodic synthesis at **96 BPM**, with eight beats per scene, synchronized transition cues, and a softer passage for the human-side scene. Native HTML video playback keeps the picture and embedded soundtrack synchronized.

`src/timeline.ts` is the shared source for duration, scene boundaries, sample frames, tempo, transition timing, and player timecodes.

## Render, build, and verify

```sh
npm run render
npm run build
npm run verify
```

Rendering needs **FFmpeg** and a **Chromium browser**. Brave is detected automatically on macOS; set `CHROME_PATH` for another Chromium executable.

- `public/movie.mp4`: 30-second, 1920 × 1080, 30 fps H.264 film (900 frames) with AAC audio.
- `public/poster.jpg`: introduction frame for the player and social previews.
- `public/soundtrack.wav`: original 48 kHz stereo render source.

Render before building so `dist/` contains the latest assets. The static production build can be served from the root of `anthonypillot.fr` alongside the server’s existing assets.

Verification checks the media format, all six decoded scenes, visual and audio loop boundaries, actual looping playback with sound, controls, reduced-motion behavior, public links, branding, and desktop/mobile layouts. Review screenshots for the homepage and every scene are saved in the ignored `artifacts/` directory.

Timeline: `src/timeline.ts` · Animation: `src/film.ts` · Homepage/player: `src/main.ts` · Design: `src/style.css` · Media generation: `scripts/render.ts` and `scripts/soundtrack.ts`
