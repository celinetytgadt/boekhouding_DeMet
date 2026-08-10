/**
 * Boekhoudapp Kern 8 — De MET
 * Serverkant: bewaren van werk, indienen ter nakijking, feedback teruggeven.
 *
 * Deze code hoort in het Apps Script-project dat vasthangt aan JOUW Google
 * Sheet (Extensies → Apps Script). Ze draait onder jouw account: leerlingen
 * loggen nergens in en krijgen zelf geen enkele toegang tot de Sheet of tot
 * de Drive-map met de werkbestanden.
 *
 * Zie HANDLEIDING-koppeling.md voor de installatie.
 *
 * ---------------------------------------------------------------------------
 * DE DRIE TABBLADEN
 *
 *   Klas          naam | code | opmerking
 *                 De namen die in de app in de keuzelijst staan, met hun
 *                 persoonlijke code. Alleen hier staan de codes — nooit in
 *                 de app-code, want die is publiek leesbaar.
 *
 *   Inzendingen   één rij per verrichting per inzending. Hier kijk je na.
 *                 Er wordt NOOIT een rij overschreven of verwijderd, zodat
 *                 je de evolutie van elke leerling kan volgen.
 *
 *   Detail        één rij per boekingslijn, voor als je wil uitpluizen wat
 *                 er precies geboekt is.
 * ---------------------------------------------------------------------------
 */

/* ==========================================================================
   Instellingen
   ========================================================================== */

// Moet exact overeenkomen met SLEUTEL in js/config-koppeling.js.
// Dit is een drempel, geen slot: de app-code is publiek leesbaar. Ze houdt
// toevallige of geautomatiseerde rommel tegen, niet iemand die het meent.
var SLEUTEL = "VERVANG-DIT-DOOR-EEN-EIGEN-WOORD";

var BLAD_KLAS = "Klas";
var BLAD_INZENDINGEN = "Inzendingen";
var BLAD_DETAIL = "Detail";

var MAP_NAAM = "Boekhoudapp werkbestanden";
var MAP_VERSIES = "versies";

// Hoeveel oudere versies van het werkbestand bewaard blijven per leerling.
var AANTAL_VERSIES = 5;
// Er wordt hoogstens één keer per zoveel minuten een extra versie weggezet.
var VERSIE_INTERVAL_MIN = 60;

var KOP_INZENDINGEN = [
  "tijdstip", "leerling", "categorie", "ref", "boeking", "status leerling",
  "beoordeling", "feedback", "klaar", "is laatste", "inzending",
];
var KOP_DETAIL = [
  "tijdstip", "leerling", "inzending", "ref", "lijn", "bedrag", "rekening",
  "omschrijving", "D/C", "relatie", "redenering", "A/P/K/O", "stijgt/daalt",
];
var KOP_KLAS = ["naam", "code", "opmerking"];

// Kolomnummers in Inzendingen (1-gebaseerd), zodat de rest leesbaar blijft.
var K_TIJDSTIP = 1, K_LEERLING = 2, K_CATEGORIE = 3, K_REF = 4, K_BOEKING = 5,
    K_STATUS_LEERLING = 6, K_BEOORDELING = 7, K_FEEDBACK = 8, K_KLAAR = 9,
    K_IS_LAATSTE = 10, K_INZENDING = 11;

var BEOORDELINGEN = ["juist", "grotendeels juist", "fout", "nog te bekijken"];

/* ==========================================================================
   Binnenkomende verzoeken
   ========================================================================== */

/**
 * De app haalt gegevens op met een GET: het bewaarde werk of de feedback.
 * GET wordt bewust gebruikt voor lezen, POST voor schrijven.
 */
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.sleutel !== SLEUTEL) return antwoord({ ok: false, fout: "sleutel" });

    if (p.actie === "ping") return antwoord({ ok: true, versie: 1 });

    if (p.actie === "aanmelden") {
      return antwoord(controleerAanmelding(p.naam, p.code));
    }

    if (p.actie === "werk") {
      var check = controleerAanmelding(p.naam, p.code);
      if (!check.ok) return antwoord(check);
      return antwoord(haalWerkOp(p.naam));
    }

    if (p.actie === "feedback") {
      var check2 = controleerAanmelding(p.naam, p.code);
      if (!check2.ok) return antwoord(check2);
      return antwoord({ ok: true, feedback: haalFeedbackOp(p.naam) });
    }

    return antwoord({ ok: false, fout: "onbekende actie" });
  } catch (err) {
    return antwoord({ ok: false, fout: String(err) });
  }
}

