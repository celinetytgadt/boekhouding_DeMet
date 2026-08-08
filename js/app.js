// app.js — Boekhoudapp Kern 8
// Alle logica van de app. Inhoud die per jaar/bundel wijzigt staat NIET
// hier, maar in js/data-opdrachten.js, js/data-relaties.js,
// js/data-controles.js, js/data-balans.js, js/data-info.js,
// js/data-mar-indeling.js en js/mar.js (zie §9 van de specificatie).
//
// De app kent zelf geen enkel bedrag: alles wat een leerling ziet komt uit
// wat de leerling zelf intikt of uit de documentafbeeldingen.

(function () {
  "use strict";

  /* ========================================================================
     0. Kleine hulpfuncties
     ======================================================================== */

  function round2(x) {
    return Math.round((x + Number.EPSILON) * 100) / 100;
  }

  function som(lijst) {
    return round2(lijst.reduce(function (a, b) { return a + b; }, 0));
  }

  // Bedragveld: gewoon tekstveld, aanvaardt komma én punt (§9).
  function parseBedrag(input) {
    if (input === null || input === undefined) return null;
    var s = String(input).trim().replace(/\s/g, "");
    if (s === "") return null;
    var heeftKomma = s.indexOf(",") !== -1;
    var heeftPunt = s.indexOf(".") !== -1;
    if (heeftKomma && heeftPunt) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else if (heeftKomma && !heeftPunt) {
      s = s.replace(",", ".");
    } else if (!heeftKomma && heeftPunt) {
      var delen = s.split(".");
      if (delen.length > 2) {
        s = s.replace(/\./g, "");
      } else if (delen[1] && delen[1].length === 3) {
        // waarschijnlijk duizendtal, bv. "1.234"
        s = s.replace(/\./g, "");
      }
      // anders: punt blijft decimaalteken
    }
    var num = parseFloat(s);
    return isNaN(num) ? null : num;
  }

  // Bedragen zonder overbodige ",00": in deze bundel wordt met hele euro's
  // gewerkt, en "1.250,00" leest trager dan "1.250". Komt er toch een bedrag
  // met centen voor, dan worden de twee decimalen wél getoond — anders zou
  // er informatie verloren gaan.
  function formatBedrag(num) {
    if (num === null || num === undefined || isNaN(num)) return "";
    var heelGetal = Math.abs(num - Math.round(num)) < 0.005;
    var decimalen = heelGetal ? 0 : 2;
    try {
      return new Intl.NumberFormat("nl-BE", {
        minimumFractionDigits: decimalen,
        maximumFractionDigits: decimalen,
      }).format(heelGetal ? Math.round(num) : num);
    } catch (e) {
      return heelGetal ? String(Math.round(num)) : num.toFixed(2).replace(".", ",");
    }
  }

  function escapeAttr(str) {
    return String(str === undefined || str === null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function slug(str) {
    return String(str || "onbekend")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "onbekend";
  }

  function marBij(nrIets) {
    if (nrIets === undefined || nrIets === null || String(nrIets).trim() === "") return null;
    var n = parseInt(String(nrIets).trim(), 10);
    if (isNaN(n)) return null;
    var gevonden = null;
    for (var i = 0; i < MAR.length; i++) {
      if (MAR[i].nr === n) { gevonden = MAR[i]; break; }
    }
    return gevonden;
  }

  // De omschrijving van een rubriek uit js/data-mar-indeling.js, bv. "22" →
  // "Terreinen & gebouwen". Nodig voor de kaartjes van de eindbalans.
  function rubriekOms(rubriek) {
    for (var i = 0; i < MAR_INDELING.length; i++) {
      var rr = MAR_INDELING[i].rubrieken;
      for (var j = 0; j < rr.length; j++) {
        if (rr[j].rubriek === rubriek) return rr[j].oms;
      }
    }
    return "rubriek " + rubriek;
  }

  /* ========================================================================
     1. State: aanmaken, laden, bewaren
     ======================================================================== */

  var LAATSTE_LEERLING_KEY = "boekhoudapp_laatste_leerling";
  function storageKeyVoor(student) { return "boekhoudapp_data_" + slug(student); }

  function maakLegeRij() {
    return { bedrag: "", redenering: "", apko: "", stijgtDaalt: "", rekening: "", dc: "", relatie: "" };
  }

  function maakLegeState(student) {
    return {
      student: student || "",
      boekingen: {},
      controles: {},
      resultaat: {
        stap: { opbrengsten: "", kosten: "", winst: "", belasting: "", restwinst: "" },
        slotcontroleResultaat: false,
        slotcontroleBalans: false,
        slotcontroleMelding: null,
      },
      eindbalans: {},
    };
  }

  var state = maakLegeState("");
  var laatstBewaardOm = null;

  // Vult ontbrekende onderdelen aan en zet oud werk om naar de huidige
  // structuur. Zo blijft een export van vorige week gewoon werken.
  function normaliseerState(s, naam) {
    if (!s || typeof s !== "object") s = maakLegeState(naam);
    s.student = naam !== undefined ? naam : (s.student || "");
    if (!s.boekingen) s.boekingen = {};
    if (!s.controles) s.controles = {};
    if (!s.eindbalans) s.eindbalans = {};
    if (!s.resultaat) s.resultaat = maakLegeState("").resultaat;
    if (!s.resultaat.stap) s.resultaat.stap = maakLegeState("").resultaat.stap;

    // De referentie van de beginbalans heette vroeger BEGINBALANS en is nu
    // BB (te breed in de T-rekeningen). Werk van vóór die wijziging mag
    // daardoor niet verloren gaan.
    if (s.boekingen.BEGINBALANS && !s.boekingen.BB) {
      s.boekingen.BB = s.boekingen.BEGINBALANS;
    }
    delete s.boekingen.BEGINBALANS;

    // De eindbalans werkte eerst met losse rekeningnummers en nu met
    // rubrieken. Oude sleutels (zes cijfers) zeggen niets meer en worden
    // opgeruimd, anders blijft er onzichtbaar rommel in het bewaarde werk.
    Object.keys(s.eindbalans).forEach(function (sleutel) {
      if (String(sleutel).length > 2) delete s.eindbalans[sleutel];
    });

    // Een relatie (klant/leverancier) hoort enkel bij 400000 en 440000.
    // Stond er ooit een naam bij een rij die intussen een ander
    // rekeningnummer kreeg, dan blijft die anders onzichtbaar meeslepen.
    Object.keys(s.boekingen).forEach(function (ref) {
      var b = s.boekingen[ref];
      if (!b || !b.rows) return;
      b.rows.forEach(function (row) {
        if (row.relatie && !relatieVeldVoorRekening(row.rekening)) row.relatie = "";
      });
    });
    return s;
  }

  function boekingVoor(ref) {
    if (!state.boekingen[ref]) {
      state.boekingen[ref] = { rows: [maakLegeRij()], geboekt: false };
    }
    return state.boekingen[ref];
  }

  function saveState() {
    if (!state.student) return;
    try {
      localStorage.setItem(storageKeyVoor(state.student), JSON.stringify(state));
      localStorage.setItem(LAATSTE_LEERLING_KEY, state.student);
      laatstBewaardOm = new Date();
    } catch (e) {
      console.error("Kon niet bewaren:", e);
    }
    updateOpslaanStatus();
  }

  function laadStudent(naam) {
    var key = storageKeyVoor(naam);
    var opgeslagen = null;
    try {
      var ruw = localStorage.getItem(key);
      if (ruw) opgeslagen = JSON.parse(ruw);
    } catch (e) { console.error(e); }
    state = normaliseerState(opgeslagen || maakLegeState(naam), naam);
  }

  function updateOpslaanStatus() {
    var el = document.getElementById("opslaan-status");
    if (!el) return;
    if (!state.student) {
      el.textContent = "niet bewaard — vul je naam in";
    } else if (laatstBewaardOm) {
      var u = laatstBewaardOm;
      var pad = function (n) { return (n < 10 ? "0" : "") + n; };
      el.textContent = "bewaard om " + pad(u.getHours()) + ":" + pad(u.getMinutes());
    } else {
      el.textContent = "";
    }
  }

  /* ========================================================================
     2. Tijdelijke UI-state (niet bewaard)
     ======================================================================== */

  var uiState = {
    huidigePagina: { type: "start" },
    tpanelZoek: "",
    tpanelDetail: true,
    tpanelToonLeeg: false,     // standaard: enkel rekeningen met boekingen
    tpanelApko: "",
    tpanelKlasse: "",
    tpanelRubriek: "",
    relatieKeuze: { klanten: "", leveranciers: "" },
    gekozenKaarten: [],        // eindbalans: aangetikte rubrieken
  };
  var docImgTeller = 0;

  // MAR-zoekpopup (losstaand van de rest, zie §"Redeneerschema-component")
  var marModal = { open: false, scope: null, row: null, zoek: "", apko: "", klasse: "", rubriek: "" };

  /* ========================================================================
     3. Grootboek opbouwen uit alle geboekte boekingen
     ======================================================================== */

  function berekenGrootboek() {
    var gb = {};
    OPDRACHTEN.forEach(function (o) {
      var b = state.boekingen[o.ref];
      if (!b || !b.geboekt) return;
      b.rows.forEach(function (row) {
        var bedrag = parseBedrag(row.bedrag);
        if (bedrag === null || !row.rekening || !row.dc) return;
        var mar = marBij(row.rekening);
        if (!mar) return;
        var nr = String(mar.nr);
        if (!gb[nr]) gb[nr] = { D: [], C: [] };
        gb[nr][row.dc].push({ bedrag: bedrag, ref: o.ref });
      });
    });
    return gb;
  }

  function saldoVoorEntry(entry) {
    var totalD = som(entry.D.map(function (e) { return e.bedrag; }));
    var totalC = som(entry.C.map(function (e) { return e.bedrag; }));
    var saldo = round2(totalD - totalC);
    var kant = null;
    if (Math.abs(saldo) > 0.005) kant = saldo > 0 ? "D" : "C";
    return { totalD: totalD, totalC: totalC, saldo: Math.abs(saldo), kant: kant };
  }

  // Wat ontbreekt er nog aan deze rij? Vroeger bleef de knop Boeken gewoon
  // grijs met een algemene boodschap, waardoor een half ingevulde rij (of een
  // rekeningnummer dat niet in het MAR bestaat) moeilijk terug te vinden was.
  //
  // Verplicht zijn enkel bedrag, rekeningnummer en D/C. De kolommen
  // A/P/K/O en Stijgt/daalt zijn denkhulp: de leerling mag ze invullen, maar
  // de app rekent er niet op en controleert ze niet.
  function ontbreektInRij(row) {
    var mist = [];
    var bedrag = parseBedrag(row.bedrag);
    if (bedrag === null) mist.push("bedrag");
    else if (bedrag <= 0) mist.push("bedrag groter dan 0");
    if (!row.rekening) mist.push("rekeningnummer");
    else if (!marBij(row.rekening)) mist.push("bestaand rekeningnummer (" + row.rekening + " staat niet in het MAR)");
    if (row.dc !== "D" && row.dc !== "C") mist.push("debet of credit");
    return mist;
  }

  function rijLeeg(row) {
    return !row.bedrag && !row.redenering && !row.rekening && !row.dc && !row.apko && !row.stijgtDaalt;
  }

  function rijGeldig(row) {
    return ontbreektInRij(row).length === 0;
  }

  function berekenTotalen(rows) {
    var totaalDebet = 0, totaalCredit = 0;
    rows.forEach(function (row) {
      var bedrag = parseBedrag(row.bedrag);
      if (bedrag === null) return;
      if (row.dc === "D") totaalDebet += bedrag;
      else if (row.dc === "C") totaalCredit += bedrag;
    });
    return { totaalDebet: round2(totaalDebet), totaalCredit: round2(totaalCredit) };
  }

  function boekingKlaarOmTeBoeken(rows) {
    if (!rows.length) return false;
    if (!rows.every(rijGeldig)) return false;
    var t = berekenTotalen(rows);
    return t.totaalDebet > 0 && Math.abs(t.totaalDebet - t.totaalCredit) < 0.005;
  }

  /* ========================================================================
     4. Controles (§7)
     ======================================================================== */

  // Aan welke kant hoort het saldo van deze rekening te staan?
  // Uitzonderingen (contrarekeningen zoals retours en handelskortingen) staan
  // in data-controles.js, zodat dit per bundel bij te sturen is.
  function verwachteKant(mar) {
    if (!mar) return null;
    var nr = String(mar.nr);
    if (typeof SALDO_GEEN_CONTROLE !== "undefined" && SALDO_GEEN_CONTROLE.indexOf(nr) !== -1) return null;
    if (typeof SALDO_UITZONDERINGEN !== "undefined" && SALDO_UITZONDERINGEN[nr]) return SALDO_UITZONDERINGEN[nr];
    var contraAfschrijving = /9$/.test(nr);
    if (mar.apko === "A") return contraAfschrijving ? "C" : "D";
    if (mar.apko === "P") return "C";
    if (mar.apko === "K") return "D";
    if (mar.apko === "O") return "C";
    return null;
  }

  // Welk document hoort bij een controle? Staat er niets vast in
  // CONTROLE_CONFIG, dan nemen we het laatste document van die soort uit
  // data-opdrachten.js — zo staat er nooit een verouderd afschrift.
  function laatsteDocumentMet(prefix) {
    var kandidaten = OPDRACHTEN.filter(function (o) {
      return o.doc && String(o.ref).indexOf(prefix) === 0;
    }).map(function (o) { return o.doc; });
    if (!kandidaten.length) return null;
    kandidaten.sort();
    return kandidaten[kandidaten.length - 1];
  }

  function documentVoorControle(c) {
    if (c.doc) return c.doc;
    if (!c.docConfig) return null;
    var vast = CONTROLE_CONFIG[c.docConfig];
    if (vast) {
      var opdracht = null;
      for (var i = 0; i < OPDRACHTEN.length; i++) {
        if (OPDRACHTEN[i].ref === vast) { opdracht = OPDRACHTEN[i]; break; }
      }
      return opdracht && opdracht.doc ? opdracht.doc : vast;
    }
    if (c.docConfig === "laatsteBankRef") return laatsteDocumentMet("BANK");
    if (c.docConfig === "laatsteKasRef") return laatsteDocumentMet("KAS");
    return null;
  }

  function controleReferenties() {
    var gb = state.boekingen;
    var ontbrekend = OPDRACHTEN
      .filter(function (o) { return o.ref !== "BELASTING" && o.ref !== "RESULTAAT"; })
      .filter(function (o) { return !(gb[o.ref] && gb[o.ref].geboekt); })
      .map(function (o) { return o.ref; });
    return { ok: ontbrekend.length === 0, ontbrekend: ontbrekend };
  }

  function controleSaldoSoort() {
    var gb = berekenGrootboek();
    var fouten = [];
    Object.keys(gb).forEach(function (nr) {
      var mar = marBij(nr);
      if (!mar) return;
      var s = saldoVoorEntry(gb[nr]);
      if (!s.kant) return;
      var verwacht = verwachteKant(mar);
      if (verwacht && verwacht !== s.kant) {
        fouten.push({ nr: nr, naam: mar.naam, verwacht: verwacht, actueel: s.kant });
      }
    });
    return { ok: fouten.length === 0, fouten: fouten };
  }

  function controleHandmatigOk() {
    return HANDMATIGE_CONTROLES.every(function (c) { return !!state.controles[c.id]; });
  }

  function alleControlesOk() {
    return controleReferenties().ok && controleSaldoSoort().ok && controleHandmatigOk();
  }

  /* ========================================================================
     5. Documentafbeelding (zoekt zelf .png / .jpg, §5)
     ======================================================================== */

  window.handleDocFout = function (img) {
    if (img.dataset.stap === "0") {
      img.dataset.stap = "1";
      img.src = "documenten/" + img.dataset.doc + ".jpg";
    } else {
      img.style.display = "none";
      var missing = document.getElementById(img.dataset.missingId);
      if (missing) missing.style.display = "block";
    }
  };

  /* Klikken op een document opent het schermvullend. Sluiten met een klik of Esc.
     De overlay wordt pas aangemaakt bij de eerste klik en daarna hergebruikt. */
  var docOverlay = null;

  function maakDocOverlay() {
    var overlay = document.createElement("div");
    overlay.className = "document-overlay";
    overlay.innerHTML =
      '<img class="document-overlay-beeld" alt="">' +
      '<button type="button" class="document-overlay-sluiten" ' +
      'aria-label="Sluiten">&times;</button>';
    overlay.addEventListener("click", sluitDocOverlay);
    document.body.appendChild(overlay);
    return overlay;
  }

  function sluitDocOverlay() {
    if (docOverlay) docOverlay.classList.remove("open");
  }

  window.vergrootDoc = function (img) {
    if (img.style.display === "none") return;
    if (!docOverlay) docOverlay = maakDocOverlay();
    var groot = docOverlay.querySelector(".document-overlay-beeld");
    groot.src = img.src;
    groot.alt = img.alt;
    docOverlay.classList.add("open");
  };

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") sluitDocOverlay();
  });

  function htmlDocumentAfbeelding(doc, klein) {
    if (!doc) return '<div class="document-ontbreekt">Geen document ingesteld voor deze controle.</div>';
    docImgTeller++;
    var missingId = "missing-" + slug(doc) + "-" + docImgTeller;
    var klasse = klein ? "document-klein" : "document-afbeelding";
    return (
      '<img class="' + klasse + '" src="documenten/' + escapeAttr(doc) + '.png" ' +
      'data-doc="' + escapeAttr(doc) + '" data-stap="0" data-missing-id="' + missingId + '" ' +
      'onerror="handleDocFout(this)" onclick="vergrootDoc(this)" ' +
      'title="Klik om het document schermvullend te openen" ' +
      'alt="Verantwoordingsstuk ' + escapeAttr(doc) + '">' +
      '<div class="document-ontbreekt" id="' + missingId + '" style="display:none">' +
      "Document niet gevonden: documenten/" + escapeAttr(doc) + ".png (of .jpg)</div>"
    );
  }

  /* ========================================================================
     5b. Uitlegballonnetjes (i-icoontje)
     ======================================================================== */

  function htmlInfoKnop(sleutel, titelTekst) {
    if (typeof INFO_TEKSTEN === "undefined" || !INFO_TEKSTEN[sleutel]) return "";
    return '<button type="button" class="btn-info" data-role="info" data-info="' + escapeAttr(sleutel) + '" ' +
      'title="' + escapeAttr(titelTekst || "Uitleg") + '" aria-label="Uitleg">i</button>';
  }

  function openInfoModal(sleutel) {
    var info = (typeof INFO_TEKSTEN !== "undefined") ? INFO_TEKSTEN[sleutel] : null;
    if (!info) return;
    document.getElementById("info-modal-titel").textContent = info.titel;
    var html = "";
    var inLijst = false;
    info.regels.forEach(function (r) {
      if (typeof r === "string") {
        if (inLijst) { html += "</ol>"; inLijst = false; }
        html += "<p>" + escapeAttr(r) + "</p>";
      } else if (r.kop) {
        if (inLijst) { html += "</ol>"; inLijst = false; }
        html += "<h3>" + escapeAttr(r.kop) + "</h3>";
      } else if (r.stap) {
        if (!inLijst) { html += "<ol>"; inLijst = true; }
        html += "<li>" + escapeAttr(r.stap) + "</li>";
      }
    });
    if (inLijst) html += "</ol>";
    document.getElementById("info-modal-inhoud").innerHTML = html;
    document.getElementById("info-modal-overlay").hidden = false;
  }

  function sluitInfoModal() {
    document.getElementById("info-modal-overlay").hidden = true;
  }

  /* ========================================================================
     6. Redeneerschema-component (herbruikt voor elke opdracht + BELASTING/RESULTAAT)
     ======================================================================== */

  function focusId(ref, rowIdx, veld) { return ref + "__r" + rowIdx + "__" + veld; }

  function relatieVeldVoorRekening(rekening) {
    var mar = marBij(rekening);
    if (!mar) return null;
    var nr = String(mar.nr);
    if (nr === "400000") return "klanten";
    if (nr === "440000") return "leveranciers";
    return null;
  }

  var ICOON_PRULLENBAK =
    '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M9 3h6a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1v12a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7H4a1 1 0 0 1 0-2h4V4a1 1 0 0 1 1-1zm1 2h4V5h-4zM7 7v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7zm3 3a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1z"/>' +
    "</svg>";

  function htmlRedeneerschemaRij(ref, row, idx, geboekt) {
    var mar = marBij(row.rekening);
    var omschrijving = mar ? mar.naam : (row.rekening ? "— dit nummer staat niet in het MAR —" : "");
    var relatieSoort = relatieVeldVoorRekening(row.rekening);
    var rekeningFocusId = focusId(ref, idx, "rekening");
    var mist = geboekt ? [] : ontbreektInRij(row);
    var leeg = rijLeeg(row);
    var rijKlasse = (!geboekt && mist.length && !leeg) ? ' class="rij-onvolledig"' : "";

    var relatieHtml = "";
    if (relatieSoort) {
      var datalistId = relatieSoort === "klanten" ? "datalist-klanten" : "datalist-leveranciers";
      relatieHtml =
        '<input type="text" class="relatie-input" list="' + datalistId + '" ' +
        'placeholder="' + (relatieSoort === "klanten" ? "naam klant…" : "naam leverancier…") + '" ' +
        'title="Optioneel: bij wie hoort dit? Zo kan je later zien welke facturen nog openstaan." ' +
        'data-focus-id="' + focusId(ref, idx, "relatie") + '" data-scope="' + escapeAttr(ref) + '" data-row="' + idx + '" data-field="relatie" ' +
        'value="' + escapeAttr(row.relatie) + '" ' + (geboekt ? "disabled" : "") + ">";
    }

    return (
      "<tr" + rijKlasse + ">" +
      '<td class="kol-bedrag"><input type="text" inputmode="decimal" placeholder="0" ' +
      'data-focus-id="' + focusId(ref, idx, "bedrag") + '" data-scope="' + escapeAttr(ref) + '" data-row="' + idx + '" data-field="bedrag" ' +
      'value="' + escapeAttr(row.bedrag) + '" ' + (geboekt ? "disabled" : "") + "></td>" +

      '<td class="kol-redenering"><input type="text" placeholder="wat gebeurt hier?" ' +
      'data-focus-id="' + focusId(ref, idx, "redenering") + '" data-scope="' + escapeAttr(ref) + '" data-row="' + idx + '" data-field="redenering" ' +
      'value="' + escapeAttr(row.redenering) + '" ' + (geboekt ? "disabled" : "") + "></td>" +

      '<td class="kol-apko"><select data-focus-id="' + focusId(ref, idx, "apko") + '" data-scope="' + escapeAttr(ref) + '" data-row="' + idx + '" data-field="apko" ' + (geboekt ? "disabled" : "") + ">" +
      ["", "A", "P", "K", "O"].map(function (v) { return '<option value="' + v + '"' + (row.apko === v ? " selected" : "") + ">" + (v || "—") + "</option>"; }).join("") +
      "</select></td>" +

      '<td class="kol-stijgtdaalt"><select data-focus-id="' + focusId(ref, idx, "stijgtDaalt") + '" data-scope="' + escapeAttr(ref) + '" data-row="' + idx + '" data-field="stijgtDaalt" ' + (geboekt ? "disabled" : "") + ">" +
      ["", "Stijgt", "Daalt"].map(function (v) { return '<option value="' + v + '"' + (row.stijgtDaalt === v ? " selected" : "") + ">" + (v || "—") + "</option>"; }).join("") +
      "</select></td>" +

      '<td class="kol-rekening"><div class="rekening-wrap"><input type="text" placeholder="nr…" autocomplete="off" ' +
      'data-focus-id="' + rekeningFocusId + '" data-scope="' + escapeAttr(ref) + '" data-row="' + idx + '" data-field="rekening" ' +
      'value="' + escapeAttr(row.rekening) + '" ' + (geboekt ? "disabled" : "") + ">" +
      (geboekt ? "" : '<button type="button" class="btn-mar-zoeken" data-role="mar-zoeken" data-scope="' + escapeAttr(ref) + '" data-row="' + idx + '" title="Rekening zoeken">🔍</button>') +
      "</div>" + relatieHtml + "</td>" +

      '<td class="kol-omschrijving"><div class="omschrijving-veld' + (mar ? "" : (row.rekening ? " omschrijving-onbekend" : " omschrijving-leeg")) + '">' +
      (omschrijving ? escapeAttr(omschrijving) : "&nbsp;") + "</div></td>" +

      '<td class="kol-dc"><select data-focus-id="' + focusId(ref, idx, "dc") + '" data-scope="' + escapeAttr(ref) + '" data-row="' + idx + '" data-field="dc" ' + (geboekt ? "disabled" : "") + ">" +
      ["", "D", "C"].map(function (v) { return '<option value="' + v + '"' + (row.dc === v ? " selected" : "") + ">" + (v || "—") + "</option>"; }).join("") +
      "</select></td>" +

      '<td class="kol-verwijder">' + (geboekt ? "" : '<button type="button" class="btn-verwijder-rij" data-scope="' + escapeAttr(ref) + '" data-row="' + idx + '" data-role="verwijder-rij" title="Deze lijn verwijderen" aria-label="Deze lijn verwijderen">' + ICOON_PRULLENBAK + "</button>") + "</td>" +
      "</tr>"
    );
  }

  function htmlRedeneerschema(ref) {
    var boeking = boekingVoor(ref);
    var geboekt = boeking.geboekt;
    var totalen = berekenTotalen(boeking.rows);
    var gelijk = Math.abs(totalen.totaalDebet - totalen.totaalCredit) < 0.005 && totalen.totaalDebet > 0;
    var klaar = boekingKlaarOmTeBoeken(boeking.rows);

    var html = '<table class="redeneerschema">' +
      "<colgroup>" +
      '<col class="c-bedrag"><col class="c-redenering"><col class="c-apko"><col class="c-stijgtdaalt">' +
      '<col class="c-rekening"><col class="c-omschrijving"><col class="c-dc"><col class="c-verwijder">' +
      "</colgroup>" +
      "<thead><tr>" +
      "<th>Bedrag</th>" +
      '<th title="Denkhulp — niet verplicht">Redenering</th>' +
      '<th title="Denkhulp — niet verplicht">A/P/K/O</th>' +
      '<th title="Denkhulp — niet verplicht">Stijgt/daalt</th>' +
      "<th>Rekeningnr.</th><th>Omschrijving</th><th>D/C</th><th></th>" +
      "</tr></thead><tbody>";
    boeking.rows.forEach(function (row, idx) { html += htmlRedeneerschemaRij(ref, row, idx, geboekt); });
    html += "</tbody></table>";

    html += '<div class="redeneerschema-acties">';
    html += "<div>" + (geboekt ? "" : '<button type="button" class="btn-rij-toevoegen" data-scope="' + escapeAttr(ref) + '" data-role="rij-toevoegen">+ rij toevoegen</button>') + "</div>";
    html += '<div class="totalen">' +
      "<span>Totaal debet: <strong>" + formatBedrag(totalen.totaalDebet) + "</strong></span>" +
      "<span>Totaal credit: <strong>" + formatBedrag(totalen.totaalCredit) + "</strong></span>" +
      '<span class="' + (gelijk ? "balans-ok" : "balans-fout") + '">' + (gelijk ? "D = C ✓" : "D ≠ C") + "</span>" +
      "</div>";
    html += "</div>";

    html += '<div class="boeken-blok">';
    if (geboekt) {
      html += '<span class="status-geboekt">Geboekt ✓</span> ';
      html += '<button type="button" class="btn-heropenen" data-scope="' + escapeAttr(ref) + '" data-role="heropenen">Heropenen om te wijzigen</button>';
    } else {
      html += '<button type="button" class="btn-boeken" data-scope="' + escapeAttr(ref) + '" data-role="boeken" ' + (klaar ? "" : "disabled") + ">Boeken</button>";
      if (!klaar) {
        // Concreet zeggen wát er nog ontbreekt, per lijn. Anders blijft de
        // knop grijs zonder dat de leerling weet waarom.
        var punten = [];
        boeking.rows.forEach(function (row, idx) {
          if (rijLeeg(row)) {
            punten.push("Lijn " + (idx + 1) + " is nog helemaal leeg — vul ze in of verwijder ze met het prullenbakje.");
            return;
          }
          var mist = ontbreektInRij(row);
          if (mist.length) punten.push("Lijn " + (idx + 1) + ": nog geen " + mist.join(", ") + ".");
        });
        if (!gelijk && punten.length === 0) {
          punten.push("Totaal debet en totaal credit zijn niet gelijk.");
        } else if (!gelijk) {
          punten.push("En daarna: totaal debet en totaal credit moeten gelijk zijn.");
        }
        html += '<ul class="boeken-waarom">' + punten.map(function (p) { return "<li>" + escapeAttr(p) + "</li>"; }).join("") + "</ul>";
      }
    }
    html += "</div>";

    return html;
  }

  /* ========================================================================
     7. Pagina's
     ======================================================================== */

  function htmlBannerNaamOntbreekt() {
    if (state.student) return "";
    return '<div class="paneel" style="border-color:var(--kleur-fout);background:#ffece9;">' +
      "Vul bovenaan je naam in (voornaam, eventueel met eerste letter achternaam) — anders wordt je werk niet bewaard." +
      "</div>";
  }

  function renderStart() {
    var html = htmlBannerNaamOntbreekt();
    html += '<h1 class="pagina-titel">Boekhoudapp Kern 8</h1>';
    html += '<div class="paneel">' +
      "<p>Hey collega's, fijn dat jullie deze app willen testen! </p>"
+      
      "<p>De app spreekt vrij goed voor zichzelf, een handleiding heb ik nog niet. Je loopt er best tab voor tab door, je krijgt telkens een verantwoordingsstuk en een redeneerschema. Op dit redeneerschema zitten wat controles, ik weet nog niet of ik die laat staan. </p>" 
+ 
      "<p>Vooral aan het einde zitten nog wat lossen eindjes (zoals klanten/leveranciers om een zicht te hebben op de open facturen en de resultaatverwerking (te veel op 1 pagina, wat onduidelijk). Buiten dat, ben ik best wel al tevreden. Ik hoop dat het voor jullie ook vlot werkt, maak gerust bij het testen bewuste fouten die leerlingen makkelijk zouden kunnen maken. </p>"
+
      "<p>_______________________________________________________ </p>"       
+           
"<p>Kies links een opdracht. Vul per verantwoordingsstuk het redeneerschema in. Verplicht zijn het bedrag, het rekeningnummer en debet of credit; de kolommen redenering, A/P/K/O en stijgt/daalt zijn denkhulp en mag je invullen zoals het je past. De omschrijving bij het rekeningnummer vult de app automatisch aan.</p>" +
      "<p>Rechts staan altijd je T-rekeningen, zodat je die kan gebruiken terwijl je boekt. Boeken kan pas als debet en credit gelijk zijn.</p>" +
      "<p>De app zegt nooit of iets inhoudelijk juist is — dat kijkt de vakexpert na. Ze controleert wel of debet en credit kloppen.</p>" +
      "<p>Overal waar je een <span class=\"btn-info btn-info-voorbeeld\">i</span> ziet staan, vind je uitleg over hoe dat onderdeel werkt.</p>" +
      "<p>Je werk wordt automatisch bewaard in je browser. Gebruik <em>Exporteren</em> af en toe om een bestandje te bewaren als back-up, zeker als je van toestel wisselt — met <em>Importeren</em> laad je het weer in.</p>" +
      "</div>";
    return html;
  }

  function renderSaldibalans() {
    var gb = berekenGrootboek();
    var nrs = Object.keys(gb).sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); });
    var html = '<h1 class="pagina-titel">Proef- en saldibalans</h1>';
    html += '<p class="pagina-subtitel">Alle rekeningen met bewegingen, met hun totaal debet, totaal credit en het saldo.</p>';
    html += '<div class="paneel">';
    if (!nrs.length) {
      html += "<p>Nog geen boekingen.</p>";
    } else {
      var totD = 0, totC = 0, totSD = 0, totSC = 0;
      html += '<table class="saldibalans"><thead><tr><th>Rekening</th><th>Naam</th><th>Totaal debet</th><th>Totaal credit</th><th>Saldo debet</th><th>Saldo credit</th></tr></thead><tbody>';
      nrs.forEach(function (nr) {
        var mar = marBij(nr);
        var s = saldoVoorEntry(gb[nr]);
        totD += s.totalD; totC += s.totalC;
        if (s.kant === "D") totSD += s.saldo;
        if (s.kant === "C") totSC += s.saldo;
        html += "<tr><td>" + nr + "</td><td>" + escapeAttr(mar ? mar.naam : "") + "</td>" +
          "<td>" + formatBedrag(s.totalD) + "</td><td>" + formatBedrag(s.totalC) + "</td>" +
          "<td>" + (s.kant === "D" ? formatBedrag(s.saldo) : "") + "</td>" +
          "<td>" + (s.kant === "C" ? formatBedrag(s.saldo) : "") + "</td></tr>";
      });
      html += "</tbody><tfoot><tr><td colspan='2'>Totaal</td><td>" + formatBedrag(round2(totD)) + "</td><td>" + formatBedrag(round2(totC)) +
        "</td><td>" + formatBedrag(round2(totSD)) + "</td><td>" + formatBedrag(round2(totSC)) + "</td></tr></tfoot>";
      html += "</table>";
    }
    html += "</div>";
    return html;
  }

  function renderOpdracht(ref) {
    var def = null;
    for (var i = 0; i < OPDRACHTEN.length; i++) { if (OPDRACHTEN[i].ref === ref) { def = OPDRACHTEN[i]; break; } }
    if (!def) return "<p>Opdracht niet gevonden.</p>";
    var html = htmlBannerNaamOntbreekt();
    html += '<h1 class="pagina-titel">' + escapeAttr(def.titel) + "</h1>";
    html += '<p class="pagina-subtitel">' + escapeAttr(def.categorie) + "</p>";
    if (!def.geenDocument) {
      html += '<div class="paneel"><h2>Verantwoordingsstuk</h2>' + htmlDocumentAfbeelding(def.doc, false) + "</div>";
    }
    if (def.hulpdoc) {
      html += '<details class="paneel" open><summary class="hulpdoc-titel">' +
        escapeAttr(def.hulpdocTitel || "Hulpdocument") +
        "</summary>" + htmlDocumentAfbeelding(def.hulpdoc, false) + "</details>";
    }
    if (def.instructie) {
      html += '<div class="paneel" style="border-color:var(--kleur-primair);background:#e9eaf7;"><h2>Uitleg</h2><p>' + escapeAttr(def.instructie) + "</p></div>";
    }
    html += '<div class="paneel"><h2>Redeneerschema ' + htmlInfoKnop("redeneerschema", "Hoe vul je dit in?") + "</h2>";
    // Een korte tip staat gewoon boven het schema, niet in een popup: zo
    // lezen ze ze ook echt (zie het veld "tip" in data-opdrachten.js).
    if (def.tip) html += '<p class="opdracht-tip">' + escapeAttr(def.tip) + "</p>";
    html += htmlRedeneerschema(ref) + "</div>";
    return html;
  }

  /* ---------- Controles ----------
     De app toont hier bewust geen saldi: dan valt er niets meer na te kijken.
     Wat de leerling wél krijgt, is een filtertip waarmee ze de juiste
     rekeningen zelf in het T-paneel terugvindt. */

  function renderControles() {
    var refC = controleReferenties();
    var saldoC = controleSaldoSoort();

    var html = '<h1 class="pagina-titel">Controles ' + htmlInfoKnop("controles", "Wat wordt hier gevraagd?") + "</h1>";
    html += '<p class="pagina-subtitel">Rond dit tabblad volledig af vóór je aan de resultaatverwerking (BELASTING/RESULTAAT) begint.</p>';

    html += '<div class="paneel"><h2>Automatisch nagekeken</h2>';
    html += '<div class="controle-rij"><div class="controle-vraag">Is elke referentie geboekt?' +
      (refC.ontbrekend.length ? "<ul class='controle-lijst-fouten'>" + refC.ontbrekend.map(function (r) { return "<li>" + r + " nog niet geboekt</li>"; }).join("") + "</ul>" : "") +
      "</div><div class='controle-status-auto " + (refC.ok ? "ok" : "fout") + "'>" + (refC.ok ? "in orde" : "nog niet") + "</div></div>";

    html += '<div class="controle-rij"><div class="controle-vraag">Heeft elke rekening het juiste soort saldo? (afschrijvingen op …009 credit, aanschafwaarden debet, retours en kortingen aan de omgekeerde kant van hun klasse)' +
      (saldoC.fouten.length ? "<ul class='controle-lijst-fouten'>" + saldoC.fouten.map(function (f) { return "<li>" + f.nr + " " + escapeAttr(f.naam) + " — verwacht " + f.verwacht + "-saldo, staat nu " + f.actueel + "</li>"; }).join("") + "</ul>" : "") +
      "</div><div class='controle-status-auto " + (saldoC.ok ? "ok" : "fout") + "'>" + (saldoC.ok ? "in orde" : "nog niet") + "</div></div>";
    html += "</div>";

    html += '<div class="paneel"><h2>Zelf nakijken en aanvinken</h2>';
    HANDMATIGE_CONTROLES.forEach(function (c) {
      var doc = c.type === "check-met-document" ? documentVoorControle(c) : null;
      html += '<div class="controle-rij' + (state.controles[c.id] ? " controle-af" : "") + '">';
      html += '<div class="controle-vraag">';
      html += '<label><input type="checkbox" data-role="controle-check" data-controle-id="' + escapeAttr(c.id) + '" ' + (state.controles[c.id] ? "checked" : "") + "> <span>" + escapeAttr(c.vraag) + "</span></label>";
      if (c.uitleg) html += " " + htmlInfoKnop(c.uitleg, "Meer uitleg");
      if (c.toelichting) html += '<p class="controle-toelichting">' + escapeAttr(c.toelichting) + "</p>";
      if (c.filterTip) html += '<p class="controle-filtertip">' + escapeAttr(c.filterTip) + "</p>";
      html += "</div>";
      if (doc) html += "<div>" + htmlDocumentAfbeelding(doc, true) + "</div>";
      html += "</div>";
    });
    html += "</div>";

    html += '<div class="paneel"><h2>Openstaande facturen</h2>' +
      "<p>Het volledige overzicht per klant en per leverancier staat op het tabblad " +
      '<button type="button" class="link-knop" data-role="ga-naar" data-page-type="relaties">Klanten &amp; leveranciers</button>.</p></div>';

    return html;
  }

  /* ---------- Klanten & leveranciers ---------- */

  // Alle boekingen op 400000 / 440000, per relatie, in de volgorde waarin de
  // opdrachten in data-opdrachten.js staan. Zo kan een leerling factuur en
  // betaling naast elkaar leggen.
  function boekingenPerRelatie(soort) {
    var nrDoel = soort === "klanten" ? "400000" : "440000";
    var perRelatie = {};
    OPDRACHTEN.forEach(function (o) {
      var b = state.boekingen[o.ref];
      if (!b || !b.geboekt) return;
      b.rows.forEach(function (row) {
        var mar = marBij(row.rekening);
        if (!mar || String(mar.nr) !== nrDoel) return;
        var bedrag = parseBedrag(row.bedrag);
        if (bedrag === null || !row.dc) return;
        var naam = (row.relatie || "").trim() || "— geen naam ingevuld —";
        if (!perRelatie[naam]) perRelatie[naam] = [];
        perRelatie[naam].push({ ref: o.ref, dc: row.dc, bedrag: bedrag });
      });
    });
    return perRelatie;
  }

  // Koppelt betalingen aan facturen, oudste factuur eerst (de volgorde van
  // data-opdrachten.js is chronologisch). Zo ziet de leerling niet enkel een
  // saldo, maar wélke factuur nog openstaat en waarmee ze vereffend is.
  // Een deelbetaling wordt over meerdere facturen verdeeld; wat overblijft
  // (meer betaald dan er aan facturen geboekt is) komt apart te staan.
  function koppelFacturen(regels, isKlant) {
    var factuurKant = isKlant ? "D" : "C";
    var facturen = [];
    var betalingen = [];
    regels.forEach(function (r) {
      if (r.dc === factuurKant) facturen.push({ ref: r.ref, bedrag: r.bedrag, rest: r.bedrag, betaald: [] });
      else betalingen.push({ ref: r.ref, bedrag: r.bedrag, rest: r.bedrag });
    });
    betalingen.forEach(function (b) {
      facturen.forEach(function (f) {
        if (b.rest < 0.005 || f.rest < 0.005) return;
        var deel = round2(Math.min(b.rest, f.rest));
        f.betaald.push({ ref: b.ref, bedrag: deel, gedeeltelijk: deel < round2(b.bedrag) - 0.005 || deel < round2(f.bedrag) - 0.005 });
        f.rest = round2(f.rest - deel);
        b.rest = round2(b.rest - deel);
      });
    });
    return {
      facturen: facturen,
      losseBetalingen: betalingen.filter(function (b) { return b.rest > 0.005; }),
    };
  }

  // Referenties van de facturen die nog (deels) openstaan — handig als
  // korte aanduiding in de overzichtstabel.
  function openFactuurRefs(regels, isKlant) {
    return koppelFacturen(regels, isKlant).facturen
      .filter(function (f) { return f.rest > 0.005; })
      .map(function (f) { return f.ref; });
  }

  // Detail van één relatie: één regel per factuur, met de betaling(en) die
  // erop volgden. Geen loopsaldo per regel meer — enkel het totaal onderaan.
  function htmlRelatieDetail(naam, regels, isKlant) {
    var koppeling = koppelFacturen(regels, isKlant);
    var facturen = koppeling.facturen;
    var los = koppeling.losseBetalingen;

    var totaalFacturen = som(facturen.map(function (f) { return f.bedrag; }));
    var totaalOpen = round2(som(facturen.map(function (f) { return f.rest; })) - som(los.map(function (b) { return b.rest; })));

    var kopBetaling = isKlant ? "Betaling ontvangen" : "Betaling gedaan";
    var html = '<table class="relatie-detail"><thead><tr>' +
      "<th>Factuur</th><th>Bedrag</th><th>" + kopBetaling + "</th><th>Nog open</th>" +
      "</tr></thead><tbody>";

    if (!facturen.length) {
      html += '<tr><td colspan="4" class="relatie-leeg">Er staat geen enkele factuur van ' + escapeAttr(naam) +
        " op deze rekening — enkel betalingen. Kijk na of je de factuur wel geboekt hebt.</td></tr>";
    }

    facturen.forEach(function (f) {
      var openRegel = f.rest > 0.005;
      var betalingTekst = f.betaald.length
        ? f.betaald.map(function (b) {
          return escapeAttr(b.ref) + (b.gedeeltelijk ? " (" + formatBedrag(b.bedrag) + ")" : "");
        }).join(", ")
        : '<span class="relatie-niet-betaald">nog niet betaald</span>';
      html += '<tr class="' + (openRegel ? "factuur-open" : "factuur-vereffend") + '">' +
        "<td>" + escapeAttr(f.ref) + "</td>" +
        "<td>" + formatBedrag(f.bedrag) + "</td>" +
        '<td class="relatie-betaling">' + betalingTekst + "</td>" +
        "<td>" + (openRegel
          ? formatBedrag(f.rest)
          : '<span class="relatie-status betaald">vereffend</span>') + "</td></tr>";
    });

    html += "</tbody><tfoot><tr>" +
      "<td>Totaal</td>" +
      "<td>" + formatBedrag(totaalFacturen) + "</td>" +
      "<td></td>" +
      '<td class="' + (Math.abs(totaalOpen) < 0.005 ? "" : (totaalOpen > 0 ? "totaal-open" : "totaal-fout")) + '">' +
      (Math.abs(totaalOpen) < 0.005 ? formatBedrag(0) : formatBedrag(Math.abs(totaalOpen))) +
      "</td></tr></tfoot></table>";

    if (los.length) {
      html += '<p class="relatie-conclusie verkeerd">Deze ' + (isKlant ? "ontvangst" : "betaling") +
        (los.length > 1 ? "en horen" : " hoort") + " bij geen enkele geboekte factuur: " +
        los.map(function (b) { return escapeAttr(b.ref) + " (" + formatBedrag(b.rest) + ")"; }).join(", ") +
        ". Er is meer " + (isKlant ? "ontvangen" : "betaald") +
        " dan er aan facturen geboekt is — kijk na of een factuur ontbreekt of te laag geboekt is.</p>";
    } else if (Math.abs(totaalOpen) < 0.005) {
      html += '<p class="relatie-conclusie betaald">Alle facturen van ' + escapeAttr(naam) + " zijn vereffend.</p>";
    } else {
      var aantalOpen = facturen.filter(function (f) { return f.rest > 0.005; }).length;
      html += '<p class="relatie-conclusie openstaand">Er staat nog ' + formatBedrag(totaalOpen) + " open over " +
        aantalOpen + (aantalOpen === 1 ? " factuur." : " facturen.") +
        " Zou die al betaald moeten zijn? Kijk dan na of het bedrag klopt en of je de betalingskorting geboekt hebt.</p>";
    }

    return html;
  }

  function htmlRelatieBlok(soort) {
    var isKlant = soort === "klanten";
    var nrDoel = isKlant ? "400000" : "440000";
    var titel = isKlant ? "Klanten — 400000 Handelsdebiteuren" : "Leveranciers — 440000 Leveranciers";
    var perRelatie = boekingenPerRelatie(soort);
    var namen = Object.keys(perRelatie).sort();
    var gekozen = uiState.relatieKeuze[soort];
    if (gekozen && namen.indexOf(gekozen) === -1) gekozen = "";

    var html = '<div class="paneel"><h2>' + escapeAttr(titel) + "</h2>";

    if (!namen.length) {
      html += "<p>Nog geen geboekte verrichtingen op " + nrDoel + ". Boek je een factuur of een betaling op deze rekening, vul dan in het redeneerschema ook de naam van de " +
        (isKlant ? "klant" : "leverancier") + " in — dan verschijnt hier het overzicht.</p></div>";
      return html;
    }

    // Overzichtstabel van alle relaties, met openstaand saldo
    html += '<table class="relatie-overzicht"><thead><tr><th>Naam</th><th>Facturen</th><th>Betalingen</th><th>Openstaand</th><th>Status</th></tr></thead><tbody>';
    namen.forEach(function (naam) {
      var regels = perRelatie[naam];
      var d = som(regels.filter(function (r) { return r.dc === "D"; }).map(function (r) { return r.bedrag; }));
      var c = som(regels.filter(function (r) { return r.dc === "C"; }).map(function (r) { return r.bedrag; }));
      var facturen = isKlant ? d : c;
      var betalingen = isKlant ? c : d;
      var open = round2(facturen - betalingen);
      var openRefs = open > 0.005 ? openFactuurRefs(regels, isKlant) : [];
      var status = Math.abs(open) < 0.005
        ? '<span class="relatie-status betaald">alles betaald</span>'
        : (open > 0
          ? '<span class="relatie-status openstaand">nog open' + (openRefs.length ? ": " + escapeAttr(openRefs.join(", ")) : "") + "</span>"
          : '<span class="relatie-status teveel">' + formatBedrag(Math.abs(open)) + " te veel " + (isKlant ? "ontvangen" : "betaald") + "</span>");
      html += '<tr class="' + (naam === gekozen ? "relatie-gekozen" : "") + '">' +
        '<td><button type="button" class="link-knop" data-role="kies-relatie" data-soort="' + soort + '" data-naam="' + escapeAttr(naam) + '">' + escapeAttr(naam) + "</button></td>" +
        "<td>" + formatBedrag(facturen) + "</td>" +
        "<td>" + formatBedrag(betalingen) + "</td>" +
        "<td>" + formatBedrag(Math.abs(open)) + "</td>" +
        "<td>" + status + "</td></tr>";
    });
    html += "</tbody></table>";

    // Keuzelijst + detail van één relatie
    html += '<div class="relatie-kiezer"><label for="relatie-select-' + soort + '">Toon in detail:</label>' +
      '<select id="relatie-select-' + soort + '" data-role="relatie-select" data-soort="' + soort + '">' +
      '<option value="">— kies een ' + (isKlant ? "klant" : "leverancier") + " —</option>" +
      namen.map(function (n) { return '<option value="' + escapeAttr(n) + '"' + (n === gekozen ? " selected" : "") + ">" + escapeAttr(n) + "</option>"; }).join("") +
      "</select></div>";

    if (gekozen) {
      html += htmlRelatieDetail(gekozen, perRelatie[gekozen], isKlant);
    }

    html += "</div>";
    return html;
  }

  function renderRelaties() {
    var html = '<h1 class="pagina-titel">Klanten &amp; leveranciers ' + htmlInfoKnop("klantenLeveranciers", "Hoe lees je dit?") + "</h1>";
    html += '<p class="pagina-subtitel">Wie moet er nog betalen, en wat staat er bij jou nog open?</p>';
    html += '<div class="paneel paneel-tip"><p>Dit overzicht is opgebouwd uit de namen die je zelf bij je boekingen op 400000 en 440000 invulde. Ontbreekt er een naam, ga dan terug naar die boeking en vul ze aan.</p>' +
      "<p><strong>Betalingskorting</strong> boek je pas bij de betaling, niet al bij de factuur — pas dan weet je of je op tijd betaalt. De btw op de factuur bereken je wél al na aftrek van die korting.</p></div>";
    html += htmlRelatieBlok("klanten");
    html += htmlRelatieBlok("leveranciers");
    return html;
  }

  /* ---------- Eindbalans ---------- */

  // De kaartjes zijn RUBRIEKEN, niet losse rekeningen: anders wordt het een
  // lange lijst met veel klikwerk, en het is net de bedoeling dat ze leren
  // dat een rubriek als geheel op een bepaalde plaats van de balans komt.
  // Het saldo van een rubriek is het netto saldo van al haar rekeningen —
  // bij rubriek 23 dus de aanschafwaarde min de geboekte afschrijvingen.
  function balansKaarten() {
    var gb = berekenGrootboek();
    var perRubriek = {};
    Object.keys(gb).forEach(function (nr) {
      var mar = marBij(nr);
      if (!mar) return;
      var s = saldoVoorEntry(gb[nr]);
      if (!s.kant) return;
      var r = mar.rubriek;
      if (!perRubriek[r]) perRubriek[r] = { netto: 0, rekeningen: [] };
      perRubriek[r].netto = round2(perRubriek[r].netto + (s.kant === "D" ? s.saldo : -s.saldo));
      perRubriek[r].rekeningen.push(nr + " " + mar.naam);
    });
    return Object.keys(perRubriek)
      .sort()
      .map(function (r) {
        var e = perRubriek[r];
        if (Math.abs(e.netto) < 0.005) return null;  // rubriek valt helemaal weg
        return {
          id: r,
          naam: rubriekOms(r),
          saldo: Math.abs(e.netto),
          kant: e.netto > 0 ? "D" : "C",
          rekeningen: e.rekeningen,
        };
      })
      .filter(Boolean);
  }

  function htmlKaart(kaart, geplaatst) {
    var gekozen = uiState.gekozenKaarten.indexOf(kaart.id) !== -1;
    // Een kaartje dat al op de balans ligt, is "afgewerkt": het wordt kleiner
    // en grijzer, zodat de vaknamen en de bedragen bovenaan blijven staan en
    // de balans leesbaar blijft.
    return '<div class="balans-kaart' + (geplaatst ? " geplaatst" : "") + (gekozen ? " gekozen" : "") + '" draggable="true" ' +
      'data-role="balans-kaart" data-kaart="' + escapeAttr(kaart.id) + '" ' +
      'title="' + escapeAttr("Rubriek " + kaart.id + " — " + kaart.rekeningen.join(", ")) + '">' +
      '<span class="kaart-nr">' + kaart.id + "</span>" +
      '<span class="kaart-naam">' + escapeAttr(kaart.naam) + "</span>" +
      '<span class="kaart-saldo">' + kaart.kant + " " + formatBedrag(kaart.saldo) + "</span>" +
      (geplaatst ? '<button type="button" class="kaart-terug" data-role="kaart-terug" data-kaart="' + escapeAttr(kaart.id) + '" title="Terug naar de lijst" aria-label="Terug naar de lijst">↩</button>' : "") +
      "</div>";
  }

  // Optelling van alles wat in één kolom (activa, passiva, kosten of
  // opbrengsten) gelegd is. Een kaartje dat aan de andere kant staat dan de
  // kolom, telt af — zo gaan de geboekte afschrijvingen van de vaste activa af.
  function kolomTotaal(kol, kaarten) {
    var t = 0;
    kaarten.forEach(function (k) {
      var vakId = state.eindbalans[k.id];
      if (!vakId) return;
      var hoortHier = kol.groepen.some(function (g) {
        return g.vakken.some(function (v) { return v.id === vakId; });
      });
      if (!hoortHier) return;
      t = round2(t + (k.kant === kol.kant ? k.saldo : -k.saldo));
    });
    return t;
  }

  function resultaatverwerkingGeboekt() {
    var b1 = state.boekingen.BELASTING;
    var b2 = state.boekingen.RESULTAAT;
    return !!(b1 && b1.geboekt && b2 && b2.geboekt);
  }

  // Is de eindbalans afgewerkt? Alle rubrieken geplaatst én de optelling
  // klopt. Welke optelling dat is, hangt ervan af of de resultaatverwerking
  // al geboekt is (zie htmlBalansEvenwichtsregel).
  function balansAf() {
    var kaarten = balansKaarten();
    if (!kaarten.length) return false;
    var alleGeplaatst = kaarten.every(function (k) { return !!state.eindbalans[k.id]; });
    if (!alleGeplaatst) return false;
    var b = BALANS_STRUCTUUR.balans.kolommen;
    var r = BALANS_STRUCTUUR.resultatenrekening.kolommen;
    var activa = kolomTotaal(b[0], kaarten);
    var passiva = kolomTotaal(b[1], kaarten);
    var kosten = kolomTotaal(r[0], kaarten);
    var opbrengsten = kolomTotaal(r[1], kaarten);
    if (resultaatverwerkingGeboekt()) {
      return Math.abs(activa - passiva) < 0.005 && Math.abs(kosten - opbrengsten) < 0.005;
    }
    return Math.abs(activa + kosten - passiva - opbrengsten) < 0.005;
  }

  function htmlBalansDeel(deelNaam, kaarten, toonEvenwicht) {
    var deel = BALANS_STRUCTUUR[deelNaam];
    var perVak = {};
    kaarten.forEach(function (k) {
      var vakId = state.eindbalans[k.id];
      if (!vakId) return;
      if (!perVak[vakId]) perVak[vakId] = [];
      perVak[vakId].push(k);
    });

    var html = '<div class="balans-deel"><h3 class="balans-deel-titel">' + escapeAttr(deel.titel) + "</h3>";
    html += '<div class="balans-kolommen">';
    deel.kolommen.forEach(function (kol) {
      var kolomHtml = "";
      kol.groepen.forEach(function (groep) {
        kolomHtml += '<div class="balans-groep"><div class="balans-groep-titel">' + escapeAttr(groep.titel) + "</div>";
        groep.vakken.forEach(function (vak) {
          var inhoud = perVak[vak.id] || [];
          var vakTotaal = 0;
          inhoud.forEach(function (k) {
            vakTotaal = round2(vakTotaal + (k.kant === kol.kant ? k.saldo : -k.saldo));
          });
          kolomHtml += '<div class="balans-vak' + (inhoud.length ? " gevuld" : "") + '" data-role="balans-vak" data-vak="' + escapeAttr(vak.id) + '">' +
            '<div class="balans-vak-kop">' +
            '<span class="balans-vak-naam">' + escapeAttr(vak.naam) + "</span>" +
            '<span class="balans-vak-totaal">' + (inhoud.length ? formatBedrag(vakTotaal) : "") + "</span>" +
            "</div>";
          kolomHtml += '<div class="balans-vak-inhoud">' +
            inhoud.map(function (k) { return htmlKaart(k, true); }).join("") +
            "</div></div>";
        });
        kolomHtml += "</div>";
      });
      html += '<div class="balans-kolom"><div class="balans-kolom-titel">' + escapeAttr(kol.titel) + "</div>" +
        kolomHtml +
        '<div class="balans-kolom-totaal">Totaal ' + escapeAttr(kol.titel.toLowerCase()) + ": <strong>" + formatBedrag(kolomTotaal(kol, kaarten)) + "</strong></div></div>";
    });
    html += "</div>";

    if (toonEvenwicht) {
      var t0 = kolomTotaal(deel.kolommen[0], kaarten);
      var t1 = kolomTotaal(deel.kolommen[1], kaarten);
      var inEvenwicht = Math.abs(t0 - t1) < 0.005 && t0 !== 0;
      html += '<div class="balans-evenwicht ' + (inEvenwicht ? "ok" : "nog-niet") + '">' +
        (inEvenwicht
          ? "In evenwicht: " + escapeAttr(deel.kolommen[0].titel.toLowerCase()) + " = " + escapeAttr(deel.kolommen[1].titel.toLowerCase()) + " = " + formatBedrag(t0)
          : "Verschil: " + formatBedrag(Math.abs(round2(t0 - t1)))) +
        "</div>";
    }
    html += "</div>";
    return html;
  }

  // Twee verschillende controles, naargelang de resultaatverwerking al
  // geboekt is. Zolang de winst nog niet toegewezen is, kan de balans op
  // zichzelf niet kloppen — dan geldt activa + kosten = passiva + opbrengsten.
  function htmlBalansEvenwichtsregel(kaarten) {
    var klaar = resultaatverwerkingGeboekt();
    var balansKol = BALANS_STRUCTUUR.balans.kolommen;
    var resKol = BALANS_STRUCTUUR.resultatenrekening.kolommen;
    var activa = kolomTotaal(balansKol[0], kaarten);
    var passiva = kolomTotaal(balansKol[1], kaarten);
    var kosten = kolomTotaal(resKol[0], kaarten);
    var opbrengsten = kolomTotaal(resKol[1], kaarten);

    var uitleg, links, rechts, labelLinks, labelRechts;
    if (klaar) {
      uitleg = "Je hebt de resultaatverwerking geboekt: de winst staat al bij het overgedragen resultaat. " +
        "Nu moet totaal activa gelijk zijn aan totaal passiva, én totaal kosten aan totaal opbrengsten.";
      links = round2(activa - passiva);
      rechts = round2(kosten - opbrengsten);
      labelLinks = "activa − passiva";
      labelRechts = "kosten − opbrengsten";
    } else {
      uitleg = "Je hebt de resultaatverwerking (BELASTING en RESULTAAT) nog niet geboekt, dus de winst zit nog in de resultatenrekening. " +
        "Zolang dat zo is, moet activa + kosten gelijk zijn aan passiva + opbrengsten.";
      links = round2(activa + kosten - passiva - opbrengsten);
      rechts = 0;
      labelLinks = "activa + kosten − passiva − opbrengsten";
      labelRechts = null;
    }

    var geplaatst = kaarten.filter(function (k) { return !!state.eindbalans[k.id]; }).length;
    var allesGeplaatst = geplaatst === kaarten.length && kaarten.length > 0;
    var klopt = allesGeplaatst && Math.abs(links) < 0.005 && Math.abs(rechts) < 0.005;

    var html = '<div class="balans-regel ' + (klopt ? "ok" : "nog-niet") + '">';
    html += "<p>" + escapeAttr(uitleg) + "</p>";
    if (!allesGeplaatst) {
      html += "<p><strong>Nog " + (kaarten.length - geplaatst) + " van de " + kaarten.length + " rubrieken te plaatsen.</strong></p>";
    } else if (klopt) {
      html += "<p><strong>Dat klopt. Laat je leerkracht wel nog nakijken of elke rubriek op de juiste plaats staat — dat kan deze app niet zien.</strong></p>";
    } else {
      html += "<p><strong>Er zit nog een verschil van " + formatBedrag(Math.abs(links)) + " op " + escapeAttr(labelLinks) + ".</strong>";
      if (labelRechts && Math.abs(rechts) >= 0.005) {
        html += " En een verschil van " + formatBedrag(Math.abs(rechts)) + " op " + escapeAttr(labelRechts) + ".";
      }
      html += "</p>";
    }
    html += "</div>";
    return html;
  }

  function renderEindbalans() {
    var kaarten = balansKaarten();
    var teplaatsen = kaarten.filter(function (k) { return !state.eindbalans[k.id]; });
    var klaar = resultaatverwerkingGeboekt();

    var html = '<div class="paneel" id="paneel-eindbalans"><h2>Eindbalans en resultatenrekening ' + htmlInfoKnop("eindbalans", "Hoe werkt dit?") + "</h2>";
    if (!kaarten.length) {
      html += "<p>Zodra je boekingen hebt, verschijnen hier alle rubrieken met een saldo.</p></div>";
      return html;
    }

    html += htmlBalansEvenwichtsregel(kaarten);

    html += '<p class="paneel-hint">Klik één of meer rubrieken aan en klik daarna op het vak waar ze thuishoren. Slepen mag ook.</p>';

    html += '<div class="balans-voorraad" data-role="balans-vak" data-vak="">' +
      '<div class="balans-voorraad-titel">Nog te plaatsen (' + teplaatsen.length + " van " + kaarten.length + ")</div>" +
      '<div class="balans-voorraad-inhoud">' +
      (teplaatsen.length
        ? teplaatsen.map(function (k) { return htmlKaart(k, false); }).join("")
        : '<span class="balans-vak-leeg">Alle rubrieken hebben een plaats.</span>') +
      "</div></div>";

    html += htmlBalansDeel("balans", kaarten, klaar);
    html += htmlBalansDeel("resultatenrekening", kaarten, klaar);

    html += '<div class="balans-acties"><button type="button" class="btn-secundair" data-role="balans-leegmaken">Alles terug naar de lijst</button></div>';
    html += "</div>";
    return html;
  }

  function renderResultaat() {
    var ok = alleControlesOk();
    var html = '<h1 class="pagina-titel">Resultaatverwerking — BELASTING + RESULTAAT</h1>';
    html += '<p class="pagina-subtitel">Vennootschapsbelasting, toewijzing aan overgedragen winst en de eindbalans.</p>';

    if (!ok) {
      html += '<div class="paneel" style="border-color:var(--kleur-fout);background:#ffece9;">' +
        "Oops, ben je zeker dat je hier al verder kunt? Ga naar het tabblad Controles en check alles na. Zolang daar iets ontbreekt of nog niet aangevinkt is, kan je hier nog niet aan verder." +
        "</div>";
    }

    html += htmlBannerNaamOntbreekt();

    // De balans staat bovenaan: ze is het doel van dit tabblad, en de
    // evenwichtsregel erboven vertelt meteen waar de leerling staat.
    html += renderEindbalans();

    html += '<div class="paneel"><h2>Stapsgewijze berekening</h2><p class="paneel-hint">Reken dit zelf uit op basis van je eigen boekingen. De app controleert dit niet.</p>';
    var stappen = [
      ["opbrengsten", "1. Hoeveel opbrengsten maakte het bedrijf? (klasse 7)"],
      ["kosten", "2. Hoeveel kosten maakte het bedrijf? (klasse 6)"],
      ["winst", "3. Bereken de winst"],
      ["belasting", "4. Bereken de vennootschapsbelasting (20 %)"],
      ["restwinst", "5. Hoeveel winst blijft er over?"],
    ];
    stappen.forEach(function (s) {
      html += '<div class="stap-rij"><label for="stap-' + s[0] + '">' + s[1] + "</label>" +
        '<input type="text" id="stap-' + s[0] + '" inputmode="decimal" placeholder="0" data-focus-id="stap-' + s[0] + '" data-role="stap-veld" data-veld="' + s[0] + '" value="' + escapeAttr(state.resultaat.stap[s[0]]) + '"></div>';
    });
    html += "</div>";

    html += '<div class="paneel"><h2>BELASTING — Vennootschapsbelasting ' + htmlInfoKnop("redeneerschema", "Hoe vul je dit in?") + "</h2>" + htmlRedeneerschema("BELASTING") + "</div>";
    html += '<div class="paneel"><h2>RESULTAAT — Toewijzing overgedragen winst</h2>' + htmlRedeneerschema("RESULTAAT") + "</div>";

    var getallen = berekenSlotcontroleGetallen();
    html += '<div class="paneel"><h2>Slotcontrole</h2><p class="paneel-hint">De app oordeelt hier niet — kijk zelf na of het klopt en bevestig het.</p>';

    // Na het boeken van BELASTING en RESULTAAT verandert de balans nog: de
    // winst verhuist naar het overgedragen resultaat. Ze moeten dus eerst
    // terug naar boven vóór ze hier kunnen afronden.
    if (resultaatverwerkingGeboekt() && !balansAf()) {
      html += '<div class="slotcontrole-terug">' +
        "<p><strong>Je hebt de resultaatverwerking geboekt. Werk nu eerst de eindbalans en de resultatenrekening bovenaan af.</strong></p>" +
        "<p>Door BELASTING en RESULTAAT verschuift de winst naar het overgedragen resultaat, dus de bedragen op je balans zijn veranderd. Pas als activa gelijk is aan passiva én kosten aan opbrengsten, kan je hier afronden.</p>" +
        '<button type="button" class="btn-secundair" data-role="naar-eindbalans">Naar de eindbalans</button>' +
        "</div>";
    }

    html += '<div class="slotcontrole-blok">' +
      '<div class="slotcontrole-vraag"><label><input type="checkbox" data-role="slot-check" data-veld="slotcontroleResultaat" ' + (state.resultaat.slotcontroleResultaat ? "checked" : "") + "> Is de resultatenrekening in evenwicht?</label></div>" +
      '<div class="slotcontrole-detail">Totaal klasse 6: ' + formatBedrag(getallen.resD) + "</div>" +
      '<div class="slotcontrole-detail">Totaal klasse 7: ' + formatBedrag(getallen.resC) + "</div>" +
      "</div>";
    html += '<div class="slotcontrole-blok">' +
      '<div class="slotcontrole-vraag"><label><input type="checkbox" data-role="slot-check" data-veld="slotcontroleBalans" ' + (state.resultaat.slotcontroleBalans ? "checked" : "") + "> Is de balans in evenwicht?</label></div>" +
      '<div class="slotcontrole-detail">Totaal activa: ' + formatBedrag(getallen.actD) + "</div>" +
      '<div class="slotcontrole-detail">Totaal passiva: ' + formatBedrag(getallen.pasC) + "</div>" +
      "</div>";
    if (state.resultaat.slotcontroleMelding) {
      var melding = state.resultaat.slotcontroleMelding;
      html += '<div class="slotcontrole-melding ' + (melding.type === "goed" ? "goed" : "fout") + '">' + melding.tekst + "</div>";
    }
    html += "</div>";

    return html;
  }

  function berekenSlotcontroleGetallen() {
    var gb = berekenGrootboek();
    var resD = 0, resC = 0, actD = 0, pasC = 0;
    Object.keys(gb).forEach(function (nr) {
      var mar = marBij(nr);
      if (!mar) return;
      var s = saldoVoorEntry(gb[nr]);
      if (mar.klasse === "6" || mar.klasse === "7") { resD += s.totalD; resC += s.totalC; }
      if (mar.apko === "A") { if (s.kant === "D") actD += s.saldo; else if (s.kant === "C") pasC += s.saldo; }
      if (mar.apko === "P") { if (s.kant === "C") pasC += s.saldo; else if (s.kant === "D") actD += s.saldo; }
    });
    return { resD: round2(resD), resC: round2(resC), actD: round2(actD), pasC: round2(pasC) };
  }

  /* ========================================================================
     8. T-panel
     ======================================================================== */

  function htmlTrekBlok(nr, mar, entry) {
    var s = saldoVoorEntry(entry);
    var detail = uiState.tpanelDetail;
    var heeftBoekingen = entry.D.length > 0 || entry.C.length > 0;
    var debetInhoud = "";
    var creditInhoud = "";

    if (detail) {
      entry.D.forEach(function (e) { debetInhoud += '<div class="trek-regel"><span class="ref">' + e.ref + "</span><span>" + formatBedrag(e.bedrag) + "</span></div>"; });
      entry.C.forEach(function (e) { creditInhoud += '<div class="trek-regel"><span class="ref">' + e.ref + "</span><span>" + formatBedrag(e.bedrag) + "</span></div>"; });
    } else {
      if (s.totalD > 0) debetInhoud += '<div class="trek-regel"><span>totaal</span><span>' + formatBedrag(s.totalD) + "</span></div>";
      if (s.totalC > 0) creditInhoud += '<div class="trek-regel"><span>totaal</span><span>' + formatBedrag(s.totalC) + "</span></div>";
    }

    if (s.kant === "D") {
      debetInhoud += '<div class="trek-regel trek-saldo-rij"><span>D-saldo</span><span>' + formatBedrag(s.saldo) + "</span></div>";
    } else if (s.kant === "C") {
      creditInhoud += '<div class="trek-regel trek-saldo-rij"><span>C-saldo</span><span>' + formatBedrag(s.saldo) + "</span></div>";
    } else if (heeftBoekingen) {
      // Debet en credit heffen elkaar precies op. Vroeger stond er dan
      // helemaal geen saldo, wat verwarrend was ("ben ik iets vergeten?").
      // Nu tonen we een nulsaldo aan de kant waar deze rekening normaal
      // staat — bv. 400000 een D-saldo van 0, 440000 een C-saldo van 0.
      var kant = verwachteKant(mar) || (mar.apko === "P" || mar.apko === "O" ? "C" : "D");
      var nulRegel = '<div class="trek-regel trek-saldo-rij trek-saldo-nul"><span>' + kant + "-saldo</span><span>0</span></div>";
      if (kant === "D") debetInhoud += nulRegel; else creditInhoud += nulRegel;
    }

    if (!debetInhoud) debetInhoud = '<div class="trek-leeg">—</div>';
    if (!creditInhoud) creditInhoud = '<div class="trek-leeg">—</div>';

    return '<div class="trek-blok' + (heeftBoekingen ? "" : " trek-blok-leeg") + '" id="trek-' + nr + '">' +
      '<div class="trek-titel"><span>' + nr + " " + escapeAttr(mar.naam) + "</span></div>" +
      '<div class="trek-body"><div class="trek-kant debet">' + debetInhoud + '</div><div class="trek-kant credit">' + creditInhoud + "</div></div></div>";
  }

  // Suggesties voor het relatieveld (klant/leverancier): het optionele
  // startlijstje uit data-relaties.js, aangevuld met namen die de leerling
  // zelf al eerder intikte bij andere boekingen op dezelfde rekening.
  function verzamelRelatieNamen(soort) {
    var nrDoel = soort === "klanten" ? "400000" : "440000";
    var namen = {};
    (RELATIES[soort] || []).forEach(function (n) { if (n) namen[n] = true; });
    Object.keys(state.boekingen).forEach(function (ref) {
      var b = state.boekingen[ref];
      if (!b || !b.rows) return;
      b.rows.forEach(function (row) {
        var mar = marBij(row.rekening);
        if (row.relatie && mar && String(mar.nr) === nrDoel) namen[row.relatie] = true;
      });
    });
    return Object.keys(namen).sort();
  }

  function updateRelatieDatalists() {
    ["klanten", "leveranciers"].forEach(function (soort) {
      var el = document.getElementById(soort === "klanten" ? "datalist-klanten" : "datalist-leveranciers");
      if (!el) return;
      el.innerHTML = verzamelRelatieNamen(soort).map(function (n) { return '<option value="' + escapeAttr(n) + '">'; }).join("");
    });
  }

  /* ========================================================================
     8b. Filters op klasse en rubriek (T-paneel + zoekscherm)
     ======================================================================== */

  function klassenMetRekeningen() {
    return MAR_INDELING.filter(function (kl) {
      return MAR.some(function (a) { return a.klasse === kl.klasse; });
    });
  }

  function rubriekenVoorKlasse(klasse) {
    var lijst = [];
    MAR_INDELING.forEach(function (kl) {
      if (klasse && kl.klasse !== klasse) return;
      kl.rubrieken.forEach(function (r) {
        if (!MAR.some(function (a) { return a.rubriek === r.rubriek; })) return;
        lijst.push({ rubriek: r.rubriek, oms: r.oms, klasse: kl.klasse });
      });
    });
    return lijst;
  }

  function vulKlasseSelect(selectEl, gekozen) {
    if (!selectEl) return;
    var html = '<option value="">alle klassen</option>';
    klassenMetRekeningen().forEach(function (kl) {
      html += '<option value="' + kl.klasse + '"' + (kl.klasse === gekozen ? " selected" : "") + ">klasse " + kl.klasse + " — " + escapeAttr(kl.oms) + "</option>";
    });
    selectEl.innerHTML = html;
  }

  function vulRubriekSelect(selectEl, klasse, gekozen) {
    if (!selectEl) return;
    var rubrieken = rubriekenVoorKlasse(klasse);
    var html = '<option value="">alle rubrieken</option>';
    rubrieken.forEach(function (r) {
      html += '<option value="' + r.rubriek + '"' + (r.rubriek === gekozen ? " selected" : "") + ">" + r.rubriek + " — " + escapeAttr(r.oms) + "</option>";
    });
    selectEl.innerHTML = html;
    selectEl.disabled = rubrieken.length === 0;
  }

  function rekeningPastBijFilter(a, filter) {
    if (filter.apko && a.apko !== filter.apko) return false;
    if (filter.klasse && a.klasse !== filter.klasse) return false;
    if (filter.rubriek && a.rubriek !== filter.rubriek) return false;
    var query = (filter.zoek || "").trim().toLowerCase();
    if (query && String(a.nr).indexOf(query) === -1 && a.naam.toLowerCase().indexOf(query) === -1) return false;
    return true;
  }

  /* ========================================================================
     8c. MAR-zoekpopup — zoeken op nummer/naam + filteren
     ======================================================================== */

  function openMarModal(scope, row) {
    marModal.open = true;
    marModal.scope = scope;
    marModal.row = row;
    marModal.zoek = "";
    marModal.apko = "";
    marModal.klasse = "";
    marModal.rubriek = "";
    document.getElementById("mar-modal-overlay").hidden = false;
    document.getElementById("mar-modal-zoek").value = "";
    vulKlasseSelect(document.getElementById("mar-modal-klasse"), "");
    vulRubriekSelect(document.getElementById("mar-modal-rubriek"), "", "");
    renderFilterKnoppen("mar-modal-apko-knoppen", marModal.apko);
    renderMarModalLijst();
    setTimeout(function () { document.getElementById("mar-modal-zoek").focus(); }, 0);
  }

  function closeMarModal() {
    marModal.open = false;
    document.getElementById("mar-modal-overlay").hidden = true;
  }

  function renderFilterKnoppen(containerId, actieveWaarde) {
    var knoppen = document.querySelectorAll("#" + containerId + " [data-apko]");
    Array.prototype.forEach.call(knoppen, function (b) {
      b.classList.toggle("actief", b.dataset.apko === actieveWaarde);
    });
  }

  function renderMarModalLijst() {
    var el = document.getElementById("mar-modal-lijst");
    if (!el) return;
    var resultaten = MAR.filter(function (a) { return rekeningPastBijFilter(a, marModal); });
    if (!resultaten.length) {
      el.innerHTML = '<p class="lijst-leeg">Geen rekening gevonden met deze filters.</p>';
      el.scrollTop = 0;
      return;
    }
    el.innerHTML = resultaten
      .map(function (a) {
        return (
          '<div class="mar-modal-item" data-nr="' + a.nr + '">' +
          '<span class="mar-modal-item-nr">' + a.nr + "</span>" +
          '<span class="mar-modal-item-naam">' + escapeAttr(a.naam) + "</span>" +
          '<span class="mar-modal-item-rubriek">' + a.rubriek + "</span>" +
          '<span class="mar-modal-item-apko">' + a.apko + "</span>" +
          "</div>"
        );
      })
      .join("");
    // Na elke filterwijziging terug bovenaan beginnen. Zonder dit bleef de
    // lijst staan waar ze stond en leek een filter "ergens halverwege" uit
    // te komen.
    el.scrollTop = 0;
  }

  function renderTpanel() {
    var lijst = document.getElementById("tpanel-lijst");
    if (!lijst) return;
    var gb = berekenGrootboek();
    var filter = {
      zoek: uiState.tpanelZoek,
      apko: uiState.tpanelApko,
      klasse: uiState.tpanelKlasse,
      rubriek: uiState.tpanelRubriek,
    };
    var heeftFilter = !!(filter.zoek || filter.apko || filter.klasse || filter.rubriek);

    var accounts = MAR
      .filter(function (a) { return rekeningPastBijFilter(a, filter); })
      .map(function (a) {
        var nr = String(a.nr);
        return { nr: nr, mar: a, entry: gb[nr] || { D: [], C: [] } };
      })
      .filter(function (a) {
        var heeftBoekingen = a.entry.D.length > 0 || a.entry.C.length > 0;
        return heeftBoekingen || uiState.tpanelToonLeeg;
      });

    accounts.sort(function (a, b) { return parseInt(a.nr, 10) - parseInt(b.nr, 10); });

    if (!accounts.length) {
      var boodschap;
      if (uiState.tpanelToonLeeg || heeftFilter) boodschap = "Geen rekening gevonden met deze filters.";
      else boodschap = "Nog geen boekingen. Vink <em>lege rekeningen tonen</em> aan als je toch alle rekeningen wil zien.";
      lijst.innerHTML = '<p class="lijst-leeg">' + boodschap + "</p>";
      lijst.scrollTop = 0;
      return;
    }
    lijst.innerHTML = accounts.map(function (a) { return htmlTrekBlok(a.nr, a.mar, a.entry); }).join("");
  }

  /* ========================================================================
     9. Navigatie en voortgang
     ======================================================================== */

  function voortgang() {
    var totaal = OPDRACHTEN.length;
    var klaar = OPDRACHTEN.filter(function (o) {
      return state.boekingen[o.ref] && state.boekingen[o.ref].geboekt;
    }).length;
    return { klaar: klaar, totaal: totaal, percent: totaal ? Math.round((klaar / totaal) * 100) : 0 };
  }

  function renderVoortgang() {
    var v = voortgang();
    var vulling = document.getElementById("voortgang-vulling");
    var tekst = document.getElementById("voortgang-tekst");
    if (vulling) vulling.style.width = v.percent + "%";
    if (tekst) tekst.textContent = v.klaar + " van " + v.totaal + " geboekt";
    var balk = document.getElementById("voortgang");
    if (balk) balk.classList.toggle("voortgang-af", v.klaar === v.totaal && v.totaal > 0);
  }

  function renderNav() {
    var el = document.getElementById("nav-links");
    if (!el) return;
    var html = "";

    html += '<div class="nav-top-item' + (uiState.huidigePagina.type === "start" ? " actief" : "") + '" data-page-type="start">Start</div>';
    html += '<div class="nav-top-item' + (uiState.huidigePagina.type === "saldibalans" ? " actief" : "") + '" data-page-type="saldibalans">Proef- en saldibalans</div>';

    CATEGORIE_VOLGORDE.forEach(function (cat) {
      var items = OPDRACHTEN.filter(function (o) { return o.categorie === cat && !o.verborgenInNav; });
      if (!items.length) return;
      html += '<div class="nav-categorie">' + escapeAttr(cat) + "</div>";
      items.forEach(function (o) {
        var geboekt = state.boekingen[o.ref] && state.boekingen[o.ref].geboekt;
        var actief = uiState.huidigePagina.type === "opdracht" && uiState.huidigePagina.ref === o.ref;
        html += '<div class="nav-link' + (actief ? " actief" : "") + '" data-page-type="opdracht" data-page-ref="' + escapeAttr(o.ref) + '">' +
          "<span>" + escapeAttr(o.navLabel || o.ref) + "</span>" +
          '<span class="status-bolletje' + (geboekt ? " geboekt" : "") + '"></span></div>';
      });
    });

    html += '<div class="nav-categorie">Afsluiten</div>';
    html += '<div class="nav-top-item' + (uiState.huidigePagina.type === "relaties" ? " actief" : "") + '" data-page-type="relaties">Klanten &amp; leveranciers</div>';
    html += '<div class="nav-top-item' + (uiState.huidigePagina.type === "controles" ? " actief" : "") + '" data-page-type="controles">Controles</div>';
    html += '<div class="nav-top-item' + (uiState.huidigePagina.type === "resultaat" ? " actief" : "") + '" data-page-type="resultaat">Resultaatverwerking</div>';

    el.innerHTML = html;
  }

  /* ========================================================================
     10. Alles samen renderen (met focus- en scrollbehoud)
     ======================================================================== */

  function renderPagina() {
    var el = document.getElementById("pagina-inhoud");
    if (!el) return;
    var p = uiState.huidigePagina;
    var html = "";
    if (p.type === "start") html = renderStart();
    else if (p.type === "saldibalans") html = renderSaldibalans();
    else if (p.type === "opdracht") html = renderOpdracht(p.ref);
    else if (p.type === "relaties") html = renderRelaties();
    else if (p.type === "controles") html = renderControles();
    else if (p.type === "resultaat") html = renderResultaat();
    else html = renderStart();
    el.innerHTML = html;
  }

  function metBehoudVanFocus(fn) {
    var actief = document.activeElement;
    var info = null;
    if (actief && actief.dataset && actief.dataset.focusId) {
      info = { id: actief.dataset.focusId, start: actief.selectionStart, end: actief.selectionEnd };
    }
    var main = document.getElementById("main-content");
    var scroll = main ? main.scrollTop : 0;
    var vensterScroll = window.pageYOffset;

    fn();

    if (main) main.scrollTop = scroll;
    if (vensterScroll) window.scrollTo(0, vensterScroll);
    if (info) {
      var el = null;
      try { el = document.querySelector('[data-focus-id="' + CSS.escape(info.id) + '"]'); } catch (e) {}
      if (el) {
        el.focus();
        if (typeof el.setSelectionRange === "function" && info.start !== null && info.start !== undefined) {
          try { el.setSelectionRange(info.start, info.end); } catch (e2) {}
        }
      }
    }
  }

  function renderAlles() {
    metBehoudVanFocus(function () {
      renderNav();
      renderPagina();
    });
    renderTpanel();
    renderVoortgang();
    updateRelatieDatalists();
    updateOpslaanStatus();
  }

  /* ========================================================================
     11. Event handling
     ======================================================================== */

  function opState(scope, rowIdx, veld, waarde) {
    var boeking = boekingVoor(scope);
    var row = boeking.rows[rowIdx];
    if (!row) return;
    row[veld] = waarde;
    // Een klant-/leveranciersnaam hoort enkel bij 400000 en 440000. Wijzigt
    // het rekeningnummer naar iets anders, dan verdwijnt het invulveld — de
    // ingetikte naam mag dan niet onzichtbaar blijven meeslepen, want dan
    // duikt ze later weer op zodra dat nummer opnieuw gebruikt wordt.
    if (veld === "rekening" && !relatieVeldVoorRekening(waarde)) row.relatie = "";
  }

  // Eén of meer aangetikte kaartjes in een vak leggen (of terug in de lijst
  // als vakId leeg is).
  function plaatsKaarten(ids, vakId) {
    if (!ids || !ids.length) return;
    ids.forEach(function (id) {
      if (vakId) state.eindbalans[id] = vakId;
      else delete state.eindbalans[id];
    });
    uiState.gekozenKaarten = [];
    saveState();
    renderAlles();
  }

  function initEvents() {
    var paginaEl = document.getElementById("pagina-inhoud");

    paginaEl.addEventListener("input", function (e) {
      var t = e.target;
      if (t.dataset && t.dataset.scope !== undefined && t.dataset.row !== undefined && t.dataset.field) {
        opState(t.dataset.scope, parseInt(t.dataset.row, 10), t.dataset.field, t.value);
        saveState();
        renderAlles();
        return;
      }
      if (t.dataset && t.dataset.role === "stap-veld") {
        state.resultaat.stap[t.dataset.veld] = t.value;
        saveState();
        renderAlles();
      }
    });

    paginaEl.addEventListener("change", function (e) {
      var t = e.target;
      // Zelfde afhandeling als bij "input": nodig omdat <select>-velden
      // (A/P/K/O, stijgt/daalt, D/C) in sommige browsers enkel "change"
      // vuren. Opnieuw dezelfde waarde wegschrijven is onschadelijk.
      if (t.dataset && t.dataset.scope !== undefined && t.dataset.row !== undefined && t.dataset.field) {
        var waarde = t.value;
        // Bedragen netjes wegschrijven zodra de leerling het veld verlaat:
        // met een punt als duizendtalscheiding. Ze hoeft dat dus niet zelf
        // zo in te tikken — "1250" wordt "1.250".
        if (t.dataset.field === "bedrag") {
          var getal = parseBedrag(waarde);
          if (getal !== null) waarde = formatBedrag(getal);
        }
        opState(t.dataset.scope, parseInt(t.dataset.row, 10), t.dataset.field, waarde);
        saveState();
        renderAlles();
        return;
      }
      if (t.dataset && t.dataset.role === "relatie-select") {
        uiState.relatieKeuze[t.dataset.soort] = t.value;
        renderAlles();
        return;
      }
      if (t.dataset && t.dataset.role === "controle-check") {
        state.controles[t.dataset.controleId] = t.checked;
        saveState();
        renderAlles();
      } else if (t.dataset && t.dataset.role === "slot-check") {
        state.resultaat[t.dataset.veld] = t.checked;
        if (state.resultaat.slotcontroleResultaat && state.resultaat.slotcontroleBalans) {
          var getallen = berekenSlotcontroleGetallen();
          var cijfersKloppen = getallen.resD === getallen.resC && getallen.actD === getallen.pasC;
          if (!alleControlesOk()) {
            state.resultaat.slotcontroleMelding = { type: "fout", tekst: "Er staan nog fouten of openstaande punten in het tabblad Controles. Los die eerst op vóór je de slotcontrole kan afronden." };
            state.resultaat.slotcontroleResultaat = false;
            state.resultaat.slotcontroleBalans = false;
          } else if (!balansAf()) {
            state.resultaat.slotcontroleMelding = { type: "fout", tekst: "Je eindbalans en resultatenrekening bovenaan zijn nog niet af. Zet elke rubriek op haar plaats en zorg dat activa gelijk is aan passiva én kosten aan opbrengsten." };
            state.resultaat.slotcontroleResultaat = false;
            state.resultaat.slotcontroleBalans = false;
          } else if (cijfersKloppen) {
            state.resultaat.slotcontroleMelding = { type: "goed", tekst: "Hoera, je bent er geraakt! Laat de vakexpert dit nog even nakijken, want deze app kan maar beperkte controles doorvoeren. Ondertussen mag jij alvast trots zijn op jezelf!" };
          } else {
            state.resultaat.slotcontroleMelding = { type: "fout", tekst: "Helaas, dat klopt niet. Check je cijfers nog eens." };
            state.resultaat.slotcontroleResultaat = false;
            state.resultaat.slotcontroleBalans = false;
          }
        } else {
          state.resultaat.slotcontroleMelding = null;
        }
        saveState();
        renderAlles();
      }
    });

    paginaEl.addEventListener("click", function (e) {
      var knop = e.target.closest ? e.target.closest("[data-role]") : null;
      if (!knop) return;
      var role = knop.dataset.role;

      if (role === "rij-toevoegen") {
        boekingVoor(knop.dataset.scope).rows.push(maakLegeRij());
        saveState(); renderAlles();
      } else if (role === "verwijder-rij") {
        var b = boekingVoor(knop.dataset.scope);
        b.rows.splice(parseInt(knop.dataset.row, 10), 1);
        if (!b.rows.length) b.rows.push(maakLegeRij());
        saveState(); renderAlles();
      } else if (role === "boeken") {
        var bk = boekingVoor(knop.dataset.scope);
        if (!boekingKlaarOmTeBoeken(bk.rows)) return;
        bk.geboekt = true; saveState(); renderAlles();
      } else if (role === "heropenen") {
        boekingVoor(knop.dataset.scope).geboekt = false;
        saveState(); renderAlles();
      } else if (role === "mar-zoeken") {
        openMarModal(knop.dataset.scope, parseInt(knop.dataset.row, 10));
      } else if (role === "info") {
        openInfoModal(knop.dataset.info);
      } else if (role === "naar-eindbalans") {
        var doel = document.getElementById("paneel-eindbalans");
        if (doel && doel.scrollIntoView) doel.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (role === "ga-naar") {
        uiState.huidigePagina = { type: knop.dataset.pageType };
        renderAlles();
        window.scrollTo(0, 0);
      } else if (role === "kies-relatie") {
        uiState.relatieKeuze[knop.dataset.soort] = knop.dataset.naam;
        renderAlles();
      } else if (role === "kaart-terug") {
        e.stopPropagation();
        plaatsKaarten([knop.dataset.kaart], null);
      } else if (role === "balans-kaart") {
        // Meerdere kaartjes tegelijk mogen: aantikken zet ze in of uit de
        // selectie, daarna volstaat één klik op het juiste vak.
        var id = knop.dataset.kaart;
        var pos = uiState.gekozenKaarten.indexOf(id);
        if (pos === -1) uiState.gekozenKaarten.push(id);
        else uiState.gekozenKaarten.splice(pos, 1);
        renderAlles();
      } else if (role === "balans-vak") {
        if (uiState.gekozenKaarten.length) plaatsKaarten(uiState.gekozenKaarten.slice(), knop.dataset.vak || null);
      } else if (role === "balans-leegmaken") {
        state.eindbalans = {};
        uiState.gekozenKaarten = [];
        saveState(); renderAlles();
      }
    });

    // Slepen van de balanskaartjes. Tikken werkt ook (zie hierboven), zodat
    // dit ook bruikbaar blijft op een tablet zonder drag-ondersteuning.
    paginaEl.addEventListener("dragstart", function (e) {
      var kaart = e.target.closest ? e.target.closest('[data-role="balans-kaart"]') : null;
      if (!kaart) return;
      e.dataTransfer.setData("text/plain", kaart.dataset.kaart);
      e.dataTransfer.effectAllowed = "move";
      kaart.classList.add("sleept");
    });
    paginaEl.addEventListener("dragend", function (e) {
      var kaart = e.target.closest ? e.target.closest('[data-role="balans-kaart"]') : null;
      if (kaart) kaart.classList.remove("sleept");
    });
    paginaEl.addEventListener("dragover", function (e) {
      var vak = e.target.closest ? e.target.closest('[data-role="balans-vak"]') : null;
      if (!vak) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      vak.classList.add("sleep-over");
    });
    paginaEl.addEventListener("dragleave", function (e) {
      var vak = e.target.closest ? e.target.closest('[data-role="balans-vak"]') : null;
      if (vak) vak.classList.remove("sleep-over");
    });
    paginaEl.addEventListener("drop", function (e) {
      var vak = e.target.closest ? e.target.closest('[data-role="balans-vak"]') : null;
      if (!vak) return;
      e.preventDefault();
      vak.classList.remove("sleep-over");
      var id = e.dataTransfer.getData("text/plain");
      plaatsKaarten([id], vak.dataset.vak || null);
    });

    // MAR-zoekpopup: eigen, vaste DOM-elementen buiten #pagina-inhoud, dus
    // die worden niet telkens herbouwd en verliezen geen focus/scrollpositie.
    document.getElementById("mar-modal-zoek").addEventListener("input", function (e) {
      marModal.zoek = e.target.value;
      renderMarModalLijst();
    });
    document.getElementById("mar-modal-apko-knoppen").addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-apko]") : null;
      if (!b) return;
      marModal.apko = b.dataset.apko;
      renderFilterKnoppen("mar-modal-apko-knoppen", marModal.apko);
      renderMarModalLijst();
    });
    document.getElementById("mar-modal-klasse").addEventListener("change", function (e) {
      marModal.klasse = e.target.value;
      marModal.rubriek = "";
      vulRubriekSelect(document.getElementById("mar-modal-rubriek"), marModal.klasse, "");
      renderMarModalLijst();
    });
    document.getElementById("mar-modal-rubriek").addEventListener("change", function (e) {
      marModal.rubriek = e.target.value;
      renderMarModalLijst();
    });
    document.getElementById("mar-modal-lijst").addEventListener("click", function (e) {
      var item = e.target.closest ? e.target.closest(".mar-modal-item") : null;
      if (!item) return;
      opState(marModal.scope, marModal.row, "rekening", item.dataset.nr);
      closeMarModal();
      saveState();
      renderAlles();
    });
    document.getElementById("mar-modal-sluiten").addEventListener("click", closeMarModal);
    document.getElementById("mar-modal-overlay").addEventListener("click", function (e) {
      if (e.target.id === "mar-modal-overlay") closeMarModal();
    });

    // Uitlegvenster
    document.body.addEventListener("click", function (e) {
      var knop = e.target.closest ? e.target.closest('[data-role="info"]') : null;
      if (!knop) return;
      if (document.getElementById("pagina-inhoud").contains(knop)) return; // al afgehandeld
      openInfoModal(knop.dataset.info);
    });
    document.getElementById("info-modal-sluiten").addEventListener("click", sluitInfoModal);
    document.getElementById("info-modal-overlay").addEventListener("click", function (e) {
      if (e.target.id === "info-modal-overlay") sluitInfoModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (marModal.open) closeMarModal();
      sluitInfoModal();
      sluitWissenModal();
    });

    document.getElementById("nav-links").addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest("[data-page-type]") : null;
      if (!t) return;
      var type = t.dataset.pageType;
      uiState.huidigePagina = type === "opdracht" ? { type: type, ref: t.dataset.pageRef } : { type: type };
      document.getElementById("layout").classList.remove("sidebar-open");
      renderAlles();
      document.getElementById("main-content").scrollTop = 0;
      window.scrollTo(0, 0);
    });

    // T-panel
    document.getElementById("tpanel-zoek").addEventListener("input", function (e) {
      uiState.tpanelZoek = e.target.value;
      renderTpanel();
    });
    document.getElementById("tpanel-apko-knoppen").addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-apko]") : null;
      if (!b) return;
      uiState.tpanelApko = b.dataset.apko;
      renderFilterKnoppen("tpanel-apko-knoppen", uiState.tpanelApko);
      renderTpanel();
    });
    document.getElementById("tpanel-klasse").addEventListener("change", function (e) {
      uiState.tpanelKlasse = e.target.value;
      uiState.tpanelRubriek = "";
      vulRubriekSelect(document.getElementById("tpanel-rubriek"), uiState.tpanelKlasse, "");
      renderTpanel();
    });
    document.getElementById("tpanel-rubriek").addEventListener("change", function (e) {
      uiState.tpanelRubriek = e.target.value;
      renderTpanel();
    });
    document.getElementById("tpanel-detail-check").addEventListener("change", function (e) {
      uiState.tpanelDetail = !e.target.checked; // aangevinkt = enkel saldi
      renderTpanel();
    });
    document.getElementById("tpanel-leeg-check").addEventListener("change", function (e) {
      uiState.tpanelToonLeeg = e.target.checked;
      renderTpanel();
    });
    document.getElementById("tpanel-filter-reset").addEventListener("click", function () {
      uiState.tpanelZoek = "";
      uiState.tpanelApko = "";
      uiState.tpanelKlasse = "";
      uiState.tpanelRubriek = "";
      uiState.tpanelToonLeeg = false;
      document.getElementById("tpanel-zoek").value = "";
      document.getElementById("tpanel-leeg-check").checked = false;
      vulKlasseSelect(document.getElementById("tpanel-klasse"), "");
      vulRubriekSelect(document.getElementById("tpanel-rubriek"), "", "");
      renderFilterKnoppen("tpanel-apko-knoppen", "");
      renderTpanel();
    });
    document.getElementById("tpanel-collapse").addEventListener("click", function () {
      document.getElementById("layout").classList.add("tpanel-verborgen");
    });
    // Zonder deze knop waren de T-rekeningen niet meer terug te halen na een
    // klik op «.
    document.getElementById("tpanel-heropen").addEventListener("click", function () {
      document.getElementById("layout").classList.remove("tpanel-verborgen");
    });

    // Topbar: leerlingnaam
    var naamInput = document.getElementById("leerling-naam-input");
    naamInput.addEventListener("keydown", function (e) { if (e.key === "Enter") naamInput.blur(); });
    naamInput.addEventListener("change", function (e) {
      var naam = e.target.value.trim();
      if (!naam) { state = maakLegeState(""); renderAlles(); return; }
      // Als er al werk gedaan was vóór er een naam ingevuld was (en dus nog
      // niet bewaard kon worden), en er bestaat nog geen bewaard bestand
      // voor deze naam: neem dat niet-bewaarde werk over in plaats van het
      // te laten verdwijnen.
      var onbewaardWerk = !state.student && Object.keys(state.boekingen).length ? state : null;
      laadStudent(naam);
      if (onbewaardWerk && !Object.keys(state.boekingen).length) {
        state.boekingen = onbewaardWerk.boekingen;
        state.controles = onbewaardWerk.controles;
        state.resultaat = onbewaardWerk.resultaat;
        state.eindbalans = onbewaardWerk.eindbalans || {};
        state.student = naam;
      }
      saveState();
      renderAlles();
    });

    // Export / import
    document.getElementById("btn-export").addEventListener("click", function () {
      var data = JSON.stringify(state, null, 2);
      var blob = new Blob([data], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      var datum = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = "boekhoudapp_" + slug(state.student) + "_" + datum + ".json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    document.getElementById("btn-import").addEventListener("click", function () {
      document.getElementById("import-file").click();
    });
    document.getElementById("import-file").addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          if (!data || typeof data !== "object" || !("boekingen" in data)) {
            alert("Dit lijkt geen geldig bewaarbestand van deze app te zijn.");
            return;
          }
          state = normaliseerState(data, data.student || "");
          document.getElementById("leerling-naam-input").value = state.student || "";
          saveState();
          renderAlles();
          alert("Bestand geladen.");
        } catch (err) {
          alert("Kon dit bestand niet lezen: " + err.message);
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });

    // Alles wissen — pas na het intikken van het woord "wissen"
    document.getElementById("btn-wissen").addEventListener("click", openWissenModal);
    document.getElementById("wissen-modal-sluiten").addEventListener("click", sluitWissenModal);
    document.getElementById("wissen-annuleer").addEventListener("click", sluitWissenModal);
    document.getElementById("wissen-modal-overlay").addEventListener("click", function (e) {
      if (e.target.id === "wissen-modal-overlay") sluitWissenModal();
    });
    document.getElementById("wissen-bevestig").addEventListener("input", function (e) {
      var goed = e.target.value.trim().toLowerCase() === "wissen";
      document.getElementById("wissen-bevestig-knop").disabled = !goed;
    });
    document.getElementById("wissen-bevestig-knop").addEventListener("click", function () {
      if (document.getElementById("wissen-bevestig").value.trim().toLowerCase() !== "wissen") return;
      wisAlles();
    });

    // Mobiel: menu / T-panel toggles
    document.getElementById("btn-nav-toggle").addEventListener("click", function () {
      document.getElementById("layout").classList.toggle("sidebar-open");
    });
    document.getElementById("btn-tpanel-toggle").addEventListener("click", function () {
      document.getElementById("layout").classList.toggle("tpanel-open");
    });
  }

  function openWissenModal() {
    var veld = document.getElementById("wissen-bevestig");
    veld.value = "";
    document.getElementById("wissen-bevestig-knop").disabled = true;
    document.getElementById("wissen-modal-overlay").hidden = false;
    setTimeout(function () { veld.focus(); }, 0);
  }

  function sluitWissenModal() {
    var overlay = document.getElementById("wissen-modal-overlay");
    if (overlay) overlay.hidden = true;
  }

  function wisAlles() {
    var naam = state.student;
    try {
      if (naam) localStorage.removeItem(storageKeyVoor(naam));
    } catch (e) { console.error(e); }
    state = maakLegeState(naam);
    uiState.huidigePagina = { type: "start" };
    uiState.gekozenKaarten = [];
    uiState.relatieKeuze = { klanten: "", leveranciers: "" };
    laatstBewaardOm = null;
    if (naam) saveState();
    sluitWissenModal();
    renderAlles();
    window.scrollTo(0, 0);
  }

  /* ========================================================================
     12. Opstarten
     ======================================================================== */

  function init() {
    var laatsteNaam = null;
    try { laatsteNaam = localStorage.getItem(LAATSTE_LEERLING_KEY); } catch (e) {}
    if (laatsteNaam) {
      laadStudent(laatsteNaam);
      document.getElementById("leerling-naam-input").value = laatsteNaam;
    }
    vulKlasseSelect(document.getElementById("tpanel-klasse"), "");
    vulRubriekSelect(document.getElementById("tpanel-rubriek"), "", "");
    initEvents();
    renderAlles();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
