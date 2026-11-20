// node tools/build-speech-references.mjs <ffmpeg executable> [additional MP3 directory]
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { speechFeatures } from "../app/src/acoustics.ts";
const [ffmpeg = "ffmpeg", ...additionalDirectories] = process.argv.slice(2);
const { vocabulary } = JSON.parse(
  readFileSync("content/vocabulary.json", "utf8"),
);
mkdirSync("content/speech-references", { recursive: true });
for (const lang of ["cs", "en"]) {
  const references = {};
  for (const w of vocabulary)
    for (const kind of ["word", "phrase"]) {
      const clip = `${kind}.${w.id}.${lang}.mp3`;
      const label = kind === "word" ? w[lang] : w.phrase[lang];
      const paths = [join("game-assets/audio", clip)];
      for (const dir of additionalDirectories) paths.push(join(dir, clip));
      const model = `game-assets/audio/model.${w.id}.${lang}.mp3`;
      if (kind === "word" && existsSync(model)) paths.push(model);
      const samples = paths.map((path) => {
        const raw = execFileSync(ffmpeg, [
          "-loglevel",
          "error",
          "-i",
          path,
          "-ac",
          "1",
          "-ar",
          "16000",
          "-f",
          "f32le",
          "pipe:1",
        ]);
        const features = speechFeatures(
          new Float32Array(new Uint8Array(raw).buffer),
          16000,
        );
        if (!features.length) throw Error("Unusable reference: " + path);
        return Buffer.from(features.buffer).toString("base64");
      });
      references[label] = [
        ...new Set([...(references[label] ?? []), ...samples]),
      ];
    }
  writeFileSync(
    `content/speech-references/${lang}.json`,
    JSON.stringify(references),
  );
}
