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
 * DE TABBLADEN
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
 *
 *   Instellingen  instelling | waarde | toelichting
 *                 De teksten en links die de app toont, en de expertcode
 *                 waarmee een vakexpert het beheertabblad in de app opent.
 *
 *   Taken         categorie | link naar de taak in Classroom | opmerking
 *                 De taak in Classroom die bij elke categorie hoort. De app
 *                 toont die link bij het indienen.
 * ---------------------------------------------------------------------------
 */

/* ==========================================================================
   Instellingen
   ========================================================================== */

// Moet exact overeenkomen met SLEUTEL in js/config-koppeling.js.
// Dit is een drempel, geen slot: de app-code is publiek leesbaar. Ze houdt
// toevallige of geautomatiseerde rommel tegen, niet iemand die het meent.
//
// LET OP bij een update: plak je een nieuwe versie van dit bestand in de
// Apps Script-editor, kijk dan altijd of dit woord nog klopt. Staat hier
// iets anders dan in js/config-koppeling.js, dan weigert het script alles
// met de melding "de app is niet juist ingesteld".
var SLEUTEL = "DEMET";

// ---------------------------------------------------------------------------
// DE VESTIGING VAN DEZE SHEET
//
// Elke vestiging heeft een eigen Sheet met een eigen kopie van dit script.
// Vul hier de code van jouw vestiging in: LEU, SKW of TW. Ze moet exact
// overeenkomen met de code in js/config-koppeling.js.
//
// De code komt vooraan in de bestandsnaam van het werkbestand
// (werk_LEU_lotte.json), zodat de drie vestigingen samen in dezelfde map
// kunnen staan zonder elkaars werk te overschrijven.
var VESTIGING = "LEU";

// De map op de gedeelde Drive waar alle werkbestanden samenkomen. Plak hier
// het ID van die map: open ze in Drive en neem het stuk van de URL na
// /folders/ (bv. 1gVbFLxA90tzH7uUYS-vBBRV1klXViwPd).
//
// Blijft dit leeg, dan maakt het script een map "Boekhoudapp werkbestanden"
// aan in de eigen Drive van het account waaronder het draait — handig om te
// testen, maar dan staat het werk van deze vestiging apart.
var MAP_ID_GEDEELD = "1gVbFLxA90tzH7uUYS-vBBRV1klXViwPd";

var BLAD_KLAS = "Klas";
var BLAD_INZENDINGEN = "Inzendingen";
var BLAD_DETAIL = "Detail";
var BLAD_INSTELLINGEN = "Instellingen";
var BLAD_TAKEN = "Taken";

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

var KOP_INSTELLINGEN = ["instelling", "waarde", "toelichting"];
var KOP_TAKEN = ["categorie", "link naar de taak in Classroom", "opmerking"];
// In kolom B hoort de volledige link uit Classroom (taak openen -> de drie
// puntjes -> Link kopiëren), dus iets als
// https://classroom.google.com/c/<klas>/a/<taak>/details

// De categorieën waarvoor er een taak in Classroom bestaat. Ze komen overeen
// met wat de leerling in het indienvenster aanvinkt. Eindbalans en
// resultaatverwerking horen samen in één taak; de rest staat apart per soort
// verrichting. Wijzigt de bundel van opbouw, dan zet je hier de nieuwe
// categorieën en draai je Boekhoudapp -> Eerste installatie opnieuw. Het
// beheertabblad in de app werkt de lijst ook zelf bij.
var TAAK_CATEGORIEEN = [
  "Beginbalans",
  "Aankopen",
  "Verkopen",
  "Loonverwerking",
  "Financiële verrichtingen",
  "BTW-verwerking",
  "Eindejaarsverrichtingen",
  "Resultaatverwerking & Eindbalans",
];

// De instellingen die de vakexpert vanuit de app kan aanpassen, met de
// toelichting die in kolom C van het tabblad Instellingen komt te staan.
// Wie liever rechtstreeks in de Sheet werkt, kan dat: de app leest gewoon
// wat er in kolom B staat.
var INSTELLINGEN_UITLEG = [
  ["expertcode", "",
    "De code waarmee een vakexpert het tabblad Beheer in de app opent. Deel ze enkel met je collega-experten. Leeg = het beheertabblad blijft dicht."],
  ["welkomsttekst", "",
    "De tekst op de startpagina van de app. Lege regel = nieuwe alinea. Een link maak je zo: [naar de cursus](https://...). Leeg = de standaardtekst van de app."],
  ["mededeling", "",
    "Korte mededeling in een gekleurd kader bovenaan elke pagina (bv. \"Indienen kan tot vrijdag 17 u\"). Leeg = geen kader."],
  ["cursusUrl", "",
    "Link naar de digitale cursus. Staat als knop Cursus bovenaan in de app, op elk tabblad."],
  ["handleidingUrl", "",
    "Link naar de handleiding voor de leerlingen. Staat als knop Handleiding bovenaan. Leeg = die knop verdwijnt."],
];

// Kolomnummers in Inzendingen (1-gebaseerd), zodat de rest leesbaar blijft.
var K_TIJDSTIP = 1, K_LEERLING = 2, K_CATEGORIE = 3, K_REF = 4, K_BOEKING = 5,
    K_STATUS_LEERLING = 6, K_BEOORDELING = 7, K_FEEDBACK = 8, K_KLAAR = 9,
    K_IS_LAATSTE = 10, K_INZENDING = 11;

