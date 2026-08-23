# Koppeling met Google Sheets — installatie en gebruik

Fase 2 van de boekhoudapp: leerlingen bewaren hun werk centraal, dienen zelf
in wat ze willen laten nakijken, en zien jouw feedback terug in de app.

Alles draait onder het Google-account van de vakexpert. Leerlingen loggen
nergens in en krijgen geen enkele toegang tot de Sheet of tot de map met
werkbestanden.

---

## Drie vestigingen, één app

De app zelf staat **één keer** op GitHub Pages. Elke vestiging (LEU, SKW, TW)
heeft daarnaast:

- een **eigen Google Sheet** met een eigen kopie van `Code.gs`, in de Drive van
  de collega die daar nakijkt;
- een **eigen publicatie** van dat script (dus een eigen web-app-URL);
- een **eigen klaslijst** in `js/data-klas.js`.

De leerling kiest bovenaan de app eerst de school en dan de eigen naam. Alles
wat daarna vertrekt, gaat naar de Sheet van díé vestiging.

De werkbestanden komen wél **samen in één map op de gedeelde Drive**. Ze zijn
uit elkaar te houden aan de naam: `werk_LEU_lottev.json`,
`werk_TW_amalt.json`. Twee dingen moeten daarvoor kloppen in elke Code.gs:

```js
var VESTIGING = "LEU";        // LEU, SKW of TW
var MAP_ID_GEDEELD = "…";     // het ID van de gedeelde map
```

Het ID van de map vind je in de adresbalk als je die map in Drive opent: het
stuk na `/folders/`. Iedereen die een Sheet beheert, moet bewerkrechten op die
map hebben.

> Nakijken doet elke collega in de eigen Sheet. Wie mee wil kijken bij een
> andere vestiging, opent die Sheet — daar is geen aparte instelling voor
> nodig.

### Hoe de mappen horen te staan

Je hebt er precies twee nodig:

```
Boekhoudapp werkbestanden        ← het ID hiervan zet je in MAP_ID_GEDEELD
├── werk_LEU_lottev.json         ← het werk van elke leerling
├── werk_TW_amalt.json
└── versies                      ← maakt het script zelf aan; de back-ups
    └── werk_LEU_lottev_20260823-1015.json
```

Belangrijk: *versies* is een **submap ván** de werkmap, niet een map ernaast.
Staat ze ernaast, dan ziet het script ze niet en maakt het er zelf een tweede
aan. Hoofdletters maken niet uit: *Versies* en *versies* zijn dezelfde map.

Waar die werkmap zelf staat, mag je kiezen. Zet je haar in de map waar ook je
nakijk-Sheets en handleidingen staan, dan blijft dat overzichtelijk: één
submap voor de app, de rest voor jezelf.

### Een bestaande map naar de gedeelde Drive brengen

Een **map** verhuizen van *Mijn Drive* naar een gedeelde Drive laat Google
meestal niet toe. **Losse bestanden** verhuizen mag wel. Dus:

1. Maak op de gedeelde Drive zelf een nieuwe map *Boekhoudapp werkbestanden*.
2. Open de oude map in Mijn Drive, selecteer alle bestanden (Ctrl+A) en
   verplaats ze naar de nieuwe map. Doe hetzelfde met de inhoud van de submap
   *versies* (maak die submap eerst opnieuw aan in de nieuwe map).
3. Zet het ID van de nieuwe map in `MAP_ID_GEDEELD` in elke `Code.gs`,
   implementeer een nieuwe versie, en controleer met **Boekhoudapp → Waar
   staan de werkbestanden?**

Lukt het verplaatsen van de bestanden ook niet, dan is dat geen ramp: laat de
nieuwe map gewoon leeg beginnen. Het werk van de leerlingen staat óók in hun
eigen browser en gaat bij de volgende bewaarbeurt vanzelf naar de nieuwe map.
Enkel wie intussen van computer wisselt, verliest wat er nog niet
gesynchroniseerd was.

> **Controleren waar het script schrijft:** menu **Boekhoudapp → Waar staan de
> werkbestanden?**. Dat toont de naam en het adres van de map die dit script
> écht gebruikt, en hoeveel werkbestanden van deze vestiging er al staan.

