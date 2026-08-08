# Boekhoudapp Kern 8 — De MET

Statische webapp (HTML/CSS/JS, geen build-stap, geen installatie) waarmee
leerlingen van de 3e graad Economie (D) de basisverrichtingen
inboeken op basis van verantwoordingsstukken, met permanent zichtbare
T-rekeningen. Zie `Boekhoudapp - specificatie.md` voor de volledige
opdracht waaruit deze app gebouwd is.

## Structuur

```
index.html               app-schil (header, voortgangsbalk, navigatie, hoofdvenster, T-panel)
css/style.css             opmaak — kleuren staan bovenaan als variabelen
js/mar.js                 de rekeningen van het MAR (wijzigt zelden)
js/data-mar-indeling.js   klassen en rubrieken van het MAR — voedt de filters
js/data-opdrachten.js     lijst van opdrachten (AK01, VK03, …) — per jaar aan te passen
js/data-relaties.js       lijst klanten/leveranciers voor 400000/440000 — per jaar aan te passen
js/data-controles.js      controlevragen, laatste afschrift, afwijkende saldokanten
js/data-balans.js         de vakken van de eindbalans en de resultatenrekening
js/data-info.js           de teksten achter de i-icoontjes
js/app.js                 alle logica — hoeft normaal niet aangepast te worden
documenten/                afbeeldingen van de verantwoordingsstukken (zie documenten/README.md)
```

### Waar pas je wat aan?

- **Een controlevraag anders formuleren, of er rekeningen bij zetten die de
  leerling moet bekijken** → `js/data-controles.js`. Bij elke controle kan je
  `toelichting`, `rekeningen` (bv. `["411*", "451*"]`) en `filterTip`
  invullen; de app toont die rekeningen dan met hun saldo, klikbaar naar het
  T-paneel.
- **Een contrarekening die aan de "verkeerde" kant hoort te staan**
  (retours, handelskortingen, voorraadwijziging) → `SALDO_UITZONDERINGEN` in
  `js/data-controles.js`.
- **Het laatste bankafschrift bij de controle van 550000** → gebeurt nu
  automatisch: de app neemt het hoogst genummerde `BANK…`-document uit
  `data-opdrachten.js`. Vul `laatsteBankRef` enkel in als je er toch een
  ander wil.
- **De vakken van de eindbalans** (titels, volgorde, tips) →
  `js/data-balans.js`. De `id` van een vak niet zomaar wijzigen: die staat in
  het bewaarde werk van de leerlingen.
- **De uitleg achter een i-icoontje** → `js/data-info.js`.

### De twee laatste tabbladen

De sleepoefening met de rubrieken staat op twee tabbladen, telkens met een
ander stuk van `BALANS_STRUCTUUR`:

- **Resultaatverwerking** — enkel de resultatenrekening, want dat is alles
  wat de leerling nodig heeft om de winst te berekenen. Daaronder de
  stapsgewijze berekening en de schema's BELASTING en RESULTAAT. Geen
  slotcontrole en geen evenwichtsmelding: zolang de resultaatverwerking niet
  geboekt is, hóórt er een verschil tussen kosten en opbrengsten te staan.
- **Eindbalans** — de volledige balans én de resultatenrekening, met de
  evenwichtsregel bovenaan en de slotcontrole onderaan.

Op beide tabbladen krijgt de leerling **alle** rubrieken met een saldo in de
lijst *Nog te plaatsen*, ook die van de balans: ze kiest zelf wat ze waar
nodig heeft. De plaatsingen zitten in één en dezelfde `state.eindbalans` —
wat ze op het ene tabblad in een vak legt, staat op het andere meteen mee.

Beide tabbladen roepen dezelfde functie `renderEindbalans(opties)` aan; de
opties bepalen welke delen getoond worden, welke titel erboven staat, welke
info-tekst achter het i-icoontje zit en of de evenwichtsregel meekomt.

Inhoud en logica zijn bewust gescheiden: een nieuw jaar/bundel betekent
in principe enkel aanpassingen in de `data-*.js`-bestanden en de map
`documenten/` — `app.js` blijft ongemoeid.

De app kent zelf **geen enkel bedrag**. Alles komt uit wat de leerling
zelf intikt of uit de documentafbeeldingen, die je zelf toevoegt.


## Publiceren op GitHub Pages

1. Zet de inhoud van deze map (`index.html`, `readme.md`, `css/`, `js/`, `documenten/`)
   in de root van de repo `celinetytgadt/boekhouding_DeMet` (of in een
   `docs/`-map, wat je verkiest).
2. Ga naar **Settings → Pages** en kies de branch/map die je gebruikt.
3. Na een paar minuten staat de app publiek op
   `https://celinetytgadt.github.io/boekhouding_DeMet/`.

## Wat nog moet gebeuren

