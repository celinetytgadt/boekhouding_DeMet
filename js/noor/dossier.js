// dossier.js — het oefendossier Fietsatelier Noor bv (noor.html).
//
// Zie js/dossier.js voor de uitleg van de velden. Wat hier anders is:
//
// opslag      "kern8noor": eigen werk, eigen feedback en eigen laatste
//             leerling in de browser, los van MetWear en van de app van het
//             4e jaar. Enkel de aanmelding (school, naam, code) wordt gedeeld,
//             zodat de leerling bij het wisselen niet opnieuw moet aanmelden.
// code        "NOOR": het werkbestand heet werk_NOOR_LEU_naam.json, de refs
//             in de Sheet beginnen met NOOR- (NOOR-AK01) en de categorieën
//             met "Noor · ". Zo lopen ze nooit door elkaar met die van
//             MetWear, die dezelfde namen hebben (AK01, Beginbalans …).
//             De code moet ook in DOSSIERS bovenaan Code.gs staan; een script
//             dat het dossier niet kent, krijgt niets van dit dossier binnen.

const DOSSIER = {
  code: "NOOR",
  categoriePrefix: "Noor · ",
  opslag: "kern8noor",
  documenten: "documenten/noor/",
  kort: "Oefendossier Noor",
  titel: "Oefendossier Fietsatelier Noor",
  ander: { naam: "Eindopdracht MetWear", url: "index.html", opslag: "boekhoudapp" },
  welkomst:
    "<p>Dit is het <strong>oefendossier</strong>: na elke les maak je de stukken van die les. Het menu links volgt de lessen. " +
    "Je werk hier staat helemaal los van de eindopdracht MetWear (link bovenaan).</p>",
};
