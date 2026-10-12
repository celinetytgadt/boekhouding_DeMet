# maak-mar-cursus.py — het MAR-overzicht voor de cursus, uit het MAR van de app.
#
#   python3 hulpmiddelen/maak-mar-cursus.py
#
# Leest js/mar.js en js/data-mar-indeling.js (via Node) en schrijft
# cursus/MAR_cursus.xlsx met drie tabbladen:
#   MAR           het overzicht om af te drukken: 2 pagina's A4 op 100%,
#                 telkens twee kolommen, per klasse en rubriek
#   Lijst         dezelfde rekeningen als tabel met filters
#   Wijzigingen   wat er verandert tegenover het MAR in de cursus 25-26
#
# Zo staan in de cursus exact dezelfde rekeningen als in de app. Komt er een
# rekening bij in js/mar.js, draai dit script dan opnieuw.
#
# Nodig: Python 3 met openpyxl, en Node.js.

import json
import os
import subprocess

import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.pagebreak import Break

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
UIT = os.path.join(ROOT, "cursus", "MAR_cursus.xlsx")

js = """
const fs = require('fs');
const lees = (f, naam) => new Function(fs.readFileSync(f, 'utf8').replace(new RegExp('const\\\\s+' + naam + '\\\\s*='), 'return ') + ';')();
console.log(JSON.stringify({ mar: lees('js/mar.js', 'MAR'), indeling: lees('js/data-mar-indeling.js', 'MAR_INDELING') }));
"""
data = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT))
MAR = sorted(data["mar"], key=lambda r: r["nr"])
INDELING = data["indeling"]
KLASSE = {str(k["klasse"]): k.get("oms") or k.get("naam") for k in INDELING}
RUBRIEK = {str(r["rubriek"]): r["oms"] for k in INDELING for r in k["rubrieken"]}

BLAUW, LICHT, DONKER, GRIJS = "4A86E8", "C9DAF8", "002783", "666666"
F = "Open Sans"
dun = Side(style="thin", color="9FB6D9")
RAND = Border(left=dun, right=dun, top=dun, bottom=dun)

# ---------------------------------------------------------------- de rijen
rijen = []   # (soort, tekst / rekening)
for kl in sorted(KLASSE):
    rek = [r for r in MAR if str(r["klasse"]) == kl]
    if not rek:
        continue
    rijen.append(("k", "Klasse %s  %s" % (kl, KLASSE[kl]), kl))
    vorige = None
    for r in rek:
        if r["rubriek"] != vorige:
            vorige = r["rubriek"]
            rijen.append(("r", "%s  %s" % (r["rubriek"], RUBRIEK.get(r["rubriek"], r["rubriek_oms"])), kl))
        rijen.append(("a", r, kl))

# Een lange naam neemt twee regels in.
BREED_NAAM = 40
hoogte = lambda x: 2 if x[0] == "a" and len(x[1]["naam"]) > BREED_NAAM else 1


def verdeel(capaciteit):
    """Vier kolommen (2 per pagina). Breken enkel vóór een rubriek of klasse;
    begint een kolom midden in een klasse, dan komt de klasse er nog eens
    boven met '(vervolg)'."""
    kolommen, huidig, gebruikt = [], [], 0
    i = 0
    # groepen: een rubriek met haar rekeningen (de klasse-kop hoort bij de eerste rubriek)
    groepen, g = [], []
    for x in rijen:
        if x[0] in ("k", "r") and g and not (x[0] == "r" and g[-1][0] == "k"):
            groepen.append(g)
            g = []
        g.append(x)
    groepen.append(g)
    for g in groepen:
        h = sum(hoogte(x) for x in g)
        if gebruikt + h > capaciteit and huidig:
            kolommen.append(huidig)
            huidig, gebruikt = [], 0
            if g[0][0] != "k":
                kl = g[0][2]
                huidig.append(("k", "Klasse %s  %s (vervolg)" % (kl, KLASSE[kl] if len(KLASSE[kl]) < 30 else ""), kl))
                gebruikt += 1
        huidig += g
        gebruikt += h
    kolommen.append(huidig)
    return kolommen


cap = 30
while len(verdeel(cap)) > 4:
    cap += 1
kolommen = verdeel(cap)
print("rijen per kolom:", cap, "· kolommen:", [sum(hoogte(x) for x in k) for k in kolommen])

# ---------------------------------------------------------------- tabblad MAR
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "MAR"
BREEDTES = {"A": 7.5, "B": 42, "C": 4.5, "D": 1.5, "E": 7.5, "F": 42, "G": 4.5}
for k, w in BREEDTES.items():
    ws.column_dimensions[k].width = w


def kop(rij):
    ws.cell(rij, 1).value = "MAR (minimum algemeen rekeningenstelsel)"
    ws.cell(rij, 1).font = Font(name=F, size=15, bold=True, color=DONKER)
    ws.merge_cells(start_row=rij, start_column=1, end_row=rij, end_column=7)
    ws.row_dimensions[rij].height = 24
    for kol in (1, 5):
        for j, t in enumerate(["Nr", "Rekening", "APKO"]):
            c = ws.cell(rij + 1, kol + j)
            c.value = t
            c.font = Font(name=F, size=8, bold=True, color=GRIJS)
            if j == 2:
                c.alignment = Alignment(horizontal="center")