Wat hieronder staat, doorloop je dus **één keer per vestiging**.

---

> **Al geïnstalleerd en er is een nieuwe versie van `Code.gs`?**
> Kijk na het plakken altijd na of `SLEUTEL`, `VESTIGING` en
> `MAP_ID_GEDEELD` nog ingevuld staan zoals bij jou — die staan in de code
> zelf en gaan bij een nieuwe versie dus mee verloren. Doe daarna drie dingen,
> in deze volgorde:
> 1. Plak de nieuwe code in **Uitbreidingen → Apps Script** en bewaar.
> 2. **Implementeren → Implementaties beheren → potlood → Versie: Nieuwe
>    versie → Implementeren.** Zonder die stap blijft de oude code draaien.
>    De URL verandert niet.
> 3. Menu **Boekhoudapp → Eerste installatie** opnieuw uitvoeren. Je gegevens
>    blijven staan; enkel de keuzelijst en de kleuren worden bijgewerkt.
>    Rijen die er al stonden, houden hun oude keuzelijst — bij testwerk mag
>    je die gewoon verwijderen.

## Deel 1 — Eenmalig installeren (ongeveer een kwartier)

### 1. Maak de Google Sheet

Maak in je Drive een nieuwe Google Sheet. Zet de vestiging in de naam, dan
zoek je niet: *Boekhoudapp — nakijken LEU 2026*. Delen hoeft niet.

### 2. Plak het script

Open je Sheet en ga naar **Uitbreidingen → Apps Script**. Er opent een nieuw
tabblad met een code-editor. Wis wat daar staat en plak de volledige inhoud
van `apps-script/Code.gs`. Bewaar (het diskettepictogram).

> **Hoe hangt dat script aan mijn Sheet vast?**
> Automatisch, en je hoeft daar niets voor in te vullen. Open je Apps Script
> *vanuit* een Sheet, dan maakt Google een script dat aan díé Sheet
> vastgeklonken zit: het staat niet los in je Drive, maar leeft in het
> spreadsheet zelf. Daarom weet de code zonder adres of ID welke Sheet ze
> moet gebruiken. Bij stap 3 zie je meteen of het gelukt is.

Vul bovenaan drie dingen in:

```js
var SLEUTEL = "CELINET";      // hetzelfde woord voor de drie vestigingen mag
var VESTIGING = "LEU";        // LEU, SKW of TW — de vestiging van déze Sheet
var MAP_ID_GEDEELD = "";      // het ID van de gedeelde map met de werkbestanden
```

Onthoud het sleutelwoord en de vestigingscode — die heb je straks nog eens
nodig. Laat je `MAP_ID_GEDEELD` leeg, dan maakt het script een map in de eigen
Drive van dit account; dat is handig om te testen, maar dan staat het werk van
deze vestiging niet bij de rest.

### 3. Maak de tabbladen aan

Ga terug naar het tabblad van je Sheet en **herlaad de pagina** (F5). Bovenaan,
naast *Uitbreidingen* en *Hulp*, verschijnt een nieuw menu **Boekhoudapp**.

Dat menu is meteen je bewijs dat de koppeling klopt. Zie je het niet, wacht dan
even en herlaad nog eens; blijft het weg, dan is de code in een los script
terechtgekomen — open dan je Sheet en ga opnieuw via **Uitbreidingen → Apps
Script**.

Kies **Boekhoudapp → Eerste installatie**.

Google vraagt de eerste keer om toestemming. Klik door
*Geavanceerd → Ga naar … (onveilig)*. Dat woord "onveilig" slaat er enkel op
dat het script niet door Google nagekeken is — het is jouw eigen script.

Je krijgt nu drie tabbladen: **Klas**, **Inzendingen** en **Detail**.

### 4. Vul je klaslijst in

In het tabblad **Klas**, kolom A: de namen van je leerlingen, één per rij.

Daarna: menu **Boekhoudapp → Codes genereren voor lege vakjes**. Elke leerling
krijgt een unieke viercijferige code. Die deel je één keer uit; leerlingen
hebben ze alleen nodig op een computer waar ze nog niet eerder werkten.

