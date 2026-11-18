import React from "react";
import { renderToString } from "react-dom/server";
import { it, expect } from "vitest";
import { Game } from "../app/src/Game";
import { activeQuests, words } from "../app/src/data";
import { freshSave, startRun, phaseFor } from "../app/src/domain";
import audio from "../content/story-audio.json";
it("renders every authored story step in both guide languages and resolves its recorded narration", () => {
  const ids = new Set(audio.lines.map((l) => l.id));
  for (const q of activeQuests)
    for (const lang of ["cs", "en"] as const) {
      const s = freshSave();
      s.prefs.language = lang;
      startRun(s, q.id, "cs");
      for (const [i, t] of q.tasks.entries()) {
        s.run!.step = i;
        s.run!.phase = phaseFor(t);
        const html = renderToString(
          <Game
            save={s}
            onMap={() => {}}
            onSpeech={() => {}}
            onFinish={() => {}}
            paused={false}
          />,
        );
        expect(html).toContain("game-screen");
        if (t.kind === "narrative")
          expect(ids.has(`story.${q.id}.${t.id}.${lang}`)).toBe(true);
        if (t.kind === "learn") {
          expect(q.tasks[i - 1].kind).toBe("narrative");
          expect(t.contextEn).toContain("In Czech");
          expect(
            audio.lines.find((l) => l.id === `lesson.${q.id}.${t.concept}.en`)
              ?.text,
          ).toBe(t.contextEn);
          expect(ids.has(`model.${t.concept}.cs`)).toBe(true);
          expect(ids.has(`echo.${t.concept}.cs`)).toBe(true);
          expect(html).toContain(words[t.concept].syllablesCs!);
          expect(q.tasks[i + 1]).toMatchObject({
            kind: "find",
            concept: t.concept,
          });
        }
      }
    }
});
