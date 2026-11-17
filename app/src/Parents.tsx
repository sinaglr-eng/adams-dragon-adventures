import { useState, type ChangeEvent } from "react";
import { achievements, words, type Lang } from "./data";
import {
  activateReward,
  confirmReward,
  redeemReward,
  progress,
  mergeBackup,
  migrate,
  freshSave,
  type Save,
} from "./domain";
import { mutate } from "./store";
import { Button, Icon, Sprite, Modal } from "./components";
import { play } from "./audio";
export function download(data: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function EvidenceList({ save }: { save: Save }) {
  return (
    <div className="evidence-list">
      {save.events
        .filter((e) =>
          ["recognized", "spoken_verified", "speech_attempted"].includes(
            e.evidenceType,
          ),
        )
        .slice(-60)
        .reverse()
        .map((e) => (
          <div key={e.id}>
            <strong>
              {words[e.conceptId]?.[e.targetLanguage] ?? e.conceptId}
            </strong>
            <span>
              {e.evidenceType === "spoken_verified"
                ? "Mluvení ověřil dospělý"
                : e.evidenceType === "speech_attempted"
                  ? "Pokus, bez ověření"
                  : e.assistance
                    ? "Poznání s pomocí"
                    : "Samostatné poznání"}{" "}
              · {e.targetLanguage.toUpperCase()}
            </span>
            <small>
              {new Date(e.timestamp).toLocaleDateString("cs-CZ")} · {e.questId}{" "}
              · {e.assistance ? "se vzorem / pomocí" : "bez pomoci"}
            </small>
          </div>
        ))}
    </div>
  );
}
export function Requirement({
  save,
  conditions,
}: {
  save: Save;
  conditions: (typeof achievements)[number]["conditions"];
}) {
  const p = progress(save, conditions);
  return (
    <ul className="requirements">
      <li>
        {p.quest ? "✓" : "○"} Dokončit kapitolu:{" "}
        {conditions.questId ?? "libovolná"}
      </li>
      <li>
        {Math.min(p.recognized, conditions.distinctRecognizedConcepts)} /{" "}
        {conditions.distinctRecognizedConcepts} různých poznaných slov
      </li>
      <li>
        {Math.min(p.spoken, conditions.distinctVerifiedSpokenConcepts)} /{" "}
        {conditions.distinctVerifiedSpokenConcepts} slov ověřených dospělým
      </li>
      {conditions.withoutModelCount > 0 && (
        <li>
          {Math.min(p.withoutModel, conditions.withoutModelCount)} /{" "}
          {conditions.withoutModelCount} řečeno bez vzoru
        </li>
      )}
      {conditions.laterSessionRecallCount > 0 && (
        <li>
          {Math.min(p.later, conditions.laterSessionRecallCount)} /{" "}
          {conditions.laterSessionRecallCount} vybaveno při pozdější návštěvě a
          jiné výpravě (alespoň za 20 hodin)
        </li>
      )}
      {conditions.newContextCount > 0 && (
        <li>
          {Math.min(p.contexts, conditions.newContextCount)} /{" "}
          {conditions.newContextCount} poznáno bez pomoci ve dvou prostředích
        </li>
      )}
      <li>
        Jazyk:{" "}
        {conditions.language === "both"
          ? "čeština i angličtina u stejných slov"
          : "čeština"}
      </li>
    </ul>
  );
}
export function Parents({
  save,
  onClose,
}: {
  save: Save;
  onClose: () => void;
}) {
  const [tab, setTab] = useState("settings"),
    [note, setNote] = useState(""),
    [labels, setLabels] = useState<Record<string, string>>({}),
    [reset, setReset] = useState(false),
    [confirmation, setConfirmation] = useState(""),
    [pending, setPending] = useState<Save | null>(null);
  const pref = (key: keyof Save["prefs"], value: Lang | boolean | number) =>
    void mutate((s) => {
      Object.assign(s.prefs, { [key]: value });
    });
  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 10_000_000) throw Error("Soubor je příliš velký.");
      setPending(migrate(JSON.parse(await file.text())));
      setNote("");
    } catch (err) {
      setNote(String(err));
    }
    e.target.value = "";
  };
  return (
    <main className="parent-page page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PRO DOSPĚLÉ · GROWN-UPS</span>
          <h1>Rodinný průvodce</h1>
          <p>Nastavení, skutečné důkazy a společně domluvené odměny.</p>
        </div>
        <Button icon="back" className="secondary" onClick={onClose}>
          Zpět do hry / Back
        </Button>
      </div>
      <nav className="tabs">
        {[
          ["settings", "Nastavení"],
          ["rewards", "Odměny"],
          ["evidence", "Pokroky"],
          ["backup", "Záloha"],
        ].map(([id, label]) => (
          <button aria-pressed={tab === id} key={id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      {tab === "settings" && (
        <div className="settings-grid">
          <section className="paper">
            <h2>Jazyk a zvuk</h2>
            <label>
              Jazyk průvodce / Guide language
              <select
                value={save.prefs.language}
                onChange={(e) => pref("language", e.target.value as Lang)}
              >
                <option value="en">English support + Czech learning</option>
                <option value="cs">Čeština</option>
              </select>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={!save.prefs.muted}
                onChange={(e) => pref("muted", !e.target.checked)}
              />
              Zvuk zapnutý / Sound on
            </label>
            <label>
              Hlasitost / Volume
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={save.prefs.volume}
                onChange={(e) => pref("volume", Number(e.target.value))}
              />
            </label>
            <div className="button-row">
              <Button icon="speaker" onClick={() => void play("word.fish.cs")}>
                Ryba
              </Button>
              <Button icon="speaker" onClick={() => void play("word.fish.en")}>
                Fish
              </Button>
            </div>
            <small>
              Hlas je syntetický, z knihovny ElevenLabs. Jazykovou správnost
              nahrávek před samostatným hraním zkontrolujte. Není to skutečný
              hlas Romči.
            </small>
          </section>
          <section className="paper">
            <h2>Pohyb a mikrofon</h2>
            <label className="check-row">
              <input
                type="checkbox"
                checked={save.prefs.calm}
                onChange={(e) => pref("calm", e.target.checked)}
              />
              Klidný režim / Reduced motion
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={save.prefs.microphone}
                onChange={(e) => pref("microphone", e.target.checked)}
              />
              Povolit lokální nahrávání pokusu
            </label>
            <p>
              Mikrofon se spustí až po klepnutí dítěte a povolení prohlížeče.
              Pokus trvá nejvýše 6 sekund. Audio zůstává pouze v paměti
              zařízení, neposílá se na server a při zavření dialogu se zahodí.
            </p>
            <p>
              <strong>Výslovnost ověřuje dospělý.</strong> Hra nepředstírá
              automatické hodnocení české dětské řeči. Pečeť získá Adam po
              potvrzení konkrétního slova nebo věty.
            </p>
          </section>
        </div>
      )}
      {tab === "rewards" && (
        <>
          <p className="info-strip">
            Skutečné odměny jsou vypnuté, dokud je nedomluvíte. Aktivované
            podmínky i popis zůstávají zachované. Hra nic nenakupuje.
          </p>
          <div className="reward-grid">
            {achievements.map((a) => {
              const r = save.rewards.find((r) => r.id === a.id);
              return (
                <section className="paper reward-setting" key={a.id}>
                  <Sprite id={a.badge} />
                  <div>
                    <h2>{a.title}</h2>
                    <Requirement
                      save={save}
                      conditions={r?.conditions ?? a.conditions}
                    />
                    {!r ? (
                      <>
                        <label>
                          Domluvená odměna
                          <input
                            value={labels[a.id] ?? a.suggestedReward.label}
                            maxLength={120}
                            onChange={(e) =>
                              setLabels({ ...labels, [a.id]: e.target.value })
                            }
                          />
                        </label>
                        <Button
                          icon="gift"
                          onClick={() =>
                            void mutate((s) =>
                              activateReward(
                                s,
                                a.id,
                                labels[a.id] ?? a.suggestedReward.label,
                              ),
                            )
                          }
                        >
                          Aktivovat výzvu
                        </Button>
                      </>
                    ) : (
                      <>
                        <strong className="reward-label">
                          <Icon name="gift" />
                          {r.label}
                        </strong>
                        <p>
                          Stav:{" "}
                          {
                            {
                              active: "plníme",
                              earned: "splněno – čeká na ověření",
                              parent_confirmed: "ověřeno – čeká na předání",
                              redeemed: "odměna byla předána",
                            }[r.state]
                          }
                        </p>
                        {r.state === "earned" && (
                          <Button
                            icon="check"
                            onClick={() =>
                              void mutate((s) => confirmReward(s, a.id))
                            }
                          >
                            Ověřil/a jsem důkazy
                          </Button>
                        )}
                        {r.state === "parent_confirmed" && (
                          <Button
                            icon="gift"
                            onClick={() =>
                              void mutate((s) => {
                                redeemReward(s, a.id);
                              })
                            }
                          >
                            Odměna skutečně předána
                          </Button>
                        )}
                        {r.state === "redeemed" && (
                          <small>
                            Předáno{" "}
                            {r.redeemedAt
                              ? new Date(r.redeemedAt).toLocaleDateString(
                                  "cs-CZ",
                                )
                              : ""}
                            . Tuto odměnu nelze vyzvednout podruhé.
                          </small>
                        )}
                      </>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
      {tab === "evidence" && (
        <section className="paper">
          <h2>Co se opravdu stalo</h2>
          <p>
            Rozpoznání obrázku a mluvení jsou oddělené. Opakování se vzorem není
            samostatné vybavení slova. Nejde o klinické měření jazykové úrovně.
          </p>
          {save.events.length ? (
            <EvidenceList save={save} />
          ) : (
            <p>Po první výpravě tu uvidíte skutečné pokroky.</p>
          )}
        </section>
      )}
      {tab === "backup" && (
        <section className="paper backup-panel">
          <h2>Postup patří tomuto zařízení</h2>
          <p>
            Ukládání probíhá v prohlížeči. Záloha slouží k přenosu na jiný iPad
            nebo k obnově. Vymazání dat Safari může odstranit postup. Mezi
            zařízeními neprobíhá automatická synchronizace.
          </p>
          <Button
            icon="atlas"
            onClick={() =>
              download(
                save,
                `adam-dragon-backup-${new Date().toISOString().slice(0, 10)}.json`,
              )
            }
          >
            Stáhnout zálohu
          </Button>
          <label className="file-upload">
            Obnovit ze zálohy
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => void importFile(e)}
            />
          </label>
          <p>
            Import sloučí důkazy a zachová zde evidované předané odměny. Na
            novém zařízení zkontrolujte předání s rodičem; hra neověřuje odměny
            napříč zařízeními.
          </p>
          <Button className="quiet" onClick={() => setReset(true)}>
            Začít nový příběh
          </Button>
          {note && <p role="alert">{note}</p>}
        </section>
      )}
      {pending && (
        <Modal title="Sloučit zálohu?" onClose={() => setPending(null)}>
          <p>
            Obnoví se rozehraná výprava ze zálohy a spojí se pokroky. Již
            předané odměny na tomto zařízení zůstanou předané.
          </p>
          <Button
            onClick={() =>
              void mutate((s) => mergeBackup(s, pending)).then(() => {
                setPending(null);
                setNote("Záloha byla sloučena.");
              })
            }
          >
            Ano, sloučit
          </Button>
        </Modal>
      )}
      {reset && (
        <Modal title="Začít znovu?" onClose={() => setReset(false)}>
          <p>
            Nejprve si stáhněte zálohu. Nový příběh vymaže herní pokroky; záznam
            předaných odměn se zachová. Pro potvrzení napište NOVY.
          </p>
          <input
            aria-label="Potvrzení resetu"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
          <Button
            disabled={confirmation !== "NOVY"}
            onClick={() =>
              void mutate((s) => {
                const n = freshSave();
                n.prefs = s.prefs;
                n.redeemed = [
                  ...new Set([
                    ...s.redeemed,
                    ...s.rewards
                      .filter((r) => r.state === "redeemed")
                      .map((r) => r.redemptionId),
                  ]),
                ];
                n.rewards = s.rewards.filter((r) => r.state === "redeemed");
                return n;
              }).then(() => {
                setReset(false);
                onClose();
              })
            }
          >
            Nový příběh
          </Button>
        </Modal>
      )}
    </main>
  );
}
