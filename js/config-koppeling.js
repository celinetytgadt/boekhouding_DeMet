// config-koppeling.js
// De koppeling met de Google Sheets. Enkel dit bestand moet je aanpassen
// nadat de scripts gepubliceerd zijn — zie HANDLEIDING-koppeling.md.
//
// ÉÉN APP, DRIE VESTIGINGEN
// Elke vestiging heeft een eigen Google Sheet met een eigen Apps Script, en
// dus een eigen web-app-URL. De leerling kiest bovenaan de app eerst de
// vestiging en daarna de naam; alles wat daarna verstuurd wordt, gaat naar
// de Sheet van díé vestiging. De werkbestanden komen wél samen in dezelfde
// map op de gedeelde Drive — de bestandsnaam begint met de code van de
// vestiging (werk_LEU_….json).
//
// Eén vestiging? Laat er dan gewoon één in de lijst staan. De keuzelijst
// verdwijnt dan vanzelf uit de app.

const VESTIGINGEN = [
  {
    // De code komt in de bestandsnaam van het werkbestand en in de
    // bewaarsleutel van de browser. Ze moet exact overeenkomen met
    // VESTIGING bovenaan de Code.gs van die vestiging.
    code: "LEU",

    // Wat de leerling in de keuzelijst ziet.
    naam: "Leuven",

    // De URL die Google geeft na "Implementeren → Nieuwe implementatie →
    // Web-app". Ze eindigt op /exec. Blijft ze leeg, dan kan er voor die
    // vestiging niets bewaard of ingediend worden.
    webAppUrl: "https://script.google.com/macros/s/AKfycbw46aLZg4tSWTJiiyoAiT7U1zlJr0Byzt0XV9gtq39GovUj7PW8W9ewW7JmB7mjXLLEwQ/exec",

    // Moet exact hetzelfde woord zijn als SLEUTEL bovenaan die Code.gs.
    // Let op: dit staat in publiek leesbare code. Het is een drempel tegen
    // toevallige rommel, geen wachtwoord — de echte afscherming is dat enkel
    // de vakexpert bij de Sheet en bij de Drive-map kan.
    sleutel: "DEMET",
  },
  {
    code: "SKW",
    naam: "Katelijne",
    webAppUrl: "https://script.google.com/macros/s/AKfycbz4ovIpDahliFxWOj7vM60jyrLbkJW1ofJn03gNoUFnsYFS4EhtyWKaCscjiVXHE-us/exec",
    sleutel: "DEMET",
  },
  {
    code: "TW",
    naam: "Tielt-Winge",
    webAppUrl: "https://script.google.com/a/macros/demetleuven.eu/s/AKfycbzCOF7Jtn5qEbA88jQw1orjNVVdwWk7djl9gb_zjlyocIkr5xnDRpWaL6aCX-qDypGF/exec",
    sleutel: "DEMET",
  },
];

const KOPPELING = {
  // Om de hoeveel minuten het werk stilletjes naar de Drive gaat.
  bewaarIntervalMinuten: 2,

  // Feedback automatisch ophalen bij het openen van de app.
  feedbackBijOpstart: true,
};