/**
 * De app schrijft met een POST: het werk bewaren of een inzending doen.
 *
 * De app stuurt bewust Content-Type text/plain. Bij application/json stuurt
 * de browser eerst een OPTIONS-verzoek, en daar antwoordt Apps Script niet
 * op — dan zou elke verzending stuklopen op CORS.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (data.sleutel !== SLEUTEL) return antwoord({ ok: false, fout: "sleutel" });

    var check = controleerAanmelding(data.naam, data.code);
    if (!check.ok) return antwoord(check);

    // Tot 30 seconden wachten: twintig leerlingen die tegelijk bewaren mogen
    // elkaars rijen niet door elkaar schrijven.
    if (!lock.tryLock(30000)) return antwoord({ ok: false, fout: "te druk, probeer opnieuw" });

    if (data.actie === "bewaren") {
      return antwoord(bewaarWerk(data.naam, data.state));
    }
    if (data.actie === "indienen") {
      return antwoord(verwerkInzending(data));
    }
    return antwoord({ ok: false, fout: "onbekende actie" });
  } catch (err) {
    return antwoord({ ok: false, fout: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function antwoord(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ==========================================================================
   Aanmelding
   ========================================================================== */

/**
 * Vergelijkt naam en code met het tabblad Klas. De naam wordt vergeleken
 * zonder hoofdletters, spaties en leestekens: "Lotte V." en "lotte v" zijn
 * dezelfde leerling. Zo kost een tikfout niemand haar werk.
 */
function controleerAanmelding(naam, code) {
  if (!naam) return { ok: false, fout: "geen naam" };
  var blad = blad_(BLAD_KLAS);
  var rijen = blad.getLastRow() > 1
    ? blad.getRange(2, 1, blad.getLastRow() - 1, 2).getValues()
    : [];

  // Staat er nog geen enkele naam in het tabblad Klas, dan werkt de app
  // zonder codes verder. Zo kan je testen vóór de klaslijst vastligt.
  if (!rijen.length) return { ok: true, leerling: String(naam).trim(), zonderCode: true };

  var gezocht = normaliseerNaam_(naam);
  for (var i = 0; i < rijen.length; i++) {
    if (normaliseerNaam_(rijen[i][0]) !== gezocht) continue;
    var juisteCode = String(rijen[i][1] || "").trim();
    if (!juisteCode) return { ok: true, leerling: String(rijen[i][0]).trim(), zonderCode: true };
    if (String(code || "").trim() !== juisteCode) return { ok: false, fout: "code" };
    // De schrijfwijze uit de Klas-lijst wint, zodat de Sheet netjes blijft.
    return { ok: true, leerling: String(rijen[i][0]).trim() };
  }
  return { ok: false, fout: "naam onbekend" };
}

