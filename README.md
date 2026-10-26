# Boekhoudapp Kern 8 — De MET

Statische webapp (HTML/CSS/JS, geen build-stap, geen installatie) waarmee
leerlingen van de 3e graad Economie (D) de basisverrichtingen
inboeken op basis van verantwoordingsstukken, met permanent zichtbare
T-rekeningen. Ze bewaart het werk op de Drive van de vakexpert, laat de
leerling per categorie indienen en toont de feedback van de vakexpert.

## Twee dossiers

De app bestaat uit twee pagina's met dezelfde code en dezelfde Sheets:

| pagina | dossier | waarvoor |
|---|---|---|
| `index.html` | MetWear bv, 1e kwartaal 2026 | eindopdracht (dit schooljaar) |
| `noor.html` | Fietsatelier Noor bv, 1e kwartaal 2028 | oefendossier: 5 à 6 stukken per les |

Fietsatelier Noor is de case van het 3e en 4e jaar (BKH3, BKH4), hier in
jaar 3. Bovenaan elke pagina staat een link naar het andere dossier.

Elk dossier heeft een eigen voorvoegsel in de browser (`DOSSIER.opslag`):
`boekhoudapp` voor MetWear (zoals het altijd was, zodat er geen werk
verloren gaat) en `kern8noor` voor Noor. Zo leest het ene dossier nooit het
werk of de feedback van het andere, en ook niet van de app van het 4e jaar
(`bkh4`). Enkel de aanmelding (school, naam, code) wordt gedeeld. In de Sheet
krijgt Noor een eigen werkbestand (`werk_NOOR_LEU_naam.json`) en beginnen de
refs met `NOOR-` en de categorieën met `Noor · `. De oplossingssleutel van
Noor zit in `Code.gs` zelf: het nakijkt meteen automatisch.

Alles van het oefendossier: `js/noor/`, `documenten/noor/` en
`hulpmiddelen/noor/` (de case, de scripts die documenten, opdrachten en
sleutel maken, en de Excel met jaar 3 erbij — zie `hulpmiddelen/noor/README.md`).

## Structuur

```
index.html               app-schil (header, voortgangsbalk, navigatie, hoofdvenster, T-panel)
css/style.css             opmaak — kleuren staan bovenaan als variabelen
js/mar.js                 de rekeningen van het MAR (wijzigt zelden)
js/data-mar-indeling.js   klassen en rubrieken van het MAR — voedt de filters
js/data-opdrachten.js     lijst van opdrachten (AK01, VK03, …) — per jaar aan te passen
js/data-relaties.js       de klanten/leveranciers in de keuzelijst bij 400000/440000 — per bundel aan te passen
js/data-controles.js      controlevragen per categorie, laatste afschrift, afwijkende saldokanten
js/data-balans.js         de vakken van de eindbalans en de resultatenrekening
js/data-info.js           de teksten achter de i-icoontjes
js/dossier.js             welk dossier index.html is (MetWear): opslag, documentenmap
js/noor/                  het oefendossier Noor: dossier.js, data-opdrachten.js, data-controles.js, data-relaties.js
js/config-koppeling.js    de vestigingen: code, naam, web-app-URL, sleutelwoord
js/data-klas.js           noodlijst met namen; normaal leeg — de klaslijst staat in de Sheet
js/app.js                 alle logica — hoeft normaal niet aangepast te worden
js/koppeling.js           alles wat met de Google Sheets praat
js/beheer.js              het tabblad Beheer voor de vakexperten (achter de expertcode)
apps-script/Code.gs       de serverkant, hoort in de Apps Script-editor van elke Sheet
test/                     automatische test van de koppeling (Node + jsdom)
documenten/                afbeeldingen van de verantwoordingsstukken (zie documenten/README.md)
```

### Wat staat er níét meer in deze bestanden?

Sinds september 2026 staat alles wat een vakexpert zelf moet kunnen wijzigen in
de **Google Sheet van de vestiging**, en niet meer op GitHub. Ze passen het aan
via het tabblad **Beheer** in de app (onderaan het menu links, achter de
expertcode) of rechtstreeks in de Sheet:

| wat | waar in de Sheet |
|---|---|
| de namen van de leerlingen, met hun code | tabblad **Klas** |
| de link naar de taak in Classroom, per categorie | tabblad **Taken** |
| de welkomsttekst op de startpagina | tabblad **Instellingen**, rij `welkomsttekst` |
| een mededeling bovenaan elke pagina | rij `mededeling` |
| de link naar de cursus (knop bovenaan) | rij `cursusUrl` |
| de link naar de handleiding (knop bovenaan) | rij `handleidingUrl` |
| oefendossier Noor tonen of niet (`ja`/`nee`) | rij `oefendossier` |
| de expertcode | rij `expertcode` — enkel in de Sheet te wijzigen |

Elke vestiging heeft haar eigen Sheet en dus haar eigen instellingen. Is de
web-app onbereikbaar, dan toont de app haar eigen standaardteksten en valt ze
voor de namen terug op `js/data-klas.js`.

