> Aktualizace: aktuální strukturu pěti samostatných příběhových questů a rozhraní pro prarodiče popisuje [docs/QUEST_AUTHORING.md](docs/QUEST_AUTHORING.md). Původních osm kapitol níže zůstává jako kompatibilní archiv. Nové zadání má přednost před původní pevnou posloupností.

# Kompletní implementační prompt — Adamovy dračí výpravy

Jsi zkušený game developer, frontend engineer a designer her pro předškoláky. Implementuj plně hratelnou webovou hru **Adamovy dračí výpravy / Adam's Dragon Adventures** podle tohoto zadání, dat v content/ a dodané grafiky. Toto zadání je podklad pro následnou implementaci; nynější repozitář je preprodukční balíček, nikoli hotová aplikace.

## 1. Výsledek, který máš dodat

Dodej fungující aplikaci v prohlížeči, ne landing page, klikací obrázek nebo pouhý seznam kartiček. Hráč musí projít 8 výpravami, lovit, sbírat, poslouchat české a americké anglické názvy, dobrovolně mluvit, ukládat postup a ukázat rodiči splněnou výzvu. Každá dostupná akce musí mít skutečnou implementaci. Nedostupné integrace poctivě popiš a nabídni funkční rodičovskou alternativu.

Přečti docs/GAME_DESIGN.md, docs/ART_DIRECTION.md, docs/SPEECH_AND_REWARDS.md, docs/ACCEPTANCE.md, art/manifest.json a všechny soubory content/. Zachovej rodinný kánon i grafickou identitu. Dokonči práci včetně přiměřených testů a vizuálního ověření. Veřejný repozitář se jmenuje `sinaglr-eng/adams-dragon-adventures`; cílový web pro iPad je `https://sinaglr-eng.github.io/adams-dragon-adventures/`. Aktuálně je tam pouze grafický katalog. Pro herní sestavení použij base `/adams-dragon-adventures/`, připrav Pages deployment a ověř Safari na iPadu; zachovej jasné rozlišení náhledu a hotové hry. Nové externí placené služby nevytvářej bez samostatného zadání.

## 2. Závazný rodinný kánon

- Adam, přibližně 5 let, je jediný hráč a hlavní zelený dráček. Primárně mluví anglicky, učí se české ekvivalenty, porozumění a mluvení.
- Matyáš je příliš malý na vlastní hraní. Je menší modrý dračí bráška a pouze příběhová NPC postava. Žádný profil, výběr hráče, žebříček ani srovnání bratrů.
- Máma a táta žijí v Iowě a vystupují v iowských rodinných scénách.
- Babi a děda jsou starší draci a vystupují pouze v Příbrami v ČR. Nesmějí se náhodně objevit u domu v Iowě.
- Strejda Romča je Adamův nejlepší kamarád, rybářský parťák, autor vylomenin a jediný hlavní vypravěč. Vypravěčský hlas může doprovázet všechny lokace, aniž by tam postava fyzicky stála.
- Teta Klárka je součást rodiny. Pomáhá s přírodou, brouky, cyklovýpravami a atlasem. Nemá nahradit Romču jako vypravěče.
- Všichni jsou draci, nikdy realistické lidské portréty. Vzhled podle manifestu a character canon. Romčův hlas je herecký/nově vytvořený hlas, nikoli automatický klon skutečného člověka.
- Zájmy: rybaření má největší obsahový prostor, potom sbírání karet, brouci/žížaly, kola a rodinné cestování. Rodinné lokace jsou stylizované, nepoužívej skutečné adresy.

## 3. Produkt a obrazovky

Použij velkou ilustrovanou herní plochu. Ve hře nesmějí dominovat admin tabulky, generické dashboard karty, malé textové tlačítka nebo emoji místo grafiky.

Implementuj:

