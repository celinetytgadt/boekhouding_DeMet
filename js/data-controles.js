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
    vraag: "Zijn alle tussentijdse btw-rekeningen leeg? (alle 411- en 451-rekeningen die niet op 000 eindigen)",
    toelichting: "Na de btw-aangifte hoort alle btw samen te staan op 411000 of 451000. De tussentijdse rekeningen moeten dan op nul komen.",
    rekeningen: ["411*", "451*"],
    filterTip: "Filter in het T-paneel op klasse 4 en dan op rubriek 41 of 45.",
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
    toelichting: "Het saldo van 340000 moet gelijk zijn aan de waarde van de voorraadtelling hiernaast. Het verschil met de beginvoorraad staat op 609400.",
    docConfig: "voorraadRef",
    rekeningen: ["340000", "609400"],
  },
  {
    id: "vaste-activa-nummers",
    type: "check",
    vraag: "Hoort bij elke aanschafwaarde de afschrijving met hetzelfde nummer?",
    toelichting: "Bij elke rekening met een saldo die op 000 eindigt, hoort een rekening met hetzelfde begin die op 009 eindigt — bijvoorbeeld 230000 en 230009. Kijk in het lijstje hieronder of dat overal klopt.",
    uitleg: "vasteActiva",
    rekeningen: ["2*"],
    filterTip: "Filter in het T-paneel op klasse 2 (Vaste activa).",
  },
  {
    id: "interne-overboekingen-nul",
    type: "check",
    vraag: "Staat 580000 (interne overboekingen) terug op 0?",
    toelichting: "Elke overboeking tussen bank en kas passeert hier, één keer debet en één keer credit. Blijft er iets staan, dan ontbreekt de tegenboeking.",
    rekeningen: ["580000"],
  },
  {
    id: "lonen-uitbetaald",
    type: "check",
    vraag: "Staan 455200 en 455300 (verschuldigde lonen en salarissen) op 0 na uitbetaling?",
    toelichting: "Bij de loonstaat komt het nettoloon credit op deze rekeningen. Bij de uitbetaling via de bank gaat het er debet weer af.",
    rekeningen: ["455200", "455300"],
  },
];
