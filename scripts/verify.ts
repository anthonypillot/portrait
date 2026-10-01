import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { promisify } from "node:util";
import { chromium } from "playwright-core";
import { createServer } from "vite";
import { browserExecutable } from "./browser";

const exec = promisify(execFile);
const video = await stat("public/anthony.mp4");
assert.ok(video.size > 50_000, "Rendered MP4 should contain the film.");
const { stdout: probe } = await exec("ffprobe", [
  "-v", "error", "-show_entries", "stream=codec_name,width,height,r_frame_rate,nb_frames:format=duration", "-of", "json", "public/anthony.mp4",
]);
assert.ok(probe.includes('"width": 1920'), "Film should be full HD.");
assert.ok(probe.includes('"height": 1080'), "Film should be full HD.");
assert.ok(probe.includes('"duration": "9.000000"'), "Film should be nine seconds.");
assert.ok(probe.includes('"nb_frames": "270"'), "Film should contain 270 frames.");
assert.ok(probe.includes('"codec_name": "aac"'), "Film should include its soundtrack.");

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
  await page.screenshot({ path: "artifacts/studio-desktop.png", fullPage: true });

  await page.getByRole("button", { name: "Play film", exact: true }).first().click();
  await page.waitForTimeout(350);
  await page.getByRole("button", { name: "Pause film", exact: true }).first().click();
  assert.ok(await page.getByRole("button", { name: "Play film", exact: true }).first().isVisible(), "Playback should pause.");

  await page.getByRole("button", { name: "Play chapter 2: Build what's next" }).click();
  await page.waitForTimeout(150);
  assert.equal(await page.locator('[data-chapter="1"]').getAttribute("aria-pressed"), "true", "Chapter selection should seek.");
  await page.getByRole("button", { name: "Pause film", exact: true }).first().click();
  await page.locator("#seek").fill("4.5");
  await page.screenshot({ path: "artifacts/studio-act-two.png", fullPage: true });
  assert.equal(await page.locator("#current-time").textContent(), "00:04", "Scrubbing should update the timecode.");

  await page.getByRole("button", { name: "Enable soundtrack" }).click();
  await page.waitForTimeout(200);
  assert.equal(await page.locator("#sound").getAttribute("aria-label"), "Mute soundtrack", "Sound should enable.");
  assert.ok(await page.locator("#soundtrack").evaluate((audio: HTMLAudioElement) => !audio.paused), "Soundtrack should play.");
  await page.getByRole("button", { name: "Mute soundtrack" }).click();

  await page.getByRole("button", { name: "Play chapter 3: In a league of his own" }).click();
  await page.waitForTimeout(3500);
  assert.ok(await page.getByRole("button", { name: "Replay film", exact: true }).isVisible(), "The film should stop on its final frame.");
  await page.screenshot({ path: "artifacts/studio-final.png", fullPage: true });
  await page.getByRole("button", { name: "Replay film", exact: true }).click();
  assert.equal(await page.locator('[data-chapter="0"]').getAttribute("aria-pressed"), "true", "Replay should return to act one.");
  await page.getByRole("button", { name: "Pause film", exact: true }).first().click();

  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download film MP4" }).click();
  const download = await downloadEvent;
  assert.equal(download.suggestedFilename(), "Anthony-A-Motion-Portrait.mp4", "Download should deliver the film.");
  assert.equal(await download.failure(), null, "MP4 download should complete.");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => window.filmReady === true);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Mobile layout should have no horizontal overflow.");
  await page.screenshot({ path: "artifacts/studio-mobile.png", fullPage: true });
  assert.deepEqual(errors, [], "Studio should have no browser errors.");
  console.log("Verified: 1080p MP4, 9-second duration, 270 frames, audio, play/pause, chapters, seeking, sound, replay, download, and mobile layout.");
} finally {
  await browser.close();
  await server.close();
}
