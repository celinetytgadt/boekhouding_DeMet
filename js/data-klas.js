// data-klas.js
// NOODOPLOSSING — normaal hoef je hier niets meer in te vullen.
//
// De namen van de leerlingen staan sinds september 2026 in het tabblad
// "Klas" van de Google Sheet van de vestiging, samen met hun persoonlijke
// code. De app haalt ze daar op zodra de leerling een school gekozen heeft.
// Een vakexpert voegt ze toe via het tabblad Beheer in de app (of gewoon
// rechtstreeks in de Sheet).
//
// Waarom staat dit bestand er dan nog? Als de web-app van een vestiging
// onbereikbaar is, kan de app de klaslijst niet ophalen. Staat er hieronder
// niets, dan valt ze terug op het vrije naamveld — precies zoals vroeger,
// en dat volstaat. Wil je toch een vaste reservelijst voor een vestiging,
// zet de namen er dan bij:
//
//     const KLASLIJSTEN = {
//       LEU: [
//         "Zeger",
//         "Mats",
//       ],
//     };
//
// De codes horen hier NOOIT in: dit bestand staat op GitHub Pages en is door
// iedereen leesbaar.

const KLASLIJSTEN = {
  LEU: [],
  SKW: [],
  TW: [],
};
