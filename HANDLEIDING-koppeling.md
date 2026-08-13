# Koppeling met Google Sheets — installatie en gebruik

Fase 2 van de boekhoudapp: leerlingen bewaren hun werk centraal, dienen zelf
in wat ze willen laten nakijken, en zien jouw feedback terug in de app.

Alles draait onder **jouw** Google-account. Leerlingen loggen nergens in en
krijgen geen enkele toegang tot de Sheet of tot de map met werkbestanden.

---

> **Al geïnstalleerd en er is een nieuwe versie van `Code.gs`?**
> Doe dan drie dingen, in deze volgorde:
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

Maak in je Drive een nieuwe Google Sheet. Noem ze bijvoorbeeld
*Boekhoudapp — nakijken 2026*. Deel ze met niemand.

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

Verander bovenaan `SLEUTEL` in een eigen woord, bijvoorbeeld:

```js
var SLEUTEL = "CELINET";
```

Onthoud dat woord — je hebt het straks nog eens nodig.

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

Open `js/config-koppeling.js` en vul in:

```js
webAppUrl: "https://script.google.com/macros/s/AKfycbw46aLZg4tSWTJiiyoAiT7U1zlJr0Byzt0XV9gtq39GovUj7PW8W9ewW7JmB7mjXLLEwQ/exec",
sleutel: "CELINET",
```

Het woord bij `sleutel` moet **exact** hetzelfde zijn als in `Code.gs`.

### 7. Zet de namen in de app

Open `js/data-klas.js` en vul de namen in, zoals in kolom A van het tabblad
Klas:

```js
const KLASLIJST = [
  "Lotte V.",
  "Youssef B.",
];
```

**Alleen de namen.** De codes horen daar niet: dit bestand staat op GitHub
Pages en is door iedereen te lezen.

Zet daarna alles op GitHub zoals gewoonlijk. Klaar.

> Blijft `KLASLIJST` leeg, dan valt de app terug op het vrije naamveld van
> vroeger en werkt alles zonder codes. Handig zolang je met collega's test.

---

## Deel 2 — Hoe het werkt voor de leerling

**Aanmelden.** De leerling kiest de eigen naam uit de lijst en tikt de
persoonlijke code. Dat hoeft maar één keer per computer: de browser onthoudt
het.

**Bewaren.** Het werk blijft in de browser staan én gaat elke twee minuten
stilletjes naar een map in jouw Drive. Meldt een leerling zich later op een
andere computer aan, dan staat alles er weer. Verschilt wat er lokaal staat
van wat op de server staat, dan kiest de leerling zelf welke versie het wordt
— er wordt nooit zomaar overschreven.

**Indienen.** Met de knop *Indienen* kiest de leerling per categorie
(Aankopen, Verkopen, Financiële verrichtingen …) wat er nagekeken mag worden.
Wat niet aangevinkt is, blijft privé. Verrichtingen die nog niet geboekt zijn,
gaan wel mee met de vermelding *onafgewerkt*, zodat jij ziet waar iemand
vastloopt.

**Feedback.** Met de knop *Feedback ophalen* komt binnen wat jij vrijgegeven
hebt. Bij elke verrichting verschijnt een gekleurd kader met je oordeel en je
tekst, en in het menu links kleurt het bolletje mee. Eerdere ronden blijven
bewaard: onder de nieuwste feedback staat een knopje *Eerdere feedback* dat de
vorige opmerkingen weer toont.

**Controles per categorie.** Onder elke categorie staat in het menu een
pagina *Controle*. Daar vinken leerlingen zelf af wat ze nagekeken hebben,
vóór ze indienen. Klikken ze op *Indienen* terwijl er nog controles openstaan,
dan komt er een bevestigingsvenster dat dat zegt — maar het blokkeert niets.

Die afvinkjes komen mee in je Sheet, als een aparte regel per categorie
(`CONTROLE: Aankopen`). Zo zie je meteen of er zelf nagekeken werd.

**Klanten en leveranciers.** Die pagina staat in het menu bij de financiële
verrichtingen en gaat daar ook mee in bij het indienen. Er staan twee open
vragen op over de openstaande facturen.

---

## Deel 3 — Hoe het nakijken verloopt

### Waar je kijkt

In het tabblad **Inzendingen** staat één rij per verrichting, met de volledige
boeking leesbaar in de kolom *boeking*. Er wordt **nooit** een rij
overschreven: dient een leerling dezelfde verrichting opnieuw in, dan komt er
een nieuwe rij onderaan bij. Zo zie je de evolutie.

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

De werkbestanden staan in je Drive in de map **Boekhoudapp werkbestanden**,
als `werk_<naam>.json`. In de submap **versies** staan de vijf vorige versies
per leerling (hoogstens één kopie per uur).

Heeft een leerling iets kapotgeklikt: open het versiebestand, kopieer de
inhoud naar het gewone `werk_<naam>.json`, en laat de leerling zich opnieuw
aanmelden.

### Een leerling is de code kwijt

Kijk in het tabblad Klas. Je mag de code daar ook gewoon aanpassen.

### Een leerling komt erbij

Naam in kolom A van het tabblad Klas, dan **Codes genereren voor lege
vakjes**, en de naam ook in `js/data-klas.js` zetten.

### Wat als de wifi wegvalt

De app blijft gewoon werken: alles wordt in de browser bewaard en gaat naar de
server zodra er weer verbinding is. Bij het indienen en het ophalen van
feedback krijgt de leerling een duidelijk venster te zien — eerst "even
geduld", daarna of het gelukt is of niet.

### Opnieuw beginnen

De knoppen *Exporteren*, *Importeren* en *Alles wissen* bestaan niet meer: nu
alles centraal bewaard wordt, hebben ze geen nut. Moet een leerling toch
opnieuw beginnen, dan verwijder jij het bestand `werk_<naam>.json` uit de map
**Boekhoudapp werkbestanden** en laat je die leerling zich opnieuw aanmelden.

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
| `apps-script/Code.gs` | de serverkant, hoort in de Apps Script-editor die je opent via **Uitbreidingen → Apps Script** in je Sheet |
| `js/config-koppeling.js` | de web-app-URL en het sleutelwoord |
| `js/data-klas.js` | de namen in de keuzelijst (géén codes) |
| `js/koppeling.js` | alles wat de app met de Sheet doet |
| `js/app.js` | ongewijzigd van opzet; er is enkel een brug (`window.APP`) bijgekomen en een feedbackkader per verrichting |
