// case-j3.js — jaar 3 van de case Fietsatelier Noor bv (3e graad, oefendossier)
//
//   node hulpmiddelen/noor/case-j3.js
//
// Schrijft hulpmiddelen/noor/case-j3.json: alle documenten met hun lijnen,
// de rekeninguittreksels, het journaal (= de oplossingssleutel), de
// proefbalans en de voorraad. De andere scripts in deze map (documenten,
// data voor de app, Excel) lezen dat bestand.
//
// Jaar 1 (2026, 3e jaar) en jaar 2 (2027, 4e jaar) staan in de Excel van de
// case. Dit is jaar 3: het 1e kwartaal van 2028, met een afsluiting op
// 31 maart zoals bij MetWear. De beginbalans is de eindbalans 2027 na
// afsluiting (basis-j1j2.json, rechtstreeks uit de Excel).
//
// Opbouw per les (5 à 6 stukken per les, zodat er na elke les een taak is):
//   Beginbalans
//   Aankopen 1  handelskorting en financiële korting
//   Aankopen 2  doorgerekende kosten, verpakking, diensten en diverse goederen,
//               investeringen
//   Aankopen 3  creditnota's en over te dragen kosten
//   Verkopen 1  basis, handelskorting, doorgerekende kosten
//   Verkopen 2  verpakking, creditnota's, financiële korting, dagontvangsten
//   Lonen 1     loonstaten (synthese)
//   Lonen 2     facturen sociaal secretariaat (RSZ, voorheffing) en kosten
//   Financiële verrichtingen   uittreksels, kas, lening
//   Btw-verwerking, eindejaar (afschrijvingen, voorraad, lening) en resultaat
//
// Alle bedragen worden hier berekend; het script stopt met een fout zodra
// iets niet klopt (debet ≠ credit, bankafschrift ≠ T-rekening, voorraad ≠
// telling …). Pas dus gerust een aantal of datum aan en draai opnieuw.

"use strict";
const fs = require("fs");
const path = require("path");
const BASIS = require("./basis-j1j2.json");

const r2 = (n) => Math.round(n * 100) / 100;
const fout = (m) => { throw new Error(m); };
const NOOR = "Fietsatelier Noor bv";

/* ======================================================================
   Rekeningen (MAR 3e graad, js/mar.js) en artikels
   ====================================================================== */

const MAR = (() => {
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "js", "mar.js"), "utf8");
  const lijst = new Function(src.replace(/^\s*const\s+MAR\s*=/m, "return ") + ";")();
  const m = {};
  lijst.forEach((r) => { m[String(r.nr)] = r; });
  return m;
})();
function rek(nr) {
  const r = MAR[String(nr)];
  if (!r) fout("Rekening " + nr + " staat niet in js/mar.js");
  return r;
}

const ART = {};
BASIS.artikelen.forEach((a) => { ART[a.code] = a; });
const bedrijf = (naam) => BASIS.bedrijven.find((b) => b.naam === naam) || fout("Onbekend bedrijf " + naam);

// Nieuwe bedrijven in jaar 3. Zelfde reeks fictieve nummers als in de case.
const NIEUWE_BEDRIJVEN = [
  { code: "LOONW", naam: "Loonwijs vzw", rol: "leverancier", adres: "Brusselsesteenweg 61", gemeente: "3000 Leuven",
    btw: "BE 0999.000.211", iban: "BE00 0000 0000 0211", wat: "sociaal secretariaat" },
  { code: "GERZO", naam: "Gerzo Verzekeringen nv", rol: "leverancier", adres: "Martelarenplein 9", gemeente: "3000 Leuven",
    btw: "BE 0999.000.212", iban: "BE00 0000 0000 0212", wat: "verzekeraar (bestelwagen, arbeidsongevallen)" },
  { code: "VAART", naam: "Immo Vaartkom bv", rol: "leverancier", adres: "Vaartkom 30", gemeente: "3000 Leuven",
    btw: "BE 0999.000.213", iban: "BE00 0000 0000 0213", wat: "verhuurt de opslagruimte naast de winkel" },
  { code: "PREV", naam: "Preventa vzw", rol: "leverancier", adres: "Diestsevest 14", gemeente: "3000 Leuven",
    btw: "BE 0999.000.214", iban: "BE00 0000 0000 0214", wat: "externe dienst voor preventie en bescherming op het werk" },
];
NIEUWE_BEDRIJVEN.forEach((b) => { if (!BASIS.bedrijven.find((x) => x.code === b.code)) BASIS.bedrijven.push(b); });

/* ======================================================================
   Beginbalans 1/1/2028 = eindbalans 2027 na afsluiting
   ====================================================================== */

const beginbalans = BASIS.j2.proefbalans
  .filter((r) => /^[1-5]/.test(r.rekening) && Math.abs(r.slot) > 0.005)
  .map((r) => ({ rekening: r.rekening, naam: rek(r.rekening).naam, saldo: r.slot }));
const BB = {};
beginbalans.forEach((r) => { BB[r.rekening] = r.saldo; });
if (Math.abs(beginbalans.reduce((t, r) => t + r.saldo, 0)) > 0.005) fout("Beginbalans niet in evenwicht");

/* ======================================================================
   Documenten
   ====================================================================== */

const documenten = [];   // alles wat een verantwoordingsstuk heeft
const journaal = [];     // de sleutel: { doc, ref, datum, rekening, debet, credit, oms }

function boek(doc, regels) {
  let d = 0, c = 0;
  regels.forEach((x) => {
    if (!x.bedrag || Math.abs(x.bedrag) < 0.005) return;
    rek(x.rek);
    const bedrag = r2(x.bedrag);
    if (bedrag < 0) fout(doc.ref + ": negatief bedrag op " + x.rek);
    journaal.push({ doc: doc.id, ref: doc.ref, datum: doc.datum, rekening: String(x.rek), naam: rek(x.rek).naam,
      debet: x.dc === "D" ? bedrag : 0, credit: x.dc === "C" ? bedrag : 0, oms: x.oms || doc.boekOms || doc.titel });
    if (x.dc === "D") d += bedrag; else c += bedrag;
  });
  if (Math.abs(d - c) > 0.005) fout(doc.ref + ": debet " + r2(d) + " ≠ credit " + r2(c));
}

