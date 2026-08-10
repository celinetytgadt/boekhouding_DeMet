// config-koppeling.js
// De koppeling met jouw Google Sheet. Enkel dit bestand moet je aanpassen
// nadat je het script gepubliceerd hebt — zie HANDLEIDING-koppeling.md.

const KOPPELING = {
  // De URL die Google je geeft na "Implementeren → Nieuwe implementatie →
  // Web-app". Ze eindigt op /exec. Blijft dit leeg, dan werkt de app gewoon
  // verder zonder koppeling: alles blijft dan lokaal in de browser.
  webAppUrl: "",

  // Moet exact hetzelfde woord zijn als SLEUTEL bovenaan Code.gs.
  // Let op: dit staat in publiek leesbare code. Het is een drempel tegen
  // toevallige rommel, geen wachtwoord — de echte afscherming is dat enkel
  // jij bij de Sheet en bij de Drive-map kan.
  sleutel: "VERVANG-DIT-DOOR-EEN-EIGEN-WOORD",

  // Om de hoeveel minuten het werk stilletjes naar jouw Drive gaat.
  bewaarIntervalMinuten: 2,

  // Feedback automatisch ophalen bij het openen van de app.
  feedbackBijOpstart: true,
};
