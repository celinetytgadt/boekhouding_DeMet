// data-controles.js
// Alles wat bij het tabblad "Controles" hoort (§7 van de specificatie).
// Wijzigt dit per jaar/bundel? Pas het hier aan, niet in app.js.

// Welk document toont de app als "laatste bankafschrift" en "laatste
// kasblad", voor de controle van 550000 (bank) en 570000 (kas)?
//
// Laat je laatsteBankRef of laatsteKasRef leeg (of op null), dan zoekt de app
// zelf het hoogst genummerde BANK…- of KAS…-document uit
// data-opdrachten.js. Zo staat er nooit meer een oud afschrift bij deze
// controle als er een bankafschrift bijkomt of wegvalt.
// Wil je toch een vast document opleggen, vul dan de referentie in.
const CONTROLE_CONFIG = {
  laatsteBankRef: null,   // bv. "BANK13" om het vast te zetten
  laatsteKasRef: null,    // bv. "KAS01" om het vast te zetten
  voorraadRef: "VR",
};

// Rekeningen waarvan de verwachte saldokant afwijkt van de gewone regel
// (actief en kost = debet, passief en opbrengst = credit).
//
// Het gaat om contrarekeningen: rekeningen die in het MAR bij de kosten of de
// opbrengsten staan, maar die er net van afgetrokken worden. Een retour op
// een aankoop is een kostenrekening, maar houdt een creditsaldo over.
//
// Rekeningen die op 9 eindigen (geboekte afschrijvingen, bv. 230009) worden
// al automatisch als contrarekening herkend en hoeven hier niet in te staan.
const SALDO_UITZONDERINGEN = {
  "604010": "C",  // Retours op aankopen (-)
  "604020": "C",  // Handelskorting op aankopen (-)
  "609400": "C",  // Voorraadwijzigingen handelsgoederen — bij een stijgende voorraad
  "704010": "D",  // Retours op verkopen (-)
  "704020": "D",  // Handelskorting op verkopen (-)
};

// Rekeningen die de app helemaal niet op saldokant controleert, omdat meer
// dan één kant een geldig resultaat is.
const SALDO_GEEN_CONTROLE = [
  "580000",  // Interne overboekingen — moet net op 0 komen, apart nagekeken
];

// Handmatige controles: de leerling vinkt zelf "in orde" aan, met het
// T-panel en eventueel een klein documentbeeld erbij (§7).
//
// type "check"               gewone ja/nee-vraag
// type "check-met-document"  ja/nee-vraag + klein documentbeeld ernaast
//
// Optionele velden bij elke controle:
//   toelichting  één zin extra uitleg onder de vraag
//   uitleg       sleutel uit data-info.js — zet een i-icoontje bij de vraag
//   rekeningen   welke rekeningen de leerling hiervoor moet bekijken. De app
//                toont ze met hun saldo, klikbaar naar het T-paneel. Je kan
//                een volledig nummer opgeven ("340000") of een patroon met
//                een sterretje ("411*" voor alles wat met 411 begint).
//   filterTip    welke filter ze in het T-paneel kunnen zetten om dit na te
//                kijken
const HANDMATIGE_CONTROLES = [
  {
    id: "btw-tussentijds-leeg",
    type: "check",
    vraag: "Zijn alle tussentijdse btw-rekeningen leeg? ",
    toelichting: "Na de btw-aangifte hoort alle btw samen te staan op 411000 of 451000. De tussentijdse rekeningen (alle 411- en 451-rekeningen die niet op 000 eindigen) moeten dan op nul komen.",
    filterTip: "Filter in het T-paneel op btw.",
  },
  {
    id: "banksaldo-klopt",
    type: "check-met-document",
    vraag: "Is het banksaldo op het laatste afschrift gelijk aan het saldo op 550000?",
    docConfig: "laatsteBankRef",
    rekeningen: ["550000"],
  },
  {
    id: "kassaldo-klopt",
    type: "check-met-document",
    vraag: "Is het kassaldo op het laatste kasblad gelijk aan het saldo op 570000?",
    docConfig: "laatsteKasRef",
    rekeningen: ["570000"],
  },
  {
    id: "voorraad-klopt",
    type: "check-met-document",
    vraag: "Klopt de voorraad met de telling?",
    toelichting: "Het saldo van de actief rekening "Voorraad handelsgoederen" moet gelijk zijn aan de waarde van de voorraadtelling hiernaast.",
    docConfig: "voorraadRef",
    filterTip: "Filter in het T-paneel op voorraad.",
  },
  {
    id: "vaste-activa-nummers",
    type: "check",
    vraag: "Hoort bij elke aanschafwaarde de afschrijving met hetzelfde nummer?",
    toelichting: "Elk soort vast actief heeft in het MAR twee rekeningen die bij elkaar horen:",
      { stap: "de aanschafwaarde, bijvoorbeeld 230000 Installaties, machines en uitrusting;" },
      { stap: "de geboekte afschrijvingen, met hetzelfde nummer maar eindigend op 9: 230009." },
      "Die twee moeten altijd hetzelfde basisnummer hebben. Boek je de aankoop van een machine op 230000, dan hoort de afschrijving erop op 230009 — niet op 240009 of 241009.",
      "Klopt dat niet, dan lijkt het alsof je een machine afschrijft die je nooit gekocht hebt, én alsof je meubilair hebt dat nooit afgeschreven wordt.",
    filterTip: "Filter in het T-paneel op klasse 2 (Vaste activa).",
  },
  {
    id: "interne-overboekingen-nul",
    type: "check",
    vraag: "Staat 580000 (interne overboekingen) terug op 0?",
    toelichting: "Elke overboeking tussen bank en kas passeert hier, één keer debet en één keer credit. Blijft er iets staan, dan ontbreekt de tegenboeking.",
    filterTip: "Filter in het T-paneel op 580000.",
  },
  {
    id: "lonen-uitbetaald",
    type: "check",
    vraag: "Alle schulden met betrekking tot de lonen moeten op 0 staan, aangezien die betaald zijn. ",
    toelichting: "Bij de loonstaat komt het nettoloon credit op deze rekeningen. Bij de uitbetaling via de bank gaat het er debet weer af.",
    filterTip: "Filter in het T-paneel op rubriek 45 (negeer de btw & belasting-rekeningen).",
  },
];
