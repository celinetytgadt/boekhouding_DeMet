// dossier.js — welk dossier deze pagina is (index.html: MetWear).
//
// De app kent twee dossiers met dezelfde code (app.js, koppeling.js) en
// dezelfde Sheet, maar elk met eigen opdrachten, documenten en opslag:
//
//   index.html   MetWear bv, 1e kwartaal 2026 — de eindopdracht
//   noor.html    Fietsatelier Noor bv, 1e kwartaal 2028 — het oefendossier
//
// opslag      het voorvoegsel voor alles wat de app in de browser onthoudt.
//             Alle apps op celinetytgadt.github.io delen dat geheugen; met
//             een eigen voorvoegsel leest een dossier nooit het werk of de
//             feedback van een ander dossier of een andere app (de app van
//             het 4e jaar gebruikt "bkh4"). MetWear houdt "boekhoudapp": dat
//             was het al, en zo blijft het werk in de browsers staan.
// code        gaat mee naar de Sheet. Leeg = zoals altijd (werk_LEU_naam.json,
//             refs AK01 …). Een ander dossier krijgt een code (zie
//             js/noor/dossier.js).
// documenten  de map met de afbeeldingen van de verantwoordingsstukken.

const DOSSIER = {
  code: "",
  opslag: "boekhoudapp",
  documenten: "documenten/",
  kort: "Boekhoudapp Kern 8",
  titel: "Boekhoudapp Kern 8 — MetWear",
  ander: { naam: "Oefendossier Fietsatelier Noor", url: "noor.html" },
};
