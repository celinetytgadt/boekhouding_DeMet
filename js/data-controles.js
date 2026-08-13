// data-controles.js
// Alles wat bij de controles hoort.
// Wijzigt dit per jaar/bundel? Pas het hier aan, niet in app.js.
//
// ---------------------------------------------------------------------------
// CONTROLES STAAN BIJ HUN CATEGORIE
//
// Leerlingen dienen stapsgewijs in, per categorie. Eén grote controlelijst op
// het einde komt dan veel te laat. Daarom krijgt elke controle een veld
// "categorie": de app zet ze dan automatisch op een eigen controlepagina
// onderaan die categorie in het menu.
//
// Een controle hoort bij de categorie waar ze voor het eerst beantwoord kan
// worden — dus bij de láátste stap waarvan ze afhangt. "Zijn de lonen
// uitbetaald?" staat daarom bij de financiële verrichtingen en niet bij de
// loonverwerking: de betaling gebeurt pas op een bankafschrift.
//
// Controles zonder categorie (of met een categorie die niet bestaat) komen
// op de eindcontrole terecht.
// ---------------------------------------------------------------------------

// Welk document toont de app als "laatste bankafschrift" en "laatste
// kasblad", voor de controle van 550000 (bank) en 570000 (kas)?
//
// Laat je laatsteBankRef of laatsteKasRef leeg (of op null), dan zoekt de app
// zelf het hoogst genummerde BANK…- of KAS…-document uit
// data-opdrachten.js. Zo staat er nooit meer een oud afschrift bij deze
// controle als er een bankafschrift bijkomt of wegvalt.
// Wil je toch een vast document opleggen, vul dan de referentie in.
const CONTROLE_CONFIG = {
  laatsteBankRef: null,   // bv. "BANK13" om het vast te zetten
  laatsteKasRef: null,    // bv. "KAS01" om het vast te zetten
  voorraadRef: "VR",
  loonRef: "LOON",
  beginbalansRef: "BB",
  // De aflossingstabel is geen opdracht maar een hulpdocument, dus hier
  // staat rechtstreeks de bestandsnaam uit de map documenten/.
  leningRef: "LENING2",
};

// Rekeningen waarvan de verwachte saldokant afwijkt van de gewone regel
// (actief en kost = debet, passief en opbrengst = credit).
//
// Het gaat om contrarekeningen: rekeningen die in het MAR bij de kosten of de
// opbrengsten staan, maar die er net van afgetrokken worden. Een retour op
// een aankoop is een kostenrekening, maar houdt een creditsaldo over.
//
// Rekeningen die op 9 eindigen (geboekte afschrijvingen, bv. 230009) worden
// al automatisch als contrarekening herkend en hoeven hier niet in te staan.
const SALDO_UITZONDERINGEN = {
  "604010": "C",  // Retours op aankopen (-)
  "604020": "C",  // Handelskorting op aankopen (-)
  "609400": "C",  // Voorraadwijzigingen handelsgoederen — bij een stijgende voorraad
  "704010": "D",  // Retours op verkopen (-)
  "704020": "D",  // Handelskorting op verkopen (-)
};

// Rekeningen die de app helemaal niet op saldokant controleert, omdat meer
// dan één kant een geldig resultaat is.
const SALDO_GEEN_CONTROLE = [
  "580000",  // Interne overboekingen — moet net op 0 komen, apart nagekeken
];

// Extra's per categorie op de controlepagina: een inleidende zin en, bij de
// beginbalans, de invulbalans.
//
// invulbalansVoorRef  toont de sleepoefening met de balans, maar dan enkel
//                     met de rubrieken uit díé ene boeking. Bij "BB" krijgt
//                     de leerling dus exact de openingsbalans te zien, ook
//                     nog in mei — de latere boekingen tellen niet mee.
//                     De plaatsingen zijn dezelfde als op het tabblad
//                     Eindbalans: wat hier gelegd wordt, ligt daar al goed.
const CATEGORIE_CONTROLES = {
  "Beginbalans": {
    inleiding: "Zet de rubrieken van je openingsboeking op hun plaats in de balans. Zo zie je in één oogopslag of je beginbalans klopt met het document. Je toewijzing wordt trouwens bewaard, zo bespaar je alvast wat werk voor de eindbalans.",
    invulbalansVoorRef: "BB",
  },
  "Aankopen": {
    inleiding: "Hieronder vind je één of meerdere controles die je zelf kunt overlopen voor je indient. Bekijk elke controle en check of je er aan voldoet. ",
  },
  "Verkopen": {
    inleiding: "Hieronder vind je één of meerdere controles die je zelf kunt overlopen voor je indient. Bekijk elke controle en check of je er aan voldoet.",
  },
  "Loonverwerking": {
    inleiding: "Hieronder vind je één of meerdere controles die je zelf kunt overlopen voor je indient. Bekijk elke controle en check of je er aan voldoet.",
  },
  "Financiële verrichtingen": {
    inleiding: "Hieronder vind je één of meerdere controles die je zelf kunt overlopen voor je indient. Bekijk elke controle en check of je er aan voldoet. Dit is de grootste controle van de bundel: hier komen kas, bank, de lonen en je klanten en leveranciers samen. Neem er de tijd voor vóór je indient.",
  },
  "BTW-verwerking": {
    inleiding: "Hieronder vind je één of meerdere controles die je zelf kunt overlopen voor je indient. Bekijk elke controle en check of je er aan voldoet.",
  },
  "Eindejaarsverrichtingen": {
    inleiding: "Hieronder vind je één of meerdere controles die je zelf kunt overlopen voor je indient. Bekijk elke controle en check of je er aan voldoet.",
  },
};

