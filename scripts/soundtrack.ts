import { clamp } from "../src/film";
import { FILM } from "../src/timeline";

/** Original periodic electronic score, synthesized without external assets. */
export function createSoundtrack(): Buffer {
  const sampleRate = 48_000;
  const sampleCount = sampleRate * FILM.duration;
  const channels = 2;
  const dataSize = sampleCount * channels * 2;
  const wav = Buffer.alloc(44 + dataSize);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * channels * 2, 28);
  wav.writeUInt16LE(channels * 2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(dataSize, 40);

  const tau = Math.PI * 2;
  const loopFrequency = (frequency: number) => Math.round(frequency * FILM.duration) / FILM.duration;
  const notes = [220, 329.63, 440, 587.33, 659.26, 440].map(loopFrequency);
  const chord = [110, 164.815, 220, 293.665].map(loopFrequency);
  const halfBeat = FILM.beatDuration / 2;
  const transitions = FILM.chapters.slice(1).map((chapter) => chapter.start);
  const humanChapter = FILM.chapters.find((chapter) => chapter.id === "human");
  let seed = 123456;
  let filteredNoise = 0;

  for (let i = 0; i < sampleCount; i++) {
    const t = i / sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = (seed / 4294967295) * 2 - 1;
    filteredNoise = filteredNoise * 0.94 + noise * 0.06;

    // Integer cycle counts and periodic modulation join the pad at the loop seam.
    const phase = t / FILM.duration * tau;
    let pad = 0;
    for (const frequency of chord) {
      pad += Math.sin(tau * frequency * t + Math.sin(phase) * 0.1) * 0.017;
    }

    // 96 BPM: eight beats per scene, with a softer passage for the human-side act.
    const humanBlend = humanChapter
      ? Math.min(clamp((t - humanChapter.start) / FILM.beatDuration), clamp((humanChapter.end - t) / FILM.beatDuration))
      : 0;
    const noteIndex = Math.floor(t / halfBeat);
    const noteTime = t - noteIndex * halfBeat;
    const frequency = notes[noteIndex % notes.length];
    const arpEnvelope = Math.min(1, noteTime / 0.009) * Math.pow(clamp(1 - noteTime / halfBeat), 3) * (1 - humanBlend * 0.3);
    const arp = (
      Math.sin(tau * frequency * noteTime) * 0.062 +
      Math.sin(tau * frequency * 2 * noteTime) * 0.014
    ) * arpEnvelope;

    const beatTime = t % FILM.beatDuration;
    const kick = Math.sin(tau * (50 * beatTime + 2.3 * (1 - Math.exp(-beatTime * 30)))) * Math.exp(-beatTime * 24) * 0.15 * (1 - humanBlend * 0.45);
    const hatTime = t % halfBeat;
    const hatEnvelope = Math.min(1, hatTime / 0.002) * Math.pow(clamp(1 - hatTime / 0.09), 3);
    const hat = (noise - filteredNoise) * hatEnvelope * 0.023 * (1 - humanBlend * 0.4);

    let sweep = 0;
    let impact = 0;
    for (const transition of transitions) {
      const before = t - (transition - 0.42);
      if (before > 0 && before < 0.42) {
        const strength = Math.pow(before / 0.42, 2);
        sweep += (filteredNoise * 0.28 + Math.sin(tau * (220 * before + 950 * before * before)) * 0.018) * strength;
      }
      const after = t - transition;
      if (after > 0 && after < 1) {
        impact += Math.sin(tau * 55 * after) * Math.exp(-after * 8) * 0.19;
        impact += filteredNoise * Math.exp(-after * 19) * 0.12;
      }
    }

    const master = 0.88 + Math.cos(phase) * 0.06;
    const left = Math.tanh((pad + arp * 0.94 + kick + hat + sweep + impact) * 1.4) * master * 0.83;
    const right = Math.tanh((pad + arp * 1.06 + kick + hat * 0.8 + sweep * 0.9 + impact) * 1.4) * master * 0.83;
    wav.writeInt16LE(Math.round(clamp(left, -1, 1) * 32767), 44 + i * 4);
    wav.writeInt16LE(Math.round(clamp(right, -1, 1) * 32767), 46 + i * 4);
  }
  return wav;
}
