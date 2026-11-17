import {
  achievements,
  quests,
  vocabulary,
  type Conditions,
  type Lang,
} from "./data";
export type EvidenceType =
  | "introduced"
  | "recognized"
  | "speech_attempted"
  | "spoken_verified"
  | "quest_completed";
export type Evidence = {
  id: string;
  timestamp: number;
  sessionId: string;
  questId: string;
  conceptId: string;
  targetLanguage: Lang;
  taskVariant: string;
  evidenceType: EvidenceType;
  assistance: boolean;
  assessmentSource: "interaction" | "parent";
  utteranceTarget?: string;
};
export type Reward = {
  id: string;
  label: string;
  conditions: Conditions;
  activatedAt: number;
  state: "active" | "earned" | "parent_confirmed" | "redeemed";
  redemptionId: string;
  confirmedAt?: number;
  redeemedAt?: number;
};
import type { Task } from "./quest-content";
export type { Task, TaskKind } from "./quest-content";
export type Run = {
  id: string;
  questId: string;
  step: number;
  phase: string;
  selected: string | null;
  helped: boolean;
  attempts: number;
  language: Lang;
  startedAt: number;
  round: number;
  orderSeed: number;
};
export type Save = {
  schemaVersion: 2;
  revision: number;
  events: Evidence[];
  rewards: Reward[];
  redeemed: string[];
  run: Run | null;
  runs?: Record<string, Run>;
  prefs: {
    language: Lang;
    muted: boolean;
    calm: boolean;
    microphone: boolean;
    volume: number;
  };
  session: { id: string; lastActive: number };
};
export const uid = () => crypto.randomUUID();
export function freshSave(now = Date.now()): Save {
  return {
    schemaVersion: 2,
    revision: 0,
    events: [],
    rewards: [],
    redeemed: [],
    run: null,
    prefs: {
      language: "en",
      muted: false,
      calm: false,
      microphone: false,
      volume: 0.8,
    },
    session: { id: uid(), lastActive: now },
  };
}
export function addEvidence(s: Save, e: Evidence) {
  if (s.events.some((old) => old.id === e.id)) return;
  if (e.evidenceType === "spoken_verified" && e.assessmentSource !== "parent")
    throw Error("Only an adult can verify speech in this release.");
  s.events.push(e);
  refreshRewards(s);
}
export const discovered = (s: Save) =>
  new Set(s.events.filter((e) => e.conceptId).map((e) => e.conceptId));
export const completed = (s: Save) =>
  new Set(
    s.events
      .filter((e) => e.evidenceType === "quest_completed")
      .map((e) => e.questId),
  );
export const unlocked = (s: Save, id: string) =>
  quests
    .find((q) => q.id === id)
    ?.prerequisites.every((p) => completed(s).has(p)) ?? false;
