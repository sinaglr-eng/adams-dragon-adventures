# Akceptační kritéria budoucí implementace

## Funkční průchody

- [ ] První spuštění bez účtu a čtení → Romčovo přivítání → první smysluplná akce.
- [ ] Adam je jediný hráč, žádný profil Matyáše. Všechny rodinné postavy jsou draci; Klárka má skutečnou roli.
- [ ] Babi a děda pouze Příbram, máma a táta pouze iowské rodinné scény. Romča vypravuje všechny výpravy.
- [ ] Všech 8 kapitol jde dokončit, vrátit se do mapy a pokračovat po refreshi.
- [ ] Rybolov má všechny přechody, čeká na dítě, negeneruje dvojité úlovky při spam-clicku.
- [ ] Drag and drop má rovnocennou tap alternativu, klávesnice funguje pro hlavní akce.
- [ ] Každá karta má správný tvor/předmět, CZ/EN výslovnost, význam a stav; názvy nejsou vypálené do obrázku.
- [ ] Změna pozice možností a nové kontexty ověřují porozumění, pomoc je zapsaná.
- [ ] Mikrofon odmítnutý/nepodporovaný → žádný dead end, hra pokračuje.
- [ ] Bez validovaného speech provideru se neuděluje automatická pečeť za správnou výslovnost.
- [ ] Rodič dokáže potvrdit mluvní výkon a původ potvrzení je viditelný.
- [ ] Rodičem neaktivovaná skutečná odměna se dítěti neslibuje.
- [ ] Achievement evidence → rodičovské potvrzení → předání právě jednou, i po refreshi/dvojkliku.
- [ ] Záloha/import, migrace uložených dat a poškozený save mají funkční řešení bez tichého smazání.

## Vizuální a audio kontrola

- [ ] Screenshot titulní obrazovky, mapy, rybolovu, atlasu, mluvení a rodičovské odměny při 1024×768, 1440×900, 390×844.
- [ ] Adam/ryba ani interaktivní předměty nejsou oříznuté. Alfa podkladů bez obdélníkových pozadí. Atlasová políčka neobsahují části sousedů.
- [ ] Živý text má diakritiku, bez záměny názvu hry za starý concept art.
- [ ] Hlasové pokyny mají replay, nerozjíždí se více řečí současně, hudba se při řeči ztiší.
- [ ] České audio kontrolované česky mluvícím dospělým, anglické americky; TTS fallback se nevydává za hotové produkční nahrávky.
- [ ] Reduced motion i mute fungují, vizuální a hlasové informace mají přiměřené alternativy.

## Významné automatické testy

- Unit: quest state machine, mastery vs assistance, distinct-word counting, later recall, duplicate event handling.
- Integration: odměna předána pouze jednou, parent gate, save migration, audio cleanup, microphone lifecycle.
- Browser: první rybářská výprava s falešným testovacím adapterem označeným test-only; alternativně rodičovsky potvrzený výkon; denied mic; reload and resume; import conflict.
- Testovací adapter ani mock API nesmí být aktivní v produkčním buildu.
- Typecheck, lint, build, schema/content validation a výše uvedené cílené testy musí projít.

## Výkon a soukromí

- [ ] První obrazovka nestahuje všechny zdrojové PNG; změřený download a stabilní fps na cílovém tabletu.
- [ ] Při skrytí nebo opuštění scény zastaven mikrofon/audio a neunikají listenery.
- [ ] Klíče nejsou v klientském bundle; bez nevyžádaného audia v síti, logu nebo úložišti.
- [ ] Reálné odměny neprovádějí žádný nákup a nesdělují údaje třetí straně.

Aktuální preprodukční balíček tato herní kritéria ještě nesplňuje — jsou určena pro implementační fázi. Jeho kontrola ověřuje soubory, odkazy, data a grafické podklady, nikoli funkčnost neexistující hry.