1. **Title / resume:** reálný typografický název přes cover artwork, velké Pokračovat/Hrát, diskrétní rodičovský vstup, zvuk zapnut až po gestu.
2. **První přivítání:** Romča vysvětlí jednu akci najednou, Adam se představí, okamžitá interakce do 30 sekund. Rodič může nastavit hlas a mikrofon, ale není nutná registrace dítěte.
3. **Mapa dvou domovů:** Iowa a Příbram na atlasu; umístěné přístupné DOM hotspoty, animovaný přesun. Na aktuální rozhodnutí nejvýše dvě doporučené výpravy, dokončené jsou dostupné z deníku.
4. **Herní scéna:** velké postavy a předměty, jeden namluvený pokyn, opakování audia, EN pomoc, pauza a jednoduchý postup. Dialog nezakrývá předměty.
5. **Detail úlovku / karty:** animovaný tvor, CZ a EN audio, význam, stav karty, dobrovolné Probuď hlasem.
6. **Dračí atlas:** kolekce s kategoriemi Ryby / Malí tvorové / Poklady. Neobjevené siluety; žádné placené balíčky. Přístupná karta otevírá detail.
7. **Hlasová výzva:** poslouchání vzoru → vědomé spuštění mikrofonu nebo režim s dospělým → výsledek se správným původem ověření → možnost znovu či později.
8. **Konec výpravy:** konkrétní dosažené věci, odznak/dekorace, přirozené Dokončit pro dnešek. Přehled nefalšuje naučená slova.
9. **Rodinná kniha:** splněné odznaky a rodičem aktivované skutečné odměny, detail důkazů, Ukázat rodiči.
10. **Rodičovská část:** jazyk, zvuk, klidný režim, souhlas s mikrofonem a případným serverovým zpracováním, potvrzení mluvení, výzvy/odměny, jednorázové předání, export/import/reset s potvrzením.

České texty se skutečnou diakritikou. Americká angličtina v anglických větách. Text je doplněk, potřebné kroky musí jít pochopit zvukem a obrazem. Všechny pokyny mají tlačítko přehrát znovu.

## 4. Technický návrh

Preferuj TypeScript + Vite + React pro aplikační shell, přístupné UI, atlas a rodičovské obrazovky; Phaser pro scény, tweeny, částice, vstup a rybolov. Před začátkem ověř kompatibilní stabilní verze v oficiální dokumentaci, pinni je lockfilem a nemíchej návody různých major verzí Phaseru. Pro jednodušší pevné scény lze použít DOM/CSS animace, pokud splní výkon a interakce; nebuduj dvě soupeřící herní smyčky.

Rozdělení například:

```text
src/app/             routing, shell, preferences, error boundaries
src/game/scenes/     boot, map, fishing, meadow, workshop, cycling, story
src/game/actors/     Adam, NPCs, collectible, bobber
src/game/systems/    quest, input, animation, audio, camera
src/domain/          mastery, events, achievements, rewards
src/content/         typed loaders for checked-in content
src/services/        persistence, speech adapters, audio manifest
src/components/      accessible overlays, atlas, parent panels
src/styles/          tokens, responsive rules, reduced-motion
tests/               unit + integration + browser journeys
public/assets/       runtime images, atlas data, vetted audio
```

Uložený postup v IndexedDB s verzí schématu, migracemi a atomickými aktualizacemi. Nastavení může být v localStorage. Bez dětského účtu, veřejného profilu nebo analytických trackerů. Pro první verzi lokální single-device model; export/import je vědomá rodičovská akce. Neoznačuj lokální odměny jako synchronizované mezi zařízeními.

Každá scéna má jasný lifecycle: odregistrovat listenery, zastavit audio, ukončit stream mikrofonu při odchodu. Pozastav animace a nahrávání při skrytí tabu. Zachovej postup při obnově stránky.

## 5. Data a události

Rozšiř připravená JSON data typovanými schématy a validuj je při build/test. ID se nesmějí měnit s lokalizací. Událost obsahuje unique id, timestamp, sessionId, questId, conceptId, targetLanguage, taskVariant, evidenceType, assistance, assessmentSource. Nepřidávej surové audio do evidence.

Rozliš alespoň:

```ts
type EvidenceType = 'introduced' | 'recognized' | 'speech_attempted'
  | 'spoken_verified' | 'recalled' | 'quest_completed';
type AssessmentSource = 'interaction' | 'parent' | 'validated_provider';
type SpeechOutcome = 'verified' | 'needs_help' | 'uncertain'
  | 'no_speech' | 'permission_denied' | 'unsupported' | 'network_error';
type RewardState = 'unconfigured' | 'active' | 'earned'
  | 'parent_confirmed' | 'redeemed';
```

Mastery odděluje porozumění, nápovědu a mluvení. Event replay ani opakovaný callback nesmí duplicitně udělit XP, kartu, odznak či odměnu. Opakování známé karty nevytváří nový unikátní objev. U odměn používej stabilní redemptionId a unique vazbu na challenge instance.

## 6. Jazyková výuka

Vezmi content/vocabulary.json jako výchozí obsah. U každého slova ukázat předmět/akci, vyslovit CZ i EN, vysvětlit stručně význam, procvičit výběrem a později nabídnout mluvení. Nevysvětluj předškolákovi gramatické termíny. Česká slova ve větách skloňuj přirozeně a vzorové věty namluv jako celek.

Výchozí podpora: EN krátké vysvětlení + český cíl. U známých pojmů český pokyn a EN pomoc na vyžádání. Vhodné reverzní úkoly: slyším CZ, poznám význam či anglický ekvivalent; nezaměňuj to za samostatné české mluvení. První výběr eviduj před odhalením správného řešení. Opakování vybírej z čerstvých a nejistých pojmů; po opakované chybě méně možností, názornější pomoc, nikdy dead end.

