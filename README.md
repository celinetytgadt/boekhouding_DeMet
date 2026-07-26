# Boekhoudapp Kern 8 — De MET

Statische webapp (HTML/CSS/JS, geen build-stap, geen installatie) waarmee
leerlingen van de 3e graad Economie (D) de basisverrichtingen
inboeken op basis van verantwoordingsstukken, met permanent zichtbare
T-rekeningen. Zie `Boekhoudapp - specificatie.md` voor de volledige
opdracht waaruit deze app gebouwd is.

## Structuur

```
index.html               app-schil (header, navigatie, hoofdvenster, T-panel)
css/style.css             opmaak — kleuren staan bovenaan als variabelen
js/mar.js                 de 176 rekeningen van het MAR (wijzigt zelden)
js/data-opdrachten.js     lijst van opdrachten (AK01, VK03, DIV03, …) — per jaar aan te passen
js/data-relaties.js       lijst klanten/leveranciers voor 400000/440000 — per jaar aan te passen
js/data-controles.js      welk document als "laatste afschrift" geldt + de controlevragen
js/app.js                 alle logica — hoeft normaal niet aangepast te worden
documenten/                afbeeldingen van de verantwoordingsstukken (zie documenten/README.md)
```

Inhoud en logica zijn bewust gescheiden: een nieuw jaar/bundel betekent
in principe enkel aanpassingen in de `data-*.js`-bestanden en de map
`documenten/` — `app.js` blijft ongemoeid.

De app kent zelf **geen enkel bedrag**. Alles komt uit wat de leerling
zelf intikt of uit de documentafbeeldingen, die je zelf toevoegt.

## Lokaal uitproberen

Dubbelklikken op `index.html` werkt niet helemaal betrouwbaar in elke
browser (sommige browsers blokkeren lokale bestandstoegang). Start
liever een klein lokaal servertje in deze map, bijvoorbeeld:

```
python3 -m http.server 8000
```

en surf naar `http://localhost:8000`.

## Publiceren op GitHub Pages

1. Zet de inhoud van deze map (`index.html`, `css/`, `js/`, `documenten/`)
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
- **Huisstijl**: de kleuren/typografie van De MET waren bij het bouwen
  nog niet ingevuld in de huisstijl-referentie. `css/style.css` gebruikt
  nu een neutrale kleurstelling via CSS-variabelen bovenaan het bestand
  — zodra de echte huisstijl bekend is, volstaat het die variabelen aan
  te passen.
- **Nakijken door de leerkracht via Google Sheets (§10 van de
  specificatie)** — bewust nog niet gebouwd. Deze versie werkt volledig
  op zichzelf (autosave in de browser + export/import als JSON-bestand),
  precies zoals de specificatie vraagt om dat eerst als kleine, apart
  geteste proef te bouwen vóór de volledige koppeling erop komt. Zolang
  die koppeling er niet is, kunnen leerlingen sowieso niet bij elkaars
  werk of bij een gedeeld Google Sheet — elke leerling werkt in zijn/haar
  eigen browser en eigen export-bestand.
- **Openstaande facturen (400000/440000)**: optie 1 uit de specificatie
  is gebouwd — een leverancier/klant-veld per boeking op die rekeningen,
  met een overzichtje per relatie op het tabblad Controles.
- De regel voor "juist soort saldo" (automatische controle) is een
  vereenvoudiging op basis van A/P/K/O en rekeningen die op **009**
  eindigen. Uitzonderingen zoals contra-rekeningen (retours, kortingen)
  worden niet apart herkend — de leerkracht kijkt dit sowieso nog na.

## Leerling-identificatie

Eén tekstveld bovenaan (voornaam, eventueel met eerste letter achternaam
erbij). Dat naam bepaalt de bewaarsleutel in de browser (autosave) en
staat mee in het export-bestand.
