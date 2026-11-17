# Ověření aktualizace: příběhové questy a rodinná kniha

- Pět nových questů načítaných z JSON: Domov v Iowě, Školka doma, Domov u dědy a babi, Cyklistika s rodiči, Rybaření s Romčou.
- V prohlížeči dokončeno všech pět celých příběhů přes skutečné ovládací prvky, včetně obrázkových voleb, balení, broučího průzkumu, cyklistických zastávek a tří úlovků.
- Vyzkoušeno vytvoření pohlednice rodičem, její otevření přes URL fragment v rodinné knize, správné zobrazení pěti dokončených témat a samostatně poznaných pojmů. Žádná testovací data nejsou součástí sestavení.
- Vyzkoušeno samostatné anglické procvičování: babi získala jedno samostatně poznané slovo, děda zůstal na nule. Hlasové otázky a obrázkové nápovědy pro hovory se mění s tématem.
- 30 automatických testů v šesti souborech: původní učení/odměny/ukládání/audio/mikrofon; nově zachování rozehrané pozice pro každé téma, kompatibilita původních uložených her, validace obsahu, omezené pohlednice a render každého nového kroku v obou jazycích.
- Audio validátor ověřuje 392 skutečných MP3 se SHA-256 a délkou; 94 je nových. Všechny nové scény mají audionahrávku. Kompletní poslechová kontrola dospělým zůstává ručním krokem.
- Fyzický iPad/Safari není dostupný. Rozměrová kontrola v prohlížeči tuto platformní zkoušku nenahrazuje.
- Sledování postupu je rodičem sdílená pohlednice s časem vytvoření. Není to průběžná synchronizace. Anglické procvičování prarodičů a jejich pohlednice jsou lokální a nikdy nepřepisují Adamův save.

## Předchozí vydání — archiv ověření původních osmi kapitol

# Implementační kontrola — 17. listopadu 2026

Hratelná implementace používá původní grafiku, rodinný kánon a připravený obsah. Zdroj je v `app/src/`, veřejné sestavení v kořeni repozitáře. Historický preprodukční report popisuje dřívější stav, nikoli aktuální hru.

## Ověřené chování

- V prohlížeči přes skutečné ovládací prvky dokončeno všech osm kapitol; mapa následně ukázala **8/8** a atlas **36/36**.
- Vyzkoušena nesprávná odpověď, nápověda, správná odpověď, balení klepnutím na předmět a cíl, návrat po reloadu, opakování kapitoly a jazykové zastávky na kole.
- Průchod rybolovem od výbavy přes nához, čekání, záběr, přitažení, odhalení, poznání, dobrovolné mluvení a vypuštění. Česká výprava obsahuje zaručenou botu, kapra i okouna.
- Odkrytí listu, prohlédnutí tvora, ponechání v přírodě a následné poznání. Dědova dílna i obrázkové vyprávění mají dokončitelný průchod.
- Rodičovská brána před potvrzením konkrétního vysloveného slova; pečeť označená jako potvrzená dospělým. Testovací potvrzení byla provedena pouze v lokální QA hře, nejsou součástí publikovaného postupu.
- Aktivace testovací reálné odměny → splněné důkazy → potvrzení rodičem → předání. UI odstranilo možnost dalšího předání a ukázalo datum.
- Atlas, mapa, mluvní dialog, titulní obrazovka, herní scény a rodičovská část kontrolovány v Chromium při tabletových, desktopových a mobilních rozměrech. Žádné emoji nenahrazují ilustrace. V aktuálním průchodu bez chyb konzole.

## Automatické kontroly

22 testů ve čtyřech souborech:

- odlišení rozpoznání s pomocí od samostatného výkonu;
- oddělená evidence češtiny a angličtiny, unikátní slova;
- žádná pečeť za pouhý hlasový pokus;
- pozdější vybavení vyžaduje čas, novou session a jiný kontext;
- opakované callbacky a opakované výpravy nenásobí XP;
- uzamčené kapitoly, dokončení všech osmi výprav a ignorování zastaralých přechodů;
- snapshot odměny, nutné potvrzení, právě jedno předání;
- import staré zálohy neobnoví předanou odměnu;
- migrace schématu, poškozená záloha a odmítnutí falešné provider evidence;
- souběžné zápisy do IndexedDB a reload předané odměny;
- nepodporovaný/odmítnutý mikrofon a zastavení pozdě uděleného streamu po zavření dialogu;
- přerušení fronty řeči při odchodu, mute a zákaz anglického hlasu jako českého fallbacku.

TypeScript a ESLint kontrolují aplikaci a testy. Validátor přípravy ověřuje 15 zdrojových ilustrací, 36 pojmů, osm výprav a rodinný kánon. Herní validátor kontroluje přítomnost všech runtime obrázků a **298 skutečných MP3** včetně délky, velikosti a SHA-256. Produkční build obsahuje pouze skutečnou rodičovskou verifikaci; žádný mock hodnotící výslovnost.

## Grafika, audio a výkon

Runtime obrázky mají dohromady přibližně 6,22 MiB, proti přibližně 40 MiB původních PNG. Titulní stránka načítá cover a ovládací prvky, nikoli všechny scény a atlas. Obrázky a audio dalších obrazovek se načítají při použití. Font je self-hosted Nunito s českými znaky. Animace respektují klidný režim a systémové reduced motion; zvuk se zastaví při odchodu a skrytí stránky.

Zkontrolované rozměry: **1024×768, 1440×900, 390×844**. Snímky lokálního QA jsou v ignorované složce `art/review/browser/`; nejsou dokladem fyzického Safari testu.

## Výslovně neověřené hranice

- Fyzický iPad se Safari nebyl dostupný. Nelze tvrdit naměřených 30 fps na Adamově iPadu ani ověřené systémové povolení mikrofonu či instalaci na plochu. Pro produkci je nastaven JS target Safari 15, odemykání přehrávače gestem, podporovaný formát MediaRecorder se vybírá za běhu.
- Všechny nahrávky byly vyrobeny z českých a anglických scénářů, ale kompletní poslechová kontrola rodilým dospělým ještě neproběhla. Metadata to označují a rodičovská část žádá o kontrolu před samostatným hraním.
- Automatické hodnocení české dětské výslovnosti není zapnuté. Funkční alternativou je rodičovské ověření. Mikrofonový pokus se používá pouze k lokálnímu přehrání.
- Postup a odměny jsou místní. Import zachovává předání evidovaná na stejném zařízení; na jiném zařízení musí duplicitu zkontrolovat rodič. Vymazání dat prohlížeče nelze bez exportované zálohy obnovit.
- Offline cache obsahuje navštívené prostředky. Nejde o předstaženou kompletní offline knihovnu.

Tyto hranice se v UI ani dokumentaci nevydávají za dokončenou nezávislou výslovnostní validaci nebo fyzický test iPadu.
