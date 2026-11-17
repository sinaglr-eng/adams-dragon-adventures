import { describe, it, expect } from "vitest";
import {
  freshSave,
  addEvidence,
  xp,
  mastery,
  activateReward,
  confirmReward,
  redeemReward,
  mergeBackup,
  migrate,
  startRun,
  advance,
  transition,
  fishingNext,
  tasksFor,
  completed,
  unlocked,
  progress,
  type Evidence,
} from "../app/src/domain";
import { quests, achievements } from "../app/src/data";
const evidence = (overrides: Partial<Evidence> = {}): Evidence => ({
  id: crypto.randomUUID(),
  timestamp: Date.now(),
  sessionId: "one",
  questId: "iowa-home",
  conceptId: "fish",
  targetLanguage: "cs",
  taskVariant: "find-1",
  evidenceType: "recognized",
  assistance: false,
  assessmentSource: "interaction",
  ...overrides,
});
describe("learning evidence", () => {
  it("does not turn a helped answer into independent recognition or speech", () => {
    const s = freshSave();
    addEvidence(s, evidence({ assistance: true }));
    expect(mastery(s, "fish")).toMatchObject({
      recognized: true,
      independent: false,
      spoken: false,
      later: false,
    });
  });
  it("deduplicates callbacks and caps XP for repeated milestones", () => {
    const s = freshSave(),
      e = evidence();
    addEvidence(s, e);
    addEvidence(s, e);
    addEvidence(s, { ...e, id: "second" });
    expect(s.events.length).toBe(2);
    expect(xp(s)).toBe(10);
  });
  it("does not turn an audio attempt into a pronunciation seal", () => {
    const s = freshSave();
    addEvidence(s, evidence({ evidenceType: "speech_attempted" }));
    expect(mastery(s, "fish").spoken).toBe(false);
    expect(() =>
      addEvidence(s, evidence({ evidenceType: "spoken_verified" })),
    ).toThrow();
  });
  it("requires a later session, different quest and context for recall", () => {
    const s = freshSave(),
      time = Date.now();
    addEvidence(s, evidence({ timestamp: time }));
    addEvidence(
      s,
      evidence({
        sessionId: "two",
        timestamp: time + 1000,
        questId: "atlas",
        taskVariant: "review",
      }),
    );
    expect(mastery(s, "fish").later).toBe(false);
    addEvidence(
      s,
      evidence({
        sessionId: "three",
        timestamp: time + 86400000,
        questId: "atlas",
        taskVariant: "review-new",
      }),
    );
    expect(mastery(s, "fish").later).toBe(true);
  });
  it("keeps English and Czech separate and counts distinct words", () => {
    const s = freshSave();
    for (let i = 0; i < 10; i++)
      addEvidence(
        s,
        evidence({
          evidenceType: "spoken_verified",
          assessmentSource: "parent",
        }),
      );
    const c = achievements.find((a) => a.id === "two-languages")!.conditions;
    expect(progress(s, c).spoken).toBe(0);
    addEvidence(
      s,
      evidence({
        evidenceType: "spoken_verified",
        assessmentSource: "parent",
        targetLanguage: "en",
      }),
    );
    expect(progress(s, c).spoken).toBe(1);
  });
});
describe("adventures", () => {
  it("keeps locked quests closed", () => {
    const s = freshSave();
    startRun(s, "big-fish", "cs");
    expect(s.run).toBeNull();
    expect(unlocked(s, "iowa-home")).toBe(true);
  });
  it("all eight quests can finish through persisted ordered steps", () => {
    let s = freshSave();
    for (const q of quests) {
      expect(unlocked(s, q.id)).toBe(true);
      startRun(s, q.id, "cs");
      advance(s, -1);
      for (let i = 0; i < tasksFor(q.id).length; i++) {
        expect(s.run?.step).toBe(i);
        s = migrate(JSON.parse(JSON.stringify(s)));
        advance(s, i);
        advance(s, i);
      }
      expect(s.run?.phase).toBe("summary");
      expect(completed(s).has(q.id)).toBe(true);
    }
    expect(completed(s).size).toBe(8);
  });
  it("fishing waits indefinitely for a bite action and ignores stale transitions", () => {
    const s = freshSave();
    startRun(s, "iowa-home", "cs");
    s.run!.phase = "bite";
    s.run!.step = 1;
    transition(s, 1, "bite", fishingNext.bite);
    transition(s, 1, "bite", fishingNext.bite);
    expect(s.run!.phase).toBe("reel");
    transition(s, 0, "reel", "reveal");
    expect(s.run!.phase).toBe("reel");
  });
  it("does not pay quest XP twice on replay", () => {
    const s = freshSave();
    for (let j = 0; j < 2; j++) {
      startRun(s, "iowa-home", "cs");
      for (let i = -1; i < tasksFor("iowa-home").length; i++) advance(s, i);
    }
    expect(xp(s)).toBe(40);
  });
});
describe("real rewards and backups", () => {
  function earned() {
    const s = freshSave();
    activateReward(s, "mechanic", "Hot Wheels");
    addEvidence(
      s,
      evidence({
        conceptId: "",
        evidenceType: "quest_completed",
        questId: "workshop",
      }),
    );
    for (const conceptId of ["fish", "rod", "helmet"]) {
      addEvidence(s, evidence({ conceptId }));
      addEvidence(
        s,
        evidence({
          conceptId,
          evidenceType: "spoken_verified",
          assessmentSource: "parent",
        }),
      );
    }
    return s;
  }
  it("starts without real promises; snapshots rewards and rejects duplicate activation", () => {
    const s = freshSave();
    expect(s.rewards).toEqual([]);
    activateReward(s, "mechanic", "Autíčko");
    activateReward(s, "mechanic", "Changed");
    expect(s.rewards).toHaveLength(1);
    expect(s.rewards[0].label).toBe("Autíčko");
    expect(s.rewards[0].conditions).not.toBe(
      achievements.find((a) => a.id === "mechanic")!.conditions,
    );
  });
  it("requires evidence and adult confirmation before redemption and redeems once", () => {
    const s = earned();
    expect(s.rewards[0].state).toBe("earned");
    expect(redeemReward(s, "mechanic")).toBe(false);
    confirmReward(s, "mechanic");
    expect(redeemReward(s, "mechanic")).toBe(true);
    expect(redeemReward(s, "mechanic")).toBe(false);
    expect(s.redeemed).toEqual(["reward:mechanic"]);
  });
  it("importing an older backup cannot revive a redeemed reward", () => {
    const s = earned(),
      old = structuredClone(s);
    confirmReward(s, "mechanic");
    redeemReward(s, "mechanic");
    const restored = mergeBackup(s, old);
    expect(restored.rewards[0].state).toBe("redeemed");
    expect(redeemReward(restored, "mechanic")).toBe(false);
  });
  it("migrates schema 1 and rejects corrupt or future saves without mutating input", () => {
    const old = { ...freshSave(), schemaVersion: 1 };
    const migrated = migrate(old);
    expect(migrated.schemaVersion).toBe(2);
    expect(old.schemaVersion).toBe(1);
    expect(() => migrate({ ...old, schemaVersion: 80 })).toThrow();
    expect(() => migrate({ ...old, events: [{ id: "bad" }] })).toThrow();
  });
  it("rejects forged provider speech and changed challenge conditions on import", () => {
    const s = earned();
    s.events.push(evidence({ evidenceType: "spoken_verified" }));
    expect(() => migrate(s)).toThrow();
    s.events.pop();
    s.rewards[0].conditions.distinctVerifiedSpokenConcepts = 0;
    expect(() => migrate(s)).toThrow();
  });
});
