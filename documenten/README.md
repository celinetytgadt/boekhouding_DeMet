# Documenten

Zet hier de afbeeldingen van de verantwoordingsstukken. De app zoekt ze
automatisch op bestandsnaam — er hoeft niets in de code aangepast te
worden zolang de namen hetzelfde blijven.

**Naamgeving = referentie**, `.png` of `.jpg`, **volledig in HOOFDLETTERS**
en onafhankelijk van de inhoud van het document (dus `VK01.png`, niet
`VK01 - Bloomwear Retail.png`). Zo kan een document vervangen worden
zonder dat er ergens iets moet meeveranderen.

## Bundel MetWear bv — 1e kwartaal 2026 (43 documenten)

| Bestand | Aantal | Wat |
|---|---|---|
| `BEGINBALANS` | 1 | balans op 1 januari 2026 — dit is het document dat de app toont |
| `BEGINSALDI` | 1 | overzicht van alle rekeningen — **niet** in de app, dit is leerkrachtmateriaal |
| `VK01` – `VK08` | 8 | verkoopfacturen én creditnota's verkoop, doorlopend genummerd |
| `AK01` – `AK12` | 12 | aankoopfacturen én creditnota's aankoop, doorlopend genummerd |
| `ONTV01` | 1 | dagontvangstenjournaal |
| `LOON` | 1 | loonstaat |
| `BANK01` – `BANK14` | 14 | bankuittreksels |
| `KAS01` | 1 | kasblad |
| `LENING1` | 1 | aflossingstabel maandelijks — hulpdocument bij BANK06, BANK09 en BANK14 |
| `LENING2` | 1 | aflossingstabel per jaar — opdracht bij de eindejaarsverrichtingen |
| `AFSCHR1` | 1 | afschrijvingstabel |
| `VR` | 1 | voorraadtelling |

Creditnota's krijgen **geen eigen reeks**: ze staan doorlopend genummerd
in de AK- of VK-reeks, op hun eigen datum. Nu is dat VK04, VK08, AK04 en
AK08.

`BTW` (btw-verwerking), `BELASTING` (vennootschapsbelasting) en
`RESULTAAT` (overgedragen winst) hebben géén document — die pagina's
tonen enkel uitleg of eigen berekeningen. Zie `js/data-opdrachten.js`.

## Hulpdocumenten

Een opdracht kan een tweede, inklapbaar document tonen via het veld
`hulpdoc` in `js/data-opdrachten.js`. Dat is bedoeld voor tabellen die de
leerling nodig heeft om te kunnen boeken maar die niet bij één bepaald
stuk horen — nu enkel de aflossingstabel `LENING1` bij de drie
bankuittreksels met een aflossing.

## Overige

Eén document per afbeelding — geen pagina's met meerdere afschriften erop.

Ontbreekt een afbeelding, dan toont de app gewoon een duidelijke melding
in plaats van te crashen — je kan dus gerust in fases aanvullen.

Welk document als "laatste bankuittreksel", "laatste kasblad" en
"voorraadtelling" gebruikt wordt bij de controles (§7), stel je in bij
`js/data-controles.js` (`CONTROLE_CONFIG`).

**Let op:** GitHub Pages is hoofdlettergevoelig, Windows niet. Een
verkeerd geschreven bestandsnaam valt thuis dus niet op, maar breekt wel
online.
