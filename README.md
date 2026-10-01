# Anthony — A Motion Portrait

A nine-second, original motion-design film celebrating Anthony: visionary, builder, and the world's best tech leader. Electric-lime typography, dimensional wireframe graphics, kinetic reveals, and an original electronic sound design.

## Watch

The finished film is **`public/anthony.mp4`** (1920 × 1080, 30 fps, H.264 with AAC audio).

```sh
npm install
npm run dev
```

The browser studio includes playback, chapter navigation, scrubbing, fullscreen, an optional soundtrack, and an MP4 download. Shortcuts: **Space** to play/pause, **M** for sound, and **← / →** to seek one second.

## Build and render

```sh
npm run build
npm run render
npm run verify
```

Rendering uses FFmpeg and a Chromium browser. On macOS, Brave is detected automatically. Set `CHROME_PATH` to another Chromium executable if needed. `npm run render` recreates the MP4, original WAV soundtrack, and poster in `public/` from the same animation used in the preview.

## Film

| Time | Act | Message |
| --- | --- | --- |
| 0–2.7 s | Meet Anthony | Great technology starts with a great leader. |
| 2.7–5.7 s | Build what's next | Turns bold ideas into real-world impact. |
| 5.7–9 s | In a league of his own | The world's best tech leader. |

Animation: `src/film.ts` · Studio: `src/main.ts` and `src/style.css` · Rendering: `scripts/render.ts`
