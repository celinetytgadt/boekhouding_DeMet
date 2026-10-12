# maak-pdf.py — alle documenten van het oefendossier in één PDF om te printen.
#
#   python3 hulpmiddelen/noor/maak-pdf.py
#
# Leest de volgorde uit js/noor/data-opdrachten.js (via Node) en de
# afbeeldingen uit documenten/noor/, en schrijft
# cursus/Oefendossier_Noor_documenten.pdf: een voorblad met de stukken per
# les, daarna één document per A4-pagina, met bovenaan de les en de
# referentie (zoals in de app). Daarnaast
# cursus/Oefendossier_Noor_documenten_2_per_pagina.pdf: hetzelfde met twee
# documenten onder elkaar per pagina (een les begint op een nieuwe pagina). Een document dat bij meer opdrachten hoort
# (bv. de aflossingstabel), staat er één keer in.
#
# Nodig: Python 3 met Pillow (pip install pillow), en Node.js.

import json
import os
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
DOCS = os.path.join(ROOT, "documenten", "noor")
UIT = os.path.join(ROOT, "cursus", "Oefendossier_Noor_documenten.pdf")
UIT_2 = os.path.join(ROOT, "cursus", "Oefendossier_Noor_documenten_2_per_pagina.pdf")

js = """
const fs = require('fs');
const src = fs.readFileSync('js/noor/data-opdrachten.js', 'utf8');
const r = new Function(src + ';return { OPDRACHTEN, CATEGORIE_VOLGORDE };')();
console.log(JSON.stringify(r));
"""
data = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT))

# A4 op 150 dpi
B, H = 1240, 1754
MARGE = 70
DONKER, GROEN, GRIJS = (20, 66, 43), (31, 122, 77), (110, 110, 110)


def lettertype(vet, grootte):
    kandidaten = (["arialbd.ttf", "DejaVuSans-Bold.ttf", "LiberationSans-Bold.ttf"] if vet
                  else ["arial.ttf", "DejaVuSans.ttf", "LiberationSans-Regular.ttf"])
    mappen = ["", "C:/Windows/Fonts", "/usr/share/fonts/truetype/dejavu", "/usr/share/fonts/truetype/liberation",
              "/Library/Fonts", "/System/Library/Fonts/Supplemental"]
    for k in kandidaten:
        for m in mappen:
            try:
                return ImageFont.truetype(os.path.join(m, k) if m else k, grootte)
            except OSError:
                continue
    return ImageFont.load_default()


F_TITEL, F_KOP, F_TEKST, F_KLEIN = lettertype(True, 46), lettertype(True, 28), lettertype(False, 24), lettertype(False, 20)

# ---- welke afbeelding hoort waar (volgorde van de app, elk bestand één keer)
stukken, gezien = [], set()
for o in data["OPDRACHTEN"]:
    docs = []
    if not o.get("geenDocument") and o.get("doc"):
        docs.append((o["doc"], o["ref"], o.get("titel", o["ref"])))
    for h in o.get("hulpdocs") or ([{"doc": o["hulpdoc"], "titel": o.get("hulpdocTitel")}] if o.get("hulpdoc") else []):
        docs.append((h["doc"], h["doc"], h.get("titel") or h["doc"]))
    for bestand, ref, titel in docs:
        if bestand in gezien:
            continue
        pad = os.path.join(DOCS, bestand + ".png")
        if not os.path.exists(pad):
            raise SystemExit("Afbeelding ontbreekt: " + pad)
        gezien.add(bestand)
        stukken.append({"bestand": bestand, "ref": ref, "titel": titel, "les": o["categorie"]})



def geschaald(bestand, max_b, max_h):
    beeld = Image.open(os.path.join(DOCS, bestand + ".png")).convert("RGB")
    schaal = min(max_b / beeld.width, max_h / beeld.height)
    return beeld.resize((int(beeld.width * schaal), int(beeld.height * schaal)), Image.LANCZOS)


