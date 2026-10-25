// data-relaties.js — eindopdracht MetWear bv
//
// De klanten en leveranciers in de keuzelijst bij boekingen op 400000
// (Handelsdebiteuren) en 440000 (Leveranciers). De leerling kiest de naam
// uit deze lijst in plaats van ze zelf te typen: zo zijn er geen tikfouten
// meer en wordt één klant nooit twee aparte relaties op het tabblad
// Klanten & leveranciers.
//
// Een naam aanpassen of toevoegen? Gewoon hier in de lijst. Staat er in het
// werk van een leerling een naam die niet (meer) in de lijst staat, dan
// blijft die zichtbaar als keuze, zodat er niets verdwijnt; de leerling kan
// ze zelf vervangen door een naam uit de lijst.
//
// Laat je een lijst helemaal leeg, dan krijgt de leerling voor die soort
// opnieuw het vrije naamveld van vroeger.
//
// De beginbalans en de dagontvangsten hebben geen echte klant- of
// leveranciersnaam op het document; daarvoor staan er drie verzamelnamen.

const RELATIES = {
  klanten: [
    "Klanten 2025 (beginbalans)",
    "Boetiek Lumen bv",
    "Concept Store Nova bv",
    "Kringwinkel De Draad vzw",
    "Modehuis Vandeputte bv",
    "Sportclub De Kern vzw",
    "Winkel (dagontvangsten)",
  ],
  leveranciers: [
    "Leveranciers 2025 (beginbalans)",
    "Atelier Lino",
    "Bio Cotton Belgium bv",
    "Denim Depot nv",
    "Garage Delvaux bv",
    "Groene Draad bvba",
    "NovaEnergy nv",
    "SoLoon vzw",
    "Textura nv",
  ],
};
