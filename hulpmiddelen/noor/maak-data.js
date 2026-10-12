// maak-data.js — de opdrachtenlijst, de relaties en de sleutel van het
// oefendossier Fietsatelier Noor, uit case-j3.json.
//
//   node hulpmiddelen/noor/case-j3.js      (eerst: maakt case-j3.json)
//   node hulpmiddelen/noor/maak-data.js
//
// Schrijft:
//   js/noor/data-opdrachten.js   de stukken per les, in de volgorde van het menu
//   js/noor/data-relaties.js     de klanten en leveranciers als voorstel
//   apps-script/Code.gs          enkel het blok SLEUTEL_NOOR onderaan: de
//                                oplossing, zodat het script het oefendossier
//                                meteen automatisch nakijkt
//
// js/noor/data-controles.js en js/noor/dossier.js zijn met de hand gemaakt
// en worden hier niet aangeraakt.

"use strict";
const fs = require("fs");
const path = require("path");
const CASE = require("./case-j3.json");
const ROOT = path.join(__dirname, "..", "..");

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
  "Eindejaarsverrichtingen",
];

const TITEL = {
  AK: (r) => "Aankoop " + r, "CN-AK": (r) => "Aankoop " + r, RSZ: (r) => "Aankoop " + r,
  VK: (r) => "Verkoop " + r, "CN-VK": (r) => "Verkoop " + r, DO: (r) => "Dagontvangsten " + r,
  LOON: (r) => "Loonstaat " + r, KAS: (r) => "Kasstuk " + r, BANK: (r) => "Bankafschrift " + r,
};

// Extra's per opdracht: hulpdocumenten, tips en de stukken zonder document.
const EXTRA = {
  BB: { ref: "BB", navLabel: "BEGINBALANS (BB)", titel: "Beginbalans 1 januari 2028 (BB)", doc: "BEGINBALANS" },
  BANK03: { hulpdoc: "LENING", hulpdocTitel: "Aflossingstabel lening " + CASE.lening.nr },
  BTW: {
    titel: "Btw-verwerking 1e kwartaal 2028", geenDocument: true,
    instructie: "Kijk in de T-rekeningen rechts naar het saldo van de tussentijdse btw-rekeningen (de 411- en 451-rekeningen die niet op 000 eindigen). " +
      "Na de btw-aangifte van het 1e kwartaal wordt die btw gecentraliseerd op 411000 Terug te vorderen btw-saldo of 451000 Te betalen btw-saldo. " +
      "Let op: op de beginbalans staat nog een btw-tegoed van het 4e kwartaal 2027 op 411000. Dat tegoed verreken je mee.",
  },
  AFSCHR: { titel: "Afschrijvingen 1e kwartaal 2028", doc: "AFSCHR" },
  OTK: {
    titel: "Over te dragen kosten", geenDocument: true,
    hulpdocs: [{ doc: "AK16", titel: "Aankoop AK16" }, { doc: "AK17", titel: "Aankoop AK17" }, { doc: "AK22", titel: "Aankoop AK22" }],
    instructie: "Drie facturen lopen verder dan 31 maart 2028: AK16, AK17 en AK22. Je boekte ze volledig als kost. " +
      "Het deel dat bij de periode ná 31 maart hoort, is nog geen kost van dit boekjaar: boek het over naar de over te dragen kosten. " +
      "Reken per factuur uit hoeveel maanden er na 31 maart vallen.",
  },
  LENING: {
    titel: "Lening: deel dat binnen het jaar vervalt", doc: "LENING",
    instructie: "Op 31 maart 2028 moet het kapitaal dat in de komende twaalf maanden (tot en met 31 maart 2029) afgelost wordt, " +
      "bij de schulden op ten hoogste één jaar staan. Zoek die aflossingen op in de tabel en boek ze over.",
  },
  VR: { titel: "Voorraadtelling 31 maart 2028", doc: "VR" },
  BELASTING: { titel: "Vennootschapsbelasting", geenDocument: true, verborgenInNav: true },
  RESULTAAT: {
    titel: "Resultaatverwerking", geenDocument: true, verborgenInNav: true,
    instructie: "Fietsatelier Noor heeft nog geen wettelijke reserve. Van de winst na belasting gaat 5% naar de wettelijke reserve, " +
      "tot die 10% van het kapitaal bereikt. De rest wordt overgedragen naar volgend jaar.",
  },
};
const TIP_OTK = "Deze factuur loopt verder dan 31 maart 2028. Boek ze nu volledig als kost: het deel dat bij later hoort, regel je pas bij de afsluiting (over te dragen kosten).";
const TIP_FK = "Op deze factuur staat een financiële korting. Of Noor ze krijgt, weet je pas bij de betaling.";
const TIPS = { AK16: TIP_OTK, AK17: TIP_OTK, AK22: TIP_OTK };

const docRef = {};
CASE.documenten.forEach((d) => { docRef[d.id] = d.ref; });

