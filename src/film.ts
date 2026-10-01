import { chapterAt, FILM } from "./timeline";
import type { Chapter, SceneBackground, SceneId } from "./timeline";

const INK = "#111827";
const ACCENT = "#7C87FF";
const PAPER = "#f0f2ff";
const BODY = '"DM Sans", sans-serif';
const DISPLAY = '"Space Grotesk", sans-serif';
const TAU = Math.PI * 2;
const BACKGROUNDS = { dark: INK, accent: ACCENT, paper: PAPER } satisfies Record<SceneBackground, string>;

export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const ease = (value: number) => 1 - Math.pow(1 - clamp(value), 4);
const smooth = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

type TextOptions = {
  text: string;
  x: number;
  y: number;
  size: number;
  color?: string;
  weight?: number;
  align?: CanvasTextAlign;
  tracking?: number;
  outline?: boolean;
  font?: string;
};

function text(ctx: CanvasRenderingContext2D, options: TextOptions) {
  const { text: value, x, y, size, color = PAPER, weight = 700, align = "left", tracking = 0, outline = false, font = DISPLAY } = options;
  ctx.save();
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = `${tracking}px`;
  if (outline) {
    ctx.lineWidth = 1.8;
    ctx.strokeText(value, x, y);
  } else {
    ctx.fillText(value, x, y);
  }
  ctx.restore();
}

function line(ctx: CanvasRenderingContext2D, from: [number, number], to: [number, number]) {
  ctx.beginPath();
  ctx.moveTo(...from);
  ctx.lineTo(...to);
  ctx.stroke();
}

type GraphicOptions = { x: number; y: number; size: number; color?: string };

function mark(ctx: CanvasRenderingContext2D, options: GraphicOptions) {
  ctx.save();
  ctx.translate(options.x, options.y);
  ctx.rotate(-22 * Math.PI / 180);
  ctx.scale(options.size / 26, options.size / 26);
  ctx.fillStyle = options.color ?? ACCENT;
  ctx.fillRect(-12, -8.5, 6, 17);
  ctx.fillRect(-3, -13.5, 6, 27);
  ctx.fillRect(6, -8.5, 6, 17);
  ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, options: GraphicOptions) {
  ctx.save();
  ctx.translate(options.x, options.y);
  ctx.strokeStyle = options.color ?? INK;
  ctx.lineWidth = options.size * 0.1;
  ctx.lineCap = "square";
  const s = options.size;
  line(ctx, [-s * 0.38, s * 0.38], [s * 0.38, -s * 0.38]);
  ctx.beginPath();
  ctx.moveTo(-s * 0.2, -s * 0.38);
  ctx.lineTo(s * 0.38, -s * 0.38);
  ctx.lineTo(s * 0.38, s * 0.2);
  ctx.stroke();
  ctx.restore();
}

function pill(ctx: CanvasRenderingContext2D, options: { label: string; x: number; y: number }) {
  const { label, x, y } = options;
  ctx.save();
  ctx.font = `500 21px ${BODY}`;
  const width = ctx.measureText(label).width + 65;
  ctx.strokeStyle = "rgba(124,135,255,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, width, 51, 26);
  ctx.stroke();
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(x + 24, y + 25.5, 4.5, 0, TAU);
  ctx.fill();
  text(ctx, { text: label, x: x + 40, y: y + 33, size: 21, weight: 500, font: BODY });
  ctx.restore();
}

function grid(ctx: CanvasRenderingContext2D, light: boolean) {
  ctx.strokeStyle = light ? "rgba(17,24,39,0.065)" : "rgba(124,135,255,0.045)";
  ctx.lineWidth = 1;
  for (let x = 80; x < FILM.width; x += 110) line(ctx, [x, 0], [x, FILM.height]);
  for (let y = 80; y < FILM.height; y += 110) line(ctx, [0, y], [FILM.width, y]);
}