function normaliseerNaam_(n) {
  return String(n || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/* ==========================================================================
   Werk bewaren en ophalen (Drive)
   ========================================================================== */

/**
 * Het volledige werk van een leerling als JSON-bestand in een map in jouw
 * Drive. Leerlingen hebben geen toegang tot die map: het script draait
 * onder jouw account en geeft alleen het bestand terug dat bij hun eigen
 * aanmelding hoort.
 */
function bewaarWerk(naam, stateObj) {
  if (!stateObj) return { ok: false, fout: "geen werk meegestuurd" };
  var map = werkMap_();
  var bestandsnaam = "werk_" + normaliseerNaam_(naam) + ".json";
  var inhoud = JSON.stringify({
    leerling: naam,
    gewijzigd: new Date().toISOString(),
    state: stateObj,
  });

  var bestaande = map.getFilesByName(bestandsnaam);
  if (bestaande.hasNext()) {
    var bestand = bestaande.next();
    bewaarVersie_(naam, bestand);
    bestand.setContent(inhoud);
  } else {
    map.createFile(bestandsnaam, inhoud, MimeType.PLAIN_TEXT);
  }
  return { ok: true, gewijzigd: new Date().toISOString() };
}

function haalWerkOp(naam) {
  var map = werkMap_();
  var bestanden = map.getFilesByName("werk_" + normaliseerNaam_(naam) + ".json");
  if (!bestanden.hasNext()) return { ok: true, gevonden: false };
  try {
    var pakket = JSON.parse(bestanden.next().getBlob().getDataAsString());
    return { ok: true, gevonden: true, gewijzigd: pakket.gewijzigd, state: pakket.state };
  } catch (err) {
    return { ok: false, fout: "bewaard bestand onleesbaar: " + err };
  }
}

/**
 * Zet af en toe een kopie van de vorige versie apart, zodat je werk kan
 * terugzetten als een leerling zich vergist. Hoogstens één kopie per uur,
 * en er blijven er AANTAL_VERSIES bewaard.
 */
function bewaarVersie_(naam, bestand) {
  try {
    var slug = normaliseerNaam_(naam);
    var map = versieMap_();
    var bestaand = [];
    var it = map.getFiles();
    while (it.hasNext()) {
      var f = it.next();
      if (f.getName().indexOf("werk_" + slug + "_") === 0) bestaand.push(f);
    }
    bestaand.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });

    if (bestaand.length) {
      var minutenGeleden = (new Date() - bestaand[0].getDateCreated()) / 60000;
      if (minutenGeleden < VERSIE_INTERVAL_MIN) return;
    }
    var stempel = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmm");
    map.createFile("werk_" + slug + "_" + stempel + ".json", bestand.getBlob().getDataAsString(), MimeType.PLAIN_TEXT);

    for (var i = AANTAL_VERSIES - 1; i < bestaand.length; i++) bestaand[i].setTrashed(true);
  } catch (err) {
    // Een mislukte versiekopie mag het bewaren zelf nooit tegenhouden.
    console.error("versie bewaren mislukt: " + err);
  }
}

function werkMap_() {
  return map_("MAP_ID", MAP_NAAM, DriveApp.getRootFolder());
}

function versieMap_() {
  return map_("MAP_VERSIES_ID", MAP_VERSIES, werkMap_());
}

function map_(eigenschap, naam, ouder) {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(eigenschap);
  if (id) {
    try {
      var bestaand = DriveApp.getFolderById(id);
      if (!bestaand.isTrashed()) return bestaand;
    } catch (err) { /* map verwijderd — hieronder opnieuw aanmaken */ }
  }
  var it = ouder.getFoldersByName(naam);
  var map = it.hasNext() ? it.next() : ouder.createFolder(naam);
  props.setProperty(eigenschap, map.getId());
  return map;
}

/* ==========================================================================
   Inzendingen
   ========================================================================== */

/**
 * Voegt de ingediende verrichtingen onderaan het tabblad Inzendingen toe.
 * Er wordt nooit iets overschreven; enkel de kolom "is laatste" van oudere
 * rijen van dezelfde leerling en dezelfde verrichting wordt leeggemaakt,
 * zodat je filter altijd de nieuwste versie toont.
 */
