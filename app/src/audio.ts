import script from "../../content/audio-script.json";
import lines from "../../content/game-lines.json";
import storyAudio from "../../content/story-audio.json";
import type { Lang } from "./data";
const texts: Record<string, string> = Object.fromEntries(
  [...script.lines, ...storyAudio.lines].map((l) => [l.id, l.text]),
);
for (const [id, pair] of Object.entries(lines))
  for (const lang of ["cs", "en"] as const)
    texts[`game.${id}.${lang}`] = pair[lang];
let player: HTMLAudioElement | null = null;
let generation = 0;
let muted = false;
let volume = 0.8;
let currentResolve: (() => void) | null = null;
let pauseTimer: ReturnType<typeof setTimeout> | null = null;
let primed = false;
export function primeAudio() {
  if (primed) return;
  primed = true;
  player = new Audio(
    "data:audio/wav;base64,UklGRmQGAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  );
  player.play().catch(() => {});
  try {
    context ??= new AudioContext();
    void context.resume();
  } catch {
    /* Voice playback remains available. */
  }
}
let notice: (message: string) => void = () => {};
export function audioNotice(fn: (message: string) => void) {
  notice = fn;
}
export const line = (id: keyof typeof lines, lang: Lang) => lines[id][lang];
export function configureAudio(m: boolean, v: number) {
  muted = m;
  volume = v;
  if (m) stopAudio();
  if (player) player.volume = volume;
}
export function stopAudio() {
  generation++;
  if (pauseTimer !== null) clearTimeout(pauseTimer);
  pauseTimer = null;
  if (player) {
    player.pause();
    player.onended = null;
    player.onerror = null;
  }
  window.speechSynthesis?.cancel();
  currentResolve?.();
  currentResolve = null;
}
export async function play(ids: string | string[]) {
  stopAudio();
  if (muted) return;
  const token = generation;
  const sequence = (Array.isArray(ids) ? ids : [ids]).flatMap((id) =>
    /^word\.[a-z-]+\.cs$/.test(id)
      ? [
          { id, rate: 1, pause: 1600 },
          { id, rate: 0.76, pause: 2200 },
        ]
      : [{ id, rate: 1, pause: 0 }],
  );
  const unavailable = new Set<string>();
  for (const { id, rate, pause } of sequence) {
    if (token !== generation) return;
    if (unavailable.has(id)) continue;
    await new Promise<void>((resolve) => {
      currentResolve = resolve;
      const a = player ?? new Audio();
      player = a;
      a.src = `${import.meta.env.BASE_URL}game-assets/audio/${id}.mp3`;
      a.volume = volume;
      a.playbackRate = rate;
      a.preservesPitch = true;
      a.onended = () => {
        currentResolve = null;
        resolve();
      };
      let failed = false;
      const fallback = () => {
        if (token !== generation) {
          resolve();
          return;
        }
        if (failed) return;
        failed = true;
        const lang = id.endsWith(".cs") ? "cs" : "en";
        const synth = window.speechSynthesis;
        const voice = synth
          ?.getVoices()
          .find((v) =>
            v.lang.toLowerCase().startsWith(lang === "cs" ? "cs" : "en-us"),
          );
        if (!voice || !texts[id]) {
          unavailable.add(id);
          notice(
            lang === "cs"
              ? "České audio není dostupné. Zkontrolujte připojení nebo poproste dospělého."
              : "Audio is unavailable. Check your connection or ask an adult.",
          );
          resolve();
          return;
        }
        notice("Používá se náhradní hlas zařízení / Device voice fallback.");
        const u = new SpeechSynthesisUtterance(texts[id]);
        u.voice = voice;
        u.lang = voice.lang;
        u.rate = 0.85 * rate;
        u.volume = volume;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        synth.speak(u);
      };
      a.onerror = fallback;
      a.play().catch((error: DOMException) => {
        if (token !== generation || error.name === "AbortError") {
          resolve();
          return;
        }
        if (error.name === "NotAllowedError") {
          unavailable.add(id);
          notice("Klepni na reproduktor pro zvuk / Tap the speaker to play.");
          resolve();
        } else fallback();
      });
    });
    if (token !== generation) return;
    if (pause && !unavailable.has(id))
      await new Promise<void>((resolve) => {
        currentResolve = resolve;
        pauseTimer = setTimeout(() => {
          pauseTimer = null;
          currentResolve = null;
          resolve();
        }, pause);
      });
  }
}
let context: AudioContext | null = null;
export function chime() {
  if (muted) return;
  try {
    context ??= new AudioContext();
    void context.resume();
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const osc = context!.createOscillator(),
        gain = context!.createGain(),
        t = context!.currentTime + i * 0.09;
      osc.type = "sine";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume * 0.08, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(context!.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  } catch {
    /* Optional sound effect. */
  }
}