function metadata(ctx: CanvasRenderingContext2D, chapter: Chapter) {
  const light = chapter.background !== "dark";
  const color = light ? INK : PAPER;
  mark(ctx, { x: 122, y: 108, size: 30, color: light ? INK : ACCENT });
  text(ctx, { text: "portrait", x: 151, y: 123, size: 43, weight: 600, tracking: -2, color });
  ctx.save();
  ctx.font = `600 43px ${DISPLAY}`;
  ctx.letterSpacing = "-2px";
  const dotX = 151 + ctx.measureText("portrait").width;
  ctx.restore();
  text(ctx, { text: ".", x: dotX, y: 123, size: 43, weight: 600, color: light ? INK : ACCENT });
  ctx.save();
  ctx.globalAlpha *= 0.7;
  text(ctx, { text: `${String(chapter.index + 1).padStart(2, "0")} / ${String(FILM.chapters.length).padStart(2, "0")}`, x: 960, y: 121, size: 20, weight: 500, tracking: 3, color, align: "center", font: BODY });
  text(ctx, { text: "PERSONAL SERVER", x: 1814, y: 121, size: 21, weight: 500, tracking: 3, color, align: "right", font: BODY });
  text(ctx, { text: "FROM ARCHITECTURE TO DEPLOYMENT", x: 106, y: 975, size: 20, weight: 500, tracking: 3, color, font: BODY });
  text(ctx, { text: "anthonypillot.fr", x: 1814, y: 975, size: 21, weight: 500, tracking: 2, color, align: "right", font: BODY });
  ctx.strokeStyle = light ? "rgba(17,24,39,0.5)" : "rgba(240,242,255,0.35)";
  ctx.lineWidth = 1;
  for (const [x, y] of [[65, 65], [1855, 65], [65, 1015], [1855, 1015]]) {
    line(ctx, [x - 8, y], [x + 8, y]);
    line(ctx, [x, y - 8], [x, y + 8]);
  }
  ctx.restore();
}

function orbit(ctx: CanvasRenderingContext2D, time: number) {
  const phase = time / FILM.duration * TAU;
  ctx.save();
  ctx.translate(1450, 527);
  ctx.rotate(-0.35 + Math.sin(phase) * 0.06);
  ctx.strokeStyle = "rgba(124,135,255,0.3)";
  ctx.lineWidth = 1.6;
  for (const radius of [263, 336, 414]) {
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.76, 0, 0, TAU);
    ctx.stroke();
  }
  for (let i = 0; i < 3; i++) {
    const angle = phase + i * TAU / 3 - 1.3;
    const radius = [263, 336, 414][i];
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.76;
    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.arc(x, y, i === 2 ? 8 : 5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(124,135,255,0.09)";
    line(ctx, [x, y], [0, 0]);
  }
  ctx.restore();
  mark(ctx, { x: 1450, y: 527, size: 133 });
}

function nameScene(ctx: CanvasRenderingContext2D, time: number) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, FILM.width, FILM.height);
  const glow = ctx.createRadialGradient(1450, 520, 10, 1450, 520, 850);
  glow.addColorStop(0, "rgba(124,135,255,0.11)");
  glow.addColorStop(1, "rgba(17,24,39,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, FILM.width, FILM.height);
  grid(ctx, false);
  orbit(ctx, time);

  const label = ease((time + 0.45) / 1);
  ctx.save();
  ctx.globalAlpha *= label;
  text(ctx, { text: "HELLO, I’M", x: 120, y: 256 - (1 - label) * 25, size: 27, weight: 500, color: ACCENT, tracking: 5 });
  ctx.restore();

  ["ANTHONY", "PILLOT."].forEach((value, index) => {
    const reveal = ease((time + 0.4 - index * 0.16) / 1.05);
    const y = 476 + index * 228;
    ctx.save();
    ctx.beginPath();
    ctx.rect(98, y - 205, 1150, 242);
    ctx.clip();
    ctx.save();
    ctx.globalAlpha *= 0.16;
    text(ctx, { text: value, x: 121, y: y + (1 - reveal) * 240 + 19, size: 236, tracking: -12, outline: true });
    ctx.restore();
    text(ctx, { text: value, x: 108, y: y + (1 - reveal) * 250, size: 236, tracking: -12 });
    ctx.restore();
  });

  const subtitle = ease((time - 0.12) / 0.95);
  ctx.save();
  ctx.globalAlpha *= subtitle;
  text(ctx, { text: "Lead Full-Stack Engineer.", x: 121, y: 797 + (1 - subtitle) * 25, size: 34, weight: 400, font: BODY, color: "#acb7d1" });
  pill(ctx, { label: "OPEN-SOURCE ADVOCATE", x: 121, y: 841 });
  text(ctx, { text: "LILLE, FRANCE", x: 1450, y: 902, size: 20, weight: 500, tracking: 4, color: ACCENT, align: "center" });
  ctx.restore();
}