const plusDagen = (iso, n) => { const x = new Date(iso + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

/* ---------- Facturen en creditnota's (aankoop en verkoop) ----------

   lijnen:
     { art: "STAD", n: 12 }                       handelsgoederen (21%)
     { dienst: "ONDH", n: 10 }                    herstelling/onderhoud (6%)
     { kosten: "Transportkosten", bedrag: 200 }   doorgerekende kosten (21%)
     { verpakking: "…", n: 4, prijs: 50 }         waarborg, geen btw
     { oms: "…", bedrag: 800, btw: 0.21, rek: "612700" }   vrije lijn
         rek mag ook een lijst zijn: [{ rek, bedrag }] (bv. over te dragen kosten)
   hk: handelskorting (fractie) op de goederen
   fk: financiële korting (fractie) bij betaling binnen 10 dagen; btw op het
       bedrag na korting, de goederen staan bruto op de factuur.            */

function factuur(def) {
  const aankoop = def.soort === "AK" || def.soort === "CN-AK";
  const cn = /^CN-/.test(def.soort);
  const doc = Object.assign({ termijn: 30 }, def);
  doc.van = doc.van || NOOR;
  doc.aan = doc.aan || NOOR;
  if (aankoop && doc.aan !== NOOR) fout(doc.ref + ": aankoop niet aan Noor");
  if (!aankoop && doc.van !== NOOR) fout(doc.ref + ": verkoop niet van Noor");
  doc.relatie = aankoop ? doc.van : doc.aan;
  if (!cn) doc.vervaldag = doc.vervaldag || plusDagen(doc.datum, doc.termijn);

  const lijnen = [];
  def.lijnen.forEach((l) => {
    if (l.art) {
      const a = ART[l.art] || fout("Onbekend artikel " + l.art);
      const prijs = aankoop ? a.aankoop : a.verkoop;
      lijnen.push({ soort: "artikel", artikel: l.art, oms: a.oms, aantal: l.n, prijs, bedrag: r2(l.n * prijs), btwPct: 0.21 });
    } else if (l.dienst) {
      const a = ART[l.dienst];
      lijnen.push({ soort: "dienst", artikel: l.dienst, oms: l.oms || a.oms, aantal: l.n, prijs: a.verkoop, bedrag: r2(l.n * a.verkoop), btwPct: 0.06 });
    } else if (l.kosten) {
      lijnen.push({ soort: "kosten", oms: l.kosten, aantal: 1, prijs: l.bedrag, bedrag: l.bedrag, btwPct: 0.21 });
    } else if (l.verpakking) {
      lijnen.push({ soort: "verpakking", oms: l.verpakking, aantal: l.n, prijs: l.prijs, bedrag: r2(l.n * l.prijs), btwPct: 0 });
    } else {
      lijnen.push({ soort: "vrij", oms: l.oms, aantal: l.n || 1, prijs: l.prijs || l.bedrag, bedrag: l.bedrag,
        btwPct: l.btw === undefined ? 0.21 : l.btw, rek: l.rek });
    }
  });
  const goederen = r2(lijnen.filter((l) => l.soort === "artikel").reduce((t, l) => t + l.bedrag, 0));
  if (def.hk) {
    const hk = r2(goederen * def.hk);
    lijnen.push({ soort: "handelskorting", oms: "Handelskorting " + Math.round(def.hk * 100) + "% op de goederen" + (def.hkReden ? " (" + def.hkReden + ")" : ""),
      aantal: def.hk, prijs: -goederen, bedrag: -hk, btwPct: 0.21 });
  }
  let fk = 0;
  if (def.fk) {
    const basis = r2(goederen - (def.hk ? r2(goederen * def.hk) : 0));
    fk = r2(basis * def.fk);
    lijnen.push({ soort: "financiële korting", oms: "Financiële korting " + Math.round(def.fk * 100) +
      "% bij betaling binnen 10 dagen (btw berekend na korting)", aantal: def.fk, prijs: -basis, bedrag: -fk, btwPct: 0.21 });
  }
  lijnen.forEach((l, i) => { l.lijn = i + 1; l.btw = r2(l.bedrag * l.btwPct); });

  const som = (f) => r2(lijnen.filter(f).reduce((t, l) => t + l.bedrag, 0));
  doc.mvh21 = som((l) => l.btwPct === 0.21);
  doc.mvh6 = som((l) => l.btwPct === 0.06);
  doc.vrij = som((l) => l.btwPct === 0 && l.soort !== "verpakking");
  doc.btw21 = r2(doc.mvh21 * 0.21);
  doc.btw6 = r2(doc.mvh6 * 0.06);
  doc.waarborg = som((l) => l.soort === "verpakking");
  doc.fk = fk;
  doc.totaal = r2(doc.mvh21 + doc.btw21 + doc.mvh6 + doc.btw6 + doc.vrij + doc.waarborg + fk);
  doc.binnenTermijn = fk ? r2(doc.totaal - fk) : null;
  [doc.btw21, doc.btw6].forEach((b) => { if (Math.abs(b - Math.round(b)) > 0.005 && !def.centenOk) fout(doc.ref + ": btw met centen (" + b + ")"); });
  doc.lijnen = lijnen;

  // Boeking
  const r = [];
  const D = (rk, b, oms) => r.push({ rek: rk, dc: "D", bedrag: b, oms });
  const C = (rk, b, oms) => r.push({ rek: rk, dc: "C", bedrag: b, oms });
  const pos = (rk, b) => (b >= 0 ? D(rk, b) : C(rk, -b));   // kost/actief bij aankoop
  const neg = (rk, b) => (b >= 0 ? C(rk, b) : D(rk, -b));   // opbrengst/passief bij verkoop
  const btwTot = r2(doc.btw21 + doc.btw6);
  lijnen.forEach((l) => {
    if (l.soort === "financiële korting") return;   // de goederen staan bruto
    let rekening;
    if (l.soort === "artikel") rekening = aankoop ? (cn ? "604010" : "604000") : (cn ? "704010" : "704000");
    else if (l.soort === "dienst") rekening = "700000";
    else if (l.soort === "kosten") rekening = aankoop ? "604030" : "746000";
    else if (l.soort === "handelskorting") rekening = aankoop ? "604020" : "704020";
    else if (l.soort === "verpakking") rekening = aankoop ? "418000" : "488000";
    else rekening = l.rek;
    const delen = Array.isArray(rekening) ? rekening : [{ rek: rekening, bedrag: l.bedrag }];
    if (Math.abs(delen.reduce((t, x) => t + x.bedrag, 0) - l.bedrag) > 0.005) fout(doc.ref + ": verdeling lijn " + l.lijn);
    delen.forEach((x) => {
      if (aankoop) (cn ? neg : pos)(x.rek, x.bedrag);
      else (cn ? pos : neg)(x.rek, x.bedrag);
    });
  });
  if (aankoop) {
    if (cn) { C("451200", btwTot); D("440000", doc.totaal); }
    else { D("411100", btwTot); C("440000", doc.totaal); }
  } else {
    if (cn) { D("411200", btwTot); C("400000", doc.totaal); }
    else { C("451100", btwTot); D("400000", doc.totaal); }
  }
  doc.boekOms = (cn ? "Creditnota " : aankoop ? "Aankoopfactuur " : "Verkoopfactuur ") + doc.nr + " - " + doc.relatie;
  documenten.push(doc);
  boek(doc, r);
  return doc;
}

/* ---------- Dagontvangsten ---------- */
function dagontvangst(def) {
  const doc = Object.assign({}, def, { van: NOOR, aan: "particulieren (kasticket)" });
  const lijnen = def.lijnen.map((l, i) => {
    const a = ART[l.art || l.dienst];
    const b = r2(l.n * a.verkoop);
    return { lijn: i + 1, soort: l.dienst ? "dienst" : "artikel", artikel: a.code, oms: a.oms, aantal: l.n, prijs: a.verkoop,
      bedrag: b, btwPct: a.btw, btw: r2(b * a.btw) };
  });
  doc.lijnen = lijnen;
  doc.mvh21 = r2(lijnen.filter((l) => l.btwPct === 0.21).reduce((t, l) => t + l.bedrag, 0));
  doc.mvh6 = r2(lijnen.filter((l) => l.btwPct === 0.06).reduce((t, l) => t + l.bedrag, 0));
  doc.btw21 = r2(doc.mvh21 * 0.21);
  doc.btw6 = r2(doc.mvh6 * 0.06);
  doc.totaal = r2(doc.mvh21 + doc.btw21 + doc.mvh6 + doc.btw6);
  [doc.btw21, doc.btw6].forEach((b) => { if (Math.abs(b - Math.round(b)) > 0.005) fout(doc.ref + ": btw met centen (" + b + ")"); });
  doc.contant = r2(doc.totaal - doc.bancontact);
  doc.boekOms = "Dagontvangsten " + doc.nr;
  documenten.push(doc);
  boek(doc, [
    { rek: "400000", dc: "D", bedrag: doc.totaal },
    { rek: "704000", dc: "C", bedrag: doc.mvh21 },
    { rek: "700000", dc: "C", bedrag: doc.mvh6 },
    { rek: "451100", dc: "C", bedrag: r2(doc.btw21 + doc.btw6) },
  ]);
  return doc;
}

/* ---------- Loonstaten ----------
   Zelfde vereenvoudiging als bij MetWear: RSZ werknemer 13,07 %,
   werkgeversbijdrage 25 %. De bedrijfsvoorheffing staat op de loonstaat. */
const RSZ_WN = 0.1307, RSZ_WG = 0.25;
function loonstaat(def) {
  const arb = def.statuut === "arbeiders";
  const doc = Object.assign({}, def, { van: "Loonwijs vzw", aan: NOOR });
  doc.werknemers = def.werknemers.map((w) => {
    const bruto = r2(w.loon + (w.extra || 0));
    const rsz = r2(bruto * RSZ_WN);
    const belastbaar = r2(bruto - rsz);
    const netto = w.netto;
    const bv = r2(belastbaar - netto);
    return Object.assign({}, w, { bruto, rsz, belastbaar, bv, netto, wg: r2(bruto * RSZ_WG) });
  });
  const t = (k) => r2(doc.werknemers.reduce((s, w) => s + w[k], 0));
  ["bruto", "rsz", "belastbaar", "bv", "netto", "wg"].forEach((k) => { doc[k] = t(k); });
  doc.loonkost = r2(doc.bruto + doc.wg);
  doc.boekOms = "Loonstaat " + (arb ? "arbeiders " : "bedienden ") + def.periode;
  documenten.push(doc);
  boek(doc, [
    { rek: arb ? "620300" : "620200", dc: "D", bedrag: doc.bruto },
    { rek: "621000", dc: "D", bedrag: doc.wg },
    { rek: arb ? "455300" : "455200", dc: "C", bedrag: doc.netto },
    { rek: "453000", dc: "C", bedrag: doc.bv },
    { rek: "454000", dc: "C", bedrag: r2(doc.rsz + doc.wg) },
  ]);
  return doc;
}

/* ---------- Factuur sociaal secretariaat: doorstorting RSZ en voorheffing ---------- */
function rszFactuur(def, staten) {
  const doc = Object.assign({ soort: "RSZ", van: "Loonwijs vzw", aan: NOOR, termijn: 10 }, def);
  doc.relatie = doc.van;
  doc.vervaldag = plusDagen(doc.datum, doc.termijn);
  doc.staten = staten.map((s) => s.id);
  doc.rszWn = r2(staten.reduce((t, s) => t + s.rsz, 0));
  doc.rszWg = r2(staten.reduce((t, s) => t + s.wg, 0));
  doc.rsz = r2(doc.rszWn + doc.rszWg);
  doc.bv = r2(staten.reduce((t, s) => t + s.bv, 0));
  doc.totaal = r2(doc.rsz + doc.bv);
  doc.boekOms = "Factuur " + doc.nr + " - Loonwijs vzw - doorstorting RSZ en bedrijfsvoorheffing " + doc.periode;
  documenten.push(doc);
  boek(doc, [
    { rek: "454000", dc: "D", bedrag: doc.rsz },
    { rek: "453000", dc: "D", bedrag: doc.bv },
    { rek: "440000", dc: "C", bedrag: doc.totaal },
  ]);
  return doc;
}

/* ======================================================================
   DE STUKKEN
   ====================================================================== */

const VELO = "Velomax bv", SPAAK = "Spaakwerk bv", HELM = "HelmHuis bv", STROOM = "Stroomkracht nv",
  PEET = "Drukkerij Peeters bv", DEPREZ = "Deprez Werkplaatsinrichting bv", KASSA = "Kassatech bv",
  LOONW = "Loonwijs vzw", GERZO = "Gerzo Verzekeringen nv", VAART = "Immo Vaartkom bv", PREV = "Preventa vzw";
const REK = "Herbruikbaar fietsrek (waarborg)", KRAT = "Herbruikbare transportkrat (waarborg)";

const C_AK1 = "Aankopen 1 · kortingen";
const C_AK2 = "Aankopen 2 · kosten, verpakking en investeringen";
const C_AK3 = "Aankopen 3 · creditnota's en over te dragen kosten";
const C_VK1 = "Verkopen 1 · handelskorting en kosten";
const C_VK2 = "Verkopen 2 · verpakking, creditnota's, financiële korting";
const C_L1 = "Lonen 1 · loonstaten";
const C_L2 = "Lonen 2 · RSZ, voorheffing en personeelskosten";
const C_FIN = "Financiële verrichtingen";
const C_BTW = "BTW-verwerking";
const C_EJ = "Eindejaarsverrichtingen";
const C_RES = "Resultaatverwerking";

// ---- Les 2 · Aankopen met handelskorting en financiële korting ----
const AK01 = factuur({ id: "J3A01", ref: "AK01", categorie: C_AK1, soort: "AK", datum: "2028-01-03", nr: "2028-003", van: VELO,
  hk: 0.10, lijnen: [{ art: "STAD", n: 7 }, { art: "BAK", n: 4 }] });
const AK02 = factuur({ id: "J3A02", ref: "AK02", categorie: C_AK1, soort: "AK", datum: "2028-01-09", nr: "HH-28-002", van: HELM,
  hk: 0.10, lijnen: [{ art: "HELM", n: 30 }, { art: "SLOT", n: 5 }] });
const AK03 = factuur({ id: "J3A03", ref: "AK03", categorie: C_AK1, soort: "AK", datum: "2028-01-12", nr: "SW-2028-014", van: SPAAK,
  hk: 0.20, hkReden: "opruiming oude collectie", lijnen: [{ art: "LAMP", n: 15 }] });
const AK04 = factuur({ id: "J3A04", ref: "AK04", categorie: C_AK1, soort: "AK", datum: "2028-01-18", nr: "2028-021", van: VELO,
  hk: 0.20, hkReden: "voorjaarsactie", fk: 0.05, fkBetaald: false,
  lijnen: [{ art: "STAD", n: 10 }, { art: "EBIKE", n: 3 }, { art: "BAK", n: 1 }] });
const AK05 = factuur({ id: "J3A05", ref: "AK05", categorie: C_AK1, soort: "AK", datum: "2028-02-01", nr: "2028-047", van: VELO,
  fk: 0.05, fkBetaald: true, lijnen: [{ art: "EBIKE", n: 10 }] });
const AK06 = factuur({ id: "J3A06", ref: "AK06", categorie: C_AK1, soort: "AK", datum: "2028-02-15", nr: "2028-066", van: VELO,
  fk: 0.05, fkBetaald: true, lijnen: [{ art: "STAD", n: 5 }] });

// ---- Les 3 · Kosten, verpakking, diensten en diverse goederen, investeringen ----
const AK07 = factuur({ id: "J3A07", ref: "AK07", categorie: C_AK2, soort: "AK", datum: "2028-02-08", nr: "2028-058", van: VELO,
  lijnen: [{ art: "BAK", n: 2 }, { kosten: "Transportkosten", bedrag: 200 }, { verpakking: REK, n: 4, prijs: 50 }] });
const AK08 = factuur({ id: "J3A08", ref: "AK08", categorie: C_AK2, soort: "AK", datum: "2028-02-22", nr: "SW-2028-077", van: SPAAK,
  lijnen: [{ art: "KET", n: 20 }, { kosten: "Leveringskosten", bedrag: 100 }, { verpakking: KRAT, n: 4, prijs: 25 }] });
const AK09 = factuur({ id: "J3A09", ref: "AK09", categorie: C_AK2, soort: "AK", datum: "2028-01-10", nr: "SK-28-0412", van: STROOM,
  termijn: 15, lijnen: [{ oms: "Elektriciteit winkel en werkplaats, december 2027 - februari 2028", bedrag: 800, rek: "612700" }] });
const AK10 = factuur({ id: "J3A10", ref: "AK10", categorie: C_AK2, soort: "AK", datum: "2028-01-24", nr: "DP-2028-031", van: PEET,
  lijnen: [{ oms: "Folders voorjaarsactie (1.000 stuks)", bedrag: 400, rek: "616520" },
    { oms: "Briefpapier en kasticketrollen", bedrag: 200, rek: "612000" }] });
const AK11 = factuur({ id: "J3A11", ref: "AK11", categorie: C_AK2, soort: "AK", datum: "2028-01-15", nr: "DW-28-0006", van: DEPREZ,
  lijnen: [{ oms: "Wielrichtbank met centreerbank en tweede montagestandaard", bedrag: 2000, rek: "232000" },
    { oms: "Levering en montage in de werkplaats", bedrag: 200, rek: "232000" }] });
const AK12 = factuur({ id: "J3A12", ref: "AK12", categorie: C_AK2, soort: "AK", datum: "2028-02-29", nr: "KT-2028-118", van: KASSA,
  lijnen: [{ oms: "Tablet met werkbonsoftware voor de werkplaats", bedrag: 1200, rek: "240200" }] });

// ---- Les 4 · Creditnota's en over te dragen kosten ----
const AK13 = factuur({ id: "J3CA1", ref: "AK13", categorie: C_AK3, soort: "CN-AK", datum: "2028-01-10", nr: "CN-2028-001", van: VELO,
  verwijst: AK01.nr, reden: "5 stadsfietsen met transportschade, teruggestuurd",
  hk: 0.10, lijnen: [{ art: "STAD", n: 5 }] });
const AK14 = factuur({ id: "J3CA2", ref: "AK14", categorie: C_AK3, soort: "CN-AK", datum: "2028-03-01", nr: "SW-CN-2028-004", van: SPAAK,
  verwijst: AK08.nr, reden: "4 transportkratten teruggestuurd", lijnen: [{ verpakking: KRAT, n: 4, prijs: 25 }] });
const AK15 = factuur({ id: "J3CA3", ref: "AK15", categorie: C_AK3, soort: "CN-AK", datum: "2028-02-20", nr: "CN-2028-006", van: VELO,
  verwijst: AK07.nr, reden: "1 bakfiets met een beschadigd frame en 2 fietsrekken teruggestuurd",
  lijnen: [{ art: "BAK", n: 1 }, { verpakking: REK, n: 2, prijs: 50 }] });
const AK16 = factuur({ id: "J3A16", ref: "AK16", categorie: C_AK3, soort: "AK", datum: "2028-01-02", nr: "GZ-28-00871", van: GERZO,
  termijn: 15, periode: "1 januari 2028 tot en met 31 december 2028",
  lijnen: [{ oms: "Jaarpremie verzekering bestelwagen (BA en omnium), periode 01/01/2028 - 31/12/2028", bedrag: 1200, btw: 0,
    rek: "614400" }], otk: { rek: "614400", maanden: 9, van: 12 } });
const AK17 = factuur({ id: "J3A17", ref: "AK17", categorie: C_AK3, soort: "AK", datum: "2028-02-01", nr: "IV-2028-02", van: VAART,
  termijn: 0, periode: "1 februari 2028 tot en met 30 april 2028",
  lijnen: [{ oms: "Huur opslagruimte Vaartkom 30, periode 01/02/2028 - 30/04/2028 (3 maanden x 500)", n: 3, prijs: 500, bedrag: 1500, btw: 0,
    rek: "611000" }], otk: { rek: "611000", maanden: 1, van: 3 } });

// ---- Les 5 · Verkopen: basis, handelskorting, doorgerekende kosten ----
const VK01 = factuur({ id: "J3V01", ref: "VK01", categorie: C_VK1, soort: "VK", datum: "2028-01-08", nr: "2028-001", aan: "Snelpost bv",
  lijnen: [{ art: "BAK", n: 3 }, { dienst: "ONDH", n: 25, oms: "Onderhoudsbeurt koeriersfietsen (arbeid)" }] });
const VK02 = factuur({ id: "J3V02", ref: "VK02", categorie: C_VK1, soort: "VK", datum: "2028-01-11", nr: "2028-002", aan: "Hotel De Linde bv",
  lijnen: [{ dienst: "ONDH", n: 30, oms: "Onderhoudsbeurt huurfietsen (arbeid)" }, { art: "LAMP", n: 10 }] });
const VK03 = factuur({ id: "J3V03", ref: "VK03", categorie: C_VK1, soort: "VK", datum: "2028-01-17", nr: "2028-003", aan: "Velocity Deelfietsen bv",
  hk: 0.05, lijnen: [{ art: "STAD", n: 12 }, { art: "HELM", n: 16 }] });
const VK04 = factuur({ id: "J3V04", ref: "VK04", categorie: C_VK1, soort: "VK", datum: "2028-01-25", nr: "2028-004", aan: "Bouwbedrijf Janssens & Zonen bv",
  hk: 0.10, lijnen: [{ art: "EBIKE", n: 3 }, { kosten: "Transportkosten", bedrag: 100 }] });
const VK05 = factuur({ id: "J3V05", ref: "VK05", categorie: C_VK1, soort: "VK", datum: "2028-02-07", nr: "2028-006", aan: "Brouwerij Van Acker bv",
  lijnen: [{ art: "BAK", n: 3 }, { kosten: "Leveringskosten", bedrag: 200 }] });
const VK06 = factuur({ id: "J3V06", ref: "VK06", categorie: C_VK1, soort: "VK", datum: "2028-02-21", nr: "2028-009", aan: "Bytewise bv",
  hk: 0.05, lijnen: [{ art: "EBIKE", n: 5 }, { kosten: "Transportkosten", bedrag: 100 }] });

// ---- Les 6 · Verkopen: verpakking, creditnota's, financiële korting, dagontvangsten ----
const VK07 = factuur({ id: "J3V07", ref: "VK07", categorie: C_VK2, soort: "VK", datum: "2028-02-03", nr: "2028-005", aan: "Camping De Vlinder bv",
  lijnen: [{ art: "STAD", n: 6 }, { art: "KIND", n: 4 }, { verpakking: REK, n: 4, prijs: 50 }] });
const VK08 = factuur({ id: "J3CV1", ref: "VK08", categorie: C_VK2, soort: "CN-VK", datum: "2028-02-14", nr: "CN-2028-001", aan: "Bouwbedrijf Janssens & Zonen bv",
  verwijst: VK04.nr, reden: "1 e-bike teruggenomen: een werknemer is uit dienst", hk: 0.10, lijnen: [{ art: "EBIKE", n: 1 }] });
const VK09 = factuur({ id: "J3CV2", ref: "VK09", categorie: C_VK2, soort: "CN-VK", datum: "2028-02-24", nr: "CN-2028-002", aan: "Camping De Vlinder bv",
  verwijst: VK07.nr, reden: "4 fietsrekken in goede staat terugontvangen", lijnen: [{ verpakking: REK, n: 4, prijs: 50 }] });
const VK10 = factuur({ id: "J3V10", ref: "VK10", categorie: C_VK2, soort: "VK", datum: "2028-03-01", nr: "2028-011", aan: "Woonzorgcentrum Zonnehof vzw",
  fk: 0.02, fkBetaald: true, lijnen: [{ art: "EBIKE", n: 5 }] });
const VK11 = factuur({ id: "J3V11", ref: "VK11", categorie: C_VK2, soort: "VK", datum: "2028-03-09", nr: "2028-013", aan: "Studio Kowalski bv",
  fk: 0.05, fkBetaald: false, lijnen: [{ art: "EBIKE", n: 1 }] });
const ONTV01 = dagontvangst({ id: "J3D1", ref: "ONTV01", categorie: C_VK2, soort: "DO", datum: "2028-03-18", nr: "DO-2028-11", periode: "week 11 (13 tot en met 18 maart 2028)",
  bancontact: 3000, lijnen: [{ art: "STAD", n: 2 }, { art: "EBIKE", n: 1 }, { art: "KIND", n: 2 }, { art: "HELM", n: 8 },
    { art: "SLOT", n: 6 }, { art: "BAND", n: 6 }, { art: "KET", n: 9 }, { art: "LAMP", n: 4 }, { dienst: "HERST", n: 50 }] });

// ---- Les 7 · Loonstaten ----
// Noor neemt vanaf 1 januari 2028 personeel in dienst: Jonas Claes,
// fietshersteller (arbeider, voltijds) en Lina Vermeulen, verkoopster en
// webshop (bediende, deeltijds).
const JONAS = "Jonas Claes (fietshersteller)", LINA = "Lina Vermeulen (verkoopster, deeltijds)";
const L1 = loonstaat({ id: "J3L1", ref: "LOON01", categorie: C_L1, soort: "LOON", statuut: "arbeiders", periode: "januari 2028",
  datum: "2028-01-31", nr: "LW-LS-2028-0101", werknemers: [{ naam: JONAS, loon: 2600, netto: 1900 }] });
const L2 = loonstaat({ id: "J3L2", ref: "LOON02", categorie: C_L1, soort: "LOON", statuut: "bedienden", periode: "januari 2028",
  datum: "2028-01-31", nr: "LW-LS-2028-0102", werknemers: [{ naam: LINA, loon: 1600, netto: 1250 }] });
const L3 = loonstaat({ id: "J3L3", ref: "LOON03", categorie: C_L1, soort: "LOON", statuut: "arbeiders", periode: "februari 2028",
  datum: "2028-02-29", nr: "LW-LS-2028-0201", werknemers: [{ naam: JONAS, loon: 2600, extra: 200, extraOms: "overuren", netto: 2020 }] });
const L4 = loonstaat({ id: "J3L4", ref: "LOON04", categorie: C_L1, soort: "LOON", statuut: "bedienden", periode: "februari 2028",
  datum: "2028-02-29", nr: "LW-LS-2028-0202", werknemers: [{ naam: LINA, loon: 1800, netto: 1370, opm: "meer uren in februari (vakantieperiode)" }] });
const L5 = loonstaat({ id: "J3L5", ref: "LOON05", categorie: C_L1, soort: "LOON", statuut: "arbeiders", periode: "maart 2028",
  datum: "2028-03-31", nr: "LW-LS-2028-0301", werknemers: [{ naam: JONAS, loon: 2600, extra: 100, extraOms: "overuren", netto: 1960 }] });
const L6 = loonstaat({ id: "J3L6", ref: "LOON06", categorie: C_L1, soort: "LOON", statuut: "bedienden", periode: "maart 2028",
  datum: "2028-03-31", nr: "LW-LS-2028-0302", werknemers: [{ naam: LINA, loon: 1600, extra: 100, extraOms: "verkoopcommissie", netto: 1320 }] });

// ---- Les 8 · Facturen RSZ en voorheffing, personeelskosten ----
const AK18 = rszFactuur({ id: "J3S1", ref: "AK18", categorie: C_L2, datum: "2028-01-31", nr: "LW-2028-0131", periode: "januari 2028" }, [L1, L2]);
const AK19 = rszFactuur({ id: "J3S2", ref: "AK19", categorie: C_L2, datum: "2028-02-29", nr: "LW-2028-0229", periode: "februari 2028" }, [L3, L4]);
const AK20 = rszFactuur({ id: "J3S3", ref: "AK20", categorie: C_L2, datum: "2028-03-31", nr: "LW-2028-0331", periode: "maart 2028" }, [L5, L6]);
const AK21 = factuur({ id: "J3A21", ref: "AK21", categorie: C_L2, soort: "AK", datum: "2028-03-31", nr: "LW-2028-0332", van: LOONW,
  lijnen: [{ oms: "Beheerskosten loonadministratie 1e kwartaal 2028, opstartdossier inbegrepen", bedrag: 200, rek: "613300" }] });
const AK22 = factuur({ id: "J3A22", ref: "AK22", categorie: C_L2, soort: "AK", datum: "2028-01-02", nr: "GZ-28-00872", van: GERZO,
  termijn: 15, periode: "1 januari 2028 tot en met 31 december 2028",
  lijnen: [{ oms: "Jaarpremie verzekering arbeidsongevallen, periode 01/01/2028 - 31/12/2028", bedrag: 600, btw: 0,
    rek: "623000" }], otk: { rek: "623000", maanden: 9, van: 12 } });
const AK23 = factuur({ id: "J3A23", ref: "AK23", categorie: C_L2, soort: "AK", datum: "2028-01-10", nr: "PV-28-1022", van: PREV,
  lijnen: [{ oms: "Aansluiting 2028 en medisch onderzoek bij indiensttreding (per werknemer)", n: 2, prijs: 70, bedrag: 140, btw: 0, rek: "623000" }] });

/* ======================================================================
   Betalingen: rekeninguittreksels en kas
   ====================================================================== */

// Een betaling of ontvangst van een (of meer) facturen, met de creditnota's
// die eraf gaan. Bij financiële korting binnen de termijn: korting eraf.
function betaling(docs, opts) {
  opts = opts || {};
  const fac = docs.filter((x) => !/^CN-/.test(x.soort));
  const cns = docs.filter((x) => /^CN-/.test(x.soort));
  const aankoop = fac.length ? fac[0].soort !== "VK" : cns[0].soort === "CN-AK";
  let bruto = r2(fac.reduce((t, x) => t + x.totaal, 0) - cns.reduce((t, x) => t + x.totaal, 0));
  const korting = r2(fac.reduce((t, x) => t + (x.fk && x.fkBetaald ? x.fk : 0), 0));
  const netto = r2(bruto - korting);
  const relatie = (fac[0] || cns[0]).relatie;
  const nrs = fac.map((x) => "factuur " + x.nr).concat(cns.map((x) => "creditnota " + x.nr)).join(" - ");
  const oms = (aankoop ? "Overschrijving naar " : "Overschrijving van ") + relatie + ", " + nrs +
    "";   // de korting staat er bewust niet bij: de leerling ziet ze zelf aan het bedrag
  const regels = aankoop
    ? [{ rek: "440000", dc: "D", bedrag: bruto }, { rek: "757000", dc: "C", bedrag: korting }, { rek: "550000", dc: "C", bedrag: netto }]
    : [{ rek: "550000", dc: "D", bedrag: netto }, { rek: "657000", dc: "D", bedrag: korting }, { rek: "400000", dc: "C", bedrag: bruto }];
  return { oms: opts.oms || oms, bedrag: aankoop ? -netto : netto, regels, docs: docs.map((x) => x.id), relatie };
}

const lonen = (staten, oms) => {
  const t = r2(staten.reduce((s, x) => s + x.netto, 0));
  const regels = staten.map((x) => ({ rek: x.statuut === "arbeiders" ? "455300" : "455200", dc: "D", bedrag: x.netto }));
  regels.push({ rek: "550000", dc: "C", bedrag: t });
  return { oms, bedrag: -t, regels, docs: staten.map((x) => x.id) };
};

// Lening 2027-0042 (jaar 2): 30.000 op 1/2/2027, per kwartaal 1.500 kapitaal
// + 1 % intrest op het openstaande kapitaal.
const LENING = { nr: "2027-0042", bedrag: 30000, opname: "2027-02-01", kapitaal: 1500, rente: 0.01, kwartalen: 20, doel: "aankoop bestelwagen" };
const aflossingstabel = (() => {
  const rijen = [];
  let rest = LENING.bedrag;
  for (let i = 1; i <= LENING.kwartalen; i++) {
    const x = new Date(LENING.opname + "T12:00:00Z"); x.setUTCMonth(x.getUTCMonth() + 3 * i);
    const intrest = r2(rest * LENING.rente);
    rest = r2(rest - LENING.kapitaal);
    rijen.push({ nr: i, datum: x.toISOString().slice(0, 10), kapitaal: LENING.kapitaal, intrest, totaal: r2(LENING.kapitaal + intrest), rest });
  }
  return rijen;
})();
const afl = aflossingstabel.find((r) => r.datum === "2028-02-01");
if (Math.abs(r2(BB["173000"] || 0) + afl.rest + afl.kapitaal) > 0.005) fout("Lening: beginbalans ≠ aflossingstabel");

const kasDoc = (def) => { const d = Object.assign({ soort: "KAS", van: NOOR, aan: NOOR }, def); documenten.push(d); return d; };
const KAS01 = kasDoc({ id: "J3K1", ref: "KAS01", categorie: C_FIN, datum: "2028-03-18", nr: "KAS-2028-01", subsoort: "ontvangst",
  verwijst: ONTV01.nr, contant: ONTV01.contant, boekOms: "Kasstuk KAS-2028-01 - contant deel dagontvangsten " + ONTV01.nr });
const KAS02 = kasDoc({ id: "J3K2", ref: "KAS02", categorie: C_FIN, datum: "2028-03-22", nr: "KAS-2028-02", subsoort: "storting",
  contant: -3500, boekOms: "Kasstuk KAS-2028-02 - storting van contanten op de bank" });
boek(KAS01, [{ rek: "570000", dc: "D", bedrag: KAS01.contant }, { rek: "400000", dc: "C", bedrag: KAS01.contant }]);
boek(KAS02, [{ rek: "580000", dc: "D", bedrag: 3500 }, { rek: "570000", dc: "C", bedrag: 3500 }]);

// Niet elke factuur wordt in dit kwartaal betaald. Wel altijd: de facturen
// met financiële korting (binnen of buiten de termijn), de lonen en Loonwijs.
// Verder hoogstens 6 betalingen van klanten en 6 aan leveranciers.
const AFLOSSING = { oms: "Aflossing lening nr. " + LENING.nr + ": kapitaal " + afl.kapitaal.toLocaleString("nl-BE") + " + intrest " + afl.intrest,
  bedrag: -afl.totaal, docs: [], regels: [{ rek: "173000", dc: "D", bedrag: afl.kapitaal }, { rek: "650000", dc: "D", bedrag: afl.intrest }, { rek: "550000", dc: "C", bedrag: afl.totaal }] };
const U = [
  { nr: 1, datum: "2028-01-31", lijnen: [
    ["2028-01-20", betaling([VK01])],
    ["2028-01-25", betaling([AK01, AK13])],
    ["2028-01-31", lonen([L1, L2], "Nettolonen januari 2028 (loonstaten LW-LS-2028-0101 en -0102)")],
  ] },
  { nr: 2, datum: "2028-02-10", lijnen: [
    ["2028-02-01", AFLOSSING],
    ["2028-02-01", betaling([AK17], { oms: "Domiciliëring Immo Vaartkom bv, huur februari-april 2028, factuur " + AK17.nr })],
    ["2028-02-10", betaling([AK05])],
    ["2028-02-10", betaling([AK18])],
  ] },
  { nr: 3, datum: "2028-02-22", lijnen: [
    ["2028-02-15", betaling([AK04])],
    ["2028-02-20", betaling([VK04, VK08])],
    ["2028-02-22", betaling([AK06])],
  ] },
  { nr: 4, datum: "2028-03-10", lijnen: [
    ["2028-02-29", lonen([L3, L4], "Nettolonen februari 2028 (loonstaten LW-LS-2028-0201 en -0202)")],
    ["2028-03-01", betaling([VK07, VK09])],
    ["2028-03-05", betaling([AK07, AK15])],
    ["2028-03-09", betaling([VK10])],
    ["2028-03-10", betaling([AK19])],
  ] },
  { nr: 5, datum: "2028-03-31", lijnen: [
    ["2028-03-20", { oms: "Bancontact-ontvangsten 18/03/2028", bedrag: ONTV01.bancontact, docs: [ONTV01.id],
      regels: [{ rek: "550000", dc: "D", bedrag: ONTV01.bancontact }, { rek: "400000", dc: "C", bedrag: ONTV01.bancontact }] }],
    ["2028-03-22", { oms: "Storting contanten", bedrag: 3500, docs: [KAS02.id],
      regels: [{ rek: "550000", dc: "D", bedrag: 3500 }, { rek: "580000", dc: "C", bedrag: 3500 }] }],
    ["2028-03-25", betaling([VK11])],
    ["2028-03-31", lonen([L5, L6], "Nettolonen maart 2028 (loonstaten LW-LS-2028-0301 en -0302)")],
  ] },
];

// Termijnen nakijken: binnen 10 dagen = korting, anders niet.
U.forEach((u) => u.lijnen.forEach(([datum, b]) => {
  (b.docs || []).forEach((id) => {
    const x = documenten.find((d) => d.id === id);
    if (!x || !x.fk) return;
    const grens = plusDagen(x.datum, 10);
    if (x.fkBetaald && datum > grens) fout(x.ref + ": korting genomen maar te laat betaald");
    if (!x.fkBetaald && datum <= grens) fout(x.ref + ": binnen de termijn betaald maar geen korting");
  });
}));

let bank = BB["550000"];
const uittreksels = [];
U.forEach((u) => {
  const doc = { id: "J3U" + u.nr, ref: "BANK" + String(u.nr).padStart(2, "0"), categorie: C_FIN, soort: "BANK", datum: u.datum,
    nr: u.nr, vorig: bank, boekOms: "Rekeninguittreksel " + u.nr };
  const regels = [];
  doc.lijnen = u.lijnen.map(([datum, b], i) => {
    bank = r2(bank + b.bedrag);
    b.regels.forEach((x) => regels.push(Object.assign({ oms: b.oms }, x)));
    const lijn = { uittreksel: u.nr, lijn: i + 1, datum, oms: b.oms, bedrag: r2(b.bedrag), saldo: bank, verwijst: (b.docs || []).join(", "), relatie: b.relatie || "" };
    uittreksels.push(Object.assign({ datumUittreksel: u.datum }, lijn));
    if (datum > u.datum) fout(doc.ref + ": lijn na de datum van het uittreksel");
    return lijn;
  });
  doc.nieuw = bank;
  if (bank < 0) fout(doc.ref + ": bank staat negatief (" + bank + ")");
  documenten.push(doc);
  boek(doc, regels);
});

/* ======================================================================
   Afsluiting op 31 maart 2028
   ====================================================================== */

const saldi = () => {
  const s = Object.assign({}, BB);
  journaal.forEach((j) => { s[j.rekening] = r2((s[j.rekening] || 0) + j.debet - j.credit); });
  return s;
};

// ---- Btw-verwerking 1e kwartaal ----
{
  const s = saldi();
  const vorig = BB["411000"] || 0;   // tegoed uit het 4e kwartaal 2027
  const saldo = r2(-(s["451100"] || 0) - (s["451200"] || 0) - (s["411100"] || 0) - (s["411200"] || 0) - vorig);
  const doc = { id: "J3BTW", ref: "BTW", categorie: C_BTW, soort: "MEMO", datum: "2028-03-31", geenDocument: true,
    boekOms: "Btw-verwerking 1e kwartaal 2028" };
  documenten.push(doc);
  const r = [
    { rek: "451100", dc: "D", bedrag: -(s["451100"] || 0) },
    { rek: "451200", dc: "D", bedrag: -(s["451200"] || 0) },
    { rek: "411100", dc: "C", bedrag: s["411100"] || 0 },
    { rek: "411200", dc: "C", bedrag: s["411200"] || 0 },
    { rek: "411000", dc: "C", bedrag: vorig, oms: "Btw-tegoed van het 4e kwartaal 2027 verrekend" },
  ];
  if (saldo >= 0) r.push({ rek: "451000", dc: "C", bedrag: saldo });
  else r.push({ rek: "411000", dc: "D", bedrag: -saldo });
  doc.saldo = saldo;
  boek(doc, r);
}

// ---- Afschrijvingen 1e kwartaal ----
const ACTIVA = [
  { oms: "Bakfiets voor leveringen", rekening: "241000", aanschaf: "2026", waarde: 6000, jaren: 5, reeds: 2400 },
  { oms: "Werkbank met bankschroef en gereedschapswand", rekening: "230000", aanschaf: "2026", waarde: 1500, jaren: 5, reeds: 600 },
  { oms: "Kassasysteem met touchscreen", rekening: "240200", aanschaf: "2026", waarde: 1200, jaren: 3, reeds: 800 },
  { oms: "Montagestandaard voor fietsen", rekening: "232000", aanschaf: "2026", waarde: 500, jaren: 5, reeds: 200 },
  { oms: "Laptop voor administratie en webshop", rekening: "240200", aanschaf: "2026", waarde: 900, jaren: 3, reeds: 600 },
  { oms: "Bestelwagen (lichte vracht), elektrisch", rekening: "241000", aanschaf: "2027", waarde: 24000, jaren: 5, reeds: 4800 },
  { oms: "Wielrichtbank en tweede montagestandaard (" + AK11.nr + ")", rekening: "232000", aanschaf: "15/01/2028", waarde: 2200, jaren: 5, reeds: 0, nieuw: true },
  { oms: "Tablet met werkbonsoftware (" + AK12.nr + ")", rekening: "240200", aanschaf: "29/02/2028", waarde: 1200, jaren: 3, reeds: 0, nieuw: true },
];
ACTIVA.forEach((a) => { a.jaar = r2(a.waarde / a.jaren); a.kwartaal = r2(a.jaar / 4); a.cumul = r2(a.reeds + a.kwartaal); a.boek = r2(a.waarde - a.cumul); });
{
  // Nazicht met de beginbalans: aanschaf en reeds afgeschreven per rekening.
  const per = {};
  ACTIVA.filter((a) => !a.nieuw).forEach((a) => {
    per[a.rekening] = (per[a.rekening] || 0) + a.waarde;
    const afs = String(Number(a.rekening) + 9);
    per[afs] = (per[afs] || 0) - a.reeds;
  });
  Object.keys(per).forEach((nr) => { if (Math.abs(per[nr] - (BB[nr] || 0)) > 0.005) fout("Afschrijvingstabel ≠ beginbalans op " + nr); });
  const doc = { id: "J3AFS", ref: "AFSCHR", categorie: C_EJ, soort: "AFSCHR", datum: "2028-03-31", boekOms: "Afschrijvingen 1e kwartaal 2028" };
  documenten.push(doc);
  const tot = {};
  ACTIVA.forEach((a) => { const afs = String(Number(a.rekening) + 9); tot[afs] = r2((tot[afs] || 0) + a.kwartaal); });
  const kost = (nr) => (/^24/.test(nr) ? "630300" : "630200");
  const kosten = {};
  Object.keys(tot).forEach((afs) => { kosten[kost(afs)] = r2((kosten[kost(afs)] || 0) + tot[afs]); });
  boek(doc, Object.keys(kosten).sort().map((k) => ({ rek: k, dc: "D", bedrag: kosten[k] }))
    .concat(Object.keys(tot).sort().map((k) => ({ rek: k, dc: "C", bedrag: tot[k] }))));
}

// ---- Over te dragen kosten ----
// De facturen die verder lopen dan 31 maart staan volledig in de kosten
// (AK16, AK17, AK22). Pas bij de afsluiting gaat het deel van na 31 maart
// naar 490000.
{
  const stukken = documenten.filter((x) => x.otk);
  const doc = { id: "J3OTK", ref: "OTK", categorie: C_EJ, soort: "OTK", datum: "2028-03-31",
    boekOms: "Over te dragen kosten op 31 maart 2028", stukken: [] };
  const r = [];
  stukken.forEach((x) => {
    const deel = r2(x.totaal * x.otk.maanden / x.otk.van);
    if (Math.abs(deel - Math.round(deel)) > 0.005) fout(x.ref + ": over te dragen deel met centen");
    doc.stukken.push({ ref: x.ref, nr: x.nr, rek: x.otk.rek, totaal: x.totaal, maanden: x.otk.maanden, van: x.otk.van, bedrag: deel });
    r.push({ rek: x.otk.rek, dc: "C", bedrag: deel, oms: "Over te dragen deel van " + x.ref + " (" + x.otk.maanden + "/" + x.otk.van + ")" });
  });
  const tot = r2(r.reduce((t, x) => t + x.bedrag, 0));
  documenten.push(doc);
  boek(doc, [{ rek: "490000", dc: "D", bedrag: tot }].concat(r));
}

// ---- Lening: het deel dat binnen het jaar vervalt ----
{
  const vervalt = aflossingstabel.filter((r) => r.datum > "2028-03-31" && r.datum <= "2029-03-31");
  const bedrag = r2(vervalt.reduce((t, r) => t + r.kapitaal, 0));
  const doc = { id: "J3LEN", ref: "LENING", categorie: C_EJ, soort: "LENING", datum: "2028-03-31",
    boekOms: "Overboeking lening " + LENING.nr + ": kapitaal dat binnen het jaar vervalt (" + vervalt.length + " x " + LENING.kapitaal + ")" };
  doc.vervalt = vervalt.map((r) => r.datum);
  documenten.push(doc);
  boek(doc, [{ rek: "173000", dc: "D", bedrag }, { rek: "423000", dc: "C", bedrag }]);
}

// ---- Voorraad ----
const voorraad = (() => {
  const lijst = Object.keys(ART).filter((k) => ART[k].aankoop).map((code) => {
    const b = BASIS.j2.voorraad.find((v) => v.artikel === code);
    return { artikel: code, oms: ART[code].oms, begin: b ? b.inventaris : 0, aankopen: 0, retoursAankoop: 0, verkopen: 0, retoursVerkoop: 0, dagontvangsten: 0, prijs: ART[code].aankoop };
  });
  const v = (code) => lijst.find((x) => x.artikel === code);
  documenten.forEach((d) => (d.lijnen || []).forEach((l) => {
    if (l.soort !== "artikel" || !v(l.artikel)) return;
    if (d.soort === "AK") v(l.artikel).aankopen += l.aantal;
    if (d.soort === "CN-AK") v(l.artikel).retoursAankoop += l.aantal;
    if (d.soort === "VK") v(l.artikel).verkopen += l.aantal;
    if (d.soort === "CN-VK") v(l.artikel).retoursVerkoop += l.aantal;
    if (d.soort === "DO") v(l.artikel).dagontvangsten += l.aantal;
  }));
  // Breuk en diefstal bestaan niet in de case: telling = theoretische voorraad.
  lijst.forEach((x) => {
    x.inventaris = x.begin + x.aankopen - x.retoursAankoop - x.verkopen + x.retoursVerkoop - x.dagontvangsten;
    if (x.inventaris < 0) fout("Voorraad " + x.artikel + " negatief");
    x.waarde = r2(x.inventaris * x.prijs);
  });
  return lijst;
})();
{
  const eind = r2(voorraad.reduce((t, x) => t + x.waarde, 0));
  const begin = BB["340000"];
  const begin2 = r2(voorraad.reduce((t, x) => t + x.begin * x.prijs, 0));
  if (Math.abs(begin - begin2) > 0.005) fout("Beginvoorraad ≠ 340000");
  const doc = { id: "J3VR", ref: "VR", categorie: C_EJ, soort: "VR", datum: "2028-03-31", eind, begin,
    boekOms: "Voorraadwijziging handelsgoederen 1e kwartaal 2028 (" + eind + " - " + begin + ")" };
  documenten.push(doc);
  const w = r2(eind - begin);
  boek(doc, w >= 0
    ? [{ rek: "340000", dc: "D", bedrag: w }, { rek: "609400", dc: "C", bedrag: w }]
    : [{ rek: "609400", dc: "D", bedrag: -w }, { rek: "340000", dc: "C", bedrag: -w }]);
}

// ---- Resultaat ----
const resultaat = (() => {
  const s = saldi();
  const opbrengsten = r2(-Object.keys(s).filter((k) => /^7/.test(k)).reduce((t, k) => t + s[k], 0));
  const kosten = r2(Object.keys(s).filter((k) => /^6/.test(k)).reduce((t, k) => t + s[k], 0));
  const winst = r2(opbrengsten - kosten);
  const belasting = r2(winst * 0.20);
  const restwinst = r2(winst - belasting);
  const kapitaal = -(BB["100000"] || 0);
  const reserveNu = -(BB["130000"] || 0);
  const reserve = Math.min(r2(restwinst * 0.05), r2(kapitaal * 0.10 - reserveNu));
  const overdragen = r2(restwinst - reserve);
  return { opbrengsten, kosten, winst, belasting, restwinst, reserve, overdragen, kapitaal, reserveNu };
})();
if (resultaat.winst <= 0) fout("Geen winst: " + resultaat.winst);
{
  const doc = { id: "J3BEL", ref: "BELASTING", categorie: C_RES, soort: "MEMO", datum: "2028-03-31", geenDocument: true,
    boekOms: "Geraamde vennootschapsbelasting 1e kwartaal 2028 (20% van " + resultaat.winst + ")" };
  documenten.push(doc);
  boek(doc, [{ rek: "670200", dc: "D", bedrag: resultaat.belasting }, { rek: "450000", dc: "C", bedrag: resultaat.belasting }]);
  const doc2 = { id: "J3RES", ref: "RESULTAAT", categorie: C_RES, soort: "MEMO", datum: "2028-03-31", geenDocument: true,
    boekOms: "Toewijzing van het resultaat: 5% wettelijke reserve, de rest overgedragen" };
  documenten.push(doc2);
  boek(doc2, [
    { rek: "692000", dc: "D", bedrag: resultaat.reserve },
    { rek: "693000", dc: "D", bedrag: resultaat.overdragen },
    { rek: "130000", dc: "C", bedrag: resultaat.reserve },
    { rek: "140000", dc: "C", bedrag: resultaat.overdragen },
  ]);
}

/* ======================================================================
   Proefbalans en laatste controles
   ====================================================================== */

const eind = saldi();
const proefbalans = Object.keys(Object.assign({}, BB, eind)).sort().map((nr) => ({
  rekening: nr, naam: rek(nr).naam, apko: rek(nr).apko, opening: r2(BB[nr] || 0), slot: r2(eind[nr] || 0),
}));
const totaal = r2(proefbalans.reduce((t, r) => t + r.slot, 0));
if (Math.abs(totaal) > 0.005) fout("Proefbalans niet in evenwicht: " + totaal);
proefbalans.forEach((r) => {
  if (/^[67]/.test(r.rekening) && Math.abs(r.slot) > 0.005 && !/^69/.test(r.rekening)) {
    // 6/7 blijven staan tot de resultaatverwerking; enkel 69 is al geboekt.
  }
});
if (Math.abs(eind["550000"] - bank) > 0.005) fout("Bank ≠ laatste uittreksel");
if (Math.abs(r2(eind["570000"]) - r2(BB["570000"] + KAS01.contant + KAS02.contant)) > 0.005) fout("Kas klopt niet");
if (Math.abs(eind["580000"] || 0) > 0.005) fout("580000 niet op nul");
["411100", "411200", "451100", "451200"].forEach((nr) => { if (Math.abs(eind[nr] || 0) > 0.005) fout(nr + " niet op nul na btw"); });
if (Math.abs((eind["340000"]) - voorraad.reduce((t, x) => t + x.waarde, 0)) > 0.005) fout("340000 ≠ telling");

// Openstaande klanten en leveranciers op 31/3 (afpunten).
const open = {};
journaal.filter((j) => j.rekening === "400000" || j.rekening === "440000").forEach((j) => {
  const d = documenten.find((x) => x.id === j.doc);
  let rel = d.relatie;
  if (!rel && d.soort === "BANK") {
    const lijn = uittreksels.find((u) => u.uittreksel === d.nr && u.oms === j.oms);
    rel = lijn && lijn.relatie;
  }
  if (!rel && (d.soort === "DO" || d.soort === "KAS")) rel = "particulieren (kasticket)";
  if (!rel && d.soort === "BANK" && /Bancontact/.test(j.oms)) rel = "particulieren (kasticket)";
  if (!rel) fout("Geen relatie voor " + d.ref + " " + j.rekening);
  j.relatie = rel;
  const k = j.rekening + "|" + rel;
  open[k] = r2((open[k] || 0) + j.debet - j.credit);
});
const openstaand = Object.keys(open).filter((k) => Math.abs(open[k]) > 0.005).map((k) => ({ rekening: k.split("|")[0], relatie: k.split("|")[1], saldo: open[k] }));
const somOpen = (nr) => r2(openstaand.filter((o) => o.rekening === nr).reduce((t, o) => t + o.saldo, 0));
if (Math.abs(somOpen("400000") - (eind["400000"] || 0)) > 0.005) fout("Open klanten ≠ 400000");
if (Math.abs(somOpen("440000") - (eind["440000"] || 0)) > 0.005) fout("Open leveranciers ≠ 440000");

/* ====================================================================== */

const uit = {
  gemaakt: "hulpmiddelen/noor/case-j3.js",
  titel: "Fietsatelier Noor bv — jaar 3 (3e graad): 1e kwartaal 2028",
  bedrijven: BASIS.bedrijven, artikelen: BASIS.artikelen,
  beginbalans, documenten, uittreksels, journaal, proefbalans, voorraad, activa: ACTIVA,
  lening: Object.assign({}, LENING, { tabel: aflossingstabel }), resultaat, openstaand,
};
fs.writeFileSync(path.join(__dirname, "case-j3.json"), JSON.stringify(uit, null, 1));

// Samenvatting
const telPer = {};
documenten.forEach((d) => { telPer[d.categorie] = (telPer[d.categorie] || 0) + 1; });
console.log("Documenten per categorie:");
Object.keys(telPer).forEach((k) => console.log("  " + String(telPer[k]).padStart(3) + "  " + k));
console.log("Journaalregels: " + journaal.length);
console.log("Resultaat:", resultaat);
console.log("Bank eind: " + bank + " · kas eind: " + eind["570000"] + " · btw-saldo Q1: " +
  documenten.find((d) => d.ref === "BTW").saldo);
console.log("Voorraad:", voorraad.map((x) => x.artikel + " " + x.begin + "→" + x.inventaris).join(", "),
  "· waarde", r2(voorraad.reduce((t, x) => t + x.waarde, 0)));
console.log("Open op 31/3:", openstaand.map((o) => o.rekening + " " + o.relatie + " " + o.saldo).join(" | "));
