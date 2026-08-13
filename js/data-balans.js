// data-balans.js
// De vakjes van de eindbalans en de resultatenrekening voor de
// sleepoefening op het tabblad Resultaatverwerking.
//
// De leerling krijgt alle rekeningen met een saldo als losse kaartjes en
// tikt die naar het juiste vakje. De app zegt niet of een kaartje
// juist ligt — ze telt enkel op wat erin gelegd wordt en toont of de
// balans in evenwicht is. Nakijken blijft dus werk van de vakexpert.
//
// Elk vak heeft:
//   id      unieke sleutel — NIET wijzigen zonder reden, ze staat in het
//           bewaarde werk van de leerlingen
//   naam    de titel zoals ze op de balans moet staan
//   kant    "D" of "C" — bepaalt of het saldo optelt bij activa of passiva
//           (resp. kosten of opbrengsten). Nodig om de totalen te berekenen.
//   hint    Die is verwijderd (de leerlingen moeten zelf nadenken hierover)

const BALANS_STRUCTUUR = {
  balans: {
    titel: "Balans",
    kolommen: [
      {
        id: "activa",
        titel: "ACTIVA",
        kant: "D",
        groepen: [
          {
            titel: "Vaste activa",
            vakken: [
              { id: "a-oprichting", naam: "Oprichtingskosten" },
              { id: "a-imva", naam: "Immateriële vaste activa" },
              { id: "a-mva", naam: "Materiële vaste activa" },
            ],
          },
          {
            titel: "Vlottende activa",
            vakken: [
              { id: "a-voorraden", naam: "Voorraden" },
              { id: "a-vorderingen", naam: "Vorderingen op ten hoogste 1 jaar" },
              { id: "a-liquide", naam: "Liquide middelen" },
              { id: "a-overlopend", naam: "Overlopende rekeningen" },
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
              { id: "p-kapitaal", naam: "Kapitaal" },
              { id: "p-reserves", naam: "Reserves" },
              { id: "p-overgedragen", naam: "Overgedragen resultaat" },
            ],
          },
          {
            titel: "Voorzieningen",
            vakken: [
              { id: "p-voorzieningen", naam: "Voorzieningen" },
            ],
          },
          {
            titel: "Schulden",
            vakken: [
              { id: "p-schulden-lang", naam: "Schulden op meer dan 1 jaar" },
              { id: "p-schulden-kort", naam: "Schulden op ten hoogste 1 jaar" },
              { id: "p-overlopend", naam: "Overlopende rekeningen" },
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
              { id: "k-handelsgoederen", naam: "Handelsgoederen, grond- en hulpstoffen" },
              { id: "k-ddg", naam: "Diensten en diverse goederen" },
              { id: "k-bezoldigingen", naam: "Bezoldigingen en sociale lasten" },
              { id: "k-afschrijvingen", naam: "Afschrijvingen" },
              { id: "k-andere", naam: "Andere bedrijfskosten" },
            ],
          },
          {
            titel: "Financiële en niet-recurrente kosten",
            vakken: [
              { id: "k-financieel", naam: "Financiële kosten" },
              { id: "k-nietrecurrent", naam: "Niet-recurrente kosten" },
            ],
          },
          {
            titel: "Belastingen en resultaatverwerking",
            vakken: [
              { id: "k-belastingen", naam: "Belastingen op het resultaat" },
              { id: "k-resultaatverwerking", naam: "Resultaatverwerking" },
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
              { id: "o-omzet", naam: "Omzet" },
              { id: "o-andere", naam: "Andere bedrijfsopbrengsten" },
            ],
          },
          {
            titel: "Financiële en niet-recurrente opbrengsten",
            vakken: [
              { id: "o-financieel", naam: "Financiële opbrengsten" },
              { id: "o-nietrecurrent", naam: "Niet-recurrente opbrengsten" },
            ],
          },
          {
            titel: "Resultaatverwerking",
            vakken: [
              { id: "o-resultaatverwerking", naam: "Resultaatverwerking" },
            ],
          },
        ],
      },
    ],
  },
};
