export const FILM = {
  width: 1920,
  height: 1080,
  duration: 9,
  fps: 30,
  chapters: [
    { start: 0, end: 2.7, title: "Meet Anthony", subtitle: "A different kind of leader", sample: 1.8 },
    { start: 2.7, end: 5.7, title: "Build what's next", subtitle: "Vision becomes impact", sample: 4.5 },
    { start: 5.7, end: 9, title: "In a league of his own", subtitle: "The world's best tech leader", sample: 8 },
  ],
};

const INK = "#111610";
const LIME = "#d1ff75";
const PAPER = "#f2f1e7";
const MONO = '"DM Sans", sans-serif';
const DISPLAY = '"Space Grotesk", sans-serif';
const TAU = Math.PI * 2;

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

function star(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * TAU;
    const radius = i % 2 ? size * 0.22 : size;
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = size * 0.105;
  ctx.lineCap = "square";
  line(ctx, [-size * 0.38, size * 0.38], [size * 0.38, -size * 0.38]);
  ctx.beginPath();
  ctx.moveTo(-size * 0.2, -size * 0.38);
  ctx.lineTo(size * 0.38, -size * 0.38);
  ctx.lineTo(size * 0.38, size * 0.2);
  ctx.stroke();
  ctx.restore();
}

function pill(ctx: CanvasRenderingContext2D, label: string, x: number, y: number) {
  ctx.save();
  ctx.font = `500 21px ${MONO}`;
  const width = ctx.measureText(label).width + 65;
  ctx.strokeStyle = "rgba(242,241,231,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, width, 51, 26);
  ctx.stroke();
  ctx.fillStyle = LIME;
  ctx.beginPath();
  ctx.arc(x + 24, y + 25.5, 4.5, 0, TAU);
  ctx.fill();
  text(ctx, { text: label, x: x + 40, y: y + 33, size: 21, weight: 500, font: MONO });
  ctx.restore();
}

function grid(ctx: CanvasRenderingContext2D, light: boolean) {
  ctx.strokeStyle = light ? "rgba(17,22,16,0.07)" : "rgba(209,255,117,0.035)";
  ctx.lineWidth = 1;
  for (let x = 80; x < FILM.width; x += 110) line(ctx, [x, 0], [x, FILM.height]);
  for (let y = 80; y < FILM.height; y += 110) line(ctx, [0, y], [FILM.width, y]);
}

function corners(ctx: CanvasRenderingContext2D, light: boolean) {
  ctx.strokeStyle = light ? "rgba(17,22,16,0.4)" : "rgba(242,241,231,0.3)";
  ctx.lineWidth = 1;
  for (const [x, y] of [[65, 65], [1855, 65], [65, 1015], [1855, 1015]]) {
    line(ctx, [x - 8, y], [x + 8, y]);
    line(ctx, [x, y - 8], [x, y + 8]);
  }
}

