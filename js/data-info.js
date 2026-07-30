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
      { stap: "Redenering — schrijf in je eigen woorden wat er gebeurt, bijvoorbeeld \"we kopen handelsgoederen\"." },
      { stap: "A/P/K/O — is dat een actief, een passief, een kost of een opbrengst?" },
      { stap: "Stijgt/daalt — wordt dat door deze verrichting meer of minder?" },
      { stap: "Rekeningnr. — zoek de rekening in het MAR. Klik op het vergrootglas als je het nummer niet vanbuiten kent." },
      { stap: "D/C — beslis zelf of het debet of credit komt. De app zegt niet of je juist zit." },
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
      { stap: "Typ een stuk van de naam, bijvoorbeeld btw" },
      { stap: "Gebruik de filters: A/P/K/O, klasse of rubriek." },
      "Klik op de rekening in de lijst om ze over te nemen in je schema.",
    ],
  },

  controles: {
    titel: "Wat wordt er bij de controles gevraagd?",
    regels: [
      "Deze controles halen er de fouten uit die bijna iedereen wel eens maakt.",
      { kop: "Automatisch nagekeken" },
      "De app kijkt na of je elk verantwoordingsstuk geboekt hebt, en of elke rekening aan de kant staat waar ze hoort. Een voorraad kan niet credit staan, een leverancier niet debet.",
      { kop: "Zelf nakijken" },
      "Bij elke vraag zie je hoe je de filter kunt instellen bij de T-rekeningen. Zo vind je makkelijk de juiste informatie.",
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
