// data-controles.js — oefendossier Fietsatelier Noor bv (1e kwartaal 2028)
//
// Zelfde opbouw als js/data-controles.js (MetWear): lees daar de uitleg bij
// elk veld. Hier staan de controles per les van het oefendossier.

const CONTROLE_CONFIG = {
  laatsteBankRef: null,   // automatisch het hoogste BANK…-document
  laatsteKasRef: null,    // automatisch het hoogste KAS…-document
  voorraadRef: "VR",
  beginbalansRef: "BB",
};

const SALDO_UITZONDERINGEN = {
  "604010": "C",  // Retours op aankopen (-)
  "604020": "C",  // Handelskorting op aankopen (-)
  "704010": "D",  // Retours op verkopen (-)
  "704020": "D",  // Handelskorting op verkopen (-)
};

const SALDO_GEEN_CONTROLE = [
  "580000",  // Interne overboekingen — moet net op 0 komen, apart nagekeken
  "609400",  // Voorraadwijziging: daalt de voorraad, dan staat ze debet
];

const INLEIDING_CONTROLES = "Hieronder vind je één of meerdere controles die je zelf kunt overlopen voor je indient. Bekijk elke controle en check of je er aan voldoet.";

const CATEGORIE_CONTROLES = {
  "Beginbalans": {
    inleiding: "Zet de rubrieken van je openingsboeking op hun plaats in de balans. Zo zie je in één oogopslag of je beginbalans klopt met het document. Je toewijzing wordt bewaard, zo bespaar je alvast wat werk voor de eindbalans.",
    invulbalansVoorRef: "BB",
  },
  "Aankopen 1 · kortingen": { inleiding: INLEIDING_CONTROLES },
  "Aankopen 2 · kosten, verpakking en investeringen": { inleiding: INLEIDING_CONTROLES },
  "Aankopen 3 · creditnota's en over te dragen kosten": { inleiding: INLEIDING_CONTROLES },
  "Verkopen 1 · handelskorting en kosten": { inleiding: INLEIDING_CONTROLES },
  "Verkopen 2 · verpakking, creditnota's, financiële korting": { inleiding: INLEIDING_CONTROLES },
  "Lonen 1 · loonstaten": { inleiding: INLEIDING_CONTROLES },
  "Lonen 2 · RSZ, voorheffing en personeelskosten": { inleiding: INLEIDING_CONTROLES },
  "Financiële verrichtingen": {
    inleiding: INLEIDING_CONTROLES + " Hier komen kas, bank, de lonen en je klanten en leveranciers samen. Neem er de tijd voor vóór je indient.",
  },
  "BTW-verwerking": { inleiding: INLEIDING_CONTROLES },
  "Eindejaarsverrichtingen": { inleiding: INLEIDING_CONTROLES },
};

