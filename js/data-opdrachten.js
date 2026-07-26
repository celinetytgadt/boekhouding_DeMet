// data-opdrachten.js
// Lijst van alle opdrachten (verantwoordingsstukken) met hun referentie,
// categorie (voor de navigatie) en titel. Dit is de enige plaats die
// aangepast moet worden als er een opdracht bijkomt, wegvalt of van naam
// verandert. De app zelf (app.js) hoeft daarvoor niet aangeraakt te worden.
//
// Veld "doc": de bestandsnaam (zonder extensie) van de afbeelding in
// documenten/. De app probeert automatisch .png en .jpg.
// Veld "geenDocument": true als er geen verantwoordingsstuk bij hoort
// (bv. DIV06/DIV07, die volgen uit eigen berekeningen).

const OPDRACHTEN = [
  // "doc" moet de bestandsnaam op GitHub exact matchen — GitHub Pages is
  // hoofdlettergevoelig (Windows niet, dus dat valt thuis niet op).
  { ref: "beginbalans", categorie: "Beginbalans", titel: "Beginbalans", doc: "Beginbalans" },

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
  { ref: "AK11", categorie: "Aankopen", titel: "Aankoop AK11", doc: "AK11" },
  { ref: "AK12", categorie: "Aankopen", titel: "Aankoop AK12", doc: "AK12" },
  { ref: "AK13", categorie: "Aankopen", titel: "Aankoop AK13", doc: "AK13" },
  { ref: "AK14", categorie: "Aankopen", titel: "Aankoop AK14", doc: "AK14" },

  { ref: "VK01", categorie: "Verkopen", titel: "Verkoop VK01", doc: "VK01" },
  { ref: "VK02", categorie: "Verkopen", titel: "Verkoop VK02", doc: "VK02" },
  { ref: "VK03", categorie: "Verkopen", titel: "Verkoop VK03", doc: "VK03" },
  { ref: "VK04", categorie: "Verkopen", titel: "Verkoop VK04", doc: "VK04" },
  { ref: "VK05", categorie: "Verkopen", titel: "Verkoop VK05", doc: "VK05" },
  { ref: "VK06", categorie: "Verkopen", titel: "Verkoop VK06", doc: "VK06" },
  { ref: "VK07", categorie: "Verkopen", titel: "Verkoop VK07", doc: "VK07" },
  { ref: "VK08", categorie: "Verkopen", titel: "Verkoop VK08", doc: "VK08" },
  { ref: "VK09", categorie: "Verkopen", titel: "Verkoop VK09", doc: "VK09" },
  { ref: "VK10", categorie: "Verkopen", titel: "Verkoop VK10", doc: "VK10" },

  { ref: "ONTV01", categorie: "Dagontvangsten", titel: "Dagontvangst ONTV01", doc: "ONTV01" },

  { ref: "DIV01", categorie: "Loonverwerking", titel: "Loonsynthese DIV01", doc: "DIV01" },

  { ref: "BANK01", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK01", doc: "BANK01" },
  { ref: "BANK02", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK02", doc: "BANK02" },
  { ref: "BANK03", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK03", doc: "BANK03" },
  { ref: "BANK04", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK04", doc: "BANK04" },
  { ref: "BANK05", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK05", doc: "BANK05" },
  { ref: "BANK06", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK06", doc: "BANK06" },
  { ref: "BANK07", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK07", doc: "BANK07" },
  { ref: "BANK08", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK08", doc: "BANK08" },
  { ref: "BANK09", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK09", doc: "BANK09" },
  { ref: "BANK10", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK10", doc: "BANK10" },
  { ref: "BANK11", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK11", doc: "BANK11" },
  { ref: "BANK12", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK12", doc: "BANK12" },
  { ref: "BANK13", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK13", doc: "BANK13" },
  { ref: "BANK14", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK14", doc: "BANK14" },
  { ref: "BANK15", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK15", doc: "BANK15" },
  { ref: "BANK16", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK16", doc: "BANK16" },
  { ref: "BANK17", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK17", doc: "BANK17" },
  { ref: "BANK18", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK18", doc: "BANK18" },
  { ref: "BANK19", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK19", doc: "BANK19" },
  { ref: "BANK20", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK20", doc: "BANK20" },
  { ref: "BANK21", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK21", doc: "BANK21" },
  { ref: "BANK22", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK22", doc: "BANK22" },
  { ref: "BANK23", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK23", doc: "BANK23" },
  { ref: "BANK24", categorie: "Financiële verrichtingen", titel: "Bankafschrift BANK24", doc: "BANK24" },
  { ref: "KAS01", categorie: "Financiële verrichtingen", titel: "Kasblad KAS01", doc: "KAS01" },

  {
    ref: "DIV02", categorie: "BTW-verwerking", titel: "BTW-verwerking DIV02", geenDocument: true,
    instructie: "Kijk in de T-rekeningen rechts naar het saldo van de tussentijdse btw-rekeningen (dat zijn de 411 en 451 rekeningen die niet op 000 eindigen). Na het invullen van de btw-aangifte van het kwartaal, moet de btw van deze tijdelijke btw-rekeningen gecentraliseerd worden op 411000 Terug te vorderen btw-saldo of 451000 Te betalen btw-saldo.",
  },

  { ref: "DIV03", categorie: "Eindejaarsverrichtingen", titel: "Afschrijvingen DIV03", doc: "DIV03" },
  { ref: "DIV04", categorie: "Eindejaarsverrichtingen", titel: "Lening DIV04", doc: "DIV04" },
  { ref: "DIV05", categorie: "Eindejaarsverrichtingen", titel: "Voorraad DIV05", doc: "DIV05" },

  // DIV06 en DIV07 worden NIET via de generieke lijst getoond (ze staan
  // samen op één speciale pagina, zie §8 van de specificatie), maar ze
  // moeten wel meetellen in de referentiecontrole en in de T-rekeningen.
  { ref: "DIV06", categorie: "Resultaatverwerking", titel: "Vennootschapsbelasting DIV06", geenDocument: true, verborgenInNav: true },
  { ref: "DIV07", categorie: "Resultaatverwerking", titel: "Overgedragen winst DIV07", geenDocument: true, verborgenInNav: true },
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