import { activeQuests, questById, words } from "./data";
import { completed, mastery, type Save } from "./domain";

export type Postcard = {
  version: 1;
  date: string;
  quests: {
    id: string;
    done: boolean;
    step: number;
    words: { id: string; state: "seen" | "helped" | "recognized" | "spoken" }[];
  }[];
};
export const POSTCARD_KEY = "dragon-family-postcard-v1";
export function makePostcard(save: Save): Postcard {
  const finished = completed(save);
  return {
    version: 1,
    date: new Date().toISOString(),
    quests: activeQuests.map((q) => {
      const events = save.events.filter(
        (e) => e.questId === q.id && e.targetLanguage === "cs",
      );
      const run = save.run?.questId === q.id ? save.run : save.runs?.[q.id];
      return {
        id: q.id,
        done: finished.has(q.id),
        step: finished.has(q.id)
          ? q.tasks.length
          : run
            ? Math.min(q.tasks.length, Math.max(1, run.step + 1))
            : 0,
        words: q.concepts
          .filter((id) => events.some((e) => e.conceptId === id))
          .map((id) => {
            const m = mastery({ ...save, events }, id);
            return {
              id,
              state: m.spoken
                ? "spoken"
                : m.independent
                  ? "recognized"
                  : m.recognized
                    ? "helped"
                    : "seen",
            };
          }),
      };
    }),
  };
}
export function validatePostcard(value: unknown): Postcard {
  if (!value || typeof value !== "object")
    throw Error("Pohlednice není platná.");
  const p = value as Postcard;
  if (
    p.version !== 1 ||
    typeof p.date !== "string" ||
    !Number.isFinite(Date.parse(p.date)) ||
    Date.parse(p.date) > Date.now() + 300000 ||
    !Array.isArray(p.quests) ||
    p.quests.length > 50
  )
    throw Error("Neplatná verze nebo datum pohlednice.");
  const ids = new Set();
  const quests = p.quests.map((entry) => {
    const q = Object.hasOwn(questById, entry.id)
      ? questById[entry.id]
      : undefined;
    if (
      !q ||
      ids.has(entry.id) ||
      typeof entry.done !== "boolean" ||
      !Number.isInteger(entry.step) ||
      entry.step < 0 ||
      entry.step > q.tasks.length ||
      !Array.isArray(entry.words) ||
      entry.words.length > q.concepts.length
    )
      throw Error(
        "Pohlednice obsahuje neznámý nebo poškozený quest. Aktualizujte hru.",
      );
    ids.add(entry.id);
    const seen = new Set();
    const safeWords = entry.words.map((w) => {
      if (
        !w ||
        !q.concepts.includes(w.id) ||
        !words[w.id] ||
        seen.has(w.id) ||
        !["seen", "helped", "recognized", "spoken"].includes(w.state)
      )
        throw Error("Poškozený přehled slov.");
      seen.add(w.id);
      return { id: w.id, state: w.state };
    });
    return { id: q.id, done: entry.done, step: entry.step, words: safeWords };
  });
  // Rebuild the whitelist: never retain unrelated child data from an import.
  return { version: 1, date: p.date, quests };
}
export function encodePostcard(p: Postcard): string {
  const bytes = new TextEncoder().encode(JSON.stringify(validatePostcard(p)));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}
export function decodePostcard(text: string): Postcard {
  const payload = text.includes("#family=") ? text.split("#family=")[1] : text;
  if (payload.length > 18000 || !/^[A-Za-z0-9_-]+$/.test(payload))
    throw Error("Odkaz na pohlednici není platný.");
  try {
    return validatePostcard(
      JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(
          Uint8Array.from(
            atob(payload.replaceAll("-", "+").replaceAll("_", "/")),
            (c) => c.charCodeAt(0),
          ),
        ),
      ),
    );
  } catch {
    throw Error("Pohlednici nelze otevřít. Požádejte rodiče o nový odkaz.");
  }
}
export function savePostcard(p: Postcard) {
  const safe = validatePostcard(p);
  const previous = localStorage.getItem(POSTCARD_KEY);
  if (previous) {
    let old: Postcard | null = null;
    try {
      old = validatePostcard(JSON.parse(previous));
    } catch {
      /* A valid new postcard repairs a damaged local copy. */
    }
    if (old && Date.parse(old.date) > Date.parse(safe.date))
      throw Error("Už máte novější pohlednici. Starší ji nenahradila.");
  }
  localStorage.setItem(POSTCARD_KEY, JSON.stringify(safe));
  return safe;
}
export const stateLabel = {
  seen: "Seznámil se s obrázkem",
  helped: "Poznal s pomocí",
  recognized: "Poznal samostatně",
  spoken: "Mluvení potvrdil dospělý",
};
