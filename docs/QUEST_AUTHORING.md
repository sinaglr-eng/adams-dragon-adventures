> Verze 1.2: [Atlas dvou domovů](ATLAS_UPDATE.md) nyní nabízí sedm výprav. Nové questy se automaticky zobrazí pod domem podle `region`: `iowa` nebo `pribram`. Nová slovní zásoba musí obsahovat také `enPronunciationCs`.

# Příběhové questy a rodinná kniha

Aktuální zadání nahrazuje pevnou posloupnost osmi kapitol samostatnými tematickými questy. Původní kapitoly jsou v deníku zachovány kvůli postupu, odměnám a rozehraným uloženým hrám.

## Přidání tématu bez úpravy herního enginu

1. Zkopírujte jeden soubor z `content/quest-packs/` pod novým názvem. Registry automaticky načte všechny JSON soubory v této složce.
2. Použijte nové stabilní `id`, český `title`, anglický `titleEn`, `region`, pozadí a obsazení z manifestu. Máma a táta patří do Iowy; babi a děda do Příbrami. Romča je vypravěč.
3. Napište `tasks` jako pořadí krátkých příběhových scén a smysluplných aktivit. `narrative` obsahuje stabilní ID, český/anglický text, ilustraci `art` a akci `action`. Klepnutí vyvolá krátkou animaci a přejde na další scénu. Pro již publikovaný quest neměňte pořadí kroků; pro zásadně jiný děj vytvořte nové ID, aby se nerozbily rozehrané pozice.
4. Aktivita `learn` vysvětlí pojem a propojí anglické a české pojmenování. Navazující `find` vysloví české slovo a nechá dítě vybrat obrázek. `options` musí obsahovat cíl a dva až čtyři různé obrázky. Čtení není potřeba. Pomoc se eviduje odděleně.
5. Další podporované aktivity: `pack`, `fishing`, `discover`, `cycle`, `assemble`, `story`, `compare`. `cycleWords` určuje tři jazykové zastávky. Volitelné `background` a `cast` na kroku přepínají konkrétní scénu. Pro scénu nepoužívejte obrázky s nesprávnou rodinou.
6. `callPrompts` jsou české a anglické otázky nebo pozvánky k povídání pro prarodiče. Používejte otázky k reálnému ději, ne hodnocení dítěte.
7. Do `content/story-audio.json` přidejte repliky `title.<quest>.<cs|en>`, `story.<quest>.<scene>.<cs|en>` a `call.<quest>.<index>.<cs|en>`. Vyrobte MP3 se stejným ID v `game-assets/audio/` a doplňte metadata do `content/audio-batches/all.json`. Zachovejte nahrávky jako součást repozitáře, žádný API klíč v aplikaci. Před vydáním je musí poslechnout dospělý.
8. Spusťte `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm game:validate`. Ověřte obrázkové volby i všechny rodinné scény v prohlížeči. Potom `pnpm publish:prepare` a obvyklé vydání na stávající GitHub Pages.

Pojmy musejí existovat v `content/vocabulary.json` včetně české a anglické nahrávky, vysvětlení, věty a obrázku. Validátor odmítá neznámé pojmy, opakované obrázkové možnosti, chybějící správnou volbu, nesprávné lokace rodiny i poškozené scény. Automatický render test projde každý nový krok v obou jazycích.

## Nové questy

| Quest | Příběh | Jazykové cíle |
|---|---|---|
| Domov v Iowě | Adam, rodiče a Matyáš; oceán a dva jazyky; společná svačina | ahoj, jablko, hrnek, prosím, děkuji |
| Školka doma | Máma s dětmi třídí barvy a velikosti, pak pozorují berušku | červená, modrá, velký, malý, list, beruška |
| Domov u dědy a babi | Návštěva Příbrami, zalévání, svačina a obrázkové vyprávění | ahoj, konvička, prosím, hrnek, jablko, děkuji |
| Cyklistika s rodiči | Příprava v Iowě, helma, svačina, tři zastávky a návrat | kolo, helma, jablko, červená, modrá, list |
| Rybaření s Romčou | Romča a Klárka u rybníka, výbava, ryba, záhadná bota a kapr | prut, podběrák, žížala, ryba, bota, kapr |

Nové questy jsou dostupné samostatně. Rozpracovaná pozice se uchová pro každé téma. Příběhová animace sama nezvyšuje znalost slova ani neuděluje hlasovou pečeť.

## Babi a děda

Přímý vstup: `https://sinaglr-eng.github.io/adams-dragon-adventures/#grandparents`.

- **Adamův příběh:** přehled z rodičem poslané pohlednice, datum vytvoření, dokončené/rozehrané questy a konkrétní pojmy. Rozlišuje se seznámení, poznání s pomocí, samostatné poznání a dospělým potvrzené mluvení.
- **Učíme se anglicky:** české vysvětlení → anglický vzor → poslech a výběr obrázku. Babi a děda mají oddělené lokální počty samostatně poznaných slov. Ty nemění Adamova data ani odměny.
- **Připravit si volání:** dvojjazyčné otázky s audionahrávkami a obrázkové nápovědy odpovídající tématu. Nejde o vestavěnou videokonferenci.

## Sdílení a ochrana dat

Rodič v části **Pro rodiče → Babi a děda** vytvoří pohlednici a sám odešle odkaz nebo JSON soubor. Přehled se sám neaktualizuje. Odkaz obsahuje pouze whitelist: verzi, čas vytvoření, ID questů, stav, krok a agregované stupně pojmů. Žádné nahrávky, záznamy jednotlivých odpovědí, interní session ID nebo reálné odměny. Pohlednice nikdy nepřepisuje dětský save.

Data jsou v URL fragmentu za `#`, který prohlížeč neodesílá jako součást HTTP požadavku. Nejde o šifrování: kdokoli s odkazem může přehled otevřít. Odkaz proto posílejte jen rodině. Rodinná část si ověřenou pohlednici uloží na daném zařízení a zobrazí její datum; starší import nepřepíše novější. Úplná záloha hry je jiný formát a není do rodinné části přijata.

Automatická synchronizace mezi iPadem a zařízeními prarodičů není součástí této varianty. Vyžaduje soukromé úložiště a párování zařízení; veřejný GitHub není úložiště dětského postupu.