function opdrachten() {
  const lijst = [Object.assign({ categorie: "Beginbalans" }, EXTRA.BB)];
  const per = {};
  CASE.documenten.forEach((d) => { (per[d.categorie] = per[d.categorie] || []).push(d); });
  CATEGORIE_VOLGORDE.slice(1).forEach((cat) => {
    let docs = (per[cat] || []).slice();
    if (cat === "Financiële verrichtingen") {
      // Op datum, zodat het kasstuk tussen de uittreksels op zijn plaats staat.
      docs = docs.map((d, i) => ({ d, i })).sort((a, b) => (a.d.datum < b.d.datum ? -1 : a.d.datum > b.d.datum ? 1 : a.i - b.i)).map((x) => x.d);
    }
    docs.forEach((d) => {
      const e = EXTRA[d.ref] || {};
      const o = { ref: d.ref, categorie: cat, titel: e.titel || (TITEL[d.soort] ? TITEL[d.soort](d.ref) : d.ref) };
      if (e.geenDocument) o.geenDocument = true;
      else o.doc = e.doc || d.ref;
      ["hulpdoc", "hulpdocTitel", "hulpdocs", "instructie"].forEach((k) => { if (e[k]) o[k] = e[k]; });
      if (TIPS[d.ref]) o.tip = TIPS[d.ref];
      else if (d.fk && /AK|VK/.test(d.soort)) o.tip = TIP_FK;
      lijst.push(o);
    });
  });
  ["BELASTING", "RESULTAAT"].forEach((ref) => {
    const e = EXTRA[ref];
    const o = { ref, categorie: "Resultaatverwerking", titel: e.titel, geenDocument: true, verborgenInNav: true };
    if (e.instructie) o.instructie = e.instructie;
    lijst.push(o);
  });
  return lijst;
}