function pipeline(ctx: CanvasRenderingContext2D, local: number) {
  const layers = [
    { title: "FRONTEND", tools: "Vue · Nuxt · TypeScript" },
    { title: "BACKEND", tools: "Node.js · PostgreSQL" },
    { title: "INFRASTRUCTURE", tools: "Docker · Kubernetes" },
  ];
  const x = 1230;
  const width = 540;
  const height = 132;
  const gap = 85;
  ctx.save();
  layers.forEach((layer, index) => {
    const y = 250 + index * (height + gap);
    const entry = ease((local - index * 0.14) / 1);
    ctx.save();
    ctx.globalAlpha *= entry;
    ctx.translate((1 - entry) * 80, 0);
    ctx.fillStyle = "rgba(17,24,39,0.05)";
    ctx.strokeStyle = "rgba(17,24,39,0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 5);
    ctx.fill();
    ctx.stroke();
    text(ctx, { text: `0${index + 1}`, x: x + 23, y: y + 39, size: 19, weight: 500, color: INK });
    text(ctx, { text: layer.title, x: x + 76, y: y + 39, size: 19, weight: 500, tracking: 2, color: INK });
    text(ctx, { text: layer.tools, x: x + 24, y: y + 94, size: 31, weight: 500, color: INK });
    if (index < layers.length - 1) {
      const center = x + width / 2;
      ctx.strokeStyle = "rgba(17,24,39,0.3)";
      line(ctx, [center, y + height], [center, y + height + gap]);
      const progress = ((local / (FILM.beatDuration * 2) - index * 0.3) % 1 + 1) % 1;
      ctx.fillStyle = INK;
      ctx.fillRect(center - 4, y + height + progress * (gap - 8), 8, 8);
    }
    ctx.restore();
  });
  ctx.restore();
}

function buildScene(ctx: CanvasRenderingContext2D, _time: number, local: number) {
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, FILM.width, FILM.height);
  grid(ctx, true);
  pipeline(ctx, local);

  text(ctx, { text: "FULL STACK. FULL PICTURE.", x: 121, y: 224, size: 27, weight: 500, tracking: 3, color: INK });
  const rows = [
    { text: "ARCHITECT.", size: 173, y: 409 },
    { text: "BUILD.", size: 218, y: 613 },
    { text: "DEPLOY.", size: 218, y: 817 },
  ];
  rows.forEach((row, index) => {
    const reveal = ease((local - index * 0.14) / 1);
    ctx.save();
    ctx.beginPath();
    ctx.rect(109, row.y - row.size, 1100, row.size + 30);
    ctx.clip();
    text(ctx, { ...row, x: 112, y: row.y + (1 - reveal) * (row.size + 30), tracking: -9, color: INK });
    ctx.restore();
  });
  const detail = ease((local - 0.65) / 0.9);
  ctx.save();
  ctx.globalAlpha *= detail;
  arrow(ctx, { x: 963, y: 553, size: 102 });
  text(ctx, { text: "From idea to production.", x: 123, y: 907 + (1 - detail) * 20, size: 30, weight: 400, font: BODY, color: INK });
  text(ctx, { text: "CONNECTED, END TO END.", x: 1500, y: 902, size: 20, weight: 500, tracking: 3, color: INK, align: "center" });
  ctx.restore();
}

