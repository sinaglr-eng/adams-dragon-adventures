# Pravidla tohoto projektu

- Nejprve čti IMPLEMENTATION_PROMPT.md a docs/GAME_DESIGN.md. Aktuální kánon má přednost před texty na starém concept artu.
- Adam je jediný hráč. Matyáš je NPC. Babi a děda pouze Příbram, máma a táta Iowa. Romča vypravěč; Klárka součást rodiny.
- Nepřidávej fake rozpoznávání výslovnosti, automatické hlasové pečeti z prostého kliknutí ani předstírané nákupy odměn.
- Zachovej dodanou grafiku a její zdrojové PNG. Nevyměňuj ilustrované scény za emoji nebo obecné dashboardové dlaždice.
- Grafiku lokalizuj živým textem; nevypaluj slova do obrázků. Pro atlasy použij manifest a zkontroluj ořezy.
- Změny dělej v codex/ větvi. Vlastník výslovně schválil veřejný repozitář `sinaglr-eng/adams-dragon-adventures`; GitHub Pages slouží jako cílový web pro iPad. Nevytvářej další cloudové služby bez zadání. Současný veřejný katalog není hratelná hra.
- Žádné klíče, dětské nahrávky, tajemství nebo osobní telemetry v git. Základní hra musí fungovat bez mikrofonu.
- Vhodné testy: herní přechody, opakování učiva, idempotence odměn, migrace uloženého postupu, fallback mikrofonu. Neztrácej čas testy kopírujícími statický obsah.
