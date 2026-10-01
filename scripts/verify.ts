import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, readFile, stat } from "node:fs/promises";
import { promisify } from "node:util";
import { chromium } from "playwright-core";
import { createServer } from "vite";
import { FILM, formatTime } from "../src/timeline";
import { browserExecutable } from "./browser";

const exec = promisify(execFile);
const videoFile = await stat("public/movie.mp4");
assert.ok(videoFile.size > 50_000, "Rendered MP4 should contain the film.");
const { stdout: probe } = await exec("ffprobe", [
  "-v", "error", "-show_entries", "stream=codec_name,width,height,r_frame_rate,nb_frames:format=duration", "-of", "json", "public/movie.mp4",
]);
assert.ok(probe.includes('"width": 1920'), "Film should be full HD.");
assert.ok(probe.includes('"height": 1080'), "Film should be full HD.");
assert.ok(probe.includes(`"duration": "${FILM.duration.toFixed(6)}"`), `Film should be ${FILM.duration} seconds.`);
assert.ok(probe.includes(`"nb_frames": "${FILM.duration * FILM.fps}"`), `Film should contain ${FILM.duration * FILM.fps} frames.`);
assert.ok(probe.includes(`"r_frame_rate": "${FILM.fps}/1"`), `Film should play at ${FILM.fps} fps.`);
assert.ok(probe.includes('"codec_name": "aac"'), "Film should include its synchronized soundtrack.");

const soundtrack = await readFile("public/soundtrack.wav");
assert.equal(soundtrack.readUInt32LE(24), 48_000, "Soundtrack should be 48 kHz.");
assert.equal(soundtrack.readUInt32LE(40), FILM.duration * 48_000 * 4, "Soundtrack should match the film duration.");
for (let channel = 0; channel < 2; channel++) {
  const first = soundtrack.readInt16LE(44 + channel * 2);
  const last = soundtrack.readInt16LE(soundtrack.length - 4 + channel * 2);
  assert.ok(Math.abs(first - last) < 512, "Soundtrack should join without an abrupt waveform jump.");
}

