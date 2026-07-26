// app.js — Boekhoudapp Kern 8
// Alle logica van de app. Inhoud die per jaar/bundel wijzigt staat NIET
// hier, maar in js/data-opdrachten.js, js/data-relaties.js,
// js/data-controles.js en js/mar.js (zie §9 van de specificatie).
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

  function formatBedrag(num) {
    if (num === null || num === undefined || isNaN(num)) return "";
    try {
      return new Intl.NumberFormat("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    } catch (e) {
      return num.toFixed(2).replace(".", ",");
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

  function zoekMar(query) {
    query = (query || "").trim().toLowerCase();
    var lijst = query
      ? MAR.filter(function (a) {
          return String(a.nr).indexOf(query) !== -1 || a.naam.toLowerCase().indexOf(query) !== -1;
        })
      : MAR.slice(0, 10);
    return lijst.slice(0, 10);
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
      },
    };
  }

  var state = maakLegeState("");
  var laatstBewaardOm = null;

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
    state = opgeslagen || maakLegeState(naam);
    state.student = naam;
    if (!state.resultaat) state.resultaat = maakLegeState("").resultaat;
    if (!state.controles) state.controles = {};
    if (!state.boekingen) state.boekingen = {};
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
    sidebarOpen: false,
    tpanelOpen: false,
  };
  var docImgTeller = 0;

  // MAR-zoekpopup (losstaand van de rest, zie §"Redeneerschema-component")
  var marModal = { open: false, scope: null, row: null, zoek: "", apko: "" };

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
        gb[nr][row.dc].push({ bedrag: bedrag, ref: o.ref, relatie: row.relatie || "" });
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

  function rijGeldig(row) {
    var bedrag = parseBedrag(row.bedrag);
    return bedrag !== null && bedrag > 0 && !!row.rekening && !!marBij(row.rekening) && (row.dc === "D" || row.dc === "C");
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

  function verwachteKant(mar) {
    if (!mar) return null;
    var contraAfschrijving = /009$/.test(String(mar.nr));
    if (mar.apko === "A") return contraAfschrijving ? "C" : "D";
    if (mar.apko === "P") return "C";
    if (mar.apko === "K") return "D";
    if (mar.apko === "O") return "C";
    return null;
  }

  function controleReferenties() {
    var gb = state.boekingen;
    var ontbrekend = OPDRACHTEN
      .filter(function (o) { return o.ref !== "DIV06" && o.ref !== "DIV07"; })
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
      // 580000 (interne overboekingen) moet zelf op 0 uitkomen — dat wordt
      // apart gecontroleerd bij "zelf nakijken" en hoort hier niet bij.
      if (nr === "580000") return;
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

  function htmlDocumentAfbeelding(doc, klein) {
    docImgTeller++;
    var missingId = "missing-" + slug(doc) + "-" + docImgTeller;
    var klasse = klein ? "document-klein" : "document-afbeelding";
    return (
      '<img class="' + klasse + '" src="documenten/' + escapeAttr(doc) + '.png" ' +
      'data-doc="' + escapeAttr(doc) + '" data-stap="0" data-missing-id="' + missingId + '" ' +
      'onerror="handleDocFout(this)" alt="Verantwoordingsstuk ' + escapeAttr(doc) + '">' +
      '<div class="document-ontbreekt" id="' + missingId + '" style="display:none">' +
      "Document niet gevonden: documenten/" + escapeAttr(doc) + ".png (of .jpg)</div>"
    );
  }

  /* ========================================================================
     6. Redeneerschema-component (herbruikt voor elke opdracht + DIV06/DIV07)
     ======================================================================== */

  function focusId(ref, rowIdx, veld) { return ref + "__r" + rowIdx + "__" + veld; }

  function relatieVeldVoorRekening(rekening) {
    var nr = marBij(rekening) ? String(marBij(rekening).nr) : "";
    if (nr === "400000") return "klanten";
    if (nr === "440000") return "leveranciers";
    return null;
  }

  function htmlRedeneerschemaRij(ref, row, idx, geboekt) {
    var mar = marBij(row.rekening);
    var omschrijving = mar ? mar.naam : (row.rekening ? "— onbekend rekeningnummer —" : "");
    var relatieSoort = relatieVeldVoorRekening(row.rekening);
    var rekeningFocusId = focusId(ref, idx, "rekening");

    var relatieHtml = "";
    if (relatieSoort) {
      var datalistId = relatieSoort === "klanten" ? "datalist-klanten" : "datalist-leveranciers";
      relatieHtml =
        '<input type="text" class="relatie-input" list="' + datalistId + '" ' +
        'placeholder="' + (relatieSoort === "klanten" ? "naam klant…" : "naam leverancier…") + '" ' +
        'data-focus-id="' + focusId(ref, idx, "relatie") + '" data-scope="' + escapeAttr(ref) + '" data-row="' + idx + '" data-field="relatie" ' +
        'value="' + escapeAttr(row.relatie) + '" ' + (geboekt ? "disabled" : "") + ">";
    }

    return (
      "<tr>" +
      '<td class="kol-bedrag"><input type="text" inputmode="decimal" placeholder="0,00" ' +
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

      '<td class="kol-omschrijving"><input type="text" value="' + escapeAttr(omschrijving) + '" disabled></td>' +

      '<td class="kol-dc"><select data-focus-id="' + focusId(ref, idx, "dc") + '" data-scope="' + escapeAttr(ref) + '" data-row="' + idx + '" data-field="dc" ' + (geboekt ? "disabled" : "") + ">" +
      ["", "D", "C"].map(function (v) { return '<option value="' + v + '"' + (row.dc === v ? " selected" : "") + ">" + (v || "—") + "</option>"; }).join("") +
      "</select></td>" +

      '<td class="kol-verwijder">' + (geboekt ? "" : '<button type="button" class="btn-verwijder-rij" data-scope="' + escapeAttr(ref) + '" data-row="' + idx + '" data-role="verwijder-rij" title="Rij verwijderen">✕</button>') + "</td>" +
      "</tr>"
    );
  }

  function htmlRedeneerschema(ref) {
    var boeking = boekingVoor(ref);
    var geboekt = boeking.geboekt;
    var totalen = berekenTotalen(boeking.rows);
    var gelijk = Math.abs(totalen.totaalDebet - totalen.totaalCredit) < 0.005 && totalen.totaalDebet > 0;
    var klaar = boekingKlaarOmTeBoeken(boeking.rows);

    var html = '<table class="redeneerschema"><thead><tr>' +
      "<th>Bedrag</th><th>Redenering</th><th>A/P/K/O</th><th>Stijgt/daalt</th>" +
      "<th>Rekeningnr.</th><th>Omschrijving</th><th>D/C</th><th></th>" +
      "</tr></thead><tbody>";
    boeking.rows.forEach(function (row, idx) { html += htmlRedeneerschemaRij(ref, row, idx, geboekt); });
    html += "</tbody></table>";

    html += '<div class="redeneerschema-acties">';
    html += '<div>' + (geboekt ? "" : '<button type="button" class="btn-rij-toevoegen" data-scope="' + escapeAttr(ref) + '" data-role="rij-toevoegen">+ rij toevoegen</button>') + "</div>";
    html += '<div class="totalen">' +
      "<span>Totaal debet: <strong>" + formatBedrag(totalen.totaalDebet) + "</strong></span>" +
      "<span>Totaal credit: <strong>" + formatBedrag(totalen.totaalCredit) + "</strong></span>" +
      '<span class="' + (gelijk ? "balans-ok" : "balans-fout") + '">' + (gelijk ? "D = C ✓" : "D ≠ C") + "</span>" +
      "</div>";
    html += "</div>";

    html += '<div style="margin-top:12px;">';
    if (geboekt) {
      html += '<span class="status-geboekt">Geboekt ✓</span> ';
      html += '<button type="button" class="btn-heropenen" data-scope="' + escapeAttr(ref) + '" data-role="heropenen">Heropenen om te wijzigen</button>';
    } else {
      html += '<button type="button" class="btn-boeken" data-scope="' + escapeAttr(ref) + '" data-role="boeken" ' + (klaar ? "" : "disabled") + ">Boeken</button>";
      if (!klaar) html += ' <span style="font-size:12px;color:var(--kleur-tekst-zacht);">kan pas als elke rij volledig is ingevuld en D = C</span>';
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
    html += '<p class="pagina-subtitel">Bedrijfsorganisatie — De MET</p>';
    html += '<div class="paneel">' +
      "<p>Kies links een opdracht. Vul per verantwoordingsstuk het redeneerschema in — je bedrag, je redenering, of het een actief/passief/kost/opbrengst is, of het stijgt of daalt, het rekeningnummer, en zelf of het debet of credit is. De omschrijving bij het rekeningnummer vult de app automatisch aan.</p>" +
      "<p>Rechts staan altijd je T-rekeningen, zodat je die kan gebruiken terwijl je boekt. Boeken kan pas als debet en credit gelijk zijn.</p>" +
      "<p>De app zegt nooit of iets inhoudelijk juist is — dat kijkt je leerkracht na. Ze controleert wel of debet en credit kloppen.</p>" +
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
    html += '<h1 class="pagina-titel">' + escapeAttr(def.titel) + '</h1>';
    html += '<p class="pagina-subtitel">' + escapeAttr(def.categorie) + '</p>';
    if (!def.geenDocument) {
      html += '<div class="paneel"><h2>Verantwoordingsstuk</h2>' + htmlDocumentAfbeelding(def.doc, false) + "</div>";
    }
    if (def.instructie) {
      html += '<div class="paneel" style="border-color:var(--kleur-primair);background:#e9eaf7;"><h2>Uitleg</h2><p>' + escapeAttr(def.instructie) + "</p></div>";
    }
    html += '<div class="paneel"><h2>Redeneerschema</h2>' + htmlRedeneerschema(ref) + "</div>";
    return html;
  }

  function renderControles() {
    var refC = controleReferenties();
    var saldoC = controleSaldoSoort();
    var gb = berekenGrootboek();

    var html = '<h1 class="pagina-titel">Controles</h1>';
    html += '<p class="pagina-subtitel">Rond dit tabblad volledig af vóór je aan de resultaatverwerking (DIV06/DIV07) begint.</p>';

    html += '<div class="paneel"><h2>Automatisch nagekeken</h2>';
    html += '<div class="controle-rij"><div class="controle-vraag">Is elke referentie geboekt?' +
      (refC.ontbrekend.length ? "<ul class='controle-lijst-fouten'>" + refC.ontbrekend.map(function (r) { return "<li>" + r + " nog niet geboekt</li>"; }).join("") + "</ul>" : "") +
      "</div><div class='controle-status-auto " + (refC.ok ? "ok" : "fout") + "'>" + (refC.ok ? "in orde" : "nog niet") + "</div></div>";

    html += '<div class="controle-rij"><div class="controle-vraag">Heeft elke rekening het juiste soort saldo? (afschrijvingsrekeningen op …009 credit, aanschafwaarderekeningen debet, enzovoort)' +
      (saldoC.fouten.length ? "<ul class='controle-lijst-fouten'>" + saldoC.fouten.map(function (f) { return "<li>" + f.nr + " " + escapeAttr(f.naam) + " — verwacht " + f.verwacht + "-saldo, staat nu " + f.actueel + "</li>"; }).join("") + "</ul>" : "") +
      "</div><div class='controle-status-auto " + (saldoC.ok ? "ok" : "fout") + "'>" + (saldoC.ok ? "in orde" : "nog niet") + "</div></div>";
    html += "</div>";

    html += '<div class="paneel"><h2>Zelf nakijken en aanvinken</h2>';
    HANDMATIGE_CONTROLES.forEach(function (c) {
      html += '<div class="controle-rij"><div class="controle-vraag"><label><input type="checkbox" data-role="controle-check" data-controle-id="' + escapeAttr(c.id) + '" ' + (state.controles[c.id] ? "checked" : "") + "> " + escapeAttr(c.vraag) + "</label></div>";
      if (c.type === "check-met-document") {
        html += '<div>' + htmlDocumentAfbeelding(c.doc, true) + "</div>";
      }
      html += "</div>";
    });
    html += "</div>";

    ["400000", "440000"].forEach(function (nr) {
      var mar = marBij(nr);
      var entry = gb[nr];
      html += '<div class="paneel"><h2>Openstaande facturen — ' + nr + " " + escapeAttr(mar ? mar.naam : "") + "</h2>";
      if (!entry || (!entry.D.length && !entry.C.length)) {
        html += "<p>Nog geen boekingen op deze rekening.</p>";
      } else {
        var perRelatie = {};
        entry.D.forEach(function (e) {
          var k = e.relatie || "— niet gekoppeld —";
          perRelatie[k] = perRelatie[k] || { D: 0, C: 0 };
          perRelatie[k].D = round2(perRelatie[k].D + e.bedrag);
        });
        entry.C.forEach(function (e) {
          var k = e.relatie || "— niet gekoppeld —";
          perRelatie[k] = perRelatie[k] || { D: 0, C: 0 };
          perRelatie[k].C = round2(perRelatie[k].C + e.bedrag);
        });
        html += '<table class="openstaand-tabel"><thead><tr><th>Relatie</th><th>Totaal debet</th><th>Totaal credit</th><th>Saldo</th><th>D/C</th></tr></thead><tbody>';
        Object.keys(perRelatie).sort().forEach(function (naam) {
          var r = perRelatie[naam];
          var saldo = round2(r.D - r.C);
          html += "<tr><td>" + escapeAttr(naam) + "</td><td>" + formatBedrag(r.D) + "</td><td>" + formatBedrag(r.C) + "</td>" +
            "<td>" + formatBedrag(Math.abs(saldo)) + "</td><td>" + (Math.abs(saldo) < 0.005 ? "—" : (saldo > 0 ? "D" : "C")) + "</td></tr>";
        });
        html += "</tbody></table>";
      }
      html += "</div>";
    });

    return html;
  }

  function htmlCompactSaldi() {
    var gb = berekenGrootboek();
    var nrs = Object.keys(gb).sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); });
    if (!nrs.length) return "<p>Nog geen boekingen.</p>";
    var html = '<table class="saldibalans"><thead><tr><th>Rekening</th><th>Naam</th><th>Saldo</th><th>D/C</th></tr></thead><tbody>';
    var huidigeKlasse = null;
    var subD = 0, subC = 0;

    function schrijfSubtotaal() {
      if (huidigeKlasse === null) return;
      var netto = round2(subD - subC);
      var kant = Math.abs(netto) < 0.005 ? "—" : (netto > 0 ? "D" : "C");
      html += '<tr class="subtotaal-klasse"><td colspan="2">Subtotaal klasse ' + huidigeKlasse + "</td><td>" + formatBedrag(Math.abs(netto)) + "</td><td>" + kant + "</td></tr>";
    }

    nrs.forEach(function (nr) {
      var mar = marBij(nr);
      var s = saldoVoorEntry(gb[nr]);
      if (!s.kant) return;
      var klasse = mar ? mar.klasse : "?";
      if (klasse !== huidigeKlasse) {
        schrijfSubtotaal();
        huidigeKlasse = klasse;
        subD = 0; subC = 0;
      }
      if (s.kant === "D") subD = round2(subD + s.saldo); else subC = round2(subC + s.saldo);
      html += "<tr><td>" + nr + "</td><td>" + escapeAttr(mar ? mar.naam : "") + "</td><td>" + formatBedrag(s.saldo) + "</td><td>" + s.kant + "</td></tr>";
    });
    schrijfSubtotaal();
    html += "</tbody></table>";
    return html;
  }

  function renderResultaat() {
    var ok = alleControlesOk();
    var html = '<h1 class="pagina-titel">Resultaatverwerking — DIV06 + DIV07</h1>';
    html += '<p class="pagina-subtitel">Vennootschapsbelasting en toewijzing aan overgedragen winst.</p>';

    if (!ok) {
      html += '<div class="paneel" style="border-color:var(--kleur-fout);background:#ffece9;">' +
        "<strong>Rond eerst alle controles af.</strong> Ga naar het tabblad <em>Controles</em>: zolang daar iets ontbreekt of nog niet aangevinkt is, kan je hier nog niet aan verder." +
        "</div>";
      return html;
    }

    html += htmlBannerNaamOntbreekt();

    html += '<div class="paneel"><h2>Compact saldi-overzicht</h2>' + htmlCompactSaldi() + "</div>";

    html += '<div class="paneel"><h2>Stapsgewijze berekening</h2><p style="font-size:12px;color:var(--kleur-tekst-zacht);">Reken dit zelf uit op basis van je eigen boekingen. De app controleert dit niet.</p>';
    var stappen = [
      ["opbrengsten", "1. Hoeveel opbrengsten maakte het bedrijf? (klasse 7)"],
      ["kosten", "2. Hoeveel kosten maakte het bedrijf? (klasse 6)"],
      ["winst", "3. Bereken de winst"],
      ["belasting", "4. Bereken de vennootschapsbelasting (20 %)"],
      ["restwinst", "5. Hoeveel winst blijft er over?"],
    ];
    stappen.forEach(function (s) {
      html += '<div class="stap-rij"><label for="stap-' + s[0] + '">' + s[1] + '</label>' +
        '<input type="text" id="stap-' + s[0] + '" inputmode="decimal" placeholder="0,00" data-focus-id="stap-' + s[0] + '" data-role="stap-veld" data-veld="' + s[0] + '" value="' + escapeAttr(state.resultaat.stap[s[0]]) + '"></div>';
    });
    html += "</div>";

    html += '<div class="paneel"><h2>DIV06 — Vennootschapsbelasting</h2>' + htmlRedeneerschema("DIV06") + "</div>";
    html += '<div class="paneel"><h2>DIV07 — Toewijzing overgedragen winst</h2>' + htmlRedeneerschema("DIV07") + "</div>";

    var getallen = berekenSlotcontroleGetallen();
    html += '<div class="paneel"><h2>Slotcontrole</h2><p style="font-size:12px;color:var(--kleur-tekst-zacht);">De app oordeelt hier niet — kijk zelf na of het klopt en bevestig het.</p>';
    html += '<div class="slotcontrole-vraag"><label><input type="checkbox" data-role="slot-check" data-veld="slotcontroleResultaat" ' + (state.resultaat.slotcontroleResultaat ? "checked" : "") + "> Resultatenrekening in evenwicht (D = C)? — totaal debet klasse 6+7: " + formatBedrag(getallen.resD) + ", totaal credit klasse 6+7: " + formatBedrag(getallen.resC) + "</label></div>";
    html += '<div class="slotcontrole-vraag"><label><input type="checkbox" data-role="slot-check" data-veld="slotcontroleBalans" ' + (state.resultaat.slotcontroleBalans ? "checked" : "") + "> Balans in evenwicht (A = P)? — totaal activa: " + formatBedrag(getallen.actD) + ", totaal passiva: " + formatBedrag(getallen.pasC) + "</label></div>";
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
    var debetInhoud = "";
    var creditInhoud = "";

    if (detail) {
      entry.D.forEach(function (e) { debetInhoud += '<div class="trek-regel"><span class="ref">' + e.ref + "</span><span>" + formatBedrag(e.bedrag) + "</span></div>"; });
      entry.C.forEach(function (e) { creditInhoud += '<div class="trek-regel"><span class="ref">' + e.ref + "</span><span>" + formatBedrag(e.bedrag) + "</span></div>"; });
    } else {
      if (s.totalD > 0) debetInhoud += '<div class="trek-regel"><span>totaal</span><span>' + formatBedrag(s.totalD) + "</span></div>";
      if (s.totalC > 0) creditInhoud += '<div class="trek-regel"><span>totaal</span><span>' + formatBedrag(s.totalC) + "</span></div>";
    }
    if (s.kant === "D") debetInhoud += '<div class="trek-regel trek-saldo-rij"><span>D-saldo</span><span>' + formatBedrag(s.saldo) + "</span></div>";
    if (s.kant === "C") creditInhoud += '<div class="trek-regel trek-saldo-rij"><span>C-saldo</span><span>' + formatBedrag(s.saldo) + "</span></div>";
    if (!debetInhoud) debetInhoud = '<div class="trek-leeg">—</div>';
    if (!creditInhoud) creditInhoud = '<div class="trek-leeg">—</div>';

    return '<div class="trek-blok"><div class="trek-titel"><span>' + nr + " " + escapeAttr(mar.naam) + "</span></div>" +
      '<div class="trek-body"><div class="trek-kant debet">' + debetInhoud + '</div><div class="trek-kant credit">' + creditInhoud + "</div></div></div>";
  }

  // Suggesties voor het relatieveld (klant/leverancier): het optionele
  // startlijstje uit data-relaties.js, aangevuld met namen die de leerling
  // zelf al eerder intikte bij andere boekingen op dezelfde rekening. Zo
  // hoeft data-relaties.js niet bijgehouden te worden telkens er nieuwe
  // documenten met andere klant-/leveranciersnamen bijkomen.
  function verzamelRelatieNamen(soort) {
    var nrDoel = soort === "klanten" ? "400000" : "440000";
    var namen = {};
    (RELATIES[soort] || []).forEach(function (n) { if (n) namen[n] = true; });
    Object.keys(state.boekingen).forEach(function (ref) {
      state.boekingen[ref].rows.forEach(function (row) {
        if (row.relatie && marBij(row.rekening) && String(marBij(row.rekening).nr) === nrDoel) {
          namen[row.relatie] = true;
        }
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
     6b. MAR-zoekpopup — zoeken op nummer/naam + filteren op A/P/K/O
     ======================================================================== */

  function openMarModal(scope, row) {
    marModal.open = true;
    marModal.scope = scope;
    marModal.row = row;
    marModal.zoek = "";
    marModal.apko = "";
    document.getElementById("mar-modal-overlay").hidden = false;
    document.getElementById("mar-modal-zoek").value = "";
    renderMarModalKnoppen();
    renderMarModalLijst();
    setTimeout(function () { document.getElementById("mar-modal-zoek").focus(); }, 0);
  }

  function closeMarModal() {
    marModal.open = false;
    document.getElementById("mar-modal-overlay").hidden = true;
  }

  function renderMarModalKnoppen() {
    var knoppen = document.querySelectorAll("#mar-modal-apko-knoppen [data-apko]");
    knoppen.forEach(function (b) {
      b.classList.toggle("actief", b.dataset.apko === marModal.apko);
    });
  }

  function renderMarModalLijst() {
    var el = document.getElementById("mar-modal-lijst");
    if (!el) return;
    var query = (marModal.zoek || "").trim().toLowerCase();
    var resultaten = MAR.filter(function (a) {
      if (marModal.apko && a.apko !== marModal.apko) return false;
      if (!query) return true;
      return String(a.nr).indexOf(query) !== -1 || a.naam.toLowerCase().indexOf(query) !== -1;
    });
    if (!resultaten.length) {
      el.innerHTML = '<p style="padding:10px;color:var(--kleur-tekst-zacht);font-size:13px;">Geen rekening gevonden.</p>';
      return;
    }
    el.innerHTML = resultaten
      .map(function (a) {
        return (
          '<div class="mar-modal-item" data-nr="' + a.nr + '">' +
          '<span class="mar-modal-item-nr">' + a.nr + "</span>" +
          '<span class="mar-modal-item-naam">' + escapeAttr(a.naam) + "</span>" +
          '<span class="mar-modal-item-apko">' + a.apko + "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderTpanel() {
    var lijst = document.getElementById("tpanel-lijst");
    if (!lijst) return;
    var gb = berekenGrootboek();
    var query = (uiState.tpanelZoek || "").trim().toLowerCase();
    var nrsMetBeweging = Object.keys(gb);
    var accounts;
    if (query) {
      var matches = MAR.filter(function (a) { return String(a.nr).indexOf(query) !== -1 || a.naam.toLowerCase().indexOf(query) !== -1; });
      accounts = matches.map(function (a) { return { nr: String(a.nr), mar: a, entry: gb[String(a.nr)] || { D: [], C: [] } }; });
    } else {
      accounts = nrsMetBeweging.map(function (nr) { return { nr: nr, mar: marBij(nr), entry: gb[nr] }; }).filter(function (a) { return a.mar; });
    }
    accounts.sort(function (a, b) { return parseInt(a.nr, 10) - parseInt(b.nr, 10); });

    if (!accounts.length) {
      lijst.innerHTML = '<p style="font-size:12px;color:var(--kleur-tekst-zacht);padding:6px 2px;">' + (query ? "Geen rekening gevonden." : "Nog geen boekingen.") + "</p>";
      return;
    }
    lijst.innerHTML = accounts.map(function (a) { return htmlTrekBlok(a.nr, a.mar, a.entry); }).join("");
  }

  /* ========================================================================
     9. Navigatie
     ======================================================================== */

  function paginaGelijk(a, b) {
    return a.type === b.type && a.ref === b.ref;
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
          "<span>" + escapeAttr(o.ref === o.titel ? o.ref : o.ref) + "</span>" +
          '<span class="status-bolletje' + (geboekt ? " geboekt" : "") + '"></span></div>';
      });
    });

    html += '<div class="nav-categorie">Afsluiten</div>';
    html += '<div class="nav-top-item' + (uiState.huidigePagina.type === "controles" ? " actief" : "") + '" data-page-type="controles">Controles</div>';
    html += '<div class="nav-top-item' + (uiState.huidigePagina.type === "resultaat" ? " actief" : "") + '" data-page-type="resultaat">Resultaatverwerking</div>';

    el.innerHTML = html;
  }

  /* ========================================================================
     10. Alles samen renderen (met focus-behoud)
     ======================================================================== */

  function renderPagina() {
    var el = document.getElementById("pagina-inhoud");
    if (!el) return;
    var p = uiState.huidigePagina;
    var html = "";
    if (p.type === "start") html = renderStart();
    else if (p.type === "saldibalans") html = renderSaldibalans();
    else if (p.type === "opdracht") html = renderOpdracht(p.ref);
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
    fn();
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
    updateRelatieDatalists();
    updateOpslaanStatus();
  }

  /* ========================================================================
     11. Event handling
     ======================================================================== */

  function opState(scope, rowIdx, veld, waarde) {
    var boeking = boekingVoor(scope);
    if (!boeking.rows[rowIdx]) return;
    boeking.rows[rowIdx][veld] = waarde;
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
      // (A/P/K/O, stijgt/daalt, D/C, relatie) in sommige browsers/situaties
      // enkel "change" vuren en niet "input". Opnieuw dezelfde waarde
      // wegschrijven is onschadelijk.
      if (t.dataset && t.dataset.scope !== undefined && t.dataset.row !== undefined && t.dataset.field) {
        opState(t.dataset.scope, parseInt(t.dataset.row, 10), t.dataset.field, t.value);
        saveState();
        renderAlles();
        return;
      }
      if (t.dataset && t.dataset.role === "controle-check") {
        state.controles[t.dataset.controleId] = t.checked;
        saveState();
        renderAlles();
      } else if (t.dataset && t.dataset.role === "slot-check") {
        state.resultaat[t.dataset.veld] = t.checked;
        saveState();
        renderAlles();
      }
    });

    paginaEl.addEventListener("click", function (e) {
      var t = e.target;
      var role = t.dataset ? t.dataset.role : null;
      if (role === "rij-toevoegen") {
        boekingVoor(t.dataset.scope).rows.push(maakLegeRij());
        saveState(); renderAlles();
      } else if (role === "verwijder-rij") {
        var b = boekingVoor(t.dataset.scope);
        b.rows.splice(parseInt(t.dataset.row, 10), 1);
        if (!b.rows.length) b.rows.push(maakLegeRij());
        saveState(); renderAlles();
      } else if (role === "boeken") {
        var bk = boekingVoor(t.dataset.scope);
        if (boekingKlaarOmTeBoeken(bk.rows)) { bk.geboekt = true; saveState(); renderAlles(); }
      } else if (role === "heropenen") {
        boekingVoor(t.dataset.scope).geboekt = false;
        saveState(); renderAlles();
      } else if (role === "mar-zoeken") {
        openMarModal(t.dataset.scope, parseInt(t.dataset.row, 10));
      }
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
      renderMarModalKnoppen();
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
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && marModal.open) closeMarModal();
    });

    document.getElementById("nav-links").addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest("[data-page-type]") : null;
      if (!t) return;
      var type = t.dataset.pageType;
      uiState.huidigePagina = type === "opdracht" ? { type: type, ref: t.dataset.pageRef } : { type: type };
      uiState.sidebarOpen = false;
      document.getElementById("layout").classList.remove("sidebar-open");
      renderAlles();
      document.getElementById("main-content").scrollTop = 0;
    });

    // T-panel
    document.getElementById("tpanel-zoek").addEventListener("input", function (e) {
      uiState.tpanelZoek = e.target.value;
      renderTpanel();
    });
    document.getElementById("tpanel-detail-check").addEventListener("change", function (e) {
      uiState.tpanelDetail = !e.target.checked; // aangevinkt = enkel saldi
      renderTpanel();
    });
    document.getElementById("tpanel-collapse").addEventListener("click", function () {
      document.getElementById("layout").classList.toggle("tpanel-verborgen");
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
          state = data;
          if (!state.resultaat) state.resultaat = maakLegeState("").resultaat;
          if (!state.controles) state.controles = {};
          if (!state.boekingen) state.boekingen = {};
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

    // Mobiel: menu / T-panel toggles
    document.getElementById("btn-nav-toggle").addEventListener("click", function () {
      document.getElementById("layout").classList.toggle("sidebar-open");
    });
    document.getElementById("btn-tpanel-toggle").addEventListener("click", function () {
      document.getElementById("layout").classList.toggle("tpanel-open");
    });
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
    initEvents();
    renderAlles();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
