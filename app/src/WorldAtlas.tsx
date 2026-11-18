import { useEffect, useRef, useState } from "react";
import { activeQuests, asset, title, type Lang } from "./data";
import { completed, unlocked, type Save } from "./domain";
import { Button, Icon, Narrator, Sprite } from "./components";
import { play, stopAudio } from "./audio";
import storyAudio from "../../content/story-audio.json";

export type HomeRegion = "iowa" | "pribram";
export const questsAtHome = (region: HomeRegion) =>
  activeQuests.filter((q) => q.region === region);

export function WorldAtlas({
  save,
  onStart,
  paused,
}: {
  save: Save;
  onStart: (id: string) => void;
  paused: boolean;
}) {
  const [region, setRegion] = useState<HomeRegion | null>(null);
  const lang: Lang = save.prefs.language;
  const panel = useRef<HTMLElement>(null);
  const finished = completed(save);
  const cue = `homeguide.${region ?? "welcome"}.${lang}`;
  const text = storyAudio.lines.find((l) => l.id === cue)!.text;
  useEffect(() => {
    if (!paused) void play(cue);
    return () => stopAudio();
  }, [cue, paused]);
  useEffect(() => {
    if (region) {
      panel.current?.focus({ preventScroll: true });
      panel.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [region]);
  return (
    <>
      <div
        className="world-atlas"
        aria-label={lang === "cs" ? "Atlas dvou domovů" : "Atlas of two homes"}
      >
        <img className="atlas-map-art" src={asset("atlas-two-homes")} alt="" />
        {(["iowa", "pribram"] as const).map((home) => (
          <div className={`atlas-page-heading ${home}`} key={home}>
            <span>
              {home === "iowa"
                ? lang === "cs"
                  ? "AMERIKA · USA"
                  : "AMERICA · USA"
                : lang === "cs"
                  ? "EVROPA · ČESKO"
                  : "EUROPE · CZECHIA"}
            </span>
            <h2>{home === "iowa" ? "Iowa" : "Příbram"}</h2>
            <small>
              {home === "iowa"
                ? lang === "cs"
                  ? "angličtina · dolary"
                  : "English · dollars"
                : lang === "cs"
                  ? "čeština · koruny"
                  : "Czech · crowns"}
            </small>
          </div>
        ))}
        {(["iowa", "pribram"] as const).map((home) => (
          <button
            className={`atlas-home ${home}`}
            key={home}
            aria-label={
              home === "iowa"
                ? "Domov v Iowě / Iowa home"
                : "Dům babi a dědy / Grandparents’ home"
            }
            aria-pressed={region === home}
            aria-controls="home-quests"
            onClick={() => {
              if (region === home) void play(cue);
              else setRegion(home);
            }}
          >
            <span className="home-family">
              <Sprite id={`family/${home === "iowa" ? "mama" : "babi"}`} />
              <Sprite id={`family/${home === "iowa" ? "tata" : "deda"}`} />
            </span>
            <span className="home-sign">
              <Icon name="play" />
              <span>
                {home === "iowa"
                  ? lang === "cs"
                    ? "Doma v Iowě"
                    : "Our Iowa home"
                  : lang === "cs"
                    ? "U babi a dědy"
                    : "Grandma & Grandpa"}
              </span>
            </span>
          </button>
        ))}
        <span className="atlas-bookmark">
          {finished.size
            ? activeQuests.filter((q) => finished.has(q.id)).length
            : 0}{" "}
          / {activeQuests.length} <Icon name="star" />
        </span>
      </div>
      <Narrator
        compact
        lang={lang}
        instruction={text}
        onReplay={() => void play(cue)}
      />
      {region && (
        <section
          id="home-quests"
          ref={panel}
          tabIndex={-1}
          className={`home-quests ${region}`}
          aria-label={
            region === "iowa"
              ? "Výpravy v Iowě / Iowa adventures"
              : "Výpravy v Česku / Czech adventures"
          }
        >
          <div className="quest-shelf-heading">
            <h2>
              {region === "iowa"
                ? lang === "cs"
                  ? "U mámy a táty v Iowě"
                  : "With Mom & Dad in Iowa"
                : lang === "cs"
                  ? "U babi a dědy v Příbrami"
                  : "With Grandma & Grandpa in Příbram"}
            </h2>
            <Button
              icon="atlas"
              className="secondary"
              onClick={() => {
                setRegion(null);
                document
                  .querySelector<HTMLButtonElement>(`.atlas-home.${region}`)
                  ?.focus();
              }}
            >
              {lang === "cs" ? "Zpět do atlasu" : "Back to the atlas"}
            </Button>
          </div>
          <div className="quest-covers">
            {questsAtHome(region).map((q) => (
              <article
                className="quest-cover"
                key={q.id}
                style={{ backgroundImage: `url(${asset(q.background)})` }}
              >
                <button
                  className="quest-picture"
                  disabled={!unlocked(save, q.id)}
                  aria-label={`${lang === "cs" ? "Hrát" : "Play"}: ${title(q, lang)}`}
                  onClick={() => onStart(q.id)}
                >
                  <Sprite
                    id={q.region === "pribram" ? "family/chase" : "family/adam"}
                    className="quest-cover-actor"
                  />
                  <span className="quest-picture-play">
                    <Icon name="play" />
                  </span>
                </button>
                {finished.has(q.id) && (
                  <span className="quest-stamp">
                    <Icon name="check" />
                  </span>
                )}
                <div className="quest-cover-copy">
                  <h3>{title(q, lang)}</h3>
                  <Button
                    icon="speaker"
                    className="round secondary"
                    aria-label={`${lang === "cs" ? "Poslechnout" : "Listen"}: ${title(q, lang)}`}
                    onClick={() => void play(`title.${q.id}.${lang}`)}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