Střídej polohu možností a prostředí; využij jeden pojem ve více úlohách. Žádné skóre za rychlost. Nepřidávej falešné přesné procento jazykové znalosti.

## 7. Rybolov a další mechaniky

Implementuj stavový automat fishing: equipment → cast → wait → bite → reel → reveal → identify → speech_optional → release → summary. Připravená animace 1–3 sekund čekání může být přeskočena; po záběru není časový limit. Jedno velké tlačítko nebo tah, obě varianty dostupné. Mikrofón se nepoužívá během motorického úkolu.

Ryby a legrační předměty vycházejí z kontrolovaného seznamu výpravy, nikoli náhodné ekonomiky. Udrž rovnováhu opakování a objevu. Scénář první české výpravy zaručí rybu i Romčovu botu, aby vyprávění fungovalo. Karta zůstane i po vypuštění ryby.

Cyklotrasa je krátký pomalý přesun s několika zastávkami, ne reflexní závod. Broučí scéna využívá lupu, list a kámen; tvory po pozorování vracíme. Dědova dílna má přehledné kroky s vizuálním cílem. Rodinné vyprávění použije 3 obrázky z dokončené výpravy.

## 8. Audio a mluvení — nepředstírat schopnosti

Pro finální obsah preferuj předem generované/nahrané a zkontrolované audio v cs-CZ a en-US. Romča má jednotný dospělý přátelský hlas, stručné repliky a klidné tempo. Pro titulky a audio používej shodný scénář. Pokud audio ještě nebylo vyrobeno, browser TTS je označený vývojový fallback. Zkontroluj dostupnost daného jazyka; anglický hlas nesmí číst česká slova a být vydáván za správný vzor. Chybějící český hlas oznámit rodiči, umožnit ostatní hraní.

Web Speech API je na různých prohlížečích různě podporované a rozpoznání může odesílat audio mimo zařízení. Proto neslibuj univerzální ani offline hodnocení. Standardní transkript, confidence, hlasitost nebo délka řeči nikdy samy neudělují pečeť za správnou výslovnost.

Zaveď SpeechAssessmentAdapter se třemi oddělenými režimy:

1. **Parent assisted (funkční výchozí):** přehraj vzor, nech dítě mluvit, potvrzení rodičem za dospělou bránou. Zdroj evidence 'parent'.
2. **Practice only:** mikrofon ukáže vstup a dovolí lokální přehrání krátkého pokusu; po skončení audio zahodit. Žádné tvrzení, že správnost byla ověřena.
3. **Validated provider (volitelný):** pouze server-side integrace poskytovatele skutečného hodnocení české dětské řeči, ověřená na cílových slovech. Klíč nikdy v browseru. Před zapnutím dolož dostupný jazyk, testovací výsledky, retenci a souhlas rodiče. Pokud vhodný poskytovatel není, tento režim zůstává jasně nedostupný, první dva fungují.

Slovo/krátká věta → poslech vzoru → stisk mikrofonu → viditelný stav naslouchání, možnost okamžitě ukončit, max cca 6 sekund na slovo → výsledek. U nejistoty neutrální Romčova replika, možnost zopakovat nebo odložit. Max 2 navržené pokusy v jedné chvíli; netlačit do nekonečného opakování. Žádný přísný trest za věkově běžnou výslovnost r/ř. Ověřený mluvní úkol může mít rozsah jednoho slova nebo věty. Neklonuj hlas rodinných příslušníků.

## 9. Odměny a achievementy

Použij content/achievements.json. Herní odměny: XP, karty, vizuální varianty, dekorace, odemčení příběhu. Speciální hlasová pečeť patří ověřenému mluvnímu úkolu; obyčejný pokus může přinést malé povzbuzení, nikoli falešnou pečeť.

Reálné odměny musí rodič předem aktivovat: Hot Wheels autíčko, Pokémon kartičky, dobrota, výlet, společné rybaření atd. Použij generické obrázky autíčka/karet, žádná externí loga či nákupy. V dětském režimu se neobjeví příslib neschválené odměny. Neaktivní achievement může mít herní odznak, ale žádný automatický nárok na věc.

Snapshotuj podmínky a odměnu při aktivaci. Změna nastavení později nesmí tiše odebrat už získanou odměnu. Splnění → karta Ukázat rodiči → důkazy (slova, pomoc, datum, zdroj ověření) → rodič potvrdí → rodič označí předáno. Idempotence i po refreshi, dvojkliku a obnovení. Import starší zálohy nesmí potichu obnovit již vyzvednuté odměny; vyžádej rodičovské sloučení nebo výslovně popiš limit lokálního modelu.

