import { useEffect, useState, useSyncExternalStore } from "react";
import {
  activeQuests,
  words,
  vocabulary,
  achievements,
  asset,
  title,
  type Lang,
} from "./data";
import {
  subscribe,
  snapshot,
  initialize,
  storageStatus,
  mutate,
  rawSave,
  recoverWithBackup,
} from "./store";
import {
  completed,
  discovered,
  mastery,
  unlocked,
  startRun,
  xp,
  progress,
  addEvidence,
  uid,
  type Save,
} from "./domain";
import {
  Button,
  Icon,
  Sprite,
  WordArt,
  Modal,
  ParentGate,
  Pause,
} from "./components";
import { Game } from "./Game";
import { WorldAtlas } from "./WorldAtlas";
import { Family } from "./Family";
import { Speech, WordCard } from "./Speech";
import { Parents, Requirement, download } from "./Parents";
import {
  play,
  stopAudio,
  configureAudio,
  audioNotice,
  line,
  chime,
} from "./audio";
type View = "title" | "map" | "game" | "atlas" | "book" | "parents" | "family";
export default function App() {
  const save = useSyncExternalStore(subscribe, snapshot),
    lang = save.prefs.language;
  const [view, setView] = useState<View>(() =>
      location.hash.startsWith("#family=") || location.hash === "#grandparents"
        ? "family"
        : "title",
    ),
    [pause, setPause] = useState(false),
    [card, setCard] = useState<string | null>(null),
    [speech, setSpeech] = useState<string | null>(null),
    [gate, setGate] = useState(false),
    [journal, setJournal] = useState(false),
    [review, setReview] = useState(false),
    [category, setCategory] = useState("all"),
    [notice, setNotice] = useState(""),
    [badge, setBadge] = useState<string | null>(null);
  const status = storageStatus();
  useEffect(() => {
    void initialize();
    audioNotice(setNotice);
    const route = () => {
      if (
        location.hash.startsWith("#family=") ||
        location.hash === "#grandparents"
      ) {
        stopAudio();
        setView("family");
        setPause(false);
      }
    };
    window.addEventListener("hashchange", route);
    const hide = () => {
      if (document.hidden) {
        stopAudio();
        setPause(true);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("hashchange", route);
    };
  }, []);
  useEffect(() => {
    configureAudio(save.prefs.muted, save.prefs.volume);
  }, [save.prefs.muted, save.prefs.volume]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.classList.toggle("calm", save.prefs.calm);
  }, [lang, save.prefs.calm]);
  useEffect(() => {
    setNotice("");
  }, [view]);
  const go = (v: View) => {
    stopAudio();
    setPause(false);
    setCard(null);
    setSpeech(null);
    setView(v);
    if (v !== "family" && location.hash)
      history.replaceState(null, "", location.pathname);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const start = async (id: string) => {
    await mutate((s) => startRun(s, id, "cs"));
    go("game");
    setJournal(false);
  };
  const canResume =
    !!save.run &&
    save.run.phase !== "summary" &&
    activeQuests.some((q) => q.id === save.run?.questId);
  const opened = discovered(save),
    finished = completed(save),
    points = xp(save),
    level = Math.min(8, 1 + Math.floor(points / 160));
  const categoryIds: Record<string, string[]> = {
    fish: ["fish", "carp", "perch", "catfish", "pike"],
    bugs: [
      "earthworm",
      "ladybird",
      "caterpillar",
      "butterfly",
      "snail",
      "ant",
      "frog",
      "dragonfly",
    ],
    treasures: vocabulary
      .filter((w) => !w.art.startsWith("creatures/"))
      .map((w) => w.id),
  };
  const resumeText =
    lang === "cs" ? "Pokračovat ve výpravě" : "Continue your adventure";
  if (!status.ready)
    return (
      <div className="loading">
        <Sprite id="adam-poses/wave" />
        <p>
          Chystáme výpravu…
          <br />
          Getting your adventure ready…
        </p>
      </div>
    );
  if (status.error)
    return (
      <div className="page recovery paper">
        <h1>Postup se nepodařilo načíst / Save unavailable</h1>
        <p>
          Dosavadní data jsme nesmazali. Zavřete ostatní záložky hry, zkuste
          stránku obnovit nebo s dospělým obnovte poslední zálohu.
        </p>
        <pre>{status.error}</pre>
        <Button onClick={() => location.reload()}>Zkusit znovu / Retry</Button>
        <Button
          className="secondary"
          onClick={() =>
            void rawSave()
              .then((s) => download(s, "adam-save-recovery.json"))
              .catch((e) => setNotice(String(e)))
          }
        >
          Stáhnout původní data
        </Button>
        <label className="file-upload">
          Obnovit ze zálohy
          <input
            type="file"
            accept=".json"
            onChange={async (e) => {
              try {
                const f = e.target.files?.[0];
                if (f) await recoverWithBackup(JSON.parse(await f.text()));
              } catch (err) {
                setNotice(String(err));
              }
            }}
          />
        </label>
        <p role="alert">{notice}</p>
      </div>
    );
  return (
    <div className={`app view-${view} ${pause ? "is-paused" : ""}`}>
      {view !== "parents" && view !== "family" && (
        <header className={`topbar ${view === "title" ? "title-bar" : ""}`}>
          <button
            className="brand"
            onClick={() => go("title")}
            aria-label="Úvod / Home"
          >
            <Icon name="atlas" />
            <span>
              ADAMOVY
              <br />
              <strong>DRAČÍ VÝPRAVY</strong>
            </span>
          </button>
          {view !== "title" && (
            <div className="player-progress">
              <Sprite id="family/adam" />
              <span>
                {lang === "cs" ? "Průzkumník" : "Explorer"} Adam
                <b>
                  {lang === "cs" ? "Úroveň" : "Level"} {level}{" "}
                  <span>· {points} XP</span>
                </b>
              </span>
              <div className="xp-track">
                <i style={{ width: `${((points % 160) / 160) * 100}%` }} />
              </div>
            </div>
          )}
          <div className="header-actions">
            <Button
              icon={save.prefs.muted ? "soundoff" : "speaker"}
              className="round"
              aria-label={
                save.prefs.muted
                  ? "Zapnout zvuk / Sound on"
                  : "Vypnout zvuk / Mute"
              }
              onClick={() =>
                void mutate((s) => {
                  s.prefs.muted = !s.prefs.muted;
                })
              }
            />
            {view !== "title" && (
              <Button
                icon="pause"
                className="round"
                aria-label="Pauza / Pause"
                onClick={() => setPause(true)}
              />
            )}
            <Button
              icon="parent"
              className="round parent-entry"
              aria-label="Pro rodiče / Grown-ups"
              onClick={() => setGate(true)}
            />
          </div>
        </header>
      )}
      {view === "title" && (
        <main
          className="title-screen"
          style={{ backgroundImage: `url(${asset("cover")})` }}
        >
          <div className="title-shade" />
          <div className="title-copy">
            <h1 className="screen-reader-only">Adamovy dračí výpravy</h1>
            <button className="open-picture-atlas" onClick={() => go("map")}>
              <img src={asset("atlas-two-homes")} alt="" />
              <span>
                <Icon name="atlas" /> Atlas <Icon name="next" />
              </span>
            </button>
            {canResume && (
              <Button
                icon="play"
                className="resume-link"
                onClick={() => go("game")}
              >
                {lang === "cs" ? "Pokračovat" : "Continue"}
              </Button>
            )}
            <div className="language-pills">
              <button
                aria-pressed={lang === "en"}
                onClick={() =>
                  void mutate((s) => {
                    s.prefs.language = "en";
                  })
                }
              >
                English + čeština
              </button>
              <button
                aria-pressed={lang === "cs"}
                onClick={() =>
                  void mutate((s) => {
                    s.prefs.language = "cs";
                  })
                }
              >
                Česky
              </button>
            </div>
            <button className="family-entry" onClick={() => go("family")}>
              <Icon name="heart" /> Pro babi a dědu · Learn English
            </button>
          </div>
        </main>
      )}
      {view === "map" && (
        <main className="map-page">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {lang === "cs"
                  ? "TVŮJ PŘÍBĚH POKRAČUJE"
                  : "YOUR STORY CONTINUES"}
              </span>
              <h1>
                {lang === "cs" ? "Kam poletíme dnes?" : "Where to today, Adam?"}
              </h1>
            </div>
            <Button
              icon="atlas"
              className="secondary"
              onClick={() => setJournal(true)}
            >
              {lang === "cs" ? "Deník výprav" : "Adventure journal"}
            </Button>
          </div>
          <WorldAtlas
            save={save}
            onStart={(id) => void start(id)}
            paused={pause || gate || journal}
          />
          {canResume && (
            <div className="resume-strip">
              <span>
                {lang === "cs"
                  ? "Výprava na tebe počkala."
                  : "Your adventure is waiting."}
              </span>
              <Button icon="play" onClick={() => go("game")}>
                {resumeText}
              </Button>
            </div>
          )}
        </main>
      )}
      {view === "game" && save.run && (
        <Game
          save={save}
          onMap={() => go("map")}
          onFinish={() => go("title")}
          onSpeech={setSpeech}
          paused={pause || !!speech || gate}
        />
      )}
      {view === "atlas" && (
        <main className="page atlas-page">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {lang === "cs"
                  ? "KAŽDÁ KARTA MÁ SVŮJ PŘÍBĚH"
                  : "EVERY CARD HAS A STORY"}
              </span>
              <h1>
                {lang === "cs" ? "Adamův dračí atlas" : "Adam’s dragon atlas"}
              </h1>
              <p>
                {opened.size} / {vocabulary.length}{" "}
                {lang === "cs" ? "objevených karet" : "cards discovered"} ·{" "}
                {vocabulary.filter((w) => mastery(save, w.id).spoken).length}{" "}
                {lang === "cs" ? "hlasových pečetí" : "speaking seals"}
              </p>
            </div>
            <Button
              icon="replay"
              disabled={opened.size < 2}
              onClick={() => setReview(true)}
            >
              {lang === "cs" ? "Vzpomeneš si?" : "Remember this?"}
            </Button>
          </div>
          <nav className="tabs">
            {[
              ["all", lang === "cs" ? "Všechny" : "All"],
              ["fish", lang === "cs" ? "Ryby" : "Fish"],
              ["bugs", lang === "cs" ? "Malí tvorové" : "Tiny creatures"],
              [
                "treasures",
                lang === "cs" ? "Poklady a slova" : "Treasures & words",
              ],
            ].map(([id, name]) => (
              <button
                key={id}
                onClick={() => setCategory(id)}
                aria-pressed={category === id}
              >
                {name}
              </button>
            ))}
          </nav>
          <div className="atlas-grid">
            {vocabulary
              .filter(
                (w) =>
                  category === "all" || categoryIds[category].includes(w.id),
              )
              .map((w) => {
                const found = opened.has(w.id),
                  m = mastery(save, w.id);
                return (
                  <button
                    key={w.id}
                    className={`atlas-card ${!found ? "undiscovered" : ""} ${m.spoken ? "spoken" : ""}`}
                    onClick={() =>
                      found
                        ? setCard(w.id)
                        : setNotice(
                            lang === "cs"
                              ? "Tahle karta čeká v některé výpravě."
                              : "This card is waiting in an adventure.",
                          )
                    }
                    aria-label={
                      found
                        ? w.cs + " / " + w.en
                        : lang === "cs"
                          ? "Neobjevená karta"
                          : "Undiscovered card"
                    }
                  >
                    <span className="card-number">
                      {String(vocabulary.indexOf(w) + 1).padStart(2, "0")}
                    </span>
                    <div className="atlas-art">
                      <WordArt id={w.id} />
                    </div>
                    <div className="atlas-card-label">
                      <h2>{found ? w.cs : "?"}</h2>
                      <span>
                        {found
                          ? w.en
                          : lang === "cs"
                            ? "Čeká na objev"
                            : "Waiting to be found"}
                      </span>
                    </div>
                    {found && (
                      <div className="card-seals">
                        <span className={m.recognized ? "earned" : ""}>
                          <Icon name="check" />
                        </span>
                        <span className={m.spoken ? "earned" : ""}>
                          <Icon name="microphone" />
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
          </div>
        </main>
      )}
      {view === "book" && (
        <main className="page book-page">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {lang === "cs"
                  ? "MALÉ ÚSPĚCHY, VELKÁ RADOST"
                  : "LITTLE ACHIEVEMENTS, BIG SMILES"}
              </span>
              <h1>{lang === "cs" ? "Rodinná kniha" : "The family book"}</h1>
              <p>
                {lang === "cs"
                  ? "Každý pokrok se počítá. Výpravy na tebe vždy počkají."
                  : "Every little step counts. Your adventures will always wait."}
              </p>
            </div>
            <Sprite id="family/klarka" className="book-klarka" />
          </div>
          <div className="badge-grid">
            {achievements
              .filter(
                (a) =>
                  !a.conditions.questId ||
                  activeQuests.some((q) => q.id === a.conditions.questId) ||
                  save.rewards.some((r) => r.id === a.id) ||
                  progress(save, a.conditions).earned,
              )
              .map((a) => {
                const earned = progress(save, a.conditions).earned,
                  r = save.rewards.find((r) => r.id === a.id);
                return (
                  <button
                    key={a.id}
                    className={`badge-card ${earned ? "earned" : ""}`}
                    onClick={() => setBadge(a.id)}
                  >
                    <Sprite id={a.badge} />
                    <h2>{a.title}</h2>
                    <span>
                      {earned
                        ? lang === "cs"
                          ? "Odznak získán"
                          : "Badge earned"
                        : lang === "cs"
                          ? "Společně to zvládneme"
                          : "One little step at a time"}
                    </span>
                    {r && (
                      <p>
                        <Icon name="gift" />
                        {r.label}
                        {r.state === "redeemed" ? " ✓" : ""}
                      </p>
                    )}
                  </button>
                );
              })}
          </div>
          <Button icon="parent" onClick={() => setGate(true)}>
            {lang === "cs" ? "Ukázat rodiči" : "Show a grown-up"}
          </Button>
        </main>
      )}
      {view === "parents" && <Parents save={save} onClose={() => go("map")} />}
      {view === "family" && <Family onClose={() => go("title")} />}
      {view !== "title" && view !== "parents" && view !== "family" && (
        <nav
          className="bottom-nav"
          aria-label="Hlavní navigace / Main navigation"
        >
          {[
            ["map", "map", lang === "cs" ? "Mapa" : "Map"],
            ["atlas", "atlas", lang === "cs" ? "Můj atlas" : "My atlas"],
            ["book", "gift", lang === "cs" ? "Odznaky" : "Badges"],
          ].map(([v, icon, label]) => (
            <button
              key={v}
              aria-current={view === v ? "page" : undefined}
              onClick={() => {
                go(v as View);
                void play(
                  v === "map"
                    ? `questui.choose-quest.${lang}`
                    : `game.${v}.${lang}`,
                );
              }}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {v === "atlas" && <b>{opened.size}</b>}
            </button>
          ))}
        </nav>
      )}
      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button aria-label="Zavřít / Dismiss" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
      {pause && view !== "title" && view !== "parents" && view !== "family" && (
        <Pause
          lang={lang}
          onClose={() => setPause(false)}
          onMap={() => go("map")}
          onFinish={() => go("title")}
        />
      )}
      {gate && (
        <ParentGate
          onClose={() => setGate(false)}
          onSuccess={() => {
            setGate(false);
            go("parents");
          }}
        />
      )}
      {card && !speech && (
        <WordCard
          id={card}
          save={save}
          onClose={() => setCard(null)}
          onSpeech={() => setSpeech(card)}
        />
      )}
      {speech && (
        <Speech
          key={speech}
          id={speech}
          save={save}
          onClose={() => setSpeech(null)}
        />
      )}
      {journal && (
        <Modal
          title={lang === "cs" ? "Deník výprav" : "Quest journal"}
          onClose={() => setJournal(false)}
          className="journal"
        >
          <div className="journal-list">
            {activeQuests.map((q, i) => (
              <button
                key={q.id}
                disabled={!unlocked(save, q.id)}
                onClick={() => void start(q.id)}
              >
                <img src={asset(q.background)} alt="" />
                <span>
                  <small>
                    {q.archived
                      ? lang === "cs"
                        ? "Původní kapitola · "
                        : "Original chapter · "
                      : ""}
                    {i + 1}.{" "}
                    {q.region === "pribram"
                      ? "Příbram"
                      : q.region === "travel"
                        ? "Iowa → Příbram"
                        : "Iowa"}
                  </small>
                  <strong>{title(q, lang)}</strong>
                  <small>
                    {finished.has(q.id)
                      ? lang === "cs"
                        ? "Hrát znovu"
                        : "Play again"
                      : unlocked(save, q.id)
                        ? lang === "cs"
                          ? "Připraveno na výpravu"
                          : "Ready to explore"
                        : lang === "cs"
                          ? "Nejdřív dokonči předchozí výpravu"
                          : "Finish the previous adventure first"}
                  </small>
                </span>
                <Icon
                  name={
                    finished.has(q.id)
                      ? "check"
                      : unlocked(save, q.id)
                        ? "play"
                        : "lock"
                  }
                />
              </button>
            ))}
          </div>
        </Modal>
      )}
      {badge && (
        <Modal
          title={achievements.find((a) => a.id === badge)!.title}
          onClose={() => setBadge(null)}
        >
          <Sprite
            id={achievements.find((a) => a.id === badge)!.badge}
            className="badge-detail"
          />
          <Requirement
            save={save}
            conditions={achievements.find((a) => a.id === badge)!.conditions}
          />
          {save.rewards.find((r) => r.id === badge) && (
            <p className="reward-label">
              {save.rewards.find((r) => r.id === badge)!.label}
            </p>
          )}
          <Button
            icon="parent"
            onClick={() => {
              setBadge(null);
              setGate(true);
            }}
          >
            {lang === "cs" ? "Ukázat rodiči" : "Show a grown-up"}
          </Button>
        </Modal>
      )}
      {review && (
        <Review
          save={save}
          onClose={() => setReview(false)}
          onSpeech={setSpeech}
        />
      )}
    </div>
  );
}
function Review({
  save,
  onClose,
  onSpeech,
}: {
  save: Save;
  onClose: () => void;
  onSpeech: (id: string) => void;
}) {
  const [lang, setLang] = useState<Lang>("cs"),
    [index, setIndex] = useState(0),
    [assisted, setAssisted] = useState(false),
    [correct, setCorrect] = useState(false),
    [busy, setBusy] = useState(false);
  const ui = save.prefs.language;
  const [ids] = useState(() =>
    [...discovered(save)]
      .sort(
        (a, b) =>
          Number(mastery(save, a).independent) -
          Number(mastery(save, b).independent),
      )
      .slice(0, 5),
  );
  const id = ids[index % ids.length];
  const [round] = useState(uid);
  const choices = [
    ...new Set([
      id,
      ...[...discovered(save)]
        .filter((v) => v !== id)
        .slice(index % 2, (index % 2) + 2),
    ]),
  ].sort((a, b) => {
    const hash = (v: string) =>
      [...v].reduce((n, c) => n + c.charCodeAt(0), index * 19);
    return ((hash(a) * 31) % 97) - ((hash(b) * 31) % 97);
  });
  useEffect(() => {
    void play([`game.review.${ui}`, `word.${id}.${lang}`]);
    return () => stopAudio();
  }, [id, lang]);
  return (
    <Modal
      title={ui === "cs" ? "Vzpomeneš si?" : "Remember this?"}
      onClose={onClose}
    >
      <div className="segmented">
        <button
          aria-pressed={lang === "cs"}
          onClick={() => {
            setLang("cs");
            setCorrect(false);
            setAssisted(false);
          }}
        >
          Česky
        </button>
        <button
          aria-pressed={lang === "en"}
          onClick={() => {
            setLang("en");
            setCorrect(false);
            setAssisted(false);
          }}
        >
          English
        </button>
      </div>
      <p>{line("review", ui)}</p>
      <Button
        icon="speaker"
        className="secondary"
        onClick={() => void play(`word.${id}.${lang}`)}
      >
        {ui === "cs" ? "Poslechnout" : "Listen"}
      </Button>
      {!correct ? (
        <div className="choices review-choices">
          {choices.map((choice) => (
            <button
              className="choice"
              key={choice}
              aria-label={words[choice].cs}
              disabled={busy}
              onClick={async () => {
                if (choice !== id) {
                  setAssisted(true);
                  void play(`word.${id}.${lang}`);
                  return;
                }
                setBusy(true);
                await mutate((s) =>
                  addEvidence(s, {
                    id: `review:${round}:${index}:${lang}`,
                    timestamp: Date.now(),
                    sessionId: s.session.id,
                    questId: "atlas",
                    conceptId: id,
                    targetLanguage: lang,
                    taskVariant: `review:${round}:${index}`,
                    evidenceType: "recognized",
                    assistance: assisted,
                    assessmentSource: "interaction",
                  }),
                );
                setBusy(false);
                setCorrect(true);
                chime();
              }}
            >
              <WordArt id={choice} />
              {assisted && <span>{words[choice][lang]}</span>}
            </button>
          ))}
        </div>
      ) : (
        <div className="review-success">
          <WordArt id={id} />
          <h3>{words[id][lang]}</h3>
          <Button
            icon="microphone"
            className="secondary"
            onClick={() => onSpeech(id)}
          >
            {ui === "cs" ? "Zkusím to říct" : "Try saying it"}
          </Button>
          <Button
            icon="next"
            onClick={() => {
              if (index === ids.length - 1) onClose();
              else {
                setIndex(index + 1);
                setCorrect(false);
                setAssisted(false);
              }
            }}
          >
            {index === ids.length - 1
              ? ui === "cs"
                ? "Hotovo"
                : "All done"
              : ui === "cs"
                ? "Další slovo"
                : "Next word"}
          </Button>
        </div>
      )}
      <Button
        className="quiet"
        icon="help"
        onClick={() => {
          setAssisted(true);
          void play(`meaning.${id}.${ui}`);
        }}
      >
        {ui === "cs" ? "Nápověda" : "A little help"}
      </Button>
    </Modal>
  );
}