// Handmatige controles: de leerling vinkt zelf "in orde" aan, met het
// T-panel en eventueel een klein documentbeeld erbij (§7).
//
// type "check"               gewone ja/nee-vraag
// type "check-met-document"  ja/nee-vraag + klein documentbeeld ernaast
//
// Verplichte velden: id, categorie, type, vraag.
//
// Optionele velden bij elke controle:
//   toelichting  één of enkele zinnen extra uitleg onder de vraag
//   uitleg       sleutel uit data-info.js — zet een i-icoontje bij de vraag
//   filterTip    welke filter er in het T-paneel gezet kan worden om dit na
//                te kijken
//   docConfig    sleutel uit CONTROLE_CONFIG — welk document ernaast komt
//   relatieSoort "klanten" of "leveranciers" — toont onder de vraag een
//                tabelletje met per relatie het bedrag dat nog openstaat
//                (uit het tabblad Klanten & leveranciers), zodat de leerling
//                dat naast het saldo van 400000/440000 in het T-paneel kan
//                leggen zonder van scherm te wisselen
//
// De app toont bewust GEEN saldi bij een controle: dan valt er niets meer na
// te kijken. De leerling zoekt zelf in het T-paneel met de filtertip.
const HANDMATIGE_CONTROLES = [

  /* ---------------- Beginbalans ---------------- */
  {
    id: "beginbalans-klopt",
    categorie: "Beginbalans",
    type: "check-met-document",
    vraag: "Komt de balans die je hierboven gelegd hebt overeen met het document?",
    toelichting: "Vergelijk vak per vak met de beginbalans. Staat er een rubriek op een plaats waar ze niet hoort, of ontbreekt er een bedrag, ga dan terug naar je boeking van BB.",
    docConfig: "beginbalansRef",
  },

  /* ---------------- Aankopen ---------------- */
  {
    id: "aankopen-op-leveranciers",
    categorie: "Aankopen",
    type: "check",
    vraag: "Vind je op 440000 elke aankoopfactuur terug?",
    toelichting: "Open de T-rekening van de leveranciers. Je hoort er de beginbalans en al je aankopen te zien staan: BB, AK01 tot en met AK10. Ontbreekt er één, ga dan terug naar die boeking en kijk na of het bedrag wel op 440000 staat.",
    filterTip: "Filter in het T-paneel op 440000.",
  },

  /* ---------------- Verkopen ---------------- */
  {
    id: "verkopen-op-klanten",
    categorie: "Verkopen",
    type: "check",
    vraag: "Vind je op 400000 elke verkoopfactuur terug?",
    toelichting: "Open de T-rekening van de klanten. Je hoort er de beginbalans en al je verkopen te zien staan: BB, VK01 tot en met VK08 en ONTV01. ",
    filterTip: "Filter in het T-paneel op 400000.",
  },

  /* ---------------- Loonverwerking ---------------- */
  {
    id: "loonkost-totaal",
    categorie: "Loonverwerking",
    type: "check-met-document",
    vraag: "Komt het totaal van je 62-rekeningen overeen met de totale loonkost op de loonstaat?",
    toelichting: "Tel de brutolonen en de patronale RSZ samen. Dat is wat de werkgever écht betaalt, en dat moet gelijk zijn aan de totale loonkost onderaan de loonstaat.",
    docConfig: "loonRef",
    filterTip: "Filter in het T-paneel op rubriek 62.",
  },
  {
    id: "loonschulden-open",
    categorie: "Loonverwerking",
    type: "check",
    vraag: "Staan de nettolonen, de bedrijfsvoorheffing en de RSZ nog als schuld geboekt?",
    toelichting: "De betaling volgt pas bij de bankafschriften. Op dit moment horen deze rekeningen dus nog een creditsaldo te hebben — het bedrijf is dat nog verschuldigd.",
    filterTip: "Filter in het T-paneel op rubriek 45 (negeer de btw- en belastingrekeningen).",
  },

  /* ---------------- Financiële verrichtingen ---------------- */
  {
    id: "banksaldo-klopt",
    categorie: "Financiële verrichtingen",
    type: "check-met-document",
    vraag: "Is het banksaldo op het laatste afschrift gelijk aan het saldo op 550000?",
    docConfig: "laatsteBankRef",
  },
  {
    id: "kassaldo-klopt",
    categorie: "Financiële verrichtingen",
    type: "check-met-document",
    vraag: "Is het kassaldo op het laatste kasblad gelijk aan het saldo op 570000?",
    docConfig: "laatsteKasRef",
  },
  {
    id: "interne-overboekingen-nul",
    categorie: "Financiële verrichtingen",
    type: "check",
    vraag: "Staat 580000 (interne overboekingen) terug op 0?",
    toelichting: "Elke overboeking tussen bank en kas passeert hier, één keer debet en één keer credit. Blijft er iets staan, dan ontbreekt de tegenboeking.",
    filterTip: "Filter in het T-paneel op 580000.",
  },
  {
    id: "lening-lang-kort",
    categorie: "Financiële verrichtingen",
    type: "check-met-document",
    vraag: "Is de lening bij het verkrijgen juist verdeeld over lange en korte termijn?",
    toelichting: "Kijk in de aflossingstabel hoeveel je in 2026 nog moet aflossen. Dat deel hoort bij de schulden op ten hoogste één jaar, de rest bij de schulden op meer dan één jaar. Die verdeling maak je meteen bij het verkrijgen van de lening — niet op het einde van het kwartaal.",
    docConfig: "leningRef",
    filterTip: "Filter in het T-paneel op kredietinstellingen.",
  },
  {
    id: "lonen-uitbetaald",
    categorie: "Financiële verrichtingen",
    type: "check",
    vraag: "Staan de loonschulden terug op 0, nu ze betaald zijn?",
    toelichting: "Bij de loonstaat kwamen het nettoloon, de bedrijfsvoorheffing en de RSZ credit op deze rekeningen. Bij de uitbetaling via de bank gaan ze er debet weer af.",
    filterTip: "Filter in het T-paneel op rubriek 45 (negeer de btw- en belastingrekeningen).",
  },
  {
    id: "klanten-openstaand-klopt",
    categorie: "Financiële verrichtingen",
    type: "check",
    relatieSoort: "klanten",
    vraag: "Is het totaal nog open bij je klanten gelijk aan het saldo op 400000?",
    toelichting: "Het overzicht hieronder komt uit je eigen boekingen op de pagina Klanten & leveranciers. Punt daar ook alles af: elke betaling en creditnota hoort bij een factuur.",
    filterTip: "Filter in het T-paneel op 400000.",
  },
  {
    id: "leveranciers-openstaand-klopt",
    categorie: "Financiële verrichtingen",
    type: "check",
    relatieSoort: "leveranciers",
    vraag: "Is het totaal nog open bij je leveranciers gelijk aan het saldo op 440000?",
    toelichting: "Het overzicht hieronder komt uit je eigen boekingen op de pagina Klanten & leveranciers. Punt daar ook alles af: elke betaling en creditnota hoort bij een factuur.",
    filterTip: "Filter in het T-paneel op 440000.",
  },

  /* ---------------- BTW-verwerking ---------------- */
  {
    id: "btw-tussentijds-leeg",
    categorie: "BTW-verwerking",
    type: "check",
    vraag: "Zijn alle tussentijdse btw-rekeningen leeg?",
    toelichting: "Na de btw-aangifte hoort alle btw samen te staan op 411000 of 451000. De tussentijdse rekeningen (alle 411- en 451-rekeningen die niet op 000 eindigen) moeten dan op nul komen.",
    filterTip: "Filter in het T-paneel op btw.",
  },

  /* ---------------- Eindejaarsverrichtingen ---------------- */
  {
    id: "vaste-activa-nummers",
    categorie: "Eindejaarsverrichtingen",
    type: "check",
    vraag: "Hoort bij elke aanschafwaarde de afschrijving met hetzelfde nummer?",
    toelichting: "Elk soort vast actief heeft twee rekeningen die bij elkaar horen: de aanschafwaarde (bv. 230000) en de geboekte afschrijvingen met hetzelfde basisnummer, eindigend op 9 (230009). Boek je de aankoop van een machine op 230000, dan hoort de afschrijving erop op 230009 — niet op 240009 of 241009. Klopt dat niet, dan lijkt het alsof er een machine afgeschreven wordt die nooit gekocht is.",
    filterTip: "Filter in het T-paneel op klasse 2 (Vaste activa).",
  },
  {
    id: "voorraad-klopt",
    categorie: "Eindejaarsverrichtingen",
    type: "check-met-document",
    vraag: "Klopt de voorraad met de telling?",
    toelichting: "Het saldo van de actiefrekening \"Voorraad handelsgoederen\" moet gelijk zijn aan de waarde van de voorraadtelling hiernaast.",
    docConfig: "voorraadRef",
    filterTip: "Filter in het T-paneel op voorraad.",
  },
];
