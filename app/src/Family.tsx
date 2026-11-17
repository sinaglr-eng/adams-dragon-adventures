import { useEffect, useState } from "react";
import { activeQuests, words } from "./data";
import type { Save } from "./domain";
import { optionsFor } from "./domain";
import { Button, Sprite, WordArt, Icon } from "./components";
import { play, stopAudio, chime } from "./audio";
import { download } from "./Parents";
import {
  POSTCARD_KEY,
  makePostcard,
  encodePostcard,
  decodePostcard,
  validatePostcard,
  savePostcard,
  stateLabel,
  type Postcard,
} from "./family-data";

export function FamilyShare({ save }: { save: Save }) {
  const [link, setLink] = useState(""),
    [message, setMessage] = useState("");
  const [preview, setPreview] = useState<Postcard | null>(null);
  const create = () => {
    const p = makePostcard(save);
    setPreview(p);
    setLink(
      `${location.origin}${import.meta.env.BASE_URL}#family=${encodePostcard(p)}`,
    );
    setMessage(
      "Pohlednice je připravená. Zkopírujte odkaz a pošlete ho babi a dědovi.",
    );
  };
  return (
    <section className="family-share paper">
      <h2>Pohlednice pro babi a dědu</h2>
      <p>
        Pošlete jim přehled questů a slov, o kterých si s Adamem mohou povídat.
        Odkaz obsahuje stav v okamžiku vytvoření; sám se neaktualizuje.
      </p>
      <p className="quiet">
        Kdokoli s odkazem uvidí tento přehled. Neobsahuje nahrávky, odměny ani
        úplnou zálohu hry. Obsah pohlednice je v části odkazu za #; aplikace ho
        neodesílá na server.
      </p>
      <Button icon="heart" onClick={create}>
        {link ? "Vytvořit aktuální pohlednici" : "Připravit pohlednici"}
      </Button>
      {preview && (
        <>
          <div className="postcard-preview">
            {preview.quests.map((q) => (
              <p key={q.id}>
                <strong>
                  {activeQuests.find((x) => x.id === q.id)!.title}
                </strong>{" "}
                ·{" "}
                {q.done
                  ? "dokončeno"
                  : q.step
                    ? `krok ${q.step}`
                    : "zatím nezačal"}{" "}
                · {q.words.length} zobrazených pojmů
              </p>
            ))}
          </div>
          <label>
            Odkaz pro rodinu
            <textarea
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
            />
          </label>
          <div className="button-row">
            <Button
              icon="heart"
              onClick={() => {
                if (!navigator.clipboard) {
                  setMessage("Označte a zkopírujte odkaz z pole.");
                  return;
                }
                void navigator.clipboard
                  .writeText(link)
                  .then(() => setMessage("Odkaz zkopírován."))
                  .catch(() =>
                    setMessage("Označte a zkopírujte odkaz z pole."),
                  );
              }}
            >
              Zkopírovat odkaz
            </Button>
            <Button
              className="secondary"
              onClick={() => download(preview, "adam-family-postcard.json")}
            >
              Stáhnout pohlednici
            </Button>
          </div>
        </>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
type AdultLearning = Record<string, string[]>;
function readLearning(): AdultLearning {
  try {
    const p = JSON.parse(
      localStorage.getItem("dragon-adult-learning-v1") ?? "{}",
    );
    return Object.fromEntries(
      ["babi", "deda"].map((id) => [
        id,
        Array.isArray(p[id])
          ? p[id].filter((w: unknown) => typeof w === "string" && words[w])
          : [],
      ]),
    );
  } catch {
    return {};
  }
}
export function Family({ onClose }: { onClose: () => void }) {
  const [postcard, setPostcard] = useState<Postcard | null>(null),
    [message, setMessage] = useState("");
  const [incoming, setIncoming] = useState(""),
    [person, setPerson] = useState("babi");
  const [topic, setTopic] = useState(activeQuests[0].id),
    [tab, setTab] = useState<"progress" | "learn" | "call">("progress");
  const [wordIndex, setWordIndex] = useState(0),
    [stage, setStage] = useState<"learn" | "quiz" | "correct">("learn");
  const [assisted, setAssisted] = useState(false),
    [learning, setLearning] = useState(readLearning);
  const quest = activeQuests.find((q) => q.id === topic)!;
  const word = words[quest.concepts[wordIndex % quest.concepts.length]];
  const progress = postcard?.quests.find((q) => q.id === topic);
  useEffect(() => {
    const open = () => {
      try {
        const fromUrl = location.hash.startsWith("#family=")
          ? location.hash.slice(8)
          : null;
        if (fromUrl) {
          setPostcard(savePostcard(decodePostcard(fromUrl)));
          history.replaceState(null, "", `${location.pathname}#grandparents`);
        } else {
          const saved = localStorage.getItem(POSTCARD_KEY);
          if (saved) setPostcard(validatePostcard(JSON.parse(saved)));
        }
      } catch (e) {
        setMessage(String(e));
        try {
          const saved = localStorage.getItem(POSTCARD_KEY);
          if (saved) setPostcard(validatePostcard(JSON.parse(saved)));
        } catch {
          /* Preserve malformed data until explicitly replaced by a valid postcard. */
        }
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => {
      stopAudio();
      window.removeEventListener("hashchange", open);
    };
  }, []);
  const lesson = () =>
    void play(
      word.id === "hello"
        ? ["questui.greeting.cs", "word.hello.en"]
        : [
            `word.${word.id}.cs`,
            `meaning.${word.id}.cs`,
            "questui.bridge.cs",
            `word.${word.id}.en`,
          ],
    );
  useEffect(() => {
    if (tab === "learn") {
      if (stage === "learn") lesson();
      else if (stage === "quiz")
        void play(["game.find.cs", `word.${word.id}.en`]);
    }
    return () => stopAudio();
  }, [topic, tab, wordIndex, stage]);
  const changeTopic = (id: string) => {
    stopAudio();
    setTopic(id);
    setWordIndex(0);
    setStage("learn");
    setAssisted(false);
  };
  const importCard = (p: Postcard) => {
    setPostcard(savePostcard(p));
    setMessage("Pohlednice načtena. Adamův postup ve hře se tím nemění.");
    setIncoming("");
  };
  const answer = (id: string) => {
    if (id !== word.id) {
      setAssisted(true);
      setMessage("Zkusíme to spolu. Poslechněte si znovu slovo.");
      void play([`word.${word.id}.en`, `word.${word.id}.cs`]);
      return;
    }
    if (!assisted) {
      const next = {
        ...learning,
        [person]: [...new Set([...(learning[person] ?? []), word.id])],
      };
      try {
        localStorage.setItem("dragon-adult-learning-v1", JSON.stringify(next));
        setLearning(next);
      } catch {
        setMessage("Procvičení se nepodařilo uložit do tohoto zařízení.");
      }
    }
    chime();
    setStage("correct");
  };
  return (
    <main className="family-page page" lang="cs">
      <div className="family-heading">
        <div>
          <span className="eyebrow">IOWA ↔ PŘÍBRAM · UČÍME SE NAVZÁJEM</span>
          <h1>Babi a děda na výpravě</h1>
          <p>
            Adam objevuje češtinu. Vy objevujete angličtinu. U dalšího hovoru
            máte společný příběh.
          </p>
        </div>
        <div className="grandparent-portraits">
          <Sprite id="family/babi" />
          <Sprite id="family/deda" />
        </div>
      </div>
      <div className="button-row">
        <Button icon="home" className="secondary" onClick={onClose}>
          Zpět k Adamově hře
        </Button>
        <Button
          icon="speaker"
          className="secondary"
          onClick={() => void play("questui.family-welcome.cs")}
        >
          Jak to funguje
        </Button>
      </div>
      <div className="family-tabs" role="tablist" aria-label="Rodinná kniha">
        {(
          [
            ["progress", "Adamův příběh"],
            ["learn", "Učíme se anglicky"],
            ["call", "Připravit si volání"],
          ] as const
        ).map(([id, label]) => (
          <button
            role="tab"
            aria-selected={tab === id}
            key={id}
            onClick={() => {
              setTab(id);
              setStage("learn");
              setMessage("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="family-topic">
        Téma společné výpravy
        <select value={topic} onChange={(e) => changeTopic(e.target.value)}>
          {activeQuests.map((q) => (
            <option value={q.id} key={q.id}>
              {q.title}
            </option>
          ))}
        </select>
      </label>
      {tab === "progress" && (
        <>
          <section className="paper family-panel">
            <h2>Adamova pohlednice</h2>
            {postcard ? (
              <>
                <p>
                  Stav k {new Date(postcard.date).toLocaleString("cs-CZ")}. Toto
                  je poslaný přehled, nikoli živé sledování.
                </p>
                <div className="family-quest-progress">
                  {activeQuests.map((q) => {
                    const p = postcard.quests.find((x) => x.id === q.id);
                    return (
                      <button
                        key={q.id}
                        onClick={() => changeTopic(q.id)}
                        aria-pressed={topic === q.id}
                      >
                        <Sprite id={q.background} />
                        <strong>{q.title}</strong>
                        <span>
                          {p?.done
                            ? "Dokončeno"
                            : p?.step
                              ? `Probíhá · krok ${Math.min(q.tasks.length, p.step)} / ${q.tasks.length}`
                              : p?.words.length
                                ? "První objevy"
                                : "Zatím bez zprávy"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <p>
                Zatím nemáte Adamovu pohlednici. Rodič ji připraví v části Pro
                rodiče a pošle vám odkaz. Angličtinu si můžete procvičovat už
                teď.
              </p>
            )}
            <h3>{quest.title}</h3>
            <div className="family-word-grid">
              {progress?.words.map((w) => (
                <div key={w.id}>
                  <WordArt id={w.id} />
                  <strong>
                    {words[w.id].cs} · {words[w.id].en}
                  </strong>
                  <small>{stateLabel[w.state]}</small>
                </div>
              ))}
            </div>
            {!progress?.words.length && (
              <p>V této výpravě zatím nemáme zaznamenané pojmy.</p>
            )}
          </section>
          <details className="paper family-panel">
            <summary>Otevřít další pohlednici</summary>
            <label>
              Vložit odkaz
              <textarea
                value={incoming}
                onChange={(e) => setIncoming(e.target.value)}
                maxLength={19000}
              />
            </label>
            <Button
              onClick={() => {
                try {
                  importCard(decodePostcard(incoming.trim()));
                } catch (e) {
                  setMessage(String(e));
                }
              }}
            >
              Otevřít odkaz
            </Button>
            <label className="file-upload">
              Nebo načíst soubor
              <input
                type="file"
                accept=".json,application/json"
                onChange={async (e) => {
                  try {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (f.size > 20000)
                        throw Error("Soubor je příliš velký.");
                      importCard(validatePostcard(JSON.parse(await f.text())));
                    }
                  } catch (err) {
                    setMessage(String(err));
                  }
                  e.target.value = "";
                }}
              />
            </label>
          </details>
        </>
      )}
      {tab === "learn" && (
        <section className="paper family-panel adult-lesson">
          <div className="button-row">
            {["babi", "deda"].map((id) => (
              <button
                className="profile-pill"
                aria-pressed={person === id}
                key={id}
                onClick={() => {
                  setPerson(id);
                  setStage("learn");
                  setAssisted(false);
                }}
              >
                <Sprite id={`family/${id}`} />
                {id === "babi" ? "Babi" : "Děda"}
              </button>
            ))}
          </div>
          <p>
            V tomto zařízení: {learning[person]?.length ?? 0} anglických slov
            poznaných bez nápovědy. Tento přehled je oddělený od Adamova.
          </p>
          {stage === "learn" ? (
            <>
              <WordArt id={word.id} className="adult-word" />
              <h2>
                {word.cs} → {word.en}
              </h2>
              <p>{word.meaning.cs}</p>
              <div className="button-row">
                <Button icon="speaker" onClick={lesson}>
                  Vysvětlit a poslechnout
                </Button>
                <Button
                  icon="speaker"
                  className="secondary"
                  onClick={() => void play(`phrase.${word.id}.en`)}
                >
                  Anglická věta
                </Button>
              </div>
              <p>
                {word.phrase.en}
                <br />
                {word.phrase.cs}
              </p>
              <Button
                icon="next"
                onClick={() => {
                  setStage("quiz");
                  setAssisted(false);
                }}
              >
                Zkusit poznat podle poslechu
              </Button>
            </>
          ) : stage === "quiz" ? (
            <>
              <h2>Který obrázek patří k anglickému slovu?</h2>
              <Button
                icon="speaker"
                onClick={() => void play(`word.${word.id}.en`)}
              >
                Přehrát anglicky
              </Button>
              <div className="choices">
                {optionsFor(
                  { kind: "find", concept: word.id },
                  wordIndex * 31 + person.length,
                ).map((id) => (
                  <button
                    key={id}
                    className="choice"
                    aria-label={words[id].cs}
                    onClick={() => answer(id)}
                  >
                    <WordArt id={id} />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <Icon name="check" />
              <WordArt id={word.id} className="adult-word" />
              <h2>
                {word.en} — {word.cs}
              </h2>
              <p>
                {assisted
                  ? "Poznáno s pomocí. Příště to zkuste znovu."
                  : "Poznáno samostatně. Zkuste slovo říct nahlas."}
              </p>
              <Button
                icon="next"
                onClick={() => {
                  setWordIndex(wordIndex + 1);
                  setStage("learn");
                  setAssisted(false);
                  setMessage("");
                }}
              >
                Další slovo
              </Button>
            </>
          )}
        </section>
      )}
      {tab === "call" && (
        <section className="paper family-panel">
          <h2>O čem si zavoláme?</h2>
          <p>
            Vybrané téma: <strong>{quest.title}</strong>.{" "}
            {progress?.done
              ? "Adam tuto výpravu dokončil."
              : progress?.words.length
                ? "Adam už v tomto tématu něco objevil."
                : "Zatím nevíme, zda Adam tuto výpravu hrál. Otázky berte jako pozvánku, ne zkoušení."}
          </p>
          {quest.callPrompts?.map((p, i) => (
            <article className="conversation-prompt" key={p.cs}>
              <span>{i + 1}</span>
              <div>
                <h3>{p.cs}</h3>
                <p>{p.en}</p>
                <div className="button-row">
                  <Button
                    icon="speaker"
                    className="secondary"
                    onClick={() => void play(`call.${quest.id}.${i}.cs`)}
                  >
                    Česky
                  </Button>
                  <Button
                    icon="speaker"
                    onClick={() => void play(`call.${quest.id}.${i}.en`)}
                  >
                    Anglicky
                  </Button>
                </div>
              </div>
            </article>
          ))}
          <h3>Obrázkové nápovědy k hovoru</h3>
          <div className="call-pictures">
            {(progress?.words.length
              ? progress.words.map((w) => w.id)
              : quest.concepts
            )
              .slice(0, 6)
              .map((id) => (
                <button
                  key={id}
                  onClick={() => void play([`word.${id}.cs`, `word.${id}.en`])}
                >
                  <WordArt id={id} />
                  <strong>
                    {words[id].cs} / {words[id].en}
                  </strong>
                  <Icon name="speaker" />
                </button>
              ))}
          </div>
          <p>
            Nechte Adama ukazovat a vyprávět. Můžete si role prohodit: on vám
            pomůže česky a vy zkusíte angličtinu. Hovor probíhá ve vaší obvyklé
            aplikaci.
          </p>
        </section>
      )}
      {message && (
        <p className="family-message" role="status">
          {message}
        </p>
      )}
    </main>
  );
}
