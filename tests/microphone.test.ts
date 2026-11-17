import { it, expect, vi, afterEach } from "vitest";
import { PracticeRecorder } from "../app/src/microphone";
afterEach(() => vi.unstubAllGlobals());
it("denied microphone has a truthful, recoverable state", async () => {
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: () =>
        Promise.reject(new DOMException("denied", "NotAllowedError")),
    },
  });
  vi.stubGlobal("MediaRecorder", class {});
  const update = vi.fn();
  await new PracticeRecorder(update).start();
  expect(update).toHaveBeenLastCalledWith("permission_denied");
});
it("unsupported browser never tries to record", async () => {
  vi.stubGlobal("navigator", {});
  const update = vi.fn();
  await new PracticeRecorder(update).start();
  expect(update).toHaveBeenLastCalledWith("unsupported");
});
it("a late permission response after dialog close stops all tracks", async () => {
  let resolve!: (s: unknown) => void;
  const stop = vi.fn();
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: () =>
        new Promise((r) => {
          resolve = r;
        }),
    },
  });
  vi.stubGlobal("MediaRecorder", class {});
  const update = vi.fn(),
    recorder = new PracticeRecorder(update);
  const task = recorder.start();
  recorder.dispose();
  resolve({ getTracks: () => [{ stop }] });
  await task;
  expect(stop).toHaveBeenCalledOnce();
  expect(update).not.toHaveBeenCalledWith("recording");
});
