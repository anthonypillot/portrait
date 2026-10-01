import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "./style.css";
import { clamp, FILM, renderFilm } from "./film";

const icons = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m9 5 11 7-11 7V5Z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>',
  replay: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/></svg>',
  muted: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4V5ZM16 9l6 6m0-6-6 6"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4V5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>',
  expand: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
};

function element<T extends HTMLElement>(selector: string, type: new () => T): T {
  const result = document.querySelector(selector);
  if (!(result instanceof type)) throw new Error(`Missing element: ${selector}`);
  return result;
}

const app = element("#app", HTMLDivElement);
const renderMode = new URLSearchParams(location.search).has("render");

app.innerHTML = renderMode ? '<canvas id="film" width="1920" height="1080"></canvas>' : `
  <div class="studio">
    <header class="header">
      <a class="brand" href="./" aria-label="Portrait Studio home">
        <span class="brand-mark"><span></span><span></span><span></span></span>
        <span>portrait<span class="brand-dot">.</span></span>
        <span class="brand-descriptor">STORIES IN MOTION</span>
      </a>
      <div class="header-actions">
        <span class="edition">INDEPENDENT SPIRIT. EXTRAORDINARY PEOPLE.</span>
        <a class="download-button" href="/anthony.mp4" download="Anthony-A-Motion-Portrait.mp4">${icons.download}<span>Download film</span><span class="file-type">MP4</span></a>
      </div>
    </header>

    <main>
      <section class="intro" aria-labelledby="page-title">
        <div>
          <div class="eyebrow"><span class="small-cross">✳</span> THE LEADERSHIP SERIES <span class="eyebrow-divider">/</span> VOL. 001</div>
          <h1 id="page-title">Big vision. <span>Lasting impact.</span></h1>
        </div>
        <div class="intro-description"><span class="mini-line"></span><p>Some leaders follow the future.<br>Anthony builds it.</p></div>
      </section>

      <section class="film-section" aria-label="Anthony motion-design film">
        <div class="film-heading">
          <div class="film-title"><span class="status-dot"></span><span>ANTHONY</span><span class="film-heading-divider">/</span><span class="muted-text">A MOTION PORTRAIT</span></div>
          <div class="format-label">9 SECONDS <span>·</span> 1920 × 1080 <span>·</span> 30 FPS</div>
        </div>
        <div class="film-frame" id="film-frame">
          <canvas id="film" width="1920" height="1080" role="img" aria-label="Animated film celebrating Anthony, the world's best tech leader"></canvas>
          <button class="canvas-toggle" id="canvas-toggle" aria-label="Pause film"></button>
          <div class="paused-overlay" id="paused-overlay"><span>${icons.play}</span></div>
          <span class="screen-corner corner-top-left"></span><span class="screen-corner corner-top-right"></span>
          <span class="screen-corner corner-bottom-left"></span><span class="screen-corner corner-bottom-right"></span>
        </div>
        <div class="transport">
          <div class="transport-left">
            <button class="play-button" id="play" aria-label="Pause film">${icons.pause}</button>
            <button class="icon-button replay-button" id="replay" aria-label="Replay from beginning" title="Replay">${icons.replay}</button>
            <span class="timecode"><span id="current-time">00:00</span><span class="time-divider">/</span>00:09</span>
          </div>
          <div class="seek-wrap"><input type="range" id="seek" min="0" max="9" step="0.01" value="0" aria-label="Film playback position"/><div class="seek-chapters"><span></span><span></span></div></div>
          <div class="transport-right">
            <button class="sound-button" id="sound" aria-label="Enable soundtrack" title="Sound on / off (M)">${icons.muted}<span>SOUND OFF</span></button>
            <span class="control-divider"></span>
            <button class="icon-button" id="fullscreen" aria-label="Enter fullscreen" title="Fullscreen">${icons.expand}</button>
          </div>
        </div>
      </section>

      <section class="story-section" aria-label="Film chapters">
        <div class="story-heading"><span>ONE LEADER. THREE ACTS.</span><span class="story-hint">A small film. A big statement. ${icons.arrow}</span></div>
        <div class="chapters">
          ${FILM.chapters.map((chapter, index) => `
            <button class="chapter ${index === 0 ? "active" : ""}" data-chapter="${index}" aria-label="Play chapter ${index + 1}: ${chapter.title}">
              <div class="chapter-thumb"><canvas id="thumbnail-${index}" width="288" height="162" aria-hidden="true"></canvas><span class="thumb-play">${icons.play}</span></div>
              <div class="chapter-copy"><span class="chapter-number">0${index + 1}<span class="chapter-duration">${index === 0 ? "00:00–00:03" : index === 1 ? "00:03–00:06" : "00:06–00:09"}</span></span><h2>${chapter.title}</h2><p>${chapter.subtitle}</p></div>
              <span class="chapter-arrow">${icons.arrow}</span>
            </button>
          `).join("")}
        </div>
      </section>
      <footer class="footer"><span>MADE OF VISION. DRIVEN BY PEOPLE.</span><span class="footer-right"><span class="lime-dot"></span> GOOD LEADERSHIP DESERVES A LITTLE MOTION.</span></footer>
    </main>
  </div>
  <div class="toast" id="toast" role="status">${icons.check}<span>Your film is ready. Let it inspire.</span></div>
  <audio id="soundtrack" src="/soundtrack.wav" preload="auto"></audio>
`;