type HeadlineRow = Pick<TextOptions, "text" | "size" | "y" | "color" | "tracking">;

function revealHeadline(ctx: CanvasRenderingContext2D, rows: HeadlineRow[], local: number) {
  rows.forEach((row, index) => {
    const reveal = ease((local - index * 0.14) / 1);
    ctx.save();
    ctx.beginPath();
    ctx.rect(109, row.y - row.size, 1100, row.size + 35);
    ctx.clip();
    text(ctx, { ...row, x: 112, y: row.y + (1 - reveal) * (row.size + 35), tracking: row.tracking ?? -8 });
    ctx.restore();
  });
}

function agentNetwork(ctx: CanvasRenderingContext2D, time: number, local: number) {
  const labels = ["MCP", "TOOLS", "CONTEXT", "APIs"];
  ctx.save();
  ctx.translate(1450, 535);
  ctx.strokeStyle = "rgba(124,135,255,0.14)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 278, 0, TAU);
  ctx.stroke();
  labels.forEach((label, index) => {
    const angle = -Math.PI / 2 + index * Math.PI / 2;
    const x = Math.cos(angle) * 278;
    const y = Math.sin(angle) * 278;
    const bend = 28 * Math.sin(time * 0.5 + index);
    const cx = x / 2 - Math.sin(angle) * bend;
    const cy = y / 2 + Math.cos(angle) * bend;
    ctx.save();
    ctx.globalAlpha *= ease((local - index * 0.12) / 1.1);
    ctx.strokeStyle = "rgba(124,135,255,0.45)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(cx, cy, x, y);
    ctx.stroke();
    const progress = ((local / (FILM.beatDuration * 2) + index / 4) % 1 + 1) % 1;
    const px = 2 * (1 - progress) * progress * cx + progress * progress * x;
    const py = 2 * (1 - progress) * progress * cy + progress * progress * y;
    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.roundRect(x - 79, y - 34, 158, 68, 10);
    ctx.fill();
    ctx.stroke();
    text(ctx, { text: label, x, y: y + 8, size: 23, color: PAPER, weight: 500, align: "center", tracking: 1 });
    ctx.restore();
  });
  ctx.save();
  ctx.globalAlpha *= ease(local / 1);
  ctx.fillStyle = INK;
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 103, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(124,135,255,0.15)";
  ctx.beginPath();
  ctx.arc(0, 0, 128 + Math.sin(local / (FILM.beatDuration * 2) * TAU) * 3, 0, TAU);
  ctx.stroke();
  mark(ctx, { x: 0, y: -23, size: 57 });
  text(ctx, { text: "AGENT", x: 0, y: 53, size: 24, weight: 500, color: PAPER, tracking: 3, align: "center" });
  ctx.restore();
  ctx.restore();
}

function agentScene(ctx: CanvasRenderingContext2D, time: number, local: number) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, FILM.width, FILM.height);
  grid(ctx, false);
  const glow = ctx.createRadialGradient(1450, 535, 20, 1450, 535, 420);
  glow.addColorStop(0, "rgba(124,135,255,0.08)");
  glow.addColorStop(1, "rgba(17,24,39,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(1030, 150, 890, 800);
  agentNetwork(ctx, time, local);
  text(ctx, { text: "INTELLIGENCE, CONNECTED.", x: 121, y: 224, size: 27, weight: 500, tracking: 3, color: ACCENT });
  revealHeadline(ctx, [
    { text: "AGENTS.", size: 218, y: 413, tracking: -10 },
    { text: "TOOLS.", size: 218, y: 615, color: ACCENT, tracking: -10 },
    { text: "CONNECTIONS.", size: 146, y: 817, color: ACCENT, tracking: -7 },
  ], local);
  ctx.save();
  ctx.globalAlpha *= ease((local - 0.65) / 0.9);
  text(ctx, { text: "Building agentic systems & MCP integrations.", x: 123, y: 907, size: 30, weight: 400, font: BODY, color: "#acb7d1" });
  text(ctx, { text: "CONTEXT INTO ACTION.", x: 1450, y: 902, size: 20, weight: 500, tracking: 3, color: ACCENT, align: "center" });
  ctx.restore();
}

