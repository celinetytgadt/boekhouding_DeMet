/* koppeling.js — Boekhoudapp Kern 8, De MET
 *
 * Alles wat met de Google Sheet praat. Dit bestand staat bewust los van
 * app.js: zonder koppeling (of bij een storing) blijft de app gewoon
 * werken, met de vertrouwde opslag in de browser.
 *
 * Drie dingen gebeuren hier:
 *
 *   1. Aanmelden   de leerling kiest de eigen naam uit de lijst en tikt de
 *                  persoonlijke code. Die code wordt op de server gecheckt,
 *                  want in dit bestand mag ze niet staan (het is publiek
 *                  leesbaar). Eenmaal goed, onthoudt de browser ze.
 *
 *   2. Bewaren     het volledige werk gaat op de achtergrond naar een map
 *                  in de Drive van de vakexpert. Leerlingen hebben daar
 *                  zelf geen toegang toe: het script draait onder het account
 *                  van de vakexpert en geeft alleen terug wat bij de
 *                  aanmelding hoort. Zo kan een leerling op eender welke
 *                  computer verder werken.
 *
 *   3. Indienen    de leerling kiest zelf welke categorieën doorgestuurd
 *                  worden ter nakijking, en haalt achteraf de feedback op.
 *
 * app.js roept hier twee dingen aan, meer niet:
 *   window.KOPPELING_HOOKS.naWijziging()   telkens er bewaard wordt
 *   window.feedbackVoor(ref)               om feedback te tonen
 */

