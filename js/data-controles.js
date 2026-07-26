// data-controles.js
// Alles wat bij het tabblad "Controles" hoort (§7 van de specificatie).
// Wijzigt dit per jaar/bundel? Pas het hier aan, niet in app.js.

// Welk document toont de app als "laatste bankafschrift" en "laatste
// kasblad", voor de controle van 550000 (bank) en 570000 (kas)?
// Vul de referentie in zoals ze in data-opdrachten.js staat.
const CONTROLE_CONFIG = {
  laatsteBankRef: "BANK05",
  laatsteKasRef: "KAS01",
  voorraadRef: "DIV05",
};

// Handmatige controles: de leerling vinkt zelf "in orde" aan, met het
// T-panel en eventueel een klein documentbeeld erbij (§7).
// type "check": gewone ja/nee-vraag.
// type "check-met-document": ja/nee-vraag + klein documentbeeld ernaast.
const HANDMATIGE_CONTROLES = [
  {
    id: "btw-tussentijds-leeg",
    type: "check",
    vraag: "Zijn alle tussentijdse btw-rekeningen leeg? (alle 411- en 451-rekeningen die niet op 000 eindigen)",
  },
  {
    id: "banksaldo-klopt",
    type: "check-met-document",
    vraag: "Is het banksaldo op het laatste afschrift gelijk aan het saldo op 550000?",
    doc: CONTROLE_CONFIG.laatsteBankRef,
  },
  {
    id: "kassaldo-klopt",
    type: "check-met-document",
    vraag: "Is het kassaldo op het laatste kasblad gelijk aan het saldo op 570000?",
    doc: CONTROLE_CONFIG.laatsteKasRef,
  },
  {
    id: "voorraad-klopt",
    type: "check-met-document",
    vraag: "Klopt de voorraad met de telling?",
    doc: CONTROLE_CONFIG.voorraadRef,
  },
  {
    id: "vaste-activa-nummers",
    type: "check",
    vraag: "Is bij de vaste activa per type telkens hetzelfde nummer gebruikt voor aanschafwaarde en afschrijving? (dus geen afschrijving op bv. 241009 terwijl de aanschafwaarde op 230000 geboekt staat)",
  },
  {
    id: "interne-overboekingen-nul",
    type: "check",
    vraag: "Staat 580000 (interne overboekingen) terug op 0?",
  },
  {
    id: "lonen-uitbetaald",
    type: "check",
    vraag: "Staan 455200 en 455300 (verschuldigde lonen en salarissen) op 0 na uitbetaling?",
  },
];