type HumanParticle = { x: number; y: number; emphasis: boolean };

function createHumanParticles(): HumanParticle[] {
  const particles: HumanParticle[] = [];
  for (const person of [
    { x: -245, y: -90, radius: 44, width: 112, height: 114, emphasis: false },
    { x: 245, y: -90, radius: 44, width: 112, height: 114, emphasis: false },
    { x: 0, y: -145, radius: 64, width: 175, height: 170, emphasis: true },
  ]) {
    for (let i = 0; i < 32; i++) {
      const angle = i / 32 * TAU;
      particles.push({ x: person.x + Math.cos(angle) * person.radius, y: person.y + Math.sin(angle) * person.radius, emphasis: person.emphasis });
    }
    for (let i = 0; i <= 44; i++) {
      const progress = i / 44;
      particles.push({ x: person.x + (progress * 2 - 1) * person.width, y: 150 - Math.sin(progress * Math.PI) * person.height, emphasis: person.emphasis });
    }
    for (let i = 0; i <= 20; i++) {
      particles.push({ x: person.x + (i / 20 * 2 - 1) * person.width, y: 185, emphasis: person.emphasis });
    }
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        particles.push({ x: person.x + side * person.width, y: 150 + i * 9, emphasis: person.emphasis });
      }
    }
  }
  return particles;
}

const HUMAN_PARTICLES = createHumanParticles();

function humanScene(ctx: CanvasRenderingContext2D, time: number, local: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, FILM.width, FILM.height);
  grid(ctx, true);
  ctx.save();
  ctx.translate(1450, 535);
  ctx.strokeStyle = "rgba(124,135,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 340, 0, TAU);
  ctx.stroke();
  HUMAN_PARTICLES.forEach((particle, index) => {
    const assembly = ease((local - index * 0.001) / 1.45);
    const phase = time / FILM.duration * TAU;
    const x = particle.x + Math.cos(index * 2.399) * 200 * (1 - assembly) + Math.sin(phase + index * 0.18) * 0.8;
    const y = particle.y + Math.sin(index * 1.71) * 190 * (1 - assembly) + Math.cos(phase + index * 0.18) * 0.8;
    ctx.fillStyle = particle.emphasis ? ACCENT : "rgba(17,24,39,0.26)";
    ctx.beginPath();
    ctx.arc(x, y, particle.emphasis ? 3.2 : 2.6, 0, TAU);
    ctx.fill();
  });
  ctx.restore();
  text(ctx, { text: "BEHIND THE CODE.", x: 121, y: 224, size: 27, weight: 500, tracking: 3, color: INK });
  revealHeadline(ctx, [
    { text: "ENGINEERING.", size: 151, y: 408, color: INK, tracking: -7 },
    { text: "WITH A", size: 129, y: 590, color: INK, tracking: -6 },
    { text: "HUMAN SIDE.", size: 164, y: 817, color: ACCENT, tracking: -8 },
  ], local);
  ctx.save();
  ctx.globalAlpha *= ease((local - 0.7) / 0.95);
  text(ctx, { text: "Software engineering meets work psychology.", x: 123, y: 907, size: 30, weight: 400, font: BODY, color: INK });
  text(ctx, { text: "TECHNOLOGY × PEOPLE", x: 1450, y: 902, size: 20, weight: 500, tracking: 3, color: INK, align: "center" });
  ctx.restore();
}

