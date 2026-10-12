// data-opdrachten.js — oefendossier Fietsatelier Noor bv, 1e kwartaal 2028
//
// GEMAAKT DOOR hulpmiddelen/noor/maak-data.js uit de case (case-j3.json).
// Pas de case aan en draai het script opnieuw, liever dan dit bestand met de
// hand te wijzigen: zo blijven documenten, opdrachten en sleutel gelijk.
//
// Zelfde velden als js/data-opdrachten.js (MetWear). De documenten staan in
// documenten/noor/ (zie js/noor/dossier.js).
//
// Elke categorie is een les; na elke les maken de leerlingen die stukken.

const OPDRACHTEN = [
  // Beginbalans
  {"categorie": "Beginbalans", "ref": "BB", "navLabel": "BEGINBALANS (BB)", "titel": "Beginbalans 1 januari 2028 (BB)", "doc": "BEGINBALANS"},

  // Aankopen 1 · kortingen
  {"ref": "AK01", "categorie": "Aankopen 1 · kortingen", "titel": "Aankoop AK01", "doc": "AK01"},
  {"ref": "AK02", "categorie": "Aankopen 1 · kortingen", "titel": "Aankoop AK02", "doc": "AK02"},
  {"ref": "AK03", "categorie": "Aankopen 1 · kortingen", "titel": "Aankoop AK03", "doc": "AK03"},
  {"ref": "AK04", "categorie": "Aankopen 1 · kortingen", "titel": "Aankoop AK04", "doc": "AK04"},
  {"ref": "AK05", "categorie": "Aankopen 1 · kortingen", "titel": "Aankoop AK05", "doc": "AK05"},
  {"ref": "AK06", "categorie": "Aankopen 1 · kortingen", "titel": "Aankoop AK06", "doc": "AK06"},

  // Aankopen 2 · kosten, verpakking en investeringen
  {"ref": "AK07", "categorie": "Aankopen 2 · kosten, verpakking en investeringen", "titel": "Aankoop AK07", "doc": "AK07"},
  {"ref": "AK08", "categorie": "Aankopen 2 · kosten, verpakking en investeringen", "titel": "Aankoop AK08", "doc": "AK08"},
  {"ref": "AK09", "categorie": "Aankopen 2 · kosten, verpakking en investeringen", "titel": "Aankoop AK09", "doc": "AK09"},
  {"ref": "AK10", "categorie": "Aankopen 2 · kosten, verpakking en investeringen", "titel": "Aankoop AK10", "doc": "AK10"},
  {"ref": "AK11", "categorie": "Aankopen 2 · kosten, verpakking en investeringen", "titel": "Aankoop AK11", "doc": "AK11"},
  {"ref": "AK12", "categorie": "Aankopen 2 · kosten, verpakking en investeringen", "titel": "Aankoop AK12", "doc": "AK12"},

  // Aankopen 3 · creditnota's en over te dragen kosten
  {"ref": "AK13", "categorie": "Aankopen 3 · creditnota's en over te dragen kosten", "titel": "Aankoop AK13", "doc": "AK13"},
  {"ref": "AK14", "categorie": "Aankopen 3 · creditnota's en over te dragen kosten", "titel": "Aankoop AK14", "doc": "AK14"},
  {"ref": "AK15", "categorie": "Aankopen 3 · creditnota's en over te dragen kosten", "titel": "Aankoop AK15", "doc": "AK15"},
  {"ref": "AK16", "categorie": "Aankopen 3 · creditnota's en over te dragen kosten", "titel": "Aankoop AK16", "doc": "AK16", "tip": "Deze factuur loopt verder dan 31 maart 2028. Boek ze nu volledig als kost: het deel dat bij later hoort, regel je pas bij de afsluiting (over te dragen kosten)."},
  {"ref": "AK17", "categorie": "Aankopen 3 · creditnota's en over te dragen kosten", "titel": "Aankoop AK17", "doc": "AK17", "tip": "Deze factuur loopt verder dan 31 maart 2028. Boek ze nu volledig als kost: het deel dat bij later hoort, regel je pas bij de afsluiting (over te dragen kosten)."},

  // Verkopen 1 · handelskorting en kosten
  {"ref": "VK01", "categorie": "Verkopen 1 · handelskorting en kosten", "titel": "Verkoop VK01", "doc": "VK01"},
  {"ref": "VK02", "categorie": "Verkopen 1 · handelskorting en kosten", "titel": "Verkoop VK02", "doc": "VK02"},
  {"ref": "VK03", "categorie": "Verkopen 1 · handelskorting en kosten", "titel": "Verkoop VK03", "doc": "VK03"},
  {"ref": "VK04", "categorie": "Verkopen 1 · handelskorting en kosten", "titel": "Verkoop VK04", "doc": "VK04"},
  {"ref": "VK05", "categorie": "Verkopen 1 · handelskorting en kosten", "titel": "Verkoop VK05", "doc": "VK05"},
  {"ref": "VK06", "categorie": "Verkopen 1 · handelskorting en kosten", "titel": "Verkoop VK06", "doc": "VK06"},

  // Verkopen 2 · verpakking, creditnota's, financiële korting
  {"ref": "VK07", "categorie": "Verkopen 2 · verpakking, creditnota's, financiële korting", "titel": "Verkoop VK07", "doc": "VK07"},
  {"ref": "VK08", "categorie": "Verkopen 2 · verpakking, creditnota's, financiële korting", "titel": "Verkoop VK08", "doc": "VK08"},
  {"ref": "VK09", "categorie": "Verkopen 2 · verpakking, creditnota's, financiële korting", "titel": "Verkoop VK09", "doc": "VK09"},
  {"ref": "VK10", "categorie": "Verkopen 2 · verpakking, creditnota's, financiële korting", "titel": "Verkoop VK10", "doc": "VK10"},
  {"ref": "VK11", "categorie": "Verkopen 2 · verpakking, creditnota's, financiële korting", "titel": "Verkoop VK11", "doc": "VK11"},
  {"ref": "ONTV01", "categorie": "Verkopen 2 · verpakking, creditnota's, financiële korting", "titel": "Dagontvangsten ONTV01", "doc": "ONTV01"},

  // Lonen 1 · loonstaten
  {"ref": "LOON01", "categorie": "Lonen 1 · loonstaten", "titel": "Loonstaat LOON01", "doc": "LOON01"},
  {"ref": "LOON02", "categorie": "Lonen 1 · loonstaten", "titel": "Loonstaat LOON02", "doc": "LOON02"},
  {"ref": "LOON03", "categorie": "Lonen 1 · loonstaten", "titel": "Loonstaat LOON03", "doc": "LOON03"},
  {"ref": "LOON04", "categorie": "Lonen 1 · loonstaten", "titel": "Loonstaat LOON04", "doc": "LOON04"},
  {"ref": "LOON05", "categorie": "Lonen 1 · loonstaten", "titel": "Loonstaat LOON05", "doc": "LOON05"},
  {"ref": "LOON06", "categorie": "Lonen 1 · loonstaten", "titel": "Loonstaat LOON06", "doc": "LOON06"},

  // Lonen 2 · RSZ, voorheffing en personeelskosten
  {"ref": "AK18", "categorie": "Lonen 2 · RSZ, voorheffing en personeelskosten", "titel": "Aankoop AK18", "doc": "AK18"},
  {"ref": "AK19", "categorie": "Lonen 2 · RSZ, voorheffing en personeelskosten", "titel": "Aankoop AK19", "doc": "AK19"},
  {"ref": "AK20", "categorie": "Lonen 2 · RSZ, voorheffing en personeelskosten", "titel": "Aankoop AK20", "doc": "AK20"},
  {"ref": "AK21", "categorie": "Lonen 2 · RSZ, voorheffing en personeelskosten", "titel": "Aankoop AK21", "doc": "AK21"},
  {"ref": "AK22", "categorie": "Lonen 2 · RSZ, voorheffing en personeelskosten", "titel": "Aankoop AK22", "doc": "AK22", "tip": "Deze factuur loopt verder dan 31 maart 2028. Boek ze nu volledig als kost: het deel dat bij later hoort, regel je pas bij de afsluiting (over te dragen kosten)."},
  {"ref": "AK23", "categorie": "Lonen 2 · RSZ, voorheffing en personeelskosten", "titel": "Aankoop AK23", "doc": "AK23"},

  // Financiële verrichtingen
  {"ref": "BANK01", "categorie": "Financiële verrichtingen", "titel": "Bankafschrift BANK01", "doc": "BANK01"},
  {"ref": "BANK02", "categorie": "Financiële verrichtingen", "titel": "Bankafschrift BANK02", "doc": "BANK02"},
  {"ref": "BANK03", "categorie": "Financiële verrichtingen", "titel": "Bankafschrift BANK03", "doc": "BANK03", "hulpdoc": "LENING", "hulpdocTitel": "Aflossingstabel lening 2027-0042"},
  {"ref": "BANK04", "categorie": "Financiële verrichtingen", "titel": "Bankafschrift BANK04", "doc": "BANK04"},
  {"ref": "KAS01", "categorie": "Financiële verrichtingen", "titel": "Kasstuk KAS01", "doc": "KAS01"},
  {"ref": "KAS02", "categorie": "Financiële verrichtingen", "titel": "Kasstuk KAS02", "doc": "KAS02"},
  {"ref": "BANK05", "categorie": "Financiële verrichtingen", "titel": "Bankafschrift BANK05", "doc": "BANK05"},

  // BTW-verwerking
  {"ref": "BTW", "categorie": "BTW-verwerking", "titel": "Btw-verwerking 1e kwartaal 2028", "geenDocument": true, "instructie": "Kijk in de T-rekeningen rechts naar het saldo van de tussentijdse btw-rekeningen (de 411- en 451-rekeningen die niet op 000 eindigen). Na de btw-aangifte van het 1e kwartaal wordt die btw gecentraliseerd op 411000 Terug te vorderen btw-saldo of 451000 Te betalen btw-saldo. Let op: op de beginbalans staat nog een btw-tegoed van het 4e kwartaal 2027 op 411000. Dat tegoed verreken je mee."},

  // Eindejaarsverrichtingen
  {"ref": "AFSCHR", "categorie": "Eindejaarsverrichtingen", "titel": "Afschrijvingen 1e kwartaal 2028", "doc": "AFSCHR"},
  {"ref": "OTK", "categorie": "Eindejaarsverrichtingen", "titel": "Over te dragen kosten", "geenDocument": true, "hulpdocs": [{"doc": "AK16", "titel": "Aankoop AK16"},{"doc": "AK17", "titel": "Aankoop AK17"},{"doc": "AK22", "titel": "Aankoop AK22"}], "instructie": "Drie facturen lopen verder dan 31 maart 2028: AK16, AK17 en AK22. Je boekte ze volledig als kost. Het deel dat bij de periode ná 31 maart hoort, is nog geen kost van dit boekjaar: boek het over naar de over te dragen kosten. Reken per factuur uit hoeveel maanden er na 31 maart vallen."},
  {"ref": "LENING", "categorie": "Eindejaarsverrichtingen", "titel": "Lening: deel dat binnen het jaar vervalt", "doc": "LENING", "instructie": "Op 31 maart 2028 moet het kapitaal dat in de komende twaalf maanden (tot en met 31 maart 2029) afgelost wordt, bij de schulden op ten hoogste één jaar staan. Zoek die aflossingen op in de tabel en boek ze over."},
  {"ref": "VR", "categorie": "Eindejaarsverrichtingen", "titel": "Voorraadtelling 31 maart 2028", "doc": "VR"},

  // Resultaatverwerking
  {"ref": "BELASTING", "categorie": "Resultaatverwerking", "titel": "Vennootschapsbelasting", "geenDocument": true, "verborgenInNav": true},
  {"ref": "RESULTAAT", "categorie": "Resultaatverwerking", "titel": "Resultaatverwerking", "geenDocument": true, "verborgenInNav": true, "instructie": "Fietsatelier Noor heeft nog geen wettelijke reserve. Van de winst na belasting gaat 5% naar de wettelijke reserve, tot die 10% van het kapitaal bereikt. De rest wordt overgedragen naar volgend jaar."},
];

