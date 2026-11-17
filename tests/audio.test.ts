import { afterEach, expect, it, vi } from "vitest";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
it("ignores a late playback rejection after navigation", async () => {
  let rejectPlayback!: (reason: DOMException) => void;
  class FakeAudio {
    src = "";
    volume = 1;
    onended = null;
    onerror = null;
    pause = vi.fn();
    play = () =>
      new Promise<void>((_, reject) => {
        rejectPlayback = reject;
      });
  }
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("window", { speechSynthesis: { cancel: vi.fn() } });
  const audio = await import("../app/src/audio"),
    notice = vi.fn();
  audio.audioNotice(notice);
  const run = audio.play("word.fish.cs");
  audio.stopAudio();
  rejectPlayback(new DOMException("interrupted", "AbortError"));
  await run;
  expect(notice).not.toHaveBeenCalled();
});
it("leaving a scene cancels the queued next line and pauses playback", async () => {
  const created: FakeAudio[] = [];
  class FakeAudio {
    src = "";
    volume = 1;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    pause = vi.fn();
    play = vi.fn(() => Promise.resolve());
    constructor() {
      created.push(this);
    }
  }
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("window", { speechSynthesis: { cancel: vi.fn() } });
  const audio = await import("../app/src/audio");
  const run = audio.play(["word.fish.cs", "word.fish.en"]);
  expect(created).toHaveLength(1);
  audio.stopAudio();
  await run;
  expect(created).toHaveLength(1);
  expect(created[0].pause).toHaveBeenCalled();
});
it("mute never starts a voice request", async () => {
  const ctor = vi.fn();
  vi.stubGlobal("Audio", ctor);
  vi.stubGlobal("window", { speechSynthesis: { cancel: vi.fn() } });
  const audio = await import("../app/src/audio");
  audio.configureAudio(true, 0.8);
  await audio.play("word.fish.cs");
  expect(ctor).not.toHaveBeenCalled();
});
it("missing Czech audio never falls back to an English voice", async () => {
  const instances: FakeAudio[] = [];
  class FakeAudio {
    src = "";
    volume = 1;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    pause = vi.fn();
    play = () => Promise.resolve();
    constructor() {
      instances.push(this);
    }
  }
  const speak = vi.fn();
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("window", {
    speechSynthesis: {
      cancel: vi.fn(),
      getVoices: () => [{ lang: "en-US" }],
      speak,
    },
  });
  const audio = await import("../app/src/audio"),
    notice = vi.fn();
  audio.audioNotice(notice);
  const run = audio.play("word.fish.cs");
  instances[0].onerror!();
  await run;
  expect(speak).not.toHaveBeenCalled();
  expect(notice).toHaveBeenCalledWith(expect.stringContaining("České audio"));
});