function contributionGraph(ctx: CanvasRenderingContext2D, local: number) {
  const opening = ease((local - 0.1) / 1.2);
  ctx.save();
  ctx.translate(1450, 530);
  ctx.globalAlpha *= opening;
  ctx.scale(0.8 + opening * 0.2, 0.8 + opening * 0.2);
  const spread = 200 + opening * 90;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7;
  ctx.lineJoin = "miter";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * (spread - 85), -145);
    ctx.lineTo(side * spread, 0);
    ctx.lineTo(side * (spread - 85), 145);
    ctx.stroke();
  }
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "rgba(17,24,39,0.7)";
  line(ctx, [0, -202], [0, 202]);
  ctx.beginPath();
  ctx.moveTo(0, -80);
  ctx.bezierCurveTo(0, 25, 155, -10, 155, 135);
  ctx.stroke();
  ctx.fillStyle = INK;
  for (const [x, y] of [[0, -202], [0, 0], [0, 202], [155, 135]]) {
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, TAU);
    ctx.fill();
  }
  const progress = ((local / (FILM.beatDuration * 2)) % 1 + 1) % 1;
  const inverse = 1 - progress;
  const px = 3 * inverse * progress * progress * 155 + progress ** 3 * 155;
  const py = inverse ** 3 * -80 + 3 * inverse ** 2 * progress * 25 + 3 * inverse * progress ** 2 * -10 + progress ** 3 * 135;
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -202 + progress * 404, 5, 0, TAU);
  ctx.fill();
  text(ctx, { text: "SOURCE", x: 0, y: -246, size: 19, weight: 500, tracking: 3, color: INK, align: "center" });
  text(ctx, { text: "FOSS", x: 0, y: 256, size: 19, weight: 500, tracking: 3, color: INK, align: "center" });
  text(ctx, { text: "CONTRIBUTE", x: 155, y: 187, size: 15, weight: 500, tracking: 1, color: INK, align: "center" });
  ctx.restore();
}

function openScene(ctx: CanvasRenderingContext2D, _time: number, local: number) {
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, FILM.width, FILM.height);
  grid(ctx, true);
  contributionGraph(ctx, local);
  text(ctx, { text: "GOOD IDEAS GROW TOGETHER.", x: 121, y: 224, size: 27, weight: 500, tracking: 3, color: INK });
  revealHeadline(ctx, [
    { text: "BUILT IN", size: 178, y: 413, color: INK, tracking: -8 },
    { text: "THE", size: 218, y: 615, color: INK, tracking: -10 },
    { text: "OPEN.", size: 218, y: 817, color: INK, tracking: -10 },
  ], local);
  ctx.save();
  ctx.globalAlpha *= ease((local - 0.65) / 0.9);
  text(ctx, { text: "Open-source advocate.", x: 123, y: 907, size: 30, weight: 400, font: BODY, color: INK });
  text(ctx, { text: "SHARE KNOWLEDGE. BUILD TOGETHER.", x: 1450, y: 902, size: 18, weight: 500, tracking: 2, color: INK, align: "center" });
  ctx.restore();
}

