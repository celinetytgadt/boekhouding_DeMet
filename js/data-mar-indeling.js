// data-mar-indeling.js
// De indeling van het MAR in klassen en rubrieken, zoals ze in de cursus
// gebruikt wordt. Deze lijst voedt de filters in het T-rekeningenpaneel en in
// het zoekscherm voor rekeningnummers, zodat leerlingen leren navigeren in
// het MAR.
//
// De koppeling met een rekening gebeurt via de velden "klasse" en "rubriek"
// die al bij elke rekening in js/mar.js staan. Komt er een rubriek bij, dan
// volstaat het die hier toe te voegen (en de rekeningen in mar.js het juiste
// rubrieknummer te geven).
//
// Rubrieken zonder enkele rekening in mar.js worden vanzelf niet getoond in
// de filters.

const MAR_INDELING = [
  {
    klasse: "1",
    oms: "Eigen vermogen",
    rubrieken: [
      { rubriek: "10", oms: "Kapitaal" },
      { rubriek: "13", oms: "Reserves" },
      { rubriek: "14", oms: "Overgedragen resultaat" },
      { rubriek: "16", oms: "Voorzieningen" },
      { rubriek: "17", oms: "Schulden op meer dan 1 jaar" },
    ],
  },
  {
    klasse: "2",
    oms: "Vaste activa",
    rubrieken: [
      { rubriek: "20", oms: "Oprichtingskosten" },
      { rubriek: "21", oms: "Immateriële vaste activa" },
      { rubriek: "22", oms: "Terreinen & gebouwen" },
      { rubriek: "23", oms: "Installaties, machines & uitrusting" },
      { rubriek: "24", oms: "Meubilair & rollend materieel" },
    ],
  },
  {
    klasse: "3",
    oms: "Voorraden",
    rubrieken: [
      { rubriek: "30", oms: "Voorraden" },
      { rubriek: "34", oms: "Voorraden" },
    ],
  },
  {
    klasse: "4",
    oms: "Vorderingen en schulden op ten hoogste 1 jaar",
    rubrieken: [
      { rubriek: "40", oms: "Handelsvorderingen" },
      { rubriek: "41", oms: "Overige vorderingen" },
      { rubriek: "42", oms: "Schulden op maar dan 1 jaar die binnen het jaar vervallen" },
      { rubriek: "43", oms: "Financiële schulden" },
      { rubriek: "44", oms: "Handelsschulden" },
      { rubriek: "45", oms: "Schulden mbt belastingen, ..." },
      { rubriek: "47", oms: "Schulden uit bestemming resultaat" },
      { rubriek: "48", oms: "Diverse schulden" },
      { rubriek: "49", oms: "Overlopende rekeningen" },
    ],
  },
  {
    klasse: "5",
    oms: "Liquide middelen",
    rubrieken: [
      { rubriek: "55", oms: "Bank" },
      { rubriek: "57", oms: "Kas" },
      { rubriek: "58", oms: "Interne overboekingen" },
    ],
  },
  {
    klasse: "6",
    oms: "Kosten",
    rubrieken: [
      { rubriek: "60", oms: "Handelsgoederen, grond- en hulpstoffen" },
      { rubriek: "61", oms: "Diensten en diverse goederen" },
      { rubriek: "62", oms: "Bezoldigingen, sociale lasten en pensioenen" },
      { rubriek: "63", oms: "Afschrijvingen" },
      { rubriek: "64", oms: "Andere bedrijfskosten" },
      { rubriek: "65", oms: "Financiële kosten" },
      { rubriek: "66", oms: "Niet-recurrente bedrijfs- en financiële kosten" },
      { rubriek: "67", oms: "Belastingen op het resultaat" },
      { rubriek: "69", oms: "Resultaatverwerking" },
    ],
  },
  {
    klasse: "7",
    oms: "Opbrengsten",
    rubrieken: [
      { rubriek: "70", oms: "Omzet" },
      { rubriek: "74", oms: "Andere bedrijfsopbrengsten" },
      { rubriek: "75", oms: "Financiële opbrengsten" },
      { rubriek: "76", oms: "Niet-recurrente bedrijfs- of financiële opbrengsten" },
      { rubriek: "79", oms: "Resultaatverwerking" },
    ],
  },
];