def maak(per_pagina, uit):
    """per_pagina 1: één document per pagina, met bovenaan les en ref.
    per_pagina 2: twee onder elkaar, elk met les en ref erboven. Een les
    begint altijd op een nieuwe pagina, zodat je per les kunt uitdelen."""
    # De stukken per les, in de volgorde van de app, verdeeld over pagina's.
    lessen = []
    for s in stukken:
        if not lessen or lessen[-1][0] != s["les"]:
            lessen.append((s["les"], []))
        lessen[-1][1].append(s)
    bladen = []   # (les, [stukken op die pagina])
    for les, lijst in lessen:
        for i in range(0, len(lijst), per_pagina):
            bladen.append((les, lijst[i:i + per_pagina]))
    totaal = len(bladen) + 1

    # ---- voorblad met de inhoud per les
    voor = Image.new("RGB", (B, H), "white")
    d = ImageDraw.Draw(voor)
    d.rectangle([0, 0, B, 26], fill=GROEN)
    d.text((MARGE, 90), "Oefendossier Fietsatelier Noor", font=F_TITEL, fill=DONKER)
    ondertitel = "Verantwoordingsstukken 1e kwartaal 2028 · per les, in de volgorde van de app"
    if per_pagina == 2:
        ondertitel += " · 2 per pagina"
    d.text((MARGE, 155), ondertitel, font=F_TEKST, fill=GRIJS)
    y, nr = 240, 2
    for les, lijst in lessen:
        n = (len(lijst) + per_pagina - 1) // per_pagina
        d.text((MARGE, y), les, font=F_KOP, fill=DONKER)
        tekst = ", ".join(s["ref"] for s in lijst) + "   (p. %d%s)" % (nr, "" if n == 1 else "–%d" % (nr + n - 1))
        d.text((MARGE + 30, y + 40), tekst, font=F_TEKST, fill=(40, 40, 40))
        nr += n
        y += 100
    d.text((MARGE, H - 90), "Dit zijn fictieve documenten, gemaakt voor de lessen boekhouden.", font=F_KLEIN, fill=GRIJS)
    paginas = [voor]

    for nr, (les, op_blad) in enumerate(bladen, start=2):
        p = Image.new("RGB", (B, H), "white")
        d = ImageDraw.Draw(p)
        if per_pagina == 1:
            d.text((MARGE, 50), les, font=F_TEKST, fill=GRIJS)
            ref = op_blad[0]["ref"]
            d.text((B - MARGE - d.textlength(ref, font=F_KOP), 44), ref, font=F_KOP, fill=DONKER)
            d.line([MARGE, 95, B - MARGE, 95], fill=(200, 200, 200), width=2)
            beeld = geschaald(op_blad[0]["bestand"], B - 2 * MARGE, H - 95 - 30 - 90)
            p.paste(beeld, ((B - beeld.width) // 2, 125))
        else:
            boven, onder = 40, 80
            vak = (H - boven - onder) // 2
            for k, s in enumerate(op_blad):
                y0 = boven + k * vak
                if k:
                    d.line([MARGE, y0 - 6, B - MARGE, y0 - 6], fill=(200, 200, 200), width=2)
                d.text((MARGE, y0 + 8), les, font=F_KLEIN, fill=GRIJS)
                d.text((B - MARGE - d.textlength(s["ref"], font=F_KOP), y0 + 2), s["ref"], font=F_KOP, fill=DONKER)
                beeld = geschaald(s["bestand"], B - 2 * MARGE, vak - 50 - 14)
                p.paste(beeld, ((B - beeld.width) // 2, y0 + 50))
        voet = "Oefendossier Fietsatelier Noor · pagina %d van %d" % (nr, totaal)
        d.text(((B - d.textlength(voet, font=F_KLEIN)) / 2, H - 60), voet, font=F_KLEIN, fill=GRIJS)
        paginas.append(p)

    os.makedirs(os.path.dirname(uit), exist_ok=True)
    paginas[0].save(uit, save_all=True, append_images=paginas[1:], resolution=150, quality=85)
    print("Geschreven:", uit, "·", len(paginas), "pagina's")


maak(1, UIT)
maak(2, UIT_2)
