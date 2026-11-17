import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { asset, words, type Lang } from "./data";
import { play, stopAudio, line } from "./audio";
export function Icon({ name }: { name: string }) {
  return (
    <img
      className="icon"
      src={`${import.meta.env.BASE_URL}game-assets/ui/${name}.svg`}
      alt=""
      aria-hidden="true"
    />
  );
}
export function Button({
  icon,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: string }) {
  return (
    <button className={`button ${className}`} {...props}>
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </button>
  );
}
export function Sprite({
  id,
  className = "",
  alt = "",
  style,
}: {
  id: string;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}) {
  return (
    <img
      className={`sprite ${className}`}
      src={asset(id)}
      alt={alt}
      style={style}
      draggable={false}
    />
  );
}
export function WordArt({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  if (id === "hello")
    return <Sprite id="adam-poses/wave" className={className} />;
  if (id === "thanks")
    return <Sprite id="adam-poses/celebrate" className={className} />;
  if (id === "please")
    return (
      <div className={`word-symbol ${className}`}>
        <Sprite id="props/rod" />
        <span className="speech-dot">…</span>
      </div>
    );
  if (id === "red" || id === "blue")
    return (
      <div className={`color-art ${id} ${className}`}>
        <Sprite id={id === "red" ? "props/apple" : "props/bucket"} />
        <i />
      </div>
    );
  if (id === "big" || id === "small")
    return (
      <div className={`size-art ${id} ${className}`}>
        <Sprite id="creatures/carp" />
      </div>
    );
  return (
    <Sprite id={words[id]?.art ?? "props/treasure"} className={className} />
  );
}
export function Modal({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current;
    const prior = document.activeElement as HTMLElement;
    d?.showModal();
    return () => {
      d?.close();
      prior?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`modal ${className}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <Button
          icon="close"
          className="round"
          aria-label="Zavřít / Close"
          onClick={onClose}
        />
      </div>
      {children}
    </dialog>
  );
}
export function ParentGate({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [a] = useState(() => 17 + Math.floor(Math.random() * 16));
  const [b] = useState(() => 12 + Math.floor(Math.random() * 12));
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);
  return (
    <Modal title="Jen pro dospělého · Grown-ups" onClose={onClose}>
      <div className="gate">
        <Icon name="parent" />
        <p>
          Předej zařízení dospělému.
          <br />
          Please hand the device to a grown-up.
        </p>
        <p>Pro vstup napište výsledek / To enter, solve:</p>
        <strong className="sum">
          {a} + {b} = ?
        </strong>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (Number(answer) === a + b) onSuccess();
            else {
              setWrong(true);
              setAnswer("");
            }
          }}
        >
          <input
            aria-label="Výsledek / Answer"
            inputMode="numeric"
            autoComplete="off"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            autoFocus
          />
          {wrong && <p role="alert">Zkus to znovu / Try again.</p>}
          <Button type="submit" icon="lock">
            Otevřít / Open
          </Button>
        </form>
        <small>
          Brána chrání před náhodným kliknutím, není zabezpečením účtu.
        </small>
      </div>
    </Modal>
  );
}
export function Narrator({
  instruction,
  lang,
  onReplay,
  onHelp,
  csTarget,
}: {
  instruction: string;
  lang: Lang;
  onReplay: () => void;
  onHelp?: () => void;
  csTarget?: string;
}) {
  return (
    <div className="narrator">
      <Sprite id="family/romca" className="narrator-portrait" />
      <div className="narrator-copy">
        <small>
          STREJDA ROMČA{" "}
          <span>
            • {lang === "cs" ? "tvůj průvodce" : "your adventure buddy"}
          </span>
        </small>
        <p aria-live="polite">{instruction}</p>
        {csTarget && <strong className="target-word">{csTarget}</strong>}
      </div>
      <div className="narrator-buttons">
        <Button
          icon="speaker"
          className="round"
          aria-label={lang === "cs" ? "Poslechnout znovu" : "Listen again"}
          onClick={onReplay}
        />
        {onHelp && (
          <Button className="help-button" onClick={onHelp}>
            EN
          </Button>
        )}
      </div>
    </div>
  );
}
export function Stars() {
  return (
    <div className="celebration" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <i key={i} style={{ "--i": i } as React.CSSProperties}>
          ✦
        </i>
      ))}
    </div>
  );
}
export function Pause({
  lang,
  onClose,
  onMap,
  onFinish,
}: {
  lang: Lang;
  onClose: () => void;
  onMap: () => void;
  onFinish: () => void;
}) {
  useEffect(() => {
    stopAudio();
    return () => stopAudio();
  }, []);
  return (
    <Modal
      title={lang === "cs" ? "Chvilka klidu" : "A little break"}
      onClose={onClose}
    >
      <Sprite id="adam-poses/listen" className="pause-adam" />
      <p>{line("pause", lang)}</p>
      <div className="stack">
        <Button icon="play" onClick={onClose}>
          {lang === "cs" ? "Pokračovat" : "Keep playing"}
        </Button>
        <Button icon="map" className="secondary" onClick={onMap}>
          {lang === "cs" ? "Na mapu" : "Back to the map"}
        </Button>
        <Button icon="home" className="quiet" onClick={onFinish}>
          {lang === "cs" ? "Pro dnešek hotovo" : "All done for today"}
        </Button>
      </div>
    </Modal>
  );
}
export function AudioButton({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <Button icon="speaker" className="secondary" onClick={() => void play(id)}>
      {children}
    </Button>
  );
}
