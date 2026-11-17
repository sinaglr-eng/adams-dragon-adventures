# Kontrola přípravného balíčku — 17. listopadu 2026

## Výsledek

Připraveno 15 zdrojových PNG: 7 atlasů s 59 výřezy a 8 samostatných ilustrací (6 herních prostředí, cestovní mapa a titulní ilustrace). Navíc 28 SVG ikon. Výřezy používají originální PNG, nejsou duplicitní rastrové soubory.

Obsahová data: 8 rodinných postav, 8 výprav, 36 pojmů s CZ/EN názvem, významem a větou, 10 achievementů, 242 textových replik k budoucímu namluvení, 6 doporučených kompozic scén.

## Provedené kontroly

- `node tools/build-kit.mjs`: manifest, výřezy, UI ikony a katalog vytvořeny.
- `node tools/validate-kit.mjs`: PASS — soubory, souřadnice, ID, slovní zásoba, audio scénáře, předpoklady výprav bez cyklů, jediný hráč Adam, Romčovo vyprávění, regionální omezení postav a výchozí neaktivní skutečné odměny.
- `python tools/inspect-atlases.py`: ověřena skutečná alfa u všech 7 atlasů; připravena metadata výřezů podle průhledných mezer.
- Kontrola lokálních Markdown odkazů: žádné chybějící cíle.
- Prohlédnuty generované ilustrace; postavy, Adamovy běžné i akční pózy, ryby/brouci a vybavení navíc ověřeny v prohlížeči složené na barevném pozadí.
- Opraveno pronikání sousedních políček do náhledu při rozdílném poměru stran přidáním explicitního SVG clippingu.
- Opraven odznak vyprávění babi tak, aby zobrazoval růžovou dračí babičku namísto dědečka.

## Hranice tohoto předání

Nejde o implementovanou nebo otestovanou hru. Grafika je statická a připravená pro následné animování. Audio jsou scénáře bez nahrávek. Automatická evaluace české dětské výslovnosti není zprovozněna; prompt vyžaduje poctivé rozlišení procvičení, potvrzení rodičem a případného validovaného poskytovatele.

Při implementaci zůstává nutné ověřit reálnou kompozici na cílovém tabletu, optimalizovat zdrojové PNG pro runtime, namluvit a jazykově zkontrolovat audio a provést akceptační testy uvedené v ACCEPTANCE.md.
