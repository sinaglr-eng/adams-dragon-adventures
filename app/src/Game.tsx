import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { asset, questById, words, title, type Lang } from "./data";
import {
  addEvidence,
  advance,
  eventFor,
  fishingNext,
  optionsFor,
  tasksFor,
  transition,
  discovered,
  mastery,
  type Save,
} from "./domain";
import { mutate } from "./store";
import { Button, Icon, Narrator, Sprite, WordArt, Stars } from "./components";
import { line, play, stopAudio, chime } from "./audio";

export function Game({
  save,
  onMap,
  onSpeech,
  onFinish,
  paused,
}: {
  save: Save;
  onMap: () => void;
  onSpeech: (id: string) => void;
  onFinish: () => void;
  paused: boolean;
}) {
  const r = save.run!,
    q = questById[r.questId],
    tasks = tasksFor(q.id),
    task = tasks[r.step],
    ui = save.prefs.language;
  const [busy, setBusy] = useState(false);
  const [spot, setSpot] = useState(1);
  const [feedback, setFeedback] = useState("");
  const cycle = task?.kind === "cycle",
    fishing = task?.kind === "fishing";
  const cycleQuestion = cycle && r.phase.startsWith("question");
  const cycleStop = Number(r.phase.replace(/\D/g, "")) || 0;
  const cycleWords = task?.cycleWords ?? ["helmet", "bicycle", "rod"];
  const cycleWord = cycleWords[cycleStop] ?? "helmet";
  const bg = task?.background ?? (cycle ? "meadow-trail" : q.background);
  const narrative = task?.kind === "narrative" && r.phase !== "summary";
  const [storyActing, setStoryActing] = useState(false);
  const [heard, setHeard] = useState(false);
  const playback = useRef(0);
  const lesson = task?.kind === "learn" ? task.contextEn : undefined;
  const instructionKey = narrative
    ? null
    : r.phase === "intro"
      ? null
      : r.phase === "summary"
        ? null
        : r.phase === "correct"
          ? "packed"
          : task?.kind === "learn"
            ? "learn"
            : fishing
              ? r.phase === "identify"
                ? "find"
                : r.phase === "speech_optional"
                  ? "speech"
                  : (r.phase as "equipment")
              : task?.kind === "discover"
                ? r.phase === "hidden"
                  ? "hidden"
                  : r.phase === "inspect"
                    ? "inspect"
                    : "release"
                : cycle
                  ? r.phase === "helmet"
                    ? "helmet"
                    : cycleQuestion
                      ? "find"
                      : "cycle"
                  : task?.kind;
  const instruction = narrative
    ? task.text!.en
    : lesson
      ? lesson
      : r.phase === "intro"
        ? ui === "cs"
          ? q.scriptCs
          : q.scriptEn
        : r.phase === "summary"
          ? ui === "cs"
            ? "Výprava je hotová. Teď si můžeme odpočinout."
            : "Our adventure is complete. Now we can take a break."
          : line((instructionKey ?? "find") as Parameters<typeof line>[0], ui);
  const cues = () => {
    if (narrative) return [`story.${q.id}.${task.id}.en`];
    if (r.phase === "intro") return [`quest.${q.id}.intro.${ui}`];
    if (r.phase === "summary") return [`questui.finish-story.${ui}`];
    if (r.phase === "correct")
      return [`game.packed.${ui}`, `word.${task.concept}.${r.language}`];
    if (lesson)
      return [
        `lesson.${q.id}.${task.concept}.en`,
        `model.${task.concept}.cs`,
        "lesson.repeat.cs",
        `echo.${task.concept}.cs`,
      ];
    if (task.kind === "learn")
      return ui === "en"
        ? task.concept === "hello"
          ? ["questui.greeting.en", "questui.repeat.en", "word.hello.cs"]
          : [
              `word.${task.concept}.en`,
              `meaning.${task.concept}.en`,
              "questui.bridge.en",
              "questui.repeat.en",
              `word.${task.concept}.cs`,
            ]
        : [
            `meaning.${task.concept}.cs`,
            "questui.repeat.cs",
            `word.${task.concept}.cs`,
          ];
    if (cycleQuestion)
      return [`game.find.${ui}`, `word.${cycleWord}.${r.language}`];
    return [
      `game.${instructionKey}.${ui}`,
      ...(["find", "pack", "assemble", "story", "compare"].includes(
        task.kind,
      ) || r.phase === "identify"
        ? [
            `${task.kind === "story" ? "phrase" : "word"}.${task.concept}.${r.language}`,
          ]
        : []),
    ];
  };
  const replay = () => {
    const request = ++playback.current;
    setHeard(false);
    void play(cues()).then(() => {
      if (request === playback.current) setHeard(true);
    });
  };
  useEffect(() => {
    setFeedback("");
    setStoryActing(false);
    if (!paused) replay();
    return () => {
      playback.current++;
      stopAudio();
    };
  }, [r.id, r.step, r.phase, paused]);
  useEffect(() => {
    if (!storyActing || paused) return;
    const timer = setTimeout(() => {
      setStoryActing(false);
      void mutate((s) => {
        if (s.run?.id === r.id) advance(s, r.step);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [storyActing, paused, r.id, r.step]);
  useEffect(() => {
    if (fishing && r.phase === "wait" && !paused) {
      const timer = setTimeout(
        () => void mutate((s) => transition(s, r.step, "wait", "bite")),
        2400,
      );
      return () => clearTimeout(timer);
    }
  }, [r.id, r.step, r.phase, paused]);
  useEffect(() => {
    if (task?.kind === "learn")
      void mutate((s) => {
        if (s.run?.id === r.id && s.run.step === r.step) {
          for (const lang of ["cs", "en"] as Lang[])
            addEvidence(s, eventFor(s, "introduced", task.concept, true, lang));
        }
      });
  }, [r.id, r.step]);
  const act = async (fn: (s: Save) => void) => {
    if (busy || paused) return;
    setBusy(true);
    try {
      await mutate(fn);
    } finally {
      setBusy(false);
    }
  };
  const next = () => void act((s) => advance(s, r.step));
  const phase = (next: string) =>
    void act((s) => transition(s, r.step, r.phase, next));
  const recognize = (s: Save, concept = task.concept) =>
    addEvidence(s, eventFor(s, "recognized", concept, s.run?.helped ?? false));
  const select = async (id: string) => {
    if (id !== task.concept) {
      setFeedback(line("help", ui));
      await act((s) => {
        if (s.run?.id === r.id && s.run.step === r.step) {
          s.run.helped = true;
          s.run.attempts++;
        }
      });
      void play([`game.help.${ui}`, `word.${task.concept}.${r.language}`]);
      return;
    }
    await act((s) => {
      if (s.run?.id !== r.id || s.run.step !== r.step) return;
      if (["pack", "assemble"].includes(task.kind)) {
        s.run.selected = id;
        s.run.phase = "place";
      } else {
        recognize(s);
        s.run.phase = "correct";
      }
    });
    chime();
    setFeedback(line("packed", ui));
  };
  const place = (id?: string) =>
    void act((s) => {
      if (
        s.run?.id !== r.id ||
        s.run.step !== r.step ||
        s.run.phase === "correct"
      )
        return;
      const selected = id ?? s.run.selected;
      if (selected !== task.concept) {
        s.run.helped = true;
        s.run.attempts++;
        return;
      }
      recognize(s);
      s.run.selected = task.concept;
      s.run.phase = "correct";
      chime();
    });
  const help = () => {
    void mutate((s) => {
      if (s.run?.id === r.id && s.run.step === r.step) s.run.helped = true;
    });
    void play(`word.${task.concept}.en`);
  };
  const options = useMemo(
    () => (task ? optionsFor(task, r.orderSeed + r.step * 13) : []),
    [r.id, r.step],
  );
  const choices = (compare = false) => (
    <div
      className={`choices ${compare ? "comparison" : ""}`}
      role="group"
      aria-label={ui === "cs" ? "Vyber obrázek" : "Choose a picture"}
    >
      {options
        .filter(
          (id, i) =>
            r.attempts < 2 ||
            id === task.concept ||
            i === options.findIndex((x) => x !== task.concept),
        )
        .map((id) => (
          <button
            key={id}
            className={`choice ${r.selected === id ? "selected" : ""}`}
            disabled={busy}
            aria-label={words[id].cs + " / " + words[id].en}
            onClick={() => void select(id)}
            draggable={["pack", "assemble"].includes(task.kind)}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", id);
            }}
          >
            <WordArt id={id} />
            {r.helped && <span>{words[id][r.language]}</span>}
          </button>
        ))}
    </div>
  );
  const done = r.phase === "summary";
  const intro = r.phase === "intro";
  const fishAlive = ["fish", "carp", "perch", "catfish", "pike"].includes(
    task?.concept,
  );
  const totalDiscovered = discovered(save).size;
  return (
    <main
      className={`game-screen ${fishing ? "fishing-scene" : ""} ${narrative ? "narrative-scene" : ""} ${paused ? "paused" : ""}`}
    >
      <div className="quest-ribbon">
        <span>
          {q.region === "iowa"
            ? "IOWA"
            : q.region === "pribram"
              ? "PŘÍBRAM"
              : "IOWA → PŘÍBRAM"}
        </span>
        <h1>{title(q, ui)}</h1>
        <div
          className="quest-progress"
          role="progressbar"
          aria-label="Výprava / Adventure"
          aria-valuenow={Math.max(0, r.step)}
          aria-valuemin={0}
          aria-valuemax={tasks.length}
        >
          <i
            style={{ width: `${(Math.max(0, r.step) / tasks.length) * 100}%` }}
          />
        </div>
      </div>
      <Narrator
        compact={narrative}
        instruction={instruction}
        lang={ui}
        onReplay={replay}
        csTarget={
          cycleQuestion
            ? words[cycleWord][r.language]
            : task &&
                (["find", "pack", "assemble", "compare", "story"].includes(
                  task.kind,
                ) ||
                  r.phase === "identify") &&
                r.phase !== "correct"
              ? task.kind === "story"
                ? words[task.concept].phrase[r.language]
                : words[task.concept][r.language]
              : undefined
        }
        onHelp={
          task &&
          ["find", "pack", "assemble", "compare", "story"].includes(
            task.kind,
          ) &&
          r.phase !== "correct"
            ? help
            : undefined
        }
      />
      <div
        className={`scene scene-${bg} ${cycle ? "cycling" : ""} ${storyActing ? "story-acting" : ""}`}
        style={{ backgroundImage: `url(${asset(bg)})` }}
      >
        <div className="scene-vignette" />
        <div
          className={`actors ${q.background === "iowa-lake" ? "actors-right" : ""} ${intro ? "intro-actors" : ""}`}
        >
          <Sprite
            id={
              cycle
                ? "adam-actions/cycling"
                : task?.kind === "discover"
                  ? "adam-actions/magnifier"
                  : done
                    ? "adam-poses/celebrate"
                    : fishing
                      ? "adam-poses/fish"
                      : intro
                        ? "adam-poses/wave"
                        : "adam-poses/idle"
            }
            className={`adam actor ${cycle ? "riding" : ""} ${done ? "celebrate" : ""}`}
            style={
              cycle
                ? ({ "--stop": cycleStop } as React.CSSProperties)
                : undefined
            }
          />
          {(!cycle || !q.archived) &&
            (task?.cast ?? q.cast)
              .filter((id) => id !== "adam")
              .slice(0, 3)
              .map((id, i) => (
                <Sprite
                  key={id}
                  id={`family/${id}`}
                  className={`actor companion companion-${i} ${id === "matyas" ? "little" : ""}`}
                  alt={id}
                />
              ))}
        </div>
        {narrative && (
          <div className="story-stage">
            <span className="story-chapter">{title(q, ui)}</span>
            <button
              className={`story-touch ${task.action === "plane" ? "ocean-touch" : ""} ${heard ? "invite-touch" : ""}`}
              aria-label={
                ui === "cs" ? "Pokračovat v příběhu" : "Continue the story"
              }
              disabled={storyActing || paused}
              onClick={() => {
                stopAudio();
                chime();
                setStoryActing(true);
              }}
            >
              {task.pictures ? (
                <span className="story-pictures">
                  {task.pictures.map((id) => (
                    <WordArt key={id} id={id} />
                  ))}
                </span>
              ) : (
                <Sprite
                  id={task.art!}
                  className={`story-object ${task.art!.startsWith("family/") ? "story-character" : ""}`}
                />
              )}
              <span className="touch-cue">
                <Icon
                  name={
                    task.action === "wave" ? "heart" : (task.action ?? "next")
                  }
                />
              </span>
              {task.action === "plane" && (
                <span className="story-plane">
                  <Icon name="plane" />
                </span>
              )}
            </button>
            <div
              className="story-dots"
              aria-label={ui === "cs" ? "Příběhové scény" : "Story scenes"}
            >
              {tasks
                .filter((t) => t.kind === "narrative")
                .map((t) => (
                  <i key={t.id} className={t.id === task.id ? "current" : ""} />
                ))}
            </div>
          </div>
        )}
        {intro && (
          <div className="intro-scroll paper">
            <span className="eyebrow">
              {ui === "cs" ? "NOVÁ KAPITOLA" : "A NEW CHAPTER"}
            </span>
            <h2>{title(q, ui)}</h2>
            <p>
              {ui === "cs"
                ? "Malé kroky. Velké dobrodružství."
                : "Little steps. A big adventure."}
            </p>
            <div className="intro-items">
              {q.concepts.slice(0, 3).map((id) => (
                <WordArt key={id} id={id} />
              ))}
            </div>
            <Button icon="play" onClick={next}>
              {ui === "cs" ? "Jdeme na to!" : "Let's go!"}
            </Button>
          </div>
        )}
        {done && (
          <div className="summary paper">
            <Stars />
            <span className="eyebrow">
              {ui === "cs" ? "VÝPRAVA DOKONČENA" : "ADVENTURE COMPLETE"}
            </span>
            <h2>{ui === "cs" ? "To byl ale příběh!" : "What an adventure!"}</h2>
            <p>
              {ui === "cs"
                ? `V atlasu máš ${totalDiscovered} objevených karet.`
                : `You have ${totalDiscovered} discovered cards in your atlas.`}
            </p>
            <div className="summary-cards">
              {[
                ...new Set(
                  tasks
                    .filter((t) => t.kind !== "narrative")
                    .map((t) => t.concept),
                ),
              ]
                .slice(0, 5)
                .map((id) => (
                  <button
                    aria-label={words[id].cs}
                    key={id}
                    onClick={() => onSpeech(id)}
                  >
                    <WordArt id={id} />
                    <span>{words[id].cs}</span>
                    {mastery(save, id).spoken && <b>✦</b>}
                  </button>
                ))}
            </div>
            <div className="button-row">
              <Button icon="map" onClick={onMap}>
                {ui === "cs" ? "Moje mapa" : "My map"}
              </Button>
              <Button icon="home" className="secondary" onClick={onFinish}>
                {ui === "cs" ? "Pro dnešek hotovo" : "All done for today"}
              </Button>
            </div>
          </div>
        )}
        {!intro && !done && task.kind === "learn" && (
          <div className="learn-panel paper">
            <div className="learning-art">
              <WordArt id={task.concept} />
              <span className="art-spark">✦</span>
            </div>
            <div>
              <span className="eyebrow">
                {ui === "cs" ? "SLOVO DO ATLASU" : "A WORD FOR YOUR ATLAS"}
              </span>
              <h2>{words[task.concept].cs}</h2>
              <p className="translation">{words[task.concept].en}</p>
              {lesson ? (
                <p lang="cs">
                  A nyní opakuj po mně.{" "}
                  <strong>{words[task.concept].syllablesCs}</strong>
                </p>
              ) : (
                <p>{words[task.concept].meaning[ui]}</p>
              )}
              {(!lesson || heard) && (
                <div className="button-row">
                  <Button
                    icon="speaker"
                    className="secondary"
                    onClick={() =>
                      void play(
                        lesson
                          ? [
                              `model.${task.concept}.cs`,
                              "lesson.repeat.cs",
                              `echo.${task.concept}.cs`,
                            ]
                          : `word.${task.concept}.cs`,
                      )
                    }
                  >
                    Česky
                  </Button>
                  <Button
                    icon="speaker"
                    className="secondary"
                    onClick={() => void play(`word.${task.concept}.en`)}
                  >
                    English
                  </Button>
                </div>
              )}
              <Button
                icon="next"
                disabled={!!lesson && !heard && !save.prefs.muted}
                onClick={next}
              >
                {ui === "cs" ? "Zkusím to" : "I’m ready"}
              </Button>
            </div>
          </div>
        )}
        {!intro &&
          !done &&
          ["find", "compare", "story", "pack", "assemble"].includes(
            task.kind,
          ) && (
            <div
              className={`activity ${["pack", "assemble"].includes(task.kind) ? "packing" : ""}`}
            >
              {task.kind === "story" && (
                <div className="story-strip">
                  {(!q.archived && task.options
                    ? task.options
                    : q.id === "travel"
                      ? ["hello", "please", "thanks"]
                      : ["fish", "boot", "apple"]
                  ).map((id, i) => (
                    <div
                      key={id}
                      className={id === task.concept ? "current" : ""}
                    >
                      <span>{i + 1}</span>
                      <WordArt id={id} />
                    </div>
                  ))}
                </div>
              )}
              {r.phase === "correct" ? (
                <div className="correct paper">
                  <Icon name="check" />
                  <h2>{words[task.concept].cs}</h2>
                  <p>{words[task.concept].en}</p>
                  {task.kind === "story" && (
                    <>
                      <p>{words[task.concept].phrase.cs}</p>
                      <Button
                        icon="speaker"
                        className="secondary"
                        onClick={() => void play(`phrase.${task.concept}.cs`)}
                      >
                        {ui === "cs"
                          ? "Poslechni si větu"
                          : "Listen to the sentence"}
                      </Button>
                      <Button
                        icon="microphone"
                        className="secondary"
                        onClick={() => onSpeech(task.concept)}
                      >
                        {ui === "cs" ? "Povím to" : "Tell the story"}
                      </Button>
                    </>
                  )}
                  <Button icon="next" onClick={next}>
                    {ui === "cs" ? "Dál" : "Next"}
                  </Button>
                </div>
              ) : (
                <>
                  {choices(task.kind === "compare")}
                  {["pack", "assemble"].includes(task.kind) && (
                    <button
                      className={`drop-target ${r.selected ? "ready" : ""}`}
                      aria-label={
                        task.kind === "pack"
                          ? "Vložit do batohu / Put in backpack"
                          : "Připevnit ke kolu / Attach to bicycle"
                      }
                      onClick={() => place()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e: DragEvent) => {
                        e.preventDefault();
                        place(e.dataTransfer.getData("text/plain"));
                      }}
                    >
                      {task.kind === "pack" ? (
                        <div className="backpack">
                          <Icon name="suitcase" />
                        </div>
                      ) : (
                        <Sprite id="props/bicycle" />
                      )}
                      <span>
                        {r.selected
                          ? ui === "cs"
                            ? "Sem!"
                            : "Here!"
                          : ui === "cs"
                            ? "Nejdřív vyber předmět"
                            : "Choose an item first"}
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        {!intro && !done && fishing && (
          <div className={`fishing-interaction phase-${r.phase}`}>
            {["cast", "wait", "bite", "reel"].includes(r.phase) && (
              <>
                <svg
                  className="fishing-line"
                  viewBox="0 0 600 300"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d={
                      q.background === "iowa-lake"
                        ? "M590 20 Q360 0 240 230"
                        : "M10 20 Q260 0 360 230"
                    }
                  />
                </svg>
                <div className={`water-ripple spot-${spot}`} />
              </>
            )}
            {r.phase === "equipment" && (
              <button
                className="floating-item"
                aria-label="Připravit prut / Ready the rod"
                onClick={() => phase("cast")}
              >
                <Sprite id="props/rod" />
                <span>{ui === "cs" ? "Připrav prut" : "Ready your rod"}</span>
              </button>
            )}
            {r.phase === "cast" && (
              <div className="fishing-spots">
                {[0, 1, 2].map((n) => (
                  <button
                    key={n}
                    aria-label={`Nahodit na místo ${n + 1} / Cast at spot ${n + 1}`}
                    onClick={() => {
                      setSpot(n);
                      phase("wait");
                    }}
                  >
                    <Icon name="fishing" />
                    <span>{ui === "cs" ? "Nahodit" : "Cast"}</span>
                  </button>
                ))}
              </div>
            )}
            {["wait", "bite", "reel"].includes(r.phase) && (
              <button
                className={`bobber spot-${spot} ${r.phase === "bite" ? "bite" : ""}`}
                onClick={() => phase(fishingNext[r.phase])}
                aria-label={
                  r.phase === "wait"
                    ? "Počkat na záběr / Wait for a bite"
                    : r.phase === "bite"
                      ? "Zatáhnout / Reel in"
                      : "Vytáhnout úlovek / Land your catch"
                }
              >
                <Sprite id="props/float" />
                <span>
                  {r.phase === "wait"
                    ? ui === "cs"
                      ? "Sleduj splávek"
                      : "Watch the bobber"
                    : r.phase === "bite"
                      ? ui === "cs"
                        ? "Zabralo to!"
                        : "A bite!"
                      : ui === "cs"
                        ? "Přitáhni!"
                        : "Reel it in!"}
                </span>
              </button>
            )}
            {r.phase === "reveal" && (
              <button
                className="catch-reveal paper"
                onClick={() => phase("identify")}
              >
                <WordArt id={task.concept} />
                <span>{ui === "cs" ? "Co je to?" : "What is it?"}</span>
              </button>
            )}
            {r.phase === "identify" && (
              <div className="catch-identify">{choices()}</div>
            )}
            {r.phase === "correct" && (
              <div className="catch-card paper">
                <WordArt id={task.concept} />
                <h2>{words[task.concept].cs}</h2>
                <p>{words[task.concept].en}</p>
                <Button icon="next" onClick={() => phase("speech_optional")}>
                  {ui === "cs" ? "Moje karta" : "My card"}
                </Button>
              </div>
            )}
            {r.phase === "speech_optional" && (
              <div className="catch-card paper">
                <WordArt id={task.concept} />
                <h2>{words[task.concept].cs}</h2>
                <Button
                  icon="microphone"
                  onClick={() => onSpeech(task.concept)}
                >
                  {ui === "cs" ? "Probuď hlasem" : "Try saying it"}
                </Button>
                <Button
                  icon="next"
                  className="secondary"
                  onClick={() => phase("release")}
                >
                  {ui === "cs" ? "Pokračovat" : "Keep exploring"}
                </Button>
              </div>
            )}
            {r.phase === "release" && (
              <div className="release-card paper">
                <WordArt id={task.concept} />
                <Button icon={fishAlive ? "heart" : "atlas"} onClick={next}>
                  {fishAlive
                    ? ui === "cs"
                      ? "Pustit zpátky do vody"
                      : "Release into the water"
                    : ui === "cs"
                      ? "Uložit poklad"
                      : "Keep the treasure"}
                </Button>
              </div>
            )}
          </div>
        )}
        {!intro && !done && task.kind === "discover" && (
          <div className="nature-interaction">
            {r.phase === "hidden" ? (
              <button
                className="leaf-hide"
                onClick={() => phase("inspect")}
                aria-label="Odkryj list / Lift the leaf"
              >
                <Sprite
                  id={task.concept === "stone" ? "props/stone" : "props/leaf"}
                />
                <span>
                  {ui === "cs" ? "Kdo je pod listem?" : "Who's hiding?"}
                </span>
              </button>
            ) : r.phase === "inspect" ? (
              <button
                className="magnified"
                onClick={() => phase("release")}
                aria-label="Prohlédnout lupou / Look closer"
              >
                <WordArt id={task.concept} />
                <Icon name="help" />
              </button>
            ) : (
              <div className="nature-release paper">
                <WordArt id={task.concept} />
                <Button icon="heart" onClick={next}>
                  {ui === "cs" ? "Nechat v přírodě" : "Leave it in nature"}
                </Button>
              </div>
            )}
          </div>
        )}
        {!intro && !done && cycle && (
          <div className="cycle-interaction">
            {r.phase === "helmet" ? (
              <button
                className="floating-item"
                onClick={() => phase("stop0")}
                aria-label="Nasadit helmu / Put on helmet"
              >
                <Sprite id="props/helmet" />
                <span>{ui === "cs" ? "Helmu na hlavu" : "Helmet on!"}</span>
              </button>
            ) : cycleQuestion ? (
              <div className="cycle-question">
                <div className="choices">
                  {optionsFor(
                    {
                      kind: "find",
                      concept: cycleWord,
                      options: [
                        cycleWord,
                        cycleWord === "apple" ? "helmet" : "apple",
                      ],
                    },
                    r.orderSeed + cycleStop,
                  ).map((id) => (
                    <button
                      key={id}
                      className="choice"
                      aria-label={`${words[id].cs} / ${words[id].en}`}
                      onClick={() => {
                        if (id !== cycleWord) {
                          void act((s) => {
                            if (s.run?.phase === r.phase) s.run.helped = true;
                          });
                          void play(`word.${cycleWord}.${r.language}`);
                          return;
                        }
                        void act((s) => {
                          if (s.run?.phase !== r.phase || s.run.step !== r.step)
                            return;
                          recognize(s, cycleWord);
                          if (cycleStop === 2) advance(s, r.step);
                          else {
                            s.run.phase = `stop${cycleStop + 1}`;
                            s.run.helped = false;
                          }
                        });
                        chime();
                      }}
                    >
                      <WordArt id={id} />
                      {r.helped && <span>{words[id][r.language]}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="route-stops">
                {[0, 1, 2].map((n) => (
                  <button
                    key={n}
                    className={r.phase === `stop${n}` ? "current" : ""}
                    disabled={r.phase !== `stop${n}`}
                    aria-label={`Zastávka ${n + 1} / Stop ${n + 1}`}
                    onClick={() => phase(`question${n}`)}
                  >
                    <Icon name={n === 2 ? "fishing" : "bicycle"} />
                    <span>{n + 1}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {feedback && r.phase !== "correct" && (
        <div className="gentle-feedback" role="status">
          {feedback}
        </div>
      )}
      <div className="scene-footer">
        <span>
          <Icon name="heart" />
          {ui === "cs"
            ? "Vlastním tempem. Bez spěchu."
            : "Your own pace. No rush."}
        </span>
        {!intro && !done && (
          <span>
            {Math.min(r.step + 1, tasks.length)} / {tasks.length}
          </span>
        )}
      </div>
    </main>
  );
}