### 5. Publiceer het script als web-app

Ga terug naar het tabblad met de code-editor (of opnieuw via **Uitbreidingen →
Apps Script**) en klik rechtsboven op **Implementeren → Nieuwe implementatie**.

- Type: **Web-app** (klik op het tandwiel naast *Type selecteren*)
- Uitvoeren als: **Ik** (jouw adres)
- Wie heeft toegang: **Iedereen**

Klik op *Implementeren* en kopieer de **web-app-URL**. Die eindigt op `/exec`.

> "Iedereen" klinkt eng, maar betekent hier: iedereen mag het script
> *aanspreken*. Wat het script teruggeeft, hangt af van de naam en de code die
> meegestuurd worden. Zonder juiste code krijgt niemand iets te zien. Zou je
> "Iedereen binnen de school" kiezen, dan zou Google elke leerling eerst naar
> een inlogscherm sturen en dat werkt niet vanuit de app.

### 6. Zet de gegevens in de app

Open `js/config-koppeling.js` en vul bij de juiste vestiging de URL in:

```js
const VESTIGINGEN = [
  {
    code: "LEU",
    naam: "Leuven",
    webAppUrl: "https://script.google.com/macros/s/AKfy…/exec",
    sleutel: "CELINET",
  },
  { code: "SKW", naam: "SKW", webAppUrl: "", sleutel: "CELINET" },
  { code: "TW",  naam: "TW",  webAppUrl: "", sleutel: "CELINET" },
];
```

De `code` moet **exact** overeenkomen met `VESTIGING` in de `Code.gs` van die
vestiging, en het woord bij `sleutel` met `SLEUTEL` daar. Bij `naam` zet je
wat de leerling in de keuzelijst ziet.

> Staat er maar één vestiging in de lijst, dan verdwijnt de keuzelijst en ziet
> de leerling meteen de namenlijst — zoals vroeger.

### 7. Zet de namen in de app

Open `js/data-klas.js` en vul de namen in per vestiging, zoals in kolom A van
het tabblad Klas van die Sheet:

```js
const KLASLIJSTEN = {
  LEU: [
    "Lotte V.",
    "Youssef B.",
  ],
  SKW: [],
  TW: [],
};
```

**Alleen de namen.** De codes horen daar niet: dit bestand staat op GitHub
Pages en is door iedereen te lezen.

Zet daarna alles op GitHub zoals gewoonlijk. Klaar.

> Blijft de lijst van een vestiging leeg, dan valt de app voor die vestiging
> terug op het vrije naamveld van vroeger en werkt alles zonder codes. Handig
> zolang je met collega's test.

---

## Deel 2 — Hoe het werkt voor de leerling

**Aanmelden.** De leerling kiest eerst de school, dan de eigen naam uit de
lijst, en tikt de persoonlijke code. Dat hoeft maar één keer per computer: de
browser onthoudt het.

**Bewaren.** Het werk blijft in de browser staan én gaat elke twee minuten
stilletjes naar een map in jouw Drive. Meldt een leerling zich later op een
andere computer aan, dan staat alles er weer. Verschilt wat er lokaal staat
van wat op de server staat, dan kiest de leerling zelf welke versie het wordt
— er wordt nooit zomaar overschreven.

**Indienen.** Met de knop *Indienen* kiest de leerling per categorie
(Aankopen, Verkopen, Financiële verrichtingen …) wat er nagekeken mag worden.
Naast elke categorie staan twee tellers op dezelfde noemer: hoeveel
verantwoordingsstukken er geboekt zijn, en hoeveel er al in orde bevonden zijn
(bv. 7/9 en 6/9).
Wat niet aangevinkt is, blijft privé. Verrichtingen die nog niet geboekt zijn,
gaan wel mee met de vermelding *onafgewerkt*, zodat jij ziet waar iemand
vastloopt.

**Feedback.** Met de knop *Feedback ophalen* komt binnen wat jij vrijgegeven
hebt. Bij elke verrichting verschijnt een gekleurd kader met je oordeel en je
tekst, en in het menu links kleurt het bolletje mee. Eerdere ronden staan er
gewoon onder — niets om open te klikken.

