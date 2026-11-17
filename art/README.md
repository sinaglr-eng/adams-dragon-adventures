# Grafický balíček

- `source/`: původní generované PNG, se skutečnou alfou u postav, tvorů, rekvizit, odznaků a rámečků.
- `manifest.json`: názvy, rozměry, hash, kategorie a přesné frame rects. Používejte rects, ne pouze nominální počet sloupců.
- `frame-overrides.json`: souřadnice upravené podle skutečné průhlednosti obrázku; generátor nevytváří dokonale pravidelné rozestupy.
- `frames/`: malé SVG výřezové wrappers odkazující na původní PNG. Nejsou samostatnými raster soubory. Prohlížení přes inline SVG nebo přímo; vnější img může blokovat nested external image.
- `ui/`: 28 jednoduchých SVG ikon; popisky a stavy ovládání dodá aplikace.
- `catalog.html`: lokální vizuální katalog s inline SVG clippingem, bez externích závislostí.
- `generation-prompts.json` a `generation-revisions.json`: přesné zadání vestavěnému image_gen, pro opakování nebo cílené úpravy.
- `alpha-inspection.json`: technická kontrola alfa kanálu; vizuální kontrola musí navazovat.
- `reference/`: předchozí schválený concept art. Slouží jen jako výtvarná reference, jeho starší název hry není aktuální.

Pohyby, částice, světelné zvýraznění a UI stavy se implementují podle `docs/ART_DIRECTION.md`. Sada nemá předrenderované animace, audio ani hotovou herní logiku. Obrázky mají jednotný styl, ale výšky jednotlivých postav ve scéně se řídí věkem a rolí, nikoli velikostí původní buňky atlasu.

Před buildem runtime doporučeno lazy loading prostředí a komprimované deriváty se zachovanou alfou; PNG source uchovat. Tyto soubory jsou přípravné podklady pro soukromý rodinný projekt.
