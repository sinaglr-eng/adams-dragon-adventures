# Mluvení a rodinné odměny

## Co uznáváme

Slovo vyslovené dítětem je samostatný výkon. Kliknutí, zobrazení správného textu v přepisu, hlasitý zvuk, confidence ASR nebo rodičem odemčený mikrofon samy neprokazují správnou výslovnost. Ověřená pečeť vyžaduje potvrzení dospělým nebo validovanou službu skutečného hodnocení cílového jazyka. Dostatečná srozumitelnost se posuzuje s ohledem na věk a jazykové zázemí, bez slibu logopedické diagnostiky.

## Funkční režimy

**S dospělým:** přehrát vzor → dítě řekne → dospělý potvrdí konkrétní slovo/větu za rodičovskou bránou → evidence source=parent. Funguje bez mikrofonu i bez serveru. Základní režim první verze.

**Zkus si to:** opt-in mikrofon, vizualizace vstupu, krátké lokální přehrání. Veřejný text „Zkusil jsi to!“; ne „Výslovnost je správná“. Po skončení stream zastavit a audio zahodit. Žádné tiché cloudové rozpoznávání.

**Ověření službou:** pouze skutečně dostupná služba pro požadovaný jazyk a věk, otestovaná na jednotlivých slovech i frázích. Obecný anglický pronunciation endpoint není automaticky vhodný pro české pětileté dítě. API secrets pouze server-side. Před zapnutím rodiči jasně sdělit, kam audio odchází a jak dlouho je uloženo. Bez souhlasu nepoužívat.

## Stavy a repliky

| Stav | Dětská replika | Výsledek |
|---|---|---|
| verified | „To slovo už umíš říct! Karta má novou pečeť.“ | Ověřený mluvní důkaz, max jednou pro daný milestone |
| needs_help | „Poslechneme si to spolu. Ryba.“ | Nabídka vzoru a dalšího pokusu |
| uncertain / no_speech | „Neslyšel jsem tě dobře. Zkusíme to, nebo půjdeme dál?“ | Žádný chybný zápis neúspěchu ve znalosti |
| unsupported / denied | „Můžeš to říct někomu doma. Teď můžeme pokračovat.“ | Funkční režim s rodičem a skip |
| network_error | „Teď to spolu neověříme. Karta ti zůstává.“ | Zachovat úlovek, pozdější pokus |

## Pravidla důkazů

- Záznam má conceptId, targetLanguage, utteranceTarget, assistance, sessionId, questId, timestamp a source. U validated_provider také verzi poskytovatele/modelu a jen potřebný výsledek, ne audio.
- Opakování stejného callbacku stejným eventId nic znovu neudělí.
- „Později“ znamená jinou výpravu/úkol a další session; nepoužívej jeden refresh jako důkaz dlouhodobé znalosti. Pro časové návraty může rodič požadovat další kalendářní den, ale není časový deadline ani streak.
- Rodičovské potvrzení nelze provést velkým tlačítkem uvnitř dětského hlasového dialogu bez dospělé brány.
- Ukazuj původ ověření rodiči; neprezentuj rodičovský klik jako nezávislý AI test.

## Reálné odměny

Stavy: unconfigured → active → earned → parent_confirmed → redeemed. Herní odznak může existovat bez skutečné odměny. Při aktivaci se uloží snapshot požadavků a odměny. Dítě vidí jen skutečně domluvenou odměnu.

Rodič může zvolit Hot Wheels, Pokémon kartičky, dobrotu, společné rybaření, cyklovýlet, pečení nebo vlastní popis. Hra neobjednává výrobky, neposílá rodině automatické zprávy a nepředstírá předání. Dospělý nejprve ověří úspěch a až po skutečném předání stiskne „Odměna předána“.

Jedna challenge instance má jeden redemptionId. Transakční uložení musí odolat dvojkliku/refreshi. Reset/save import nesmí skrýt riziko opětovného vyzvednutí; v lokální variantě je rodič konečný rozhodovatel. Úspěchy nikdy neztrácíme kvůli absenci. Odměny nejsou za nasbírané minuty u obrazovky.

## Zdroje ověřené při přípravě

- [MDN: SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) — omezená podpora, možnost serverového zpracování, offline nelze všeobecně předpokládat.
- [Tepperman et al.: Pronunciation verification of children's speech](https://www.isca-archive.org/interspeech_2006/tepperman06_interspeech.html) — náročnost ověřování dětské výslovnosti; historický výzkum není benchmark dnešního poskytovatele.
- [ASHA: Learning More Than One Language](https://www.asha.org/public/speech/development/learning-more-than-one-language/) — příležitosti oba jazyky slyšet a používat.
- [Phaser: Scenes](https://docs.phaser.io/phaser/concepts/scenes) a [Scale Manager](https://docs.phaser.io/api-documentation/class/scale-scalemanager) — podklad návrhu scén; při implementaci ověř odpovídající major verzi API.
