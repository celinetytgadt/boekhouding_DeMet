// maak-documenten.js — de verantwoordingsstukken van het oefendossier
// Fietsatelier Noor (1e kwartaal 2028) als PNG in documenten/noor/.
//
//   node hulpmiddelen/noor/maak-documenten.js            alle documenten
//   node hulpmiddelen/noor/maak-documenten.js AK01 BANK03 enkel deze
//   node hulpmiddelen/noor/maak-documenten.js --html     enkel de HTML (map _html)
//
// Zelfde werkwijze en zelfde huisstijl per bedrijf als de app van het 4e
// jaar (BKH4, hulpmiddelen/maak-documenten.js): de leerlingen herkennen
// Velomax, Spaakwerk en Banco Leuven. Elk document wordt als HTML-pagina
// opgebouwd uit case-j3.json en door Chrome of Edge zonder venster
// gefotografeerd. Geen extra pakketten nodig.
//
// Chrome niet gevonden? Zet het pad in de omgevingsvariabele CHROME_PAD.

"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");
const CASE = require("./case-j3.json");

const ROOT = path.join(__dirname, "..", "..");
const DOEL = path.join(ROOT, "documenten", "noor");
const BREEDTE = 1000;          // CSS-pixels; de PNG wordt 2x zo groot (scherp)
const NOOR = "Fietsatelier Noor bv";

/* ======================================================================
   Opmaakhulpjes
   ====================================================================== */

const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus",
  "september", "oktober", "november", "december"];
