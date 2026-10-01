import { FILM, clamp } from "../src/film";

/** Original electronic score, synthesized deterministically without external assets. */
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
  const notes = [220, 329.63, 440, 587.33, 659.26, 440, 329.63, 587.33];
  let seed = 123456;
  let filteredNoise = 0;

  for (let i = 0; i < sampleCount; i++) {
    const t = i / sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = (seed / 4294967295) * 2 - 1;
    filteredNoise = filteredNoise * 0.94 + noise * 0.06;

    // Soft, spacious chord bed.
    const padEnvelope = Math.min(1, t * 1.5) * clamp((9 - t) / 1.2);
    let pad = 0;
    for (const frequency of [110, 164.815, 220, 293.665]) {
      pad += Math.sin(tau * frequency * t + Math.sin(t * 0.6) * 0.1) * 0.017;
    }
    pad *= padEnvelope;

    // A light arpeggio with warm harmonics, rising into each typography reveal.
    const noteIndex = Math.floor(t / 0.3);
    const noteTime = t - noteIndex * 0.3;
    const frequency = notes[noteIndex % notes.length];
    const arpEnvelope = Math.min(1, noteTime / 0.009) * Math.exp(-noteTime * 11);
    const arp = (
      Math.sin(tau * frequency * noteTime) * 0.062 +
      Math.sin(tau * frequency * 2 * noteTime) * 0.014
    ) * arpEnvelope;

    const beatTime = t % 0.6;
    const kick = Math.sin(tau * (50 * beatTime + 2.3 * (1 - Math.exp(-beatTime * 30)))) * Math.exp(-beatTime * 24) * 0.15;
    const hatTime = t % 0.3;
    const hat = (noise - filteredNoise) * Math.exp(-hatTime * 100) * 0.023;

    let sweep = 0;
    let impact = 0;
    for (const transition of [2.7, 5.7]) {
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

    const master = Math.min(1, t / 0.025) * clamp((9 - t) / 0.55);
    const left = Math.tanh((pad + arp * 0.94 + kick + hat + sweep + impact) * 1.4) * master * 0.83;
    const right = Math.tanh((pad + arp * 1.06 + kick + hat * 0.8 + sweep * 0.9 + impact) * 1.4) * master * 0.83;
    wav.writeInt16LE(Math.round(clamp(left, -1, 1) * 32767), 44 + i * 4);
    wav.writeInt16LE(Math.round(clamp(right, -1, 1) * 32767), 46 + i * 4);
  }
  return wav;
}
