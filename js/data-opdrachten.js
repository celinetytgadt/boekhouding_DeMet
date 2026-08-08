// data-opdrachten.js
// Lijst van alle opdrachten (verantwoordingsstukken) met hun referentie,
// categorie (voor de navigatie) en titel. Dit is de enige plaats die
// aangepast moet worden als er een opdracht bijkomt, wegvalt of van naam
// verandert. De app zelf (app.js) hoeft daarvoor niet aangeraakt te worden.
//
// Veld "doc": de bestandsnaam (zonder extensie) van de afbeelding in
// documenten/. De app probeert automatisch .png en .jpg.
// Veld "hulpdoc": een tweede, inklapbaar document dat de leerling nodig
// heeft om deze boeking te maken (bv. de aflossingstabel bij een
// bankafschrift). Zo hoeven ze niet van pagina te wisselen (§2).
// Veld "geenDocument": true als er geen verantwoordingsstuk bij hoort
// (bv. BTW, BELASTING en RESULTAAT, die volgen uit eigen berekeningen).
// Veld "navLabel": de tekst in het menu links, als die anders moet zijn dan
// de referentie zelf. De referentie ("ref") is wat in de T-rekeningen bij
// elke boeking komt te staan en blijft dus best kort.
//
// BUNDEL: MetWear bv — 1e kwartaal 2026 (januari t/m maart).