const CATEGORIE_VOLGORDE = [
  "Beginbalans",
  "Aankopen 1 · kortingen",
  "Aankopen 2 · kosten, verpakking en investeringen",
  "Aankopen 3 · creditnota's en over te dragen kosten",
  "Verkopen 1 · handelskorting en kosten",
  "Verkopen 2 · verpakking, creditnota's, financiële korting",
  "Lonen 1 · loonstaten",
  "Lonen 2 · RSZ, voorheffing en personeelskosten",
  "Financiële verrichtingen",
  "BTW-verwerking",
  "Eindejaarsverrichtingen"
];

// De pagina Klanten & leveranciers staat bij de financiële verrichtingen:
// pas daar valt er af te punten.
const CATEGORIE_RELATIES = "Financiële verrichtingen";

// Betaalstukken: de uittreksels en de kasstukken.
const CATEGORIE_BETALINGEN = [
  "Financiële verrichtingen",
];

const TIP_VOLGORDE =
  " Let op: dit klopt enkel als je in volgorde boekt. Ga je later terug om een vorig stuk te verbeteren, " +
  "dan zitten de boekingen van daarna al in het saldo van de T-rekening.";

const TIP_BANK =
  "Klopt je saldo op de T-rekening van de bank met het bankafschrift? " +
  "Check dat vóór én na je boeking — zo weet je zeker dat je wijziging op de bankrekening juist geboekt is." +
  TIP_VOLGORDE;

const TIP_KAS =
  "Klopt je saldo op de T-rekening van de kas met het kasstuk? " +
  "Check dat vóór én na je boeking — zo weet je zeker dat je wijziging in de kas juist geboekt is." +
  TIP_VOLGORDE;

OPDRACHTEN.forEach(function (o) {
  if (o.tip) return;
  if (String(o.ref).indexOf("BANK") === 0) o.tip = TIP_BANK;
  else if (String(o.ref).indexOf("KAS") === 0) o.tip = TIP_KAS;
});
