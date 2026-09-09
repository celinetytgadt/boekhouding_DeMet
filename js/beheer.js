/* beheer.js — Boekhoudapp Kern 8, De MET
 *
 * Het tabblad Beheer: wat de vakexperten zelf kunnen instellen zonder dat
 * er iets op GitHub gewijzigd hoeft te worden.
 *
 *   • de namen van de leerlingen van hun vestiging, met hun persoonlijke code
 *   • de link naar de taak in Classroom, per categorie
 *   • de welkomsttekst, een mededeling, en de links naar de cursus en de
 *     handleiding
 *
 * Alles komt terecht in de Google Sheet van díé vestiging (tabbladen Klas,
 * Taken en Instellingen). Elke vestiging heeft dus haar eigen instellingen:
 * wie in Leuven een welkomsttekst zet, verandert niets in Tielt-Winge.
 *
 * Het tabblad gaat pas open met de expertcode. Die wordt op de server
 * gecontroleerd — een controle in dit bestand zou niets waard zijn, want het
 * staat publiek leesbaar op GitHub Pages. Wat de leerling te zien krijgt
 * (namen, teksten, taken) haalt koppeling.js zelf op; de codes van de
 * leerlingen verlaten de Sheet enkel na een geslaagde controle.
 *
 * Dit bestand staat los van app.js en koppeling.js. Laat je het weg, dan
 * verdwijnt het tabblad en werkt de rest gewoon verder.
 */