const d = (iso) => new Date(iso + "T12:00:00Z");
const datumLang = (iso) => { const x = d(iso); return x.getUTCDate() + " " + MAANDEN[x.getUTCMonth()] + " " + x.getUTCFullYear(); };
const datumKort = (iso) => { const x = d(iso); const p = (n) => String(n).padStart(2, "0"); return p(x.getUTCDate()) + "-" + p(x.getUTCMonth() + 1) + "-" + x.getUTCFullYear(); };
const datumSlash = (iso) => datumKort(iso).replace(/-/g, "/");
const plusDagen = (iso, n) => { const x = d(iso); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

function bedrag(n, metTeken) {
  const neg = n < 0;
  const a = Math.abs(Math.round(n * 100) / 100);
  const heel = Math.abs(a - Math.round(a)) < 0.005;
  const t = new Intl.NumberFormat("nl-BE", { minimumFractionDigits: heel ? 0 : 2, maximumFractionDigits: 2 }).format(a);
  return (neg ? "- " : (metTeken ? "+ " : "")) + t;
}
const eur = (n) => (n < 0 ? "- € " + bedrag(-n) : "€ " + bedrag(n));
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const pct = (p) => Math.round(p * 100) + "%";
const bedrijf = (naam) => CASE.bedrijven.find((b) => b.naam === naam) || null;

/* ======================================================================
   Huisstijl per bedrijf (fictief) — dezelfde als in BKH4, aangevuld
   ====================================================================== */

const STIJL = {
  NOOR: { kleur: "#1f7a4d", donker: "#14422b", letter: "N", slogan: "fietsenwinkel en -herstelling · Leuven" },
  VELO: { kleur: "#e8590c", donker: "#2b2d31", letter: "V", slogan: "groothandel in fietsen sinds 1994" },
  SPAAK: { kleur: "#1c64c4", donker: "#13294b", letter: "S", slogan: "onderdelen en accessoires voor de vakhandel" },
  HELM: { kleur: "#7048e8", donker: "#2a1f55", letter: "H", slogan: "helmen en sloten · groothandel" },
  STROOM: { kleur: "#e0a100", donker: "#3b3000", letter: "⚡", slogan: "groene stroom voor ondernemers" },
  NET: { kleur: "#0b7285", donker: "#062f37", letter: "n", slogan: "internet en telefonie voor kmo's" },
  MOREAU: { kleur: "#c92a2a", donker: "#25262b", letter: "M", slogan: "bedrijfswagens · verkoop en onderhoud" },
  PEET: { kleur: "#d6336c", donker: "#3a0d1f", letter: "P", slogan: "drukwerk en reclame sinds 1971" },
  DEPREZ: { kleur: "#5c940d", donker: "#1f3306", letter: "D", slogan: "inrichting van werkplaatsen voor de vakhandel" },
  KASSA: { kleur: "#1098ad", donker: "#0b2e33", letter: "K", slogan: "kassasystemen, tablets en software" },
  LOONW: { kleur: "#3b6ea5", donker: "#13314a", letter: "L", slogan: "erkend sociaal secretariaat" },
  GERZO: { kleur: "#364fc7", donker: "#141f4f", letter: "G", slogan: "verzekeringen voor zelfstandigen en kmo's" },
  VAART: { kleur: "#868e96", donker: "#212529", letter: "IV", slogan: "verhuur van opslag- en bedrijfsruimte" },
  PREV: { kleur: "#2b8a3e", donker: "#0f2e15", letter: "+", slogan: "externe dienst voor preventie en bescherming op het werk" },
};
function stijlVan(naam) {
  const b = bedrijf(naam);
  return { b, s: (b && STIJL[b.code]) || STIJL.NOOR };
}

/* ======================================================================
   Gemeenschappelijke CSS (zoals BKH4)
   ====================================================================== */

const CSS = `
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff;overflow:hidden}
::-webkit-scrollbar{display:none}
body{min-height:100vh;display:flex;flex-direction:column;width:${BREEDTE}px;font-family:Arial,"Liberation Sans",Helvetica,sans-serif;color:#22252a;font-size:17px;line-height:1.35}
.kop{display:flex;justify-content:space-between;align-items:center;padding:34px 56px 30px 56px;color:#fff}
.logo{display:flex;align-items:center;gap:20px}
.logo .blok{width:64px;height:64px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:#fff}
.logo .naam{font-size:38px;font-weight:700;letter-spacing:.5px}
.logo .slogan{font-size:15px;opacity:.75;margin-top:2px}
.kop .gegevens{text-align:right;font-size:15px;opacity:.9;line-height:1.6}
.inhoud{padding:30px 56px 20px 56px}
.titelrij{display:flex;justify-content:space-between;align-items:flex-start;gap:24px}
h1{font-size:38px;margin:0 0 6px 0;letter-spacing:.5px}
.streep{height:6px;width:120px;margin-bottom:22px}
.meta{display:grid;grid-template-columns:auto auto;gap:4px 34px;font-size:17px}
.meta .l{color:#8a8178;font-weight:700}
.adres .l{color:#8a8178;font-weight:700;font-size:14px;letter-spacing:.5px;margin-bottom:4px}
table{width:100%;border-collapse:collapse}
th{font-size:14px;letter-spacing:.4px;text-align:left;padding:9px 6px;border-bottom:2px solid #d6d2cc}
td{padding:9px 6px;border-bottom:1px solid #e6e2dc;vertical-align:top}
.r{text-align:right}
.zacht{color:#7a746c}
.voet{margin-top:auto;padding:14px 56px;color:#c9c5bf;font-size:13px;text-align:center;line-height:1.6}
.totaal-blok{display:flex;justify-content:space-between;gap:30px;margin-top:22px;align-items:flex-start}
.totaal-blok .uitleg{font-size:15px;color:#5a554f;max-width:430px}
.totalen{background:#f1efec;padding:18px 24px;min-width:400px}
.totalen .rij{display:flex;justify-content:space-between;padding:4px 0;gap:20px}
.totalen .groot{border-top:1px solid #bdb8b1;margin-top:8px;padding-top:12px;font-size:21px;font-weight:700}
.reden{margin-top:14px;padding:12px 16px;border-left:5px solid;background:#faf8f6;font-size:16px}
.sterretje{font-size:14px;color:#5a554f;margin-top:6px}
`;

function pagina(inhoud, extraCss) {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><style>${CSS}${extraCss || ""}</style></head><body>${inhoud}</body></html>`;
}

const FICTIEF = "Dit is een fictief document, gemaakt voor de lessen boekhouden in het secundair onderwijs.";

function kopBedrijf(naam, s) {
  const b = bedrijf(naam);
  return `
<div class="kop" style="background:${s.donker}">
  <div class="logo"><div class="blok" style="background:${s.kleur}${s.letter.length > 1 ? ";font-size:26px" : ""}">${esc(s.letter)}</div>
    <div><div class="naam">${esc(naam)}</div><div class="slogan">${esc(s.slogan)}</div></div></div>
  <div class="gegevens">${esc(b.adres)} · ${esc(b.gemeente)}<br>Btw ${esc(b.btw)}<br>IBAN ${esc(b.iban)}</div>
</div>`;
}
const voetBedrijf = (naam, s) => {
  const b = bedrijf(naam);
  return `<div class="voet" style="background:${s.donker}">${esc(naam)} · ${esc(b.adres)}, ${esc(b.gemeente)} · Btw ${esc(b.btw)}<br>${FICTIEF}</div>`;
};

/* ======================================================================
   Factuur en creditnota
   ====================================================================== */

function factuurHtml(doc) {
  const cn = /^CN-/.test(doc.soort);
  const uitgaand = doc.van === NOOR;
  const { s } = stijlVan(doc.van);
  const van = bedrijf(doc.van);
  const aan = bedrijf(doc.aan);
  const lijnen = doc.lijnen;

  const fk = lijnen.find((l) => l.soort === "financiële korting");
  const tabelLijnen = lijnen.filter((l) => l.soort !== "financiële korting");

  const btwTekst = (l) => (l.soort === "verpakking" ? "geen" : l.btwPct === 0 ? "vrijgesteld" : pct(l.btwPct));
  const rij = (l) => {
    if (l.soort === "handelskorting") {
      return `<tr><td>${esc(l.oms)}</td><td class="r"></td><td class="r"></td><td class="r">${pct(l.btwPct)}</td><td class="r">${eur(l.bedrag)}</td></tr>`;
    }
    return `<tr><td>${esc(l.oms)}</td><td class="r">${bedrag(l.aantal)}</td><td class="r">${eur(l.prijs)}</td><td class="r">${btwTekst(l)}</td><td class="r">${eur(l.bedrag)}</td></tr>`;
  };

  const tot = [];
  if (fk) {
    const brutoGoed = tabelLijnen.filter((l) => l.btwPct > 0).reduce((t, l) => t + l.bedrag, 0);
    tot.push(["Totaal excl. btw", eur(brutoGoed)]);
    tot.push(["Financiële korting " + pct(fk.aantal) + " (*)", eur(fk.bedrag)]);
  }
  if (doc.mvh21) { tot.push(["Maatstaf van heffing 21%", eur(doc.mvh21)]); tot.push(["Btw 21%", eur(doc.btw21)]); }
  if (doc.mvh6) { tot.push(["Maatstaf van heffing 6%", eur(doc.mvh6)]); tot.push(["Btw 6%", eur(doc.btw6)]); }
  if (doc.vrij) tot.push(["Vrijgesteld van btw (*)", eur(doc.vrij)]);
  if (doc.waarborg) tot.push(["Waarborg verpakking (geen btw)", eur(doc.waarborg)]);

  let uitleg;
  if (cn) {
    uitleg = uitgaand
      ? "Dit bedrag wordt verrekend met uw factuur " + esc(doc.verwijst) + ". Is die al betaald, dan storten wij het terug."
      : "Dit bedrag mag u in mindering brengen op onze factuur " + esc(doc.verwijst) + ". Is die al betaald, dan storten wij het terug.";
  } else if (doc.vervaldag === doc.datum) {
    uitleg = "Dit bedrag wordt op " + datumLang(doc.datum) + " via domiciliëring van uw rekening gehaald. U hoeft zelf niets te betalen.";
  } else {
    uitleg = "Betaalbaar uiterlijk op " + datumLang(doc.vervaldag) + " op rekening " + esc(van.iban) +
      " van " + esc(doc.van) + ". Vermeld het factuurnummer.";
    if (doc.waarborg) uitleg += "<br><br>De waarborg krijgt u terug wanneer u de verpakking ongeschonden terugbezorgt.";
  }
  const noten = [];
  if (fk) {
    noten.push(`(*) Betaalt u binnen 10 dagen, uiterlijk op ${datumLang(plusDagen(doc.datum, 10))}, dan mag u de financiële korting aftrekken en betaalt u ${eur(doc.binnenTermijn)}. ` +
      "Betaalt u later, dan betaalt u het volledige bedrag. De btw is berekend op het bedrag na korting.");
  }
  if (doc.vrij) {
    noten.push(/Verzekering/.test(doc.van) ? "(*) Verzekeringsverrichtingen zijn vrijgesteld van btw (art. 44 Btw-wetboek). De premie is inclusief taksen."
      : /Immo/.test(doc.van) ? "(*) De verhuur van onroerende goederen is vrijgesteld van btw (art. 44 Btw-wetboek)."
        : "(*) Vrijgesteld van btw (art. 44 Btw-wetboek).");
  }

  const meta = cn
    ? [["Nummer", doc.nr], ["Datum", datumLang(doc.datum)], ["Bij factuur", doc.verwijst]]
    : [["Factuurnummer", doc.nr], ["Factuurdatum", datumLang(doc.datum)], ["Vervaldag", datumLang(doc.vervaldag)]];
  if (doc.periode) meta.push(["Periode", doc.periode]);

  const html = kopBedrijf(doc.van, s) + `
<div class="inhoud">
  <div class="titelrij">
    <div><h1>${cn ? "CREDITNOTA" : "FACTUUR"}</h1><div class="streep" style="background:${s.kleur}"></div>
      <div class="adres"><div class="l">${cn ? "AAN" : "GEFACTUREERD AAN"}</div>
        ${esc(aan.naam)}<br>${esc(aan.adres)}<br>${esc(aan.gemeente)}<br>Btw ${esc(aan.btw)}</div></div>
    <div class="meta" style="max-width:470px">${meta.map((m) => `<div class="l">${m[0]}</div><div>${esc(m[1])}</div>`).join("")}</div>
  </div>
  ${cn && doc.reden ? `<div class="reden" style="border-color:${s.kleur}"><strong>Reden:</strong> ${esc(doc.reden)}</div>` : ""}
  <table style="margin-top:24px">
    <thead><tr style="color:${s.kleur}"><th>OMSCHRIJVING</th><th class="r">AANTAL</th><th class="r">EENHEIDSPRIJS</th><th class="r">BTW</th><th class="r">BEDRAG</th></tr></thead>
    <tbody>${tabelLijnen.map(rij).join("")}</tbody>
  </table>
  <div class="totaal-blok">
    <div class="uitleg">${uitleg}</div>
    <div class="totalen">
      ${tot.map((t) => `<div class="rij"><span>${t[0]}</span><span>${t[1]}</span></div>`).join("")}
      <div class="rij groot"><span style="color:${s.kleur}">${cn ? "IN UW VOORDEEL" : "TOTAAL TE BETALEN"}</span><span>${eur(doc.totaal)}</span></div>
    </div>
  </div>
  ${noten.map((n) => `<div class="sterretje">${n}</div>`).join("")}
</div>` + voetBedrijf(doc.van, s);
  return pagina(html);
}

/* ======================================================================
   Dagontvangsten
   ====================================================================== */

function dagontvangstHtml(doc) {
  const s = STIJL.NOOR;
  const noor = bedrijf(NOOR);
  const groep21 = doc.lijnen.filter((l) => l.btwPct === 0.21);
  const groep6 = doc.lijnen.filter((l) => l.btwPct === 0.06);
  const rij = (l) => `<tr><td>${esc(l.oms)}</td><td class="r">${bedrag(l.aantal)}</td><td class="r">${eur(l.prijs * (1 + l.btwPct))}</td>` +
    `<td class="r">${pct(l.btwPct)}</td><td class="r">${eur(l.bedrag + l.btw)}</td></tr>`;
  const html = `
<div class="kop" style="background:${s.donker}">
  <div class="logo"><div class="blok" style="background:${s.kleur}">${s.letter}</div>
    <div><div class="naam">${NOOR}</div><div class="slogan">${esc(s.slogan)}</div></div></div>
  <div class="gegevens">${esc(noor.adres)} · ${esc(noor.gemeente)}<br>Btw ${esc(noor.btw)}</div>
</div>
<div class="inhoud">
  <div class="titelrij">
    <div><h1>DAGONTVANGSTEN</h1><div class="streep" style="background:${s.kleur}"></div>
      <div class="zacht">Verkopen aan particulieren in de winkel (kastickets) · ${esc(doc.periode || "")}</div></div>
    <div class="meta"><div class="l">Nummer</div><div>${esc(doc.nr)}</div><div class="l">Opgemaakt op</div><div>${datumLang(doc.datum)}</div></div>
  </div>
  <table style="margin-top:22px">
    <thead><tr style="color:${s.kleur}"><th>VERKOCHT (KASTICKETS)</th><th class="r">AANTAL</th><th class="r">PRIJS INCL. BTW</th><th class="r">BTW</th><th class="r">TOTAAL INCL. BTW</th></tr></thead>
    <tbody>${groep21.concat(groep6).map(rij).join("")}</tbody>
  </table>
  <table style="margin-top:26px">
    <thead><tr style="color:${s.kleur}"><th>SAMENVATTING</th><th class="r">BTW</th><th class="r">EXCL. BTW</th><th class="r">BTW</th><th class="r">INCL. BTW</th></tr></thead>
    <tbody>
      ${doc.mvh21 ? `<tr><td>Verkopen fietsen, onderdelen en accessoires</td><td class="r">21%</td><td class="r">${eur(doc.mvh21)}</td><td class="r">${eur(doc.btw21)}</td><td class="r">${eur(doc.mvh21 + doc.btw21)}</td></tr>` : ""}
      ${doc.mvh6 ? `<tr><td>Herstellingen (arbeid)</td><td class="r">6%</td><td class="r">${eur(doc.mvh6)}</td><td class="r">${eur(doc.btw6)}</td><td class="r">${eur(doc.mvh6 + doc.btw6)}</td></tr>` : ""}
      <tr style="font-weight:700"><td>Totaal</td><td></td><td class="r">${eur(doc.mvh21 + doc.mvh6)}</td><td class="r">${eur(doc.btw21 + doc.btw6)}</td><td class="r">${eur(doc.totaal)}</td></tr>
      <tr><td>Waarvan contant ontvangen (in de kassa)</td><td></td><td></td><td></td><td class="r">${eur(doc.contant)}</td></tr>
      <tr><td>Waarvan met bancontact ontvangen (komt later op de bankrekening)</td><td></td><td></td><td></td><td class="r">${eur(doc.bancontact)}</td></tr>
    </tbody>
  </table>
</div>
<div class="voet" style="background:${s.donker}">${NOOR} · ${esc(noor.adres)}, ${esc(noor.gemeente)} · Btw ${esc(noor.btw)}<br>${FICTIEF}</div>`;
  return pagina(html);
}

/* ======================================================================
   Kasstuk
   ====================================================================== */

function kasHtml(doc, vorig, nieuw) {
  const s = STIJL.NOOR;
  const bedr = doc.contant;   // + ontvangst, - uitgave
  const soort = bedr > 0 ? "Ontvangst" : "Uitgave";
  let oms = doc.reden || "";
  if (doc.subsoort === "ontvangst") oms = "Contant ontvangen bij de dagontvangsten (" + doc.verwijst + ")";
  if (doc.subsoort === "storting") oms = "Contanten uit de kassa naar de bank gebracht (storting op de bankrekening)";
  const html = `
<div class="kop" style="background:${s.donker}">
  <div class="logo"><div class="blok" style="background:${s.kleur}">${s.letter}</div>
    <div><div class="naam">${NOOR}</div><div class="slogan">kasboek van de winkel</div></div></div>
  <div class="gegevens">Kasstuk ${esc(doc.nr)}<br>${datumLang(doc.datum)}</div>
</div>
<div class="inhoud">
  <div class="titelrij">
    <div><h1>KASSTUK</h1><div class="streep" style="background:${s.kleur}"></div></div>
    <div class="meta"><div class="l">Nummer</div><div>${esc(doc.nr)}</div><div class="l">Datum</div><div>${datumLang(doc.datum)}</div>
      <div class="l">Opgemaakt door</div><div>Lina Vermeulen</div></div>
  </div>
  <table style="margin-top:20px;font-size:19px">
    <thead><tr style="color:${s.kleur}"><th style="width:60%">OMSCHRIJVING</th><th class="r">ONTVANGST</th><th class="r">UITGAVE</th></tr></thead>
    <tbody>
      <tr style="background:#eef6f1;font-weight:700"><td>Kassaldo vóór deze verrichting</td><td class="r" colspan="2">${eur(vorig)}</td></tr>
      <tr><td><strong>${soort}</strong><br>${esc(oms)}</td><td class="r">${bedr > 0 ? eur(bedr) : ""}</td><td class="r">${bedr < 0 ? eur(-bedr) : ""}</td></tr>
      <tr style="background:#eef6f1;font-weight:700"><td>Nieuw kassaldo</td><td class="r" colspan="2">${eur(nieuw)}</td></tr>
    </tbody>
  </table>
  <div class="sterretje" style="margin-top:22px">Handtekening voor ontvangst / uitgave: &nbsp; <em style="font-family:'Segoe Script','Brush Script MT',cursive;font-size:24px;color:#2b3a8f">L. Vermeulen</em></div>
</div>
<div class="voet" style="background:${s.donker}">${NOOR} · intern document<br>${FICTIEF}</div>`;
  return pagina(html);
}

/* ======================================================================
   Rekeninguittreksel
   ====================================================================== */

const BANK = { kleur: "#7a1f3d", licht: "#f6e9ee", naam: "Banco Leuven" };

function bankLabel(r) {
  const o = r.oms.toLowerCase();
  if (o.indexOf("bancontact") === 0) return "Bancontact-ontvangsten";
  if (o.indexOf("storting") === 0) return "Storting contanten";
  if (o.indexOf("aflossing") === 0) return "Aflossing krediet";
  if (o.indexOf("domiciliëring") === 0) return "Domiciliëring";
  if (o.indexOf("nettolonen") === 0) return "Loonbetaling";
  return r.bedrag > 0 ? "Overschrijving in uw voordeel" : "Overschrijving in uw nadeel";
}

function bankHtml(doc) {
  const noor = bedrijf(NOOR);
  const html = `
<div style="height:40px;background:${BANK.kleur}"></div>
<div class="inhoud" style="padding-top:26px">
  <div class="titelrij">
    <div style="display:flex;align-items:center;gap:18px">
      <div style="width:64px;height:64px;border-radius:50%;background:${BANK.kleur};color:#fff;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:700">BL</div>
      <div><div style="font-size:34px;font-weight:700;color:#2a1720">${BANK.naam}</div>
        <div class="zacht">${esc(noor.naam)} · ${esc(noor.adres)} · ${esc(noor.gemeente)}<br>Rekening ${esc(noor.iban)}</div></div>
    </div>
    <div style="text-align:right"><div style="font-size:26px;font-weight:700;color:#2a1720;white-space:nowrap">REKENINGUITTREKSEL NR. ${doc.nr}</div>
      <div style="font-size:22px;margin-top:6px">${datumSlash(doc.datum)}</div></div>
  </div>
  <table style="margin-top:30px;font-size:18px">
    <tbody>
      <tr style="background:${BANK.licht};font-weight:700"><td style="width:140px"></td><td>Vorig saldo</td><td class="r">${bedrag(doc.vorig)} €</td></tr>
      ${doc.lijnen.map((r) => `<tr><td>${datumKort(r.datum)}</td><td><strong style="color:${r.bedrag > 0 ? "#1f6f4a" : "#a61e1e"}">${bankLabel(r)}</strong><br>${esc(r.oms)}</td>` +
        `<td class="r" style="white-space:nowrap">${bedrag(r.bedrag, true)} €</td></tr>`).join("")}
      <tr style="background:${BANK.licht};font-weight:700"><td></td><td>Nieuw saldo</td><td class="r">${bedrag(doc.nieuw)} €</td></tr>
    </tbody>
  </table>
</div>
<div class="voet" style="color:${BANK.kleur}">Banco Leuven nv · Ladeuzeplein 1, 3000 Leuven · BIC BALEBE22<br>${FICTIEF}</div>`;
  return pagina(html);
}

/* ======================================================================
   Loonstaat en factuur van het sociaal secretariaat
   ====================================================================== */

function loonstaatHtml(doc) {
  const { s } = stijlVan("Loonwijs vzw");
  const arb = doc.statuut === "arbeiders";
  const w = doc.werknemers[0];
  const factuur = CASE.documenten.find((x) => x.soort === "RSZ" && (x.staten || []).indexOf(doc.id) !== -1);
  const rijen = [];
  rijen.push(["Basisloon " + (arb ? "(maandloon)" : "(maandwedde)"), w.loon]);
  if (w.extra) rijen.push(["Bijkomend: " + w.extraOms, w.extra]);
  rijen.push(["Brutoloon", w.bruto, "streep"]);
  rijen.push(["RSZ werknemer 13,07%", -w.rsz]);
  rijen.push(["Belastbaar loon", w.belastbaar, "streep"]);
  rijen.push(["Bedrijfsvoorheffing", -w.bv]);
  rijen.push(["Netto te betalen", w.netto, "vet"]);
  rijen.push(["Werkgeversbijdragen RSZ 25% (op het brutoloon)", w.wg, "ruimte"]);
  rijen.push(["Totale loonkost voor de werkgever", w.bruto + w.wg, "vet"]);
  const html = `
<div style="height:8px;background:${s.kleur}"></div>
<div class="inhoud" style="padding-top:40px">
  <div class="titelrij" style="border-bottom:2px solid #d8dde3;padding-bottom:24px">
    <div><div style="font-size:42px;font-weight:700;color:${s.donker}">Loonwijs</div><div class="zacht" style="font-size:18px">Sociaal Secretariaat vzw</div></div>
    <div class="zacht" style="text-align:right;font-size:15px;line-height:1.7">${esc(bedrijf("Loonwijs vzw").adres)} · ${esc(bedrijf("Loonwijs vzw").gemeente)}<br>Btw ${esc(bedrijf("Loonwijs vzw").btw)} · erkenning nr. 318<br>tel. 016 20 31 80 · info@loonwijs.be</div>
  </div>
  <div class="titelrij" style="margin-top:30px">
    <div><h1>LOONSTAAT ${arb ? "ARBEIDERS" : "BEDIENDEN"}</h1><div class="zacht" style="font-size:20px">${esc(doc.periode)} · ${NOOR}</div></div>
    <div style="border:2px solid #d8dde3;padding:18px 24px;min-width:390px">
      <div style="font-weight:700;color:${s.donker};margin-bottom:8px">WERKGEVER</div>
      <div class="meta"><div class="l">Aansluitingsnummer</div><div>LW-30 412</div><div class="l">Loonstaat</div><div>${esc(doc.nr)}</div>
        <div class="l">Periode</div><div>${esc(doc.periode)}</div><div class="l">Uitbetaling</div><div>${datumLang(doc.datum)}</div></div>
    </div>
  </div>
  <table style="margin-top:30px;font-size:19px">
    <thead><tr style="color:${s.donker}"><th>Alle bedragen in euro</th><th class="r">${esc(w.naam.toUpperCase())}</th></tr></thead>
    <tbody>${rijen.map((r) => `<tr style="${r[2] === "vet" ? "font-weight:700;" : ""}${r[2] === "ruimte" ? "border-top:2px solid " + s.donker + ";" : ""}">` +
      `<td>${esc(r[0])}</td><td class="r">${r[1] < 0 ? "− " + bedrag(-r[1]) : bedrag(r[1])}</td></tr>`).join("")}</tbody>
  </table>
  <p class="zacht" style="font-size:16px;margin-top:22px">Het nettoloon wordt op ${datumSlash(doc.datum)} overgeschreven naar de werknemer. De RSZ (werknemer en werkgever) en de bedrijfsvoorheffing stort Loonwijs voor u door; u ontvangt daarvoor factuur ${esc(factuur ? factuur.nr : "")}.</p>
</div>
<div class="voet" style="color:#8a94a0">Sociaal Secretariaat Loonwijs vzw · ${esc(bedrijf("Loonwijs vzw").adres)}, ${esc(bedrijf("Loonwijs vzw").gemeente)} · IBAN ${esc(bedrijf("Loonwijs vzw").iban)}<br>${FICTIEF}</div>`;
  return pagina(html);
}

function rszFactuurHtml(doc) {
  const { s } = stijlVan(doc.van);
  const aan = bedrijf(NOOR);
  const staten = doc.staten.map((id) => CASE.documenten.find((x) => x.id === id));
  const html = kopBedrijf(doc.van, s) + `
<div class="inhoud">
  <div class="titelrij">
    <div><h1>FACTUUR</h1><div class="streep" style="background:${s.kleur}"></div>
      <div class="adres"><div class="l">GEFACTUREERD AAN</div>${esc(aan.naam)}<br>${esc(aan.adres)}<br>${esc(aan.gemeente)}<br>Btw ${esc(aan.btw)}</div></div>
    <div class="meta"><div class="l">Factuurnummer</div><div>${esc(doc.nr)}</div><div class="l">Factuurdatum</div><div>${datumLang(doc.datum)}</div>
      <div class="l">Vervaldag</div><div>${datumLang(doc.vervaldag)}</div><div class="l">Betreft</div><div>lonen ${esc(doc.periode)}</div></div>
  </div>
  <div class="reden" style="border-color:${s.kleur}">Doorstorting van de sociale bijdragen (RSZ) en de bedrijfsvoorheffing van ${esc(doc.periode)}. Loonwijs betaalt deze bedragen in uw naam aan de RSZ en aan de FOD Financiën.</div>
  <table style="margin-top:24px">
    <thead><tr style="color:${s.kleur}"><th>LOONSTAAT</th><th class="r">RSZ WERKNEMER</th><th class="r">RSZ WERKGEVER</th><th class="r">BEDRIJFSVOORHEFFING</th><th class="r">TOTAAL</th></tr></thead>
    <tbody>${staten.map((x) => `<tr><td>${esc(x.nr)} (${x.statuut})</td><td class="r">${eur(x.rsz)}</td><td class="r">${eur(x.wg)}</td><td class="r">${eur(x.bv)}</td><td class="r">${eur(x.rsz + x.wg + x.bv)}</td></tr>`).join("")}
      <tr style="font-weight:700"><td>Totaal</td><td class="r">${eur(doc.rszWn)}</td><td class="r">${eur(doc.rszWg)}</td><td class="r">${eur(doc.bv)}</td><td class="r">${eur(doc.totaal)}</td></tr></tbody>
  </table>
  <div class="totaal-blok">
    <div class="uitleg">Betaalbaar uiterlijk op ${datumLang(doc.vervaldag)} op rekening ${esc(bedrijf(doc.van).iban)} van Loonwijs vzw. Vermeld het factuurnummer.</div>
    <div class="totalen">
      <div class="rij"><span>RSZ (werknemer + werkgever)</span><span>${eur(doc.rsz)}</span></div>
      <div class="rij"><span>Bedrijfsvoorheffing</span><span>${eur(doc.bv)}</span></div>
      <div class="rij groot"><span style="color:${s.kleur}">TOTAAL TE BETALEN</span><span>${eur(doc.totaal)}</span></div>
    </div>
  </div>
  <div class="sterretje">Geen btw: dit zijn bijdragen en voorheffingen die Loonwijs voor uw rekening doorstort. De beheerskosten van Loonwijs worden apart gefactureerd.</div>
</div>` + voetBedrijf(doc.van, s);
  return pagina(html);
}

/* ======================================================================
   Beginbalans, lening, afschrijvingen, voorraad
   ====================================================================== */

function balansKop(titel, sub, meta) {
  const s = STIJL.NOOR;
  return `
<div class="kop" style="background:${s.donker}">
  <div class="logo"><div class="blok" style="background:${s.kleur}">${s.letter}</div>
    <div><div class="naam">${NOOR}</div><div class="slogan">${esc(s.slogan)}</div></div></div>
  <div class="gegevens">Fietsstraat 12 · 3000 Leuven<br>Btw BE 0999.000.101</div>
</div>
<div class="inhoud">
  <div class="titelrij">
    <div><h1>${titel}</h1><div class="streep" style="background:${s.kleur}"></div><div class="zacht">${sub}</div></div>
    <div class="meta">${meta.map((m) => `<div class="l">${m[0]}</div><div>${esc(m[1])}</div>`).join("")}</div>
  </div>`;
}
const balansVoet = () => `</div><div class="voet" style="background:${STIJL.NOOR.donker}">${NOOR} · Fietsstraat 12, 3000 Leuven<br>${FICTIEF}</div>`;

function beginbalansHtml() {
  const bb = {};
  CASE.beginbalans.forEach((r) => { bb[r.rekening] = r.saldo; });
  const v = (nr) => bb[nr] || 0;
  const imu = v("230000") + v("230009") + v("232000") + v("232009");
  const mrm = v("240200") + v("240209") + v("241000") + v("241009");
  const vord = v("400000") + v("411000") + v("418000");
  const act = [
    ["h", "VASTE ACTIVA", imu + mrm],
    ["s", "III. Materiële vaste activa", imu + mrm],
    ["r", "Installaties, machines en uitrusting", imu,
      "installaties: aanschaf " + bedrag(v("230000")) + " − afschrijvingen " + bedrag(-v("230009")) +
      "\nuitrusting: aanschaf " + bedrag(v("232000")) + " − afschrijvingen " + bedrag(-v("232009"))],
    ["r", "Meubilair en rollend materieel", mrm,
      "computers: aanschaf " + bedrag(v("240200")) + " − afschrijvingen " + bedrag(-v("240209")) +
      "\nrollend materieel: aanschaf " + bedrag(v("241000")) + " − afschrijvingen " + bedrag(-v("241009"))],
    ["x"],
    ["h", "VLOTTENDE ACTIVA", v("340000") + vord + v("550000") + v("570000")],
    ["s", "VI. Voorraden", v("340000")],
    ["r", "Handelsgoederen", v("340000")],
    ["s", "VII. Vorderingen op ten hoogste 1 jaar", vord],
    ["r", "Terug te vorderen btw-saldo", v("411000"), "btw-tegoed van het 4e kwartaal 2027"],
    ["r", "Terug te vorderen verpakking", v("418000"), "5 fietsrekken (waarborg) bij Velomax bv"],
    ["s", "IX. Liquide middelen", v("550000") + v("570000")],
    ["r", "Bank", v("550000")],
    ["r", "Kas", v("570000")],
  ].filter((r) => r[0] !== "r" || Math.abs(r[2]) > 0.005);
  const pas = [
    ["h", "EIGEN VERMOGEN", -(v("100000") + v("130000") + v("140000"))],
    ["s", "I. Kapitaal", -v("100000")],
    ["r", "Geplaatst kapitaal", -v("100000")],
    ["s", "V. Overgedragen winst", -v("140000")],
    ["r", "Overgedragen winst", -v("140000"), "winst van 2026 en 2027"],
    ["x"],
    ["h", "SCHULDEN", -(v("173000"))],
    ["s", "VIII. Schulden op meer dan 1 jaar", -v("173000")],
    ["r", "Schulden aan kredietinstellingen", -v("173000"), "lening " + CASE.lening.nr + " bij Banco Leuven (zie aflossingstabel)"],
  ];
  const totA = act.filter((r) => r[0] === "h").reduce((t, r) => t + r[2], 0);
  const totP = pas.filter((r) => r[0] === "h").reduce((t, r) => t + r[2], 0);
  const kol = (rijen) => rijen.map((r) => {
    if (r[0] === "x") return `<tr><td colspan="2" style="border:0;height:14px"></td></tr>`;
    const stijl = r[0] === "h" ? "font-weight:700;color:#14422b" : r[0] === "s" ? "font-weight:700" : "";
    const ins = r[0] === "r" ? "padding-left:22px" : "";
    return `<tr style="${stijl}"><td style="${ins};border:0;padding-top:5px;padding-bottom:5px">${esc(r[1])}${r[3] ? `<div class="zacht" style="font-size:13px;font-weight:400">${esc(r[3]).replace(/\n/g, "<br>")}</div>` : ""}</td>` +
      `<td class="r" style="border:0;padding-top:5px;padding-bottom:5px">${bedrag(r[2])}</td></tr>`;
  }).join("");
  const html = balansKop("BEGINBALANS", "toestand op 1 januari 2028 · alle bedragen in euro",
    [["Boekjaar", "2028"], ["Situatie op", "1 januari 2028"], ["Bron", "eindbalans 2027 na afsluiting"]]) + `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:20px;border-top:2px solid #14422b;padding-top:8px;align-items:start">
    <table><thead><tr><th>ACTIVA</th><th class="r">BEDRAG</th></tr></thead><tbody>${kol(act)}</tbody></table>
    <table><thead><tr><th>PASSIVA</th><th class="r">BEDRAG</th></tr></thead><tbody>${kol(pas)}</tbody></table>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;border-top:2px solid #14422b;margin-top:10px;padding-top:10px;font-weight:700;font-size:19px">
    <div style="display:flex;justify-content:space-between"><span>TOTAAL ACTIVA</span><span>${bedrag(totA)}</span></div>
    <div style="display:flex;justify-content:space-between"><span>TOTAAL PASSIVA</span><span>${bedrag(totP)}</span></div>
  </div>
  <p class="zacht" style="font-size:14px;margin-top:16px">Fietsatelier Noor bv heeft nog geen wettelijke reserve. Er staan op 1 januari 2028 geen facturen van klanten of leveranciers open.</p>` + balansVoet();
  if (Math.abs(totA - totP) > 0.005) throw new Error("Beginbalans niet in evenwicht: " + totA + " / " + totP);
  // Alle rekeningen van de beginbalans moeten op het document staan.
  const getoond = act.concat(pas).filter((r) => r[0] === "r").reduce((t, r) => t + Math.abs(r[2]), 0);
  const nodig = Math.abs(imu) + Math.abs(mrm) + Object.keys(bb).filter((nr) => !/^2/.test(nr)).reduce((t, nr) => t + Math.abs(bb[nr]), 0);
  if (Math.abs(getoond - nodig) > 0.005) throw new Error("Beginbalans: niet alle rekeningen staan op het document");
  return pagina(html);
}

function leningHtml() {
  const L = CASE.lening;
  const html = `
<div style="height:40px;background:${BANK.kleur}"></div>
<div class="inhoud" style="padding-top:26px">
  <div class="titelrij">
    <div style="display:flex;align-items:center;gap:18px">
      <div style="width:64px;height:64px;border-radius:50%;background:${BANK.kleur};color:#fff;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:700">BL</div>
      <div><div style="font-size:34px;font-weight:700;color:#2a1720">${BANK.naam}</div><div class="zacht">Kredietovereenkomst nr. ${esc(L.nr)} · investeringskrediet</div></div>
    </div>
    <div class="meta"><div class="l">Kredietnemer</div><div>${NOOR}</div>
      <div class="l">Bedrag</div><div>${eur(L.bedrag)}</div>
      <div class="l">Opname</div><div>${datumLang(L.opname)}</div>
      <div class="l">Doel</div><div>${esc(L.doel)}</div>
      <div class="l">Rentevoet</div><div>${Math.round(L.rente * 400 * 100) / 100}% per jaar (${Math.round(L.rente * 10000) / 100}% per kwartaal)</div>
      <div class="l">Aflossing</div><div>${L.kwartalen} kwartalen, telkens ${eur(L.kapitaal)} kapitaal + intrest</div></div>
  </div>
  <h2 style="margin:22px 0 4px 0;color:#2a1720">AFLOSSINGSTABEL</h2>
  <div class="zacht" style="font-size:15px">De intrest wordt elk kwartaal berekend op het kapitaal dat nog openstaat. Het bedrag wordt op de vervaldag automatisch van uw rekening gehaald.</div>
  <table style="margin-top:10px;font-size:15px">
    <thead><tr style="color:${BANK.kleur}"><th>NR.</th><th>VERVALDAG</th><th class="r">KAPITAAL</th><th class="r">INTREST</th><th class="r">TE BETALEN</th><th class="r">NOG AF TE LOSSEN KAPITAAL</th></tr></thead>
    <tbody>
      <tr><td></td><td>${datumSlash(L.opname)} (opname)</td><td></td><td></td><td></td><td class="r">${bedrag(L.bedrag)}</td></tr>
      ${L.tabel.map((r) => `<tr><td>${r.nr}</td><td>${datumSlash(r.datum)}</td><td class="r">${bedrag(r.kapitaal)}</td><td class="r">${bedrag(r.intrest)}</td><td class="r">${bedrag(r.totaal)}</td><td class="r">${bedrag(r.rest)}</td></tr>`).join("")}
    </tbody>
  </table>
</div>
<div class="voet" style="color:${BANK.kleur}">Banco Leuven nv · Ladeuzeplein 1, 3000 Leuven<br>${FICTIEF}</div>`;
  return pagina(html, "td{padding:5px 6px}");
}

function afschrijvingHtml() {
  const items = CASE.activa;
  const tot = (k) => items.reduce((t, i) => t + i[k], 0);
  const sleutel = CASE.journaal.filter((j) => j.ref === "AFSCHR").reduce((t, j) => t + j.debet, 0);
  if (Math.abs(tot("kwartaal") - sleutel) > 0.005) throw new Error("Afschrijvingen " + tot("kwartaal") + " ≠ sleutel " + sleutel);
  const html = balansKop("AFSCHRIJVINGSTABEL", "1e kwartaal 2028 · alle bedragen in euro",
    [["Tabel", "AFSCHR"], ["Periode", "01/01 – 31/03/2028"], ["Methode", "lineair"]]) + `
  <table style="margin-top:22px;font-size:15px">
    <thead><tr style="color:#1f7a4d"><th>OMSCHRIJVING</th><th>AANGEKOCHT</th><th class="r">AANSCHAF</th><th class="r">JAREN</th>
      <th class="r">AFSCHR. PER JAAR</th><th class="r">REEDS AFGE&shy;SCHREVEN 31/12/2027</th><th class="r">AFSCHR. 1E KWARTAAL 2028</th><th class="r">BOEK&shy;WAARDE 31/03/2028</th></tr></thead>
    <tbody>${items.map((i) => `<tr><td>${esc(i.oms)}</td><td>${esc(i.aanschaf)}</td><td class="r">${bedrag(i.waarde)}</td><td class="r">${i.jaren}</td>` +
      `<td class="r">${bedrag(i.jaar)}</td><td class="r">${bedrag(i.reeds)}</td><td class="r"><strong>${bedrag(i.kwartaal)}</strong></td><td class="r">${bedrag(i.boek)}</td></tr>`).join("")}
      <tr style="font-weight:700"><td>TOTAAL</td><td></td><td class="r">${bedrag(tot("waarde"))}</td><td></td><td class="r">${bedrag(tot("jaar"))}</td><td class="r">${bedrag(tot("reeds"))}</td>
        <td class="r">${bedrag(tot("kwartaal"))}</td><td class="r">${bedrag(tot("boek"))}</td></tr>
    </tbody>
  </table>
  <p style="font-size:15px;margin-top:18px">Alle vaste activa worden lineair afgeschreven over hun gebruiksduur. Bij de afsluiting op 31 maart boekt Fietsatelier Noor
  een kwart van de jaarafschrijving. Wat in de loop van het kwartaal gekocht werd, krijgt een volledig kwartaal.</p>` + balansVoet();
  return pagina(html);
}

function voorraadHtml() {
  const v = CASE.voorraad;
  const totaal = v.reduce((t, r) => t + r.waarde, 0);
  const html = balansKop("VOORRAADTELLING", "inventaris van de handelsgoederen · alle bedragen in euro",
    [["Telling op", "31 maart 2028"], ["Geteld door", "Noor Benali en Lina Vermeulen"], ["Waardering", "aankoopprijs per stuk"]]) + `
  <table style="margin-top:22px;font-size:17px">
    <thead><tr style="color:#1f7a4d"><th>CODE</th><th>ARTIKEL</th><th class="r">GETELD</th><th class="r">AANKOOPPRIJS</th><th class="r">WAARDE</th></tr></thead>
    <tbody>${v.map((r) => `<tr><td>${esc(r.artikel)}</td><td>${esc(r.oms)}</td><td class="r">${bedrag(r.inventaris)}</td><td class="r">${eur(r.prijs)}</td><td class="r">${eur(r.waarde)}</td></tr>`).join("")}
      <tr style="font-weight:700;font-size:19px"><td></td><td>TOTALE WAARDE VAN DE VOORRAAD</td><td></td><td></td><td class="r">${eur(totaal)}</td></tr>
    </tbody>
  </table>
  <p style="font-size:15px;margin-top:18px">De voorraad is op 31 maart 2028 na sluitingstijd geteld in de winkel en in de opslagruimte aan de Vaartkom.</p>` + balansVoet();
  return pagina(html);
}

/* ======================================================================
   Alles samenzetten
   ====================================================================== */

function alleDocumenten() {
  const docs = [];
  docs.push({ naam: "BEGINBALANS", html: beginbalansHtml() });
  docs.push({ naam: "LENING", html: leningHtml() });

  let kas = CASE.beginbalans.find((r) => r.rekening === "570000").saldo;
  CASE.documenten.slice().sort((a, b) => (a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0)).forEach((o) => {
    if (o.soort === "KAS") {
      const nieuw = Math.round((kas + o.contant) * 100) / 100;
      docs.push({ naam: o.ref, html: kasHtml(o, kas, nieuw) });
      kas = nieuw;
    }
  });
  CASE.documenten.forEach((o) => {
    if (o.soort === "BANK") docs.push({ naam: o.ref, html: bankHtml(o) });
    else if (o.soort === "DO") docs.push({ naam: o.ref, html: dagontvangstHtml(o) });
    else if (/^(CN-)?(AK|VK)$/.test(o.soort)) docs.push({ naam: o.ref, html: factuurHtml(o) });
    else if (o.soort === "LOON") docs.push({ naam: o.ref, html: loonstaatHtml(o) });
    else if (o.soort === "RSZ") docs.push({ naam: o.ref, html: rszFactuurHtml(o) });
    else if (o.soort === "VR") docs.push({ naam: "VR", html: voorraadHtml() });
    else if (o.soort === "AFSCHR") docs.push({ naam: "AFSCHR", html: afschrijvingHtml() });
  });

  const kasSlot = CASE.proefbalans.find((r) => r.rekening === "570000").slot;
  if (Math.abs(kas - kasSlot) > 0.005) throw new Error("Kassaldo " + kas + " ≠ proefbalans " + kasSlot);
  return docs;
}

/* ======================================================================
   Fotograferen met Chrome / Edge (DevTools-protocol, zonder extra pakket)
   ====================================================================== */

function zoekBrowser() {
  const kandidaten = [
    process.env.CHROME_PAD,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium",
  ].filter(Boolean);
  return kandidaten.find((p) => fs.existsSync(p));
}

const wacht = (ms) => new Promise((r) => setTimeout(r, ms));

async function fotografeer(docs) {
  const exe = zoekBrowser();
  if (!exe) throw new Error("Geen Chrome of Edge gevonden. Zet het pad in de omgevingsvariabele CHROME_PAD.");
  const profiel = fs.mkdtempSync(path.join(os.tmpdir(), "docs-chrome-"));
  const poort = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(exe, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--no-sandbox",
    "--remote-debugging-port=" + poort, "--user-data-dir=" + profiel, "about:blank"], { stdio: "ignore" });

  let doel = null;
  for (let i = 0; i < 50 && !doel; i++) {
    await wacht(200);
    try {
      const lijst = await (await fetch("http://127.0.0.1:" + poort + "/json")).json();
      doel = lijst.find((t) => t.type === "page");
    } catch (e) { /* nog niet klaar */ }
  }
  if (!doel) { proc.kill(); throw new Error("De browser startte niet."); }

  const ws = new WebSocket(doel.webSocketDebuggerUrl);
  await new Promise((r, f) => { ws.onopen = r; ws.onerror = f; });
  let id = 0;
  const wachtend = {};
  const gebeurtenissen = [];
  ws.onmessage = (m) => {
    const b = JSON.parse(m.data);
    if (b.id && wachtend[b.id]) { wachtend[b.id](b); delete wachtend[b.id]; }
    else if (b.method) gebeurtenissen.push(b.method);
  };
  const cdp = (method, params) => new Promise((r, f) => {
    const n = ++id;
    wachtend[n] = (b) => (b.error ? f(new Error(method + ": " + b.error.message)) : r(b.result));
    ws.send(JSON.stringify({ id: n, method, params: params || {} }));
  });

  await cdp("Page.enable");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "docs-html-"));
  // Het allereerste beeld van een pas gestarte Chrome is soms een herhaald
  // patroon in plaats van de pagina. Daarom eerst één keer opwarmen.
  const opwarmen = { naam: "_opwarmen", html: docs[0] ? docs[0].html : "<p></p>", weg: true };
  for (const doc of [opwarmen].concat(docs)) {
    const htmlPad = path.join(tmp, doc.naam + ".html");
    fs.writeFileSync(htmlPad, doc.html);
    await cdp("Emulation.setDeviceMetricsOverride", { width: BREEDTE, height: 800, deviceScaleFactor: 2, mobile: false });
    gebeurtenissen.length = 0;
    await cdp("Page.navigate", { url: "file:///" + htmlPad.replace(/\\/g, "/") });
    for (let i = 0; i < 100 && gebeurtenissen.indexOf("Page.loadEventFired") === -1; i++) await wacht(30);
    await cdp("Runtime.evaluate", { expression: "document.fonts.ready", awaitPromise: true });
    const h = await cdp("Runtime.evaluate", { expression: "Math.ceil(document.documentElement.scrollHeight)", returnByValue: true });
    // Minstens liggend A4-formaat, zoals de documenten van kern 8.
    const hoogte = Math.max(760, h.result.value);
    await cdp("Emulation.setDeviceMetricsOverride", { width: BREEDTE, height: hoogte, deviceScaleFactor: 2, mobile: false });
    await wacht(80);
    const foto = await cdp("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: BREEDTE, height: hoogte, scale: 1 } });
    if (doc.weg) continue;
    fs.writeFileSync(path.join(DOEL, doc.naam + ".png"), Buffer.from(foto.data, "base64"));
    process.stdout.write(doc.naam + " ");
  }
  ws.close();
  proc.kill();
  fs.rmSync(tmp, { recursive: true, force: true });
  try { fs.rmSync(profiel, { recursive: true, force: true }); } catch (e) { /* de browser houdt soms nog iets vast */ }
  console.log("\nKlaar: " + docs.length + " documenten in documenten/noor/");
}

/* ====================================================================== */

(async () => {
  const args = process.argv.slice(2);
  let docs = alleDocumenten();
  const enkel = args.filter((a) => !a.startsWith("--")).map((a) => a.toUpperCase());
  if (enkel.length) docs = docs.filter((x) => enkel.indexOf(x.naam) !== -1);
  if (args.indexOf("--html") !== -1) {
    const map = path.join(__dirname, "_html");
    fs.mkdirSync(map, { recursive: true });
    docs.forEach((x) => fs.writeFileSync(path.join(map, x.naam + ".html"), x.html));
    console.log("HTML geschreven in " + map);
    return;
  }
  fs.mkdirSync(DOEL, { recursive: true });
  await fotografeer(docs);
})().catch((e) => { console.error(e); process.exit(1); });
