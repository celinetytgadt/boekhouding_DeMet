// data-info.js
// De teksten achter de i-icoontjes in de app. Wil je de uitleg anders
// formuleren, dan hoeft enkel dit bestand aangepast te worden.
//
// Per sleutel: een titel en een lijst regels. Een regel is ofwel gewone
// tekst, ofwel { kop: "…" } voor een tussentitel, ofwel { stap: "…" } voor
// een genummerde stap.

const INFO_TEKSTEN = {
  redeneerschema: {
    titel: "Hoe vul je een redeneerschema in?",
    regels: [
      "Werk per bedrag dat op het document staat. Elk bedrag krijgt een eigen lijn.",
      { kop: "Stap voor stap" },
      { stap: "Bedrag — neem het bedrag over van het verantwoordingsstuk." },
      { stap: "Redenering — schrijf in je eigen woorden wat er gebeurt, bijvoorbeeld \"we kopen handelsgoederen op krediet\"." },
      { stap: "A/P/K/O — is dat een actief, een passief, een kost of een opbrengst?" },
      { stap: "Stijgt/daalt — wordt dat door deze verrichting meer of minder?" },
      { stap: "Rekeningnr. — zoek de rekening in het MAR. Klik op het vergrootglas als je het nummer niet vanbuiten kent." },
      { stap: "D/C — beslis zelf of het debet of credit komt. De app zegt niet of je juist zit." },
      { kop: "De regel die je nodig hebt" },
      "Een actief of een kost die stijgt komt debet, die daalt komt credit.",
      "Een passief of een opbrengst die stijgt komt credit, die daalt komt debet.",
      { kop: "Voor je op Boeken klikt" },
      "Totaal debet en totaal credit moeten gelijk zijn, en elke lijn moet volledig ingevuld zijn. Staat er iets onvolledig, dan kleurt die lijn en zie je onderaan wat er nog ontbreekt.",
      "Na het boeken verschijnen je bedragen rechts in de T-rekeningen. Wil je nog iets wijzigen, klik dan op Heropenen.",
    ],
  },

  rekeningZoeken: {
    titel: "Een rekeningnummer zoeken",
    regels: [
      "Klik op het vergrootglas naast het veld Rekeningnr.",
      { kop: "Drie manieren om te zoeken" },
      { stap: "Typ een stuk van het nummer, bijvoorbeeld 604." },
      { stap: "Typ een stuk van de naam, bijvoorbeeld handelsgoed." },
      { stap: "Gebruik de filters: eerst A/P/K/O, dan de klasse, dan de rubriek. Zo wandel je door het MAR zoals in je cursus." },
      "Een klasse is de eerste cijfergroep (1 tot 7), een rubriek de eerste twee cijfers. Alle handelsvorderingen zitten bijvoorbeeld in klasse 4, rubriek 40.",
      "Klik op de rekening in de lijst om ze over te nemen in je schema.",
    ],
  },

  tpanelFilter: {
    titel: "Werken met de T-rekeningen",
    regels: [
      "Rechts staan al je T-rekeningen. Ze worden bijgewerkt zodra je iets boekt.",
      { kop: "Filteren" },
      "Met de filters bovenaan toon je enkel een bepaalde klasse of rubriek. Handig als je bijvoorbeeld alle btw-rekeningen of alle vaste activa naast elkaar wil zien.",
      "Standaard zie je enkel rekeningen waarop al geboekt is. Vink lege rekeningen tonen aan als je ook de rekeningen zonder boeking wil zien.",
      "Met enkel saldi verberg je de losse boekingen en hou je alleen de totalen over.",
      { kop: "Het saldo lezen" },
      "Staat er D-saldo 0 of C-saldo 0, dan is er wel geboekt maar heffen debet en credit elkaar precies op. Bij sommige rekeningen, zoals 580000 of de tussentijdse btw-rekeningen, is dat net de bedoeling.",
    ],
  },

  controles: {
    titel: "Wat wordt er bij de controles gevraagd?",
    regels: [
      "Deze controles zijn geen strikvragen. Ze halen er de fouten uit die bijna iedereen wel eens maakt.",
      { kop: "Automatisch nagekeken" },
      "De app kijkt na of je elk verantwoordingsstuk geboekt hebt, en of elke rekening aan de kant staat waar ze hoort. Een voorraad kan niet credit staan, een leverancier niet debet.",
      { kop: "Zelf nakijken" },
      "Bij elke vraag zie je nu de betrokken rekeningen met hun saldo. Klik op een rekeningnummer om die rekening meteen in het T-paneel rechts te tonen — zo hoef je niet te zoeken.",
      "Vink pas aan als je het echt nagekeken hebt. Pas als alles aangevinkt is, kan je verder met de resultaatverwerking.",
    ],
  },

  vasteActiva: {
    titel: "Dezelfde nummers voor aanschafwaarde en afschrijving",
    regels: [
      "Elk soort vast actief heeft in het MAR twee rekeningen die bij elkaar horen:",
      { stap: "de aanschafwaarde, bijvoorbeeld 230000 Installaties, machines en uitrusting;" },
      { stap: "de geboekte afschrijvingen, met hetzelfde nummer maar eindigend op 9: 230009." },
      "Die twee moeten altijd hetzelfde basisnummer hebben. Boek je de aankoop van een machine op 230000, dan hoort de afschrijving erop op 230009 — niet op 240009 of 241009.",
      "Klopt dat niet, dan lijkt het alsof je een machine afschrijft die je nooit gekocht hebt, én alsof je meubilair hebt dat nooit afgeschreven wordt.",
      { kop: "Zo kijk je het na" },
      "Zet in het T-paneel rechts de filter op klasse 2 (Vaste activa). Je ziet dan alle vaste activa naast elkaar. Bij elk nummer op …000 met een saldo hoort een nummer op …009 met een saldo.",
      "Hieronder staan ze al voor je op een rij.",
    ],
  },

  eindbalans: {
    titel: "De eindbalans opstellen",
    regels: [
      "Links staan alle rekeningen waarop je geboekt hebt en die een saldo overhouden. Sleep elke rekening naar het vak waar ze op de balans of in de resultatenrekening thuishoort.",
      "Werkt slepen niet op jouw toestel? Tik dan eerst op een rekening en daarna op het vak — dat doet hetzelfde.",
      { kop: "Waar hoort wat?" },
      "De rubriek van een rekening (de eerste twee cijfers) zegt bijna altijd waar ze staat. Klik op het vraagteken bij een vak om te zien welke rubrieken daar horen.",
      "Rekeningen die op 9 eindigen, zoals 230009, zijn geboekte afschrijvingen. Die horen bij de materiële vaste activa en gaan er in mindering van.",
      { kop: "Wanneer klopt het?" },
      "Als alle kaartjes een plaats hebben, moet totaal activa gelijk zijn aan totaal passiva, en totaal kosten aan totaal opbrengsten — de winst is dan immers al toegewezen aan het overgedragen resultaat.",
      "De app telt enkel op wat jij erin legt. Ze zegt niet of een rekening in het juiste vak ligt: dat kijkt je leerkracht na.",
    ],
  },

  klantenLeveranciers: {
    titel: "Openstaande facturen opvolgen",
    regels: [
      "Kies bovenaan een klant of een leverancier. Je ziet dan alle boekingen die jij op 400000 of 440000 aan die naam gekoppeld hebt.",
      { kop: "Een klant" },
      "Een verkoopfactuur zet je debet op 400000: de klant moet je nog betalen. Bij ontvangst van het geld boek je credit. Blijft het saldo debet staan, dan is de factuur nog niet betaald.",
      { kop: "Een leverancier" },
      "Een aankoopfactuur zet je credit op 440000: jij moet nog betalen. Bij de betaling boek je debet. Blijft het saldo credit staan, dan staat die factuur nog open.",
      { kop: "Betalingskorting" },
      "Een betalingskorting boek je pas bij de betaling zelf, niet al bij de factuur. Op het moment van de factuur weet je nog niet of er op tijd betaald wordt. De btw op de factuur bereken je wél al na aftrek van de financiële korting.",
      "Praktisch: je haalt de volledige factuur van 440000 (of 400000) af, betaalt minder via de bank, en het verschil komt op de rekening voor betalingskorting.",
      "Klopt het saldo van een relatie niet op nul terwijl alles betaald is, dan is de korting waarschijnlijk vergeten of aan de verkeerde kant geboekt.",
      { kop: "Let op de schrijfwijze" },
      "De namen typ je zelf. Schrijf je één keer Bloomwear en een andere keer Bloomwear Retail, dan krijg je twee aparte relaties. Gebruik de suggesties die verschijnen.",
    ],
  },
};