### Waar pas je wat aan?

- **Een klant of leverancier in de keuzelijst** → `js/data-relaties.js`
  (MetWear) of `js/noor/data-relaties.js` (Noor). Een naam die al in het
  werk van een leerling staat maar niet (meer) in de lijst, blijft zichtbaar
  als keuze; de leerling kan ze zelf vervangen.
- **Een controlevraag anders formuleren of toevoegen** → `js/data-controles.js`.
  Elke controle heeft een veld `categorie`: de app zet ze dan automatisch op
  de controlepagina van die categorie in het menu. Een controle hoort bij de
  categorie waar ze voor het eerst beantwoord kan worden — "zijn de lonen
  uitbetaald?" staat dus bij de financiële verrichtingen en niet bij de
  loonverwerking. Verder kan je `toelichting`, `uitleg` (i-icoontje),
  `filterTip`, `docConfig` en `relatieSoort` invullen; dat laatste toont een
  tabelletje met per klant/leverancier wat er nog openstaat.
- **De inleiding boven een controlepagina, of de invulbalans bij de
  beginbalans** → `CATEGORIE_CONTROLES` in `js/data-controles.js`.
- **Waar de pagina Klanten & leveranciers in het menu staat** →
  `CATEGORIE_RELATIES` in `js/data-opdrachten.js`.
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
lijst *Nog te plaatsen*, ook die van de balans: de leerling kiest zelf wat
waar nodig is. De plaatsingen zitten in één en dezelfde `state.eindbalans` —
wat op het ene tabblad in een vak gelegd wordt, staat op het andere meteen mee.

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

## Hoe de app werkt

- **Bewaren, indienen en nakijken via Google Sheets** — zie
  `HANDLEIDING-koppeling.md`. Een Apps Script-web-app draait onder het
  account van de vakexpert. De leerling meldt zich aan met de naam uit de
  klaslijst (tabblad *Klas* van de Sheet) en een persoonlijke code. Het werk
  gaat elke twee minuten op de achtergrond naar een map op de gedeelde
  Drive, zodat de leerling op eender welke computer verder kan.

- **Na het aanmelden** legt de app het werk in de browser naast dat op de
  Drive; de recentste versie wint. Daarbij telt hoe het werk in de browser
  eruitzag *op het moment van aanmelden*: tikt de leerling al iets terwijl
  Google nog antwoordt, dan overschrijft die (bijna lege) versie nooit het
  volledige werk op de Drive.

- **Indienen**: de leerling kiest zelf per categorie wat er naar de
  vakexpert gaat. Enkel wat **afgerond** is, gaat mee: geboekte
  verrichtingen, de twee open vragen bij Klanten & leveranciers (allebei
  ingevuld), de vijf getallen van de resultaatverwerking (allemaal
  ingevuld) en de eindbalans (elke rubriek geplaatst). Wat half af is of
  nog niet begonnen, blijft bij de leerling. Wat *in orde* bevonden werd,
  gaat ook niet meer mee.

- **Automatisch nakijken**: staat er een sleutel in het tabblad *Sleutel*
  (voor Noor: in het script zelf), dan legt het script elke ingediende
  verrichting ernaast en vult het een voorstel van beoordeling in. De
  vakexpert beslist en geeft vrij.

- **Feedback**: *In orde*, *Te remediëren* of *Niet afgerond*. Die kleur
  komt terug bij de verrichting én in het menu links. De nieuwste ronde
  staat altijd bovenaan en bepaalt de kleur; de app sorteert daarvoor zelf
  op het tijdstip van de inzending (ook als dat in de Sheet als tekst staat)
  en daarna op de rij. Wat in orde is, gaat op slot — enkel de klant of
  leverancier blijft aanpasbaar. Eerdere rondes staan eronder.

- **Drie vestigingen (LEU, SKW, TW)** — één app, drie Sheets. Elke vestiging
  heeft een eigen Sheet met een eigen kopie van `Code.gs` (met `VESTIGING`
  ingevuld) en een eigen publicatie; de leerling kiest bovenaan eerst de
  school en dan de naam. De werkbestanden komen samen in één map op de
  gedeelde Drive, met de code van de vestiging in de bestandsnaam
  (`werk_LEU_lottev.json`). **Een wijziging aan `Code.gs` moet dus in de
  drie Sheets gebeuren**, telkens gevolgd door *Implementaties beheren →
  nieuwe versie*.

- **Oefendossier Noor tonen of niet** kiest de vakexpert per school in
  Beheer. In MetWear verschijnen de knop en de link naar Noor pas als de
  instellingen van de gekozen school binnen zijn en het oefendossier daar
  niet op *nee* staat.

- **Exporteren, importeren en Alles wissen** bestaan niet meer: overbodig nu
  alles centraal bewaard wordt. Moet een leerling opnieuw beginnen, dan
  verwijdert de vakexpert het bestand `werk_<naam>.json` uit de Drive-map.

