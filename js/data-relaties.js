// data-relaties.js
// OPTIONEEL startlijstje van leveranciers en klanten voor het extra veld
// bij boekingen op 400000 (Handelsdebiteuren) en 440000 (Leveranciers) —
// een subadministratie zodat leerlingen kunnen nakijken welke facturen nog openstaan.
//
// Dit hoeft NIET bijgehouden te worden: het relatieveld in de app is een
// gewoon tekstveld. Zodra een leerling ergens een naam intikt, verschijnt
// die vanzelf als suggestie bij de volgende boeking op dezelfde rekening
// (400000/440000) — ook zonder dat dit bestand aangepast wordt.
//
// Wil je toch een paar vaste namen als voorstel laten verschijnen (bv. om
// tikfouten/dubbels te vermijden), typ ze dan hieronder. Leeg laten mag
// gerust.

const RELATIES = {
  klanten: [ "klanten 2025",
    // bv. "Klant A", "Bakkerij Janssens", ...
  ],
  leveranciers: [ "leveranciers 2025",
    // bv. "Leverancier X", "Groothandel Peeters", ...
  ],
};