Výzva nepropadá, žádné streaky, časované nátlaky ani placené náhodné odměny. Hodnotu neurčuje délka hraní. Úspěch má být porozumění a využití slova, ne počet kliknutí.

## 10. Grafika a animace

Použij všechny relevantní podklady art/manifest.json. Zdrojové PNG neměň destruktivně. Pro runtime lze v build kroku vytvořit WebP/AVIF a per-cell textury; zachovej alpha a provenance. Rozměry a atlas cell rects ber z manifestu, ověř visually safe bounds. Rodinné postavy a pózy jsou samostatné statické ilustrace, ne skelet ani frame-perfect cyklus.

Pravidla:

- Klidná idle animace postav, občasné přepnutí do wave/listen/speak/celebrate/fish. Netvoř blink deformováním celého obličeje.
- Vodní kruhy, bobber tween, částice u úlovku, pohyb vážky po křivce, lehké otočení karty, krátké zlaté částice za hlasovou pečeť.
- Při vyslovování zvýrazni jediný cílový předmět, ostatní ambientní dění utlum.
- Odezva na stisk do ~100 ms, běžná radost 0,5–1 s, konec mise 2–3 s a přeskočitelný.
- V režimu reduced motion odstranit parallax, výrazné scale skoky, letící konfety a kontinuální pohyb. Stav musí být čitelný i staticky.
- UI text vždy DOM, ne bitmapa. Atlas frame art je dekorace; click target je větší přístupný button.

## 11. Responsivita a přístupnost

Tablet landscape 1024×768 a 1280×800 je primární, desktop 1440×900 a mobil portrait 390×844 musí fungovat. Na malém portrait preferuj zjednodušenou kompozici/scénu s přesunutým dialogem, nezamkni uživatele na landscape. Žádný ořez zásadních předmětů.

Cíle dotyku alespoň 64 CSS px na primárním tabletu, čitelný kontrast na krémových plochách, focus ring, klávesnice/Enter/Space, ovládání bez dragu. Audio replay a stop snadno dostupné. Poznání nesmí spoléhat jen na barvu. Titulky jsou doplněk pro rodiče a přístupnost. Canvas musí mít odpovídající DOM ovládací prvky/alternativu pro hlavní akce. Žádné blikající odměny.

## 12. Výkon a síť

Scény načítej postupně. Nestahuj při prvním zobrazení všechny velké zdrojové PNG a audio. Cíl: úvodní komprimovaný download do přibližně 5 MB, další lokace lazy load, interaktivní titulní obrazovka do 3 s na běžném připojení, stabilní animace alespoň 30 fps na běžném tabletu. Limity ověř měřením a uprav podle cílového zařízení. Omez částice a rozměry textur, zruš assety nepoužívaných scén. Cache offline assety až po prvním stažení, žádné sliby offline hlasové analýzy. Preferuj lokální nebo self-hosted font s Czech glyph coverage.

## 13. Pracovní pořadí

1. Validuj přípravná data a grafiku, nastav projekt a typy.
2. Vytvoř jednu skutečně hotovou průchozí výpravu Romča a záhadný úlovek: úvod → vybavení → rybolov → karta → rodičovsky ověřené mluvení → uložený odznak → resume.
3. Dodej mapu, atlas, učení, rodičovské odměny a korektní persistence.
4. Rozšiř stejné systémy na všech 8 kapitol, doplň Klárku, rodinu, brouky, dílnu a kola.
5. Dodej a zkontroluj hlasové soubory; pokud nejsou dostupné, jasně odděl release blocker od vývojového TTS.
6. Proveď testy, vizuální kontrolu hlavních viewportů a performance pass. Oprav nalezené chyby.
7. Sepiš README pro spuštění, build, zálohu, audio a speech provider konfiguraci. V závěru popiš hotové části a přesná omezení, nepředstírej validované hodnocení výslovnosti.

## 14. Definition of done

Všechna kritéria docs/ACCEPTANCE.md musí být buď splněná, nebo explicitně označená jako omezení s funkční alternativou. Herní jádro, 8 výprav, karty, lokální persistence, rodičovské potvrzení a jednorázové odměny musejí fungovat. Automatické hodnocení výslovnosti není povoleno simulovat. Produkční release vyžaduje zkontrolované CZ/EN audio, žádné rozbité grafické cesty a věrohodnou dostupnost mikrofonových režimů.

Výstup práce: zdrojový kód, build, testovací výsledky, screenshots hlavních scén, stručný seznam skutečných limitů. Nevytvářej nové řešení bez použití dodaných výtvarných podkladů.