// De drie beoordelingen, gelijk aan de afspraken met de collega's in
// Classroom. "In orde" heeft een bijzondere betekenis in de app: zo'n
// verrichting gaat op slot en wordt niet meer meegestuurd bij een volgende
// inzending. Wijzig die schrijfwijze dus niet zonder IN_ORDE in js/app.js
// mee aan te passen.
var BEOORDELINGEN = ["In orde", "Te remediëren", "Niet afgerond"];

var BEOORDELING_KLEUREN = {
  "In orde": "#d9ead3",        // groen
  "Te remediëren": "#fce5cd",  // oranje
  "Niet afgerond": "#f4cccc",  // rood
};

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

    // De instellingen, de taken en de namen van de klaslijst. Bewust zonder
    // aanmelding: de app heeft de namen nodig vóór de leerling aangemeld is.
    // Er gaat hier niets naar buiten dat niet toch al in de app zichtbaar is.
    if (p.actie === "instellingen") return antwoord(instellingenPubliek_());

    // Het beheertabblad in de app: enkel met de expertcode.
    if (p.actie === "beheer") return antwoord(haalBeheerOp_(p.expertcode));

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
  var lock = null;
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (data.sleutel !== SLEUTEL) return antwoord({ ok: false, fout: "sleutel" });

    /* Enkel wie in de Sheet schrijft, heeft het slot nodig: die rijen mogen
       niet door elkaar geschreven worden. Het gewone bewaren schrijft naar
       één bestand in de Drive — dat van díé leerling — en kan niemand in de
       weg zitten.

       Dat maakte het verschil: elke leerling bewaart om de twee minuten, en
       zolang het bewaren óók het slot nam, stond wie op dat moment iets in
       het beheertabblad wilde opslaan gewoon te wachten tot alle andere
       verzoeken van die minuut voorbij waren. */
    var neemSlot = function () {
      lock = LockService.getScriptLock();
      return lock.tryLock(30000);
    };

    // Het beheertabblad meldt zich met de expertcode aan en niet met een
    // leerlingnaam. Daarom vóór de gewone aanmeldcontrole.
    if (data.actie === "beheerBewaren") {
      if (!neemSlot()) return antwoord({ ok: false, fout: "te druk, probeer opnieuw" });
      return antwoord(bewaarBeheer_(data));
    }

    var check = controleerAanmelding(data.naam, data.code);
    if (!check.ok) return antwoord(check);

    if (data.actie === "bewaren") {
      return antwoord(bewaarWerk(data.naam, data.state));
    }
    if (data.actie === "indienen") {
      if (!neemSlot()) return antwoord({ ok: false, fout: "te druk, probeer opnieuw" });
      return antwoord(verwerkInzending(data));
    }
    return antwoord({ ok: false, fout: "onbekende actie" });
  } catch (err) {
    return antwoord({ ok: false, fout: String(err) });
  } finally {
    if (lock) { try { lock.releaseLock(); } catch (e2) {} }
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
 * dezelfde leerling. Zo raakt niemand werk kwijt door een tikfout.
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
  var bestandsnaam = werkBestandsnaam_(naam);
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

/**
 * De naam van het werkbestand van één leerling. De code van de vestiging
 * staat erin, zodat de drie vestigingen samen in dezelfde map op de gedeelde
 * Drive kunnen staan — ook als er in twee scholen een Lotte zit.
 */
function werkBestandsnaam_(naam) {
  return "werk_" + vestigingDeel_() + normaliseerNaam_(naam) + ".json";
}

function vestigingDeel_() {
  var v = String(VESTIGING || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return v ? v + "_" : "";
}

function haalWerkOp(naam) {
  var map = werkMap_();
  var bestanden = map.getFilesByName(werkBestandsnaam_(naam));
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
 *
 * Het uur wordt eerst in de scripteigenschappen nagekeken en pas daarna in de
 * map zelf. Anders werd bij élke bewaarbeurt — dus elke twee minuten, voor
 * elke leerling — de hele versiemap doorlopen, en die map groeit alsmaar aan.
 * Dat was het traagste stuk van het bewaren.
 */
function bewaarVersie_(naam, bestand) {
  try {
    var slug = vestigingDeel_() + normaliseerNaam_(naam);
    var props = PropertiesService.getScriptProperties();
    var sleutelLaatste = "VERSIE_" + slug;
    var laatste = Number(props.getProperty(sleutelLaatste) || 0);
    if (laatste && (new Date().getTime() - laatste) / 60000 < VERSIE_INTERVAL_MIN) return;

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
      if (minutenGeleden < VERSIE_INTERVAL_MIN) {
        props.setProperty(sleutelLaatste, String(bestaand[0].getDateCreated().getTime()));
        return;
      }
    }
    props.setProperty(sleutelLaatste, String(new Date().getTime()));
    var stempel = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmm");
    map.createFile("werk_" + slug + "_" + stempel + ".json", bestand.getBlob().getDataAsString(), MimeType.PLAIN_TEXT);

    for (var i = AANTAL_VERSIES - 1; i < bestaand.length; i++) bestaand[i].setTrashed(true);
  } catch (err) {
    // Een mislukte versiekopie mag het bewaren zelf nooit tegenhouden.
    console.error("versie bewaren mislukt: " + err);
  }
}

/**
 * De map met de werkbestanden. Staat er een ID bij MAP_ID_GEDEELD, dan is
 * dat de map op de gedeelde Drive en gebruiken alle vestigingen dezelfde.
 * Anders wordt er één aangemaakt in de eigen Drive.
 */
function werkMap_() {
  if (MAP_ID_GEDEELD) {
    try {
      return DriveApp.getFolderById(MAP_ID_GEDEELD);
    } catch (err) {
      throw new Error(
        "De gedeelde map is niet bereikbaar. Kijk het ID bij MAP_ID_GEDEELD na, " +
        "en of dit account toegang heeft tot die map. (" + err.message + ")");
    }
  }
  return map_("MAP_ID", MAP_NAAM, DriveApp.getRootFolder());
}

/**
 * De submap "versies", altijd ín de map hierboven. Bij een gedeelde map wordt
 * ze daar gezocht op naam en niet via een onthouden ID: anders zou een script
 * dat vroeger in de eigen Drive draaide de oude versiemap blijven gebruiken,
 * terwijl de werkbestanden al op de gedeelde Drive staan.
 */
function versieMap_() {
  var ouder = werkMap_();
  if (MAP_ID_GEDEELD) return submap_(ouder, MAP_VERSIES);
  return map_("MAP_VERSIES_ID", MAP_VERSIES, ouder);
}

/**
 * Zoekt een submap op naam, zonder te struikelen over hoofdletters:
 * "Versies" en "versies" zijn dezelfde map. Bestaat ze nog niet, dan wordt ze
 * aangemaakt — anders zou er stilletjes een tweede map bijkomen naast die van
 * jou.
 */
function submap_(ouder, naam) {
  var gezocht = String(naam).toLowerCase();
  var it = ouder.getFolders();
  while (it.hasNext()) {
    var m = it.next();
    if (String(m.getName()).toLowerCase() === gezocht) return m;
  }
  return ouder.createFolder(naam);
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
 *
 * Er worden bewust enkel de drie kolommen gelezen die hier nodig zijn, en er
 * wordt enkel de kolom "is laatste" teruggeschreven. Vroeger ging het hele
 * tabblad heen en weer — kolom "boeking" met haar lange teksten incluis — en
 * dat tabblad groeit het hele schooljaar aan.
 */
function markeerOudereRijen_(blad, leerling, refs, vanafRij) {
  if (vanafRij <= 2) return;
  var aantal = vanafRij - 2;
  if (aantal <= 0) return;

  var leerlingen = blad.getRange(2, K_LEERLING, aantal, 1).getValues();
  var refKolom = blad.getRange(2, K_REF, aantal, 1).getValues();
  var laatsteBereik = blad.getRange(2, K_IS_LAATSTE, aantal, 1);
  var laatste = laatsteBereik.getValues();

  var gezocht = normaliseerNaam_(leerling);
  var refSet = {};
  refs.forEach(function (r) { refSet[String(r)] = true; });

  var gewijzigd = false;
  for (var i = 0; i < aantal; i++) {
    if (laatste[i][0] !== "JA") continue;
    if (normaliseerNaam_(leerlingen[i][0]) !== gezocht) continue;
    if (!refSet[String(refKolom[i][0])]) continue;
    laatste[i][0] = "";
    gewijzigd = true;
  }
  if (gewijzigd) laatsteBereik.setValues(laatste);
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
 * Geeft alle rijen terug die jij vrijgegeven hebt (vinkje "klaar"). Zolang
 * dat vinkje uit staat, ziet de leerling niets — je kan dus gerust over
 * meerdere dagen nakijken.
 *
 * Bewust álle vrijgegeven ronden en niet enkel de laatste: de leerling moet
 * kunnen terugkijken wat er de vorige keer opgemerkt was. De app toont de
 * nieuwste bovenaan en klapt de oudere ronden in. Lang worden die lijstjes
 * niet: zodra een verrichting "In orde" is, gaat ze op slot en wordt ze niet
 * meer opnieuw ingediend.
 */
function haalFeedbackOp(naam) {
  var blad = blad_(BLAD_INZENDINGEN);
  if (blad.getLastRow() < 2) return [];
  var n = blad.getLastRow() - 1;
  // Twee smalle blokken in plaats van het hele tabblad: de kolom "boeking"
  // staat er tussenin en bevat de volledige boeking van elke leerling. Die
  // hier meelezen maakte het ophalen van feedback onnodig zwaar, en dat
  // gebeurt bij élke keer dat een leerling de app opent.
  var links = blad.getRange(2, K_TIJDSTIP, n, K_REF).getValues();          // tijdstip … ref
  var rechts = blad.getRange(2, K_BEOORDELING, n, 3).getValues();          // beoordeling, feedback, klaar
  var gezocht = normaliseerNaam_(naam);
  var uit = [];

  for (var i = 0; i < n; i++) {
    if (normaliseerNaam_(links[i][K_LEERLING - 1]) !== gezocht) continue;
    if (rechts[i][2] !== true) continue;
    var beoordeling = String(rechts[i][0] || "").trim();
    var tekst = String(rechts[i][1] || "").trim();
    if (!beoordeling && !tekst) continue;

    var tijdstip = links[i][K_TIJDSTIP - 1];
    uit.push({
      ref: String(links[i][K_REF - 1]),
      beoordeling: beoordeling,
      feedback: tekst,
      ingediend: tijdstip ? Utilities.formatDate(new Date(tijdstip), Session.getScriptTimeZone(), "d/MM/yyyy") : "",
      tijdstip: tijdstip ? new Date(tijdstip).getTime() : 0,
    });
  }

  // Nieuwste eerst; de app groepeert ze per verrichting.
  uit.sort(function (a, b) { return b.tijdstip - a.tijdstip; });
  return uit;
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
    .addItem("Expertcode instellen…", "zetExpertcode")
    .addSeparator()
    .addItem("Waar staan de werkbestanden?", "toonWerkMap")
    .addItem("Werk terugzetten uit een versie…", "zetVersieTerug")
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

  var n = blad.getLastRow() - 1;
  var waarden = blad.getRange(2, 1, n, KOP_INZENDINGEN.length).getValues();
  var gezocht = normaliseerNaam_(leerling);
  var aantal = 0;

  // De vinkjes in één blok terugschrijven. Cel per cel was één heen-en-weer
  // met Google per verrichting; bij een leerling met dertig verrichtingen
  // bleef het menu daardoor merkbaar lang hangen.
  var kolom = blad.getRange(2, K_KLAAR, n, 1);
  var vinkjes = kolom.getValues();

  for (var i = 0; i < waarden.length; i++) {
    if (normaliseerNaam_(waarden[i][K_LEERLING - 1]) !== gezocht) continue;
    if (waarden[i][K_IS_LAATSTE - 1] !== "JA") continue;
    if (waarde) {
      // Niets vrijgeven waar nog geen enkel oordeel bij staat.
      var heeftIets = String(waarden[i][K_BEOORDELING - 1] || "").trim() ||
                      String(waarden[i][K_FEEDBACK - 1] || "").trim();
      if (!heeftIets) continue;
    }
    vinkjes[i][0] = waarde;
    aantal++;
  }
  if (aantal) kolom.setValues(vinkjes);

  ui.alert(waarde
    ? aantal + " verrichting(en) van " + leerling + " staan nu klaar. Ze zijn zichtbaar zodra de leerling in de app op Feedback ophalen klikt."
    : aantal + " verrichting(en) van " + leerling + " zijn weer verborgen voor de leerling.");
}

/**
 * Zegt in welke map dit script écht schrijft, en hoeveel werkbestanden van
 * deze vestiging daar al staan. Handig na een verhuis naar een gedeelde
 * Drive: zo zie je zwart op wit of het ID bij MAP_ID_GEDEELD klopt.
 */
function toonWerkMap() {
  var ui = SpreadsheetApp.getUi();
  try {
    var map = werkMap_();
    var eigen = [], andere = 0;
    var it = map.getFiles();
    while (it.hasNext()) {
      var naam = it.next().getName();
      if (naam.indexOf("werk_") !== 0) continue;
      if (naam.indexOf("werk_" + vestigingDeel_()) === 0) eigen.push(naam);
      else andere++;
    }
    eigen.sort();

    ui.alert(
      "Vestiging van deze Sheet: " + (VESTIGING || "(niet ingevuld)") + "\n\n" +
      "Map: " + map.getName() + "\n" +
      "Adres: " + map.getUrl() + "\n" +
      (MAP_ID_GEDEELD ? "Gekozen via MAP_ID_GEDEELD." : "Automatisch aangemaakt in de eigen Drive (MAP_ID_GEDEELD is leeg).") + "\n\n" +
      "Versies komen in de submap '" + MAP_VERSIES + "' van díé map.\n\n" +
      "Werkbestanden van deze vestiging: " + eigen.length +
      (eigen.length ? "\n  " + eigen.slice(0, 15).join("\n  ") + (eigen.length > 15 ? "\n  …" : "") : "") +
      "\nVan andere vestigingen: " + andere + "\n\n" +
      "Herkent de app een bestand niet, dan staat het in de verkeerde map of heeft het niet " +
      "exact de naam werk_" + vestigingDeel_() + "<naam zonder hoofdletters, spaties en leestekens>.json");
  } catch (err) {
    ui.alert("De map is niet bereikbaar:\n\n" + err.message +
      "\n\nKijk het ID bij MAP_ID_GEDEELD na, en of dit account bewerkrechten heeft op die map.");
  }
}

/**
 * Zet de nieuwste bewaarde versie van één leerling terug als haar
 * werkbestand. Het script léést nooit uit de submap 'versies' — dat is een
 * archief — dus een bestand daar zomaar neerzetten doet niets. Deze functie
 * is de brug: ze kopieert de inhoud naar het echte werkbestand, en zet het
 * huidige werk eerst als extra versie apart.
 */
function zetVersieTerug() {
  var ui = SpreadsheetApp.getUi();
  var vraag = ui.prompt("Werk terugzetten",
    "Van welke leerling? Schrijf de naam zoals in het tabblad Klas.", ui.ButtonSet.OK_CANCEL);
  if (vraag.getSelectedButton() !== ui.Button.OK) return;
  var naam = String(vraag.getResponseText() || "").trim();
  if (!naam) return;

  var slug = vestigingDeel_() + normaliseerNaam_(naam);
  var versies = [];
  var it = versieMap_().getFiles();
  while (it.hasNext()) {
    var f = it.next();
    if (f.getName().indexOf("werk_" + slug + "_") === 0) versies.push(f);
  }
  if (!versies.length) {
    ui.alert("Geen bewaarde versies gevonden voor " + naam + ".\n\n" +
      "Er werd gezocht naar bestanden die beginnen met werk_" + slug + "_ in de submap '" +
      MAP_VERSIES + "'.");
    return;
  }
  versies.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  var nieuwste = versies[0];

  var pakket;
  try {
    pakket = JSON.parse(nieuwste.getBlob().getDataAsString());
  } catch (err) {
    ui.alert("Die versie is onleesbaar:\n\n" + nieuwste.getName());
    return;
  }
  // Vers tijdstip, anders houdt de app het (oudere) werk in de browser voor
  // het recentste en vraagt ze niets.
  pakket.gewijzigd = new Date().toISOString();
  var inhoud = JSON.stringify(pakket);

  var antwoordKnop = ui.alert("Werk terugzetten",
    "De nieuwste bewaarde versie van " + naam + " is:\n\n" + nieuwste.getName() +
    "\n\nDie wordt haar werkbestand. Wat er nu in staat, wordt eerst als extra versie weggezet.",
    ui.ButtonSet.YES_NO);
  if (antwoordKnop !== ui.Button.YES) return;

  var map = werkMap_();
  var stempel = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmm");
  var bestaande = map.getFilesByName(werkBestandsnaam_(naam));
  if (bestaande.hasNext()) {
    var huidig = bestaande.next();
    versieMap_().createFile("werk_" + slug + "_" + stempel + "-voor-terugzetten.json",
      huidig.getBlob().getDataAsString(), MimeType.PLAIN_TEXT);
    huidig.setContent(inhoud);
  } else {
    map.createFile(werkBestandsnaam_(naam), inhoud, MimeType.PLAIN_TEXT);
  }

  ui.alert("Klaar.\n\n" +
    "Laat " + naam + " zich opnieuw aanmelden in de app. De teruggezette versie is nu de " +
    "recentste, dus de app neemt ze vanzelf over.");
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
  var opmerkingen = [];

  // Elke stap apart: gaat er één mis (bv. omdat er al een filter staat),
  // dan mag de rest niet stilvallen. Bij de eerste versie stopte de
  // installatie halverwege en bleven de kleuren op de oude instelling.
  var stap = function (wat, fn) {
    try { fn(); } catch (err) { opmerkingen.push("• " + wat + ": " + err.message); }
  };

  var klas = maakBlad_(ss, BLAD_KLAS, KOP_KLAS);
  stap("breedtes tabblad Klas", function () {
    klas.setColumnWidth(1, 200).setColumnWidth(2, 80).setColumnWidth(3, 300);
    klas.getRange("B:B").setNumberFormat("@");
  });

  var inz = maakBlad_(ss, BLAD_INZENDINGEN, KOP_INZENDINGEN);
  stap("breedtes tabblad Inzendingen", function () {
    inz.setColumnWidth(K_TIJDSTIP, 130);
    inz.setColumnWidth(K_LEERLING, 140);
    inz.setColumnWidth(K_CATEGORIE, 150);
    inz.setColumnWidth(K_REF, 80);
    inz.setColumnWidth(K_BOEKING, 420);
    inz.setColumnWidth(K_STATUS_LEERLING, 110);
    inz.setColumnWidth(K_BEOORDELING, 130);
    inz.setColumnWidth(K_FEEDBACK, 380);
    // De boeking staat met één lijn per regel in de cel (704000  22.000  C).
    // Wrap én bovenaan uitlijnen, anders staat een boeking van vier lijnen
    // in het midden van een hoge rij te zweven.
    inz.getRange(2, K_BOEKING, inz.getMaxRows() - 1, 1).setWrap(true).setVerticalAlignment("top");
    inz.getRange(2, K_FEEDBACK, inz.getMaxRows() - 1, 1).setWrap(true).setVerticalAlignment("top");
  });

  // Staat er al een filter, dan blijft die gewoon staan: createFilter()
  // gooit anders een fout en dat is het niet waard.
  stap("filter", function () {
    if (!inz.getFilter()) inz.getRange(1, 1, 1, KOP_INZENDINGEN.length).createFilter();
  });

  stap("kleuren van de beoordelingen", function () { kleurBeoordelingen_(inz); });

  // De keuzelijst op alle bestaande rijen bijwerken, zodat oude rijen na een
  // update van de beoordelingen niet met de vorige lijst blijven zitten.
  stap("keuzelijst van de beoordelingen", function () {
    if (inz.getLastRow() > 1) {
      inz.getRange(2, K_BEOORDELING, inz.getLastRow() - 1, 1).setDataValidation(beoordelingValidatie_());
    }
  });

  var inst = maakBlad_(ss, BLAD_INSTELLINGEN, KOP_INSTELLINGEN);
  stap("tabblad Instellingen", function () {
    zorgVoorInstellingen_(inst);
    inst.setColumnWidth(1, 160).setColumnWidth(2, 420).setColumnWidth(3, 520);
    inst.getRange(2, 2, inst.getMaxRows() - 1, 2).setWrap(true).setVerticalAlignment("top");
    inst.getRange("B:B").setNumberFormat("@");
  });

  var taken = maakBlad_(ss, BLAD_TAKEN, KOP_TAKEN);
  stap("tabblad Taken", function () {
    zorgVoorTaken_(taken);
    taken.setColumnWidth(1, 240).setColumnWidth(2, 520).setColumnWidth(3, 300);
  });

  var det = maakBlad_(ss, BLAD_DETAIL, KOP_DETAIL);
  stap("breedtes tabblad Detail", function () {
    det.setColumnWidth(1, 130).setColumnWidth(2, 140).setColumnWidth(3, 170);
  });

  // De mappen meteen aanmaken, zodat de eerste leerling niet moet wachten.
  stap("map in Drive", function () { werkMap_(); versieMap_(); });

  SpreadsheetApp.getUi().alert(
    "Klaar.\n\n" +
    "Vestiging van deze Sheet: " + (VESTIGING || "(niet ingevuld)") + "\n" +
    "Werkbestanden komen in: " + werkMapNaam_() + "\n" +
    "Sleutelwoord van dit script: " + SLEUTEL + "\n" +
    "Vestiging en sleutelwoord moeten exact overeenkomen met wat er bij deze " +
    "vestiging staat in js/config-koppeling.js.\n\n" +
    "1. Menu Boekhoudapp → Expertcode instellen (nodig voor het beheertabblad in de app).\n" +
    "2. Vul de namen van je leerlingen in: in het tabblad Klas, of vanuit het beheertabblad in de app.\n" +
    "3. Menu Boekhoudapp → Codes genereren voor lege vakjes.\n" +
    "4. Zet in het tabblad Taken bij elke categorie de link naar de taak in Classroom.\n" +
    "5. Publiceer het script (Implementeren → Nieuwe implementatie → Web-app) " +
    "en zet de URL in js/config-koppeling.js.\n\n" +
    "Nakijken doe je in het tabblad Inzendingen: filter op 'is laatste' = JA." +
    (opmerkingen.length ? "\n\nNiet alles lukte, maar de installatie is wel doorgelopen:\n" + opmerkingen.join("\n") : "")
  );
}

// Enkel voor de melding na de installatie: de naam van de map waarin dit
// script schrijft. Lukt het niet, dan mag dat de installatie niet stoppen.
function werkMapNaam_() {
  try {
    return werkMap_().getName() + (MAP_ID_GEDEELD ? " (gedeelde map)" : " (eigen Drive)");
  } catch (err) {
    return "NIET BEREIKBAAR — kijk MAP_ID_GEDEELD na (" + err.message + ")";
  }
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
  var regels = Object.keys(BEOORDELING_KLEUREN).map(function (waarde) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(waarde)
      .setBackground(BEOORDELING_KLEUREN[waarde])
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

/* ==========================================================================
   Instellingen, taken en klaslijst

   Alles wat de vakexpert vanuit het beheertabblad in de app aanpast, staat
   in twee tabbladen van deze Sheet:

     Instellingen   instelling | waarde | toelichting
     Taken          categorie  | link naar de taak in Classroom | opmerking

   De namen van de leerlingen staan in het tabblad Klas, samen met hun code.
   De app haalt die namen hier op: sinds deze versie hoeft js/data-klas.js
   niet meer bijgehouden te worden.
   ========================================================================== */

// Zoals blad_(), maar zonder foutmelding: een Sheet die nog niet opnieuw
// geïnstalleerd is, mag de app niet doen vastlopen.
function bladOfNiets_(naam) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(naam) || null;
}

/* Het tabblad Instellingen wordt binnen één verzoek meermaals gelezen: eerst
   om de expertcode te controleren, daarna om de teksten mee te geven. Elke
   leesbeurt is een heen-en-weer met Google van een paar honderd milliseconden,
   dus het antwoord wordt onthouden zolang dít verzoek loopt. Wie schrijft,
   maakt het geheugen leeg met vergeetInstellingen_(). */
var _instellingenCache = null;

function instellingenLezen_() {
  if (_instellingenCache) return _instellingenCache;
  var uit = {};
  var blad = bladOfNiets_(BLAD_INSTELLINGEN);
  if (blad && blad.getLastRow() >= 2) {
    var rijen = blad.getRange(2, 1, blad.getLastRow() - 1, 2).getValues();
    rijen.forEach(function (r) {
      var sleutel = String(r[0] || "").trim();
      if (sleutel) uit[sleutel] = String(r[1] === null || r[1] === undefined ? "" : r[1]);
    });
  }
  _instellingenCache = uit;
  return uit;
}

function vergeetInstellingen_() { _instellingenCache = null; }

function takenLezen_() {
  var uit = [];
  var blad = bladOfNiets_(BLAD_TAKEN);
  if (!blad || blad.getLastRow() < 2) return uit;
  var rijen = blad.getRange(2, 1, blad.getLastRow() - 1, 3).getValues();
  rijen.forEach(function (r) {
    var cat = String(r[0] || "").trim();
    if (!cat) return;
    uit.push({ categorie: cat, link: String(r[1] || "").trim(), opmerking: String(r[2] || "").trim() });
  });
  return uit;
}

function klasLezen_() {
  var uit = [];
  var blad = bladOfNiets_(BLAD_KLAS);
  if (!blad || blad.getLastRow() < 2) return uit;
  var rijen = blad.getRange(2, 1, blad.getLastRow() - 1, 3).getValues();
  rijen.forEach(function (r) {
    var naam = String(r[0] || "").trim();
    if (!naam) return;
    uit.push({ naam: naam, code: String(r[1] || "").trim(), opmerking: String(r[2] || "").trim() });
  });
  return uit;
}

/**
 * Wat de app aan élke bezoeker mag geven: de teksten, de links, de taken en
 * de namen van de klaslijst. Bewust ZONDER de codes van de leerlingen en
 * zonder de expertcode — die verlaten de Sheet enkel na een geslaagde
 * controle van de expertcode.
 */
/* Enkel de instellingen die de app mag tonen. De expertcode hoort daar
   nooit bij: die blijft in de Sheet. Eén functie voor de drie plaatsen waar
   ze weggestuurd worden, zodat een nieuwe instelling niet op één plek
   vergeten kan worden. */
function publiekeInstellingen_(inst) {
  return {
    welkomsttekst: inst.welkomsttekst || "",
    mededeling: inst.mededeling || "",
    cursusUrl: inst.cursusUrl || "",
    handleidingUrl: inst.handleidingUrl || "",
  };
}

function instellingenPubliek_() {
  var inst = instellingenLezen_();
  var taken = {};
  takenLezen_().forEach(function (t) { if (t.link) taken[t.categorie] = t.link; });
  return {
    ok: true,
    vestiging: VESTIGING,
    instellingen: publiekeInstellingen_(inst),
    taken: taken,
    klas: klasLezen_().map(function (l) { return l.naam; }),
    beheerMogelijk: !!String(inst.expertcode || "").trim(),
  };
}

/**
 * De expertcode. Ze staat in het tabblad Instellingen en niet in deze code:
 * zo kan ze gewijzigd worden zonder het script opnieuw te publiceren.
 * Is er nog geen code ingevuld, dan blijft het beheertabblad dicht — anders
 * zou een lege code toegang geven.
 */
function controleerExpert_(code) {
  var juiste = String(instellingenLezen_().expertcode || "").trim();
  if (!juiste) {
    return { ok: false, fout: "geen expertcode",
      uitleg: "Er is voor deze vestiging nog geen expertcode ingesteld. Zet er een in het tabblad Instellingen van de Google Sheet (menu Boekhoudapp → Expertcode instellen)." };
  }
  if (String(code || "").trim() !== juiste) return { ok: false, fout: "expertcode" };
  return { ok: true };
}

/**
 * Alles wat de expert in het beheertabblad ziet: de instellingen, de taken
 * én de klaslijst mét de codes. Enkel na een geslaagde codecontrole.
 */
function haalBeheerOp_(code) {
  var check = controleerExpert_(code);
  if (!check.ok) return check;
  var inst = instellingenLezen_();
  return {
    ok: true,
    vestiging: VESTIGING,
    instellingen: publiekeInstellingen_(inst),
    taken: takenLezen_(),
    klas: klasLezen_(),
  };
}

/**
 * Bewaart wat de expert in het beheertabblad ingevuld heeft. De drie delen
 * gaan samen, maar elk deel wordt alleen aangeraakt als het meegestuurd is:
 * zo kan het beheertabblad later uitgebreid worden zonder dat een oudere
 * app-versie hier gegevens wist.
 *
 * Alles gaat per blok naar de Sheet en niet cel per cel. Elke losse
 * setValue is een heen-en-weer met Google; bij een klas van twintig
 * leerlingen liep dat op tot een halve minuut, en dan haakt de browser af
 * terwijl het schrijven aan deze kant gewoon doorgaat.
 *
 * De klaslijst wordt volledig herschreven met wat de app stuurt. Namen
 * zonder code krijgen er een; bestaande codes blijven ongemoeid, zodat een
 * leerling niet plots niet meer binnen raakt.
 */
function bewaarBeheer_(data) {
  var check = controleerExpert_(data && data.expertcode);
  if (!check.ok) return check;

  var gedaan = [];
  // Wat we straks teruggeven; blijft null zolang dat deel niet meegestuurd
  // was, en dan wordt het alsnog uit de Sheet gelezen.
  var nieuweTaken = null;
  var nieuweKlas = null;

  if (data.instellingen) {
    var bi = blad_(BLAD_INSTELLINGEN);
    zorgVoorInstellingen_(bi);
    var nI = Math.max(bi.getLastRow() - 1, 0);
    if (nI) {
      var bekend = {};
      INSTELLINGEN_UITLEG.forEach(function (u) { bekend[u[0]] = true; });
      var bereikI = bi.getRange(2, 1, nI, 2);
      var waardenI = bereikI.getValues();
      var iets = false;
      for (var i = 0; i < waardenI.length; i++) {
        var sleutel = String(waardenI[i][0] || "").trim();
        // De expertcode wijzigen kan enkel in de Sheet zelf: wie de code al
        // kent, mag ze niet voor iedereen anders kunnen zetten.
        if (!sleutel || sleutel === "expertcode" || !bekend[sleutel]) continue;
        if (!Object.prototype.hasOwnProperty.call(data.instellingen, sleutel)) continue;
        var nieuweWaarde = String(data.instellingen[sleutel] || "");
        if (String(waardenI[i][1]) === nieuweWaarde) continue;
        waardenI[i][1] = nieuweWaarde;
        iets = true;
      }
      if (iets) { bereikI.setValues(waardenI); vergeetInstellingen_(); }
    }
    gedaan.push("instellingen");
  }

  if (data.taken) {
    var bt = blad_(BLAD_TAKEN);
    var oudT = Math.max(bt.getLastRow() - 1, 0);
    var rijenT = [];
    data.taken.forEach(function (t) {
      var cat = String(t.categorie || "").trim();
      if (!cat) return;
      rijenT.push([cat, String(t.link || ""), String(t.opmerking || "")]);
    });
    nieuweTaken = rijenT.map(function (r) {
      return { categorie: r[0], link: r[1], opmerking: r[2] };
    });
    // Wat er vroeger meer stond, wordt in hetzelfde blok leeggemaakt.
    while (rijenT.length < oudT) rijenT.push(["", "", ""]);
    if (rijenT.length) bt.getRange(2, 1, rijenT.length, 3).setValues(rijenT);
    gedaan.push("taken");
  }

  if (data.klas) {
    var bk = blad_(BLAD_KLAS);
    var bestaand = {};
    var gebruikt = {};
    klasLezen_().forEach(function (l) {
      if (!l.code) return;
      bestaand[normaliseerNaam_(l.naam)] = l.code;
      gebruikt[l.code] = true;
    });

    var oudK = Math.max(bk.getLastRow() - 1, 0);
    var rijenK = [];
    data.klas.forEach(function (l) {
      var naam = String(l.naam || "").trim();
      if (!naam) return;
      var code = String(l.code || "").trim() || bestaand[normaliseerNaam_(naam)] || "";
      if (!code) {
        do { code = String(Math.floor(1000 + Math.random() * 9000)); } while (gebruikt[code]);
      }
      gebruikt[code] = true;
      rijenK.push([naam, code, String(l.opmerking || "")]);
    });
    var echteRijen = rijenK.length;
    nieuweKlas = rijenK.map(function (r) {
      return { naam: r[0], code: r[1], opmerking: r[2] };
    });
    while (rijenK.length < oudK) rijenK.push(["", "", ""]);
    if (rijenK.length) {
      // Codes als tekst, anders slikt Sheets een voorloopnul op.
      bk.getRange(2, 2, rijenK.length, 1).setNumberFormat("@");
      bk.getRange(2, 1, rijenK.length, 3).setValues(rijenK);
    }
    gedaan.push("klaslijst (" + echteRijen + ")");
  }

  // Zeker weten dat alles in de Sheet staat vóór we ja zeggen.
  SpreadsheetApp.flush();

  /* Alles teruggeven zoals het nu in de Sheet staat — opgebouwd uit wat we
     zopas geschreven hebben, dus zonder er nog eens voor te gaan lezen. De
     app werkt zichzelf daarmee meteen bij en hoeft geen tweede verzoek te
     doen; dat scheelde de helft van de wachttijd bij elke bewaarbeurt. */
  return {
    ok: true,
    bewaard: gedaan,
    instellingen: publiekeInstellingen_(instellingenLezen_()),
    taken: nieuweTaken !== null ? nieuweTaken : takenLezen_(),
    klas: nieuweKlas !== null ? nieuweKlas : klasLezen_(),
  };
}

/**
 * Zorgt dat elke bekende instelling een rij heeft, met haar toelichting in
 * kolom C. Bestaande waarden in kolom B blijven staan; enkel wat ontbreekt
 * komt erbij. Zo mag deze functie (en dus de installatie) altijd opnieuw
 * lopen. Er wordt enkel geschreven als er écht iets verandert — deze functie
 * loopt bij elke bewaarbeurt mee.
 */
function zorgVoorInstellingen_(blad) {
  var n = Math.max(blad.getLastRow() - 1, 0);
  var waarden = n ? blad.getRange(2, 1, n, 3).getValues() : [];
  var opRij = {};
  waarden.forEach(function (r, i) {
    var s = String(r[0] || "").trim();
    if (s) opRij[s] = i;
  });

  var iets = false;
  INSTELLINGEN_UITLEG.forEach(function (u) {
    if (opRij[u[0]] !== undefined) {
      // De toelichting wel bijwerken: die mag met de app meegroeien.
      if (String(waarden[opRij[u[0]]][2]) !== u[2]) {
        waarden[opRij[u[0]]][2] = u[2];
        iets = true;
      }
      return;
    }
    waarden.push([u[0], u[1], u[2]]);
    iets = true;
  });

  if (iets && waarden.length) {
    blad.getRange(2, 1, waarden.length, 3).setValues(waarden);
    vergeetInstellingen_();
  }
}

/**
 * Zorgt dat elke categorie een rij heeft in het tabblad Taken. Bestaande
 * links blijven staan.
 */
function zorgVoorTaken_(blad) {
  var n = Math.max(blad.getLastRow() - 1, 0);
  var waarden = n ? blad.getRange(2, 1, n, 3).getValues() : [];
  var aanwezig = {};
  waarden.forEach(function (r) {
    var s = String(r[0] || "").trim();
    if (s) aanwezig[s] = true;
  });
  var iets = false;
  TAAK_CATEGORIEEN.forEach(function (cat) {
    if (aanwezig[cat]) return;
    waarden.push([cat, "", ""]);
    iets = true;
  });
  if (iets && waarden.length) blad.getRange(2, 1, waarden.length, 3).setValues(waarden);
}

/**
 * Menu Boekhoudapp -> Expertcode instellen. Vraagt de code en zet ze in het
 * tabblad Instellingen. Dezelfde code in de drie Sheets zetten is prima:
 * elke vestiging controleert enkel haar eigen Sheet.
 */
function zetExpertcode() {
  var ui = SpreadsheetApp.getUi();
  var blad = blad_(BLAD_INSTELLINGEN);
  zorgVoorInstellingen_(blad);
  var antw = ui.prompt(
    "Expertcode",
    "Met deze code openen jij en je collega-experten het tabblad Beheer in de app.\n" +
    "Geef ze niet aan de leerlingen.\n\nHuidige code: " + (instellingenLezen_().expertcode || "(nog geen)"),
    ui.ButtonSet.OK_CANCEL);
  if (antw.getSelectedButton() !== ui.Button.OK) return;
  var code = String(antw.getResponseText() || "").trim();
  if (!code) { ui.alert("Er is niets gewijzigd: een lege code zou het beheertabblad voor iedereen openzetten."); return; }
  var rijen = blad.getRange(2, 1, blad.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < rijen.length; i++) {
    if (String(rijen[i][0] || "").trim() === "expertcode") {
      blad.getRange(i + 2, 2).setValue(code).setNumberFormat("@");
      vergeetInstellingen_();
      ui.alert("De expertcode voor " + (VESTIGING || "deze vestiging") + " staat op: " + code);
      return;
    }
  }
  ui.alert("Het tabblad Instellingen is niet in orde. Voer eerst Boekhoudapp → Eerste installatie uit.");
}