- **Klant of leverancier (400000/440000)**: de leerling kiest de naam uit
  de keuzelijst (`js/data-relaties.js`). Is die lijst leeg, dan valt de app
  terug op het vrije naamveld met suggesties en een waarschuwing bij een
  bijna gelijke naam.

  De app deelt de boekingen in:

  1. Staat een regel op de normale kant (klant debet, leverancier credit),
     dan is het een **factuur**.
  2. Staat ze op de tegenkant van een **betaalstuk**, dan is het een
     **betaling**. Welke opdrachten betaalstukken zijn, staat in
     `CATEGORIE_BETALINGEN` in `js/data-opdrachten.js` — nu de categorie
     *Financiële verrichtingen*, dus alle bankafschriften en het kasblad.
  3. Staat ze op de tegenkant van een ander document, dan is het een
     **creditnota**.

  Punt 2 kijkt bewust naar de **categorie van het document** en niet naar de
  rekeningen die de leerling koos. Boekt iemand een factuur rechtstreeks op de
  bank, of vergeet iemand de bankregel bij een afschrift, dan blijft het stuk
  staan waar het hoort en blijft de fout zichtbaar in plaats van weggemoffeld.

  Het **afpunten doet de leerling zelf** (bewust — dat is een leerdoel): in
  het detail van een relatie klikt de leerling een betaling of creditnota aan
  en daarna de factuur waar die bij hoort. De app wijst het bedrag automatisch
  toe (het maximum dat op beide nog openstaat), zodat één betaling over
  meerdere facturen gespreid kan worden door ze meermaals te koppelen. Met
  het kruisje gaat een koppeling weer los. De koppelingen staan in
  `state.afpuntingen` en vervallen automatisch als de boeking waarop ze
  steunen heropend wordt. Onderaan staat enkel *Totaal nog open*; dat totaal
  hangt níét af van het afpunten en komt dus altijd overeen met wat die
  relatie bijdraagt aan het saldo van 400000/440000 — daarop steunt de
  zelfcontrole op het tabblad Controles.

- **Controle beginbalans**: onder de vraag over de relaties op de
  beginbalans toont de app elke lijn van BB op 400000/440000 met de gekozen
  relatie (veld `relatiesVoorRef` in `js/data-controles.js`).

- **Volgorde op een opdrachtpagina**: feedback, dan het redeneerschema, dan
  het verantwoordingsstuk en het hulpdocument in inklapbare panelen. Of zo'n
  paneel open of dicht staat, wordt onthouden in `uiState.openDocumenten`.
- **Wat is verplicht in het redeneerschema?** Enkel het bedrag, het
  rekeningnummer en debet of credit. De kolommen *Redenering*, *A/P/K/O* en
  *Stijgt/daalt* staan er als denkhulp: de leerling mag ze invullen, maar de
  app controleert ze niet en de knop *Boeken* wacht er niet op. Wat er nog
  ontbreekt, staat onder het schema — pas zodra de leerling eraan begonnen
  is, zodat een leeg schema geen gele kaders toont.
- De regel voor "juist soort saldo" (automatische controle) werkt op basis
  van A/P/K/O **van de rekening in het MAR** (niet van wat de leerling
  invulde), rekeningen die op **9** eindigen (geboekte afschrijvingen) en
  de lijst `SALDO_UITZONDERINGEN` voor contrarekeningen.
- **De eindbalans is een sleepoefening**: de app telt op wat de leerling in
  een vak legt en toont of activa en passiva gelijk zijn, maar zegt niet of
  een rekening in het juiste vak ligt. Dat blijft nakijkwerk.
- **Wijzigen = opnieuw controleren, maar zonder alles te wissen.** Heropent
  een leerling een boeking, dan blijven de controle-vinkjes staan. Wel wordt
  de categorie van die boeking gemarkeerd in `state.controlesHerbekijken`:
  bovenaan de controlepagina komt een oranje kader met een knop *Ik heb ze
  opnieuw nagekeken*, en bij het indienen wordt dezelfde vraag nog eens
  gesteld (blokkeert niets). Na een geslaagde inzending gaat de markering uit.
- **Menu links inklappen**: met « bovenaan het menu; een smalle tab
  *Menu »* haalt het terug. De keuze blijft bewaard in de browser.
- **Afmelden** (titelbalk): eerst gaat het laatste werk naar de Drive,
  daarna vergeet de browser wie er aangemeld is.
- **Versienummer**: achter elk script in `index.html` en `noor.html` staat
  `?v=…`. Verander dat getal bij elke update, dan halen de browsers meteen
  alle nieuwe bestanden op.

## Leerling-identificatie

Bovenaan kiest de leerling de vestiging (enkel als er meer dan één in
`config-koppeling.js` staat) en daarna de naam uit de klaslijst, met de
persoonlijke code uit het tabblad Klas. Zonder klaslijst blijft het vrije
naamveld staan (voornaam, eventueel met de eerste letter van de achternaam).
Vestiging + naam bepalen samen de bewaarsleutel in de browser, zodat
gelijknamige leerlingen van twee scholen op een gedeelde computer niet in
elkaars werk komen.
