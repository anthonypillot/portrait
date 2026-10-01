import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "./style.css";
import { clamp, renderFilm } from "./film";
import { chapterAt, FILM, formatTime } from "./timeline";

const icons = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m9 5 11 7-11 7V5Z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>',
  replay: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/></svg>',
  muted: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4V5ZM16 9l6 6m0-6-6 6"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4V5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>',
  expand: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>',
  loop: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-3v4a3 3 0 0 1-3 3H3"/></svg>',
  portfolio: '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="4" y="5" width="24" height="22" rx="3"/><path d="M4 12h24m-19-4h1m3 0h1M10 18l-3 3 3 3m12-6 3 3-3 3m-4-7-3 9"/></svg>',
  github: '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M12 27c-6 2-6-3-8-3m16 6v-5a4 4 0 0 0-1-3c5-.5 10-2.5 10-9a7 7 0 0 0-2-5c.3-1.7 0-3.5-.5-5-2.5 0-4.5 1-6 2a19 19 0 0 0-9 0c-1.5-1-3.5-2-6-2A10 10 0 0 0 5 8a7 7 0 0 0-2 5c0 6.5 5 8.5 10 9a4 4 0 0 0-1 3v5"/></svg>',
  linkedin: '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="4" y="4" width="24" height="24" rx="3"/><path d="M10 14v9m6 0v-9m0 4a4 4 0 0 1 8 0v5"/><circle cx="10" cy="9.5" r=".8" fill="currentColor"/></svg>',
};

function element<T extends HTMLElement>(selector: string, type: new () => T): T {
  const result = document.querySelector(selector);
  if (!(result instanceof type)) throw new Error(`Missing element: ${selector}`);
  return result;
}

declare global {
  interface Window {
    filmReady: boolean;
    renderAt: (seconds: number) => string;
  }
}

const app = element("#app", HTMLDivElement);
const renderMode = new URLSearchParams(location.search).has("render");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