def schrijf(kolom, start, kol):
    rij = start
    for x in kolom:
        c1, c2, c3 = (ws.cell(rij, kol + j) for j in range(3))
        if x[0] in ("k", "r"):
            c1.value = x[1]
            vul = PatternFill("solid", fgColor=BLAUW if x[0] == "k" else LICHT)
            letter = Font(name=F, size=9.5 if x[0] == "k" else 9, bold=True, color="FFFFFF" if x[0] == "k" else DONKER)
            for c in (c1, c2, c3):
                c.fill, c.font, c.border = vul, letter, RAND
            ws.merge_cells(start_row=rij, start_column=kol, end_row=rij, end_column=kol + 2)
            c1.alignment = Alignment(vertical="center")
        else:
            r = x[1]
            c1.value, c2.value, c3.value = r["nr"], r["naam"], r["apko"]
            for c in (c1, c2, c3):
                c.font, c.border = Font(name=F, size=9, color=DONKER), RAND
            c1.alignment = Alignment(horizontal="left", vertical="top")
            c2.alignment = Alignment(wrap_text=True, vertical="top")
            c3.alignment = Alignment(horizontal="center", vertical="top")
        rij += 1
    return rij


RIJHOOGTE = 12.5
pagina2 = cap + 3 + 1
for p, start in enumerate((1, pagina2)):
    kop(start)
    links, rechts = kolommen[2 * p] if 2 * p < len(kolommen) else [], kolommen[2 * p + 1] if 2 * p + 1 < len(kolommen) else []
    e1 = schrijf(links, start + 2, 1)
    e2 = schrijf(rechts, start + 2, 5)
    # Rijhoogte: een lange naam links of rechts maakt de rij hoger.
    for rij in range(start + 2, max(e1, e2)):
        lang = any(isinstance(ws.cell(rij, k).value, str) and len(ws.cell(rij, k).value) > BREED_NAAM for k in (2, 6))
        ws.row_dimensions[rij].height = RIJHOOGTE * (2 if lang else 1)
ws.row_breaks.append(Break(id=pagina2 - 1))
ws.print_area = "A1:G%d" % ws.max_row
ws.page_setup.paperSize = ws.PAPERSIZE_A4
ws.page_setup.orientation = "portrait"
# Elke helft precies één pagina breed; in de hoogte twee pagina's (met het
# pagina-einde hierboven). Zo komt de afdruk op ongeveer 90 %.
ws.sheet_properties.pageSetUpPr.fitToPage = True
ws.page_setup.fitToWidth = 1
ws.page_setup.fitToHeight = 2
ws.print_options.horizontalCentered = True
ws.page_margins.left = ws.page_margins.right = 0.35
ws.page_margins.top = ws.page_margins.bottom = 0.4
ws.page_margins.header = ws.page_margins.footer = 0.2
ws.sheet_view.showGridLines = False

# ---------------------------------------------------------------- tabblad Lijst
wl = wb.create_sheet("Lijst")
wl.append(["Rekening", "Naam", "A/P/K/O", "Klasse", "Klasse omschrijving", "Rubriek", "Rubriek omschrijving"])
for r in MAR:
    wl.append([r["nr"], r["naam"], r["apko"], int(r["klasse"]), KLASSE[str(r["klasse"])], r["rubriek"],
               RUBRIEK.get(r["rubriek"], r["rubriek_oms"])])
for c in wl[1]:
    c.font, c.fill = Font(name=F, bold=True, color="FFFFFF"), PatternFill("solid", fgColor=BLAUW)
for row in wl.iter_rows(min_row=2):
    for c in row:
        c.font = Font(name=F, size=10)
wl.freeze_panes = "A2"
wl.auto_filter.ref = "A1:G%d" % wl.max_row
for k, w in zip("ABCDEFG", [10, 62, 9, 7, 42, 8, 56]):
    wl.column_dimensions[k].width = w

