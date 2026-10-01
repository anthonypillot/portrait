import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";
import { createServer } from "vite";
import { FILM } from "../src/timeline";
import { browserExecutable } from "./browser";
import { createSoundtrack } from "./soundtrack";

const output = path.resolve("public");
const startedAt = performance.now();
await mkdir(output, { recursive: true });
await writeFile(path.join(output, "soundtrack.wav"), createSoundtrack());

const server = await createServer({ server: { host: "127.0.0.1", port: 5178, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ executablePath: await browserExecutable(), headless: true });

try {
  const page = await browser.newPage({ viewport: { width: FILM.width, height: FILM.height }, deviceScaleFactor: 1 });
  await page.goto("http://127.0.0.1:5178/?render", { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.filmReady === true);

  const poster = await page.evaluate((seconds) => window.renderAt(seconds), FILM.chapters[0].sample);
  await writeFile(path.join(output, "poster.jpg"), Buffer.from(poster.split(",")[1], "base64"));

  const encoder = spawn("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(FILM.fps), "-i", "pipe:0",
    "-i", path.join(output, "soundtrack.wav"),
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-movflags", "+faststart", "-t", String(FILM.duration),
    path.join(output, ".movie-render.mp4"),
  ], { stdio: ["pipe", "ignore", "pipe"] });

  let encoderErrors = "";
  encoder.stderr.on("data", (chunk: Buffer) => { encoderErrors += chunk.toString(); });
  const completion = new Promise<void>((resolve, reject) => {
    encoder.on("error", reject);
    encoder.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed (${code}): ${encoderErrors}`));
    });
  });

  const frames = FILM.duration * FILM.fps;
  for (let frame = 0; frame < frames; frame++) {
    const image = await page.evaluate((seconds) => window.renderAt(seconds), frame / FILM.fps);
    const data = Buffer.from(image.split(",")[1], "base64");
    if (!encoder.stdin.write(data)) await once(encoder.stdin, "drain");
    if (frame % FILM.fps === 0) console.log(`Rendering ${frame / FILM.fps + 1}/${FILM.duration} seconds…`);
  }
  encoder.stdin.end();
  await completion;
  await rename(path.join(output, ".movie-render.mp4"), path.join(output, "movie.mp4"));
  console.log(`portrait. film ready: public/movie.mp4 — ${FILM.duration}-second loop, ${FILM.chapters.length} scenes, 1080p, ${FILM.fps} fps, periodic soundtrack. Rendered in ${((performance.now() - startedAt) / 1000).toFixed(1)}s.`);
} finally {
  await browser.close();
  await server.close();
}
