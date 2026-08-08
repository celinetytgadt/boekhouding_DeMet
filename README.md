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
  *Klanten & leveranciers* staat dan per relatie **één regel per factuur**,
  met daarnaast de betaling(en) die erop volgden en wat er van die factuur
  nog openstaat; het totaal staat onderaan. De koppeling gebeurt automatisch,
  oudste factuur eerst (de volgorde van `data-opdrachten.js` is chronologisch).
  Een deelbetaling toont het toegewezen bedrag tussen haakjes bij de
  referentie. Wordt er méér betaald dan er aan facturen geboekt is, dan komt
  die betaling apart onder de tabel te staan als waarschuwing. Omdat de namen
  handmatig ingevoerd worden, leveren tikfouten twee aparte relaties op — het
  invulveld stelt daarom eerder gebruikte namen voor.
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