function verwerkInzending(data) {
  var items = data.items || [];
  if (!items.length) return { ok: false, fout: "niets geselecteerd" };

  var leerling = data.naam;
  var nu = new Date();
  var inzendingId = Utilities.formatDate(nu, Session.getScriptTimeZone(), "yyyyMMdd-HHmmss") +
    "-" + normaliseerNaam_(leerling).slice(0, 8);

  var blad = blad_(BLAD_INZENDINGEN);
  var eersteNieuweRij = blad.getLastRow() + 1;

  var rijen = items.map(function (it) {
    return [
      nu, leerling, it.categorie || "", it.ref || "", it.boeking || "",
      it.status || "", "", "", false, "JA", inzendingId,
    ];
  });
  blad.getRange(eersteNieuweRij, 1, rijen.length, KOP_INZENDINGEN.length).setValues(rijen);
  blad.getRange(eersteNieuweRij, K_KLAAR, rijen.length, 1).insertCheckboxes();
  blad.getRange(eersteNieuweRij, K_BEOORDELING, rijen.length, 1)
    .setDataValidation(beoordelingValidatie_());

  markeerOudereRijen_(blad, leerling, items.map(function (it) { return it.ref; }), eersteNieuweRij);
  schrijfDetail_(data, inzendingId, nu);

  return { ok: true, aantal: rijen.length, inzending: inzendingId };
}

/**
 * Zet "is laatste" leeg bij alle oudere rijen van deze leerling voor de
 * verrichtingen die nu opnieuw ingediend zijn.
 */
function markeerOudereRijen_(blad, leerling, refs, vanafRij) {
  if (vanafRij <= 2) return;
  var aantal = vanafRij - 2;
  if (aantal <= 0) return;

  var bereik = blad.getRange(2, 1, aantal, KOP_INZENDINGEN.length);
  var waarden = bereik.getValues();
  var gezocht = normaliseerNaam_(leerling);
  var refSet = {};
  refs.forEach(function (r) { refSet[String(r)] = true; });

  var gewijzigd = false;
  for (var i = 0; i < waarden.length; i++) {
    if (waarden[i][K_IS_LAATSTE - 1] !== "JA") continue;
    if (normaliseerNaam_(waarden[i][K_LEERLING - 1]) !== gezocht) continue;
    if (!refSet[String(waarden[i][K_REF - 1])]) continue;
    waarden[i][K_IS_LAATSTE - 1] = "";
    gewijzigd = true;
  }
  if (gewijzigd) bereik.setValues(waarden);
}

function schrijfDetail_(data, inzendingId, nu) {
  var lijnen = [];
  (data.items || []).forEach(function (it) {
    (it.lijnen || []).forEach(function (r, idx) {
      lijnen.push([
        nu, data.naam, inzendingId, it.ref, idx + 1,
        r.bedrag || "", r.rekening || "", r.omschrijving || "", r.dc || "",
        r.relatie || "", r.redenering || "", r.apko || "", r.stijgtDaalt || "",
      ]);
    });
  });
  if (!lijnen.length) return;
  var blad = blad_(BLAD_DETAIL);
  blad.getRange(blad.getLastRow() + 1, 1, lijnen.length, KOP_DETAIL.length).setValues(lijnen);
}

/* ==========================================================================
   Feedback teruggeven
   ========================================================================== */

/**
 * Geeft enkel de rijen terug die jij vrijgegeven hebt (vinkje "klaar") én
 * die de nieuwste zijn voor die verrichting. Zolang het vinkje uit staat,
 * ziet de leerling niets — je kan dus gerust over meerdere dagen nakijken.
 */
function haalFeedbackOp(naam) {
  var blad = blad_(BLAD_INZENDINGEN);
  if (blad.getLastRow() < 2) return [];
  var waarden = blad.getRange(2, 1, blad.getLastRow() - 1, KOP_INZENDINGEN.length).getValues();
  var gezocht = normaliseerNaam_(naam);
  var perRef = {};

  waarden.forEach(function (rij) {
    if (normaliseerNaam_(rij[K_LEERLING - 1]) !== gezocht) return;
    if (rij[K_KLAAR - 1] !== true) return;
    var beoordeling = String(rij[K_BEOORDELING - 1] || "").trim();
    var tekst = String(rij[K_FEEDBACK - 1] || "").trim();
    if (!beoordeling && !tekst) return;

    var ref = String(rij[K_REF - 1]);
    var tijdstip = rij[K_TIJDSTIP - 1];
    // Meerdere vrijgegeven versies van dezelfde verrichting: de nieuwste wint.
    if (perRef[ref] && perRef[ref]._t >= tijdstip) return;
    perRef[ref] = {
      ref: ref,
      beoordeling: beoordeling,
      feedback: tekst,
      ingediend: tijdstip ? Utilities.formatDate(new Date(tijdstip), Session.getScriptTimeZone(), "d/MM/yyyy") : "",
      _t: tijdstip,
    };
  });

  return Object.keys(perRef).map(function (ref) {
    var f = perRef[ref];
    delete f._t;
    return f;
  });
}

