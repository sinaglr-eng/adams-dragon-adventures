import "fake-indexeddb/auto";
import { it, expect } from "vitest";
import { initialize, mutate, snapshot, rawSave } from "../app/src/store";
import {
  activateReward,
  confirmReward,
  redeemReward,
  addEvidence,
  eventFor,
} from "../app/src/domain";
it("serializes concurrent writes and persists a single redemption atomically", async () => {
  await initialize();
  await mutate((s) => {
    activateReward(s, "mechanic", "Car");
    addEvidence(s, {
      ...eventFor(s, "quest_completed", ""),
      id: "complete",
      questId: "workshop",
    });
    for (const id of ["fish", "rod", "helmet"]) {
      addEvidence(s, eventFor(s, "recognized", id));
      addEvidence(s, eventFor(s, "spoken_verified", id));
    }
    confirmReward(s, "mechanic");
  });
  await Promise.all([
    mutate((s) => {
      redeemReward(s, "mechanic");
    }),
    mutate((s) => {
      redeemReward(s, "mechanic");
    }),
  ]);
  expect(snapshot().redeemed).toEqual(["reward:mechanic"]);
  expect(
    ((await rawSave()) as typeof snapshot extends () => infer T ? T : never)
      .rewards[0].state,
  ).toBe("redeemed");
  await initialize();
  expect(snapshot().rewards[0].state).toBe("redeemed");
});
