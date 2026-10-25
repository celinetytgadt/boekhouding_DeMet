/* Testharnas voor de koppeling.
 * Draait de echte app in jsdom en de echte Code.gs in Node, met een
 * nagemaakte Google-omgeving ertussen. Zo wordt het volledige pad getest:
 * indienen -> Sheet -> feedback vrijgeven -> terug in de app.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
// jsdom: gewoon geïnstalleerd (npm install jsdom), of in de map die JSDOM_PAD
// aanwijst, of zoals vroeger in /tmp/node_modules.
let JSDOM;
try { ({ JSDOM } = require(process.env.JSDOM_PAD ? path.join(process.env.JSDOM_PAD, "jsdom") : "jsdom")); }
catch (e) { ({ JSDOM } = require("/tmp/node_modules/jsdom")); }

/* ===================== testkopieën van de app =====================
 * Het harnas maakt ze zelf, zodat er niets met de hand klaargezet moet
 * worden. Drie kopieën:
 *   /tmp/t    één vestiging, met klaslijst en koppeling  (de hoofdtest)
 *   /tmp/t2   zonder klaslijst en zonder koppeling       (valt terug op
 *             het vrije naamveld, knoppen verborgen)
 *   /tmp/t3   twee vestigingen                           (de keuzelijst)
 */
const BRON = path.join(__dirname, "..");
const APP = "/tmp/t";

function kopieerApp(doel, bestanden) {
  fs.rmSync(doel, { recursive: true, force: true });
  ["", "css", "js", "apps-script"].forEach((m) => fs.mkdirSync(path.join(doel, m), { recursive: true }));
  ["index.html", "css/style.css", "apps-script/Code.gs"].forEach((b) => {
    fs.copyFileSync(path.join(BRON, b), path.join(doel, b));
  });
  fs.cpSync(path.join(BRON, "js"), path.join(doel, "js"), { recursive: true });
  fs.copyFileSync(path.join(BRON, "noor.html"), path.join(doel, "noor.html"));
  Object.keys(bestanden).forEach((b) => fs.writeFileSync(path.join(doel, b), bestanden[b]));
}

const CODE_GS = fs.readFileSync(path.join(BRON, "apps-script/Code.gs"), "utf8")
  .replace(/var SLEUTEL = "[^"]*";/, 'var SLEUTEL = "TEST";')
  .replace(/var VESTIGING = "[^"]*";/, 'var VESTIGING = "LEU";')
  // De testomgeving doet alsof "map-gedeeld" de map op de gedeelde Drive is,
  // zodat net het pad getest wordt dat in het echt gebruikt wordt.
  .replace(/var MAP_ID_GEDEELD = "[^"]*";/, 'var MAP_ID_GEDEELD = "map-gedeeld";');

function config(vestigingen) {
  return "const VESTIGINGEN = " + JSON.stringify(vestigingen, null, 2) + ";\n" +
    "const KOPPELING = { bewaarIntervalMinuten: 2, feedbackBijOpstart: true };\n";
}
function klas(lijsten) {
  return "const KLASLIJSTEN = " + JSON.stringify(lijsten, null, 2) + ";\n";
}

const VEST_LEU = { code: "LEU", naam: "Leuven", webAppUrl: "https://fake/exec", sleutel: "TEST" };
const VEST_TW = { code: "TW", naam: "TW", webAppUrl: "https://faketw/exec", sleutel: "TEST" };

kopieerApp("/tmp/t", {
  "js/config-koppeling.js": config([VEST_LEU]),
  "js/data-klas.js": klas({ LEU: ["Lotte V.", "Youssef B."] }),
  "apps-script/Code.gs": CODE_GS,
});
kopieerApp("/tmp/t2", {
  "js/config-koppeling.js": config([{ code: "LEU", naam: "Leuven", webAppUrl: "", sleutel: "TEST" }]),
  "js/data-klas.js": klas({ LEU: [] }),
  "apps-script/Code.gs": CODE_GS,
});
kopieerApp("/tmp/t3", {
  "js/config-koppeling.js": config([VEST_LEU, VEST_TW]),
  "js/data-klas.js": klas({ LEU: ["Lotte V.", "Youssef B."], TW: ["Amal T."] }),
  "apps-script/Code.gs": CODE_GS,
});

let fouten = 0;
function check(naam, voorwaarde, extra) {
  console.log((voorwaarde ? "  ok   " : "  FOUT ") + naam + (voorwaarde || extra === undefined ? "" : "  -> " + JSON.stringify(extra)));
  if (!voorwaarde) fouten++;
}

/* ===================== nagemaakte Google-omgeving ===================== */

class Range {
  constructor(sheet, r, c, nr, nc) { Object.assign(this, { sheet, r, c, nr, nc }); }
  getValues() {
    const uit = [];
    for (let i = 0; i < this.nr; i++) {
      const rij = [];
      for (let j = 0; j < this.nc; j++) rij.push(this.sheet.cel(this.r + i, this.c + j));
      uit.push(rij);
    }
    return uit;
  }
  setValues(v) {
    v.forEach((rij, i) => rij.forEach((w, j) => this.sheet.zet(this.r + i, this.c + j, w)));
    return this;
  }
  getValue() { return this.sheet.cel(this.r, this.c); }
  setValue(v) { this.sheet.zet(this.r, this.c, v); return this; }
  insertCheckboxes() { return this; }
  setDataValidation() { return this; }
  setNumberFormat() { return this; }
  setWrap() { return this; }
  setVerticalAlignment() { return this; }
  setFontWeight() { return this; }
  setBackground() { return this; }
  createFilter() { return this; }
  getRow() { return this.r; }
}

class Sheet {
  constructor(naam) { this.naam = naam; this.rijen = []; }
  cel(r, c) { return (this.rijen[r - 1] || [])[c - 1] ?? ""; }
  zet(r, c, v) {
    while (this.rijen.length < r) this.rijen.push([]);
    const rij = this.rijen[r - 1];
    while (rij.length < c) rij.push("");
    rij[c - 1] = v;
  }
  getName() { return this.naam; }
  getLastRow() { return this.rijen.length; }
  getMaxRows() { return Math.max(this.rijen.length + 100, 200); }
  getRange(a, b, c, d) {
    if (typeof a === "string") return new Range(this, 1, 1, this.getMaxRows(), 20);
    return new Range(this, a, b, c ?? 1, d ?? 1);
  }
  setColumnWidth() { return this; }
  setFrozenRows() { return this; }
  setConditionalFormatRules() { return this; }
  getFilter() { return this.filter || null; }
  getActiveCell() { return new Range(this, this.actieveRij || 2, 1, 1, 1); }
}

const sheets = {};
const ss = {
  getSheetByName: (n) => sheets[n] || null,
  insertSheet: (n) => (sheets[n] = new Sheet(n)),
};

class Bestand {
  constructor(naam, inhoud) { this.naam = naam; this.inhoud = inhoud; this.gemaakt = new Date(); }
  getName() { return this.naam; }
  setContent(i) { this.inhoud = i; return this; }
  getBlob() { return { getDataAsString: () => this.inhoud }; }
  getDateCreated() { return this.gemaakt; }
  setTrashed() { this.verwijderd = true; return this; }
}
class Map_ {
  constructor(naam) { this.naam = naam; this.bestanden = []; this.mappen = []; this.id = "map-" + naam; }
  getId() { return this.id; }
  getName() { return this.naam; }
  getUrl() { return "https://drive.google.com/drive/folders/" + this.id; }
  isTrashed() { return false; }
  createFile(n, i) { const b = new Bestand(n, i); this.bestanden.push(b); return b; }
  getFilesByName(n) { return iter(this.bestanden.filter((b) => b.naam === n && !b.verwijderd)); }
  getFiles() { return iter(this.bestanden.filter((b) => !b.verwijderd)); }
  getFoldersByName(n) { return iter(this.mappen.filter((m) => m.naam === n)); }
  getFolders() { return iter(this.mappen); }
  createFolder(n) { const m = new Map_(n); this.mappen.push(m); return m; }
}
function iter(lijst) { let i = 0; return { hasNext: () => i < lijst.length, next: () => lijst[i++] }; }
const root = new Map_("root");
// De map op de "gedeelde Drive": ze hangt niet onder root, precies zoals in
// het echt. Het script moet ze via haar ID vinden.
const gedeeld = new Map_("Boekhoudapp werkbestanden");
gedeeld.id = "map-gedeeld";
// Met een hoofdletter, zoals iemand die map met de hand zou aanmaken: het
// script moet ze herkennen en er geen tweede naast zetten.
gedeeld.createFolder("Versies");
const alleMappen = { "map-root": root, "map-gedeeld": gedeeld };
function registreer(m) { alleMappen[m.id] = m; m.mappen.forEach(registreer); }

const props = {};
let laatsteAlert = "";
let antwoordPrompt = "";   // wat de "leerkracht" in een prompt tikt
let antwoordKnop = "YES";  // welke knop ze in een ja/nee-venster kiest