const canvas = element("#film", HTMLCanvasElement);
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas rendering is unavailable.");
const context = ctx;

declare global {
  interface Window {
    filmReady: boolean;
    renderAt: (seconds: number) => string;
  }
}

await Promise.all([
  document.fonts.load('700 100px "Space Grotesk"'),
  document.fonts.load('500 21px "DM Sans"'),
  document.fonts.load('400 34px "DM Sans"'),
]);
await document.fonts.ready;

window.renderAt = (seconds: number) => {
  renderFilm(context, seconds);
  return canvas.toDataURL("image/jpeg", 0.96);
};
window.filmReady = true;
renderFilm(context, renderMode ? 0 : 1.5);

if (renderMode) {
  document.body.classList.add("render-mode");
} else {
  initStudio();
}

function initStudio() {
  const playButton = element("#play", HTMLButtonElement);
  const canvasToggle = element("#canvas-toggle", HTMLButtonElement);
  const replayButton = element("#replay", HTMLButtonElement);
  const soundButton = element("#sound", HTMLButtonElement);
  const fullscreenButton = element("#fullscreen", HTMLButtonElement);
  const filmFrame = element("#film-frame", HTMLDivElement);
  const overlay = element("#paused-overlay", HTMLDivElement);
  const seek = element("#seek", HTMLInputElement);
  const currentTime = element("#current-time", HTMLSpanElement);
  const audio = element("#soundtrack", HTMLAudioElement);
  const toast = element("#toast", HTMLDivElement);
  const chapters = [...document.querySelectorAll<HTMLButtonElement>(".chapter")];
  const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let playing = !prefersReducedMotion;
  let position = prefersReducedMotion ? 1.5 : 0;
  let startedAt = performance.now();
  let sound = false;
  let animation = 0;
  let toastTimer = 0;

  FILM.chapters.forEach((chapter, index) => {
    const thumbnail = element(`#thumbnail-${index}`, HTMLCanvasElement);
    const thumbnailContext = thumbnail.getContext("2d");
    if (thumbnailContext) renderFilm(thumbnailContext, chapter.sample);
  });

  function showToast(message: string) {
    const label = toast.querySelector("span");
    if (label) label.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3500);
  }

  function updateControls() {
    playButton.innerHTML = playing ? icons.pause : position >= FILM.duration ? icons.replay : icons.play;
    playButton.setAttribute("aria-label", playing ? "Pause film" : position >= FILM.duration ? "Replay film" : "Play film");
    canvasToggle.setAttribute("aria-label", playing ? "Pause film" : "Play film");
    overlay.classList.toggle("visible", !playing);
    overlay.innerHTML = `<span>${position >= FILM.duration ? icons.replay : icons.play}</span>`;
    currentTime.textContent = `00:${String(Math.floor(position)).padStart(2, "0")}`;
    seek.value = String(position);
    seek.style.setProperty("--progress", `${(position / FILM.duration) * 100}%`);
    seek.setAttribute("aria-valuetext", `${position.toFixed(1)} of 9 seconds`);
    const chapter = position < 2.7 ? 0 : position < 5.7 ? 1 : 2;
    chapters.forEach((button, index) => {
      button.classList.toggle("active", index === chapter);
      button.setAttribute("aria-pressed", String(index === chapter));
    });
  }

  async function syncAudio() {
    if (!sound || !playing) {
      audio.pause();
      return;
    }
    audio.currentTime = Math.min(position, FILM.duration - 0.01);
    try {
      await audio.play();
    } catch {
      sound = false;
      updateSound();
      showToast("Soundtrack unavailable. The film is still ready to play.");
    }
  }

  function updateSound() {
    soundButton.innerHTML = `${sound ? icons.sound : icons.muted}<span>SOUND ${sound ? "ON" : "OFF"}</span>`;
    soundButton.classList.toggle("enabled", sound);
    soundButton.setAttribute("aria-label", sound ? "Mute soundtrack" : "Enable soundtrack");
  }

  function draw(now: number) {
    if (playing) {
      position = Math.min((now - startedAt) / 1000, FILM.duration);
      if (position >= FILM.duration) {
        playing = false;
        audio.pause();
      }
    }
    renderFilm(context, position);
    updateControls();
    if (playing) animation = requestAnimationFrame(draw);
  }

  function resumeFrom(seconds: number) {
    cancelAnimationFrame(animation);
    position = clamp(seconds, 0, FILM.duration);
    startedAt = performance.now() - position * 1000;
    renderFilm(context, position);
    updateControls();
    void syncAudio();
    if (playing) animation = requestAnimationFrame(draw);
  }

  function togglePlayback() {
    playing = !playing;
    resumeFrom(position >= FILM.duration ? 0 : position);
  }

  playButton.addEventListener("click", togglePlayback);
  canvasToggle.addEventListener("click", togglePlayback);
  replayButton.addEventListener("click", () => {
    playing = true;
    resumeFrom(0);
  });
  seek.addEventListener("input", () => resumeFrom(Number(seek.value)));
  soundButton.addEventListener("click", () => {
    sound = !sound;
    updateSound();
    if (sound && !playing) {
      playing = true;
      resumeFrom(position >= FILM.duration ? 0 : position);
    } else {
      void syncAudio();
    }
  });

  fullscreenButton.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await filmFrame.requestFullscreen();
    } catch {
      showToast("Fullscreen isn't available in this browser.");
    }
  });
  document.addEventListener("fullscreenchange", () => {
    fullscreenButton.setAttribute("aria-label", document.fullscreenElement ? "Exit fullscreen" : "Enter fullscreen");
  });

  chapters.forEach((button, index) => button.addEventListener("click", () => {
    playing = true;
    resumeFrom(FILM.chapters[index].start);
  }));

  document.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement) return;
    if (event.code === "Space") {
      event.preventDefault();
      togglePlayback();
    } else if (event.key.toLowerCase() === "m") {
      soundButton.click();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      resumeFrom(position + (event.key === "ArrowLeft" ? -1 : 1));
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && playing) {
      playing = false;
      cancelAnimationFrame(animation);
      audio.pause();
      updateControls();
    }
  });
  element(".download-button", HTMLAnchorElement).addEventListener("click", () => showToast("Your film is ready. Let it inspire."));
  updateControls();
  if (playing) animation = requestAnimationFrame(draw);
}
