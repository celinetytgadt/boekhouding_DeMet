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
      { kop: "Wat moet en wat mag" },
      "Om te kunnen boeken heeft de app enkel het bedrag, het rekeningnummer en debet of credit nodig. De kolommen redenering, A/P/K/O en stijgt/daalt zijn denkstappen: ze helpen je om tot dat D of C te komen, maar je bent niet verplicht ze in te vullen.",
      { kop: "Voor je op Boeken klikt" },
      "Totaal debet en totaal credit moeten gelijk zijn, en elke lijn moet een bedrag, een rekening en een kant hebben. Ontbreekt er iets, dan kleurt die lijn en zie je onderaan wat er nog moet.",
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

  resultatenrekeningOpbouw: {
    titel: "De resultatenrekening opbouwen",
    regels: [
      "Om de winst te kunnen berekenen heb je enkel de resultatenrekening nodig. Klik op één of meerdere rubrieken en klik dan op het vak waar ze thuishoren. Slepen mag ook.",
      "In de lijst staan álle rubrieken waarop je geboekt hebt en die een saldo overhouden — ook die van de balans. Kies zelf welke je hier nodig hebt en laat de rest gewoon staan.",
      "Het bedrag op een kaartje is het saldo van de hele rubriek samen.",
      { kop: "Waarom geen evenwicht?" },
      "Kosten en opbrengsten zijn hier nog niet gelijk, en dat hóórt ook zo: het verschil is precies de winst die je nog moet verwerken. Daarom staat hier geen controle.",
      "Wat je hier plaatst, staat ook al op zijn plaats op het tabblad Eindbalans.",
    ],
  },

  eindbalans: {
    titel: "De eindbalans opstellen",
    regels: [
      "Je vindt hier alle rubrieken waarop je geboekt hebt en die een saldo overhouden. Klik op één of meerdere rubrieken en klik dan op het vak van de balans of resultatenrekening waar ze thuishoren. Slepen mag ook.",
      "Het bedrag op een kaartje is het saldo van de hele rubriek samen. Bij rubriek 23 is dat dus de aanschafwaarde min de geboekte afschrijvingen.",
      { kop: "Waar hoort wat?" },
      "De rubriek is de eerste twee cijfers van een rekeningnummer, en die zegt bijna altijd waar ze op de balans staat.",
      { kop: "Wanneer klopt het?" },
      "Zolang je de resultaatverwerking (BELASTING en RESULTAAT) nog niet geboekt hebt, zit de winst nog in de resultatenrekening. Dan moet activa + kosten gelijk zijn aan passiva + opbrengsten.",
      "Heb je de resultaatverwerking wél geboekt, dan is de winst toegewezen aan het overgedragen resultaat. Dan moet totaal activa gelijk zijn aan totaal passiva, én totaal kosten aan totaal opbrengsten.",
      "Bovenaan zie je altijd welke van de twee regels op dit moment geldt.",
      "De app telt enkel op wat jij erin legt. Ze zegt niet of een rubriek in het juiste vak ligt: dat kijkt je vakexpert na.",
    ],
  },

  klantenLeveranciers: {
    titel: "Openstaande facturen opvolgen",
    regels: [
      "Kies bovenaan een klant of een leverancier. In de tabel staan de facturen; jij punt zelf af waarmee ze vereffend zijn. Onderaan staat het totaal dat nog openstaat.",
      { kop: "Zelf afpunten" },
      { stap: "Klik onder de tabel bij Nog af te punten een betaling of creditnota aan." },
      { stap: "Klik daarna op de factuur waar ze bij hoort. De app wijst het bedrag automatisch toe." },
      { stap: "Verkeerd gekoppeld? Klik op het kruisje bij de koppeling om ze weer los te maken." },
      "Is een betaling groter dan de factuur, dan blijft de rest bij Nog af te punten staan — koppel die aan de volgende factuur.",
      { kop: "Een creditnota" },
      "Een creditnota is geen betaling maar een verkoop- of aankoopdocument dat een factuur vermindert. Punt ze dus af op de factuur waar ze bij hoort.",
      { kop: "Een klant" },
      "Een verkoopfactuur zet je debet op 400000: de klant moet je nog betalen. Bij ontvangst van het geld boek je credit. Staat de factuur nog open, dan is er (nog) geen ontvangst tegenover geboekt.",
      { kop: "Een leverancier" },
      "Een aankoopfactuur zet je credit op 440000: jij moet nog betalen. Bij de betaling boek je debet.",
      { kop: "Blijft er een klein bedrag openstaan?" },
      "Dan klopt er iets niet aan je boeking van die factuur of van de betaling. Zoek zelf op in je cursus wat er bij een betaling nog kan meespelen.",
      { kop: "Let op de schrijfwijze" },
      "De namen typ je zelf. Schrijf je één keer Bloomwear en een andere keer Bloomwear Retail, dan krijg je twee aparte relaties. Gebruik de suggesties die verschijnen.",
    ],
  },
};