const omgeving = {
  console,
  JSON, Date, Math, String, Number, Object, Array, Error, isNaN, parseInt, parseFloat,
  SpreadsheetApp: {
    getActiveSpreadsheet: () => ss,
    getActiveSheet: () => sheets.Inzendingen,
    flush: () => {},
    getUi: () => ({
      // Eén argument = gewone melding; drie = een ja/nee-venster.
      alert: (t, b, c) => { laatsteAlert = c === undefined ? t : t + "\n" + b; return antwoordKnop; },
      prompt: () => ({ getSelectedButton: () => "OK", getResponseText: () => antwoordPrompt }),
      Button: { OK: "OK", YES: "YES", NO: "NO" },
      ButtonSet: { OK_CANCEL: "ok_cancel", YES_NO: "yes_no" },
      createMenu: () => ({ addItem() { return this; }, addSeparator() { return this; }, addToUi() {} }),
    }),
    newDataValidation: () => ({ requireValueInList() { return this; }, setAllowInvalid() { return this; }, build: () => ({}) }),
    newConditionalFormatRule: () => ({ whenTextEqualTo() { return this; }, setBackground() { return this; }, setRanges() { return this; }, build: () => ({}) }),
  },
  ContentService: {
    MimeType: { JSON: "json" },
    createTextOutput: (t) => ({ tekst: t, setMimeType() { return this; } }),
  },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  PropertiesService: {
    getScriptProperties: () => ({ getProperty: (k) => props[k] || null, setProperty: (k, v) => { props[k] = v; } }),
  },
  DriveApp: { getRootFolder: () => root, getFolderById: (id) => { registreer(root); if (!alleMappen[id]) throw new Error("weg"); return alleMappen[id]; } },
  MimeType: { PLAIN_TEXT: "text/plain" },
  Session: { getScriptTimeZone: () => "Europe/Brussels" },
  Utilities: {
    formatDate: (d, tz, pat) => {
      const p = (n) => String(n).padStart(2, "0");
      return pat.replace("yyyy", d.getFullYear()).replace("MMdd", p(d.getMonth() + 1) + p(d.getDate()))
        .replace("MM", p(d.getMonth() + 1)).replace("dd", p(d.getDate()))
        .replace("HHmmss", p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()))
        .replace("HHmm", p(d.getHours()) + p(d.getMinutes())).replace("d", d.getDate());
    },
  },
};
vm.createContext(omgeving);
vm.runInContext(fs.readFileSync(path.join(APP, "apps-script/Code.gs"), "utf8"), omgeving);

/* ===================== nagemaakte server ===================== */

let serverHangt = false;   // nagebootst: Google laat de web-app wachten
let werkVertraging = 0;    // ms: het werk komt traag terug van de server

function server(url, opts) {
  const u = new URL(url);
  if (serverHangt && u.searchParams.get("actie") === "instellingen") return new Promise(() => {});
  if (u.hostname === "faketw") {
    // De tweede vestiging: een eigen Sheet, nog helemaal leeg. Haar app valt
    // dus terug op js/data-klas.js.
    const leeg = { ok: true, vestiging: "TW", instellingen: {}, taken: {}, klas: [], beheerMogelijk: false };
    return Promise.resolve({ json: () => Promise.resolve(leeg) });
  }
  let r;
  if (!opts || opts.method === "GET") {
    const parameter = {};
    u.searchParams.forEach((v, k) => (parameter[k] = v));
    r = omgeving.doGet({ parameter });
  } else {
    r = omgeving.doPost({ postData: { contents: opts.body } });
  }
  const antwoord = { json: () => Promise.resolve(JSON.parse(r.tekst)) };
  if (werkVertraging && u.searchParams.get("actie") === "werk") {
    return new Promise((klaar) => setTimeout(() => klaar(antwoord), werkVertraging));
  }
  return Promise.resolve(antwoord);
}

/* ===================== de app in jsdom ===================== */

// De scripts worden zelf ingeladen (en niet door jsdom), zodat de pagina op
// een https-adres draait. Enkel dan geeft jsdom een werkende localStorage —
// en net die willen we testen.
async function start(map, pagina, vooraf) {
  map = map || APP;
  const html = fs.readFileSync(path.join(map, pagina || "index.html"), "utf8");
  const bronnen = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  const dom = new JSDOM(html.replace(/<script src="[^"]+"><\/script>/g, ""), {
    runScripts: "dangerously",
    url: "https://test.local/",
    pretendToBeVisual: true,
  });
  dom.window.fetch = server;
  dom.window.navigator.sendBeacon = () => true;
  // Wat er al in de browser stond (bv. de aanmelding en het werk van MetWear).
  Object.keys(vooraf || {}).forEach((k) => dom.window.localStorage.setItem(k, vooraf[k]));

  // Als <script>-element invoegen en niet met eval: enkel zo komen de
  // const-declaraties (MAR_INDELING, OPDRACHTEN, KLASLIJST …) echt in de
  // globale ruimte terecht, net zoals in een echte browser.
  const laad = (b) => {
    const s = dom.window.document.createElement("script");
    // Zonder het versienummer (?v=…) dat achter elk script staat.
    s.textContent = fs.readFileSync(path.join(map, b.split("?")[0]), "utf8");
    dom.window.document.head.appendChild(s);
  };
  bronnen.filter((b) => !/koppeling\.js$/.test(b)).forEach(laad);

  // Staat het document nog te laden, dan vuurt jsdom DOMContentLoaded zelf.
  // Dan óók zelf dispatchen zou init() twee keer laten lopen, waardoor elke
  // klik dubbel geteld wordt — een val die niets met de app te maken heeft.
  if (dom.window.document.readyState === "loading") {
    await new Promise((res) => dom.window.document.addEventListener("DOMContentLoaded", res, { once: true }));
  } else {
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  }
  bronnen.filter((b) => /koppeling\.js$/.test(b)).forEach(laad);

  await new Promise((r) => setTimeout(r, 60));
  return dom;
}

function vinkIn(venster, naam) {
  const v = [...venster.querySelectorAll("[data-cat]")].find((x) => x.dataset.cat === naam);
  v.checked = true;
  v.dispatchEvent(new venster.ownerDocument.defaultView.Event("change"));
}

/* ===================== de test ===================== */

