/* koppeling.js — Boekhoudapp Kern 8, De MET
 *
 * Alles wat met de Google Sheet praat. Dit bestand staat bewust los van
 * app.js: zonder koppeling (of bij een storing) blijft de app gewoon
 * werken, met de vertrouwde opslag in de browser.
 *
 * Drie dingen gebeuren hier:
 *
 *   1. Aanmelden   de leerling kiest haar naam uit de lijst en tikt haar
 *                  persoonlijke code. De code wordt op de server gecheckt,
 *                  want in dit bestand mag ze niet staan (het is publiek
 *                  leesbaar). Eenmaal goed, onthoudt de browser ze.
 *
 *   2. Bewaren     het volledige werk gaat op de achtergrond naar een map
 *                  in de Drive van de vakexpert. Leerlingen hebben daar
 *                  zelf geen toegang toe: het script draait onder haar
 *                  account en geeft alleen terug wat bij de aanmelding
 *                  hoort. Zo kan een leerling op eender welke computer
 *                  verder werken.
 *
 *   3. Indienen    de leerling kiest zelf welke categorieën ze doorstuurt
 *                  ter nakijking, en haalt achteraf de feedback op.
 *
 * app.js roept hier twee dingen aan, meer niet:
 *   window.KOPPELING_HOOKS.naWijziging()   telkens er bewaard wordt
 *   window.feedbackVoor(ref)               om feedback te tonen
 */