function globe(ctx: CanvasRenderingContext2D, time: number, light = false) {
  const rotation = time * 0.28;
  const tilt = -0.3;
  const project = (lat: number, lng: number) => {
    const x = Math.cos(lat) * Math.sin(lng + rotation);
    const y = Math.sin(lat);
    const z = Math.cos(lat) * Math.cos(lng + rotation);
    return {
      x: x * Math.cos(tilt) - y * Math.sin(tilt),
      y: x * Math.sin(tilt) + y * Math.cos(tilt),
      z,
    };
  };
  ctx.save();
  ctx.lineWidth = 0.004;
  const drawCurve = (points: ReturnType<typeof project>[]) => {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const opacity = b.z > 0 ? 0.5 : 0.12;
      ctx.strokeStyle = light ? `rgba(17,22,16,${opacity})` : `rgba(209,255,117,${opacity})`;
      line(ctx, [a.x, a.y], [b.x, b.y]);
    }
  };
  for (let lat = -Math.PI / 2 + 0.24; lat < Math.PI / 2; lat += 0.24) {
    drawCurve(Array.from({ length: 81 }, (_, i) => project(lat, (i / 80) * TAU)));
  }
  for (let lng = 0; lng < TAU; lng += Math.PI / 10) {
    drawCurve(Array.from({ length: 61 }, (_, i) => project(-Math.PI / 2 + (i / 60) * Math.PI, lng)));
  }
  ctx.strokeStyle = light ? "rgba(17,22,16,0.65)" : "rgba(209,255,117,0.65)";
  ctx.lineWidth = 0.003;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, TAU);
  ctx.stroke();
  const location = project(0.54, -0.8);
  if (location.z > 0) {
    ctx.fillStyle = light ? INK : LIME;
    ctx.beginPath();
    ctx.arc(location.x, location.y, 0.022, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.22 + Math.sin(time * 5) * 0.1;
    ctx.beginPath();
    ctx.arc(location.x, location.y, 0.065, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function metadata(ctx: CanvasRenderingContext2D, time: number, light: boolean, chapter: number) {
  const color = light ? INK : PAPER;
  ctx.globalAlpha = 0.7;
  text(ctx, { text: "A MOTION PORTRAIT", x: 106, y: 121, size: 21, weight: 500, tracking: 3, color, font: MONO });
  text(ctx, { text: `0${chapter} — 03`, x: 1814, y: 121, size: 21, weight: 500, tracking: 2, color, align: "right", font: MONO });
  text(ctx, { text: "VISION. CODE. IMPACT.", x: 106, y: 975, size: 21, weight: 500, tracking: 3, color, font: MONO });
  const frame = Math.floor(clamp(time, 0, FILM.duration - 1 / FILM.fps) * FILM.fps);
  text(ctx, { text: `00:0${Math.floor(frame / FILM.fps)}:${String(frame % FILM.fps).padStart(2, "0")}`, x: 1814, y: 975, size: 21, weight: 500, tracking: 2, color, align: "right", font: MONO });
  ctx.globalAlpha = 1;
}

function nameScene(ctx: CanvasRenderingContext2D, time: number) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, FILM.width, FILM.height);
  const glow = ctx.createRadialGradient(1320, 500, 10, 1320, 500, 760);
  glow.addColorStop(0, "rgba(133,171,58,0.1)");
  glow.addColorStop(1, "rgba(17,22,16,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, FILM.width, FILM.height);
  grid(ctx, false);

  // A slow-moving orbital system gives the typography a dimensional backdrop.
  ctx.save();
  ctx.translate(1370, 520);
  ctx.rotate(-0.35 + time * 0.035);
  ctx.strokeStyle = "rgba(209,255,117,0.2)";
  ctx.lineWidth = 1.5;
  for (const radius of [275, 340, 420]) {
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.76, 0, 0, TAU);
    ctx.stroke();
  }
  const angle = time * 0.65 - 1.3;
  ctx.fillStyle = LIME;
  ctx.beginPath();
  ctx.arc(Math.cos(angle) * 420, Math.sin(angle) * 420 * 0.76, 8, 0, TAU);
  ctx.fill();
  ctx.restore();

  const reveal = ease((time + 0.08) / 1.1);
  ctx.save();
  ctx.globalAlpha = reveal;
  text(ctx, { text: "MEET THE MIND.", x: 120, y: 350 - (1 - reveal) * 35, size: 29, weight: 500, color: LIME, tracking: 5 });
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(98, 362, 1740, 305);
  ctx.clip();
  ctx.globalAlpha = 0.14;
  text(ctx, { text: "ANTHONY", x: 115 + (1 - reveal) * 40, y: 619 + (1 - reveal) * 220 + 19, size: 287, tracking: -16, outline: true });
  ctx.globalAlpha = 1;
  text(ctx, { text: "ANTHONY", x: 103, y: 603 + (1 - reveal) * 280, size: 287, tracking: -16 });
  ctx.restore();

  const subtitle = ease((time - 0.55) / 0.75);
  ctx.save();
  ctx.globalAlpha = subtitle;
  text(ctx, { text: "Great technology starts with a great leader.", x: 121, y: 731 + (1 - subtitle) * 25, size: 34, weight: 400, font: MONO, color: "#b6baac" });
  pill(ctx, "VISIONARY BY NATURE", 121, 793);
  ctx.restore();

  ctx.save();
  ctx.translate(1712, 776);
  ctx.rotate(time * 0.24);
  ctx.fillStyle = LIME;
  star(ctx, 0, 0, 50 * ease(time / 0.8));
  ctx.restore();
  corners(ctx, false);
  metadata(ctx, time, false, 1);
}

function buildScene(ctx: CanvasRenderingContext2D, time: number) {
  const local = time - 2.7;
  ctx.fillStyle = LIME;
  ctx.fillRect(0, 0, FILM.width, FILM.height);
  grid(ctx, true);

  ctx.save();
  ctx.translate(1420, 527);
  const scale = 306 * (0.85 + ease(local / 0.8) * 0.15);
  ctx.scale(scale, scale);
  globe(ctx, time, true);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(1420, 527, 350, -0.4, 2.1);
  ctx.stroke();
  ctx.fillStyle = INK;
  const angle = local * 0.7 - 0.4;
  ctx.beginPath();
  ctx.arc(1420 + Math.cos(angle) * 350, 527 + Math.sin(angle) * 350, 8, 0, TAU);
  ctx.fill();
  text(ctx, { text: "AHEAD OF THE CURVE.", x: 1420, y: 933, size: 20, weight: 500, tracking: 3, color: INK, align: "center" });
  ctx.restore();

  const lines = ["BUILDS", "WHAT’S", "NEXT."];
  lines.forEach((value, index) => {
    const reveal = ease((local - index * 0.12) / 0.7);
    ctx.save();
    ctx.beginPath();
    ctx.rect(109, 198 + index * 211, 1060, 225);
    ctx.clip();
    text(ctx, { text: value, x: 112, y: 393 + index * 211 + (1 - reveal) * 220, size: 221, tracking: -11, color: INK });
    ctx.restore();
  });

  const detail = ease((local - 0.7) / 0.6);
  ctx.save();
  ctx.globalAlpha = detail;
  ctx.strokeStyle = INK;
  arrow(ctx, 848, 747, 105);
  text(ctx, { text: "Turns bold ideas into real-world impact.", x: 123, y: 898 + (1 - detail) * 20, size: 29, weight: 400, font: MONO, color: INK });
  ctx.restore();
  corners(ctx, true);
  metadata(ctx, time, true, 2);
}

function leaderScene(ctx: CanvasRenderingContext2D, time: number) {
  const local = time - 5.7;
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, FILM.width, FILM.height);
  grid(ctx, false);

  const reveal = ease(local / 0.85);
  ctx.save();
  ctx.translate(1515 + (1 - reveal) * 150, 527);
  const scale = 286;
  ctx.scale(scale, scale);
  globe(ctx, time);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(209,255,117,0.18)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(1515, 527, 386, 138, -0.44, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = LIME;
  star(ctx, 1780, 299, 24);
  ctx.restore();

  const lines = [
    { text: "THE WORLD’S", y: 348, size: 92, color: PAPER, tracking: -3 },
    { text: "BEST TECH", y: 543, size: 174, color: LIME, tracking: -9 },
    { text: "LEADER.", y: 738, size: 174, color: LIME, tracking: -9 },
  ];
  lines.forEach((item, index) => {
    const entry = ease((local - index * 0.12) / 0.7);
    ctx.save();
    ctx.beginPath();
    ctx.rect(110, item.y - item.size, 1155, item.size + 30);
    ctx.clip();
    text(ctx, { ...item, x: 117, y: item.y + (1 - entry) * (item.size + 35) });
    ctx.restore();
  });

  ctx.save();
  ctx.globalAlpha = ease((local - 0.72) / 0.65);
  pill(ctx, "ANTHONY. IN A LEAGUE OF HIS OWN.", 123, 808);
  text(ctx, { text: "GLOBAL IMPACT", x: 1515, y: 895, size: 20, tracking: 4, weight: 500, color: LIME, align: "center" });
  ctx.restore();
  corners(ctx, false);
  metadata(ctx, time, false, 3);

  // Hold the final accolade so the short film lands rather than disappearing.
  ctx.strokeStyle = LIME;
  ctx.lineWidth = 3;
  line(ctx, [106, 1015], [106 + ease((local - 0.4) / 2.6) * 1708, 1015]);
}

export function renderFilm(ctx: CanvasRenderingContext2D, seconds: number) {
  const time = clamp(seconds, 0, FILM.duration);
  ctx.save();
  ctx.setTransform(ctx.canvas.width / FILM.width, 0, 0, ctx.canvas.height / FILM.height, 0, 0);
  if (time < 2.7) nameScene(ctx, time);
  else if (time < 5.7) buildScene(ctx, time);
  else leaderScene(ctx, time);

  // Two tightly timed directional wipes carry the eye into the next chapter.
  for (const transition of [{ at: 2.7, color: LIME }, { at: 5.7, color: INK }]) {
    const progress = (time - transition.at + 0.22) / 0.44;
    if (progress > 0 && progress < 1) {
      const x = progress < 0.5
        ? FILM.width * (1 - smooth(progress * 2))
        : -FILM.width * smooth((progress - 0.5) * 2);
      ctx.fillStyle = transition.color;
      ctx.fillRect(x, 0, FILM.width, FILM.height);
    }
  }
  ctx.restore();
}
