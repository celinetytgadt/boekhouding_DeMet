# maak-pdf.py — alle documenten van het oefendossier in één PDF om te printen.
#
#   python3 hulpmiddelen/noor/maak-pdf.py
#
# Leest de volgorde uit js/noor/data-opdrachten.js (via Node) en de
# afbeeldingen uit documenten/noor/, en schrijft
# cursus/Oefendossier_Noor_documenten.pdf: een voorblad met de stukken per
# les, daarna één document per A4-pagina, met bovenaan de les en de
# referentie (zoals in de app). Een document dat bij meer opdrachten hoort
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

paginas = []

# ---- voorblad met de inhoud per les
voor = Image.new("RGB", (B, H), "white")
d = ImageDraw.Draw(voor)
d.rectangle([0, 0, B, 26], fill=GROEN)
d.text((MARGE, 90), "Oefendossier Fietsatelier Noor", font=F_TITEL, fill=DONKER)
d.text((MARGE, 155), "Verantwoordingsstukken 1e kwartaal 2028 · per les, in de volgorde van de app", font=F_TEKST, fill=GRIJS)
y = 240
per_les = {}
for s in stukken:
    per_les.setdefault(s["les"], []).append(s["ref"])
nr = 2   # pagina 1 is dit voorblad
for les in data["CATEGORIE_VOLGORDE"] + ["Resultaatverwerking"]:
    refs = per_les.get(les)
    if not refs:
        continue
    d.text((MARGE, y), les, font=F_KOP, fill=DONKER)
    tekst = ", ".join(refs) + "   (p. %d%s)" % (nr, "" if len(refs) == 1 else "–%d" % (nr + len(refs) - 1))
    d.text((MARGE + 30, y + 40), tekst, font=F_TEKST, fill=(40, 40, 40))
    nr += len(refs)
    y += 100
d.text((MARGE, H - 90), "Dit zijn fictieve documenten, gemaakt voor de lessen boekhouden.", font=F_KLEIN, fill=GRIJS)
paginas.append(voor)

# ---- één document per pagina
for i, s in enumerate(stukken, start=2):
    p = Image.new("RGB", (B, H), "white")
    d = ImageDraw.Draw(p)
    d.text((MARGE, 50), s["les"], font=F_TEKST, fill=GRIJS)
    breedte_ref = d.textlength(s["ref"], font=F_KOP)
    d.text((B - MARGE - breedte_ref, 44), s["ref"], font=F_KOP, fill=DONKER)
    d.line([MARGE, 95, B - MARGE, 95], fill=(200, 200, 200), width=2)
    beeld = Image.open(os.path.join(DOCS, s["bestand"] + ".png")).convert("RGB")
    max_b, max_h = B - 2 * MARGE, H - 95 - 30 - 90
    schaal = min(max_b / beeld.width, max_h / beeld.height)
    beeld = beeld.resize((int(beeld.width * schaal), int(beeld.height * schaal)), Image.LANCZOS)
    p.paste(beeld, ((B - beeld.width) // 2, 125))
    voet = "Oefendossier Fietsatelier Noor · pagina %d van %d" % (i, len(stukken) + 1)
    d.text(((B - d.textlength(voet, font=F_KLEIN)) / 2, H - 60), voet, font=F_KLEIN, fill=GRIJS)
    paginas.append(p)

os.makedirs(os.path.dirname(UIT), exist_ok=True)
paginas[0].save(UIT, save_all=True, append_images=paginas[1:], resolution=150, quality=85)
print("Geschreven:", UIT, "·", len(paginas), "pagina's")