- **Documentafbeeldingen** toevoegen in `documenten/` (zie
  `documenten/README.md`) — die zijn in deze versie nog niet meegebouwd.
- **Leveranciers/klanten** invullen in `js/data-relaties.js` zodra de
  opdrachtenbundel van dit jaar vastligt.
- **Nakijken door de leerkracht via Google Sheets (§10 van de
  specificatie)** — bewust nog niet gebouwd. Deze versie werkt volledig
  op zichzelf (autosave in de browser + export/import als JSON-bestand),
  precies zoals de specificatie vraagt om dat eerst als kleine, apart
  geteste proef te bouwen vóór de volledige koppeling erop komt. Zolang
  die koppeling er niet is, kunnen leerlingen sowieso niet bij elkaars
  werk of bij een gedeeld Google Sheet — elke leerling werkt in zijn/haar
  eigen browser en eigen export-bestand.
- **Openstaande facturen (400000/440000)**: de leerling tikt de naam van de
  klant of leverancier zelf in bij de boeking. Op het tabblad
  *Klanten & leveranciers* staan links de facturen en rechts waarmee ze
  vereffend zijn; het totaal staat onderaan. Omdat de namen handmatig
  ingevoerd worden, leveren tikfouten twee aparte relaties op — het invulveld
  stelt daarom eerder gebruikte namen voor.

  De app deelt de boekingen in:

  1. Staat een regel op de normale kant (klant debet, leverancier credit),
     dan is het een **factuur** → links.
  2. Staat ze op de tegenkant van een **betaalstuk**, dan is het een
     **betaling** → rechts. Welke opdrachten betaalstukken zijn, staat in
     `CATEGORIE_BETALINGEN` in `js/data-opdrachten.js` — nu de categorie
     *Financiële verrichtingen*, dus alle bankafschriften en het kasblad.
  3. Staat ze op de tegenkant van een ander document, dan is het een
     **creditnota** → op dezelfde regel als de factuur die er vlak vóór
     staat, want een creditnota vermindert die factuur. Je ziet het
     nettobedrag met de berekening er klein onder.

  Punt 2 kijkt bewust naar de **categorie van het document** en niet naar de
  rekeningen die de leerling koos. Boekt iemand een factuur rechtstreeks op de
  bank, of vergeet iemand de bankregel bij een afschrift, dan blijft het stuk
  staan waar het hoort en blijft de fout zichtbaar in plaats van weggemoffeld.
  Komt er een nieuwe categorie betaalstukken bij, dan volstaat één regel in
  `CATEGORIE_BETALINGEN`.

  De betalingen punten daarna de oudste nog openstaande factuur af; een
  overschot schuift door naar de volgende. Bij een deelbetaling staat het
  toegewezen bedrag tussen haakjes bij de referentie. Onderaan staat enkel
  *Totaal nog open* — bewust geen totaal van de factuurkolom, want dat leest
  te makkelijk als een openstaand saldo. Wordt er méér betaald of
  gecrediteerd dan er gefactureerd is, of staat een creditnota vóór elke
  factuur van die relatie, dan zegt de app dat expliciet onder de tabel.

  Getest tegen `MetWear_oplossingssleutel_Q1_2026.xlsx`: alle relaties komen
  correct uit, met 22.264 open bij Sportclub De Kern (VK06) en 21.091 bij
  Textura (AK07 na creditnota AK08) — exact de saldi van 400000 en 440000
  in de proef- en saldibalans.
- **Wat is verplicht in het redeneerschema?** Enkel het bedrag, het
  rekeningnummer en debet of credit. De kolommen *Redenering*, *A/P/K/O* en
  *Stijgt/daalt* staan er als denkhulp: de leerling mag ze invullen, maar de
  app controleert ze niet en de knop *Boeken* wacht er niet op. De vroegere
  controles daarop ("A die daalt kan geen debet zijn", "440000 is geen
  A-rekening") zijn bewust verwijderd — die beoordeling gebeurt door de
  leerkracht.
- De regel voor "juist soort saldo" (automatische controle) werkt op basis
  van A/P/K/O **van de rekening in het MAR** (niet van wat de leerling
  invulde), rekeningen die op **9** eindigen (geboekte afschrijvingen) en
  de lijst `SALDO_UITZONDERINGEN` voor contrarekeningen. Andere uitzonderingen
  worden niet herkend — de leerkracht kijkt dit sowieso nog na.
- **De eindbalans is een sleepoefening**: de app telt op wat de leerling in
  een vak legt en toont of activa en passiva gelijk zijn, maar zegt niet of
  een rekening in het juiste vak ligt. Dat blijft bewust nakijkwerk.

## Leerling-identificatie

Eén tekstveld bovenaan (voornaam, eventueel met eerste letter achternaam
erbij). Dat naam bepaalt de bewaarsleutel in de browser (autosave) en
staat mee in het export-bestand.
