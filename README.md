# Adam's Dragon Adventures

**Adam's Dragon Adventures — Dva domovy. Dva jazyky. Spousta dobrodružství.**

Veřejný přípravný repozitář osobní česko-americké webové hry **Adamovy dračí výpravy** pro Adama (přibližně 5 let). Obsahuje úplné zadání implementace, strukturovaný obsah a originální grafické podklady. **Herní aplikace zatím není implementována.**

**[Online náhled grafiky](https://sinaglr-eng.github.io/adams-dragon-adventures/)** — dostupný v prohlížeči včetně iPadu, bez GitHub účtu. Zatím jde o grafický katalog, nikoli hratelnou hru. Repo: [sinaglr-eng/adams-dragon-adventures](https://github.com/sinaglr-eng/adams-dragon-adventures).

![Adam, Matyáš, Romča a Klárka](art/source/cover.png)

## Začněte zde

1. [Kompletní implementační prompt](IMPLEMENTATION_PROMPT.md) — zadání pro vývojáře nebo implementačního agenta.
2. [Rodinný kánon a herní návrh](docs/GAME_DESIGN.md).
3. [Výtvarná a animační pravidla](docs/ART_DIRECTION.md).
4. [Mluvení a skutečné odměny](docs/SPEECH_AND_REWARDS.md).
5. [Kritéria dokončení a ověření](docs/ACCEPTANCE.md).
6. [Grafický katalog](art/catalog.html) — otevřít lokálně v prohlížeči; nejde o hru.
7. [Manifest grafiky](art/manifest.json) a [přesné generační prompty](art/generation-prompts.json).

## Závazná fakta

- Adam je jediný hratelný hlavní hrdina. Matyáš je mladší příběhová postava, bez profilu a vlastních úkolů.
- Všichni členové rodiny jsou draci. Máma a táta žijí v Iowě; babi a děda vystupují pouze v Příbrami v ČR.
- Strejda Romča je vypravěč, Adamův nejlepší kamarád a rybářský parťák. Teta Klárka pomáhá s přírodou, atlasem a výpravami.
- Jádro: rybaření, cyklistika, brouci a žížaly, objevování, sběratelské karty, česká řeč s anglickou oporou.
- Základní karta za objev; bonus za skutečně ověřený mluvní úkol. Rozpoznání textu samo neprokazuje správnou výslovnost.
- Reálné odměny nejdříve nastavuje rodič a jejich předání potvrzuje jednou. Hra nic nekupuje ani nikomu neposílá zprávy.

## Struktura

`content/` — slovní zásoba, kapitoly, postavy, achievementy a návrh audio scénáře.

`art/source/` — originální PNG generované vestavěným image_gen; průhledné atlasy a samostatná prostředí.

`art/ui/` — jednoduché vektorové ovládací ikony, generované deterministicky.

`art/reference/` — dřívější schválený concept art, pouze reference; jeho starší nápis Adam & Matyáš nenahrazuje aktuální název.

`tools/` — nástroje pro katalog, manifest a kontrolu přípravných podkladů; nejsou herní implementací.

## Rozsah grafické sady

Sada pokrývá definované lokace, postavy a aktivity první verze. Atlasy obsahují statické samostatné pózy a předměty; pohyb se při implementaci vytvoří tweeny, částicemi a přepínáním póz. Nejde o předrenderované video ani hotové kosterní animace. Audio nahrávky nejsou součástí tohoto grafického balíčku; připraven je scénář a pravidla produkce.

## Soukromí a původ

Repozitář je na výslovné přání vlastníka veřejný. Žádné skutečné adresy, fotografie, biometrické profily nebo hlasové klony nejsou přiloženy. Soukromé uložené postupy, hlasové nahrávky a API klíče do repozitáře nepatří. Grafika je původní AI tvorba; Pokémon a Hot Wheels jsou pouze rodičem volené reálné odměny, jejich loga ani postavy nejsou součástí grafiky.

## Web pro iPad

GitHub Pages publikuje kořen větve `codex/preproduction`. Současný `index.html` otevírá existující grafický katalog; `.nojekyll` zajišťuje přímé podávání statických souborů. Veřejný repozitář a hostovaný web jsou dvě různé věci. Až vznikne herní aplikace, její sestavení musí nahradit tento náhled. Pro Vite použijte base `/adams-dragon-adventures/` a ověřte Safari na iPadu. Npm `private: true` brání omylem publikovanému npm balíčku; neovlivňuje veřejnost GitHub repozitáře ani webu.

## Předání implementaci

Přípravný balíček lze zkontrolovat příkazy `npm run kit:build` a `npm run kit:validate` (Node 22+; bez npm závislostí). Při změně atlasů nejprve spusťte `python tools/inspect-atlases.py` s Pillow pro nové souřadnice. HTML katalog otevřete přímo nebo přes lokální HTTP server. SVG wrappers jsou pomocné výřezy se závislostí na původním PNG; pro runtime použijte PNG + manifest, případně inline SVG, ne externí SVG uvnitř img.

Otevřete tento repozitář a zadejte: **„Implementuj hru podle IMPLEMENTATION_PROMPT.md; použij dodaná data a grafiku, projdi všechna akceptační kritéria a poctivě popiš omezení hlasového hodnocení.“**
