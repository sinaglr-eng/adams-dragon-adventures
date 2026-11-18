# Atlas dvou domovů — verze 1.2

Rozevřená obrázková kniha má dvě klikací mapové stránky: Iowa (USA) a Příbram (Česko). Jde o stylizovanou herní mapu, ne přesný geografický plán. Dům s rodiči otevírá iowské příběhy, dům prarodičů české. Romča představuje výběr hlasem. Velký obrázek příběhu spustí quest; samostatný reproduktor přečte název. Mapa má klávesnicové ovládání, viditelné zaměření a návrat z nabídky výprav.

## Obsah

- Iowa: Domov v Iowě, Školka doma, Cyklistika s rodiči, **Svačina za dolary**.
- Příbram: Domov u dědy a babi, Rybaření s Romčou, **S babi pro svačinu**.
- Nové výpravy střídají krátké příběhové situace, vysvětlení významu a obrázkový výběr podle českého poslechu. Obě vysvětlují rozdíl dolar/koruna i stejný význam zdvořilých slov ve dvou jazycích.
- Peníze mají jednoduché herní symboly: zelená dolarová bankovka a stříbrná korunová mince. Nejsou to reprodukce platidel; neuvádíme ceny ani kurz. Vypravěč výslovně říká, že jedna koruna není stejná hodnota jako jeden dolar a že obě měny mají mince i bankovky.
- Všech pět původních aktivních příběhů má hovorové Romčovy repliky. Texty nejsou hlasovým klonem skutečného Romči. Nadšené „jdeme!“ nikdy nespouští časový limit.
- Původní pořadí kroků, jejich ID a herní mechaniky se nemění. Nový obsah má nová quest ID; staré uložené pozice a odměny zůstávají kompatibilní.

Měnové údaje ověřeny v [USAGov — American money](https://www.usa.gov/currency), [U.S. Currency Education Program](https://www.uscurrency.gov/denominations/index.html) a [ČNB — zákon o České národní bance, § 13](https://www.cnb.cz/export/sites/cnb/en/legislation/.galleries/acts/act_on_cnb.pdf). Bez tvrzení o aktuálním směnném kurzu.

## Poslech a výslovnost

Centrální přehrávač automaticky rozvine každý cílový klip `word.*.cs` na normální ukázku, 1,6 sekundy prostoru, pomalejší ukázku (76 % rychlosti při zachování výšky hlasu) a 2,2 sekundy prostoru pro vlastní pokus. Vysvětlující učicí krok předem řekne „Repeat after me“ v anglickém režimu. Anglické cílové slovo se neduplikuje. Text vysvětlení a příběhu se neopakuje celý; opakují se oddělené slovníkové vzory.

Nový poslech, navigace, pauza nebo vypnutí zvuku zruší i čekající časovač. Chybějící české audio se nikdy nenahrazuje anglickým hlasem. Pomalá rychlost platí i pro označený český hlas zařízení při náhradním přehrávání.

Babi a děda mají u všech 38 anglických hesel přibližný český přepis v lekci, po odpovědi, na pohlednici a u obrázků k hovoru. Přepis není IPA ani přesná náhrada zvuku; rozhraní vysvětluje zejména „th“ a anglické „r“. Vlastní učení prarodičů zůstává oddělené od Adamova postupu. Sdílení je stále datovaná rodičovská pohlednice, nikoli živá synchronizace.

## Grafika

Schválené rodinné podoby jsou použity jako osm samostatných draků a deset Adamových herních póz. Původní PNG zůstávají zachované. `art/atlas-manifest.json` eviduje nové zdroje, kontrolní součty a výřezy; `tools/build-atlas-art.mjs` přepíše pouze odvozené runtime obrázky. Nový mapový podklad je `art/source/atlas-two-homes.png`. Podklady vznikly vestavěným image_gen; prompty jsou v `art/atlas-prompts.json`. Rodinné fotografie nejsou součástí repozitáře.

## Ověření a hranice

Testy kontrolují oddělení regionů, ukládání postupu, obrázkové volby, všechny příběhové kroky, dávkování normální/pomalé výslovnosti a zrušení opakování při navigaci. Build kontroluje kontrolní součty MP3 a grafické zdroje. Nové zvukové soubory používají stejné dva syntetické hlasy jako předchozí vydání.

Kontrola v prohlížeči ověřuje rozměry tabletu a telefonu. Skutečný iPad Safari a kompletní poslech rodilým dospělým zůstávají manuální kontrolou. Výslovnost dítěte se automaticky nehodnotí.
