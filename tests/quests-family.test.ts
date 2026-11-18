import { describe, it, expect } from "vitest";
import { activeQuests, validateQuest } from "../app/src/quest-content";
import { questsAtHome } from "../app/src/WorldAtlas";
import {
  freshSave,
  startRun,
  advance,
  migrate,
  eventFor,
  addEvidence,
  completed,
} from "../app/src/domain";
import {
  makePostcard,
  encodePostcard,
  decodePostcard,
  validatePostcard,
} from "../app/src/family-data";

describe("data-driven stories", () => {
  it("routes each active quest to exactly one home, including added country topics", () => {
    const iowa = questsAtHome("iowa"),
      czech = questsAtHome("pribram");
    expect(iowa.some((q) => q.id === "iowa-snack-shop")).toBe(true);
    expect(czech.some((q) => q.id === "pribram-crown-shop")).toBe(true);
    expect(
      iowa.every((q) => !q.cast.some((c) => ["babi", "deda"].includes(c))),
    ).toBe(true);
    expect(
      czech.every((q) => !q.cast.some((c) => ["mama", "tata"].includes(c))),
    ).toBe(true);
    expect(new Set([...iowa, ...czech].map((q) => q.id)).size).toBe(
      activeQuests.length,
    );
    expect(iowa.length + czech.length).toBe(activeQuests.length);
  });
  it("rejects unknown concepts, misleading choices and misplaced relatives", () => {
    const q = structuredClone(activeQuests[0]);
    q.tasks[0].concept = "unknown";
    expect(() => validateQuest(q)).toThrow();
    q.tasks[0].concept = "hello";
    q.cast.push("babi");
    expect(() => validateQuest(q)).toThrow(/grandparents/);
    const another = structuredClone(activeQuests[0]);
    another.tasks[0] = {
      kind: "find",
      concept: "hello",
      options: ["apple", "helmet"],
    };
    expect(() => validateQuest(another)).toThrow(/choices/);
  });
  it("adds a new topic without an engine switch and keeps narrative separate from knowledge", () => {
    const q = structuredClone(activeQuests[0]);
    q.id = "new-family-topic";
    expect(validateQuest(q).tasks.length).toBeGreaterThan(10);
    const s = freshSave();
    startRun(s, activeQuests[0].id, "cs");
    expect(s.run?.step).toBe(0);
    advance(s, 0);
    expect(s.events).toEqual([]);
  });
  it("resumes each topic independently and preserves it through reload", () => {
    const s = freshSave();
    startRun(s, activeQuests[0].id, "cs");
    advance(s, 0);
    advance(s, 1);
    const id = s.run!.id;
    startRun(s, activeQuests[1].id, "cs");
    advance(s, 0);
    const restored = migrate(s);
    startRun(restored, activeQuests[0].id, "cs");
    expect(restored.run).toMatchObject({ id, step: 2 });
    expect(completed(restored).size).toBe(0);
  });
  it("retains old active quests and evidence when loading version two saves", () => {
    const s = freshSave();
    startRun(s, "iowa-home", "cs");
    advance(s, -1);
    const restored = migrate(s);
    expect(restored.run).toEqual(s.run);
    expect(restored.runs).toEqual(s.runs);
  });
});
describe("family postcards", () => {
  it("roundtrips only a small progress snapshot, without rewards, recordings or session IDs", () => {
    const s = freshSave();
    startRun(s, "story-iowa", "cs");
    addEvidence(s, eventFor(s, "recognized", "hello", true));
    const p = makePostcard(s),
      encoded = encodePostcard(p),
      read = decodePostcard("https://example.com/#family=" + encoded);
    expect(read).toEqual(p);
    expect(JSON.stringify(read)).not.toContain(s.session.id);
    expect(read.quests[0].words[0].state).toBe("helped");
    expect(read.quests[0].step).toBe(1);
    expect(read.quests[0].done).toBe(false);
    expect(
      validatePostcard({ ...p, rewards: ["private"], recording: "private" }),
    ).not.toHaveProperty("rewards");
  });
  it("does not count English practice or simple exposure as independent Czech recognition", () => {
    const s = freshSave();
    startRun(s, "story-iowa", "cs");
    addEvidence(s, eventFor(s, "introduced", "hello", true));
    addEvidence(s, eventFor(s, "recognized", "hello", false, "en"));
    expect(makePostcard(s).quests[0].words[0].state).toBe("seen");
    expect(s.events).toHaveLength(2);
  });
  it("rejects oversized, malformed, duplicate and foreign topic snapshots", () => {
    expect(() => decodePostcard("x".repeat(19000))).toThrow();
    expect(() => decodePostcard("%%%")).toThrow();
    const p = makePostcard(freshSave());
    p.quests.push(p.quests[0]);
    expect(() => validatePostcard(p)).toThrow();
    p.quests = [];
    p.date = "not-a-date";
    expect(() => validatePostcard(p)).toThrow();
  });
});
