# Automatische test van de koppeling

Draait de echte app in een nagebootste browser tegen de echte `Code.gs`, met
een nagemaakte Google-omgeving ertussen. Zo wordt het hele pad gecontroleerd:
aanmelden (met de vestigingskeuze), indienen, nakijken, vrijgeven, feedback
tonen, en of de controles blijven staan na een heropening.

Handig telkens je iets aan `app.js`, `koppeling.js` of `Code.gs` wijzigt.

## Draaien

Je hebt Node.js nodig, en eenmalig:

    npm install jsdom

Daarna, vanuit deze map:

    node test-koppeling.js

Het harnas maakt zijn eigen testkopieën van de app in `/tmp/t` (één
vestiging, met klaslijst en koppeling), `/tmp/t2` (zonder klaslijst, zonder
koppeling) en `/tmp/t3` (twee vestigingen). Je hoeft dus zelf niets klaar te
zetten; die kopieën worden bij elke run overschreven.

Alles goed? Dan eindigt het met "Alle controles geslaagd."