(function () {
  "use strict";

  var cfg = typeof KOPPELING !== "undefined" ? KOPPELING : {};

  /* De vestigingen uit config-koppeling.js. Elke vestiging heeft een eigen
     Sheet, een eigen web-app-URL en een eigen klaslijst; de app is voor alle
     drie dezelfde. Staat er nog een oude config met één webAppUrl, dan blijft
     die gewoon werken. */
  var vestigingen = (typeof VESTIGINGEN !== "undefined" && VESTIGINGEN && VESTIGINGEN.length)
    ? VESTIGINGEN
    : [{ code: "", naam: "", webAppUrl: cfg.webAppUrl || "", sleutel: cfg.sleutel || "" }];

  // De gekozen vestiging (een object uit de lijst hierboven).
  var vestiging = vestigingen.length === 1 ? vestigingen[0] : null;

  var AANMELD_KEY = "boekhoudapp_aanmelding";
  var FEEDBACK_KEY_PREFIX = "boekhoudapp_feedback_";

  // Wat de vakexpert als "in orde" aanduidt, gaat op slot: het wordt niet
  // meer meegestuurd bij een volgende inzending. Deze tekst moet exact
  // overeenkomen met BEOORDELINGEN in Code.gs en met IN_ORDE in app.js.
  var IN_ORDE = "In orde";

  // Aanmelding van deze browser: { vestiging, naam, code }
  var aanmelding = null;
  // Feedback per verrichting, nieuwste eerst:
  // { REF: [ { beoordeling, feedback, ingediend }, … ] }
  var feedback = {};
  // Er is werk gewijzigd sinds de laatste keer bewaren naar de Drive.
  var teBewaren = false;
  var bezigMetBewaren = false;

  // Wat de vakexpert in de Sheet ingesteld heeft (teksten, links), de taken
  // in Classroom per categorie, en de klaslijst zoals de server ze geeft.
  // Zolang die er niet zijn, valt de app terug op js/data-klas.js en op de
  // standaardteksten in app.js.
  var instellingen = {};
  var taken = {};
  var klasServer = null;        // { code: "LEU", namen: [...] }
  var beheerMogelijk = false;   // is er een expertcode ingesteld?
  var vulNamenFn = null;        // bouwAanmeldUI zet die hier klaar
  var laatsteFeedbackTijd = 0;

  /* ======================================================================
     Kleine hulpjes
     ====================================================================== */

  // De web-app en het sleutelwoord van de gekozen vestiging.
  function webAppUrl() { return (vestiging && vestiging.webAppUrl) || ""; }
  function sleutelwoord() { return (vestiging && vestiging.sleutel) || cfg.sleutel || ""; }

  // Is er iets om mee te praten? actief() kijkt naar de gekozen vestiging,
  // ingesteld() naar de app als geheel (voor de knoppen bovenaan).
  function actief() { return !!webAppUrl(); }
  function ingesteld() {
    return vestigingen.some(function (v) { return !!v.webAppUrl; });
  }

  function vestigingMet(code) {
    for (var i = 0; i < vestigingen.length; i++) {
      if (String(vestigingen[i].code) === String(code)) return vestigingen[i];
    }
    return null;
  }

  function vestigingLabel(v) {
    if (!v) return "";
    return v.naam ? v.naam : v.code;
  }

  // De klaslijst van één vestiging. KLASLIJSTEN staat in data-klas.js; een
  // oude, platte KLASLIJST blijft werken.
  function klaslijstVoor(code) {
    // De Sheet is de enige plaats waar de klaslijst bijgehouden wordt: daar
    // staan de namen én de codes bij elkaar. js/data-klas.js blijft als
    // noodoplossing bestaan voor als de server onbereikbaar is.
    if (klasServer && klasServer.code === code && klasServer.namen.length) {
      return klasServer.namen;
    }
    if (typeof KLASLIJSTEN !== "undefined" && KLASLIJSTEN && KLASLIJSTEN[code]) {
      return KLASLIJSTEN[code] || [];
    }
    return typeof KLASLIJST !== "undefined" ? KLASLIJST : [];
  }

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
    var url = webAppUrl() + "?" + Object.keys(params).map(function (k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    }).join("&");
    return fetch(url, { method: "GET", redirect: "follow" })
      .then(function (r) { return r.json(); });
  }

  // Bewust text/plain: bij application/json stuurt de browser eerst een
  // OPTIONS-verzoek, en daar antwoordt Apps Script niet op. De verzending
  // zou dan altijd stuklopen op CORS.
  function stuur(data) {
    return fetch(webAppUrl(), {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
    }).then(function (r) { return r.json(); });
  }

  function metAanmelding(data) {
    data.sleutel = sleutelwoord();
    data.naam = aanmelding ? aanmelding.naam : "";
    data.code = aanmelding ? aanmelding.code : "";
    return data;
  }

  function foutTekst(antwoord) {
    if (!antwoord) return "geen antwoord van de server";
    if (antwoord.fout === "code") return "die code klopt niet";
    if (antwoord.fout === "naam onbekend") return "die naam staat niet in de klaslijst";
    if (antwoord.fout === "sleutel") {
      return "het sleutelwoord van de app komt niet overeen met dat van het script — " +
        "verwittig je vakexpert (SLEUTEL in Code.gs tegenover sleutel in config-koppeling.js)";
    }
    return antwoord.fout || "onbekende fout";
  }

  /* ======================================================================
     Aanmelden
     ====================================================================== */

  function bouwAanmeldUI() {
    var vestSelect = document.getElementById("vestiging-select");
    var select = document.getElementById("leerling-select");
    var naamInput = document.getElementById("leerling-naam-input");
    var codeVeld = document.getElementById("leerling-code");
    var knop = document.getElementById("btn-aanmelden");
    if (!select || !naamInput) return;

    // De vestigingskeuze verschijnt enkel als er meer dan één is. Bij één
    // vestiging blijft het scherm even eenvoudig als vroeger.
    if (vestSelect) {
      vestSelect.hidden = vestigingen.length < 2;
      if (vestigingen.length > 1) {
        vestSelect.innerHTML = '<option value="">— kies je school —</option>' +
          vestigingen.map(function (v) {
            return '<option value="' + esc(v.code) + '">' + esc(vestigingLabel(v)) + "</option>";
          }).join("");
        if (vestiging) vestSelect.value = vestiging.code;
        vestSelect.addEventListener("change", function () {
          vestiging = vestigingMet(vestSelect.value);
          status("");
          // Elke vestiging heeft haar eigen Sheet, en dus haar eigen
          // klaslijst, teksten en taken.
          instellingen = {}; taken = {}; klasServer = null; beheerMogelijk = false;
          window.INSTELLINGEN = instellingen;
          vulNamen();
          haalInstellingen();
        });
      }
    }

    knop.addEventListener("click", meldAan);
    codeVeld.addEventListener("keydown", function (e) { if (e.key === "Enter") meldAan(); });
    select.addEventListener("change", function () { status(""); });

    vulNamenFn = vulNamen;
    vulNamen();

    /* De namenlijst hangt af van de gekozen vestiging, dus ze wordt telkens
       opnieuw opgebouwd. Zonder klaslijst blijft het vrije naamveld van
       app.js in dienst — handig zolang er met collega's getest wordt. */
    function vulNamen() {
      var lijst = vestiging ? klaslijstVoor(vestiging.code) : [];
      var metLijst = lijst.length > 0;

      select.hidden = !metLijst;
      codeVeld.hidden = !metLijst;
      knop.hidden = !metLijst;
      naamInput.hidden = metLijst;
      var label = document.querySelector('label[for="leerling-naam-input"], label[for="leerling-select"]');
      if (label) label.setAttribute("for", metLijst ? "leerling-select" : "leerling-naam-input");
      if (!metLijst) { select.innerHTML = ""; return; }

      select.innerHTML = '<option value="">— kies je naam —</option>' +
        lijst.map(function (n) { return '<option value="' + esc(n) + '">' + esc(n) + "</option>"; }).join("");

      if (aanmelding && vestiging && aanmelding.vestiging === vestiging.code) {
        select.value = aanmelding.naam;
        codeVeld.value = aanmelding.code;
      } else {
        select.value = "";
        codeVeld.value = "";
      }
    }
  }

  function meldAan() {
    var naam = document.getElementById("leerling-select").value;
    var code = document.getElementById("leerling-code").value.trim();
    if (!vestiging) { status("Kies eerst je school.", "fout"); return; }
    if (!actief()) {
      status("Voor " + vestigingLabel(vestiging) + " is de koppeling nog niet ingesteld — verwittig je vakexpert.", "fout");
      return;
    }
    if (!naam) { status("Kies eerst je naam.", "fout"); return; }

    status("Bezig met aanmelden…");
    haal({ actie: "aanmelden", sleutel: sleutelwoord(), naam: naam, code: code })
      .then(function (r) {
        if (!r || !r.ok) { status("Aanmelden lukt niet: " + foutTekst(r), "fout"); return; }
        aanmelding = { vestiging: vestiging.code, naam: r.leerling || naam, code: code };
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
    // Twee vestigingen kunnen een gelijknamige leerling hebben. De
    // bewaarsleutel in de browser krijgt daarom de code van de vestiging
    // erbij, zodat ze op een gedeelde computer niet in elkaars werk komen.
    if (APP.zetOpslagPrefix) APP.zetOpslagPrefix(aanmelding.vestiging || "");
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
    p.sleutel = sleutelwoord();
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
      "<p class=\"keuze-nota\">Twijfel je? Kies het recentste. De andere versie gaat niet verloren: je vakexpert kan die terugzetten.</p>";

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
      if (navigator.sendBeacon(webAppUrl(), blob)) teBewaren = false;
    } catch (e) { console.error(e); }
  }


  /* ======================================================================
     Instellingen uit de Sheet

     De teksten, de links, de taken in Classroom en de namen van de klaslijst
     staan sinds deze versie in de Google Sheet van de vestiging, en niet
     meer in de bestanden op GitHub. De vakexpert past ze aan in het
     beheertabblad van de app; hier worden ze opgehaald.

     Ze worden opgehaald zodra de vestiging bekend is, dus vóór de leerling
     aangemeld is: de namenlijst is er nu net voor nodig.
     ====================================================================== */

  function haalInstellingen(daarna) {
    if (!actief()) { if (daarna) daarna(); return; }
    var voorVestiging = vestiging.code;
    haal({ actie: "instellingen", sleutel: sleutelwoord() })
      .then(function (r) {
        // Intussen een andere school gekozen? Dan is dit antwoord verouderd.
        if (!vestiging || vestiging.code !== voorVestiging) return;
        if (!r || !r.ok) { if (daarna) daarna(); return; }
        instellingen = r.instellingen || {};
        taken = r.taken || {};
        klasServer = { code: voorVestiging, namen: r.klas || [] };
        beheerMogelijk = !!r.beheerMogelijk;
        window.INSTELLINGEN = instellingen;
        zetTopbarLinks();
        if (vulNamenFn) vulNamenFn();
        APP.renderAlles();
        if (daarna) daarna();
      })
      .catch(function (err) {
        // Onbereikbaar? Dan valt de app terug op js/data-klas.js en op de
        // standaardteksten. Geen foutmelding: de leerling kan hier niets aan
        // doen en de app werkt gewoon verder.
        console.error(err);
        if (daarna) daarna();
      });
  }

  // De knoppen Cursus en Handleiding bovenaan. Staat er geen link ingevuld,
  // dan verdwijnt de knop — beter geen knop dan een knop die niets doet.
  function zetTopbarLinks() {
    [["link-cursus", instellingen.cursusUrl], ["link-handleiding", instellingen.handleidingUrl]]
      .forEach(function (paar) {
        var el = document.getElementById(paar[0]);
        if (!el) return;
        var url = String(paar[1] || "").trim();
        el.hidden = !url;
        if (url) el.href = url;
      });
  }

  /* De link naar de taak in Classroom die bij een categorie hoort. In het
     tabblad Taken van de Sheet staat er één rij per categorie; eindbalans en
     resultaatverwerking delen er één ("Resultaatverwerking & Eindbalans").

     Daar hoort de volledige link uit Classroom in te staan (taak openen → ⋮ →
     Link kopiëren). Staat er iets anders — bv. enkel het ID van de taak — dan
     toont de app de herinnering zonder knop: liever geen knop dan een knop
     die op een foutmelding uitkomt. */
  function taakLink(categorie) {
    var ruw = taken[categorie];
    if (!ruw) {
      var sleutels = Object.keys(taken);
      for (var i = 0; i < sleutels.length; i++) {
        var delen = sleutels[i].split("&").map(function (d) { return d.trim().toLowerCase(); });
        if (delen.indexOf(String(categorie).toLowerCase()) !== -1) { ruw = taken[sleutels[i]]; break; }
      }
    }
    ruw = String(ruw || "").trim();
    return /^https?:\/\//i.test(ruw) ? ruw : "";
  }

  /* Het blokje dat de leerling eraan herinnert dat indienen in de app niet
     hetzelfde is als indienen in Classroom. Zonder ingevulde links blijft de
     herinnering staan, maar dan zonder knoppen. */
  function htmlClassroom(categorieen) {
    var links = [];
    categorieen.forEach(function (cat) {
      var url = taakLink(cat);
      if (!url) return;
      if (links.some(function (l) { return l.url === url; })) return;   // gedeelde taak
      links.push({ cat: cat, url: url });
    });
    var html = '<div class="classroom-blok">' +
      "<p><strong>Dien de taak nu ook in in Classroom.</strong> Je kan dan pas feedback krijgen.</p>";
    if (links.length) {
      html += '<p class="classroom-knoppen">' + links.map(function (l) {
        return '<a class="btn-classroom" href="' + esc(l.url) + '" target="_blank" rel="noopener">' +
          esc(l.cat) + " in Classroom ↗</a>";
      }).join("") + "</p>";
    }
    return html + "</div>";
  }

  /* ======================================================================
     Indienen ter nakijking
     ====================================================================== */

  /* refs   = alles wat bij het indienen meegaat
     telRefs = waarop de tellers "geboekt" en "in orde" slaan: de
               verantwoordingsstukken zelf. Zo staan beide kolommen in het
               indienvenster op dezelfde noemer (7/9 en 6/9). */
  function maakCategorie(naam, refs, geboekt, telRefs) {
    // Verrichtingen die al in orde bevonden zijn, gaan niet meer mee. Zo
    // hoeft de vakexpert niet telkens hetzelfde opnieuw na te kijken.
    var teSturen = refs.filter(function (r) { return !isInOrde(r); });
    var stand = typeof window.controleStandVoor === "function"
      ? window.controleStandVoor(naam)
      : { totaal: 0, af: 0, ok: true };
    var tel = telRefs || refs;
    return {
      naam: naam,
      totaal: tel.length,
      geboekt: geboekt,
      inOrde: tel.filter(function (r) { return isInOrde(r); }).length,
      refs: teSturen,
      controles: stand,
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
      var stukken = items.map(function (o) { return o.ref; });
      var refs = stukken.slice();

      // De pagina Klanten & leveranciers hoort bij één categorie en gaat
      // daar dus in één keer mee, met de twee open vragen erbij. Ze telt ook
      // mee in de twee kolommen: anders zou een categorie 9/9 en 9/9 tonen
      // terwijl die vragen nog openstaan of nog nagekeken moeten worden.
      // "Geboekt" betekent hier: allebei de vragen ingevuld.
      if (cat === CATEGORIE_RELATIES) {
        refs.push("RELATIES");
        stukken.push("RELATIES");
        var vragen = st.relatieVragen || {};
        if (vragen.klanten && vragen.leveranciers) geboekt++;
      }

      // De afvinkjes van de controles gaan bewust NIET mee: dat is
      // zelfcontrole voor de leerling, geen nakijkwerk voor de vakexpert.

      lijst.push(maakCategorie(cat, refs, geboekt, stukken));
    });

    var resIngevuld = Object.keys(st.resultaat.stap || {}).some(function (k) { return st.resultaat.stap[k]; });
    lijst.push(maakCategorie("Resultaatverwerking", ["RESULTAATVERWERKING"], resIngevuld ? 1 : 0));
    lijst.push(maakCategorie("Eindbalans", ["EINDBALANS"], Object.keys(st.eindbalans || {}).length ? 1 : 0));
    return lijst;
  }

  function openIndienVenster() {
    if (!actief()) {
      toonMelding("Indienen", vestiging
        ? "Voor " + esc(vestigingLabel(vestiging)) + " is de koppeling met Google Sheets nog niet ingesteld."
        : "Kies bovenaan eerst je school en meld je aan.");
      return;
    }
    if (!aanmelding) {
      toonMelding("Indienen", "Meld je eerst bovenaan aan met je naam en je code.");
      return;
    }

    var overzicht = categorieOverzicht();
    var html =
      '<div class="modal-body">' +
      "<p>Vink aan wat je wil doorsturen. Wat je niet aanvinkt, blijft van jou.</p>" +
      '<div class="indien-lijst">' +
      // Per categorie precies drie dingen: de naam, hoeveel er geboekt is en
      // hoeveel er al in orde bevonden is — die twee als aparte kolommen,
      // telkens op dezelfde noemer. Wat de leerling zelf afvinkte (de
      // controles) stond hier vroeger ook nog bij, maar dat maakte de rij
      // onleesbaar; die vraag komt nu in de bevestigingsstap.
      '<div class="indien-kop"><span></span><span>geboekt</span><span>in orde</span></div>' +
      overzicht.map(function (c) {
        var niets = c.refs.length === 0;
        return '<label class="indien-rij' + (niets ? " uit" : "") + '">' +
          '<span class="indien-naam">' +
          '<input type="checkbox" data-cat="' + esc(c.naam) + '"' + (niets ? " disabled" : "") + "> " +
          esc(c.naam) + "</span>" +
          '<span class="indien-telling' + (c.geboekt === c.totaal ? " volledig" : "") + '">' +
          c.geboekt + "/" + c.totaal + "</span>" +
          '<span class="indien-inorde' + (c.inOrde === c.totaal ? " volledig" : "") + '">' +
          c.inOrde + "/" + c.totaal + "</span>" +
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
        toonBevestiging(gekozen, venster);
      });
    });
  }

  /* Eén tussenstap vóór het verzenden. Bewust geen blokkade: wie wil
     indienen zonder na te kijken, kan dat. Maar het moet wel een bewuste
     keuze zijn, en niet iets dat per ongeluk gebeurt. */
  function toonBevestiging(categorieen, venster) {
    var overzicht = categorieOverzicht();
    var gekozen = overzicht.filter(function (c) { return categorieen.indexOf(c.naam) !== -1; });
    var open = gekozen.filter(function (c) { return c.controles.totaal && !c.controles.ok; });
    // Categorieën waar een boeking heropend is nadat de controles al
    // afgevinkt waren. De vinkjes blijven staan (zie app.js), maar hier
    // wordt er wel nog eens naar gevraagd.
    var herbekijken = gekozen.filter(function (c) {
      return typeof window.controlesHerbekijkenVoor === "function" &&
        window.controlesHerbekijkenVoor(c.naam);
    });

    var html = '<div class="modal-body">';
    html += "<p>Je dient in: <strong>" + gekozen.map(function (c) { return esc(c.naam); }).join(", ") + "</strong>.</p>";

    if (herbekijken.length) {
      html += '<div class="bevestig-waarschuwing">';
      html += "<p><strong>Heb je de controles hiervan opnieuw nagekeken?</strong></p><ul>";
      herbekijken.forEach(function (c) {
        html += "<li>" + esc(c.naam) + ": je hebt hier een boeking heropend nadat je de controles afvinkte</li>";
      });
      html += "</ul><p>Je vinkjes zijn blijven staan. Kijk op de controlepagina van die categorie " +
        "nog eens na of alles nog klopt met je nieuwe boeking.</p></div>";
    }

    if (open.length) {
      html += '<div class="bevestig-waarschuwing">';
      html += "<p><strong>Je hebt nog niet alles nagekeken.</strong></p><ul>";
      open.forEach(function (c) {
        html += "<li>" + esc(c.naam) + ": " + (c.controles.totaal - c.controles.af) +
          " van de " + c.controles.totaal + " controles nog niet afgevinkt</li>";
      });
      html += "</ul><p>Ga eerst naar de controlepagina van die categorie — daar vind je vaak zelf nog wat er misloopt.</p></div>";
    } else if (!herbekijken.length && gekozen.some(function (c) { return c.controles.totaal; })) {
      html += '<p class="bevestig-ok">✓ Je controles zijn nagekeken.</p>';
    }

    html += '<p class="keuze-nota">Na het indienen kan je gewoon verder werken. Wat je vakexpert daarna "in orde" noemt, gaat op slot. ' +
      "Vergeet daarna de taak ook niet in Classroom in te dienen — anders kan je geen feedback krijgen.</p>";
    html += "</div>";
    html += '<div class="modal-voet">' +
      '<button type="button" class="btn-secundair" data-role="bevestig-terug">Terug</button>' +
      '<button type="button" class="btn-primair" data-role="bevestig-ja">' +
      (open.length || herbekijken.length ? "Toch indienen" : "Ja, indienen") + "</button></div>";

    zetModalInhoud(venster, html);
    venster.querySelector('[data-role="bevestig-terug"]').addEventListener("click", function () {
      // Opnieuw opbouwen met dezelfde keuzes al aangevinkt.
      var sluit = function () { if (venster.parentNode) venster.parentNode.removeChild(venster); };
      sluit();
      openIndienVenster();
      var nieuw = document.querySelector(".koppeling-overlay");
      if (!nieuw) return;
      categorieen.forEach(function (naam) {
        var v = nieuw.querySelector('[data-cat="' + naam.replace(/"/g, '\\"') + '"]');
        if (v && !v.disabled) { v.checked = true; v.dispatchEvent(new Event("change")); }
      });
    });
    venster.querySelector('[data-role="bevestig-ja"]').addEventListener("click", function () {
      dienIn(categorieen, venster);
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
            "Je stuurde " + r.aantal + " verrichting(en) door. Je vakexpert kijkt ze na; de feedback verschijnt " +
            "vanzelf in de app zodra ze vrijgegeven is.",
            htmlClassroom(categorieen)));
          status("Ingediend om " + datumTekst(new Date().toISOString()), "ok");
          // De vraag "heb je dat deel opnieuw nagekeken?" is gesteld en de
          // leerling heeft toch ingediend. Ze blijft dus niet terugkomen.
          if (typeof window.controlesNagekeken === "function") {
            categorieen.forEach(function (cat) { window.controlesNagekeken(cat); });
          }
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

  // De volledige boeking in de Sheet, één boekingslijn per regel — zoals ze
  // in een dagboek staat:
  //
  //     704000    22.000  C
  //     451100     4.320  C
  //     400000    26.320  D  [winkel]
  //
  // Zo lees je de boeking in de kolom zelf en moet je het tabblad Detail
  // enkel nog openen als je wil uitpluizen wát de leerling geredeneerd heeft.
  function leesbareBoeking(rows) {
    if (!rows.length) return "";
    return rows.map(function (r) {
      var regel = (r.rekening || "??") + "  " + bedragTekst(r.bedrag) + "  " + (r.dc || "?");
      if (r.relatie) regel += "  [" + r.relatie + "]";
      return regel;
    }).join("\n");
  }

  // Bedragen in de Sheet zoals de leerling ze op papier zou schrijven:
  // 22.000 en 1.234,50. Wat niet als bedrag te lezen valt, gaat ongewijzigd
  // mee — dan zie je meteen wat er getikt staat.
  function bedragTekst(bedrag) {
    if (bedrag === null || bedrag === undefined || String(bedrag).trim() === "") return "?";
    var n = APP.parseBedrag ? APP.parseBedrag(bedrag) : null;
    if (n === null || isNaN(n)) return String(bedrag);
    return APP.formatBedrag(n);
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
      boeking: stukken.join("\n"),
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
      boeking: velden.map(function (v) { return v[0] + ": " + v[1]; }).join("\n"),
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
      boeking: stukken.join("\n"),
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
    var vest = aanmelding && aanmelding.vestiging ? aanmelding.vestiging + "_" : "";
    return FEEDBACK_KEY_PREFIX + vest +
      normaliseerNaam(aanmelding ? aanmelding.naam : APP.getState().student);
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
    laatsteFeedbackTijd = Date.now();
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

  function htmlMelding(soort, titel, tekstHtml, extraHtml) {
    var teken = soort === "ok" ? "✓" : (soort === "fout" ? "!" : "i");
    return '<div class="modal-body modal-melding melding-' + soort + '">' +
      '<div class="melding-teken" aria-hidden="true">' + teken + "</div>" +
      "<h3>" + esc(titel) + "</h3><p>" + tekstHtml + "</p>" + (extraHtml || "") + "</div>" +
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

  /* Het luikje voor js/beheer.js. Dat bestand bouwt het beheertabblad voor
     de vakexperten; het praat met dezelfde web-app, maar met de expertcode
     in plaats van een leerlingnaam. Ontbreekt beheer.js, dan merkt de app er
     niets van. */
  window.KOPPELING_API = {
    actief: actief,
    ingesteld: ingesteld,
    vestiging: function () { return vestiging; },
    vestigingLabel: function () { return vestigingLabel(vestiging); },
    beheerMogelijk: function () { return beheerMogelijk; },
    haal: function (params) { return haal(params); },
    stuur: function (data) { return stuur(data); },
    sleutel: sleutelwoord,
    herlaadInstellingen: function (daarna) { haalInstellingen(daarna); },
  };

  function init() {
    try {
      var ruw = lees(AANMELD_KEY);
      if (ruw) aanmelding = JSON.parse(ruw);
    } catch (e) { aanmelding = null; }

    // De vestiging van de vorige keer terughalen. Staat ze er niet meer in
    // config-koppeling.js, dan begint de leerling opnieuw met kiezen.
    if (aanmelding && aanmelding.vestiging) {
      vestiging = vestigingMet(aanmelding.vestiging) || vestiging;
      if (!vestiging || vestiging.code !== aanmelding.vestiging) aanmelding = null;
    } else if (aanmelding && vestigingen.length === 1) {
      aanmelding.vestiging = vestigingen[0].code;
    }

    bouwAanmeldUI();

    var btnIndienen = document.getElementById("btn-indienen");
    var btnFeedback = document.getElementById("btn-feedback");
    if (btnIndienen) btnIndienen.addEventListener("click", openIndienVenster);
    if (btnFeedback) btnFeedback.addEventListener("click", function () { haalFeedback(false); });

    if (!ingesteld()) {
      // Geen koppeling ingesteld: de app werkt zoals vroeger, volledig lokaal.
      if (btnIndienen) btnIndienen.hidden = true;
      if (btnFeedback) btnFeedback.hidden = true;
      return;
    }

    // De instellingen (teksten, links, klaslijst, taken) horen bij de
    // vestiging en worden dus opgehaald zodra die bekend is — nog vóór de
    // leerling aangemeld is, want de namenlijst komt er ook uit.
    haalInstellingen();

    // Feedback stil verversen als de leerling terugkomt naar dit tabblad.
    // Hoogstens één keer per twee minuten, en niet terwijl er beheerd wordt.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden || !aanmelding || !actief()) return;
      if (APP.huidigePagina && APP.huidigePagina() === "beheer") return;
      if (Date.now() - laatsteFeedbackTijd < 120000) return;
      haalFeedback(true);
    });

    if (aanmelding && aanmelding.naam && actief()) {
      naAanmelding();
    } else if (vestiging && !klaslijstVoor(vestiging.code).length && APP.getState().student) {
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