/* ==========================================================================
   Menu in de Sheet
   ========================================================================== */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Boekhoudapp")
    .addItem("Feedback vrijgeven voor deze leerling", "geefVrijVoorLeerling")
    .addItem("Feedback intrekken voor deze leerling", "trekInVoorLeerling")
    .addSeparator()
    .addItem("Codes genereren voor lege vakjes", "genereerCodes")
    .addSeparator()
    .addItem("Eerste installatie", "installeer")
    .addToUi();
}

/**
 * Zet het vinkje "klaar" aan bij alle nieuwste rijen van de leerling waar je
 * cursor staat. Zo hoef je niet veertig vinkjes apart aan te tikken.
 */
function geefVrijVoorLeerling() { zetKlaarVoorLeerling_(true); }
function trekInVoorLeerling() { zetKlaarVoorLeerling_(false); }

function zetKlaarVoorLeerling_(waarde) {
  var ui = SpreadsheetApp.getUi();
  var blad = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BLAD_INZENDINGEN);
  var actief = SpreadsheetApp.getActiveSheet();
  if (!blad || actief.getName() !== BLAD_INZENDINGEN) {
    ui.alert("Zet je cursor eerst op een rij in het tabblad " + BLAD_INZENDINGEN + ".");
    return;
  }
  var rij = actief.getActiveCell().getRow();
  if (rij < 2) { ui.alert("Zet je cursor op de rij van een leerling."); return; }

  var leerling = blad.getRange(rij, K_LEERLING).getValue();
  if (!leerling) { ui.alert("Op deze rij staat geen leerling."); return; }

  var waarden = blad.getRange(2, 1, blad.getLastRow() - 1, KOP_INZENDINGEN.length).getValues();
  var gezocht = normaliseerNaam_(leerling);
  var aantal = 0;

  for (var i = 0; i < waarden.length; i++) {
    if (normaliseerNaam_(waarden[i][K_LEERLING - 1]) !== gezocht) continue;
    if (waarden[i][K_IS_LAATSTE - 1] !== "JA") continue;
    if (waarde) {
      // Niets vrijgeven waar nog geen enkel oordeel bij staat.
      var heeftIets = String(waarden[i][K_BEOORDELING - 1] || "").trim() ||
                      String(waarden[i][K_FEEDBACK - 1] || "").trim();
      if (!heeftIets) continue;
    }
    blad.getRange(i + 2, K_KLAAR).setValue(waarde);
    aantal++;
  }

  ui.alert(waarde
    ? aantal + " verrichting(en) van " + leerling + " staan nu klaar. Ze ziet ze zodra ze in de app op Feedback ophalen klikt."
    : aantal + " verrichting(en) van " + leerling + " zijn weer verborgen voor de leerling.");
}

/**
 * Vult een unieke viercijferige code in bij elke leerling in het tabblad
 * Klas die er nog geen heeft. Bestaande codes blijven ongemoeid.
 */
function genereerCodes() {
  var blad = blad_(BLAD_KLAS);
  if (blad.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert("Vul eerst de namen van je leerlingen in kolom A in.");
    return;
  }
  var bereik = blad.getRange(2, 1, blad.getLastRow() - 1, 2);
  var waarden = bereik.getValues();
  var gebruikt = {};
  waarden.forEach(function (r) { if (r[1]) gebruikt[String(r[1]).trim()] = true; });

  var nieuw = 0;
  waarden.forEach(function (r) {
    if (!String(r[0] || "").trim() || String(r[1] || "").trim()) return;
    var code;
    do { code = String(Math.floor(1000 + Math.random() * 9000)); } while (gebruikt[code]);
    gebruikt[code] = true;
    r[1] = code;
    nieuw++;
  });
  bereik.setValues(waarden);
  // Als tekst opslaan, anders slikt Sheets een voorloopnul op.
  blad.getRange(2, 2, blad.getLastRow() - 1, 1).setNumberFormat("@");
  SpreadsheetApp.getUi().alert(nieuw + " nieuwe code(s) aangemaakt.");
}

