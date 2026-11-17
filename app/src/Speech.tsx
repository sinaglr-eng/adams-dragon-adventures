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
import { play, stopAudio, chime, line } from "./audio";
import { PracticeRecorder, type PracticeState } from "./microphone";
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
  const [tries, setTries] = useState(0);
  const [busy, setBusy] = useState(false);
  const recorder = useRef<PracticeRecorder | null>(null);
  useEffect(() => {
    recorder.current = new PracticeRecorder((s, u) => {
      setState(s);
      if (u) setUrl(u);
    });
    const hide = () => {
      if (document.hidden) {
        recorder.current?.dispose();
        setState("idle");
        setUrl("");
        stopAudio();
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      recorder.current?.dispose();
      stopAudio();
    };
  }, []);
  const target = phrase ? w.phrase[lang] : w[lang];
  const attempt = async () => {
    await mutate((s) =>
      addEvidence(s, eventFor(s, "speech_attempted", id, true, lang, target)),
    );
  };
  const record = async () => {
    if (busy) return;
    stopAudio();
    setUrl("");
    setTries((n) => n + 1);
    await attempt();
    void recorder.current?.start();
  };
  const verify = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await mutate((s) =>
        addEvidence(s, eventFor(s, "spoken_verified", id, model, lang, target)),
      );
      setConfirmed(true);
      setAdult(false);
      chime();
      void play(`ui.verified.${ui}`);
    } finally {
      setBusy(false);
    }
  };
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
                  stopAudio();
                  setLang("cs");
                  setConfirmed(false);
                }}
              >
                Česky
              </button>
              <button
                aria-pressed={lang === "en"}
                onClick={() => {
                  stopAudio();
                  setLang("en");
                  setConfirmed(false);
                }}
              >
                English
              </button>
            </div>
            <h3 lang={lang}>{target}</h3>
            <AudioButton id={`${phrase ? "phrase" : "word"}.${id}.${lang}`}>
              {ui === "cs" ? "Poslechni si vzor" : "Listen to the example"}
            </AudioButton>
            <label className="check-row">
              <input
                type="checkbox"
                checked={phrase}
                onChange={(e) => setPhrase(e.target.checked)}
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
              {ui === "cs" ? "Potvrdil dospělý." : "Verified by a grown-up."}
            </p>
          </div>
        ) : (
          <>
            <p>{line("speech", ui)}</p>
            <div className="speech-actions">
              <Button
                icon="parent"
                onClick={() => {
                  recorder.current?.dispose();
                  stopAudio();
                  setGate(true);
                }}
              >
                {ui === "cs" ? "Řeknu to dospělému" : "Say it to a grown-up"}
              </Button>
              {save.prefs.microphone &&
                tries < 2 &&
                state !== "recording" &&
                state !== "requesting" && (
                  <Button
                    icon="microphone"
                    className="secondary"
                    onClick={() => void record()}
                  >
                    {ui === "cs" ? "Nahrát pokus" : "Record a try"}
                  </Button>
                )}
              {state === "requesting" && (
                <p role="status">
                  {ui === "cs"
                    ? "Čekám na povolení mikrofonu…"
                    : "Waiting for microphone permission…"}
                </p>
              )}
              {state === "recording" && (
                <Button
                  icon="pause"
                  className="recording"
                  onClick={() => recorder.current?.stop()}
                >
                  {ui === "cs" ? "Zastavit nahrávání" : "Stop recording"}{" "}
                  <span className="sound-wave" />
                </Button>
              )}
            </div>
            {url && (
              <div className="practice-playback">
                <audio controls src={url} onPlay={stopAudio} />
                <p>
                  {ui === "cs"
                    ? "Jen poslech tvého pokusu. Správnost neposuzujeme."
                    : "Listen to your try. This does not check pronunciation."}
                </p>
              </div>
            )}
            {["permission_denied", "unsupported", "error"].includes(state) && (
              <p role="status">
                {ui === "cs"
                  ? "Mikrofon teď nejde použít. Můžeš to říct dospělému nebo pokračovat."
                  : "The microphone is unavailable. Say it to a grown-up or keep playing."}
              </p>
            )}
            {!save.prefs.microphone && (
              <small>
                {ui === "cs"
                  ? "Mikrofon může zapnout rodič. Mluvení s dospělým funguje i bez něj."
                  : "A grown-up can enable the microphone. You can practice together without it."}
              </small>
            )}
            {tries >= 2 && <p>{line("try", ui)}</p>}
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
          onClose={() => setGate(false)}
          onSuccess={() => {
            setGate(false);
            setAdult(true);
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
            ? "✦ " +
              (lang === "cs" ? "Říkám s dospělým" : "Spoken with a grown-up")
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
