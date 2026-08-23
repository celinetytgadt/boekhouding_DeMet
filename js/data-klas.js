// data-klas.js
// De namen die de leerlingen in de keuzelijst bovenaan de app zien, per
// vestiging. De code van de vestiging (LEU, SKW, TW) moet overeenkomen met
// die in js/config-koppeling.js.
//
// Hier staan ALLEEN de namen. De persoonlijke codes horen in het tabblad
// "Klas" van de Google Sheet van díé vestiging en nergens anders: dit
// bestand staat op GitHub Pages en is door iedereen leesbaar.
//
// Schrijf de namen tussen dubbele aanhalingstekens, met een komma erachter,
// en zonder // ervoor — met // ervoor is het commentaar en ziet de app de
// naam niet. Zo hoort het eruit te zien:
//
//     const KLASLIJSTEN = {
//       LEU: [
//         "Zeger",
//         "Mats",
//       ],
//     };
//
// Schrijf ze zoals in kolom A van het tabblad Klas van die vestiging.
// Hoofdletters, punten en spaties maken niet uit — het script vergelijkt
// namen zonder die tekens — maar gelijk houden leest prettiger.
//
// Blijft de lijst van een vestiging leeg (LEU: []), dan valt de app voor die
// vestiging terug op het vrije naamveld zoals vroeger. Handig zolang je met
// collega's test.

const KLASLIJSTEN = {
  LEU: [
    "test LEU (code 1234)",
    "Zeger",
    "Mats",
    "Mai",
    "Yorick",
  ],
  SKW: [
    "leerling 1",
    "leerling 2",
  ],
  TW: [
    "leerling 3",
    "leerling 4",
  ],
};
