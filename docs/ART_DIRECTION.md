# Výtvarný systém a plán animací

## Směr

Teplá ilustrovaná pohádka: kvaš, lehká papírová textura, měkké objemy a přehledné siluety. Svět má být živý, laskavý a osobní. Adam je vizuálně nejvýraznější hrdina. Rodinné postavy mají konzistentní barvy a oblečení napříč scénami. Grafiku generoval vestavěný image_gen, přesné prompty jsou v art/generation-prompts.json; případné opravy v art/generation-revisions.json.

## Paleta a UI

| Token | Hex | Použití |
|---|---|---|
| ink | #294438 | Text, ikonové obrysy |
| cream | #FFF6DE | Dialogy, čitelné plochy |
| forest | #4D8755 | Adam, hlavní akce |
| sky | #8BCBE0 | Obloha, Matyáš, klid |
| honey | #F3BC4B | Postup a odměny |
| coral | #E88668 | Sekundární akcent |
| lavender | #AB8EC8 | Klárka, přírodovědné výpravy |

Kontrast konkrétních dvojic při implementaci ověř. Text tmavý na světlé ploše; medová není univerzální barva malého textu. Font například Nunito/Nunito Sans se skutečnou českou diakritikou, licencí přiloženou při instalaci. Herní název a všechny lokalizace musí být živý text. Žádné fonty z cizího komerčního brandu.

Velká primární tlačítka, zaoblení 24–32 px, papírové/wood akcenty, jasný stav stisku. Ovládací ikony v art/ui/ jsou SVG bez vypálených textů. Viditelné popisky a accessible names přidá aplikace. Nevyžadovat znalost ikon bez namluveného vysvětlení.

## Dodávané typy podkladů

- Samostatné široké backgrounds pro každou lokaci, bez hráčů a hlavních interaktivních předmětů.
- Rodinný atlas: osm postav, dodané rects určují výřezy. Dospělé postavy ve scéně vhodně přepočítat, atlas nemá přesné jednotné měřítko mezi generacemi.
- Adamův atlas šesti póz: idle, wave, listen, speak, celebrate, fish. Jde o alternativní pózy, nikoli sousední snímky plynulé animace.
- Adamovy čtyři akční ilustrace: jízda na kole s helmou, podběrák, pozorování lupou a otevřený atlas. Nepředstírej plynulou šlapací animaci ze statické ilustrace; pro přesun tween, kola lze později rigovat samostatně.
- Atlas ryb a drobných tvorů, atlas rekvizit, deset achievementů, tři stavy rámečků.
- Cestovní mapa a key art pro titulní obrazovku.

Zdrojová grafika zůstává v art/source/. Výřezy používají atlasová metadata; runtime může použít Phaser frames nebo CSS/SVG viewport. Před exportem vyžaduj kontrolu safe rects: generátor nemusí respektovat naprosto přesné stejné buňky. Neřež postavy automaticky přes ocas nebo rybářský prut. Zdrojová alfa není binární: jemné poloprůhledné kreslené hrany jsou v pořádku, plošná mlha přes celou buňku není.

## Animace podle prvku

| Prvek | Způsob | Orientační čas |
|---|---|---|
| Adam idle | Velmi jemný bob/scale, pivot u nohou | 3–4 s |
| Romča vypravuje | Přepnutí portrétu, mírné gesto/tween, bez falešné přesné lip-sync | Podle audia |
| Cílový předmět | Jedno malé zvětšení + světelný obrys | 250–400 ms |
| Splávek | Pohyb y + malé vodní kruhy | 1,5–2,5 s |
| Nához | Samostatná vlasec křivka a pohyb splávku | 500–800 ms |
| Úlovek | Oblouk k přednímu plánu, krátké kapky | 700–1000 ms |
| Beruška/žížala | Krátká cesta / jemný transform, zastaví při výběru | 3–5 s |
| Karta | Krátké otočení/reveal, následně klid | 400–700 ms |
| Hlasová pečeť | Medailon, 8–12 jemných částic, zvuk | 800–1200 ms |
| Konec mise | Rodinná reakce, odznak, možnost přeskočit | Max 3 s |

Nekombinuj současně více rušivých smyček. Při výslovnosti utlum dekorace i hudbu. Ve reduced-motion pouze opacity a statické zvýraznění. Žádné prudké záblesky, nekonečné poskakování tlačítek nebo umělé odpočítávání odměn.

## Layout

Logical landscape stage přibližně 1280×720, adaptuj pro 4:3 bez ořezu hráče. NPC po stranách, střed patří interakci. Horní pokyn zabere nejvýše cca 18 % výšky, spodní velké možnosti nejvýše 25 %, podle scény. Portrétní layout přerovná UI pod scénu a použije užší bezpečný výřez. Nevypaluj HUD do prostředí.

## Pokrytí a limity

Sada pokrývá první vydání podle GAME_DESIGN.md. Neobsahuje audio, videa, skutečné kosterní animace ani vyexportované assety pro všechny budoucí kapitoly. Tuto hranici zachovej v README. Grafické podklady nejsou důkaz hotové hry. Scény jsou záměrně stylizované; nevydávat mapu za přesnou geografii Příbrami či Iowy.