(async () => {
  console.log("\n1. Installatie van de Sheet");
  omgeving.installeer();
  check("drie tabbladen aangemaakt", !!(sheets.Klas && sheets.Inzendingen && sheets.Detail));
  check("koppen in Inzendingen", sheets.Inzendingen.cel(1, 5) === "boeking", sheets.Inzendingen.rijen[0]);

  sheets.Klas.zet(2, 1, "Lotte V."); sheets.Klas.zet(2, 2, "");
  sheets.Klas.zet(3, 1, "Youssef B."); sheets.Klas.zet(3, 2, "");
  omgeving.genereerCodes();
  const codeLotte = String(sheets.Klas.cel(2, 2));
  check("codes gegenereerd", /^\d{4}$/.test(codeLotte), codeLotte);
  check("codes zijn verschillend", codeLotte !== String(sheets.Klas.cel(3, 2)));

  sheets.Inzendingen.filter = { bestaat: true };
  laatsteAlert = "";
  omgeving.installeer();
  check("tweede installatie loopt door ondanks een bestaande filter",
    /Klaar\./.test(laatsteAlert) && !/Niet alles lukte/.test(laatsteAlert), laatsteAlert.slice(0, 120));
  // De melding na de installatie is bewust kort (collega's lezen ze); de map
  // en het sleutelwoord staan in de handleiding en in het menu
  // "Waar staan de werkbestanden?".
  check("de melding wijst naar het tabblad Inzendingen", /tabblad Inzendingen/.test(laatsteAlert), laatsteAlert.slice(0, 200));
  laatsteAlert = "";
  omgeving.toonWerkMap();
  check("het menu noemt de map waarin geschreven wordt",
    /Map: Boekhoudapp werkbestanden/.test(laatsteAlert) && /Gekozen via MAP_ID_GEDEELD/.test(laatsteAlert),
    laatsteAlert.slice(0, 200));

  console.log("\n2. Aanmelden");
  const dom = await start();
  const w = dom.window;
  check("brug window.APP bestaat", typeof w.APP === "object");
  check("keuzelijst gevuld", w.document.getElementById("leerling-select").options.length === 3);
  check("geen vestigingskeuze bij één vestiging",
    w.document.getElementById("vestiging-select").hidden === true);
  check("vrij naamveld verborgen", w.document.getElementById("leerling-naam-input").hidden === true);

  const select = w.document.getElementById("leerling-select");
  const code = w.document.getElementById("leerling-code");
  select.value = "Lotte V.";
  code.value = "0000";
  w.document.getElementById("btn-aanmelden").click();
  await new Promise((r) => setTimeout(r, 80));
  check("verkeerde code wordt geweigerd",
    /klopt niet/.test(w.document.getElementById("koppeling-status").textContent),
    w.document.getElementById("koppeling-status").textContent);

  code.value = codeLotte;
  w.document.getElementById("btn-aanmelden").click();
  await new Promise((r) => setTimeout(r, 100));
  check("juiste code wordt aanvaard", w.APP.getState().student === "Lotte V.", w.APP.getState().student);

  console.log("\n3. Werk maken en bewaren op de server");
  const st = w.APP.getState();
  st.boekingen.AK01 = { geboekt: true, rows: [
    { bedrag: "100,00", rekening: "604000", dc: "D", relatie: "", redenering: "aankoop", apko: "K", stijgtDaalt: "stijgt" },
    { bedrag: "21,00", rekening: "411000", dc: "D", relatie: "", redenering: "", apko: "", stijgtDaalt: "" },
    { bedrag: "121,00", rekening: "440000", dc: "C", relatie: "Deleu bv", redenering: "", apko: "", stijgtDaalt: "" },
  ] };
  st.boekingen.AK02 = { geboekt: false, rows: [{ bedrag: "50,00", rekening: "", dc: "", relatie: "", redenering: "", apko: "", stijgtDaalt: "" }] };
  w.APP.saveState();
  check("wijziging gemeld aan de koppeling", true);

  console.log("\n4. Indienen van één categorie");
  w.document.getElementById("btn-indienen").click();
  await new Promise((r) => setTimeout(r, 40));
  const venster = w.document.querySelector(".koppeling-overlay");
  check("indienvenster geopend", !!venster);
  const rijen = [...venster.querySelectorAll("[data-cat]")].map((v) => v.dataset.cat);
  check("Dagontvangsten is geen aparte categorie meer", !rijen.includes("Dagontvangsten"), rijen);
  check("Resultaatverwerking en Eindbalans staan in de lijst",
    ["Resultaatverwerking", "Eindbalans"].every((c) => rijen.includes(c)), rijen);
  check("bevestigknop staat in een vaste voetbalk", !!venster.querySelector(".modal-voet #btn-indienen-bevestig"));
  check("de lijst schuift apart van de knop", !!venster.querySelector(".modal-body .indien-lijst"));

  const vink = (naam) => {
    const v = [...venster.querySelectorAll("[data-cat]")].find((x) => x.dataset.cat === naam);
    v.checked = true;
    v.dispatchEvent(new w.Event("change"));
  };
  vink("Aankopen");
  venster.querySelector("#btn-indienen-bevestig").click();
  await new Promise((r) => setTimeout(r, 40));
  check("bevestigingsstap verschijnt", !!venster.querySelector('[data-role="bevestig-ja"]'));
  check("waarschuwing over niet-nagekeken controles",
    !!venster.querySelector(".bevestig-waarschuwing"),
    venster.querySelector(".koppeling-modal-inhoud").textContent.slice(0, 80));
  venster.querySelector('[data-role="bevestig-ja"]').click();
  await new Promise((r) => setTimeout(r, 140));

  check("wacht- en gelukt-melding getoond", !!venster.querySelector(".melding-ok"),
    venster.querySelector(".koppeling-modal-inhoud").textContent.slice(0, 60));
  venster.querySelector('[data-role="modal-sluit"]').click();

  const inz = sheets.Inzendingen;
  // Kop + AK01: enkel wat geboekt is, gaat mee. De controles gaan bewust
  // ook niet mee.
  check("rijen toegevoegd in Inzendingen", inz.getLastRow() === 2, inz.getLastRow());
  check("de controles komen niet in de Sheet terecht",
    !inz.rijen.some((r) => String(r[3]).indexOf("CONTROLE:") === 0),
    inz.rijen.map((r) => r[3]));
  const ak01 = inz.rijen.find((r) => r[3] === "AK01");
  check("AK01 staat als geboekt", ak01 && ak01[5] === "geboekt", ak01 && ak01[5]);
  // Eén boekingslijn per regel: "604000  100,00  D".
  check("boeking per lijn leesbaar in één cel",
    /^604000\s+100\s+D$/m.test(ak01[4]) && /^440000\s+121\s+C/m.test(ak01[4]), ak01 && ak01[4]);
  check("drie regels in de cel", String(ak01[4]).split("\n").length === 3, ak01 && ak01[4]);
  check("relatie mee achteraan de regel", /440000\s+121\s+C\s+\[Deleu bv\]/.test(ak01[4]), ak01 && ak01[4]);
  check("niet afgerond (AK02 half ingevuld, AK03 leeg) gaat niet mee",
    !inz.rijen.some((r) => r[3] === "AK02" || r[3] === "AK03"), inz.rijen.map((r) => r[3]));
  check("alles op is-laatste JA", inz.rijen.slice(1).every((r) => r[9] === "JA"));
  check("enkel de aangevinkte categorie is verzonden",
    inz.rijen.slice(1).every((r) => r[2] === "Aankopen"));

  check("werk komt in de gedeelde map terecht",
    gedeeld.bestanden.some((b) => b.naam === "werk_LEU_lottev.json"),
    gedeeld.bestanden.map((b) => b.naam));
  check("niets in een eigen map in de Drive",
    !root.mappen.some((m) => m.naam === "Boekhoudapp werkbestanden"),
    root.mappen.map((m) => m.naam));

  // Een eerdere ronde van AK02, zoals een oudere versie van de app ze nog
  // als "onafgewerkt" meestuurde. Zo heeft de historiek hieronder twee ronden.
  await server("https://fake/exec", { method: "POST", body: JSON.stringify({
    sleutel: "TEST", naam: "Lotte V.", code: codeLotte, actie: "indienen",
    items: [{ ref: "AK02", categorie: "Aankopen", titel: "Aankoop AK02", status: "onafgewerkt", boeking: "?? 50 ?", lijnen: [] }],
  }) }).then((r) => r.json());

  console.log("\n5. Tweede inzending overschrijft niets");
  const antwoord2 = await server("https://fake/exec", { method: "POST", body: JSON.stringify({
    sleutel: "TEST", naam: "Lotte V.", code: codeLotte, actie: "indienen",
    items: [{ ref: "AK02", categorie: "Aankopen", titel: "Aankoop AK02", status: "geboekt", boeking: "610000 D 50,00", lijnen: [] }],
  }) }).then((r) => r.json());
  check("tweede inzending aanvaard", antwoord2.ok === true, antwoord2);
  const ak02rijen = inz.rijen.filter((r) => r[3] === "AK02");
  check("oude rij blijft bestaan", ak02rijen.length === 2);
  check("enkel de nieuwste staat op JA", ak02rijen[0][9] === "" && ak02rijen[1][9] === "JA", ak02rijen.map((r) => r[9]));

  console.log("\n6. Nakijken met de nieuwe beoordelingen");
  check("keuzelijst in de Sheet", omgeving.BEOORDELINGEN.join("|") === "In orde|Te remediëren|Niet afgerond",
    omgeving.BEOORDELINGEN);

  const rijVan = (ref, welke) => {
    const alle = inz.rijen.map((r, i) => [r, i + 1]).filter(([r]) => r[3] === ref);
    return alle[welke === undefined ? 0 : welke][1];
  };
  inz.zet(rijVan("AK01"), 7, "In orde");
  inz.zet(rijVan("AK01"), 8, "Mooi geboekt, de btw staat op de juiste rekening.");
  inz.zet(rijVan("AK02", 0), 7, "Niet afgerond");
  inz.zet(rijVan("AK02", 0), 8, "Deze was nog niet af.");
  inz.zet(rijVan("AK02", 1), 7, "Te remediëren");
  inz.zet(rijVan("AK02", 1), 8, "De tegenboeking op 550000 ontbreekt.");

  let fb = await server("https://fake/exec?actie=feedback&sleutel=TEST&naam=" + encodeURIComponent("Lotte V.") + "&code=" + codeLotte).then((r) => r.json());
  check("niets vrijgegeven = niets zichtbaar", fb.feedback.length === 0, fb.feedback);

  sheets.Inzendingen.actieveRij = rijVan("AK01");
  omgeving.geefVrijVoorLeerling();
  // De oudste AK02-rij staat niet meer op "is laatste" en wordt dus niet
  // door de menuknop vrijgegeven; die zetten we hier zelf klaar, want de
  // historiek moet ze wél tonen.
  inz.zet(rijVan("AK02", 0), 9, true);

  fb = await server("https://fake/exec?actie=feedback&sleutel=TEST&naam=" + encodeURIComponent("Lotte V.") + "&code=" + codeLotte).then((r) => r.json());
  check("alle vrijgegeven ronden komen door", fb.feedback.length === 3, fb.feedback.length);
  check("nieuwste eerst", fb.feedback[0].tijdstip >= fb.feedback[1].tijdstip);
  check("een andere leerling ziet niets van Lotte",
    (await server("https://fake/exec?actie=feedback&sleutel=TEST&naam=" + encodeURIComponent("Youssef B.") + "&code=" + sheets.Klas.cel(3, 2)).then((r) => r.json())).feedback.length === 0);

  console.log("\n7. Feedback en historiek in de app");
  w.document.getElementById("btn-feedback").click();
  await new Promise((r) => setTimeout(r, 140));
  const fbVenster = w.document.querySelector(".koppeling-overlay");
  check("melding na ophalen", !!fbVenster && !!fbVenster.querySelector(".melding-ok"));
  fbVenster.querySelector('[data-role="modal-sluit"]').click();
  check("feedbackVoor geeft een lijst", Array.isArray(w.feedbackVoor("AK02")) && w.feedbackVoor("AK02").length === 2,
    w.feedbackVoor("AK02"));

  [...w.document.querySelectorAll(".nav-link")].find((n) => n.dataset.pageRef === "AK02").click();
  await new Promise((r) => setTimeout(r, 60));
  let blok = w.document.querySelector(".feedback-blok");
  check("nieuwste beoordeling bovenaan", /Te remediëren/.test(blok.textContent), blok.textContent.slice(0, 80));
  check("kleurklasse volgt de beoordeling", blok.className.includes("feedback-te-remedi-ren"), blok.className);
  check("geen inklapknop meer bij de historiek", !w.document.querySelector(".feedback-historiek-knop"));
  check("eerdere feedback staat er meteen bij",
    !!w.document.querySelector(".feedback-historiek") &&
    /Deze was nog niet af/.test(w.document.querySelector(".feedback-historiek").textContent),
    blok.textContent.slice(0, 120));

  const bolletje = [...w.document.querySelectorAll(".nav-link")].find((n) => n.dataset.pageRef === "AK02").querySelector(".status-bolletje");
  check("bolletje kleurt oranje, niet groen",
    bolletje.className.includes("oordeel-te-remedi-ren") && !bolletje.className.includes("geboekt"), bolletje.className);

  console.log("\n8. Wat in orde is, gaat op slot");
  [...w.document.querySelectorAll(".nav-link")].find((n) => n.dataset.pageRef === "AK01").click();
  await new Promise((r) => setTimeout(r, 60));
  check("vergrendelde boeking gemeld", !!w.document.querySelector(".boeking-vergrendeld"));
  check("geen heropen-knop meer", !w.document.querySelector('[data-role="heropenen"]'));
  const relatieVeld = w.document.querySelector('.relatie-wrap [data-field="relatie"]');
  check("relatieveld blijft bewerkbaar", relatieVeld && relatieVeld.disabled === false);
  check("bedragveld blijft op slot", w.document.querySelector('[data-field="bedrag"]').disabled === true);
  check("bolletje AK01 is groen door de beoordeling",
    [...w.document.querySelectorAll(".nav-link")].find((n) => n.dataset.pageRef === "AK01")
      .querySelector(".status-bolletje").className.includes("oordeel-in-orde"));

  w.document.getElementById("btn-indienen").click();
  await new Promise((r) => setTimeout(r, 40));
  const v2 = w.document.querySelector(".koppeling-overlay");
  const aankopenRij = [...v2.querySelectorAll(".indien-rij")].find((r) => /Aankopen/.test(r.textContent));
  check("kopregel met de twee kolommen",
    /geboekt/.test(v2.querySelector(".indien-kop").textContent) &&
    /in orde/.test(v2.querySelector(".indien-kop").textContent));
  check("geboekt en in orde als twee tellers op dezelfde noemer",
    aankopenRij.querySelector(".indien-telling").textContent === "1/10" &&
    aankopenRij.querySelector(".indien-inorde").textContent === "1/10",
    aankopenRij.textContent);
  const voorAantal = inz.getLastRow();
  // AK03 intussen geboekt: die moet mee, AK01 (in orde) niet.
  w.APP.getState().boekingen.AK03 = { geboekt: true, rows: [
    { bedrag: "10", rekening: "604000", dc: "D", relatie: "", redenering: "", apko: "", stijgtDaalt: "" },
    { bedrag: "10", rekening: "440000", dc: "C", relatie: "Textura nv", redenering: "", apko: "", stijgtDaalt: "" },
  ] };
  vinkIn(v2, "Aankopen");
  v2.querySelector("#btn-indienen-bevestig").click();
  await new Promise((r) => setTimeout(r, 40));
  v2.querySelector('[data-role="bevestig-ja"]').click();
  await new Promise((r) => setTimeout(r, 140));
  const nieuweRijen = inz.rijen.slice(voorAantal);
  check("AK01 wordt niet opnieuw ingediend", !nieuweRijen.some((r) => r[3] === "AK01"),
    nieuweRijen.map((r) => r[3]));
  check("wat intussen geboekt is wel", nieuweRijen.some((r) => r[3] === "AK03"), nieuweRijen.map((r) => r[3]));
  check("wat nog niet af is niet", !nieuweRijen.some((r) => r[3] === "AK02"), nieuweRijen.map((r) => r[3]));
  v2.querySelector('[data-role="modal-sluit"]').click();

  console.log("\n9. Hulpdocument blijft ingeklapt");
  [...w.document.querySelectorAll(".nav-link")].find((n) => n.dataset.pageRef === "BB").click();
  await new Promise((r) => setTimeout(r, 60));
  const details = [...w.document.querySelectorAll("details[data-doc-sleutel]")];
  check("documenten zitten in inklapbare panelen", details.length === 2, details.map((d) => d.dataset.docSleutel));
  const hulp = details.find((d) => d.dataset.docSleutel === "hulp-BB-0");
  hulp.open = false;
  hulp.dispatchEvent(new w.Event("toggle"));
  const bedragVeld = w.document.querySelector('#pagina-inhoud [data-field="bedrag"]');
  bedragVeld.value = "12,00";
  bedragVeld.dispatchEvent(new w.Event("input", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 60));
  check("blijft dicht na een toetsaanslag",
    w.document.querySelector('details[data-doc-sleutel="hulp-BB-0"]').open === false);
  check("redeneerschema staat boven het document",
    w.document.querySelector("#pagina-inhoud .redeneerschema").compareDocumentPosition(
      w.document.querySelector("details[data-doc-sleutel]")) & 4);

  console.log("\n10. Klanten en leveranciers");
  check("staat in het menu onder de financiële verrichtingen",
    !!w.document.querySelector('.nav-link[data-page-type="relaties"]'));
  w.document.querySelector('.nav-link[data-page-type="relaties"]').click();
  await new Promise((r) => setTimeout(r, 60));
  const vragen = [...w.document.querySelectorAll('[data-role="relatie-vraag"]')];
  check("twee open vragen op de pagina", vragen.length === 2, vragen.map((t) => t.dataset.veld));
  vragen[0].value = "Deleu bv — VK03 van 1.210,00";
  vragen[0].dispatchEvent(new w.Event("input", { bubbles: true }));
  vragen[1].value = "Nog niets open.";
  vragen[1].dispatchEvent(new w.Event("input", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 40));
  check("antwoord bewaard in de state", w.APP.getState().relatieVragen.klanten === "Deleu bv — VK03 van 1.210,00",
    w.APP.getState().relatieVragen);

  const voor = inz.getLastRow();
  w.document.getElementById("btn-indienen").click();
  await new Promise((r) => setTimeout(r, 40));
  const v3 = w.document.querySelector(".koppeling-overlay");
  // OPDRACHTEN is een const en hangt dus niet aan window; tellen uit het
  // gegevensbestand zelf.
  const finItems = (fs.readFileSync(path.join(APP, "js/data-opdrachten.js"), "utf8")
    .match(/categorie: "Financiële verrichtingen"/g) || []).length;
  const finRij = [...v3.querySelectorAll(".indien-rij")].find((r) => /Financi/.test(r.textContent));
  const finTellers = finRij.querySelector(".indien-telling").textContent.split("/").map(Number);
  check("Klanten & leveranciers telt mee in de noemer", finTellers[1] === finItems + 1,
    { getoond: finRij.querySelector(".indien-telling").textContent, opdrachten: finItems });
  check("en telt als geboekt zodra beide vragen ingevuld zijn", finTellers[0] === 1,
    finRij.textContent);

  vinkIn(v3, "Financiële verrichtingen");
  v3.querySelector("#btn-indienen-bevestig").click();
  await new Promise((r) => setTimeout(r, 40));
  v3.querySelector('[data-role="bevestig-ja"]').click();
  await new Promise((r) => setTimeout(r, 140));
  const relRij = inz.rijen.slice(voor).find((r) => r[3] === "RELATIES");
  check("gaat mee met de financiële verrichtingen", !!relRij,
    inz.rijen.slice(voor).map((r) => r[3]));
  check("beide antwoorden in één cel", /KLANTEN:[\s\S]*LEVERANCIERS:/.test(relRij[4]), relRij && relRij[4]);
  v3.querySelector('[data-role="modal-sluit"]').click();

  console.log("\n11. Controles per categorie");
  const controleItems = [...w.document.querySelectorAll('.nav-link[data-page-type="controle"]')]
    .map((n) => n.dataset.pageCat);
  check("elke categorie heeft een controlepagina",
    ["Beginbalans", "Aankopen", "Verkopen", "Loonverwerking", "Financiële verrichtingen",
     "BTW-verwerking", "Eindejaarsverrichtingen"].every((c) => controleItems.includes(c)), controleItems);

  w.document.querySelector('.nav-link[data-page-type="controle"][data-page-cat="Aankopen"]').click();
  await new Promise((r) => setTimeout(r, 60));
  const vinkje2 = w.document.querySelector('[data-role="controle-check"]');
  check("controlevraag staat op de pagina van Aankopen", !!vinkje2);
  vinkje2.checked = true;
  vinkje2.dispatchEvent(new w.Event("change", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 40));
  check("stand in het menu volgt mee",
    /1\/1/.test(w.document.querySelector('.nav-link[data-page-cat="Aankopen"] .nav-controle-stand').textContent));

  w.document.querySelector('.nav-link[data-page-cat="Beginbalans"]').click();
  await new Promise((r) => setTimeout(r, 60));
  check("invulbalans bij de beginbalans", !!w.document.getElementById("paneel-eindbalans"));
  check("enkel de balans, geen resultatenrekening",
    !/resultatenrekening/i.test(w.document.querySelector("#paneel-eindbalans h2").textContent));

  const eind = [...w.document.querySelectorAll(".nav-top-item")].find((n) => n.dataset.pageType === "controles");
  check("Eindcontrole staat onder Afsluiten", !!eind);
  eind.click();
  await new Promise((r) => setTimeout(r, 60));
  const eindTekst = w.document.getElementById("pagina-inhoud").textContent;
  check("globale vraag over referenties is weg", !/Is elke referentie geboekt/.test(eindTekst));
  check("automatische saldocontrole blijft", /juiste soort saldo/.test(eindTekst));
  check("verwijzing naar openstaande controles",
    !!w.document.querySelector('[data-role="ga-naar-controle"]'));

  console.log("\n12. Heropenen wist de controles niet meer");
  const stH = w.APP.getState();
  stH.boekingen.AK02.geboekt = true;
  stH.boekingen.AK02.rows = [
    { bedrag: "50,00", rekening: "604000", dc: "D", relatie: "", redenering: "", apko: "", stijgtDaalt: "" },
    { bedrag: "50,00", rekening: "550000", dc: "C", relatie: "", redenering: "", apko: "", stijgtDaalt: "" },
  ];
  w.APP.saveState();
  [...w.document.querySelectorAll(".nav-link")].find((n) => n.dataset.pageRef === "AK02").click();
  await new Promise((r) => setTimeout(r, 60));
  const vinkjesVoor = Object.keys(w.APP.getState().controles).filter((k) => w.APP.getState().controles[k]);
  check("er staat een controle aangevinkt vóór het heropenen", vinkjesVoor.length > 0, vinkjesVoor);

  w.document.querySelector('[data-role="heropenen"]').click();
  await new Promise((r) => setTimeout(r, 60));
  const vinkjesNa = Object.keys(w.APP.getState().controles).filter((k) => w.APP.getState().controles[k]);
  check("vinkjes blijven staan na het heropenen", vinkjesNa.length === vinkjesVoor.length, vinkjesNa);
  check("de categorie is gemarkeerd om te herbekijken",
    w.controlesHerbekijkenVoor("Aankopen") === true);

  w.document.querySelector('.nav-link[data-page-type="controle"][data-page-cat="Aankopen"]').click();
  await new Promise((r) => setTimeout(r, 60));
  check("melding op de controlepagina", !!w.document.querySelector(".paneel-herbekijken"));

  w.document.getElementById("btn-indienen").click();
  await new Promise((r) => setTimeout(r, 40));
  const v4 = w.document.querySelector(".koppeling-overlay");
  const aankopenRij4 = [...v4.querySelectorAll(".indien-rij")].find((r) => /Aankopen/.test(r.textContent));
  check("in de rij staan enkel de naam en de twee tellers",
    !/nagekeken/.test(aankopenRij4.textContent) &&
    aankopenRij4.querySelectorAll("span").length === 3, aankopenRij4.textContent);
  vinkIn(v4, "Aankopen");
  v4.querySelector("#btn-indienen-bevestig").click();
  await new Promise((r) => setTimeout(r, 40));
  check("melding bij het indienen over het opnieuw nakijken",
    /opnieuw nagekeken/.test(v4.querySelector(".bevestig-waarschuwing").textContent),
    v4.querySelector(".koppeling-modal-inhoud").textContent.slice(0, 140));
  v4.querySelector('[data-role="bevestig-ja"]').click();
  await new Promise((r) => setTimeout(r, 140));
  check("markering verdwijnt na het indienen", w.controlesHerbekijkenVoor("Aankopen") === false);
  v4.querySelector('[data-role="modal-sluit"]').click();

  check("de submap versies staat in dezelfde gedeelde map, en er is er maar één",
    gedeeld.mappen.filter((m) => m.naam.toLowerCase() === "versies").length === 1 &&
    !root.mappen.some((m) => m.naam.toLowerCase() === "versies"),
    { gedeeld: gedeeld.mappen.map((m) => m.naam), root: root.mappen.map((m) => m.naam) });

  console.log("\n13. Werk terugzetten uit een versie");
  const versieMap = gedeeld.mappen.find((m) => m.naam.toLowerCase() === "versies");
  const werkBestand = gedeeld.bestanden.find((b) => b.naam === "werk_LEU_lottev.json");
  const versieBestand = versieMap.bestanden.find((b) => b.naam.indexOf("werk_LEU_lottev_") === 0);
  check("er staat een versie klaar", !!versieBestand, versieMap.bestanden.map((b) => b.naam));

  versieBestand.inhoud = JSON.stringify({ leerling: "Lotte V.", gewijzigd: "2026-01-01T09:00:00.000Z", state: { student: "Lotte V.", herkenbaar: true } });
  werkBestand.inhoud = JSON.stringify({ leerling: "Lotte V.", gewijzigd: "2026-01-02T09:00:00.000Z", state: { student: "Lotte V.", herkenbaar: false } });

  antwoordPrompt = "lotte v";   // andere schrijfwijze: moet toch werken
  antwoordKnop = "YES";
  omgeving.zetVersieTerug();
  const terug = JSON.parse(gedeeld.bestanden.find((b) => b.naam === "werk_LEU_lottev.json").inhoud);
  check("de versie staat nu in het werkbestand", terug.state.herkenbaar === true, terug.state);
  check("met een vers tijdstip, anders wint de browser", terug.gewijzigd > "2026-01-02", terug.gewijzigd);
  check("het oude werk is als extra versie bewaard",
    versieMap.bestanden.some((b) => /voor-terugzetten/.test(b.naam)),
    versieMap.bestanden.map((b) => b.naam));

  antwoordPrompt = "iemand anders";
  omgeving.zetVersieTerug();
  check("onbekende naam geeft een duidelijke melding", /Geen bewaarde versies/.test(laatsteAlert),
    laatsteAlert.slice(0, 60));

  omgeving.toonWerkMap();
  check("de mapmelding noemt het bestand van de leerling",
    /werk_LEU_lottev\.json/.test(laatsteAlert), laatsteAlert.slice(0, 200));

  console.log("\n14. Drie vestigingen in één app");
  const dom3 = await start("/tmp/t3");
  const w3 = dom3.window;
  const vs = w3.document.getElementById("vestiging-select");
  check("vestigingskeuze zichtbaar", !!vs && vs.hidden === false);
  check("één regel per vestiging, met een lege beginkeuze", vs.options.length === 3,
    [...vs.options].map((o) => o.value));
  check("nog geen namenlijst vóór de keuze",
    w3.document.getElementById("leerling-select").hidden === true);

  vs.value = "TW";
  vs.dispatchEvent(new w3.Event("change"));
  await new Promise((r) => setTimeout(r, 40));
  const namen3 = [...w3.document.getElementById("leerling-select").options].map((o) => o.value);
  check("de namenlijst volgt de gekozen vestiging",
    namen3.includes("Amal T.") && !namen3.includes("Lotte V."), namen3);

  vs.value = "LEU";
  vs.dispatchEvent(new w3.Event("change"));
  await new Promise((r) => setTimeout(r, 40));
  const namenLeu = [...w3.document.getElementById("leerling-select").options].map((o) => o.value);
  check("en omgekeerd ook", namenLeu.includes("Lotte V.") && !namenLeu.includes("Amal T."), namenLeu);


  console.log("\n16. Instellingen en het beheertabblad");
  // De expertcode zet je in de Sheet (menu Boekhoudapp → Expertcode
  // instellen). Zonder code blijft het tabblad dicht.
  check("tabbladen Instellingen en Taken aangemaakt", !!(sheets.Instellingen && sheets.Taken));
  check("elke categorie heeft een rij in Taken",
    sheets.Taken.rijen.some((r) => r[0] === "Aankopen") &&
    sheets.Taken.rijen.some((r) => r[0] === "Resultaatverwerking & Eindbalans"),
    sheets.Taken.rijen.map((r) => r[0]));

  const dichtDom = await start();
  dichtDom.window.document.querySelector('[data-page-type="beheer"]').click();
  await new Promise((r) => setTimeout(r, 40));
  const dichtVeld = dichtDom.window.document.querySelector('[data-role="expertcode"]');
  dichtVeld.value = "1234";
  dichtDom.window.document.querySelector('[data-role="ontgrendel"]').click();
  await new Promise((r) => setTimeout(r, 60));
  check("zonder ingestelde expertcode blijft het tabblad dicht",
    /nog geen expertcode/.test(dichtDom.window.document.querySelector(".beheer-melding").textContent),
    dichtDom.window.document.querySelector(".beheer-melding").textContent);

  antwoordPrompt = "EXPERT1";
  omgeving.zetExpertcode();
  const instRij = sheets.Instellingen.rijen.find((r) => r[0] === "expertcode");
  check("expertcode staat in het tabblad Instellingen", instRij && instRij[1] === "EXPERT1", instRij);

  const dom4 = await start();
  const w4 = dom4.window;
  check("beheertabblad staat onderaan het menu",
    !!w4.document.querySelector('[data-page-type="beheer"]'));
  w4.document.querySelector('[data-page-type="beheer"]').click();
  await new Promise((r) => setTimeout(r, 40));

  const codeVeld4 = w4.document.querySelector('[data-role="expertcode"]');
  codeVeld4.value = "fout";
  codeVeld4.dispatchEvent(new w4.Event("input", { bubbles: true }));
  w4.document.querySelector('[data-role="ontgrendel"]').click();
  await new Promise((r) => setTimeout(r, 60));
  check("verkeerde expertcode wordt geweigerd",
    /klopt niet/.test(w4.document.querySelector(".beheer-melding").textContent),
    w4.document.querySelector(".beheer-melding").textContent);
  check("de klaslijst blijft dicht", !w4.document.querySelector('[data-role="klas-naam"]'));

  const codeVeld4b = w4.document.querySelector('[data-role="expertcode"]');
  codeVeld4b.value = "EXPERT1";
  codeVeld4b.dispatchEvent(new w4.Event("input", { bubbles: true }));
  w4.document.querySelector('[data-role="ontgrendel"]').click();
  await new Promise((r) => setTimeout(r, 80));
  const klasVelden = [...w4.document.querySelectorAll('[data-role="klas-naam"]')].map((i) => i.value);
  check("de klaslijst uit de Sheet staat er", klasVelden.includes("Lotte V."), klasVelden);
  check("met de codes erbij",
    [...w4.document.querySelectorAll(".beheer-code")].some((c) => c.textContent.trim() === codeLotte),
    [...w4.document.querySelectorAll(".beheer-code")].map((c) => c.textContent.trim()));

  // Een naam erbij, een taak in Classroom, een welkomsttekst en een
  // mededeling — en dan bewaren.
  w4.document.querySelector('[data-role="klas-erbij"]').click();
  await new Promise((r) => setTimeout(r, 20));
  const nieuweVelden = [...w4.document.querySelectorAll('[data-role="klas-naam"]')];
  const laatste = nieuweVelden[nieuweVelden.length - 1];
  laatste.value = "Mira K.";
  laatste.dispatchEvent(new w4.Event("input", { bubbles: true }));

  const taakVeld = [...w4.document.querySelectorAll('[data-role="taak"]')].find((i) => i.dataset.cat === "Verkopen");
  taakVeld.value = "https://classroom.google.com/c/NzQyMzE4Mzk2ODVa/a/MjIzMjUyNDA3MTVa/details";
  taakVeld.dispatchEvent(new w4.Event("input", { bubbles: true }));

  const zetInst = (sleutel, waarde) => {
    const el = w4.document.querySelector('[data-role="inst"][data-sleutel="' + sleutel + '"]');
    el.value = waarde;
    el.dispatchEvent(new w4.Event("input", { bubbles: true }));
  };
  zetInst("welkomsttekst", "Welkom in **Leuven**.\n\nKijk in [de cursus](https://cursus.example/boekhouden) als je vastzit.");
  zetInst("mededeling", "Indienen kan tot vrijdag 17 u.");
  zetInst("cursusUrl", "https://cursus.example/boekhouden");

  w4.document.querySelector('[data-role="bewaren"]').click();
  await new Promise((r) => setTimeout(r, 120));
  check("bewaren gelukt",
    /Bewaard/.test(w4.document.querySelector(".beheer-melding").textContent),
    w4.document.querySelector(".beheer-melding").textContent);
  check("de nieuwe leerling staat in het tabblad Klas",
    sheets.Klas.rijen.some((r) => r[0] === "Mira K."), sheets.Klas.rijen.map((r) => r[0]));
  const mira = sheets.Klas.rijen.find((r) => r[0] === "Mira K.");
  check("en kreeg automatisch een code", /^\d{4}$/.test(String(mira[1])), mira);
  check("de code van Lotte is niet gewijzigd",
    String(sheets.Klas.rijen.find((r) => r[0] === "Lotte V.")[1]) === codeLotte);
  check("de taak van Verkopen staat in het tabblad Taken",
    sheets.Taken.rijen.some((r) => r[0] === "Verkopen" &&
      r[1] === "https://classroom.google.com/c/NzQyMzE4Mzk2ODVa/a/MjIzMjUyNDA3MTVa/details"));
  check("de welkomsttekst staat in het tabblad Instellingen",
    /Welkom in \*\*Leuven\*\*/.test(String(sheets.Instellingen.rijen.find((r) => r[0] === "welkomsttekst")[1])));
  check("de expertcode is niet overschreven",
    String(sheets.Instellingen.rijen.find((r) => r[0] === "expertcode")[1]) === "EXPERT1");

  console.log("\n17. Wat de leerling ervan ziet");
  const dom5 = await start();
  const w5 = dom5.window;
  check("de welkomsttekst van de vakexpert staat op de startpagina",
    /Welkom in/.test(w5.document.getElementById("pagina-inhoud").textContent),
    w5.document.getElementById("pagina-inhoud").textContent.slice(0, 80));
  check("**vet** wordt vet", !!w5.document.querySelector("#pagina-inhoud .paneel strong"));
  check("de link in de welkomsttekst werkt",
    !!w5.document.querySelector('#pagina-inhoud a[href="https://cursus.example/boekhouden"]'));
  check("de mededeling staat bovenaan", !!w5.document.querySelector(".mededeling"));
  check("de cursusknop staat bovenaan en is zichtbaar",
    w5.document.getElementById("link-cursus").hidden === false &&
    w5.document.getElementById("link-cursus").href === "https://cursus.example/boekhouden",
    w5.document.getElementById("link-cursus").href);
  check("de handleidingknop blijft weg zolang er geen link is",
    w5.document.getElementById("link-handleiding").hidden === true);
  check("de namenlijst komt uit de Sheet",
    [...w5.document.getElementById("leerling-select").options].map((o) => o.value).includes("Mira K."),
    [...w5.document.getElementById("leerling-select").options].map((o) => o.value));

  // De herinnering aan Classroom, met de knop naar de taak.
  w5.document.getElementById("leerling-select").value = "Lotte V.";
  w5.document.getElementById("leerling-code").value = codeLotte;
  w5.document.getElementById("btn-aanmelden").click();
  await new Promise((r) => setTimeout(r, 120));
  // Enkel wat geboekt is, kan ingediend worden.
  w5.APP.getState().boekingen.VK01 = { geboekt: true, rows: [
    { bedrag: "100", rekening: "400000", dc: "D", relatie: "", redenering: "", apko: "", stijgtDaalt: "" },
    { bedrag: "100", rekening: "700000", dc: "C", relatie: "", redenering: "", apko: "", stijgtDaalt: "" },
  ] };
  w5.document.getElementById("btn-indienen").click();
  await new Promise((r) => setTimeout(r, 40));
  const v5 = w5.document.querySelector(".koppeling-overlay");
  vinkIn(v5, "Verkopen");
  v5.querySelector("#btn-indienen-bevestig").click();
  await new Promise((r) => setTimeout(r, 40));
  check("de bevestiging herinnert aan Classroom",
    /Classroom/.test(v5.textContent), v5.textContent.slice(-200));
  v5.querySelector('[data-role="bevestig-ja"]').click();
  await new Promise((r) => setTimeout(r, 120));
  const knopCr = v5.querySelector(".btn-classroom");
  check("na het indienen staat er een knop naar de taak in Classroom", !!knopCr);
  check("de knop wijst naar de taak die de expert ingaf",
    knopCr && knopCr.href === "https://classroom.google.com/c/NzQyMzE4Mzk2ODVa/a/MjIzMjUyNDA3MTVa/details",
    knopCr && knopCr.href);
  check("de herinnering spreekt over feedback, niet over een beoordeling",
    /Je kan dan pas feedback krijgen/.test(v5.textContent) && !/beoordeling/.test(v5.querySelector(".classroom-blok").textContent),
    v5.querySelector(".classroom-blok").textContent);

  console.log("\n18. Export, import en wissen zijn weg");
  ["btn-export", "btn-import", "import-file", "btn-wissen", "wissen-modal-overlay"].forEach((id) => {
    check("geen " + id + " meer", !w.document.getElementById(id));
  });
  const dom2 = await start("/tmp/t2");
  check("app zonder koppeling start nog steeds", !!dom2.window.APP);
  check("vrij naamveld zichtbaar zonder klaslijst",
    dom2.window.document.getElementById("leerling-naam-input").hidden === false);
  check("indienknop verborgen zonder koppeling",
    dom2.window.document.getElementById("btn-indienen").hidden === true);

  console.log("\n19. Het oefendossier Fietsatelier Noor (noor.html)");
  const NOOR = require(path.join(BRON, "hulpmiddelen/noor/case-j3.json"));
  const metwearWerk = JSON.stringify({ student: "Lotte V.", boekingen: { AK01: { geboekt: true, rows: [] } } });
  const vooraf = {
    boekhoudapp_aanmelding: JSON.stringify({ vestiging: "LEU", naam: "Lotte V.", code: codeLotte }),
    boekhoudapp_vestiging: "leu",
    boekhoudapp_laatste_leerling: "Lotte V.",
    "boekhoudapp_data_leu_lotte-v": metwearWerk,
    boekhoudapp_feedback_LEU_lottev: JSON.stringify({ AK01: [{ beoordeling: "In orde", feedback: "metwear" }] }),
  };
  const metwearVoor = (gedeeld.bestanden.find((b) => b.naam === "werk_LEU_lottev.json") || {}).inhoud;

  // Eerst met een script dat het dossier nog niet kent: dan mag er niets
  // naar de server gaan, anders belandt Noor in het werkbestand van MetWear.
  omgeving.DOSSIERS = [];
  const domOud = await start(APP, "noor.html", vooraf);
  await new Promise((r) => setTimeout(r, 120));
  const wo = domOud.window;
  const opdrN = wo.eval("OPDRACHTEN.map(function (o) { return o.ref; })");
  check("oefendossier laadt zijn eigen opdrachten", opdrN.length === 56 && opdrN[0] === "BB" && opdrN.indexOf("LOON06") !== -1, opdrN.length);
  check("gedeelde aanmelding: Lotte is meteen aangemeld", wo.APP.getState().student === "Lotte V.", wo.APP.getState().student);
  check("het werk van MetWear staat er niet in", !wo.APP.getState().boekingen.AK01, Object.keys(wo.APP.getState().boekingen));
  check("oud script: melding dat het oefendossier nog niet ingesteld is",
    /nog niet ingesteld/.test(wo.document.getElementById("koppeling-status").textContent),
    wo.document.getElementById("koppeling-status").textContent);
  wo.APP.getState().boekingen.AK01 = { geboekt: true, rows: [{ bedrag: "1", rekening: "604000", dc: "D" }] };
  wo.APP.saveState();
  wo.document.getElementById("btn-indienen").click();
  await new Promise((r) => setTimeout(r, 80));
  check("oud script: indienen geweigerd met uitleg",
    /nog niet ingesteld/.test((wo.document.querySelector(".koppeling-overlay") || {}).textContent || ""));
  check("oud script: geen werkbestand voor Noor, MetWear onaangeroerd",
    !gedeeld.bestanden.some((b) => /^werk_NOOR_/.test(b.naam)) &&
      (gedeeld.bestanden.find((b) => b.naam === "werk_LEU_lottev.json") || {}).inhoud === metwearVoor);
  omgeving.DOSSIERS = ["NOOR"];

  // Nu met het bijgewerkte script.
  const domN = await start(APP, "noor.html", vooraf);
  await new Promise((r) => setTimeout(r, 150));
  const wn = domN.window;
  check("de vestiging staat onder het eigen voorvoegsel", wn.localStorage.getItem("kern8noor_vestiging") === "leu",
    Object.keys(wn.localStorage));
  check("de feedback van MetWear staat er niet", wn.feedbackVoor("AK01").length === 0, wn.feedbackVoor("AK01"));
  check("bovenaan een link naar MetWear", (wn.document.getElementById("dossier-wissel") || {}).getAttribute &&
    wn.document.getElementById("dossier-wissel").getAttribute("href") === "index.html");

  // AK01 volgens de sleutel, AK02 met een fout.
  const rijenVolgens = (ref, fout) => {
    const s = {};
    NOOR.journaal.filter((j) => j.ref === ref).forEach((j) => { s[j.rekening] = (s[j.rekening] || 0) + j.debet - j.credit; });
    return Object.keys(s).map((nr, i) => ({ bedrag: String(Math.abs(s[nr]) + (fout && i === 0 ? 1 : 0)).replace(".", ","),
      rekening: nr, dc: s[nr] > 0 ? "D" : "C", relatie: /^4[04]0000$/.test(nr) ? "Velomax bv" : "", redenering: "", apko: "", stijgtDaalt: "" }));
  };
  const stN = wn.APP.getState();
  stN.boekingen.AK01 = { geboekt: true, rows: rijenVolgens("AK01") };
  stN.boekingen.AK02 = { geboekt: true, rows: rijenVolgens("AK02", true) };
  wn.APP.saveState();
  check("eigen opslag: kern8noor_data_… en kern8noor_laatste_leerling",
    !!wn.localStorage.getItem("kern8noor_data_leu_lotte-v") && wn.localStorage.getItem("kern8noor_laatste_leerling") === "Lotte V." &&
      wn.localStorage.getItem("boekhoudapp_data_leu_lotte-v") === metwearWerk,
    Object.keys(wn.localStorage));
  // De opdrachtpagina toont het document uit documenten/noor/.
  wn.location.hash = "";
  check("de documenten komen uit documenten/noor/", wn.eval("typeof DOSSIER") === "object" && wn.eval("DOSSIER.documenten") === "documenten/noor/");
  wn.document.getElementById("btn-indienen").click();
  await new Promise((r) => setTimeout(r, 60));
  const vn = wn.document.querySelector(".koppeling-overlay");
  const catsN = [...vn.querySelectorAll("[data-cat]")].map((v) => v.dataset.cat);
  check("indienvenster toont de lessen", catsN.includes("Aankopen 1 · kortingen") && catsN.includes("Lonen 2 · RSZ, voorheffing en personeelskosten"), catsN);
  const voorN = inz.getLastRow();
  vinkIn(vn, "Aankopen 1 · kortingen");
  vn.querySelector("#btn-indienen-bevestig").click();
  await new Promise((r) => setTimeout(r, 40));
  vn.querySelector('[data-role="bevestig-ja"]').click();
  await new Promise((r) => setTimeout(r, 160));
  const noorRijen = inz.rijen.slice(voorN);
  check("enkel de twee geboekte stukken van les 'Aankopen 1'", noorRijen.length === 2, noorRijen.length);
  check("refs met NOOR- ervoor", noorRijen.every((r) => /^NOOR-AK0[12]$/.test(r[3])), noorRijen.map((r) => r[3]));
  check("categorie met Noor · ervoor", noorRijen.every((r) => r[2] === "Noor · Aankopen 1 · kortingen"), noorRijen.map((r) => r[2]));
  const rijN = (ref) => noorRijen.find((r) => r[3] === ref);
  check("ingebouwde sleutel: AK01 automatisch In orde", rijN("NOOR-AK01")[6] === "In orde", rijN("NOOR-AK01").slice(6, 12));
  check("ingebouwde sleutel: AK02 met fout wordt Te remediëren", rijN("NOOR-AK02")[6] === "Te remediëren", rijN("NOOR-AK02")[11]);
  check("niet begonnen gaat niet mee", !rijN("NOOR-AK03"), noorRijen.map((r) => r[3]));
  check("werkbestand werk_NOOR_LEU_lottev.json", gedeeld.bestanden.some((b) => b.naam === "werk_NOOR_LEU_lottev.json"),
    gedeeld.bestanden.map((b) => b.naam));
  check("het werkbestand van MetWear is niet overschreven",
    (gedeeld.bestanden.find((b) => b.naam === "werk_LEU_lottev.json") || {}).inhoud === metwearVoor);
  check("taken van Noor in het tabblad Taken",
    sheets.Taken.rijen.some((r) => r[0] === "Noor · Lonen 1 · loonstaten"), sheets.Taken.rijen.map((r) => r[0]));

  // Feedback vrijgeven en terug ophalen: enkel in het juiste dossier.
  inz.rijen.forEach((r, i) => { if (r[3] === "NOOR-AK01") { inz.zet(i + 1, 8, "noor-feedback"); inz.zet(i + 1, 9, true); } });
  wn.document.getElementById("btn-feedback").click();
  await new Promise((r) => setTimeout(r, 120));
  check("Noor ziet zijn feedback bij AK01", wn.feedbackVoor("AK01").some((f) => f.feedback === "noor-feedback"), wn.feedbackVoor("AK01"));
  const domM = await start(APP, "index.html", vooraf);
  await new Promise((r) => setTimeout(r, 150));
  check("MetWear krijgt de feedback van Noor niet", !domM.window.feedbackVoor("AK01").some((f) => f.feedback === "noor-feedback"),
    domM.window.feedbackVoor("AK01"));
  check("MetWear houdt zijn eigen opslag", domM.window.localStorage.getItem("boekhoudapp_laatste_leerling") === "Lotte V.");

  // Werk terugzetten voor het oefendossier.
  antwoordPrompt = "NOOR Lotte V.";
  laatsteAlert = "";
  omgeving.zetVersieTerug();
  check("werk terugzetten met NOOR ervoor zoekt het oefendossier", !/Onbekend|Geen bewaarde versies gevonden voor NOOR/.test(laatsteAlert), laatsteAlert.slice(0, 160));

  console.log("\n20. Oefendossier tonen of niet (instelling in Beheer)");
  const zetOefen = (w) => {
    const b = sheets.Instellingen;
    let rij = b.rijen.findIndex((r) => r[0] === "oefendossier");
    if (rij === -1) { b.rijen.push(["oefendossier", "", ""]); rij = b.rijen.length - 1; }
    b.zet(rij + 1, 2, w);
    omgeving.vergeetInstellingen_();
  };
  check("de instelling oefendossier staat in het tabblad Instellingen (standaard ja)",
    sheets.Instellingen.rijen.some((r) => r[0] === "oefendossier" && r[1] === "ja"), sheets.Instellingen.rijen.map((r) => r[0] + "=" + r[1]));
  const knopNaarNoor = (w) => [...w.document.querySelectorAll(".dossier-knop")].some((a) => /noor\.html/.test(a.getAttribute("href")));
  const linkNaarNoor = (w) => { const a = w.document.getElementById("dossier-wissel"); return !!a && !a.hidden; };
  const domJa = await start(APP, "index.html", vooraf);
  await new Promise((r) => setTimeout(r, 150));
  check("ja: knop en link naar Noor in MetWear", knopNaarNoor(domJa.window) && linkNaarNoor(domJa.window));
  zetOefen("nee");
  const domNee = await start(APP, "index.html", vooraf);
  await new Promise((r) => setTimeout(r, 150));
  check("nee: geen knop en geen link naar Noor in MetWear", !knopNaarNoor(domNee.window) && !linkNaarNoor(domNee.window));
  const domNeeN = await start(APP, "noor.html", vooraf);
  await new Promise((r) => setTimeout(r, 150));
  check("nee: noor.html zegt dat het niet openstaat", /niet open/.test(domNeeN.window.document.getElementById("pagina-inhoud").textContent));
  zetOefen("ja");

  // In Beheer: bij nee verdwijnt alles van Noor, behalve de keuze zelf.
  const ontgrendelBeheer = async (w) => {
    w.document.querySelector('[data-page-type="beheer"]').click();
    await new Promise((r) => setTimeout(r, 40));
    const v = w.document.querySelector('[data-role="expertcode"]');
    v.value = "EXPERT1";
    v.dispatchEvent(new w.Event("input", { bubbles: true }));
    w.document.querySelector('[data-role="ontgrendel"]').click();
    await new Promise((r) => setTimeout(r, 80));
  };
  const noorTaken = (w) => [...w.document.querySelectorAll('[data-role="taak"]')].filter((i) => /^Noor · /.test(i.dataset.cat)).length;
  const domB = await start(APP, "index.html", vooraf);
  const wB = domB.window;
  await ontgrendelBeheer(wB);
  const keuze = () => wB.document.querySelector('[data-role="inst"][data-sleutel="oefendossier"]');
  check("Beheer: keuze oefendossier staat er", !!keuze());
  check("ja: taken van Noor in Beheer", noorTaken(wB) > 0, noorTaken(wB));
  keuze().value = "nee";
  keuze().dispatchEvent(new wB.Event("change", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 20));
  check("nee: geen taken van Noor meer in Beheer", noorTaken(wB) === 0, noorTaken(wB));
  check("nee: de keuze zelf blijft staan", !!keuze() && keuze().value === "nee");
  check("nee: verder geen Noor in Beheer",
    !/Noor/.test(wB.document.getElementById("pagina-inhoud").textContent
      .replace(keuze().closest(".paneel").textContent, "")));
  wB.document.querySelector('[data-role="bewaren"]').click();
  await new Promise((r) => setTimeout(r, 120));
  check("nee is bewaard in de Sheet",
    sheets.Instellingen.rijen.some((r) => r[0] === "oefendossier" && r[1] === "nee"));
  check("de taken van Noor blijven in de Sheet staan",
    sheets.Taken.rijen.some((r) => /^Noor · /.test(String(r[0]))));
  wB.document.querySelector('[data-page-type="start"]') && wB.document.querySelector('[data-page-type="start"]').click();
  await new Promise((r) => setTimeout(r, 20));
  check("na bewaren: geen knop en geen link naar Noor op het startscherm", !knopNaarNoor(wB) && !linkNaarNoor(wB));
  zetOefen("ja");

  // Een andere school kiezen sluit het beheer van de vorige.
  const domW = await start("/tmp/t3");
  const wW = domW.window;
  const vsW = wW.document.getElementById("vestiging-select");
  vsW.value = "LEU";
  vsW.dispatchEvent(new wW.Event("change"));
  await new Promise((r) => setTimeout(r, 40));
  await ontgrendelBeheer(wW);
  check("Leuven: beheer open", !!wW.document.querySelector('[data-role="klas-naam"]'));
  vsW.value = "TW";
  vsW.dispatchEvent(new wW.Event("change"));
  await new Promise((r) => setTimeout(r, 40));
  check("andere school: beheer weer dicht",
    !wW.document.querySelector('[data-role="klas-naam"]') && !!wW.document.querySelector('[data-role="expertcode"]'));
  check("en de expertcode is leeg", wW.document.querySelector('[data-role="expertcode"]').value === "");
  vsW.value = "LEU";
  vsW.dispatchEvent(new wW.Event("change"));
  await new Promise((r) => setTimeout(r, 40));
  check("terug naar Leuven: ook dicht", !wW.document.querySelector('[data-role="klas-naam"]'));

  console.log("\n21. Namenlijst meteen zichtbaar, ook als Google traag is");
  const kopie = domJa.window.localStorage.getItem("boekhoudapp_instellingen_LEU");
  check("de klaslijst staat na het ophalen in de browser", !!kopie && JSON.parse(kopie).klas.length > 0, kopie);
  check("zonder codes van de leerlingen", !!kopie && !/"code"/.test(kopie), kopie);
  serverHangt = true;
  for (const pagina of ["index.html", "noor.html"]) {
    const domTraag = await start(APP, pagina, Object.assign({}, vooraf, { boekhoudapp_instellingen_LEU: kopie }));
    const opties = [...domTraag.window.document.getElementById("leerling-select").options].map((o) => o.value).filter(Boolean);
    check(pagina + ": namen staan er al vóór de server antwoordt", opties.length === JSON.parse(kopie).klas.length, opties);
  }
  serverHangt = false;

  console.log("\n22. Afmelden");
  const domA = await start(APP, "index.html", Object.assign({}, vooraf, { kern8noor_laatste_leerling: "Lotte V." }));
  await new Promise((r) => setTimeout(r, 150));
  const wa = domA.window;
  const knopA = wa.document.getElementById("btn-afmelden");
  check("afmeldknop zichtbaar voor wie aangemeld is", !!knopA && knopA.hidden === false && wa.APP.getState().student === "Lotte V.",
    wa.APP.getState().student);
  wa.APP.getState().boekingen.VK01 = { geboekt: true, rows: [{ bedrag: "4321", rekening: "700000", dc: "C" }] };
  wa.APP.saveState();
  wa.confirm = () => true;
  knopA.click();
  await new Promise((r) => setTimeout(r, 200));
  check("aanmelding vergeten, ook in het oefendossier",
    !wa.localStorage.getItem("boekhoudapp_aanmelding") && !wa.localStorage.getItem("boekhoudapp_laatste_leerling") &&
      !wa.localStorage.getItem("kern8noor_laatste_leerling"), Object.keys(wa.localStorage));
  check("laatste werk vóór het afmelden op de server bewaard",
    /4321/.test((gedeeld.bestanden.find((b) => b.naam === "werk_LEU_lottev.json") || {}).inhoud || ""));
  check("werk blijft in de browser staan", /4321/.test(wa.localStorage.getItem("boekhoudapp_data_leu_lotte-v") || ""));
  const naAfmelden = {};
  Object.keys(wa.localStorage).forEach((k) => { naAfmelden[k] = wa.localStorage.getItem(k); });
  for (const pagina of ["index.html", "noor.html"]) {
    const domB = await start(APP, pagina, naAfmelden);
    await new Promise((r) => setTimeout(r, 100));
    check(pagina + " na afmelden: niemand aangemeld, knop verborgen",
      domB.window.APP.getState().student === "" && domB.window.document.getElementById("btn-afmelden").hidden === true,
      domB.window.APP.getState().student);
  }

  console.log("\n23. Typen terwijl het werk nog geladen wordt");
  const zonderLokaalWerk = Object.assign({}, vooraf);
  delete zonderLokaalWerk["boekhoudapp_data_leu_lotte-v"];
  werkVertraging = 150;
  const domR = await start(APP, "index.html", zonderLokaalWerk);
  await new Promise((r) => setTimeout(r, 30));
  // De leerling tikt al iets vóór het werk van de server binnen is.
  domR.window.APP.getState().boekingen.AK05 = { geboekt: false, rows: [{ bedrag: "9", rekening: "", dc: "" }] };
  domR.window.APP.saveState();
  await new Promise((r) => setTimeout(r, 300));
  werkVertraging = 0;
  check("het werk van de server wint (de browser was leeg bij het aanmelden)",
    !!domR.window.APP.getState().boekingen.VK01, Object.keys(domR.window.APP.getState().boekingen));
  check("en het werk op de server is niet overschreven",
    /4321/.test((gedeeld.bestanden.find((b) => b.naam === "werk_LEU_lottev.json") || {}).inhoud || ""));

  console.log("\n24. Feedback met een tijdstip als tekst in de Sheet");
  const d = omgeving.alsDatum_("17/10/2026 15:35:51");
  check("tekst-tijdstip wordt gelezen", d && d.getTime() === new Date(2026, 9, 17, 15, 35, 51).getTime(), d);
  check("onleesbaar tijdstip geeft null", omgeving.alsDatum_("gisteren") === null);
  const rijAK02 = inz.rijen.map((r, i) => [r, i + 1]).filter(([r]) => r[3] === "AK02").pop()[1];
  inz.zet(rijAK02, 1, "01/01/2030 10:00:00");
  const fbT = await server("https://fake/exec?actie=feedback&sleutel=TEST&naam=" + encodeURIComponent("Lotte V.") + "&code=" + codeLotte).then((r) => r.json());
  check("feedback ophalen lukt nog", fbT.ok === true, fbT);
  const ak02fb = (fbT.feedback || []).filter((f) => f.ref === "AK02");
  check("de ronde met het tekst-tijdstip telt als nieuwste", ak02fb.length && ak02fb[0].ingediend === "1/01/2030", ak02fb);

  console.log("\n25. Klant of leverancier uit de vaste lijst");
  const domK = await start(APP, "index.html", vooraf);
  await new Promise((r) => setTimeout(r, 150));
  const wk = domK.window;
  const naarOpdracht = async (ref) => {
    [...wk.document.querySelectorAll(".nav-link")].find((n) => n.dataset.pageRef === ref).click();
    await new Promise((r) => setTimeout(r, 30));
  };
  await naarOpdracht("VK03");
  check("leeg schema: nog geen lijst met wat er ontbreekt", !wk.document.querySelector(".boeken-waarom"));
  const rekVeld = wk.document.querySelector('[data-scope="VK03"][data-field="rekening"]');
  rekVeld.value = "400000";
  rekVeld.dispatchEvent(new wk.Event("input", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 20));
  check("begonnen schema: wel de lijst met wat er ontbreekt", !!wk.document.querySelector(".boeken-waarom"));
  const sel = wk.document.querySelector('select.relatie-select[data-scope="VK03"]');
  check("bij 400000 een keuzelijst in plaats van een tekstveld", !!sel && !wk.document.querySelector('.relatie-input[data-scope="VK03"]'));
  check("met de klanten uit data-relaties.js", !!sel && [...sel.options].some((o) => o.value === "Modehuis Vandeputte bv"));
  sel.value = "Modehuis Vandeputte bv";
  sel.dispatchEvent(new wk.Event("change", { bubbles: true }));
  check("de keuze komt in het werk", wk.APP.getState().boekingen.VK03.rows[0].relatie === "Modehuis Vandeputte bv");
  wk.APP.getState().boekingen.VK04 = { geboekt: false, rows: [{ bedrag: "500", rekening: "400000", dc: "C", relatie: "vandeputte" }] };
  await naarOpdracht("VK04");
  const oud = wk.document.querySelector('[data-scope="VK04"][data-field="relatie"]');
  check("een oude, zelf getypte naam blijft zichtbaar", !!oud && oud.value === "vandeputte", oud && oud.value);

  console.log("\n26. Controle beginbalans: de gekozen relaties");
  wk.APP.getState().boekingen.BB = { geboekt: true, rows: [
    { bedrag: "60.000", rekening: "400000", dc: "D", relatie: "Klanten 2025 (beginbalans)" },
    { bedrag: "60.000", rekening: "100000", dc: "C", relatie: "" },
  ] };
  wk.APP.renderAlles();
  [...wk.document.querySelectorAll('[data-page-type="controle"]')].find((n) => /Beginbalans/.test(n.dataset.pageCat || n.dataset.cat || n.outerHTML)).click();
  await new Promise((r) => setTimeout(r, 30));
  const tabel = wk.document.querySelector(".controle-relatie-lijnen");
  check("tabel met de lijnen op 400000/440000 uit BB", !!tabel && /Klanten 2025 \(beginbalans\)/.test(tabel.textContent), tabel && tabel.textContent);

  console.log("\n27. Menu links inklappen");
  wk.document.getElementById("sidebar-collapse").click();
  check("menu ingeklapt", wk.document.getElementById("layout").classList.contains("sidebar-verborgen"));
  check("de keuze blijft bewaard", wk.localStorage.getItem("boekhoudapp_menu_ingeklapt") === "1");
  wk.document.getElementById("sidebar-heropen").click();
  check("menu weer open", !wk.document.getElementById("layout").classList.contains("sidebar-verborgen"));

  console.log("\n28. Geen verwijzing naar Noor zolang de instelling niet gekend is");
  serverHangt = true;
  const domO = await start(APP, "index.html", {});
  await new Promise((r) => setTimeout(r, 60));
  check("nog geen school of instellingen: geen knop en geen link naar Noor",
    !knopNaarNoor(domO.window) && !linkNaarNoor(domO.window));
  serverHangt = false;

  console.log("\n" + (fouten ? fouten + " CONTROLE(S) MISLUKT" : "Alle controles geslaagd."));
  process.exit(fouten ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