function serverStack(ctx: CanvasRenderingContext2D, time: number) {
  const phase = time / FILM.duration * TAU;
  ctx.save();
  ctx.translate(1450, 377 + Math.sin(phase) * 10);
  ctx.strokeStyle = "rgba(124,135,255,0.15)";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(0, 150, 388, 322, -0.3, 0, TAU);
  ctx.stroke();
  const labels = ["PROJECTS", "TOOLS", "ASSETS"];
  labels.forEach((label, index) => {
    ctx.save();
    ctx.translate(0, index * 178);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = "rgba(124,135,255,0.8)";
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(-222, 0);
    ctx.lineTo(0, -52);
    ctx.lineTo(222, 0);
    ctx.lineTo(222, 60);
    ctx.lineTo(0, 112);
    ctx.lineTo(-222, 60);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(124,135,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(-222, 0);
    ctx.lineTo(0, -52);
    ctx.lineTo(222, 0);
    ctx.lineTo(0, 52);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    line(ctx, [0, 52], [0, 112]);
    ctx.save();
    ctx.translate(-179, 33);
    ctx.rotate(Math.atan2(52, 222));
    text(ctx, { text: label, x: 0, y: 12, size: 21, weight: 500, tracking: 2 });
    ctx.restore();
    ctx.fillStyle = ACCENT;
    const pulse = 0.65 + Math.sin(phase + index) * 0.2;
    ctx.save();
    ctx.globalAlpha *= pulse;
    ctx.beginPath();
    ctx.arc(169, 48, 4, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  });
  const x = Math.cos(phase - 0.4) * 388;
  const y = 150 + Math.sin(phase - 0.4) * 322;
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function hostScene(ctx: CanvasRenderingContext2D, time: number, local: number) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, FILM.width, FILM.height);
  grid(ctx, false);
  ctx.save();
  ctx.globalAlpha *= ease(local / 1.2);
  serverStack(ctx, time);
  ctx.restore();
  text(ctx, { text: "A HOME FOR WHAT I CREATE.", x: 121, y: 224, size: 27, weight: 500, tracking: 3, color: ACCENT });
  ["BUILD.", "HOST.", "SHARE."].forEach((value, index) => {
    const reveal = ease((local - index * 0.14) / 1);
    const y = 413 + index * 202;
    ctx.save();
    ctx.beginPath();
    ctx.rect(109, y - 218, 1100, 243);
    ctx.clip();
    text(ctx, { text: value, x: 112, y: y + (1 - reveal) * 248, size: 218, tracking: -10, color: index === 0 ? PAPER : ACCENT });
    ctx.restore();
  });
  ctx.save();
  ctx.globalAlpha *= ease((local - 0.7) / 0.9);
  text(ctx, { text: "anthonypillot.fr · My personal server.", x: 123, y: 907, size: 30, weight: 400, font: BODY, color: "#acb7d1" });
  text(ctx, { text: "OPEN SOURCE. SELF-HOSTED.", x: 1450, y: 902, size: 20, weight: 500, tracking: 3, color: ACCENT, align: "center" });
  ctx.restore();
}

type SceneRenderer = (ctx: CanvasRenderingContext2D, time: number, local: number) => void;

const SCENE_RENDERERS = {
  introduction: nameScene,
  engineering: buildScene,
  agents: agentScene,
  human: humanScene,
  opensource: openScene,
  hosting: hostScene,
} satisfies Record<SceneId, SceneRenderer>;

/** A periodic composition: the closing reveal continues into the opening frame. */
export function renderFilm(ctx: CanvasRenderingContext2D, seconds: number) {
  const time = ((seconds % FILM.duration) + FILM.duration) % FILM.duration;
  const chapter = chapterAt(time);
  ctx.save();
  ctx.setTransform(ctx.canvas.width / FILM.width, 0, 0, ctx.canvas.height / FILM.height, 0, 0);
  SCENE_RENDERERS[chapter.id](ctx, time, time - chapter.start);
  metadata(ctx, chapter);

  for (const incoming of FILM.chapters.slice(1)) {
    const progress = (time - incoming.start + FILM.transitionDuration / 2) / FILM.transitionDuration;
    if (progress > 0 && progress < 1) {
      const x = progress < 0.5
        ? FILM.width * (1 - smooth(progress * 2))
        : -FILM.width * smooth((progress - 0.5) * 2);
      ctx.fillStyle = BACKGROUNDS[incoming.background];
      ctx.fillRect(x, 0, FILM.width, FILM.height);
    }
  }

  if (time >= FILM.duration - FILM.loopRevealDuration) {
    ctx.save();
    ctx.globalAlpha = smooth((time - FILM.duration + FILM.loopRevealDuration) / (FILM.loopRevealDuration - 0.1));
    nameScene(ctx, time - FILM.duration);
    metadata(ctx, FILM.chapters[0]);
    ctx.restore();
  }
  ctx.restore();
}
