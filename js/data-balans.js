// data-balans.js
// De vakjes van de eindbalans en de resultatenrekening voor de
// sleepoefening op het tabblad Resultaatverwerking.
//
// De leerling krijgt alle rekeningen met een saldo als losse kaartjes en
// sleept (of tikt) ze naar het juiste vakje. De app zegt niet of een kaartje
// juist ligt — ze telt enkel op wat de leerling erin legt en toont of de
// balans in evenwicht is. Nakijken blijft dus werk van de leerkracht.
//
// Elk vak heeft:
//   id      unieke sleutel — NIET wijzigen zonder reden, ze staat in het
//           bewaarde werk van de leerlingen
//   naam    de titel zoals ze op de balans moet staan
//   hint    rubrieken uit het MAR die hier normaal thuishoren. Dit is enkel
//           een tip die de leerling kan opvragen; ze bepaalt niets.
//   kant    "D" of "C" — bepaalt of het saldo optelt bij activa of passiva
//           (resp. kosten of opbrengsten). Nodig om de totalen te berekenen.

const BALANS_STRUCTUUR = {
  balans: {
    titel: "Eindbalans",
    kolommen: [
      {
        id: "activa",
        titel: "ACTIVA",
        kant: "D",
        groepen: [
          {
            titel: "Vaste activa",
            vakken: [
              { id: "a-oprichting", naam: "Oprichtingskosten", hint: "rubriek 20" },
              { id: "a-imva", naam: "Immateriële vaste activa", hint: "rubriek 21" },
              { id: "a-mva", naam: "Materiële vaste activa", hint: "rubrieken 22, 23 en 24 — aanschafwaarde min de afschrijvingen op …9" },
            ],
          },
          {
            titel: "Vlottende activa",
            vakken: [
              { id: "a-voorraden", naam: "Voorraden", hint: "rubrieken 30 en 34" },
              { id: "a-vorderingen", naam: "Vorderingen op ten hoogste 1 jaar", hint: "rubrieken 40 en 41" },
              { id: "a-liquide", naam: "Liquide middelen", hint: "rubrieken 55, 57 en 58" },
              { id: "a-overlopend", naam: "Overlopende rekeningen", hint: "rubriek 49 — het deel dat een vordering is" },
            ],
          },
        ],
      },
      {
        id: "passiva",
        titel: "PASSIVA",
        kant: "C",
        groepen: [
          {
            titel: "Eigen vermogen",
            vakken: [
              { id: "p-kapitaal", naam: "Kapitaal", hint: "rubriek 10" },
              { id: "p-reserves", naam: "Reserves", hint: "rubriek 13" },
              { id: "p-overgedragen", naam: "Overgedragen resultaat", hint: "rubriek 14" },
            ],
          },
          {
            titel: "Voorzieningen",
            vakken: [
              { id: "p-voorzieningen", naam: "Voorzieningen", hint: "rubriek 16" },
            ],
          },
          {
            titel: "Schulden",
            vakken: [
              { id: "p-schulden-lang", naam: "Schulden op meer dan 1 jaar", hint: "rubriek 17" },
              { id: "p-schulden-kort", naam: "Schulden op ten hoogste 1 jaar", hint: "rubrieken 42, 43, 44, 45, 47 en 48" },
              { id: "p-overlopend", naam: "Overlopende rekeningen", hint: "rubriek 49 — het deel dat een schuld is" },
            ],
          },
        ],
      },
    ],
  },

  resultatenrekening: {
    titel: "Resultatenrekening",
    kolommen: [
      {
        id: "kosten",
        titel: "KOSTEN",
        kant: "D",
        groepen: [
          {
            titel: "Bedrijfskosten",
            vakken: [
              { id: "k-handelsgoederen", naam: "Handelsgoederen, grond- en hulpstoffen", hint: "rubriek 60 — let op: retours, kortingen en voorraadwijziging staan credit" },
              { id: "k-ddg", naam: "Diensten en diverse goederen", hint: "rubriek 61" },
              { id: "k-bezoldigingen", naam: "Bezoldigingen en sociale lasten", hint: "rubriek 62" },
              { id: "k-afschrijvingen", naam: "Afschrijvingen", hint: "rubriek 63" },
              { id: "k-andere", naam: "Andere bedrijfskosten", hint: "rubriek 64" },
            ],
          },
          {
            titel: "Financiële en niet-recurrente kosten",
            vakken: [
              { id: "k-financieel", naam: "Financiële kosten", hint: "rubriek 65" },
              { id: "k-nietrecurrent", naam: "Niet-recurrente kosten", hint: "rubriek 66" },
            ],
          },
          {
            titel: "Belastingen en resultaatverwerking",
            vakken: [
              { id: "k-belastingen", naam: "Belastingen op het resultaat", hint: "rubriek 67" },
              { id: "k-resultaatverwerking", naam: "Resultaatverwerking", hint: "rubriek 69" },
            ],
          },
        ],
      },
      {
        id: "opbrengsten",
        titel: "OPBRENGSTEN",
        kant: "C",
        groepen: [
          {
            titel: "Bedrijfsopbrengsten",
            vakken: [
              { id: "o-omzet", naam: "Omzet", hint: "rubriek 70 — let op: retours en handelskorting op verkopen staan debet" },
              { id: "o-andere", naam: "Andere bedrijfsopbrengsten", hint: "rubriek 74" },
            ],
          },
          {
            titel: "Financiële en niet-recurrente opbrengsten",
            vakken: [
              { id: "o-financieel", naam: "Financiële opbrengsten", hint: "rubriek 75" },
              { id: "o-nietrecurrent", naam: "Niet-recurrente opbrengsten", hint: "rubriek 76" },
            ],
          },
          {
            titel: "Resultaatverwerking",
            vakken: [
              { id: "o-resultaatverwerking", naam: "Resultaatverwerking", hint: "rubriek 79" },
            ],
          },
        ],
      },
    ],
  },
};