**Controles per categorie.** Onder elke categorie staat in het menu een
pagina *Controle*. Daar vinken leerlingen zelf af wat ze nagekeken hebben,
vóór ze indienen. Klikken ze op *Indienen* terwijl er nog controles openstaan,
dan komt er een bevestigingsvenster dat dat zegt — maar het blokkeert niets.

**Een boeking heropenen.** De vinkjes blijven dan staan. Wel wordt die
categorie gemarkeerd: bovenaan de controlepagina komt een oranje kader ("je
hebt hier iets gewijzigd na het afvinken") met een knop *Ik heb ze opnieuw
nagekeken*, en bij het indienen wordt dezelfde vraag nog eens gesteld. Vroeger
gingen álle vinkjes uit bij één heropening; dat was zoveel werk dat er blind
opnieuw geklikt werd.

Die afvinkjes blijven bij de leerling: ze komen **niet** in je Sheet terecht.
Het is zelfcontrole, geen nakijkwerk.

**Klanten en leveranciers.** Die pagina staat in het menu bij de financiële
verrichtingen en gaat daar ook mee in bij het indienen. Er staan twee open
vragen op over de openstaande facturen.

---

## Deel 3 — Hoe het nakijken verloopt

### Waar je kijkt

In het tabblad **Inzendingen** staat één rij per verrichting, met de volledige
boeking in de kolom *boeking* — één boekingslijn per regel, zoals in een
dagboek:

```
704000  22.000  C
451100   4.320  C
400000  26.320  D  [winkel]
```

Dus: rekening, bedrag, debet of credit, en achteraan tussen haakjes de klant
of leverancier als die ingevuld is. Voor het gewone nakijken heb je het
tabblad *Detail* dus niet meer nodig.

Er wordt **nooit** een rij overschreven: dient een leerling dezelfde
verrichting opnieuw in, dan komt er een nieuwe rij onderaan bij. Zo zie je de
evolutie.

### De filter die je elke keer gebruikt

Klik op het filterpictogram in de kopregel en filter op:

- **is laatste** = `JA` — enkel de nieuwste versie van elke verrichting
- eventueel **beoordeling** = leeg — enkel wat je nog niet bekeken hebt

Dat is je werklijst. Zonder die filter kijk je ook naar oude inzendingen.

### Wat je invult

- **beoordeling** — keuzelijst met drie mogelijkheden, gelijk aan de
  afspraken met de collega's in Classroom. De cel kleurt mee, en die kleur
  komt ook in het menu links in de app terecht:

  | beoordeling | kleur | gevolg in de app |
  |---|---|---|
  | In orde | groen | de verrichting gaat op slot |
  | Te remediëren | oranje | de leerling kan verder werken |
  | Niet afgerond | rood | de leerling kan verder werken |

- **feedback** — je tekst voor de leerling. Mag leeg blijven als het oordeel
  volstaat.

> **"In orde" heeft gevolgen.** Zo'n verrichting kan de leerling niet meer
> wijzigen, en ze wordt niet meer meegestuurd bij een volgende inzending. Zo
> kijk je nooit twee keer hetzelfde na. Eén uitzondering: de naam van de
> klant of leverancier blijft aanpasbaar, want die kijk jij niet na — dat
> doet de leerling zelf via de vragen op het tabblad Klanten &
> leveranciers.

### Vrijgeven

De leerling ziet nog niets zolang het vinkje **klaar** uit staat. Je kan dus
gerust over meerdere dagen werken.

Ben je klaar met een leerling: zet je cursor op eender welke rij van die
leerling en kies **Boekhoudapp → Feedback vrijgeven voor deze leerling**. Alle
nieuwste rijen waar een oordeel of een tekst bij staat, worden in één klik
vrijgegeven. Rijen zonder oordeel blijven onaangeroerd.

Iets te vroeg vrijgegeven? **Feedback intrekken voor deze leerling** zet het
weer uit.

### Het tabblad Detail

Daar staat elke boekingslijn apart: bedrag, rekening, D/C, relatie, en ook de
denkkolommen (redenering, A/P/K/O, stijgt/daalt). Handig als je wil uitpluizen
hoe iemand tot een boeking gekomen is. Voor het gewone nakijken heb je het
niet nodig.

---

## Deel 4 — Praktische zaken

### Werk terugzetten

De werkbestanden van de drie vestigingen staan samen in de gedeelde map, als
`werk_<vestiging>_<naam>.json` — bijvoorbeeld `werk_LEU_lottev.json`. De naam
is de naam van de leerling zonder hoofdletters, spaties en leestekens. In de
submap **versies**, die het script zelf aanmaakt ín die map, staan de vijf
vorige versies per leerling (hoogstens één kopie per uur).

> Het script **leest** nooit uit *versies*: dat is een archief. Een bestand
> daar neerzetten doet dus niets.

Heeft een leerling iets kapotgeklikt, gebruik dan **Boekhoudapp → Werk
terugzetten uit een versie…**. Je tikt de naam van de leerling, het script
zoekt de nieuwste bewaarde versie, zet het huidige werk eerst als extra versie
apart en schrijft de oude versie terug. Laat de leerling zich daarna opnieuw
aanmelden; heeft ze op die computer nog ander werk staan, dan vraagt de app
welke versie het wordt — ze kiest dan *het werk van de server*.

Wil je het met de hand doen: kopieer de inhoud van het versiebestand naar
`werk_<vestiging>_<naam>.json` in de gewone map. Het bestand moet **exact** zo
heten, anders vindt het script het niet.

### Een leerling is de code kwijt

Kijk in het tabblad Klas. Je mag de code daar ook gewoon aanpassen.

### Een leerling komt erbij

Naam in kolom A van het tabblad Klas van jouw vestiging, dan **Codes genereren
voor lege vakjes**, en de naam ook bij de juiste vestiging in
`js/data-klas.js` zetten.

### Wat als de wifi wegvalt

De app blijft gewoon werken: alles wordt in de browser bewaard en gaat naar de
server zodra er weer verbinding is. Bij het indienen en het ophalen van
feedback krijgt de leerling een duidelijk venster te zien — eerst "even
geduld", daarna of het gelukt is of niet.

### Opnieuw beginnen

De knoppen *Exporteren*, *Importeren* en *Alles wissen* bestaan niet meer: nu
alles centraal bewaard wordt, hebben ze geen nut. Moet een leerling toch
opnieuw beginnen, dan verwijder jij het bestand
`werk_<vestiging>_<naam>.json` uit de gedeelde map en laat je die leerling
zich opnieuw aanmelden.

### Hoe veilig is dit

- Alleen jij kan bij de Sheet en bij de Drive-map.
- Leerlingen kunnen niet bij elkaars werk: het script geeft alleen terug wat
  bij hun eigen naam én code hoort.
- Het woord bij `sleutel` staat in publiek leesbare code. Het is een drempel
  tegen toevallige rommel, geen wachtwoord. De echte afscherming zijn de
  persoonlijke codes en het feit dat de Sheet van jou alleen is.
- Wie de code van een klasgenoot kent, kan dat werk openen. Dat is het
  niveau van "iemand vertelt een wachtwoord door" — de codes zijn niet
  bedoeld om examenfraude tegen te houden.

### Als je iets aan de code wijzigt

Na elke wijziging in `Code.gs` moet je **Implementeren → Implementaties
beheren → potlood → Versie: Nieuwe versie → Implementeren** doen. Anders blijft
de oude versie draaien. De URL blijft dan wel dezelfde.

---

## Wat waar staat

| Bestand | Waarvoor |
|---|---|
| `apps-script/Code.gs` | de serverkant, hoort in de Apps Script-editor die je opent via **Uitbreidingen → Apps Script** in je Sheet; bovenaan staan `VESTIGING` en `MAP_ID_GEDEELD` |
| `js/config-koppeling.js` | de drie vestigingen: code, naam, web-app-URL en sleutelwoord |
| `js/data-klas.js` | de namen in de keuzelijst, per vestiging (géén codes) |
| `js/koppeling.js` | alles wat de app met de Sheet doet |
| `js/app.js` | ongewijzigd van opzet; er is enkel een brug (`window.APP`) bijgekomen en een feedbackkader per verrichting |
