import { useEffect, useRef, useState } from "react";
import { words, type Lang } from "./data";
import { addEvidence, eventFor, mastery, type Save } from "./domain";
import { mutate } from "./store";
import {
  Button,
  Modal,
  ParentGate,
  WordArt,
  Stars,
  AudioButton,
} from "./components";
import { play, stopAudio, chime } from "./audio";
import { PracticeRecorder, type PracticeState } from "./microphone";
import { checkRecording } from "./speech-check";
export function Speech({
  id,
  save,
  onClose,
}: {
  id: string;
  save: Save;
  onClose: () => void;
}) {
  const w = words[id],
    ui = save.prefs.language;
  const [lang, setLang] = useState<Lang>("cs");
  const [phrase, setPhrase] = useState(false);
  const [state, setState] = useState<PracticeState>("idle");
  const [url, setUrl] = useState("");
  const [gate, setGate] = useState(false);
  const [adult, setAdult] = useState(false);
  const [model, setModel] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<
    "idle" | "checking" | "retry" | "unavailable" | "acoustic" | "parent"
  >("idle");
  const [enableMic, setEnableMic] = useState(false);
  const [busy, setBusy] = useState(false);
  const revision = useRef(0);
  const recorder = useRef<PracticeRecorder | null>(null);
  useEffect(() => {
    recorder.current = new PracticeRecorder((s, u) => {
      setState(s);
      if (u) setUrl(u);
    });
    const hide = () => {
      if (document.hidden) {
        revision.current++;
        recorder.current?.dispose();
        setState("idle");
        setResult("idle");
        setUrl("");
        stopAudio();
      }
    };
    document.addEventListener("visibilitychange", hide);
    if (save.prefs.microphone) void play(`coach.start.${ui}`);
    return () => {
      revision.current++;
      document.removeEventListener("visibilitychange", hide);
      recorder.current?.dispose();
      stopAudio();
    };
  }, []);
  const target = phrase ? w.phrase[lang] : w[lang];
  const reset = () => {
    revision.current++;
    recorder.current?.dispose();
    stopAudio();
    setState("idle");
    setUrl("");
    setResult("idle");
    setConfirmed(false);
    setAdult(false);
  };
  const record = () => {
    if (busy || !save.prefs.microphone) return;
    reset();
    void recorder.current?.start();
  };
  useEffect(() => {
    if (state !== "ready" || !url) return;
    const current = revision.current;
    let active = true;
    const valid = () => active && revision.current === current;
    setResult("checking");
    void (async () => {
      try {
        const matched = await checkRecording(url, target, lang);
        if (!valid()) return;
        await mutate((s) => {
          if (!valid()) return;
          addEvidence(
            s,
            eventFor(s, "speech_attempted", id, true, lang, target),
          );
          if (matched)
            addEvidence(s, {
              ...eventFor(s, "spoken_verified", id, true, lang, target),
              assessmentSource: "acoustic",
            });
        });
        if (!valid()) return;
        if (matched) {
          setConfirmed(true);
          setResult("acoustic");
          chime();
          void play(`coach.success.${ui}`);
        } else {
          setResult("retry");
          const example =
            lang === "cs" && !phrase && w.syllablesCs
              ? [`model.${id}.cs`, "lesson.repeat.en", `echo.${id}.cs`]
              : [
                  "lesson.repeat.en",
                  `${phrase ? "phrase" : "word"}.${id}.${lang}`,
                ];
          void play([`coach.retry.${ui}`, ...example]);
        }
      } catch {
        if (valid()) setResult("unavailable");
      }
    })();
    return () => {
      active = false;
    };
  }, [state, url, target, lang, id, phrase, ui, w]);
  const verify = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await mutate((s) =>
        addEvidence(s, eventFor(s, "spoken_verified", id, model, lang, target)),
      );
      setConfirmed(true);
      setResult("parent");
      setAdult(false);
      chime();
      void play(`coach.success.${ui}`);
    } finally {
      setBusy(false);
    }
  };
  const listening =
    state === "requesting" || state === "recording" || result === "checking";
  return (
    <>
      <Modal
        title={
          ui === "cs" ? "Probuď kartu hlasem" : "Wake your card with words"
        }
        onClose={onClose}
        className="speech-modal"
      >
        <div className="speech-content">
          <WordArt id={id} />
          <div>
            <div className="segmented">
              <button
                aria-pressed={lang === "cs"}
                onClick={() => {
                  reset();
                  setLang("cs");
                  setConfirmed(false);
                }}
              >
                Česky
              </button>
              <button
                aria-pressed={lang === "en"}
                onClick={() => {
                  reset();
                  setLang("en");
                  setConfirmed(false);
                }}
              >
                English
              </button>
            </div>
            <h3 lang={lang}>{target}</h3>
            {!listening && (
              <AudioButton id={`${phrase ? "phrase" : "word"}.${id}.${lang}`}>
                {ui === "cs" ? "Poslechni si vzor" : "Listen to the example"}
              </AudioButton>
            )}
            <label className="check-row">
              <input
                type="checkbox"
                checked={phrase}
                onChange={(e) => {
                  reset();
                  setPhrase(e.target.checked);
                }}
              />
              {ui === "cs" ? "Zkus celou větu" : "Try the whole sentence"}
            </label>
          </div>
        </div>
        {confirmed ? (
          <div className="success-message">
            <Stars />
            <strong>
              {ui === "cs"
                ? "Hlasová pečeť je tvoje!"
                : "Your speaking seal is here!"}
            </strong>
            <p>
              {result === "parent"
                ? ui === "cs"
                  ? "Potvrdil dospělý."
                  : "Verified by a grown-up."
                : ui === "cs"
                  ? "Slovo rozpoznáno."
                  : "Word matched."}
            </p>
          </div>
        ) : (
          <>
            <div className="speech-actions">
              {!listening && (
                <Button
                  icon="microphone"
                  onClick={() => {
                    if (save.prefs.microphone) record();
                    else {
                      reset();
                      setEnableMic(true);
                      setGate(true);
                    }
                  }}
                >
                  {result === "retry"
                    ? ui === "cs"
                      ? "Zkusit znovu"
                      : "Try again"
                    : ui === "cs"
                      ? "Říct nahlas"
                      : "Say it"}
                </Button>
              )}
              {state === "recording" && (
                <Button
                  icon="pause"
                  className="recording"
                  onClick={() => recorder.current?.stop()}
                >
                  {ui === "cs" ? "Hotovo" : "Done"}{" "}
                  <span className="sound-wave" />
                </Button>
              )}
              {!listening && (
                <Button
                  icon="parent"
                  className="secondary"
                  onClick={() => {
                    reset();
                    setEnableMic(false);
                    setGate(true);
                  }}
                >
                  {ui === "cs" ? "S dospělým" : "With a grown-up"}
                </Button>
              )}
            </div>
            <p role="status">
              {state === "requesting"
                ? ui === "cs"
                  ? "Povol mikrofon."
                  : "Allow the microphone."
                : state === "recording"
                  ? ui === "cs"
                    ? "Poslouchám…"
                    : "Listening…"
                  : result === "checking"
                    ? ui === "cs"
                      ? "Poslouchám tvůj pokus…"
                      : "Checking your try…"
                    : result === "retry"
                      ? ui === "cs"
                        ? "Poslechni si vzor a zkus to ještě jednou."
                        : "Listen to the example and try once more."
                      : ["permission_denied", "unsupported", "error"].includes(
                            state,
                          ) || result === "unavailable"
                        ? ui === "cs"
                          ? "Mikrofon nebo zvukový vzor není dostupný. Můžeš zkusit znovu nebo poprosit dospělého."
                          : "Microphone or example unavailable. Try again or ask a grown-up."
                        : ""}
            </p>
            {url && result === "retry" && (
              <audio controls src={url} onPlay={stopAudio} />
            )}
          </>
        )}
        {adult && (
          <section className="adult-confirm">
            <h3>Potvrzení dospělého / Adult verification</h3>
            <p>
              Slyšel/a jsem, jak Adam srozumitelně řekl{" "}
              <strong>„{target}“</strong> (
              {lang === "cs" ? "čeština" : "English"}). Potvrďte jen skutečně
              vyslovený výraz.
            </p>
            <label className="check-row">
              <input
                type="checkbox"
                checked={model}
                onChange={(e) => setModel(e.target.checked)}
              />
              S opakováním vzoru / Repeated after a model
            </label>
            <Button icon="check" disabled={busy} onClick={() => void verify()}>
              Ano, slyšel/a jsem / Yes, I heard it
            </Button>
            <Button className="quiet" onClick={() => setAdult(false)}>
              Ještě procvičíme / Practice more
            </Button>
          </section>
        )}
        <Button icon="next" className="quiet" onClick={onClose}>
          {ui === "cs" ? "Pokračovat ve výpravě" : "Keep exploring"}
        </Button>
      </Modal>
      {gate && (
        <ParentGate
          purpose={
            enableMic
              ? "Povolit mikrofon pro porovnání se vzorem přímo v zařízení? / Enable the microphone for on-device word checks?"
              : undefined
          }
          onClose={() => setGate(false)}
          onSuccess={() => {
            setGate(false);
            if (enableMic) {
              void mutate((s) => {
                s.prefs.microphone = true;
              }).then(() => play(`coach.start.${ui}`));
            } else setAdult(true);
          }}
        />
      )}
    </>
  );
}
export function WordCard({
  id,
  save,
  onClose,
  onSpeech,
}: {
  id: string;
  save: Save;
  onClose: () => void;
  onSpeech: () => void;
}) {
  const w = words[id],
    lang = save.prefs.language,
    m = mastery(save, id);
  return (
    <Modal
      title={lang === "cs" ? "Karta z tvého atlasu" : "A card from your atlas"}
      onClose={onClose}
      className="word-modal"
    >
      <div
        className={`collectible ${m.spoken ? "spoken" : m.recognized ? "understood" : "discovered"}`}
      >
        <WordArt id={id} />
        <h3>{w.cs}</h3>
        <p>{w.en}</p>
        <span className="card-status">
          {m.spoken
            ? "✦ " + (lang === "cs" ? "Umím říct" : "I can say it")
            : m.recognized
              ? "✓ " + (lang === "cs" ? "Poznávám" : "I recognize it")
              : lang === "cs"
                ? "Objeveno"
                : "Discovered"}
        </span>
      </div>
      <div className="word-description">
        <div className="button-row">
          <AudioButton id={`word.${id}.cs`}>{w.cs}</AudioButton>
          <AudioButton id={`word.${id}.en`}>{w.en}</AudioButton>
        </div>
        <p>{w.meaning[lang]}</p>
        <AudioButton id={`meaning.${id}.${lang}`}>
          {lang === "cs" ? "Co to znamená?" : "What does it mean?"}
        </AudioButton>
        <p className="phrase">
          {w.phrase.cs}
          <br />
          <span>{w.phrase.en}</span>
        </p>
        <div className="button-row">
          <AudioButton id={`phrase.${id}.cs`}>Česká věta</AudioButton>
          <AudioButton id={`phrase.${id}.en`}>English sentence</AudioButton>
        </div>
        <Button icon="microphone" onClick={onSpeech}>
          {lang === "cs" ? "Probuď hlasem" : "Try saying it"}
        </Button>
      </div>
    </Modal>
  );
}