export function mastery(s: Save, id: string, lang: Lang = "cs") {
  const es = s.events.filter(
    (e) => e.conceptId === id && e.targetLanguage === lang,
  );
  const recognition = es.filter((e) => e.evidenceType === "recognized");
  const independent = recognition.filter((e) => !e.assistance);
  const later = independent.some((e) =>
    recognition.some(
      (old) =>
        old.timestamp + 20 * 60 * 60 * 1000 < e.timestamp &&
        old.sessionId !== e.sessionId &&
        old.questId !== e.questId &&
        old.taskVariant !== e.taskVariant,
    ),
  );
  return {
    introduced: es.some((e) => e.evidenceType === "introduced"),
    recognized: recognition.length > 0,
    independent: independent.length > 0,
    attempted: es.some((e) => e.evidenceType === "speech_attempted"),
    spoken: es.some((e) => e.evidenceType === "spoken_verified"),
    later,
  };
}
export function xp(s: Save) {
  const milestones = new Map<string, number>();
  for (const e of s.events) {
    const points = {
      introduced: 5,
      recognized: e.assistance ? 5 : 10,
      speech_attempted: 2,
      spoken_verified: 15,
      quest_completed: 40,
    }[e.evidenceType];
    const key =
      e.evidenceType === "quest_completed"
        ? `quest:${e.questId}`
        : `${e.evidenceType}:${e.conceptId}:${e.targetLanguage}`;
    milestones.set(key, Math.max(points, milestones.get(key) ?? 0));
  }
  return [...milestones.values()].reduce((a, b) => a + b, 0);
}
export function progress(s: Save, c: Conditions) {
  const langs: Lang[] =
    c.language === "both"
      ? ["cs", "en"]
      : [c.language === "en-US" ? "en" : "cs"];
  const paired = (predicate: (id: string, l: Lang) => boolean) =>
    vocabulary.filter((w) => langs.every((l) => predicate(w.id, l))).length;
  const recognized = paired((id, l) => mastery(s, id, l).recognized);
  const spoken = paired((id, l) => mastery(s, id, l).spoken);
  const withoutModel = paired((id, l) =>
    s.events.some(
      (e) =>
        e.conceptId === id &&
        e.targetLanguage === l &&
        e.evidenceType === "spoken_verified" &&
        !e.assistance,
    ),
  );
  const later = paired((id, l) => mastery(s, id, l).later);
  const contexts = paired(
    (id, l) =>
      new Set(
        s.events
          .filter(
            (e) =>
              e.conceptId === id &&
              e.targetLanguage === l &&
              e.evidenceType === "recognized" &&
              !e.assistance,
          )
          .map((e) => e.questId),
      ).size >= 2,
  );
  const quest = !c.questId || completed(s).has(c.questId);
  return {
    recognized,
    spoken,
    withoutModel,
    later,
    contexts,
    quest,
    earned:
      quest &&
      recognized >= c.distinctRecognizedConcepts &&
      spoken >= c.distinctVerifiedSpokenConcepts &&
      withoutModel >= c.withoutModelCount &&
      later >= c.laterSessionRecallCount &&
      contexts >= c.newContextCount,
  };
}
export function refreshRewards(s: Save) {
  for (const r of s.rewards) {
    if (s.redeemed.includes(r.redemptionId)) r.state = "redeemed";
    else if (r.state === "active" && progress(s, r.conditions).earned)
      r.state = "earned";
  }
}
export function activateReward(s: Save, id: string, label: string) {
  if (s.rewards.some((r) => r.id === id)) return;
  const a = achievements.find((a) => a.id === id);
  if (!a || !label.trim()) throw Error("Invalid challenge");
  s.rewards.push({
    id,
    label: label.trim().slice(0, 120),
    conditions: structuredClone(a.conditions),
    activatedAt: Date.now(),
    state: "active",
    redemptionId: `reward:${id}`,
  });
  refreshRewards(s);
}
export function confirmReward(s: Save, id: string) {
  const r = s.rewards.find((r) => r.id === id);
  if (r?.state === "earned") {
    r.state = "parent_confirmed";
    r.confirmedAt = Date.now();
  }
}
export function redeemReward(s: Save, id: string) {
  const r = s.rewards.find((r) => r.id === id);
  if (r?.state !== "parent_confirmed" || s.redeemed.includes(r.redemptionId))
    return false;
  r.state = "redeemed";
  r.redeemedAt = Date.now();
  s.redeemed.push(r.redemptionId);
  return true;
}