/* ---------------- js/noor/data-opdrachten.js ---------------- */
function schrijfOpdrachten() {
  const lijst = opdrachten();
  const regel = (o) => "  " + JSON.stringify(o).replace(/":/g, '": ').replace(/,"/g, ', "') + ",";
  let vorige = "";
  const regels = [];
  lijst.forEach((o) => {
    if (o.categorie !== vorige) { regels.push("", "  // " + o.categorie); vorige = o.categorie; }
    regels.push(regel(o));
  });
  const js = `// data-opdrachten.js — oefendossier Fietsatelier Noor bv, 1e kwartaal 2028
//
// GEMAAKT DOOR hulpmiddelen/noor/maak-data.js uit de case (case-j3.json).
// Pas de case aan en draai het script opnieuw, liever dan dit bestand met de
// hand te wijzigen: zo blijven documenten, opdrachten en sleutel gelijk.
//
// Zelfde velden als js/data-opdrachten.js (MetWear). De documenten staan in
// documenten/noor/ (zie js/noor/dossier.js).
//
// Elke categorie is een les; na elke les maken de leerlingen die stukken.

const OPDRACHTEN = [${regels.join("\n")}
];

const CATEGORIE_VOLGORDE = ${JSON.stringify(CATEGORIE_VOLGORDE, null, 2)};

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
`;
  fs.writeFileSync(path.join(ROOT, "js", "noor", "data-opdrachten.js"), js);
  return lijst;
}

/* ---------------- js/noor/data-relaties.js ---------------- */
function schrijfRelaties() {
  const klanten = [], leveranciers = [];
  CASE.documenten.forEach((d) => {
    if (!d.relatie) return;
    const lijst = /^(CN-)?VK$/.test(d.soort) ? klanten : leveranciers;
    if (lijst.indexOf(d.relatie) === -1) lijst.push(d.relatie);
  });
  klanten.push("Particulieren (winkel)");
  const js = `// data-relaties.js — oefendossier Fietsatelier Noor bv
//
// GEMAAKT DOOR hulpmiddelen/noor/maak-data.js. Een voorstel van namen voor
// het relatieveld bij 400000 en 440000; de leerling mag ook zelf tikken.

const RELATIES = {
  klanten: ${JSON.stringify(klanten.sort(), null, 4).replace(/\n\]/, "\n  ]")},
  leveranciers: ${JSON.stringify(leveranciers.sort(), null, 4).replace(/\n\]/, "\n  ]")},
};
`;
  fs.writeFileSync(path.join(ROOT, "js", "noor", "data-relaties.js"), js);
}

/* ---------------- Sleutel in Code.gs ---------------- */
const r2 = (n) => Math.round(n * 100) / 100;
function bedragTekst(n) {
  n = Math.abs(r2(n));
  const centen = Math.round(n * 100) % 100;
  const heel = String(Math.floor(n + 0.000001)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return heel + (centen ? "," + (centen < 10 ? "0" : "") + centen : "");
}

// In welk vak van de eindbalans elke rubriek hoort (namen uit data-balans.js).
const VAK = {
  "10": "Kapitaal", "13": "Reserves", "14": "Overgedragen resultaat",
  "17": "Schulden op meer dan 1 jaar",
  "20": "Oprichtingskosten", "21": "Immateriële vaste activa",
  "22": "Materiële vaste activa", "23": "Materiële vaste activa", "24": "Materiële vaste activa",
  "34": "Voorraden", "40": "Vorderingen op ten hoogste 1 jaar", "41": "Vorderingen op ten hoogste 1 jaar",
  "42": "Schulden op ten hoogste 1 jaar", "44": "Schulden op ten hoogste 1 jaar", "45": "Schulden op ten hoogste 1 jaar",
  "48": "Schulden op ten hoogste 1 jaar",
  // Let op: "Overlopende rekeningen" bestaat aan beide kanten van de balans.
  // In dit dossier is er enkel 490000 (actief), dus geen verwarring.
  "49": "Overlopende rekeningen",
  "55": "Liquide middelen", "57": "Liquide middelen", "58": "Liquide middelen",
  "60": "Handelsgoederen, grond- en hulpstoffen", "61": "Diensten en diverse goederen",
  "62": "Bezoldigingen en sociale lasten", "63": "Afschrijvingen", "64": "Andere bedrijfskosten",
  "65": "Financiële kosten", "67": "Belastingen op het resultaat", "69": "Resultaatverwerking",
  "70": "Omzet", "74": "Andere bedrijfsopbrengsten", "75": "Financiële opbrengsten",
};

function sleutelRijen(lijst) {
  const rijen = [];
  const perRef = {};
  CASE.journaal.forEach((j) => { (perRef[j.ref] = perRef[j.ref] || []).push(j); });
  // De beginbalans: de leerling boekt BB zelf, dus die hoort ook in de sleutel.
  perRef.BB = CASE.beginbalans.map((b) => ({ rekening: b.rekening, debet: b.saldo > 0 ? b.saldo : 0, credit: b.saldo < 0 ? -b.saldo : 0 }));
  lijst.forEach((o) => {
    const regels = perRef[o.ref];
    if (!regels) throw new Error("Geen sleutel voor " + o.ref);
    const saldi = {}, volgorde = [];
    regels.forEach((j) => {
      if (!(j.rekening in saldi)) { saldi[j.rekening] = 0; volgorde.push(j.rekening); }
      saldi[j.rekening] = r2(saldi[j.rekening] + j.debet - j.credit);
    });
    volgorde.forEach((nr) => {
      if (Math.abs(saldi[nr]) < 0.005) return;
      rijen.push(["NOOR-" + o.ref, nr, saldi[nr] > 0 ? "D" : "C", bedragTekst(saldi[nr])]);
    });
  });
  // De vijf getallen van de resultaatverwerking (zie maakResultaatItem in koppeling.js).
  const res = CASE.resultaat;
  [["Opbrengsten", res.opbrengsten], ["Kosten", res.kosten], ["Winst", res.winst], ["Belasting", res.belasting],
    ["Winst na belasting", res.restwinst]].forEach((g) => rijen.push(["NOOR-RESULTAATVERWERKING", g[0], "", bedragTekst(g[1])]));
  // De eindbalans: alle rubrieken met een saldo na de resultaatverwerking.
  const perVak = {};
  CASE.proefbalans.filter((r) => Math.abs(r.slot) > 0.005).forEach((r) => {
    const rb = r.rekening.slice(0, 2);
    const vak = VAK[rb];
    if (!vak) throw new Error("Geen vak voor rubriek " + rb);
    (perVak[vak] = perVak[vak] || []);
    if (perVak[vak].indexOf(rb) === -1) perVak[vak].push(rb);
  });
  Object.keys(perVak).forEach((vak) => rijen.push(["NOOR-EINDBALANS", vak, "", perVak[vak].sort().join(", ")]));
  return rijen;
}

function schrijfSleutel(lijst) {
  const pad = path.join(ROOT, "apps-script", "Code.gs");
  const gs = fs.readFileSync(pad, "utf8");
  const rijen = sleutelRijen(lijst);
  const blok = "// SLEUTEL_NOOR_BEGIN\nvar SLEUTEL_NOOR = [\n" +
    rijen.map((r) => "  " + JSON.stringify(r) + ",").join("\n") + "\n];\n// SLEUTEL_NOOR_EINDE";
  const nieuw = gs.replace(/\/\/ SLEUTEL_NOOR_BEGIN[\s\S]*?\/\/ SLEUTEL_NOOR_EINDE/, blok);
  if (nieuw === gs && gs.indexOf(blok) === -1) throw new Error("Blok SLEUTEL_NOOR niet gevonden in Code.gs");
  fs.writeFileSync(pad, nieuw);
  return rijen.length;
}

const lijst = schrijfOpdrachten();
schrijfRelaties();
const n = schrijfSleutel(lijst);
console.log("js/noor/data-opdrachten.js: " + lijst.length + " opdrachten");
console.log("js/noor/data-relaties.js geschreven");
console.log("apps-script/Code.gs: sleutel met " + n + " regels");