# ---------------------------------------------------------------- tabblad Wijzigingen
# Het MAR in de cursus 25-26 (vijf cijfers) en waar elke rekening nu staat.
OUD = [
    ("10000", "Kapitaal", "100000"), ("14000", "Overgedragen winst", "140000"), ("14100", "Overgedragen verlies (-)", "141000"),
    ("17300", "Kredietinstellingen", "173000"), ("22000", "Terreinen", "220000"), ("22100", "Gebouwen", "221000"),
    ("22109", "Afschrijvingen op gebouwen (-)", "221009"), ("23000", "Installaties", "230000"),
    ("23009", "Afschrijvingen op installaties (-)", "230009"), ("23100", "Machines", "231000"),
    ("23109", "Afschrijving op machines (-)", "231009"), ("24000", "Meubilair", "240000"),
    ("24009", "Afschrijvingen op meubilair (-)", "240009"), ("24100", "Rollend materieel", "241000"),
    ("24109", "Afschrijvingen op rollend mat. (-)", "241009"), ("30000", "Voorraad grondstoffen", "300000"),
    ("34000", "Voorraad handelsgoederen", "340000"), ("40000", "Handelsdebiteuren", "400000"),
    ("41100", "Terug te vorderen BTW-saldo", "411000"), ("41110", "Aftrekbare BTW", "411100"),
    ("41120", "Aftrekbare BTW op uitgaande CN", "411200"), ("41800", "Terug te vorderen verpakking", "418000"),
    ("42300", "Binnen het jaar vervallende schulden aan kredietinstellingen", "423000"), ("44000", "Leveranciers", "440000"),
    ("45100", "Te betalen BTW-saldo", "451000"), ("45110", "Verschuldigde BTW", "451100"),
    ("45120", "Verschuldigde BTW op inkomende CN", "451200"), ("48800", "Terug te betalen verpakking", "488000"),
    ("55000", "Bank", "550000"), ("57000", "Kassa", "570000"), ("58000", "Interne overboekingen", "580000"),
    ("60000", "Aankopen grondstoffen", "600000"), ("60400", "Aankopen handelsgoederen", "604000"),
    ("60410", "Retour op aankopen handelsgoederen", "604010"), ("60420", "Aankoopkosten", "604030"),
    ("60800", "Ontvangen kortingen (-)", "604020"), ("60940", "Voorraadwijzigingen handelsgoederen", "609400"),
    ("61000", "Huur en huurlasten", "611000"), ("61100", "Onderhoud en herstellingen", "611500, 611800"),
    ("61211", "Verbruik water", "612500"), ("61212", "Verbruik elektriciteit & gas", "612600, 612700"),
    ("61230", "Boeken & tijdschriften", "612100"), ("61240", "Drukwerk", "612000"), ("61310", "Erelonen boekhouder", "613200"),
    ("61350", "Verzekeringen", "614400"), ("61400", "Vervoer & verplaatsingen", None), ("61510", "Onthaalkosten", None),
    ("61520", "Reclame & advertenties", "616520"), ("61620", "Telefoon & internet", "616200, 616300"),
    ("63020", "Afschrijvingen op materiële vaste activa", "630200"),
    ("63030", "Afschrijvingen op meubilair en rollend materieel", "630300"), ("64900", "Diverse bedrijfskosten", "643000"),
    ("65000", "Interest", "650000"), ("65700", "Betalingskorting aan klanten", "657000"),
    ("70400", "Verkopen handelsgoederen", "704000"), ("70410", "Retour op verkopen handelsgoederen", "704010"),
    ("70800", "Toegestane kortingen (-)", "704020"), ("74600", "Doorgerekende kosten", "746000"),
    ("750000", "Interest", "751000"), ("757000", "Betalingskorting van leveranciers", "757000"),
]
NAAM = {str(r["nr"]): r["naam"] for r in MAR}
ww = wb.create_sheet("Wijzigingen")
ww.append(["Cursus 25-26", "Naam in de cursus", "Nieuw nummer", "Nieuwe naam", "Wat verandert"])
gebruikt = set()
for oud, naam, nieuw in OUD:
    if not nieuw:
        ww.append([oud, naam, None, None, "valt weg"])
        continue
    nrs = [x.strip() for x in nieuw.split(",")]
    for n in nrs:
        if n not in NAAM:
            raise SystemExit("Rekening %s staat niet in js/mar.js" % n)
    gebruikt.update(nrs)
    nieuwe = " + ".join(NAAM[n] for n in nrs)
    wat = []
    if nrs[0] not in (oud + "0", oud[:3] + "0" + oud[3:], oud):
        wat.append("ander nummer")
    if nieuwe.lower() != naam.lower():
        wat.append("andere naam")
    if len(nrs) > 1:
        wat.append("opgesplitst")
    if oud == "61350":
        wat.append("enkel nog de verzekering van voertuigen")
    ww.append([oud, naam, nieuw, nieuwe, ", ".join(wat) or "enkel 6 cijfers"])
for r in MAR:
    if str(r["nr"]) not in gebruikt:
        ww.append([None, None, str(r["nr"]), r["naam"], "nieuw"])
for c in ww[1]:
    c.font, c.fill = Font(name=F, bold=True, color="FFFFFF"), PatternFill("solid", fgColor=BLAUW)
KLEUR = {"valt weg": "F4CCCC", "nieuw": "D9EAD3"}
for row in ww.iter_rows(min_row=2):
    w = row[4].value
    vul = KLEUR.get(w) or (None if w == "enkel 6 cijfers" else "FCE4D6")
    for c in row:
        c.font = Font(name=F, size=10)
        if vul:
            c.fill = PatternFill("solid", fgColor=vul)
ww.freeze_panes = "A2"
ww.auto_filter.ref = "A1:E%d" % ww.max_row
for k, w in zip("ABCDE", [12, 46, 16, 60, 40]):
    ww.column_dimensions[k].width = w

os.makedirs(os.path.dirname(UIT), exist_ok=True)
wb.save(UIT)
print("Geschreven:", UIT, "·", len(MAR), "rekeningen")