if (renderMode) {
  app.innerHTML = '<canvas id="film" width="1920" height="1080"></canvas>';
  document.body.classList.add("render-mode");
  await Promise.all([
    document.fonts.load('700 100px "Space Grotesk"'),
    document.fonts.load('600 46px "Space Grotesk"'),
    document.fonts.load('500 21px "DM Sans"'),
    document.fonts.load('400 34px "DM Sans"'),
  ]);
  await document.fonts.ready;
  const canvas = element("#film", HTMLCanvasElement);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is unavailable.");
  const context = ctx;
  window.renderAt = (seconds: number) => {
    renderFilm(context, seconds);
    return canvas.toDataURL("image/jpeg", 0.96);
  };
  renderFilm(context, 0);
  window.filmReady = true;
} else {
  app.innerHTML = `
    <div class="studio">
      <header class="header">
        <a class="brand" href="/" aria-label="portrait. home">
          <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
          <span>portrait<span class="brand-dot">.</span></span>
          <span class="brand-descriptor">PERSONAL SERVER</span>
        </a>
        <nav class="header-links" aria-label="Main navigation">
          <a href="https://anthonypillot.com" target="_blank" rel="noopener noreferrer">Portfolio ${icons.arrow}</a>
          <a href="https://github.com/anthonypillot" target="_blank" rel="noopener noreferrer">GitHub ${icons.arrow}</a>
          <a href="https://linkedin.com/in/anthony-pillot" target="_blank" rel="noopener noreferrer">LinkedIn ${icons.arrow}</a>
        </nav>
      </header>

      <main>
        <section class="intro" aria-labelledby="page-title">
          <div>
            <div class="eyebrow"><span class="small-cross" aria-hidden="true">✳</span> ANTHONY PILLOT <span class="eyebrow-divider">/</span> LILLE, FRANCE</div>
            <h1 id="page-title">My corner of <span>the internet.</span></h1>
          </div>
          <div class="intro-description"><span class="mini-line" aria-hidden="true"></span><p><strong>Lead full-stack engineer. Open-source advocate.</strong><br>A personal server for the things I build, host, and share.</p></div>
        </section>

        <section class="film-section" id="film-section" aria-label="Anthony Pillot motion portrait">
          <div class="film-heading">
            <div class="film-title"><span class="accent-dot" aria-hidden="true"></span><span>ANTHONY PILLOT</span><span class="film-heading-divider">/</span><span class="muted-text">A PERSONAL INTRODUCTION</span></div>
            <div class="format-label">${FILM.duration} SECONDS <span>·</span> ${FILM.chapters.length} SCENES</div>
          </div>
          <div class="film-frame">
            <video id="film" width="1920" height="1080" src="/movie.mp4" poster="/poster.jpg" ${reducedMotion.matches ? "" : "autoplay"} loop muted playsinline preload="auto" aria-label="A ${FILM.duration}-second introduction to Anthony Pillot in ${FILM.chapters.length} scenes" aria-describedby="film-description">Your browser does not support video playback.</video>
            <button class="film-toggle" id="film-toggle" aria-label="Play film"></button>
            <div class="paused-overlay" id="paused-overlay" aria-hidden="true"><span>${icons.play}</span></div>
            <span class="screen-corner corner-top-left"></span><span class="screen-corner corner-top-right"></span>
            <span class="screen-corner corner-bottom-left"></span><span class="screen-corner corner-bottom-right"></span>
          </div>
          <p id="film-description" class="visually-hidden">${FILM.chapters.map((chapter) => `${chapter.headline} ${chapter.subtitle}`).join(" ")}</p>
          <div class="transport">
            <div class="transport-left">
              <button class="play-button" id="play" aria-label="Play film">${icons.play}</button>
              <button class="icon-button replay-button" id="replay" aria-label="Restart film" title="Restart">${icons.replay}</button>
              <span class="timecode"><span id="current-time">00:00</span><span class="time-divider">/</span><span id="total-time">${formatTime(FILM.duration)}</span></span>
            </div>
            <div class="seek-wrap"><input type="range" id="seek" min="0" max="${FILM.duration}" step="0.01" value="0" aria-label="Film playback position"/><div class="seek-chapters" aria-hidden="true">${FILM.chapters.slice(1).map((chapter) => `<span style="left:${chapter.start / FILM.duration * 100}%" title="${chapter.title}"></span>`).join("")}</div></div>
            <div class="transport-right">
              <span class="loop-label" title="Film loops automatically">${icons.loop}<span>ON REPEAT</span></span>
              <span class="control-divider"></span>
              <button class="sound-button" id="sound" aria-label="Enable soundtrack" aria-pressed="false" title="Sound on / off (M)">${icons.muted}<span>SOUND OFF</span></button>
              <button class="icon-button" id="fullscreen" aria-label="Enter fullscreen" title="Fullscreen">${icons.expand}</button>
            </div>
          </div>
        </section>

        <section class="links-section" aria-labelledby="links-title">
          <div class="links-heading"><h2 id="links-title">A LITTLE MORE ABOUT ME.</h2><span class="links-hint">Beyond this server ${icons.arrow}</span></div>
          <div class="link-cards">
            <a class="link-card" href="https://anthonypillot.com" target="_blank" rel="noopener noreferrer">
              <span class="link-icon">${icons.portfolio}</span><div class="link-copy"><span class="link-label">01 <span>ANTHONYPILLOT.COM</span></span><h3>The full story</h3><p>My work, tools, and engineering journey.</p></div><span class="card-arrow">${icons.arrow}</span>
            </a>
            <a class="link-card" href="https://github.com/anthonypillot" target="_blank" rel="noopener noreferrer">
              <span class="link-icon">${icons.github}</span><div class="link-copy"><span class="link-label">02 <span>GITHUB</span></span><h3>Built in the open</h3><p>Projects, code, and open-source contributions.</p></div><span class="card-arrow">${icons.arrow}</span>
            </a>
            <a class="link-card" href="https://linkedin.com/in/anthony-pillot" target="_blank" rel="noopener noreferrer">
              <span class="link-icon">${icons.linkedin}</span><div class="link-copy"><span class="link-label">03 <span>LINKEDIN</span></span><h3>Let’s connect</h3><p>Good engineering starts with good people.</p></div><span class="card-arrow">${icons.arrow}</span>
            </a>
          </div>
        </section>
        <footer class="footer"><span>BUILT, HOSTED & MAINTAINED BY ANTHONY PILLOT.</span><span class="footer-right"><span class="accent-dot" aria-hidden="true"></span> ANTHONYPILLOT.FR <span class="footer-divider">/</span> PERSONAL SERVER</span></footer>
      </main>
    </div>
    <div class="toast" id="toast" role="status"></div>
  `;
  initLanding();
}