(function () {
  "use strict";

  var cfg = typeof KOPPELING !== "undefined" ? KOPPELING : {};
  var klaslijst = typeof KLASLIJST !== "undefined" ? KLASLIJST : [];

  var AANMELD_KEY = "boekhoudapp_aanmelding";
  var FEEDBACK_KEY_PREFIX = "boekhoudapp_feedback_";

  // Wat de vakexpert als "in orde" aanduidt, gaat op slot: het wordt niet
  // meer meegestuurd bij een volgende inzending. Deze tekst moet exact
  // overeenkomen met BEOORDELINGEN in Code.gs en met IN_ORDE in app.js.
  var IN_ORDE = "In orde";

  // Aanmelding van deze browser: { naam, code }
  var aanmelding = null;
  // Feedback per verrichting, nieuwste eerst:
  // { REF: [ { beoordeling, feedback, ingediend }, … ] }
  var feedback = {};
  // Er is werk gewijzigd sinds de laatste keer bewaren naar de Drive.
  var teBewaren = false;
  var bezigMetBewaren = false;

  /* ======================================================================
     Kleine hulpjes
     ====================================================================== */

  function actief() { return !!cfg.webAppUrl; }

  function normaliseerNaam(n) {
    return String(n || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function status(tekst, soort) {
    var el = document.getElementById("koppeling-status");
    if (!el) return;
    el.textContent = tekst || "";
    el.className = "koppeling-status" + (soort ? " " + soort : "");
  }

  function lees(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function schrijf(key, waarde) {
    try { localStorage.setItem(key, waarde); } catch (e) { /* vol of geblokkeerd */ }
  }

  function datumTekst(iso) {
    if (!iso) return "onbekend";
    var d = new Date(iso);
    if (isNaN(d)) return "onbekend";
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return p(d.getDate()) + "/" + p(d.getMonth() + 1) + " om " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  /* ======================================================================
     Verkeer met de web-app
     ====================================================================== */

  function haal(params) {
    var url = cfg.webAppUrl + "?" + Object.keys(params).map(function (k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    }).join("&");
    return fetch(url, { method: "GET", redirect: "follow" })
      .then(function (r) { return r.json(); });
  }

  // Bewust text/plain: bij application/json stuurt de browser eerst een
  // OPTIONS-verzoek, en daar antwoordt Apps Script niet op. De verzending
  // zou dan altijd stuklopen op CORS.
  function stuur(data) {
    return fetch(cfg.webAppUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
    }).then(function (r) { return r.json(); });
  }

  function metAanmelding(data) {
    data.sleutel = cfg.sleutel;
    data.naam = aanmelding ? aanmelding.naam : "";
    data.code = aanmelding ? aanmelding.code : "";
    return data;
  }

  function foutTekst(antwoord) {
    if (!antwoord) return "geen antwoord van de server";
    if (antwoord.fout === "code") return "die code klopt niet";
    if (antwoord.fout === "naam onbekend") return "die naam staat niet in de klaslijst";
    if (antwoord.fout === "sleutel") return "de app is niet juist ingesteld — verwittig je vakexpert";
    return antwoord.fout || "onbekende fout";
  }

  /* ======================================================================
     Aanmelden
     ====================================================================== */

  function bouwAanmeldUI() {
    var select = document.getElementById("leerling-select");
    var naamInput = document.getElementById("leerling-naam-input");
    var codeVeld = document.getElementById("leerling-code");
    var knop = document.getElementById("btn-aanmelden");
    if (!select || !naamInput) return;

    var metLijst = klaslijst.length > 0;

    // Zonder klaslijst blijft het vrije naamveld van app.js in dienst.
    // Handig zolang er met collega's getest wordt.
    select.hidden = !metLijst;
    codeVeld.hidden = !metLijst;
    knop.hidden = !metLijst;
    naamInput.hidden = metLijst;
    var label = document.querySelector('label[for="leerling-naam-input"]');
    if (label) label.setAttribute("for", metLijst ? "leerling-select" : "leerling-naam-input");
    if (!metLijst) return;

    select.innerHTML = '<option value="">— kies je naam —</option>' +
      klaslijst.map(function (n) { return '<option value="' + esc(n) + '">' + esc(n) + "</option>"; }).join("");

    if (aanmelding) {
      select.value = aanmelding.naam;
      codeVeld.value = aanmelding.code;
    }

    knop.addEventListener("click", meldAan);
    codeVeld.addEventListener("keydown", function (e) { if (e.key === "Enter") meldAan(); });
    select.addEventListener("change", function () { status(""); });
  }

  function meldAan() {
    var naam = document.getElementById("leerling-select").value;
    var code = document.getElementById("leerling-code").value.trim();
    if (!naam) { status("Kies eerst je naam.", "fout"); return; }

    status("Bezig met aanmelden…");
    haal({ actie: "aanmelden", sleutel: cfg.sleutel, naam: naam, code: code })
      .then(function (r) {
        if (!r || !r.ok) { status("Aanmelden lukt niet: " + foutTekst(r), "fout"); return; }
        aanmelding = { naam: r.leerling || naam, code: code };
        schrijf(AANMELD_KEY, JSON.stringify(aanmelding));
        status("Aangemeld.", "ok");
        naAanmelding();
      })
      .catch(function (err) {
        status("Geen verbinding met de server — je werk wordt wel gewoon in deze browser bewaard.", "fout");
        console.error(err);
      });
  }

  /**
   * Na een geslaagde aanmelding: het lokale werk van deze browser en het
   * bewaarde werk in de Drive naast elkaar leggen. Er wordt nooit zomaar
   * overschreven — bij twijfel kiest de leerling zelf.
   */
  function naAanmelding() {
    APP.laadStudent(aanmelding.naam);
    laadFeedbackUitBrowser();
    APP.renderAlles();

    haal(metAanmeldParams({ actie: "werk" }))
      .then(function (r) {
        if (!r || !r.ok) { status(foutTekst(r), "fout"); return; }
        if (!r.gevonden) { status("Aangemeld — nog niets bewaard op de server.", "ok"); startAutoBewaren(); return; }

        var lokaal = APP.getState();
        var lokaalLeeg = !Object.keys(lokaal.boekingen || {}).length;
        var lokaalGewijzigd = lokaal.gewijzigd || null;

        if (lokaalLeeg) { neemOver(r); return; }
        if (lokaalGewijzigd && r.gewijzigd && new Date(lokaalGewijzigd) >= new Date(r.gewijzigd)) {
          status("Aangemeld — je werk op deze computer is het recentste.", "ok");
          startAutoBewaren();
          return;
        }
        toonKeuzeVenster(lokaalGewijzigd, r);
      })
      .catch(function (err) {
        status("Geen verbinding — je werk blijft in deze browser bewaard.", "fout");
        console.error(err);
        startAutoBewaren();
      });

    if (cfg.feedbackBijOpstart) haalFeedback(true);
  }

  function metAanmeldParams(p) {
    p.sleutel = cfg.sleutel;
    p.naam = aanmelding ? aanmelding.naam : "";
    p.code = aanmelding ? aanmelding.code : "";
    return p;
  }

  function neemOver(r) {
    APP.setState(r.state, aanmelding.naam);
    APP.saveState();
    APP.renderAlles();
    status("Je werk is opgehaald (van " + datumTekst(r.gewijzigd) + ").", "ok");
    startAutoBewaren();
  }

  /**
   * Twee versies, en de versie op de server is de jongste. Dat gebeurt als
   * een leerling op een andere computer verder gewerkt heeft. Zelf laten
   * kiezen, met beide datums erbij — nooit stilzwijgend overschrijven.
   */
  function toonKeuzeVenster(lokaalGewijzigd, r) {
    var html =
      "<p>Er staat werk van jou op twee plaatsen, en ze verschillen. Welke wil je verder gebruiken?</p>" +
      '<div class="keuze-blok">' +
      '<button type="button" data-keuze="server" class="btn-keuze">' +
      "<strong>Het werk van de server</strong><span>laatst bewaard op " + esc(datumTekst(r.gewijzigd)) + "</span></button>" +
      '<button type="button" data-keuze="lokaal" class="btn-keuze">' +
      "<strong>Het werk op deze computer</strong><span>laatst bewaard op " + esc(datumTekst(lokaalGewijzigd)) + "</span></button>" +
      "</div>" +
      "<p class=\"keuze-nota\">Twijfel je? Kies het recentste. De andere versie gaat niet verloren: je vakexpert kan ze terugzetten.</p>";

    maakModal("Welke versie wil je?", html, function (venster, sluit) {
      venster.querySelectorAll("[data-keuze]").forEach(function (knop) {
        knop.addEventListener("click", function () {
          if (knop.dataset.keuze === "server") {
            neemOver(r);
          } else {
            status("Je werkt verder met de versie van deze computer.", "ok");
            teBewaren = true;
            startAutoBewaren();
          }
          sluit();
        });
      });
    });
  }

  /* ======================================================================
     Werk bewaren op de server
     ====================================================================== */

  function startAutoBewaren() {
    if (startAutoBewaren.gestart) return;
    startAutoBewaren.gestart = true;
    var ms = Math.max(1, cfg.bewaarIntervalMinuten || 2) * 60000;
    setInterval(function () { bewaarNaarServer(false); }, ms);

    // Wie de laptop dichtklapt of het tabblad sluit, mag niets kwijtspelen.
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") bewaarViaBeacon();
    });
    window.addEventListener("pagehide", bewaarViaBeacon);
  }

  function bewaarNaarServer(altijd) {
    if (!actief() || !aanmelding) return Promise.resolve(false);
    if (!altijd && !teBewaren) return Promise.resolve(false);
    if (bezigMetBewaren) return Promise.resolve(false);

    bezigMetBewaren = true;
    teBewaren = false;
    status("Bezig met bewaren…");

    return stuur(metAanmelding({ actie: "bewaren", state: APP.getState() }))
      .then(function (r) {
        bezigMetBewaren = false;
        if (r && r.ok) { status("Bewaard op de server om " + datumTekst(r.gewijzigd), "ok"); return true; }
        teBewaren = true;
        status("Bewaren lukte niet: " + foutTekst(r), "fout");
        return false;
      })
      .catch(function (err) {
        bezigMetBewaren = false;
        teBewaren = true;   // opnieuw proberen bij de volgende ronde
        status("Even geen verbinding — je werk staat wel veilig in deze browser.", "fout");
        console.error(err);
        return false;
      });
  }

  // Bij het sluiten van het tabblad is er geen tijd meer voor een gewoon
  // verzoek. sendBeacon vertrekt ook als de pagina al aan het afsluiten is.
  function bewaarViaBeacon() {
    if (!actief() || !aanmelding || !teBewaren) return;
    try {
      var pakket = JSON.stringify(metAanmelding({ actie: "bewaren", state: APP.getState() }));
      var blob = new Blob([pakket], { type: "text/plain;charset=utf-8" });
      if (navigator.sendBeacon(cfg.webAppUrl, blob)) teBewaren = false;
    } catch (e) { console.error(e); }
  }

  /* ======================================================================
     Indienen ter nakijking
     ====================================================================== */

  function maakCategorie(naam, refs, geboekt) {
    // Verrichtingen die al in orde bevonden zijn, gaan niet meer mee. Zo
    // hoeft de vakexpert niet telkens hetzelfde opnieuw na te kijken.
    var teSturen = refs.filter(function (r) { return !isInOrde(r); });
    return {
      naam: naam,
      totaal: refs.length,
      geboekt: geboekt,
      inOrde: refs.length - teSturen.length,
      refs: teSturen,
    };
  }

  function categorieOverzicht() {
    var st = APP.getState();
    var lijst = [];

    CATEGORIE_VOLGORDE.forEach(function (cat) {
      var items = OPDRACHTEN.filter(function (o) { return o.categorie === cat; });
      if (!items.length) return;
      var geboekt = items.filter(function (o) {
        var b = st.boekingen[o.ref];
        return b && b.geboekt;
      }).length;
      lijst.push(maakCategorie(cat, items.map(function (o) { return o.ref; }), geboekt));
    });

    var vragen = st.relatieVragen || {};
    lijst.push(maakCategorie("Klanten & leveranciers", ["RELATIES"],
      (vragen.klanten || vragen.leveranciers) ? 1 : 0));

    var resIngevuld = Object.keys(st.resultaat.stap || {}).some(function (k) { return st.resultaat.stap[k]; });
    lijst.push(maakCategorie("Resultaatverwerking", ["RESULTAATVERWERKING"], resIngevuld ? 1 : 0));
    lijst.push(maakCategorie("Eindbalans", ["EINDBALANS"], Object.keys(st.eindbalans || {}).length ? 1 : 0));
    return lijst;
  }

  function openIndienVenster() {
    if (!actief()) { toonMelding("Indienen", "De koppeling met Google Sheets is nog niet ingesteld."); return; }
    if (!aanmelding) {
      toonMelding("Indienen", "Meld je eerst bovenaan aan met je naam en je code.");
      return;
    }

    var overzicht = categorieOverzicht();
    var html =
      '<div class="modal-body">' +
      "<p>Vink aan wat je wil doorsturen. Wat je niet aanvinkt, blijft van jou.</p>" +
      '<div class="indien-lijst">' +
      overzicht.map(function (c) {
        var niets = c.refs.length === 0;
        var af = c.geboekt === c.totaal;
        var telling = niets
          ? "alles in orde"
          : c.geboekt + "/" + c.totaal + " geboekt" + (c.inOrde ? " · " + c.inOrde + " in orde" : "");
        return '<label class="indien-rij' + (niets ? " uit" : "") + '">' +
          '<input type="checkbox" data-cat="' + esc(c.naam) + '"' + (niets ? " disabled" : "") + ">" +
          '<span class="indien-naam">' + esc(c.naam) + "</span>" +
          '<span class="indien-telling' + (niets || af ? " volledig" : "") + '">' + esc(telling) + "</span>" +
          "</label>";
      }).join("") +
      "</div>" +
      '<p class="keuze-nota">Wat je nog niet geboekt hebt, gaat mee als <em>onafgewerkt</em>: zo ziet je ' +
      "vakexpert waar je vastloopt. Wat al in orde is, gaat niet meer mee.</p>" +
      "</div>" +
      '<div class="modal-voet">' +
      '<button type="button" id="btn-indienen-bevestig" class="btn-primair" disabled>Indienen</button>' +
      "</div>";

    maakModal("Indienen ter nakijking", html, function (venster, sluit) {
      var vinkjes = venster.querySelectorAll("[data-cat]");
      var knop = venster.querySelector("#btn-indienen-bevestig");
      vinkjes.forEach(function (v) {
        v.addEventListener("change", function () {
          knop.disabled = !venster.querySelectorAll("[data-cat]:checked").length;
        });
      });
      knop.addEventListener("click", function () {
        var gekozen = [];
        vinkjes.forEach(function (v) { if (v.checked) gekozen.push(v.dataset.cat); });
        dienIn(gekozen, venster);
      });
    });
  }

  // Tijdens het verzenden wordt de inhoud van het venster vervangen door een
  // wachtboodschap, en daarna door een duidelijke bevestiging. De leerling
  // moet zwart op wit zien dat het gelukt is — een klein regeltje bovenaan
  // wordt te makkelijk gemist.
  function dienIn(categorieen, venster) {
    var overzicht = categorieOverzicht();
    var items = [];
    categorieen.forEach(function (cat) {
      var c = overzicht.filter(function (x) { return x.naam === cat; })[0];
      if (!c) return;
      c.refs.forEach(function (ref) { items.push(maakItem(ref, cat)); });
    });

    if (!items.length) {
      zetModalInhoud(venster, htmlMelding("info", "Niets te versturen",
        "In de categorieën die je aanvinkte staat niets meer dat nagekeken moet worden."));
      return;
    }

    zetModalInhoud(venster, htmlBezig("Even geduld, je werk wordt verzonden…"));

    stuur(metAanmelding({ actie: "indienen", items: items }))
      .then(function (r) {
        if (r && r.ok) {
          zetModalInhoud(venster, htmlMelding("ok", "Ingediend",
            "Je stuurde " + r.aantal + " verrichting(en) door. Je vakexpert kijkt ze na; " +
            "klik later op <em>Feedback ophalen</em> om te zien wat ze ervan vond."));
          status("Ingediend om " + datumTekst(new Date().toISOString()), "ok");
          bewaarNaarServer(true);
        } else {
          zetModalInhoud(venster, htmlMelding("fout", "Niet gelukt", esc(foutTekst(r))));
        }
      })
      .catch(function (err) {
        console.error(err);
        zetModalInhoud(venster, htmlMelding("fout", "Geen verbinding",
          "Je werk is niet verzonden. Controleer je internetverbinding en probeer het straks opnieuw. " +
          "Je werk zelf is niet verloren: het staat bewaard."));
      });
  }

  function maakItem(ref, categorie) {
    if (ref === "RESULTAATVERWERKING") return maakResultaatItem(categorie);
    if (ref === "EINDBALANS") return maakBalansItem(categorie);
    if (ref === "RELATIES") return maakRelatieItem(categorie);

    var def = OPDRACHTEN.filter(function (o) { return o.ref === ref; })[0] || {};
    var boeking = APP.getState().boekingen[ref];
    var rows = (boeking && boeking.rows) || [];
    var ingevuld = rows.filter(function (r) {
      return r.bedrag || r.rekening || r.dc || r.redenering;
    });

    var st = "niet begonnen";
    if (boeking && boeking.geboekt) st = "geboekt";
    else if (ingevuld.length) st = "onafgewerkt";

    return {
      ref: ref,
      categorie: categorie,
      titel: def.titel || ref,
      status: st,
      boeking: leesbareBoeking(ingevuld),
      lijnen: ingevuld.map(function (r) {
        var mar = APP.marBij(r.rekening);
        return {
          bedrag: r.bedrag, rekening: r.rekening, omschrijving: mar ? mar.naam : "",
          dc: r.dc, relatie: r.relatie, redenering: r.redenering,
          apko: r.apko, stijgtDaalt: r.stijgtDaalt,
        };
      }),
    };
  }

  // De volledige boeking in één leesbare regel, zodat je in de Sheet niet
  // hoeft door te klikken om te zien wat er staat.
  function leesbareBoeking(rows) {
    if (!rows.length) return "";
    return rows.map(function (r) {
      var mar = APP.marBij(r.rekening);
      var stuk = (r.rekening || "??") + " " + (r.dc || "?") + " " + (r.bedrag || "?");
      if (mar) stuk += " (" + mar.naam + ")";
      if (r.relatie) stuk += " [" + r.relatie + "]";
      return stuk;
    }).join("  ·  ");
  }

  // De twee open vragen over de openstaande facturen. Ze gaan samen door als
  // één verrichting: opsplitsen zou het nakijken alleen maar omslachtiger
  // maken.
  function maakRelatieItem(categorie) {
    var v = APP.getState().relatieVragen || {};
    var stukken = [];
    if (v.klanten) stukken.push("KLANTEN: " + v.klanten);
    if (v.leveranciers) stukken.push("LEVERANCIERS: " + v.leveranciers);

    return {
      ref: "RELATIES",
      categorie: categorie,
      titel: "Klanten & leveranciers",
      status: stukken.length === 2 ? "ingevuld" : (stukken.length ? "onafgewerkt" : "niet begonnen"),
      boeking: stukken.join("  ·  "),
      lijnen: [
        { redenering: "Openstaande facturen van klanten", omschrijving: v.klanten || "" },
        { redenering: "Openstaande facturen van leveranciers", omschrijving: v.leveranciers || "" },
      ],
    };
  }

  function maakResultaatItem(categorie) {
    var st = APP.getState().resultaat || {};
    var stap = st.stap || {};
    var velden = [
      ["Opbrengsten", stap.opbrengsten], ["Kosten", stap.kosten], ["Winst", stap.winst],
      ["Belasting", stap.belasting], ["Winst na belasting", stap.restwinst],
    ].filter(function (v) { return v[1]; });

    return {
      ref: "RESULTAATVERWERKING",
      categorie: categorie,
      titel: "Resultaatverwerking",
      status: velden.length ? "ingevuld" : "niet begonnen",
      boeking: velden.map(function (v) { return v[0] + ": " + v[1]; }).join("  ·  "),
      lijnen: velden.map(function (v) { return { redenering: v[0], bedrag: v[1] }; }),
    };
  }

  function maakBalansItem(categorie) {
    var plaatsing = APP.getState().eindbalans || {};
    var perVak = {};
    Object.keys(plaatsing).forEach(function (rubriek) {
      var vak = plaatsing[rubriek];
      if (!perVak[vak]) perVak[vak] = [];
      perVak[vak].push(rubriek);
    });
    var namen = vakNamen();
    var stukken = Object.keys(perVak).map(function (vak) {
      return (namen[vak] || vak) + ": " + perVak[vak].sort().join(", ");
    });

    return {
      ref: "EINDBALANS",
      categorie: categorie,
      titel: "Eindbalans",
      status: stukken.length ? "ingevuld" : "niet begonnen",
      boeking: stukken.join("  ·  "),
      lijnen: Object.keys(perVak).map(function (vak) {
        return { rekening: namen[vak] || vak, redenering: perVak[vak].sort().join(", ") };
      }),
    };
  }

  function vakNamen() {
    var namen = {};
    Object.keys(BALANS_STRUCTUUR).forEach(function (deel) {
      (BALANS_STRUCTUUR[deel].kolommen || []).forEach(function (kol) {
        (kol.groepen || []).forEach(function (groep) {
          (groep.vakken || []).forEach(function (vak) { namen[vak.id] = vak.naam; });
        });
      });
    });
    return namen;
  }

  /* ======================================================================
     Feedback ophalen en tonen
     ====================================================================== */

  function feedbackKey() {
    return FEEDBACK_KEY_PREFIX + normaliseerNaam(aanmelding ? aanmelding.naam : APP.getState().student);
  }

  function laadFeedbackUitBrowser() {
    feedback = {};
    try {
      var ruw = lees(feedbackKey());
      if (!ruw) return;
      var bewaard = JSON.parse(ruw) || {};
      // Vroeger stond er per verrichting één enkele beoordeling in plaats van
      // een lijst met alle ronden. Oud bewaard werk mag daar niet op vastlopen.
      Object.keys(bewaard).forEach(function (ref) {
        feedback[ref] = Array.isArray(bewaard[ref]) ? bewaard[ref] : [bewaard[ref]];
      });
    } catch (e) { feedback = {}; }
  }

  function haalFeedback(stil) {
    if (!actief() || !aanmelding) {
      if (!stil) toonMelding("Feedback ophalen", "Meld je eerst bovenaan aan met je naam en je code.");
      return;
    }

    var venster = null;
    if (!stil) {
      venster = maakModal("Feedback ophalen", htmlBezig("Even geduld, je feedback wordt opgehaald…"));
    }
    status("Feedback ophalen…");

    haal(metAanmeldParams({ actie: "feedback" }))
      .then(function (r) {
        if (!r || !r.ok) {
          status(foutTekst(r), "fout");
          if (venster) zetModalInhoud(venster.el, htmlMelding("fout", "Niet gelukt", esc(foutTekst(r))));
          return;
        }

        var vorigAantal = tel(feedback);
        var nieuw = {};
        (r.feedback || []).forEach(function (f) {
          if (!nieuw[f.ref]) nieuw[f.ref] = [];
          nieuw[f.ref].push(f);   // de server stuurt ze al nieuwste eerst
        });
        feedback = nieuw;
        schrijf(feedbackKey(), JSON.stringify(feedback));
        APP.renderAlles();

        var aantal = Object.keys(nieuw).length;
        var erbij = tel(nieuw) - vorigAantal;
        status(aantal ? aantal + " verrichting(en) met feedback." : "Nog geen feedback klaar.", "ok");

        if (!venster) return;
        if (!aantal) {
          zetModalInhoud(venster.el, htmlMelding("info", "Nog niets klaar",
            "Je vakexpert heeft je werk nog niet nagekeken, of de feedback staat nog niet vrij. Probeer het later opnieuw."));
        } else {
          zetModalInhoud(venster.el, htmlMelding("ok", "Feedback opgehaald",
            "Er staat feedback bij " + aantal + " verrichting(en)" +
            (erbij > 0 ? ", waarvan " + erbij + " nieuw" : "") +
            ". Je vindt ze bovenaan elke verrichting; in het menu links zie je aan de kleur hoe het ervoor staat."));
        }
      })
      .catch(function (err) {
        console.error(err);
        status("Geen verbinding met de server.", "fout");
        if (venster) zetModalInhoud(venster.el, htmlMelding("fout", "Geen verbinding",
          "De feedback kon niet opgehaald worden. Controleer je internetverbinding en probeer het straks opnieuw."));
      });
  }

  // Hoeveel feedbackronden er in totaal zijn (niet: hoeveel verrichtingen).
  function tel(perRef) {
    return Object.keys(perRef).reduce(function (n, ref) { return n + perRef[ref].length; }, 0);
  }

  // app.js gebruikt dit om de feedback bij de juiste verrichting te tonen.
  // Altijd een lijst, nieuwste eerst.
  window.feedbackVoor = function (ref) {
    return feedback[ref] || [];
  };

  function laatsteBeoordeling(ref) {
    var lijst = feedback[ref];
    return lijst && lijst.length ? String(lijst[0].beoordeling || "") : "";
  }

  function isInOrde(ref) {
    return laatsteBeoordeling(ref) === IN_ORDE;
  }

  /* ======================================================================
     Een venster in de stijl van de app
     ====================================================================== */

  function maakModal(titel, binnenHtml, naOpbouw) {
    var overlay = document.createElement("div");
    overlay.className = "mar-modal-overlay koppeling-overlay";
    overlay.innerHTML =
      '<div class="mar-modal koppeling-modal">' +
      '<div class="mar-modal-header"><strong>' + esc(titel) + "</strong>" +
      '<button type="button" data-role="sluit" title="Sluiten">✕</button></div>' +
      '<div class="koppeling-modal-inhoud">' + binnenHtml + "</div></div>";
    document.body.appendChild(overlay);

    function sluit() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    overlay.querySelector('[data-role="sluit"]').addEventListener("click", sluit);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) sluit(); });
    if (naOpbouw) naOpbouw(overlay, sluit);
    return { el: overlay, sluit: sluit };
  }

  function zetModalInhoud(overlay, html) {
    var vak = overlay.querySelector(".koppeling-modal-inhoud");
    if (!vak) return;
    vak.innerHTML = html;
    var knop = vak.querySelector('[data-role="modal-sluit"]');
    if (knop) {
      knop.addEventListener("click", function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      });
      knop.focus();
    }
  }

  function htmlBezig(tekst) {
    return '<div class="modal-body modal-bezig"><span class="spinner" aria-hidden="true"></span>' +
      "<p>" + esc(tekst) + "</p>" +
      '<p class="keuze-nota">Dat duurt meestal een paar seconden.</p></div>';
  }

  function htmlMelding(soort, titel, tekstHtml) {
    var teken = soort === "ok" ? "✓" : (soort === "fout" ? "!" : "i");
    return '<div class="modal-body modal-melding melding-' + soort + '">' +
      '<div class="melding-teken" aria-hidden="true">' + teken + "</div>" +
      "<h3>" + esc(titel) + "</h3><p>" + tekstHtml + "</p></div>" +
      '<div class="modal-voet"><button type="button" class="btn-primair" data-role="modal-sluit">Sluiten</button></div>';
  }

  function toonMelding(titel, tekstHtml) {
    var v = maakModal(titel, "");
    zetModalInhoud(v.el, htmlMelding("info", titel, tekstHtml));
    return v;
  }

  /* ======================================================================
     Opstarten
     ====================================================================== */

  // app.js meldt hier elke wijziging, zodat we weten dat er iets te bewaren
  // valt. Zonder deze haak zouden we elke twee minuten hetzelfde versturen.
  window.KOPPELING_HOOKS = {
    naWijziging: function () { teBewaren = true; },

  };

  function init() {
    try {
      var ruw = lees(AANMELD_KEY);
      if (ruw) aanmelding = JSON.parse(ruw);
    } catch (e) { aanmelding = null; }

    bouwAanmeldUI();

    var btnIndienen = document.getElementById("btn-indienen");
    var btnFeedback = document.getElementById("btn-feedback");
    if (btnIndienen) btnIndienen.addEventListener("click", openIndienVenster);
    if (btnFeedback) btnFeedback.addEventListener("click", function () { haalFeedback(false); });

    if (!actief()) {
      // Geen koppeling ingesteld: de app werkt zoals vroeger, volledig lokaal.
      if (btnIndienen) btnIndienen.hidden = true;
      if (btnFeedback) btnFeedback.hidden = true;
      return;
    }

    if (aanmelding && aanmelding.naam) {
      naAanmelding();
    } else if (!klaslijst.length && APP.getState().student) {
      // Testopstelling zonder klaslijst: de naam uit het vrije veld volstaat.
      aanmelding = { naam: APP.getState().student, code: "" };
      naAanmelding();
    }
  }

  // Na app.js, zodat window.APP bestaat en de eerste render al gebeurd is.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 0); });
  } else {
    setTimeout(init, 0);
  }
})();
