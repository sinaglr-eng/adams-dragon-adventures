import cs from "../../content/speech-references/cs.json?url";
import en from "../../content/speech-references/en.json?url";
import type { Lang } from "./data";
import { assessSpeech, speechFeatures, type VoiceExamples } from "./acoustics";

const models = new Map<Lang, Promise<VoiceExamples>>();
function model(language: Lang) {
  let pending = models.get(language);
  if (!pending) {
    pending = fetch(language === "cs" ? cs : en)
      .then(async (response) => {
        if (!response.ok) throw Error("Reference audio unavailable");
        const packed: Record<string, string[]> = await response.json();
        return Object.fromEntries(
          Object.entries(packed).map(([key, values]) => [
            key,
            values.map((value) =>
              Int8Array.from(atob(value), (byte) => byte.charCodeAt(0)),
            ),
          ]),
        );
      })
      .catch((error) => {
        models.delete(language);
        throw error;
      });
    models.set(language, pending);
  }
  return pending;
}
export async function checkRecording(url: string, target: string, lang: Lang) {
  const decoder = new OfflineAudioContext(1, 1, 16000);
  const [decoded, examples] = await Promise.all([
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((raw) => decoder.decodeAudioData(raw)),
    model(lang),
  ]);
  return assessSpeech(
    speechFeatures(decoded.getChannelData(0), decoded.sampleRate),
    target,
    examples,
  );
}