const OPDRACHTEN = [
  // "doc" moet de bestandsnaam op GitHub exact matchen — GitHub Pages is
  // hoofdlettergevoelig (Windows niet, dus dat valt thuis niet op).
  // Alle documentnamen staan sinds Q1 2026 volledig in HOOFDLETTERS.
  //
  // De referentie is "BB" en niet "BEGINBALANS": in de T-rekeningen staat ze
  // bij elke beginboeking, en die kolommen zijn smal. Het menu toont wel de
  // volledige naam, zodat de link duidelijk blijft.
  { ref: "BB", navLabel: "BEGINBALANS (BB)", categorie: "Beginbalans", titel: "Beginbalans 1 januari 2026 (BB)", doc: "BEGINBALANS", hulpdoc: "AFSCHR1", hulpdocTitel: "Afschrijvingstabel (incl. nieuwe aankoop in 2026)" },

  { ref: "AK01", categorie: "Aankopen", titel: "Aankoop AK01", doc: "AK01" },
  { ref: "AK02", categorie: "Aankopen", titel: "Aankoop AK02", doc: "AK02" },
  { ref: "AK03", categorie: "Aankopen", titel: "Aankoop AK03", doc: "AK03" },
  { ref: "AK04", categorie: "Aankopen", titel: "Aankoop AK04", doc: "AK04" },
  { ref: "AK05", categorie: "Aankopen", titel: "Aankoop AK05", doc: "AK05" },
  { ref: "AK06", categorie: "Aankopen", titel: "Aankoop AK06", doc: "AK06" },
  { ref: "AK07", categorie: "Aankopen", titel: "Aankoop AK07", doc: "AK07" },
  { ref: "AK08", categorie: "Aankopen", titel: "Aankoop AK08", doc: "AK08" },
  { ref: "AK09", categorie: "Aankopen", titel: "Aankoop AK09", doc: "AK09" },
  { ref: "AK10", categorie: "Aankopen", titel: "Aankoop AK10", doc: "AK10" },

  { ref: "VK01", categorie: "Verkopen", titel: "Verkoop VK01", doc: "VK01" },
  { ref: "VK02", categorie: "Verkopen", titel: "Verkoop VK02", doc: "VK02" },
  { ref: "VK03", categorie: "Verkopen", titel: "Verkoop VK03", doc: "VK03" },
  { ref: "VK04", categorie: "Verkopen", titel: "Verkoop VK04", doc: "VK04" },
  { ref: "VK05", categorie: "Verkopen", titel: "Verkoop VK05", doc: "VK05" },
  { ref: "VK06", categorie: "Verkopen", titel: "Verkoop VK06", doc: "VK06" },
  { ref: "VK07", categorie: "Verkopen", titel: "Verkoop VK07", doc: "VK07" },
  { ref: "VK08", categorie: "Verkopen", titel: "Verkoop VK08", doc: "VK08" },

  { ref: "ONTV01", categorie: "Dagontvangsten", titel: "Dagontvangsten ONTV01", doc: "ONTV01" },

  { ref: "LOON", categorie: "Loonverwerking", titel: "Loonstaat LOON", doc: "LOON" },
  // AK11 en AK12 zijn aankoopfacturen die bij de loonverwerking horen. Ze
  // staan hier en niet bij de andere aankopen, want ze zijn pas te boeken
  // nadat de loonstaat gezien is.
  { ref: "AK11", categorie: "Loonverwerking", titel: "Aankoop AK11", doc: "AK11" },
  { ref: "AK12", categorie: "Loonverwerking", titel: "Aankoop AK12", doc: "AK12" },

  // Eerst de kas, dan de bank: zo is de tegenboeking op 580000 (interne
  // overboekingen) duidelijker.
  { ref: "KAS01", categorie: "Financiële verrichtingen", titel: "Kasblad KAS01", doc: "KAS01" },

  { ref: "BANK01", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK01", doc: "BANK01" },
  { ref: "BANK02", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK02", doc: "BANK02" },
  { ref: "BANK03", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK03", doc: "BANK03" },
  { ref: "BANK04", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK04", doc: "BANK04" },
  { ref: "BANK05", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK05", doc: "BANK05" },
  // Op de afschriften met een aflossing staat de maandelijkse aflossingstabel
  // (LENING1) als hulpdocument bij de boeking.
  { ref: "BANK06", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK06", doc: "BANK06", hulpdoc: "LENING1", hulpdocTitel: "Aflossingstabel lening 2026/4471 — maandelijks" },
  { ref: "BANK07", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK07", doc: "BANK07" },
  { ref: "BANK08", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK08", doc: "BANK08" },
  { ref: "BANK09", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK09", doc: "BANK09" },
  { ref: "BANK10", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK10", doc: "BANK10", hulpdoc: "LENING1", hulpdocTitel: "Aflossingstabel lening 2026/4471 — maandelijks" },
  { ref: "BANK11", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK11", doc: "BANK11" },
  { ref: "BANK12", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK12", doc: "BANK12" },
  { ref: "BANK13", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK13", doc: "BANK13", hulpdoc: "LENING1", hulpdocTitel: "Aflossingstabel lening 2026/4471 — maandelijks" },

  {
    ref: "BTW", categorie: "BTW-verwerking", titel: "Btw-verwerking BTW", geenDocument: true,
    instructie: "Kijk in de T-rekeningen rechts naar het saldo van de tussentijdse btw-rekeningen (dat zijn de 411- en 451-rekeningen die niet op 000 eindigen). Na het invullen van de btw-aangifte van het kwartaal moet de btw van deze tijdelijke rekeningen gecentraliseerd worden op 411000 Terug te vorderen btw-saldo of 451000 Te betalen btw-saldo.",
  },

  { ref: "AFSCHR1", categorie: "Eindejaarsverrichtingen", titel: "Afschrijvingen AFSCHR1", doc: "AFSCHR1" },
  { ref: "LENING2", categorie: "Eindejaarsverrichtingen", titel: "Lening LENING2 — overboeking lange naar korte termijn", doc: "LENING2" },
  { ref: "VR", categorie: "Eindejaarsverrichtingen", titel: "Voorraad VR", doc: "VR" },

  // BELASTING en RESULTAAT worden NIET via de generieke lijst getoond (ze
  // staan samen op één speciale pagina, zie §8 van de specificatie), maar ze
  // moeten wel meetellen in de referentiecontrole en in de T-rekeningen.
  { ref: "BELASTING", categorie: "Resultaatverwerking", titel: "Vennootschapsbelasting BELASTING", geenDocument: true, verborgenInNav: true },
  { ref: "RESULTAAT", categorie: "Resultaatverwerking", titel: "Overgedragen winst RESULTAAT", geenDocument: true, verborgenInNav: true },
];

// Volgorde van categorieën in de navigatie (§4 van de specificatie).
const CATEGORIE_VOLGORDE = [
  "Beginbalans",
  "Aankopen",
  "Verkopen",
  "Dagontvangsten",
  "Loonverwerking",
  "Financiële verrichtingen",
  "BTW-verwerking",
  "Eindejaarsverrichtingen",
];

// Welke categorieën bevatten BETALINGEN? Op het tabblad Klanten &
// leveranciers bepaalt dit of een verrichting op 400000/440000 rechts komt
// (een betaling) of links (een factuur of creditnota). Een bankafschrift of
// kasblad is een betaling; een aankoop- of verkoopdocument niet.
//
// Bewust op de categorie en niet op de rekeningen in de boeking: boekt een
// leerling een factuur rechtstreeks op de bank, dan blijft het document hier
// een factuur en valt de fout op in plaats van weggemoffeld te worden.
// Verandert de bundel van opbouw, dan pas je enkel dit lijstje aan.
const CATEGORIE_BETALINGEN = [
  "Financiële verrichtingen",
];

// Een korte tip die net boven het redeneerschema verschijnt (geen popup, ze
// moeten ze zien staan). Wil je er één bij een andere opdracht, zet dan
// gewoon een veld "tip" bij dat item in de lijst hierboven.
const TIP_BANK =
  "Klopt je saldo op de T-rekening van de bank met het bankafschrift? " +
  "Check dat vóór én na je boeking — zo weet je zeker dat je wijziging op de bankrekening juist geboekt is.";

OPDRACHTEN.forEach(function (o) {
  if (String(o.ref).indexOf("BANK") === 0 && !o.tip) o.tip = TIP_BANK;
});
