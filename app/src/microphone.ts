export type PracticeState =
  | "idle"
  | "requesting"
  | "recording"
  | "ready"
  | "permission_denied"
  | "unsupported"
  | "error";
export class PracticeRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;
  private token = 0;
  private url: string | null = null;
  constructor(private update: (state: PracticeState, url?: string) => void) {}
  async start() {
    this.dispose();
    const token = ++this.token;
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      this.update("unsupported");
      return;
    }
    this.update("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (token !== this.token) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      this.stream = stream;
      const type = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find(
        (t) => MediaRecorder.isTypeSupported(t),
      );
      this.recorder = new MediaRecorder(
        stream,
        type ? { mimeType: type } : undefined,
      );
      this.chunks = [];
      this.recorder.ondataavailable = (e) => {
        if (e.data.size) this.chunks.push(e.data);
      };
      this.recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (token !== this.token) return;
        const blob = new Blob(this.chunks, {
          type: this.recorder?.mimeType || "audio/mp4",
        });
        this.chunks = [];
        if (!blob.size) {
          this.update("error");
          return;
        }
        this.url = URL.createObjectURL(blob);
        this.update("ready", this.url);
      };
      this.recorder.onerror = () => {
        this.dispose();
        this.update("error");
      };
      this.recorder.start();
      this.update("recording");
      this.timer = setTimeout(() => this.stop(), 6000);
    } catch (e) {
      if (token !== this.token) return;
      this.dispose();
      this.update(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "permission_denied"
          : "error",
      );
    }
  }
  stop() {
    clearTimeout(this.timer);
    if (this.recorder?.state === "recording") this.recorder.stop();
    this.stream?.getTracks().forEach((t) => t.stop());
  }
  dispose() {
    this.token++;
    clearTimeout(this.timer);
    if (this.recorder?.state === "recording") this.recorder.stop();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.recorder = null;
    this.chunks = [];
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = null;
  }
}
