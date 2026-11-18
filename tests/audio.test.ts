import { afterEach, expect, it, vi } from "vitest";
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});
it("models each Czech word twice, slows only the second model, and leaves time to repeat", async () => {
  vi.useFakeTimers();
  const played: { src: string; rate: number }[] = [];
  const instances: FakeAudio[] = [];
  class FakeAudio {
    src = "";
    playbackRate = 1;
    preservesPitch = false;
    volume = 1;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    pause = vi.fn();
    constructor() {
      instances.push(this);
    }
    play = () => {
      played.push({ src: this.src, rate: this.playbackRate });
      return Promise.resolve();
    };
  }
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("window", { speechSynthesis: { cancel: vi.fn() } });
  const audio = await import("../app/src/audio");
  const run = audio.play(["word.apple.cs", "word.apple.en"]);
  expect(played.map((x) => x.rate)).toEqual([1]);
  instances[0].onended!();
  await vi.advanceTimersByTimeAsync(1599);
  expect(played).toHaveLength(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(played.map((x) => x.rate)).toEqual([1, 0.76]);
  expect(instances[0].preservesPitch).toBe(true);
  instances[0].onended!();
  await vi.advanceTimersByTimeAsync(2199);
  expect(played).toHaveLength(2);
  await vi.advanceTimersByTimeAsync(1);
  expect(played.map((x) => x.rate)).toEqual([1, 0.76, 1]);
  expect(played[2].src).toContain("word.apple.en.mp3");
  instances[0].onended!();
  await run;
  expect(vi.getTimerCount()).toBe(0);
});
it("navigation during the child's repetition pause cancels the slow model", async () => {
  vi.useFakeTimers();
  const instances: FakeAudio[] = [];
  class FakeAudio {
    src = "";
    onended: (() => void) | null = null;
    onerror = null;
    pause = vi.fn();
    play = vi.fn(() => Promise.resolve());
    constructor() {
      instances.push(this);
    }
  }
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("window", { speechSynthesis: { cancel: vi.fn() } });
  const audio = await import("../app/src/audio");
  const run = audio.play("word.fish.cs");
  instances[0].onended!();
  await vi.advanceTimersByTimeAsync(500);
  audio.stopAudio();
  await run;
  await vi.advanceTimersByTimeAsync(5000);
  expect(instances[0].play).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
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
