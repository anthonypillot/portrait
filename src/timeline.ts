export type SceneId = "introduction" | "engineering" | "agents" | "human" | "opensource" | "hosting";
export type SceneBackground = "dark" | "accent" | "paper";

type SceneDefinition = {
  id: SceneId;
  title: string;
  headline: string;
  subtitle: string;
  background: SceneBackground;
};

const scenes = [
  { id: "introduction", title: "The engineer", headline: "Anthony Pillot.", subtitle: "Lead Full-Stack Engineer. Open-source advocate.", background: "dark" },
  { id: "engineering", title: "From idea to production", headline: "Architect. Build. Deploy.", subtitle: "From idea to production.", background: "accent" },
  { id: "agents", title: "Connected intelligence", headline: "Agents. Tools. Connections.", subtitle: "Building agentic systems & MCP integrations.", background: "dark" },
  { id: "human", title: "The human side", headline: "Engineering. With a human side.", subtitle: "Software engineering meets work psychology.", background: "paper" },
  { id: "opensource", title: "Built in the open", headline: "Built in the open.", subtitle: "Open-source advocate.", background: "accent" },
  { id: "hosting", title: "A place to build and share", headline: "Build. Host. Share.", subtitle: "anthonypillot.fr · My personal server.", background: "dark" },
] satisfies SceneDefinition[];

const sceneDuration = 5;
const bpm = 96;

export const FILM = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: scenes.length * sceneDuration,
  sceneDuration,
  bpm,
  beatDuration: 60 / bpm,
  transitionDuration: 60 / bpm,
  loopRevealDuration: 0.9,
  chapters: scenes.map((scene, index) => ({
    ...scene,
    index,
    start: index * sceneDuration,
    end: (index + 1) * sceneDuration,
    sample: (index + 0.5) * sceneDuration,
  })),
};

export type Chapter = (typeof FILM.chapters)[number];

export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}

export function chapterAt(seconds: number): Chapter {
  return FILM.chapters.find((chapter) => seconds >= chapter.start && seconds < chapter.end) ?? FILM.chapters[0];
}