const HANDMATIGE_CONTROLES = [

  /* ---------------- Beginbalans ---------------- */
  {
    id: "noor-beginbalans-klopt",
    categorie: "Beginbalans",
    type: "check-met-document",
    vraag: "Komt de balans die je hierboven gelegd hebt overeen met het document?",
    toelichting: "Vergelijk vak per vak met de beginbalans. Staat er een rubriek op een plaats waar ze niet hoort, of ontbreekt er een bedrag, ga dan terug naar je boeking van BB.",
    docConfig: "beginbalansRef",
  },

  /* ---------------- Aankopen 1 · kortingen ---------------- */
  {
    id: "noor-ak1-handelskorting",
    categorie: "Aankopen 1 · kortingen",
    type: "check",
    vraag: "Staat elke handelskorting apart op 604020, en niet afgetrokken van 604000?",
    toelichting: "Op 604000 komt de prijs van de goederen vóór korting. De handelskorting zie je apart, credit, op 604020. Tel je ze samen, dan krijg je wat de goederen echt kosten.",
    filterTip: "Filter in het T-paneel op rubriek 60.",
  },
  {
    id: "noor-ak1-financiele-korting",
    categorie: "Aankopen 1 · kortingen",
    type: "check",
    vraag: "Boekte je de financiële korting nog níét bij de factuur?",
    toelichting: "Of je de financiële korting krijgt, weet je pas bij de betaling: betaal je binnen de termijn, dan boek je ze bij het rekeninguittreksel op 757000. Bij de factuur staat op 440000 dus het volledige bedrag. Enkel de btw is al berekend op het bedrag na korting.",
    filterTip: "Filter in het T-paneel op 440000.",
  },

  /* ---------------- Aankopen 2 ---------------- */
  {
    id: "noor-ak2-verpakking",
    categorie: "Aankopen 2 · kosten, verpakking en investeringen",
    type: "check",
    vraag: "Staat de waarborg voor verpakking op 418000, zonder btw?",
    toelichting: "Een waarborg is geen kost: je krijgt hem terug als je de verpakking terugstuurt. Het is dus een vordering op de leverancier.",
    filterTip: "Filter in het T-paneel op 418000.",
  },
  {
    id: "noor-ak2-investering",
    categorie: "Aankopen 2 · kosten, verpakking en investeringen",
    type: "check",
    vraag: "Staan de investeringen in klasse 2, met de bijkomende kosten erbij?",
    toelichting: "Wat Noor jaren gebruikt (een werkbank, een tablet), is geen kost maar een vast actief. Levering en montage van zo'n investering horen bij de aanschafwaarde: ze komen op dezelfde rekening als het actief zelf.",
    filterTip: "Filter in het T-paneel op klasse 2 (Vaste activa).",
  },

  /* ---------------- Aankopen 3 ---------------- */
  {
    id: "noor-ak3-creditnota",
    categorie: "Aankopen 3 · creditnota's en over te dragen kosten",
    type: "check",
    vraag: "Staat de btw van de inkomende creditnota's op 451200?",
    toelichting: "Bij een creditnota van een leverancier moet je btw terugbetalen aan de staat: een schuld. Die komt op 451200 en niet als min op 411100.",
    filterTip: "Filter in het T-paneel op 451200.",
  },
  {
    id: "noor-ak3-volledig-kost",
    categorie: "Aankopen 3 · creditnota's en over te dragen kosten",
    type: "check",
    vraag: "Staan de verzekering (AK16) en de huur (AK17) volledig in de kosten, en nog niets op 490000?",
    toelichting: "Ook al loopt een factuur verder dan 31 maart: bij de aankoop boek je het hele bedrag als kost. Het deel dat bij later hoort, haal je er pas bij de afsluiting uit (Eindejaarsverrichtingen).",
    filterTip: "Filter in het T-paneel op rubriek 61.",
  },

  /* ---------------- Verkopen 1 ---------------- */
  {
    id: "noor-vk1-klanten",
    categorie: "Verkopen 1 · handelskorting en kosten",
    type: "check",
    vraag: "Vind je op 400000 elke verkoopfactuur terug, VK01 tot en met VK06?",
    filterTip: "Filter in het T-paneel op 400000.",
  },
  {
    id: "noor-vk1-diensten",
    categorie: "Verkopen 1 · handelskorting en kosten",
    type: "check",
    vraag: "Staan herstellingen en onderhoud op 700000, en de fietsen en onderdelen op 704000?",
    toelichting: "Noor verkoopt goederen (21% btw) en diensten (6% btw). Ze komen op een andere opbrengstrekening. Doorgerekende transport- of leveringskosten komen op 746000.",
    filterTip: "Filter in het T-paneel op rubriek 70.",
  },

  /* ---------------- Verkopen 2 ---------------- */
  {
    id: "noor-vk2-verpakking",
    categorie: "Verkopen 2 · verpakking, creditnota's, financiële korting",
    type: "check",
    vraag: "Staat 488000 terug op 0, nu de fietsrekken terug zijn?",
    toelichting: "De waarborg die Noor aanrekende, is een schuld aan de klant. Met de creditnota voor de teruggestuurde rekken verdwijnt die schuld weer.",
    filterTip: "Filter in het T-paneel op 488000.",
  },
  {
    id: "noor-vk2-dagontvangsten",
    categorie: "Verkopen 2 · verpakking, creditnota's, financiële korting",
    type: "check-met-document",
    vraag: "Staat bij de dagontvangsten het volledige bedrag (incl. btw) debet op 400000?",
    toelichting: "Of de klant contant of met bancontact betaalde, boek je pas bij de financiële verrichtingen (kasstuk en uittreksel).",
    docs: [{ doc: "ONTV01", titel: "Dagontvangsten ONTV01" }],
    filterTip: "Filter in het T-paneel op 400000.",
  },

  /* ---------------- Lonen 1 ---------------- */
  {
    id: "noor-l1-loonkost",
    categorie: "Lonen 1 · loonstaten",
    type: "check",
    vraag: "Is het totaal van 620200, 620300 en 621000 gelijk aan de totale loonkost van de zes loonstaten samen?",
    toelichting: "Brutoloon + werkgeversbijdragen = wat de werkgever écht betaalt. Tel de regel 'totale loonkost' van elke loonstaat op.",
    filterTip: "Filter in het T-paneel op rubriek 62.",
  },
  {
    id: "noor-l1-netto",
    categorie: "Lonen 1 · loonstaten",
    type: "check",
    vraag: "Staan de nettolonen op 455300 (arbeiders) en 455200 (bedienden)?",
    toelichting: "Jonas is arbeider, Lina is bediende: elk statuut heeft zijn eigen rekening voor de verschuldigde lonen.",
    filterTip: "Filter in het T-paneel op 455.",
  },

  /* ---------------- Lonen 2 ---------------- */
  {
    id: "noor-l2-rsz-bv",
    categorie: "Lonen 2 · RSZ, voorheffing en personeelskosten",
    type: "check",
    vraag: "Staan 453000 en 454000 op 0, nu Loonwijs ze voor jou doorstort?",
    toelichting: "Met de drie facturen van Loonwijs (AK18 tot en met AK20) neemt het sociaal secretariaat de bedrijfsvoorheffing en de RSZ over. In de plaats komt een schuld aan Loonwijs op 440000.",
    filterTip: "Filter in het T-paneel op 453 en daarna op 454.",
  },

  /* ---------------- Financiële verrichtingen ---------------- */
  {
    id: "noor-banksaldo-klopt",
    categorie: "Financiële verrichtingen",
    type: "check-met-document",
    vraag: "Is het banksaldo op het laatste afschrift gelijk aan het saldo op 550000?",
    docConfig: "laatsteBankRef",
  },
  {
    id: "noor-kassaldo-klopt",
    categorie: "Financiële verrichtingen",
    type: "check-met-document",
    vraag: "Is het kassaldo op het laatste kasstuk gelijk aan het saldo op 570000?",
    docConfig: "laatsteKasRef",
  },
  {
    id: "noor-interne-overboekingen-nul",
    categorie: "Financiële verrichtingen",
    type: "check",
    vraag: "Staat 580000 (interne overboekingen) terug op 0?",
    toelichting: "De storting van de kassa naar de bank passeert hier, één keer debet (kasstuk) en één keer credit (uittreksel).",
    filterTip: "Filter in het T-paneel op 580000.",
  },
  {
    id: "noor-lonen-uitbetaald",
    categorie: "Financiële verrichtingen",
    type: "check",
    vraag: "Staan de loonschulden terug op 0, nu de nettolonen betaald zijn?",
    filterTip: "Filter in het T-paneel op 455.",
  },
  {
    id: "noor-financiele-korting",
    categorie: "Financiële verrichtingen",
    type: "check",
    vraag: "Boekte je een financiële korting enkel als er binnen de termijn betaald werd?",
    toelichting: "Kijk op de factuur tot wanneer de korting geldt en vergelijk met de datum op het uittreksel. Te laat betaald: dan wordt het volledige bedrag betaald en is er geen korting.",
    filterTip: "Filter in het T-paneel op 657000 en op 757000.",
  },
  {
    id: "noor-klanten-openstaand-klopt",
    categorie: "Financiële verrichtingen",
    type: "check",
    relatieSoort: "klanten",
    vraag: "Is het totaal nog open bij je klanten gelijk aan het saldo op 400000?",
    toelichting: "Het overzicht hieronder komt uit je eigen boekingen op de pagina Klanten & leveranciers. Punt daar ook alles af: elke betaling en creditnota hoort bij een factuur.",
    filterTip: "Filter in het T-paneel op 400000.",
  },
  {
    id: "noor-leveranciers-openstaand-klopt",
    categorie: "Financiële verrichtingen",
    type: "check",
    relatieSoort: "leveranciers",
    vraag: "Is het totaal nog open bij je leveranciers gelijk aan het saldo op 440000?",
    toelichting: "Het overzicht hieronder komt uit je eigen boekingen op de pagina Klanten & leveranciers. Punt daar ook alles af: elke betaling en creditnota hoort bij een factuur.",
    filterTip: "Filter in het T-paneel op 440000.",
  },

  /* ---------------- BTW-verwerking ---------------- */
  {
    id: "noor-btw-tussentijds-leeg",
    categorie: "BTW-verwerking",
    type: "check",
    vraag: "Zijn alle tussentijdse btw-rekeningen leeg, en is het tegoed van vorig kwartaal verrekend?",
    toelichting: "Na de btw-aangifte hoort alle btw samen te staan op 411000 of 451000 — niet op allebei. Het tegoed van het 4e kwartaal 2027 (411000 op de beginbalans) verreken je mee.",
    filterTip: "Filter in het T-paneel op btw.",
  },

  /* ---------------- Eindejaarsverrichtingen ---------------- */
  {
    id: "noor-vaste-activa-nummers",
    categorie: "Eindejaarsverrichtingen",
    type: "check",
    vraag: "Hoort bij elke aanschafwaarde de afschrijving met hetzelfde nummer?",
    toelichting: "Elk soort vast actief heeft twee rekeningen die bij elkaar horen: de aanschafwaarde (bv. 232000) en de geboekte afschrijvingen met hetzelfde basisnummer, eindigend op 9 (232009).",
    filterTip: "Filter in het T-paneel op klasse 2 (Vaste activa).",
  },
  {
    id: "noor-lening-kort",
    categorie: "Eindejaarsverrichtingen",
    type: "check-met-document",
    vraag: "Staat op 423000 precies het kapitaal dat in de komende twaalf maanden afgelost wordt?",
    toelichting: "Tel in de aflossingstabel de kapitaalaflossingen van 1 april 2028 tot en met 31 maart 2029. Dat deel is een schuld op ten hoogste één jaar; de rest blijft op 173000.",
    docs: [{ doc: "LENING", titel: "Aflossingstabel" }],
    filterTip: "Filter in het T-paneel op kredietinstellingen.",
  },
  {
    id: "noor-over-te-dragen",
    categorie: "Eindejaarsverrichtingen",
    type: "check",
    vraag: "Staat op 490000 enkel het deel van de kosten dat ná 31 maart 2028 valt?",
    toelichting: "Tel per factuur (AK16, AK17 en AK22) de maanden na 31 maart. Dat deel gaat van de kostenrekening naar 490000; wat overblijft op de kostenrekening is de kost van dit kwartaal.",
    filterTip: "Filter in het T-paneel op 490000.",
  },
  {
    id: "noor-voorraad-klopt",
    categorie: "Eindejaarsverrichtingen",
    type: "check-met-document",
    vraag: "Klopt de voorraad met de telling?",
    toelichting: "Het saldo van de actiefrekening \"Voorraad handelsgoederen\" moet gelijk zijn aan de waarde van de voorraadtelling hiernaast.",
    docConfig: "voorraadRef",
    filterTip: "Filter in het T-paneel op voorraad.",
  },
];
