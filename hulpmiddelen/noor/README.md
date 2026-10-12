# Oefendossier Fietsatelier Noor (jaar 3, 1e kwartaal 2028)

De case van het 3e en 4e jaar (Fietsatelier Noor bv) loopt hier verder in
de 3e graad. Jaar 1 (2026) en jaar 2 (2027) staan in de Excel van de case;
jaar 3 wordt hier gemaakt. In de app is het `noor.html`, naast de
eindopdracht MetWear (`index.html`).

## De scripts

Enkel Node.js nodig (en Python met openpyxl voor de Excel). Draai ze vanuit
de hoofdmap van de repo, in deze volgorde:

```
node hulpmiddelen/noor/case-j3.js
node hulpmiddelen/noor/maak-data.js
node hulpmiddelen/noor/maak-documenten.js
python3 hulpmiddelen/noor/maak-excel.py "case fietsatelier noor.xlsx" "uit.xlsx"
```

| Script | Maakt |
|---|---|
| `case-j3.js` | `case-j3.json`: alle stukken, uittreksels, journaal (= sleutel), proefbalans, voorraad. Hier pas je een aantal, prijs of datum aan. Het script stopt met een fout zodra iets niet klopt (debet ≠ credit, bank ≠ uittreksel, voorraad ≠ 340000, korting na de termijn …). |
| `maak-data.js` | `js/noor/data-opdrachten.js`, `js/noor/data-relaties.js` en het blok `SLEUTEL_NOOR` onderaan `apps-script/Code.gs` |
| `maak-documenten.js` | `documenten/noor/*.png` — 56 stukken. Zelfde huisstijl per bedrijf als in BKH4. Met `AK01 BANK03` enkel die. Chrome niet gevonden? Zet het pad in `CHROME_PAD`. |
| `maak-excel.py` | de Excel van de case met de tabbladen J3 erbij |
| `maak-pdf.py` | `cursus/Oefendossier_Noor_documenten.pdf`: alle documenten om te printen, per les, één per pagina, met een voorblad; en `…_2_per_pagina.pdf` met twee documenten per pagina (elke les op een nieuwe pagina) |

`basis-j1j2.json` komt uit de Excel (bedrijven, artikelen, proefbalans en
voorraad van jaar 2): daaruit volgt de beginbalans van 2028.

Met de hand gemaakt en niet door een script overschreven:
`js/noor/dossier.js` en `js/noor/data-controles.js`.

## De opbouw per les

| Les | Stukken |
|---|---|
| Beginbalans | BB |
| Aankopen 1 · kortingen | AK01–AK06 (handelskorting, financiële korting, beide) |
| Aankopen 2 · kosten, verpakking en investeringen | AK07–AK12 |
| Aankopen 3 · creditnota's en over te dragen kosten | AK13–AK17 |
| Verkopen 1 · handelskorting en kosten | VK01–VK06 (ook herstellingen aan 6%) |
| Verkopen 2 · verpakking, creditnota's, financiële korting | VK07–VK11, ONTV01 |
| Lonen 1 · loonstaten | LOON01–LOON06 (januari–maart, arbeiders en bedienden apart) |
| Lonen 2 · RSZ, voorheffing en personeelskosten | AK18–AK23 |
| Financiële verrichtingen | BANK01–BANK05, KAS01–KAS02 (niet alles wordt betaald: 6 klanten, 6 leveranciers, alle facturen met financiële korting, lonen en Loonwijs) |
| BTW-verwerking, eindejaar, resultaat | BTW, AFSCHR, OTK, LENING, VR, BELASTING, RESULTAAT |

## Afspraken in de sleutel

- MAR van de 3e graad (`js/mar.js`), aangevuld met 700000 voor de
  herstellingen (zoals in jaar 1 en 2).
- Financiële korting: factuur zonder korting, btw op het bedrag na korting;
  de korting komt bij de betaling op 757000/657000 als er binnen 10 dagen
  betaald is.
- Over te dragen kosten: bij de aankoop staat de factuur volledig in de
  kosten (verzekering bestelwagen, huur opslagruimte, verzekering
  arbeidsongevallen). Pas bij de afsluiting gaat het deel van na 31 maart
  naar 490000 (opdracht OTK bij de eindejaarsverrichtingen).
- Lonen: RSZ werknemer 13,07 %, werkgever 25 % (zoals MetWear). RSZ en
  voorheffing gaan via een factuur van Loonwijs naar 440000.
- Afsluiting op 31 maart: een kwart van de jaarafschrijving, de lening die
  binnen twaalf maanden vervalt naar 423000, belasting 20 %, wettelijke
  reserve 5 % van de winst na belasting.
