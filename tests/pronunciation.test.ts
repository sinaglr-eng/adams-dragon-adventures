import { expect, it } from "vitest";
import cs from "../content/speech-references/cs.json";
import en from "../content/speech-references/en.json";
import { assessSpeech, speechFeatures } from "../app/src/acoustics";
import {
  addEvidence,
  eventFor,
  freshSave,
  mastery,
  migrate,
  xp,
} from "../app/src/domain";

it("rejects silence, a different word, and an ambiguous match", () => {
  const apple = Int8Array.from(atob(cs.jablko[0]), (c) => c.charCodeAt(0));
  const greeting = Int8Array.from(atob(cs.ahoj[0]), (c) => c.charCodeAt(0));
  const examples = { jablko: [apple], ahoj: [greeting] };
  expect(assessSpeech(apple, "jablko", examples)).toBe(true);
  expect(assessSpeech(greeting, "jablko", examples)).toBe(false);
  expect(
    assessSpeech(
      speechFeatures(new Float32Array(32000), 16000),
      "jablko",
      examples,
    ),
  ).toBe(false);
  expect(assessSpeech(apple, "jablko", { ...examples, other: [apple] })).toBe(
    false,
  );
  expect(en.apple.length).toBeGreaterThan(1);
});
it("awards only a verified recording, once, and retains its source on reload", () => {
  const s = freshSave();
  addEvidence(s, eventFor(s, "speech_attempted", "apple", true, "cs"));
  expect(xp(s)).toBe(0);
  const seal = {
    ...eventFor(s, "spoken_verified", "apple", true, "cs", "jablko"),
    assessmentSource: "acoustic" as const,
  };
  addEvidence(s, seal);
  addEvidence(s, seal);
  expect(mastery(migrate(s), "apple").spoken).toBe(true);
  expect(xp(s)).toBe(15);
});
it("initializes bilingual mode for old devices, then remembers deliberate changes", () => {
  const old = freshSave();
  delete old.prefs.languageDefaultVersion;
  old.prefs.language = "cs";
  const updated = migrate(old);
  expect(updated.prefs.language).toBe("en");
  updated.prefs.language = "cs";
  expect(migrate(updated).prefs.language).toBe("cs");
});
