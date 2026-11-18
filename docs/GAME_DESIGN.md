> Aktuální verze 1.2: [Atlas dvou domovů](ATLAS_UPDATE.md), sedm regionálních výprav, schválená podoba rodiny a dvojí český slovníkový vzor. Toto zadání má přednost před starším návrhem níže.

> Aktualizace: aktuální strukturu pěti samostatných příběhových questů a rozhraní pro prarodiče popisuje [QUEST_AUTHORING.md](QUEST_AUTHORING.md). Původních osm kapitol níže zůstává jako kompatibilní archiv. Nové zadání má přednost před původní pevnou posloupností.

# Herní návrh a rodinný kánon

## Identita

Název: **Adamovy dračí výpravy**. Anglicky **Adam's Dragon Adventures**. Věk hlavního hráče přibližně 5 let, dominantní angličtina, česká rodina. Hra musí být ovladatelná bez čtení. Cílem je porozumět českým slovům, použít je v kontextu a postupně mluvit. Opačný směr procvičovat jako doplněk, samostatně evidovat znalost CZ/EN.

## Rodina

| ID | Postava | Role | Vzhled / umístění |
|---|---|---|---|
| adam | Adam | Jediný hráč, sběratel, rybář, cyklista | Zelený dráček, krémové bříško, broskvové růžky, modrá kšiltovka, hořčicová vesta |
| matyas | Matyáš | Malý bráška, příběhový společník | Menší modrý dráček, oranžové lacláče; cestuje s Adamem, žádný vlastní profil |
| romca | Strejda Romča | Vypravěč, nejlepší kamarád, rybaření a vylomeniny | Rezavě oranžový dospělý drak, rybářský klobouk a olivová vesta |
| klarka | Teta Klárka | Podporující průvodkyně atlasem a přírodou | Levandulová dospělá dračice, tyrkysová bunda, korálový šátek, lupa |
| babi | Babi | Zahrada, svačina, vyprávění zážitků | Starší růžová dračice, kulaté brýle, světlý svetr; pouze Příbram |
| deda | Děda | Dílna, kola, výbava | Starší šalvějový drak, šedé obočí, hnědá vesta a placatá čepice; pouze Příbram |
| mama | Máma | Domov a příprava cesty | Tyrkysová dračice, korálový svetr; pouze Iowa v definovaných scénách |
| tata | Táta | Domov, kola, rodinné výpravy | Modroindigový drak, hořčicová košile; pouze Iowa v definovaných scénách |

Romča a Klárka mohou vyprávěním provázet obě oblasti. Jejich fyzické vystupování v Iowě znamená návštěvu, ne tvrzení o místě bydliště. Jejich přesné bydliště nebylo určeno. Romčovo vyprávění není skutečná komunikace se strejdou. Žádný hlasový klon bez samostatného zadání.

## Hlavní smyčka

Vyber výpravu → krátký Romčův příběh → pochop 2–3 slova → proveď smysluplnou akci → objev kartu → zkus slovo vyslovit → zakonči výpravu → ukaž rodině úspěch. Výprava orientačně 5–8 minut, tempo určuje dítě. Nabízej jen dvě smysluplné další volby. Přestávka je přirozený konec, bez penalizace.

## První vydání: 8 kompletních výprav

1. **Doma v Iowě**: máma a táta, sbalení alba, helmy a svačiny; seznámení s ovládáním.
2. **Tajemství iowského jezera**: Romča vypravuje; výběr prutu, splávku a kbelíku, první ryba.
3. **Klárčin atlas malých tvorů**: louka, lupa, žížala, beruška a housenka; pozorování a vypuštění.
4. **Letíme do Příbrami**: cestovní mapa, ahoj/prosím/děkuji, příjezd k babi a dědovi.
5. **Dědova cyklodílna**: helma, kolo, barvy, jednoduché sestavení; bez komplikované fyziky.
6. **Romča a záhadný úlovek**: sbalení vybavení, krátká cyklotrasa, rybolov, legrační bota, kapr/okoun.
7. **Výprava za velkou rybou**: porovnávání velikostí, známé i nové předměty, druhá rybářská scéna; sumec/štika.
8. **Povím to babi**: zahrada, obrázkové pořadí zážitků, pojmenování a jednoduché věty, závěrečný rodinný odznak.

Rybářské varianty musí být výrazná část obsahu: vybavení, nástrahy, volba místa, nahazování, úlovek, porovnání, vypouštění, legrační předměty, sbírka. Živé tvory zobrazujeme laskavě; úlovek vracíme do vody. Mechanika nevyžaduje rychlou reakci ani časovaný hlas.

## Minnihry

- **Najdi podle hlasu:** 2–4 velké možnosti; první výběr bez pomoci zaznamenat odděleně od úspěchu po nápovědě.
- **Sbal a podej:** drag/drop nebo klepnutí předmět → klepnutí cíl. Vždy dvě rovnocenné cesty ovládání.
- **Rybolov:** ready → cast → waiting → bite → reel → reveal → identify → optional speech → release → summary. Klepnutí či krátký tah; záběr čeká na dítě, žádné promeškání. Opakované klepání nevygeneruje více úlovků.
- **Broučí průzkum:** odklopení listu/kamene, lupa, poznání tvora, karta, vypuštění. Pohyblivý cíl se při interakci zastaví.
- **Kolo:** pomalý pohyb po pevné trase, zastávky na jazyk; žádný nekonečný runner nebo náročné řízení.
- **Pověz příběh:** vyber obrázek, uslyš vzor, řekni slovo/větu, pokračuj. Žádný otevřený AI chat.

## Učení

Každý pojem má české a americké anglické slovo, názorný význam, vzorovou větu, audio ID, obrázek a úroveň. Nové pojmy nejdříve ukázat a pojmenovat. Postup EN vysvětlení + CZ slovo → CZ pokyn + volitelná EN pomoc → CZ krátká věta. Obě slovní formy jsou přehratelné, výchozí pořadí upřednostňuje češtinu.

Nevydávat znalost pozice za znalost slova: měnit umístění možností a při návratu jiný kontext. Mastery: unseen → introduced → recognized_with_help → recognized_independently → spoken_verified → recalled_later. Zachovat samostatné evidence, nikoli jediné lineární číslo. Pro recalled_later vyžadovat jinou výpravu a nový úkol, ne další kliknutí ve stejné kartě. Stupně nejsou klinické měření.

## Odměny a tempo

Malá radost po smysluplné akci, dekorace po výpravě, nová lokace po kapitole. Karty nepropadají, žádná ztráta streaku, placené lootboxy, nekonečné farmení ani odměny za pouhou dobu u obrazovky. Hlasový úspěch zlepšuje kartu, neblokuje základní obsah. Matyáš se nesrovnává s Adamem.

## Rodičovská část

Přehled skutečných důkazů učení, hlasových pokusů bez uloženého audia, aktivních výzev a předaných odměn. Nastavení češtiny/angličtiny, hlasitosti, animací, mikrofonu, lokální zálohy. Dospělá brána před změnou reálných odměn. Lokální PIN je ochrana před náhodným klikáním, nikoli bezpečnostní autentizace proti útočníkovi.