export function tasksFor(id: string): Task[] {
  return quests.find((q) => q.id === id)?.tasks ?? [];
}
export function startRun(s: Save, questId: string, lang: Lang) {
  if (!unlocked(s, questId)) return;
  s.runs ??= {};
  if (s.run) s.runs[s.run.questId] = structuredClone(s.run);
  const previous = s.runs[questId];
  if (previous && previous.phase !== "summary") {
    s.run = structuredClone(previous);
    return;
  }
  s.run = {
    id: uid(),
    questId,
    step: quests.find((q) => q.id === questId)?.archived ? -1 : 0,
    phase: quests.find((q) => q.id === questId)?.archived ? "intro" : "ready",
    selected: null,
    helped: false,
    attempts: 0,
    language: lang,
    startedAt: Date.now(),
    round: s.events.filter(
      (e) => e.questId === questId && e.evidenceType === "quest_completed",
    ).length,
    orderSeed: Math.floor(Math.random() * 10000),
  };
}
export function phaseFor(task: Task) {
  return task.kind === "fishing"
    ? "equipment"
    : task.kind === "discover"
      ? "hidden"
      : task.kind === "cycle"
        ? "helmet"
        : task.kind === "pack" || task.kind === "assemble"
          ? "choose"
          : "ready";
}
export function advance(s: Save, expectedStep: number) {
  const r = s.run;
  if (!r || r.step !== expectedStep) return;
  r.step++;
  r.selected = null;
  r.helped = false;
  r.attempts = 0;
  const task = tasksFor(r.questId)[r.step];
  r.phase = task ? phaseFor(task) : "summary";
  if (!task)
    addEvidence(s, {
      id: `${r.id}:complete`,
      timestamp: Date.now(),
      sessionId: s.session.id,
      questId: r.questId,
      conceptId: "",
      targetLanguage: r.language,
      taskVariant: "complete",
      evidenceType: "quest_completed",
      assistance: false,
      assessmentSource: "interaction",
    });
}
export const fishingNext: Record<string, string> = {
  equipment: "cast",
  cast: "wait",
  wait: "bite",
  bite: "reel",
  reel: "reveal",
  reveal: "identify",
  identify: "speech_optional",
  speech_optional: "release",
  release: "summary",
};
export function transition(
  s: Save,
  step: number,
  expected: string,
  next: string,
) {
  if (s.run?.step === step && s.run.phase === expected) s.run.phase = next;
}
export function eventFor(
  s: Save,
  type: EvidenceType,
  concept: string,
  assistance = false,
  lang?: Lang,
  utteranceTarget?: string,
): Evidence {
  const r = s.run;
  return {
    id: `${r?.id ?? s.session.id}:${r?.step ?? "atlas"}:${type}:${concept}:${lang ?? r?.language ?? "cs"}`,
    timestamp: Date.now(),
    sessionId: s.session.id,
    questId: r?.questId ?? "atlas",
    conceptId: concept,
    targetLanguage: lang ?? r?.language ?? "cs",
    taskVariant: `${r?.questId ?? "atlas"}:${r?.step ?? concept}:${r?.round ?? 0}`,
    evidenceType: type,
    assistance,
    assessmentSource: type === "spoken_verified" ? "parent" : "interaction",
    utteranceTarget,
  };
}
export function optionsFor(task: Task, seed: number) {
  let list = task.options ?? [
    task.concept,
    ...(task.concept === "red"
      ? ["blue", "apple"]
      : task.concept === "blue"
        ? ["red", "bucket"]
        : ["apple", "helmet", "bucket", "carp", "earthworm"].filter(
            (id) =>
              id !== task.concept &&
              !(
                (id === "carp" && task.concept === "fish") ||
                (id === "apple" && task.concept === "red")
              ),
          )
    ).slice(0, 2),
  ];
  // Seeded shuffle makes reload stable but changes each task and replay.
  list = [...list];
  let n = seed + 13;
  for (let i = list.length - 1; i > 0; i--) {
    n = (n * 1664525 + 1013904223) >>> 0;
    const j = n % (i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
export function migrate(input: unknown): Save {
  if (!input || typeof input !== "object")
    throw Error("This is not a game backup.");
  const raw = structuredClone(input) as Save;
  if ((raw.schemaVersion as number) === 1) {
    raw.schemaVersion = 2;
    raw.redeemed ??= [];
    raw.session ??= { id: uid(), lastActive: 0 };
    raw.revision ??= 0;
  }
  if (
    raw.schemaVersion !== 2 ||
    !Array.isArray(raw.events) ||
    raw.events.length > 50000 ||
    !Array.isArray(raw.rewards) ||
    raw.rewards.length > 10 ||
    !Array.isArray(raw.redeemed) ||
    !raw.prefs ||
    !raw.session
  )
    throw Error(
      "Unsupported or damaged save. Your current progress is unchanged.",
    );
  if (
    !["cs", "en"].includes(raw.prefs.language) ||
    typeof raw.prefs.volume !== "number" ||
    raw.prefs.volume < 0 ||
    raw.prefs.volume > 1 ||
    !["muted", "calm", "microphone"].every(
      (k) => typeof raw.prefs[k as "muted"] === "boolean",
    )
  )
    throw Error("Damaged settings");
  for (const e of raw.events)
    if (
      !e ||
      typeof e.id !== "string" ||
      !Number.isFinite(e.timestamp) ||
      ![
        "introduced",
        "recognized",
        "speech_attempted",
        "spoken_verified",
        "quest_completed",
      ].includes(e.evidenceType) ||
      !["cs", "en"].includes(e.targetLanguage) ||
      typeof e.assistance !== "boolean" ||
      typeof e.questId !== "string" ||
      typeof e.sessionId !== "string" ||
      typeof e.taskVariant !== "string" ||
      !["interaction", "parent"].includes(e.assessmentSource) ||
      (e.conceptId !== "" && !vocabulary.some((w) => w.id === e.conceptId)) ||
      (e.evidenceType === "spoken_verified" && e.assessmentSource !== "parent")
    )
      throw Error("Damaged learning evidence");
  if (new Set(raw.events.map((e) => e.id)).size !== raw.events.length)
    throw Error("Duplicate evidence in backup");
  for (const r of raw.rewards)
    if (
      !achievements.some((a) => a.id === r.id) ||
      r.redemptionId !== `reward:${r.id}` ||
      typeof r.label !== "string" ||
      !["active", "earned", "parent_confirmed", "redeemed"].includes(r.state) ||
      JSON.stringify(r.conditions) !==
        JSON.stringify(achievements.find((a) => a.id === r.id)?.conditions)
    )
      throw Error("Damaged reward record");
  if (
    !raw.redeemed.every(
      (id) =>
        typeof id === "string" &&
        achievements.some((a) => `reward:${a.id}` === id),
    )
  )
    throw Error("Damaged redemption ledger");
  if (
    raw.runs &&
    (typeof raw.runs !== "object" ||
      Array.isArray(raw.runs) ||
      Object.keys(raw.runs).length > quests.length)
  )
    throw Error("Damaged adventure history");
  for (const [key, run] of Object.entries(raw.runs ?? {}))
    if (key !== run.questId) throw Error("Damaged adventure history");
  for (const run of [raw.run, ...Object.values(raw.runs ?? {})])
    if (
      run &&
      (!quests.some((q) => q.id === run.questId) ||
        !Number.isInteger(run.step) ||
        run.step < -1 ||
        run.step > tasksFor(run.questId).length ||
        !["cs", "en"].includes(run.language) ||
        typeof run.id !== "string" ||
        typeof run.phase !== "string" ||
        !Number.isFinite(run.orderSeed))
    )
      throw Error("Damaged adventure");
  refreshRewards(raw);
  return raw;
}
export function mergeBackup(current: Save, incoming: Save): Save {
  const merged = migrate(incoming);
  merged.events = [
    ...new Map(
      [...current.events, ...merged.events].map((e) => [e.id, e]),
    ).values(),
  ];
  merged.redeemed = [
    ...new Set([
      ...current.redeemed,
      ...merged.redeemed,
      ...current.rewards
        .filter((r) => r.state === "redeemed")
        .map((r) => r.redemptionId),
      ...merged.rewards
        .filter((r) => r.state === "redeemed")
        .map((r) => r.redemptionId),
    ]),
  ];
  merged.rewards = [
    ...new Map(
      [...merged.rewards, ...current.rewards].map((r) => [r.id, r]),
    ).values(),
  ];
  merged.session = current.session;
  merged.runs = { ...current.runs, ...merged.runs };
  merged.revision = current.revision;
  refreshRewards(merged);
  return merged;
}