await mkdir("artifacts", { recursive: true });
const server = await createServer({ server: { host: "127.0.0.1", port: 5179, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ executablePath: await browserExecutable(), headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("http://127.0.0.1:5179", { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.filmReady === true);
  const video = page.locator("#film");
  await page.waitForFunction((sample) => {
    const film = document.querySelector("#film");
    return film instanceof HTMLVideoElement && film.paused && !film.seeking && Math.abs(film.currentTime - sample) < 0.1;
  }, FILM.chapters[0].sample);
  assert.equal(await video.evaluate((film: HTMLVideoElement) => film.paused), true, "Reduced motion should start paused.");
  assert.equal(await video.evaluate((film: HTMLVideoElement) => film.loop && film.muted && film.playsInline), true, "Film should loop, start muted, and play inline.");
  assert.equal(await page.locator(".brand").innerText(), "portrait.\nPERSONAL SERVER", "The application should keep its portrait. wordmark.");
  assert.equal(await page.locator(".brand-mark span").first().evaluate((bar) => getComputedStyle(bar).backgroundColor), "rgb(124, 135, 255)", "Logo should use #7C87FF.");
  assert.equal(await page.locator("h1 span").evaluate((heading) => getComputedStyle(heading).color), "rgb(124, 135, 255)", "Homepage should use #7C87FF.");
  assert.equal(await page.locator("#total-time").textContent(), formatTime(FILM.duration), "Player should show the full film duration.");
  assert.equal(await page.locator("#seek").getAttribute("max"), String(FILM.duration), "The whole film should be seekable.");
  assert.equal(await page.locator(".seek-chapters span").count(), FILM.chapters.length - 1, "The timeline should mark every scene boundary.");
  assert.ok((await page.locator(".format-label").textContent())?.includes(`${FILM.duration} SECONDS`), "Film heading should show the extended duration.");
  assert.equal(await page.getByRole("link", { name: /download/i }).count(), 0, "Download film link should be removed.");
  assert.equal(await page.getByRole("button", { name: /download/i }).count(), 0, "Download film button should be removed.");
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), "https://anthonypillot.fr/", "Canonical URL should identify the personal server.");
  assert.equal(await page.getByRole("link", { name: "Portfolio", exact: true }).getAttribute("href"), "https://anthonypillot.com", "Portfolio should link to the professional site.");
  assert.equal(await page.getByRole("link", { name: "GitHub", exact: true }).getAttribute("href"), "https://github.com/anthonypillot", "GitHub should link to Anthony's account.");
  assert.equal(await page.getByRole("link", { name: "LinkedIn", exact: true }).getAttribute("href"), "https://linkedin.com/in/anthony-pillot", "LinkedIn should link to Anthony's profile.");
  await page.screenshot({ path: "artifacts/portrait-desktop.png", fullPage: true });

  await page.locator("#play").click();
  await page.waitForFunction(() => {
    const film = document.querySelector("#film");
    return film instanceof HTMLVideoElement && !film.paused && document.querySelector("#play")?.getAttribute("aria-label") === "Pause film";
  });
  assert.equal(await page.locator("#play").getAttribute("aria-label"), "Pause film", "Play should update the accessible control label.");
  await page.locator("#play").click();
  assert.equal(await video.evaluate((film: HTMLVideoElement) => film.paused), true, "Playback should pause.");

  const backgrounds = { dark: [17, 24, 39], accent: [124, 135, 255], paper: [240, 242, 255] };
  for (const chapter of FILM.chapters) {
    await page.locator("#seek").fill(String(chapter.sample));
    await page.waitForFunction((seconds) => {
      const film = document.querySelector("#film");
      return film instanceof HTMLVideoElement && !film.seeking && Math.abs(film.currentTime - seconds) < 0.1;
    }, chapter.sample);
    await video.screenshot({ path: `artifacts/encoded-scene-${chapter.index + 1}.png` });
    assert.equal(await page.locator("#current-time").textContent(), formatTime(chapter.sample), "Scrubbing should update the timecode.");
    assert.ok((await page.locator("#seek").getAttribute("aria-valuetext"))?.includes(`Scene ${chapter.index + 1} of ${FILM.chapters.length}`), "Accessible seeking should identify the current scene.");
    const pixel = await video.evaluate((film: HTMLVideoElement) => {
      const canvas = document.createElement("canvas");
      canvas.width = film.videoWidth;
      canvas.height = film.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Video readback is unavailable.");
      ctx.drawImage(film, 0, 0);
      return Array.from(ctx.getImageData(10, 500, 1, 1).data);
    });
    assert.ok(backgrounds[chapter.background].every((channel, index) => Math.abs(pixel[index] - channel) <= 5), `Encoded scene ${chapter.index + 1} should use its intended background.`);
  }

  await page.getByRole("button", { name: "Enable soundtrack" }).click();
  await page.waitForFunction(() => {
    const film = document.querySelector("#film");
    return film instanceof HTMLVideoElement && !film.muted && !film.paused;
  });
  assert.equal(await page.locator("#sound").getAttribute("aria-pressed"), "true", "Sound should enable.");

  // Cross the actual encoded video boundary twice, including with sound enabled.
  for (let cycle = 0; cycle < 2; cycle++) {
    await page.locator("#seek").fill(String(FILM.duration - 0.3));
    await page.waitForFunction(() => {
      const film = document.querySelector("#film");
      return film instanceof HTMLVideoElement && !film.paused && film.currentTime < 1;
    });
    assert.equal(await video.evaluate((film: HTMLVideoElement) => film.muted), false, "Sound should continue after looping.");
    assert.equal(await page.locator("#play").getAttribute("aria-label"), "Pause film", "Playback should keep running after looping.");
  }
  await page.getByRole("button", { name: "Mute soundtrack" }).click();
  await page.getByRole("button", { name: "Restart film" }).click();
  assert.ok(await video.evaluate((film: HTMLVideoElement) => film.currentTime < 1 && !film.paused), "Restart should return to the beginning and play.");
  await page.locator("#play").click();

  await page.getByRole("button", { name: "Enter fullscreen" }).click();
  await page.waitForFunction(() => document.fullscreenElement?.id === "film-section");
  await page.getByRole("button", { name: "Exit fullscreen" }).click();
  await page.waitForFunction(() => !document.fullscreenElement);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => {
    const film = document.querySelector("#film");
    return window.filmReady && film instanceof HTMLVideoElement && !film.paused;
  });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Mobile layout should have no horizontal overflow.");
  await page.locator("#play").click();
  await page.locator("#seek").fill(String(FILM.chapters[0].sample));
  await page.waitForFunction(() => {
    const film = document.querySelector("#film");
    return film instanceof HTMLVideoElement && !film.seeking;
  });
  await page.screenshot({ path: "artifacts/portrait-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 320, height: 740 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Small mobile layout should have no horizontal overflow.");

  await page.goto("http://127.0.0.1:5179/?render", { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.filmReady === true);
  const seam = await page.evaluate(({ duration, fps }) => {
    const canvas = document.querySelector("#film");
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Renderer canvas is missing.");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Renderer context is missing.");
    window.renderAt(0);
    const first = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    window.renderAt(duration);
    const repeated = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    window.renderAt(duration - 1 / fps);
    const last = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    window.renderAt(1 / fps);
    const next = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let periodic = true;
    let seamDelta = 0;
    let normalDelta = 0;
    for (let i = 0; i < first.length; i++) {
      if (i % 4 === 3) continue;
      if (first[i] !== repeated[i]) periodic = false;
      seamDelta += Math.abs(first[i] - last[i]);
      normalDelta += Math.abs(first[i] - next[i]);
    }
    const channels = canvas.width * canvas.height * 3;
    return { periodic, seamDelta: seamDelta / channels, normalDelta: normalDelta / channels };
  }, { duration: FILM.duration, fps: FILM.fps });
  assert.ok(seam.periodic, `The composition should repeat exactly after ${FILM.duration} seconds.`);
  assert.ok(seam.seamDelta < 4 && seam.seamDelta <= seam.normalDelta * 1.5 + 0.1, `Loop seam should behave like a normal animation frame: ${JSON.stringify(seam)}`);
  for (const chapter of FILM.chapters) {
    await page.evaluate((seconds) => window.renderAt(seconds), chapter.sample);
    await page.locator("#film").screenshot({ path: `artifacts/film-${chapter.index + 1}.png` });
  }
  const blue = await page.evaluate((sample) => {
    window.renderAt(sample);
    const canvas = document.querySelector("#film");
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Canvas is missing.");
    return Array.from(canvas.getContext("2d")?.getImageData(10, 500, 1, 1).data ?? []);
  }, FILM.chapters[1].sample);
  // Canvas readback can vary by one channel step with browser privacy protection.
  assert.ok(blue.length === 4 && blue.every((channel, index) => Math.abs(channel - [124, 135, 255, 255][index]) <= 1), "Film pixels should match #7C87FF within browser readback rounding.");
  assert.deepEqual(errors, [], "Homepage should have no browser errors.");
  console.log(`Verified: ${FILM.duration}-second film, ${FILM.chapters.length} decoded scenes, ${FILM.duration * FILM.fps} frames at 1080p/${FILM.fps} fps, periodic picture and audio, repeated playback with sound, controls, fullscreen, portrait. branding, #7C87FF, public links, reduced motion, and mobile layouts. Seam delta: ${seam.seamDelta.toFixed(2)}.`);
} finally {
  await browser.close();
  await server.close();
}
