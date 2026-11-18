import legacy from "../../content/quests.json";
import vocabulary from "../../content/vocabulary.json";
import art from "../../art/manifest.json";

export type TaskKind =
  | "learn"
  | "find"
  | "pack"
  | "fishing"
  | "discover"
  | "cycle"
  | "assemble"
  | "story"
  | "compare"
  | "narrative";
export type Pair = { cs: string; en: string };
export type Task = {
  kind: TaskKind;
  concept: string;
  options?: string[];
  id?: string;
  text?: Pair;
  art?: string;
  pictures?: string[];
  action?: string;
  background?: string;
  cast?: string[];
  cycleWords?: string[];
};
export type Quest = {
  id: string;
  title: string;
  titleEn: string;
  region: string;
  background: string;
  cast: string[];
  narrator: string;
  mechanics: string[];
  concepts: string[];
  prerequisites: string[];
  scriptCs: string;
  scriptEn: string;
  suggestedMinutes: number[];
  speechOptionalForCompletion: boolean;
  archived: boolean;
  version?: number;
  tasks: Task[];
  callPrompts?: Pair[];
};
const knownWords = new Set(vocabulary.vocabulary.map((w) => w.id));
const backgrounds = new Set(
  art.assets.filter((a) => !a.frames?.length).map((a) => a.id),
);
const artIds = new Set(
  art.assets.flatMap((a) =>
    a.frames?.length ? a.frames.map((f) => f.id) : [a.id],
  ),
);
const kinds = new Set([
  "learn",
  "find",
  "pack",
  "fishing",
  "discover",
  "cycle",
  "assemble",
  "story",
  "compare",
  "narrative",
]);
const actors = new Set([
  "adam",
  "matyas",
  "mama",
  "tata",
  "babi",
  "deda",
  "romca",
  "klarka",
]);
const actions = new Set([
  "next",
  "wave",
  "plane",
  "suitcase",
  "heart",
  "star",
  "atlas",
  "bug",
  "bicycle",
  "fishing",
]);
export function validateQuest(input: unknown): Quest {
  if (!input || typeof input !== "object")
    throw Error("Quest must be an object");
  const q = input as Quest;
  const fail = (reason: string): never => {
    throw Error(`Quest ${q.id ?? "?"}: ${reason}`);
  };
  if (
    !/^[a-z][a-z0-9-]{2,60}$/.test(q.id) ||
    !q.title ||
    !q.titleEn ||
    !["iowa", "pribram", "travel"].includes(q.region)
  )
    fail("invalid identity");
  if (
    !backgrounds.has(q.background) ||
    q.narrator !== "romca" ||
    !Array.isArray(q.cast) ||
    !q.cast.includes("adam")
  )
    fail("invalid scene");
  const validateCast = (cast: string[], background: string) => {
    if (cast.some((a) => !actors.has(a))) fail("unknown actor");
    if (
      (q.region === "iowa" || background.startsWith("iowa")) &&
      cast.some((a) => a === "babi" || a === "deda")
    )
      fail("grandparents only in Příbram");
    if (
      q.region === "pribram" &&
      cast.some((a) => a === "mama" || a === "tata")
    )
      fail("parents only in Iowa");
  };
  validateCast(q.cast, q.background);
  if (
    !Array.isArray(q.prerequisites) ||
    !Array.isArray(q.concepts) ||
    q.concepts.some((w) => !knownWords.has(w))
  )
    fail("invalid concepts");
  if (!Array.isArray(q.tasks) || q.tasks.length < 1 || q.tasks.length > 100)
    fail("1–100 steps required");
  const sceneIds = new Set();
  for (const t of q.tasks) {
    if (
      t.pictures &&
      (!t.pictures.length ||
        t.pictures.length > 3 ||
        t.pictures.some((id) => !knownWords.has(id)))
    )
      fail("unknown story picture");
    if (!kinds.has(t.kind) || !knownWords.has(t.concept))
      fail("unknown task or concept");
    if (
      t.options &&
      (!Array.isArray(t.options) ||
        t.options.length < 2 ||
        t.options.length > 4 ||
        new Set(t.options).size !== t.options.length ||
        !t.options.includes(t.concept) ||
        t.options.some((w) => !knownWords.has(w)))
    )
      fail("invalid picture choices");
    if (t.background && !backgrounds.has(t.background))
      fail("unknown background");
    validateCast(t.cast ?? q.cast, t.background ?? q.background);
    if (
      t.cycleWords &&
      (t.cycleWords.length !== 3 ||
        t.cycleWords.some((w) => !knownWords.has(w)))
    )
      fail("cycling needs three known words");
    if (t.kind === "narrative") {
      if (
        !t.id ||
        !/^[a-z0-9-]+$/.test(t.id) ||
        sceneIds.has(t.id) ||
        !t.text?.cs ||
        !t.text?.en ||
        !t.art ||
        !artIds.has(t.art) ||
        !actions.has(t.action ?? "next")
      )
        fail("invalid narrated scene");
      sceneIds.add(t.id);
    }
  }
  if (
    !q.archived &&
    (!q.callPrompts?.length || q.callPrompts.some((p) => !p.cs || !p.en))
  )
    fail("family conversation prompts required");
  return q;
}
const packs = import.meta.glob("../../content/quest-packs/*.json", {
  eager: true,
  import: "default",
});
const order = [
  "story-iowa",
  "home-kindergarten",
  "grandparents-home",
  "family-cycling",
  "romca-fishing",
];
export const activeQuests = Object.values(packs)
  .map(validateQuest)
  .sort((a, b) => {
    const ia = order.indexOf(a.id),
      ib = order.indexOf(b.id);
    return (
      (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib) || a.id.localeCompare(b.id)
    );
  });
export const allQuests: Quest[] = [
  ...activeQuests,
  ...legacy.quests.map(validateQuest),
];
if (new Set(allQuests.map((q) => q.id)).size !== allQuests.length)
  throw Error("Duplicate quest IDs");
for (const q of allQuests)
  if (q.prerequisites.some((id) => !allQuests.some((p) => p.id === id)))
    throw Error(`Missing prerequisite for ${q.id}`);