(function () {
  "use strict";

  // De categorie waar eindbalans en resultaatverwerking samen in zitten: die
  // twee horen in Classroom bij één taak.
  var SAMEN = "Resultaatverwerking & Eindbalans";

  var ontgrendeld = false;
  var expertcode = "";
  var bezig = false;
  var melding = null;     // { soort: "ok" | "fout" | "info", tekst: "…" (platte tekst) }

  // Het element waarop de luisteraars al liggen. app.js bouwt de pagina bij
  // elke wijziging opnieuw op, maar hergebruikt daarvoor altijd hetzelfde
  // #pagina-inhoud. De luisteraars hangen aan dát element en overleven het
  // vervangen van de inhoud — ze mogen er dus maar één keer op.
  var gebondenAan = null;

  // Wat er in de velden staat. Bewust apart van het scherm: app.js bouwt de
  // pagina soms opnieuw op (bv. als er intussen feedback binnenkomt), en dan
  // mag er niets ingetikts verloren gaan.
  var model = { instellingen: {}, taken: [], klas: [] };

  function api() { return window.KOPPELING_API || null; }

  // De luisteraars blijven liggen als de leerling naar een ander tabblad
  // gaat. Ze mogen dan niets doen.
  function opBeheerpagina() {
    return !!(window.APP && window.APP.huidigePagina && window.APP.huidigePagina() === "beheer");
  }

  function zegOk(tekst) { melding = { soort: "ok", tekst: tekst }; }
  function zegFout(tekst) { melding = { soort: "fout", tekst: tekst }; }
  function zegBezig(tekst) { melding = { soort: "info", tekst: tekst }; }

  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function herteken() { window.APP.renderAlles(); }

  /* ======================================================================
     De categorieën waarvoor er een taak in Classroom bestaat

     Ze komen uit data-opdrachten.js, zodat de lijst automatisch meegroeit
     als de bundel verandert. Staat er in de Sheet nog een oude categorie met
     een ingevulde link, dan blijft die onderaan staan: liever een regel te
     veel dan een link die stilletjes verdwijnt.
     ====================================================================== */
  function taakCategorieen() {
    var lijst = (typeof CATEGORIE_VOLGORDE !== "undefined" ? CATEGORIE_VOLGORDE : []).slice();
    lijst.push(SAMEN);
    model.taken.forEach(function (t) {
      if (lijst.indexOf(t.categorie) === -1) lijst.push(t.categorie);
    });
    return lijst;
  }

  function taakVoor(categorie) {
    for (var i = 0; i < model.taken.length; i++) {
      if (model.taken[i].categorie === categorie) return model.taken[i];
    }
    var nieuw = { categorie: categorie, link: "", opmerking: "" };
    model.taken.push(nieuw);
    return nieuw;
  }

  /* ======================================================================
     Het scherm
     ====================================================================== */

  // De tekst wordt hier ontsmet en niet bij het instellen: zo kan een
  // boodschap van de server nooit als HTML in de pagina belanden, ook niet
  // als er later ergens een zeg…() vergeten wordt.
  function htmlMelding() {
    if (!melding) return "";
    return '<p class="beheer-melding beheer-' + melding.soort + '">' + esc(melding.tekst) + "</p>";
  }

  function htmlSlot() {
    var a = api();
    var label = a ? a.vestigingLabel() : "";
    var html = '<h1 class="pagina-titel">Beheer</h1>' +
      '<p class="pagina-subtitel">' + (label ? esc(label) + " — " : "") + "voor vakexperten</p>" +
      '<div class="paneel beheer-slot">' +
      "<p>Hier stel je in wat de leerlingen van jouw vestiging te zien krijgen: " +
      "de namenlijst, de taken in Classroom, de welkomsttekst en de links naar de cursus en de handleiding.</p>";

    // Elke vestiging heeft haar eigen Sheet en dus haar eigen instellingen.
    // Zolang er geen school gekozen is, weet de app niet waar ze moet zijn.
    if (!a || !a.actief()) {
      return html + "<p><strong>Kies eerst bovenaan je school.</strong> De instellingen staan per vestiging apart, " +
        "in de Google Sheet van die school.</p></div>";
    }

    return html +
      "<p>Je hebt er de expertcode voor nodig. Ken je ze niet, vraag ze aan Céline.</p>" +
      '<p class="beheer-rij"><input type="password" data-role="expertcode" placeholder="expertcode" ' +
      'autocomplete="off" value="' + esc(expertcode) + '"> ' +
      '<button type="button" class="btn-primair" data-role="ontgrendel"' + (bezig ? " disabled" : "") + ">" +
      (bezig ? "Even geduld…" : "Openen") + "</button></p>" +
      htmlMelding() +
      "</div>";
  }

  function htmlKlas() {
    var rijen = model.klas.map(function (l, i) {
      return '<tr class="' + (l.weg ? "beheer-weg" : "") + '">' +
        '<td><input type="text" data-role="klas-naam" data-i="' + i + '" value="' + esc(l.naam) + '" ' +
        'placeholder="voornaam + eerste letter achternaam"></td>' +
        '<td class="beheer-code">' + (l.code ? esc(l.code) : '<span class="beheer-nog">wordt aangemaakt</span>') + "</td>" +
        '<td><input type="text" data-role="klas-opm" data-i="' + i + '" value="' + esc(l.opmerking) + '"></td>' +
        '<td><button type="button" class="btn-mini" data-role="klas-weg" data-i="' + i + '" ' +
        'title="' + (l.weg ? "Toch behouden" : "Deze leerling verwijderen") + '">' +
        (l.weg ? "↩" : "✕") + "</button></td></tr>";
    }).join("");

    return '<div class="paneel">' +
      "<h2>Leerlingen</h2>" +
      "<p>Deze namen staan in de keuzelijst bovenaan de app. Elke leerling krijgt automatisch een " +
      "code van vier cijfers; die geef je persoonlijk door, want daarmee komt de leerling aan zijn eigen werk. " +
      "Schrijf de naam zoals de leerling zichzelf zou intikken — hoofdletters, punten en spaties maken niet uit.</p>" +
      '<table class="beheer-tabel beheer-klas">' +
      "<thead><tr><th>naam</th><th>code</th><th>opmerking</th><th></th></tr></thead>" +
      "<tbody>" + (rijen || '<tr><td colspan="4">Nog geen leerlingen.</td></tr>') + "</tbody></table>" +
      '<p class="beheer-rij"><button type="button" data-role="klas-erbij">+ leerling toevoegen</button></p>' +
      "<details><summary>Meerdere namen tegelijk plakken</summary>" +
      "<p>Eén naam per regel. Namen die er al staan, worden overgeslagen.</p>" +
      '<textarea data-role="klas-plak" rows="5" placeholder="Lotte V.&#10;Youssef B."></textarea>' +
      '<p class="beheer-rij"><button type="button" data-role="klas-plak-doen">Toevoegen aan de lijst</button></p>' +
      "</details>" +
      '<p class="keuze-nota">Een leerling verwijderen haalt enkel de naam uit de lijst. Het werk blijft op de ' +
      "Drive staan; zet je de naam er later weer bij, dan krijgt die leerling een nieuwe code maar hetzelfde werk terug.</p>" +
      "</div>";
  }

  function htmlTaken() {
    var rijen = taakCategorieen().map(function (cat) {
      var t = taakVoor(cat);
      return "<tr><th>" + esc(cat) + "</th>" +
        '<td><input type="text" data-role="taak" data-cat="' + esc(cat) + '" value="' + esc(t.link) + '" ' +
        'placeholder="https://classroom.google.com/c/…/a/…/details"></td></tr>';
    }).join("");

    return '<div class="paneel">' +
      "<h2>Taken in Classroom</h2>" +
      "<p>Zodra een leerling een categorie indient, toont de app een knop naar de bijbehorende taak in Classroom, " +
      "met de herinnering dat die daar ook nog ingediend moet worden. Zonder link blijft die herinnering staan, " +
      "maar dan zonder knop.</p>" +
      "<details><summary>Waar vind ik die link?</summary>" +
      "<ol>" +
      "<li>Open in Classroom de klas en het tabblad <em>Klaswerk</em>.</li>" +
      "<li>Klik de taak open.</li>" +
      "<li>Klik rechtsboven op de drie puntjes (⋮) en kies <em>Link kopiëren</em>.</li>" +
      "<li>Plak die link hieronder.</li>" +
      "</ol>" +
      "<p>Zo'n link ziet er ongeveer zo uit: " +
      "<code>https://classroom.google.com/c/NzQyMzE4Mzk2ODVa/a/MjIzMjUyNDA3MTVa/details</code>. " +
      "Het moet de volledige link zijn — enkel het stuk na <code>/a/</code> volstaat niet.</p>" +
      "</details>" +
      '<table class="beheer-tabel beheer-taken"><tbody>' + rijen + "</tbody></table>" +
      '<p class="keuze-nota">Eindbalans en resultaatverwerking horen samen in één taak; de rest staat apart per ' +
      "soort verrichting.</p>" +
      "</div>";
  }

  function veld(sleutel, titel, uitleg, plaatshouder) {
    return '<label class="beheer-veld"><span class="beheer-label">' + esc(titel) + "</span>" +
      '<input type="text" data-role="inst" data-sleutel="' + sleutel + '" value="' +
      esc(model.instellingen[sleutel] || "") + '" placeholder="' + esc(plaatshouder || "") + '">' +
      '<span class="beheer-uitleg">' + uitleg + "</span></label>";
  }

  function htmlTeksten() {
    return '<div class="paneel">' +
      "<h2>Teksten en links</h2>" +
      '<label class="beheer-veld"><span class="beheer-label">Welkomsttekst op de startpagina</span>' +
      '<textarea data-role="inst" data-sleutel="welkomsttekst" rows="10" ' +
      'placeholder="Laat leeg voor de standaardtekst van de app.">' +
      esc(model.instellingen.welkomsttekst || "") + "</textarea>" +
      '<span class="beheer-uitleg">Een lege regel begint een nieuwe alinea. Een link maak je zo: ' +
      "<code>[naar de cursus](https://…)</code>, vet zo: <code>**belangrijk**</code>. " +
      "Laat je dit leeg, dan toont de app haar eigen uitleg over het redeneerschema, de T-rekeningen en het indienen.</span></label>" +

      veld("mededeling", "Mededeling bovenaan elke pagina",
        "Een gekleurd kadertje dat op elk tabblad meekomt, bv. \"Indienen kan tot vrijdag 17 u\". Leeg = geen kader.",
        "Leeg laten als er niets te melden valt") +

      veld("cursusUrl", "Link naar de cursus",
        "Komt als knop <em>Cursus</em> bovenaan te staan, op elk tabblad. Leerlingen die vastzitten kunnen zo meteen opzoeken.",
        "https://…") +

      veld("handleidingUrl", "Link naar de handleiding",
        "Komt als knop <em>Handleiding</em> bovenaan te staan. Leeg = geen knop.",
        "https://…") +
      "</div>";
  }

  function htmlOpen() {
    var a = api();
    return '<h1 class="pagina-titel">Beheer</h1>' +
      '<p class="pagina-subtitel">' + esc(a ? a.vestigingLabel() : "") +
      " — deze instellingen gelden enkel voor deze vestiging</p>" +
      htmlKlas() + htmlTaken() + htmlTeksten() +
      '<div class="paneel beheer-voet">' +
      '<button type="button" class="btn-primair" data-role="bewaren"' + (bezig ? " disabled" : "") + ">" +
      (bezig ? "Bezig met bewaren…" : "Bewaren") + "</button> " +
      '<button type="button" data-role="opnieuw"' + (bezig ? " disabled" : "") + ">Wijzigingen ongedaan maken</button>" +
      htmlMelding() +
      '<p class="keuze-nota">Alles komt in de Google Sheet van deze vestiging terecht, in de tabbladen Klas, ' +
      "Taken en Instellingen. Je kan het daar ook rechtstreeks aanpassen. De leerlingen zien de wijziging zodra " +
      "ze de app opnieuw openen.</p>" +
      "</div>";
  }

  /* ======================================================================
     Praten met de server
     ====================================================================== */

  function ontgrendel(code) {
    var a = api();
    if (bezig) return;                       // dubbelklik of Enter erbovenop
    if (!a || !a.actief()) {
      zegFout("Voor deze vestiging is de koppeling met Google Sheets nog niet ingesteld.");
      herteken();
      return;
    }
    bezig = true;
    zegBezig("Even geduld — het script van Google moet eerst wakker worden. De eerste keer duurt dat vlot tien seconden.");
    herteken();
    a.haal({ actie: "beheer", sleutel: a.sleutel(), expertcode: code })
      .then(function (r) {
        bezig = false;
        if (!r || !r.ok) {
          zegFout(r && r.uitleg ? r.uitleg : "Die code klopt niet.");
          herteken();
          return;
        }
        expertcode = code;
        ontgrendeld = true;
        neemOver(r);
        herteken();
      })
      .catch(function (err) {
        bezig = false;
        console.error(err);
        zegFout(a.foutUitleg(err));
        herteken();
      });
  }

  function neemOver(r) {
    model.instellingen = r.instellingen || {};
    model.taken = (r.taken || []).map(function (t) {
      return { categorie: t.categorie, link: t.link || "", opmerking: t.opmerking || "" };
    });
    model.klas = (r.klas || []).map(function (l) {
      return { naam: l.naam, code: l.code || "", opmerking: l.opmerking || "", weg: false };
    });
  }

  function bewaar() {
    var a = api();
    if (!a || bezig) return;                 // één keer tegelijk, nooit meer
    bezig = true;
    zegBezig("Bezig met bewaren…");
    herteken();

    var klas = model.klas
      .filter(function (l) { return !l.weg && String(l.naam || "").trim(); })
      .map(function (l) { return { naam: l.naam.trim(), code: l.code, opmerking: l.opmerking }; });

    var taken = taakCategorieen().map(function (cat) {
      var t = taakVoor(cat);
      return { categorie: cat, link: String(t.link || "").trim(), opmerking: t.opmerking || "" };
    });

    a.stuur({
      actie: "beheerBewaren",
      sleutel: a.sleutel(),
      expertcode: expertcode,
      instellingen: model.instellingen,
      taken: taken,
      klas: klas,
    })
      .then(function (r) {
        bezig = false;
        if (!r || !r.ok) {
          zegFout(r && r.uitleg ? r.uitleg : "Bewaren lukte niet. Probeer het opnieuw.");
          herteken();
          return;
        }
        // De server geeft de klaslijst terug mét de codes die ze zopas
        // aangemaakt heeft, zodat de expert ze meteen kan doorgeven. De
        // ingetikte teksten en taken blijven staan zoals ze hier staan: wie
        // tijdens het bewaren nog iets wijzigde, mag dat niet kwijtspelen.
        model.klas = (r.klas || klas).map(function (l) {
          return { naam: l.naam, code: l.code || "", opmerking: l.opmerking || "", weg: false };
        });
        // De app zelf (welkomsttekst, knoppen, namenlijst) meteen bijwerken
        // met wat de server terugstuurde. Vroeger werd daarvoor nóg eens
        // opgehaald, en dat verdubbelde de wachttijd bij elke bewaarbeurt.
        a.neemBeheerOver(r);
        zegOk("Bewaard. De leerlingen zien dit zodra ze de app opnieuw openen.");
        herteken();
      })
      .catch(function (err) {
        // Het verzoek is onderweg misgelopen. Dat betekent níét dat er niets
        // bewaard is: Apps Script schrijft gewoon door en laat soms enkel het
        // antwoord vallen. Voor we iets beweren, gaan we in de Sheet kijken.
        console.error(err);
        zegBezig("De verbinding viel weg. Even nakijken of het toch bewaard is…");
        herteken();
        kijkNaOfHetBewaardIs(klas, taken);
      });
  }

  /* Haalt opnieuw op wat er in de Sheet staat en vergelijkt dat met wat we
     net probeerden te bewaren. Staat het er, dan is er niets aan de hand. */
  function kijkNaOfHetBewaardIs(klas, taken) {
    var a = api();
    if (!a) { bezig = false; return; }
    setTimeout(function () {
      a.haal({ actie: "beheer", sleutel: a.sleutel(), expertcode: expertcode })
        .then(function (r) {
          bezig = false;
          if (r && r.ok && komtOvereen(r, klas, taken)) {
            neemOver(r);
            a.neemBeheerOver(r);
            zegOk("Toch bewaard. Het antwoord van de server bleef onderweg steken, maar alles staat in de Sheet.");
          } else {
            zegFout("Bewaren is niet gelukt. Probeer het opnieuw — wat je hier ingevuld hebt, blijft staan.");
          }
          herteken();
        })
        .catch(function (err) {
          bezig = false;
          console.error(err);
          zegFout(a.foutUitleg(err) + " Kijk in de Sheet na of je wijziging er toch staat voor je opnieuw op Bewaren klikt.");
          herteken();
        });
    }, 2000);
  }

  function komtOvereen(r, klas, taken) {
    var namenDaar = (r.klas || []).map(function (l) { return sleutelNaam(l.naam); }).sort().join("|");
    var namenHier = klas.map(function (l) { return sleutelNaam(l.naam); }).sort().join("|");
    if (namenDaar !== namenHier) return false;

    var links = {};
    (r.taken || []).forEach(function (t) { links[t.categorie] = String(t.link || ""); });
    for (var i = 0; i < taken.length; i++) {
      if (String(links[taken[i].categorie] || "") !== String(taken[i].link || "")) return false;
    }
    var inst = r.instellingen || {};
    var sleutels = Object.keys(model.instellingen);
    for (var j = 0; j < sleutels.length; j++) {
      if (String(inst[sleutels[j]] || "") !== String(model.instellingen[sleutels[j]] || "")) return false;
    }
    return true;
  }

  /* ======================================================================
     Wat app.js van dit bestand gebruikt
     ====================================================================== */

  window.BEHEER = {
    // Het tabblad staat er zodra er een koppeling is. Wat erachter zit,
    // wordt op de server afgeschermd met de expertcode.
    beschikbaar: function () {
      var a = api();
      return !!(a && a.ingesteld());
    },

    html: function () {
      return ontgrendeld ? htmlOpen() : htmlSlot();
    },

    naRender: function (el) {
      /* app.js bouwt de pagina telkens opnieuw op, maar altijd binnen
         hetzelfde #pagina-inhoud. De luisteraars hieronder hangen aan dát
         element en blijven dus gewoon liggen als de inhoud vervangen wordt.
         Ze hier elke keer opnieuw leggen betekende dat één klik op Bewaren
         evenveel keer verstuurd werd als de pagina intussen hertekend was —
         bij twintig leerlingen toevoegen dus twintig gelijktijdige verzoeken
         naar Google. Vandaar: één keer binden, en niet meer. */
      if (gebondenAan === el) return;
      gebondenAan = el;

      el.addEventListener("input", function (e) {
        if (!opBeheerpagina()) return;
        var t = e.target;
        var rol = t.dataset && t.dataset.role;
        if (rol === "expertcode") { expertcode = t.value; return; }
        if (rol === "inst") { model.instellingen[t.dataset.sleutel] = t.value; return; }
        if (rol === "taak") { taakVoor(t.dataset.cat).link = t.value; return; }
        if (rol === "klas-naam") { model.klas[+t.dataset.i].naam = t.value; return; }
        if (rol === "klas-opm") { model.klas[+t.dataset.i].opmerking = t.value; return; }
      });

      el.addEventListener("keydown", function (e) {
        if (!opBeheerpagina()) return;
        if (e.key === "Enter" && e.target.dataset && e.target.dataset.role === "expertcode") {
          ontgrendel(e.target.value.trim());
        }
      });

      el.addEventListener("click", function (e) {
        if (!opBeheerpagina()) return;
        var knop = e.target.closest ? e.target.closest("[data-role]") : null;
        if (!knop || knop.tagName !== "BUTTON") return;
        var rol = knop.dataset.role;

        if (rol === "ontgrendel") {
          var veldje = el.querySelector('[data-role="expertcode"]');
          ontgrendel(veldje ? veldje.value.trim() : "");
          return;
        }
        if (rol === "klas-erbij") {
          model.klas.push({ naam: "", code: "", opmerking: "", weg: false });
          herteken();
          // Meteen in het nieuwe veld staan: anders is het toevoegen van
          // twintig namen twintig keer klikken en scrollen.
          var velden = document.querySelectorAll('[data-role="klas-naam"]');
          if (velden.length) velden[velden.length - 1].focus();
          return;
        }
        if (rol === "klas-weg") {
          var l = model.klas[+knop.dataset.i];
          if (l) l.weg = !l.weg;
          herteken();
          return;
        }
        if (rol === "klas-plak-doen") {
          var vak = el.querySelector('[data-role="klas-plak"]');
          if (!vak) return;
          var bestaand = {};
          model.klas.forEach(function (x) { bestaand[sleutelNaam(x.naam)] = true; });
          vak.value.split(/\r?\n/).forEach(function (regel) {
            var naam = regel.trim();
            if (!naam || bestaand[sleutelNaam(naam)]) return;
            bestaand[sleutelNaam(naam)] = true;
            model.klas.push({ naam: naam, code: "", opmerking: "", weg: false });
          });
          vak.value = "";
          melding = null;
          herteken();
          return;
        }
        if (rol === "bewaren") { bewaar(); return; }
        if (rol === "opnieuw") { ontgrendel(expertcode); return; }
      });
    },
  };

  function sleutelNaam(n) {
    return String(n || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }
})();