function initLanding() {
  const video = element("#film", HTMLVideoElement);
  const playButton = element("#play", HTMLButtonElement);
  const filmToggle = element("#film-toggle", HTMLButtonElement);
  const soundButton = element("#sound", HTMLButtonElement);
  const fullscreenButton = element("#fullscreen", HTMLButtonElement);
  const filmSection = element("#film-section", HTMLElement);
  const overlay = element("#paused-overlay", HTMLDivElement);
  const seek = element("#seek", HTMLInputElement);
  const currentTime = element("#current-time", HTMLSpanElement);
  const toast = element("#toast", HTMLDivElement);
  let toastTimer = 0;
  let resumeWhenVisible = false;
  video.muted = true;

  function showToast(message: string) {
    toast.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3500);
  }

  function updatePosition() {
    const seconds = clamp(video.currentTime, 0, FILM.duration);
    currentTime.textContent = formatTime(seconds);
    seek.value = String(seconds);
    seek.style.setProperty("--progress", `${seconds / FILM.duration * 100}%`);
    const chapter = chapterAt(seconds);
    seek.setAttribute("aria-valuetext", `${seconds.toFixed(1)} of ${FILM.duration} seconds. Scene ${chapter.index + 1} of ${FILM.chapters.length}: ${chapter.title}.`);
  }

  function updatePlayback() {
    const playing = !video.paused;
    playButton.innerHTML = playing ? icons.pause : icons.play;
    const label = playing ? "Pause film" : "Play film";
    playButton.setAttribute("aria-label", label);
    filmToggle.setAttribute("aria-label", label);
    overlay.classList.toggle("visible", !playing);
    updatePosition();
  }

  function updateSound() {
    const sound = !video.muted;
    soundButton.innerHTML = `${sound ? icons.sound : icons.muted}<span>SOUND ${sound ? "ON" : "OFF"}</span>`;
    soundButton.classList.toggle("enabled", sound);
    soundButton.setAttribute("aria-label", sound ? "Mute soundtrack" : "Enable soundtrack");
    soundButton.setAttribute("aria-pressed", String(sound));
  }

  async function playFilm() {
    try {
      await video.play();
    } catch {
      updatePlayback();
    }
  }

  function togglePlayback() {
    if (video.paused) void playFilm();
    else video.pause();
  }

  video.addEventListener("loadedmetadata", () => {
    if (reducedMotion.matches) video.currentTime = FILM.chapters[0].sample;
  });
  video.addEventListener("loadeddata", () => {
    window.filmReady = true;
    updatePlayback();
  });
  video.addEventListener("play", updatePlayback);
  video.addEventListener("pause", updatePlayback);
  video.addEventListener("timeupdate", updatePosition);
  video.addEventListener("seeked", updatePosition);
  video.addEventListener("volumechange", updateSound);
  video.addEventListener("error", () => showToast("The film couldn’t load. Please refresh to try again."));
  playButton.addEventListener("click", togglePlayback);
  filmToggle.addEventListener("click", togglePlayback);
  element("#replay", HTMLButtonElement).addEventListener("click", () => {
    video.currentTime = 0;
    void playFilm();
  });
  seek.addEventListener("input", () => {
    video.currentTime = clamp(Number(seek.value), 0, FILM.duration - 1 / FILM.fps);
    updatePosition();
  });
  soundButton.addEventListener("click", () => {
    video.muted = !video.muted;
    updateSound();
    if (!video.muted && video.paused) void playFilm();
  });

  fullscreenButton.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await filmSection.requestFullscreen();
    } catch {
      showToast("Fullscreen isn’t available in this browser.");
    }
  });
  document.addEventListener("fullscreenchange", () => {
    fullscreenButton.setAttribute("aria-label", document.fullscreenElement ? "Exit fullscreen" : "Enter fullscreen");
  });

  document.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.code === "Space") {
      event.preventDefault();
      togglePlayback();
    } else if (event.key.toLowerCase() === "m") {
      soundButton.click();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      video.currentTime = clamp(video.currentTime + (event.key === "ArrowLeft" ? -1 : 1), 0, FILM.duration - 1 / FILM.fps);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      resumeWhenVisible = !video.paused;
      video.pause();
    } else if (resumeWhenVisible) {
      resumeWhenVisible = false;
      void playFilm();
    }
  });
  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) video.pause();
  });
  updatePlayback();
  updateSound();
  if (!reducedMotion.matches) void playFilm();
}