/* ==========================================================================
   Installatie
   ========================================================================== */

/**
 * Maakt de drie tabbladen aan met de juiste koppen, opmaak en filter.
 * Bestaande gegevens blijven staan; deze functie mag je gerust opnieuw
 * uitvoeren.
 */
function installeer() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var klas = maakBlad_(ss, BLAD_KLAS, KOP_KLAS);
  klas.setColumnWidth(1, 200).setColumnWidth(2, 80).setColumnWidth(3, 300);
  klas.getRange("B:B").setNumberFormat("@");

  var inz = maakBlad_(ss, BLAD_INZENDINGEN, KOP_INZENDINGEN);
  inz.setColumnWidth(K_TIJDSTIP, 130);
  inz.setColumnWidth(K_LEERLING, 140);
  inz.setColumnWidth(K_CATEGORIE, 150);
  inz.setColumnWidth(K_REF, 80);
  inz.setColumnWidth(K_BOEKING, 420);
  inz.setColumnWidth(K_STATUS_LEERLING, 110);
  inz.setColumnWidth(K_BEOORDELING, 130);
  inz.setColumnWidth(K_FEEDBACK, 380);
  inz.getRange(2, K_BOEKING, inz.getMaxRows() - 1, 1).setWrap(true);
  inz.getRange(2, K_FEEDBACK, inz.getMaxRows() - 1, 1).setWrap(true);
  inz.getRange(1, 1, 1, KOP_INZENDINGEN.length).createFilter();
  kleurBeoordelingen_(inz);

  var det = maakBlad_(ss, BLAD_DETAIL, KOP_DETAIL);
  det.setColumnWidth(1, 130).setColumnWidth(2, 140).setColumnWidth(3, 170);

  // De mappen meteen aanmaken, zodat de eerste leerling niet moet wachten.
  werkMap_();
  versieMap_();

  SpreadsheetApp.getUi().alert(
    "Klaar.\n\n" +
    "1. Vul in het tabblad Klas de namen van je leerlingen in kolom A in.\n" +
    "2. Menu Boekhoudapp → Codes genereren voor lege vakjes.\n" +
    "3. Publiceer het script (Implementeren → Nieuwe implementatie → Web-app) " +
    "en zet de URL in js/config-koppeling.js.\n\n" +
    "Nakijken doe je in het tabblad Inzendingen: filter op 'is laatste' = JA."
  );
}

function maakBlad_(ss, naam, koppen) {
  var blad = ss.getSheetByName(naam) || ss.insertSheet(naam);
  blad.getRange(1, 1, 1, koppen.length).setValues([koppen])
    .setFontWeight("bold").setBackground("#e9eaf7");
  blad.setFrozenRows(1);
  return blad;
}

function beoordelingValidatie_() {
  return SpreadsheetApp.newDataValidation()
    .requireValueInList(BEOORDELINGEN, true)
    .setAllowInvalid(true)
    .build();
}

function kleurBeoordelingen_(blad) {
  var bereik = blad.getRange(2, K_BEOORDELING, blad.getMaxRows() - 1, 1);
  var kleuren = { "juist": "#d9ead3", "grotendeels juist": "#fff2cc", "fout": "#f4cccc", "nog te bekijken": "#efefef" };
  var regels = Object.keys(kleuren).map(function (waarde) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(waarde)
      .setBackground(kleuren[waarde])
      .setRanges([bereik])
      .build();
  });
  blad.setConditionalFormatRules(regels);
}

function blad_(naam) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var blad = ss.getSheetByName(naam);
  if (!blad) throw new Error("Tabblad '" + naam + "' bestaat niet. Voer eerst Boekhoudapp → Eerste installatie uit.");
  return blad;
}
