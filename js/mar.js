// MAR — Minimum Algemeen Rekeningenstelsel (176 rekeningen)
// Overgenomen uit het tabblad 'MAR' van 'Boekhouden consolidatie.xlsx'.
// Wijzigt normaal niet van jaar tot jaar.

const MAR = [
 {
  "nr": 100000,
  "naam": "Geplaatst kapitaal",
  "apko": "P",
  "klasse": "1",
  "klasse_oms": "Eigen vermogen",
  "rubriek": "10",
  "rubriek_oms": "Kapitaal"
 },
 {
  "nr": 101000,
  "naam": "Niet-opgevraagd kapitaal",
  "apko": "P",
  "klasse": "1",
  "klasse_oms": "Eigen vermogen",
  "rubriek": "10",
  "rubriek_oms": "Kapitaal"
 },
 {
  "nr": 130000,
  "naam": "Wettelijke reserve",
  "apko": "P",
  "klasse": "1",
  "klasse_oms": "Eigen vermogen",
  "rubriek": "13",
  "rubriek_oms": "Reserves"
 },
 {
  "nr": 132000,
  "naam": "Belastingvrije reserves",
  "apko": "P",
  "klasse": "1",
  "klasse_oms": "Eigen vermogen",
  "rubriek": "13",
  "rubriek_oms": "Reserves"
 },
 {
  "nr": 133000,
  "naam": "Beschikbare reserves",
  "apko": "P",
  "klasse": "1",
  "klasse_oms": "Eigen vermogen",
  "rubriek": "13",
  "rubriek_oms": "Reserves"
 },
 {
  "nr": 140000,
  "naam": "Overgedragen winst",
  "apko": "P",
  "klasse": "1",
  "klasse_oms": "Eigen vermogen",
  "rubriek": "14",
  "rubriek_oms": "Overgedragen resultaat"
 },
 {
  "nr": 141000,
  "naam": "Overgedragen verlies (-)",
  "apko": "P",
  "klasse": "1",
  "klasse_oms": "Eigen vermogen",
  "rubriek": "14",
  "rubriek_oms": "Overgedragen resultaat"
 },
 {
  "nr": 160000,
  "naam": "Voorzieningen voor pensioenen",
  "apko": "P",
  "klasse": "1",
  "klasse_oms": "Eigen vermogen",
  "rubriek": "16",
  "rubriek_oms": "Voorzieningen"
 },
 {
  "nr": 162000,
  "naam": "Voorzieningen voor grote herstellingen en groot onderhoud",
  "apko": "P",
  "klasse": "1",
  "klasse_oms": "Eigen vermogen",
  "rubriek": "16",
  "rubriek_oms": "Voorzieningen"
 },
 {
  "nr": 164000,
  "naam": "Voorzieningen voor overige risico’s en kosten",
  "apko": "P",
  "klasse": "1",
  "klasse_oms": "Eigen vermogen",
  "rubriek": "16",
  "rubriek_oms": "Voorzieningen"
 },
 {
  "nr": 172000,
  "naam": "Leasingschulden",
  "apko": "P",
  "klasse": "1",
  "klasse_oms": "Eigen vermogen",
  "rubriek": "17",
  "rubriek_oms": "Schulden op meer dan 1 jaar"
 },
 {
  "nr": 173000,
  "naam": "Schulden aan kredietinstellingen",
  "apko": "P",
  "klasse": "1",
  "klasse_oms": "Eigen vermogen",
  "rubriek": "17",
  "rubriek_oms": "Schulden op meer dan 1 jaar"
 },
 {
  "nr": 174000,
  "naam": "Overige leningen",
  "apko": "P",
  "klasse": "1",
  "klasse_oms": "Eigen vermogen",
  "rubriek": "17",
  "rubriek_oms": "Schulden op meer dan 1 jaar"
 },
 {
  "nr": 200000,
  "naam": "Kosten oprichting en kapitaalverhoging",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "20",
  "rubriek_oms": "Oprichtingskosten"
 },
 {
  "nr": 200009,
  "naam": "Afschrijving op kosten oprichting en",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "20",
  "rubriek_oms": "Oprichtingskosten"
 },
 {
  "nr": 211000,
  "naam": "concessies, octrooien, licenties, knowhow, merken",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "21",
  "rubriek_oms": "Immateriële vaste activa"
 },
 {
  "nr": 211009,
  "naam": "Afschrijvingen op concessies, octrooien, licenties, knowhow, merken (-)",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "21",
  "rubriek_oms": "Immateriële vaste activa"
 },
 {
  "nr": 215000,
  "naam": "Software",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "21",
  "rubriek_oms": "Immateriële vaste activa"
 },
 {
  "nr": 215009,
  "naam": "Afschrijvingen op software (-)",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "21",
  "rubriek_oms": "Immateriële vaste activa"
 },
 {
  "nr": 220000,
  "naam": "Terreinen",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "22",
  "rubriek_oms": "Terreinen & gebouwen"
 },
 {
  "nr": 221000,
  "naam": "Gebouwen",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "22",
  "rubriek_oms": "Terreinen & gebouwen"
 },
 {
  "nr": 221009,
  "naam": "Afschrijvingen op gebouwen (-)",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "22",
  "rubriek_oms": "Terreinen & gebouwen"
 },
 {
  "nr": 230000,
  "naam": "Installaties",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "23",
  "rubriek_oms": "Installaties, machines & uitrusting"
 },
 {
  "nr": 230009,
  "naam": "Afschrijvingen op installaties (-)",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "23",
  "rubriek_oms": "Installaties, machines & uitrusting"
 },
 {
  "nr": 231000,
  "naam": "Machines",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "23",
  "rubriek_oms": "Installaties, machines & uitrusting"
 },
 {
  "nr": 231009,
  "naam": "Afschrijvingen op machines (-)",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "23",
  "rubriek_oms": "Installaties, machines & uitrusting"
 },
 {
  "nr": 232000,
  "naam": "Uitrusting",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "23",
  "rubriek_oms": "Installaties, machines & uitrusting"
 },
 {
  "nr": 232009,
  "naam": "Afschrijvingen op uitrusting (-)",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "23",
  "rubriek_oms": "Installaties, machines & uitrusting"
 },
 {
  "nr": 240000,
  "naam": "Meubilair",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "24",
  "rubriek_oms": "Meubilair & rollend materieel"
 },
 {
  "nr": 240009,
  "naam": "Afschrijvingen op meubilair (-)",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "24",
  "rubriek_oms": "Meubilair & rollend materieel"
 },
 {
  "nr": 240100,
  "naam": "Kantoormachines",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "24",
  "rubriek_oms": "Meubilair & rollend materieel"
 },
 {
  "nr": 240109,
  "naam": "Afschrijvingen op kantoormachines (-)",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "24",
  "rubriek_oms": "Meubilair & rollend materieel"
 },
 {
  "nr": 240200,
  "naam": "Computers",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "24",
  "rubriek_oms": "Meubilair & rollend materieel"
 },
 {
  "nr": 240209,
  "naam": "Afschrijvingen op computers (-)",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "24",
  "rubriek_oms": "Meubilair & rollend materieel"
 },
 {
  "nr": 241000,
  "naam": "Rollend materieel",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "24",
  "rubriek_oms": "Meubilair & rollend materieel"
 },
 {
  "nr": 241009,
  "naam": "Afschrijvingen op rollend materieel (-)",
  "apko": "A",
  "klasse": "2",
  "klasse_oms": "Vaste activa",
  "rubriek": "24",
  "rubriek_oms": "Meubilair & rollend materieel"
 },
 {
  "nr": 300000,
  "naam": "Voorraad",
  "apko": "A",
  "klasse": "3",
  "klasse_oms": "Voorraden",
  "rubriek": "30",
  "rubriek_oms": "Voorraden"
 },
 {
  "nr": 340000,
  "naam": "Voorraad handelsgoederen",
  "apko": "A",
  "klasse": "3",
  "klasse_oms": "Voorraden",
  "rubriek": "34",
  "rubriek_oms": "Voorraden"
 },
 {
  "nr": 400000,
  "naam": "Handelsdebiteuren",
  "apko": "A",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "40",
  "rubriek_oms": "Handelsvorderingen"
 },
 {
  "nr": 401000,
  "naam": "Te innen wissels",
  "apko": "A",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "40",
  "rubriek_oms": "Handelsvorderingen"
 },
 {
  "nr": 404000,
  "naam": "Te innen opbrengsten",
  "apko": "A",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "40",
  "rubriek_oms": "Handelsvorderingen"
 },
 {
  "nr": 406000,
  "naam": "Vooruitbetalingen",
  "apko": "A",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "40",
  "rubriek_oms": "Handelsvorderingen"
 },
 {
  "nr": 407000,
  "naam": "Dubieuze debiteuren",
  "apko": "A",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "40",
  "rubriek_oms": "Handelsvorderingen"
 },
 {
  "nr": 409000,
  "naam": "Geboekte waardeverminderingen op handelsvorderingen (-)",
  "apko": "A",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "40",
  "rubriek_oms": "Handelsvorderingen"
 },
 {
  "nr": 411000,
  "naam": "Terug te vorderen btw-saldo",
  "apko": "A",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "41",
  "rubriek_oms": "Overige vorderingen"
 },
 {
  "nr": 411100,
  "naam": "Aftrekbare btw",
  "apko": "A",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "41",
  "rubriek_oms": "Overige vorderingen"
 },
 {
  "nr": 411200,
  "naam": "Aftrekbare btw op uitgaande creditnota’s",
  "apko": "A",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "41",
  "rubriek_oms": "Overige vorderingen"
 },
 {
  "nr": 412000,
  "naam": "Terug te vorderen Belgische winstbelastingen",
  "apko": "A",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "41",
  "rubriek_oms": "Overige vorderingen"
 },
 {
  "nr": 414000,
  "naam": "Te innen opbrengsten",
  "apko": "A",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "41",
  "rubriek_oms": "Overige vorderingen"
 },
 {
  "nr": 416000,
  "naam": "Vorderingen op de eigenaar",
  "apko": "A",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "41",
  "rubriek_oms": "Overige vorderingen"
 },
 {
  "nr": 416100,
  "naam": "Voorschotten op bezoldigingen",
  "apko": "A",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "41",
  "rubriek_oms": "Overige vorderingen"
 },
 {
  "nr": 418000,
  "naam": "Terug te vorderen verpakking",
  "apko": "A",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "41",
  "rubriek_oms": "Overige vorderingen"
 },
 {
  "nr": 422000,
  "naam": "Binnen het jaar vervallende leasingschulden",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "42",
  "rubriek_oms": "Schulden op maar dan 1 jaar die binnen het jaar vervallen"
 },
 {
  "nr": 423000,
  "naam": "Binnen het jaar vervallende schulden aan kredietinstellingen",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "42",
  "rubriek_oms": "Schulden op maar dan 1 jaar die binnen het jaar vervallen"
 },
 {
  "nr": 424000,
  "naam": "Binnen het jaar vervallende overige leningen",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "42",
  "rubriek_oms": "Schulden op maar dan 1 jaar die binnen het jaar vervallen"
 },
 {
  "nr": 433000,
  "naam": "Kredietinstellingen – schulden in rekening courant",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "43",
  "rubriek_oms": "Financiële schulden"
 },
 {
  "nr": 439000,
  "naam": "Diverse financiële schulden",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "43",
  "rubriek_oms": "Financiële schulden"
 },
 {
  "nr": 440000,
  "naam": "Leveranciers",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "44",
  "rubriek_oms": "Handelsschulden"
 },
 {
  "nr": 441000,
  "naam": "Te betalen wissels",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "44",
  "rubriek_oms": "Handelsschulden"
 },
 {
  "nr": 444000,
  "naam": "Te ontvangen facturen",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "44",
  "rubriek_oms": "Handelsschulden"
 },
 {
  "nr": 450000,
  "naam": "Geraamd bedrag der Belgische winstbelastingen",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "45",
  "rubriek_oms": "Schulden mbt belastingen, ..."
 },
 {
  "nr": 451000,
  "naam": "Te betalen btw-saldo",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "45",
  "rubriek_oms": "Schulden mbt belastingen, ..."
 },
 {
  "nr": 451100,
  "naam": "Verschuldigde btw",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "45",
  "rubriek_oms": "Schulden mbt belastingen, ..."
 },
 {
  "nr": 451200,
  "naam": "Verschuldigde btw op inkomende creditnota’s",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "45",
  "rubriek_oms": "Schulden mbt belastingen, ..."
 },
 {
  "nr": 451300,
  "naam": "Verschuldigde btw op IC-verwervingen",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "45",
  "rubriek_oms": "Schulden mbt belastingen, ..."
 },
 {
  "nr": 451400,
  "naam": "Btw op invoer met verlegging van heffing",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "45",
  "rubriek_oms": "Schulden mbt belastingen, ..."
 },
 {
  "nr": 451500,
  "naam": "Verschuldigde btw werken in onroerende staat",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "45",
  "rubriek_oms": "Schulden mbt belastingen, ..."
 },
 {
  "nr": 451600,
  "naam": "Regularisatie btw verkopen",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "45",
  "rubriek_oms": "Schulden mbt belastingen, ..."
 },
 {
  "nr": 452000,
  "naam": "Te betalen Belgische winstbelastingen",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "45",
  "rubriek_oms": "Schulden mbt belastingen, ..."
 },
 {
  "nr": 453000,
  "naam": "Ingehouden bedrijfsvoorheffing",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "45",
  "rubriek_oms": "Schulden mbt belastingen, ..."
 },
 {
  "nr": 454000,
  "naam": "Rijksdienst voor Sociale Zekerheid (RSZ)",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "45",
  "rubriek_oms": "Schulden mbt belastingen, ..."
 },
 {
  "nr": 455200,
  "naam": "Verschuldigde lonen",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "45",
  "rubriek_oms": "Schulden mbt belastingen, ..."
 },
 {
  "nr": 455300,
  "naam": "Verschuldigde salarissen",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "45",
  "rubriek_oms": "Schulden mbt belastingen, ..."
 },
 {
  "nr": 456000,
  "naam": "Vakantiegeld",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "45",
  "rubriek_oms": "Schulden mbt belastingen, ..."
 },
 {
  "nr": 471000,
  "naam": "Dividenden over het boekjaar",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "47",
  "rubriek_oms": "Schulden uit bestemming resultaat"
 },
 {
  "nr": 472000,
  "naam": "Tantièmes over het boekjaar",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "47",
  "rubriek_oms": "Schulden uit bestemming resultaat"
 },
 {
  "nr": 488000,
  "naam": "Terug te betalen verpakking",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "48",
  "rubriek_oms": "Diverse schulden"
 },
 {
  "nr": 489000,
  "naam": "Schulden aan de eigenaar",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "48",
  "rubriek_oms": "Diverse schulden"
 },
 {
  "nr": 490000,
  "naam": "Over te dragen kosten",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "49",
  "rubriek_oms": "Overlopende rekeningen"
 },
 {
  "nr": 491000,
  "naam": "Verkregen opbrengsten",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "49",
  "rubriek_oms": "Overlopende rekeningen"
 },
 {
  "nr": 492000,
  "naam": "Toe te rekenen kosten",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "49",
  "rubriek_oms": "Overlopende rekeningen"
 },
 {
  "nr": 493000,
  "naam": "Over te dragen opbrengsten",
  "apko": "P",
  "klasse": "4",
  "klasse_oms": "Vorderingen en schulden op ten hoogste 1 jaar",
  "rubriek": "49",
  "rubriek_oms": "Overlopende rekeningen"
 },
 {
  "nr": 550000,
  "naam": "Bankrekening",
  "apko": "A",
  "klasse": "5",
  "klasse_oms": "Liquide middelen",
  "rubriek": "55",
  "rubriek_oms": "Bank"
 },
 {
  "nr": 570000,
  "naam": "Kas",
  "apko": "A",
  "klasse": "5",
  "klasse_oms": "Liquide middelen",
  "rubriek": "57",
  "rubriek_oms": "Kas"
 },
 {
  "nr": 580000,
  "naam": "Interne overboekingen",
  "apko": "A",
  "klasse": "5",
  "klasse_oms": "Liquide middelen",
  "rubriek": "58",
  "rubriek_oms": "Interne overboekingen"
 },
 {
  "nr": 604000,
  "naam": "Aankopen handelsgoederen",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "60",
  "rubriek_oms": "Handelsgoederen, grond- en hulpstoffen"
 },
 {
  "nr": 604010,
  "naam": "Retours op aankopen (-)",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "60",
  "rubriek_oms": "Handelsgoederen, grond- en hulpstoffen"
 },
 {
  "nr": 604020,
  "naam": "Handelskorting op aankopen (-)",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "60",
  "rubriek_oms": "Handelsgoederen, grond- en hulpstoffen"
 },
 {
  "nr": 604030,
  "naam": "Aankoopkosten",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "60",
  "rubriek_oms": "Handelsgoederen, grond- en hulpstoffen"
 },
  {
  "nr": 609000,
  "naam": "Voorraadwijziging grondstoffen",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "60",
  "rubriek_oms": "Handelsgoederen, grond- en hulpstoffen"
 },
 {
  "nr": 609400,
  "naam": "Voorraadwijzigingen handelsgoederen",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "60",
  "rubriek_oms": "Handelsgoederen, grond- en hulpstoffen"
 },
 {
  "nr": 611000,
  "naam": "Huur en huurlasten",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 611500,
  "naam": "Onderhoud en herstellingen machines",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
  {
  "nr": 611800,
  "naam": "Onderhoud en herstellingen rollend materieel",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 612000,
  "naam": "Kantoorbenodigdheden en drukwerk",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 612100,
  "naam": "Boeken en documentatie",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 612200,
  "naam": "Klein materiaal",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 612220,
  "naam": "Beroepskledij",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 612500,
  "naam": "Verbruik water",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 612600,
  "naam": "Verbruik gas",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 612700,
  "naam": "Verbruik elektriciteit",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 612800,
  "naam": "Handelsverpakkingen",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 613200,
  "naam": "Erelonen boekhouders",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 613300,
  "naam": "Sociaal secretariaat",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 613500,
  "naam": "Wettelijke bekendmaking",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 614400,
  "naam": "Verzekering rollend materieel",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 615000,
  "naam": "Vervoerskosten op verkoop",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
  {
  "nr": 616200,
  "naam": "Telefoon, gsm",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 616300,
  "naam": "Internetkosten",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 616500,
  "naam": "Brandstof voertuigen",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 616520,
  "naam": "Publiciteitskosten",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 617000,
  "naam": "Uitzendkrachten",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "61",
  "rubriek_oms": "Diensten en diverse goederen"
 },
 {
  "nr": 620200,
  "naam": "Bezoldigingen bedienden",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "62",
  "rubriek_oms": "Bezoldigingen, sociale lasten en pensioenen"
 },
 {
  "nr": 620300,
  "naam": "Bezoldigingen arbeiders",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "62",
  "rubriek_oms": "Bezoldigingen, sociale lasten en pensioenen"
 },
 {
  "nr": 621000,
  "naam": "Werkgeversbijdrage RSZ",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "62",
  "rubriek_oms": "Bezoldigingen, sociale lasten en pensioenen"
 },
 {
  "nr": 623000,
  "naam": "Andere personeelskosten",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "62",
  "rubriek_oms": "Bezoldigingen, sociale lasten en pensioenen"
 },
 {
  "nr": 625000,
  "naam": "Voorziening vakantiegeld",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "62",
  "rubriek_oms": "Bezoldigingen, sociale lasten en pensioenen"
 },
 {
  "nr": 630000,
  "naam": "Afschrijvingen oprichtingskosten",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "63",
  "rubriek_oms": "Afschrijvingen"
 },
 {
  "nr": 630100,
  "naam": "Afschrijvingen op immateriële vaste activa",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "63",
  "rubriek_oms": "Afschrijvingen"
 },
 {
  "nr": 630200,
  "naam": "Afschrijvingen op materiële vaste activa",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "63",
  "rubriek_oms": "Afschrijvingen"
 },
 {
  "nr": 630300,
  "naam": "Afschrijvingen op meubilair en rollend materieel",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "63",
  "rubriek_oms": "Afschrijvingen"
 },
 {
  "nr": 634000,
  "naam": "Waardeverminderingen op handelsvorderingen op ten hoogste 1 jaar: toevoeging",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "63",
  "rubriek_oms": "Afschrijvingen"
 },
 {
  "nr": 634100,
  "naam": "Waardeverminderingen op handelsvorderingen op ten hoogste 1 jaar: terugname (-)",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "63",
  "rubriek_oms": "Afschrijvingen"
 },
 {
  "nr": 636000,
  "naam": "Voorzieningen voor grote herstellingen en groot onderhoud: toevoeging",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "63",
  "rubriek_oms": "Afschrijvingen"
 },
 {
  "nr": 636100,
  "naam": "Voorzieningen voor grote herstellingen en groot onderhoud: terugname (-)",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "63",
  "rubriek_oms": "Afschrijvingen"
 },
 {
  "nr": 640000,
  "naam": "Bedrijfsbelastingen",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "64",
  "rubriek_oms": "Andere bedrijfskosten"
 },
 {
  "nr": 642000,
  "naam": "Minderwaarden op de realisatie van handelsvorderingen",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "64",
  "rubriek_oms": "Andere bedrijfskosten"
 },
 {
  "nr": 643000,
  "naam": "Diverse bedrijfskosten",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "64",
  "rubriek_oms": "Andere bedrijfskosten"
 },
 {
  "nr": 650000,
  "naam": "Rente, commissies en kosten verbonden aan schulden",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "65",
  "rubriek_oms": "Financiële kosten"
 },
 {
  "nr": 650010,
  "naam": "Kosten van leasingschulden",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "65",
  "rubriek_oms": "Financiële kosten"
 },
 {
  "nr": 652000,
  "naam": "Minderwaarden op realisatie van vlottende activa",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "65",
  "rubriek_oms": "Financiële kosten"
 },
 {
  "nr": 654000,
  "naam": "Wisselresultaten: verlies",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "65",
  "rubriek_oms": "Financiële kosten"
 },
 {
  "nr": 657000,
  "naam": "Betalingskortingen aan klanten",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "65",
  "rubriek_oms": "Financiële kosten"
 },
 {
  "nr": 659000,
  "naam": "Diverse financiële kosten",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "65",
  "rubriek_oms": "Financiële kosten"
 },
 {
  "nr": 662000,
  "naam": "Voorzieningen voor niet-recurrente risico’s en kosten: toevoeging",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "66",
  "rubriek_oms": "Niet-recurrente bedrijfs- en financiële kosten"
 },
 {
  "nr": 662100,
  "naam": "Voorzieningen voor niet-recurrente risico’s en kosten: terugname (-)",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "66",
  "rubriek_oms": "Niet-recurrente bedrijfs- en financiële kosten"
 },
 {
  "nr": 663000,
  "naam": "Minderwaarden op de realisatie van vaste activa",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "66",
  "rubriek_oms": "Niet-recurrente bedrijfs- en financiële kosten"
 },
 {
  "nr": 664000,
  "naam": "Andere niet-recurrente bedrijfskosten",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "66",
  "rubriek_oms": "Niet-recurrente bedrijfs- en financiële kosten"
 },
 {
  "nr": 668000,
  "naam": "Andere niet-recurrente financiële kosten",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "66",
  "rubriek_oms": "Niet-recurrente bedrijfs- en financiële kosten"
 },
 {
  "nr": 670000,
  "naam": "Verschuldigde of gestorte belastingen en voorheffingen",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "67",
  "rubriek_oms": "Belastingen op het resultaat"
 },
 {
  "nr": 670100,
  "naam": "Geactiveerde overschotten van betaalde belastingen en voorheffingen (-)",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "67",
  "rubriek_oms": "Belastingen op het resultaat"
 },
 {
  "nr": 670200,
  "naam": "Geraamde belastingen",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "67",
  "rubriek_oms": "Belastingen op het resultaat"
 },
 {
  "nr": 671000,
  "naam": "Belgische belastingen op het resultaat van het vorige boekjaar",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "67",
  "rubriek_oms": "Belastingen op het resultaat"
 },
 {
  "nr": 690000,
  "naam": "Overgedragen verlies van het vorige boekjaar",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "69",
  "rubriek_oms": "Resultaatverwerking"
 },
 {
  "nr": 692000,
  "naam": "Toevoeging aan de wettelijke reserves",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "69",
  "rubriek_oms": "Resultaatverwerking"
 },
 {
  "nr": 692100,
  "naam": "Toevoeging aan de overige reserves",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "69",
  "rubriek_oms": "Resultaatverwerking"
 },
 {
  "nr": 693000,
  "naam": "Over te dragen winst",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "69",
  "rubriek_oms": "Resultaatverwerking"
 },
 {
  "nr": 694000,
  "naam": "Vergoeding van het kapitaal",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "69",
  "rubriek_oms": "Resultaatverwerking"
 },
 {
  "nr": 695000,
  "naam": "Bestuurders of zaakvoerders",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "69",
  "rubriek_oms": "Resultaatverwerking"
 },
 {
  "nr": 696000,
  "naam": "Andere rechthebbenden",
  "apko": "K",
  "klasse": "6",
  "klasse_oms": "Kosten",
  "rubriek": "69",
  "rubriek_oms": "Resultaatverwerking"
 },
 {
  "nr": 704000,
  "naam": "Verkopen handelsgoederen",
  "apko": "O",
  "klasse": "7",
  "klasse_oms": "Opbrengsten",
  "rubriek": "70",
  "rubriek_oms": "Omzet"
 },
  {
  "nr": 704010,
  "naam": "Retours op verkopen (-)",
  "apko": "O",
  "klasse": "7",
  "klasse_oms": "Opbrengsten",
  "rubriek": "70",
  "rubriek_oms": "Omzet"
 },
 {
  "nr": 704020,
  "naam": "Handelskorting op verkopen (-)",
  "apko": "O",
  "klasse": "7",
  "klasse_oms": "Opbrengsten",
  "rubriek": "70",
  "rubriek_oms": "Omzet"
 },
 {
  "nr": 742000,
  "naam": "Meerwaarden op de realisatie van handelsvorderingen",
  "apko": "O",
  "klasse": "7",
  "klasse_oms": "Opbrengsten",
  "rubriek": "74",
  "rubriek_oms": "Andere bedrijfsopbrengsten"
 },
 {
  "nr": 744000,
  "naam": "Huuropbrengsten",
  "apko": "O",
  "klasse": "7",
  "klasse_oms": "Opbrengsten",
  "rubriek": "74",
  "rubriek_oms": "Andere bedrijfsopbrengsten"
 },
 {
  "nr": 746000,
  "naam": "Doorgerekende kosten",
  "apko": "O",
  "klasse": "7",
  "klasse_oms": "Opbrengsten",
  "rubriek": "74",
  "rubriek_oms": "Andere bedrijfsopbrengsten"
 },
 {
  "nr": 749000,
  "naam": "Diverse bedrijfsopbrengsten",
  "apko": "O",
  "klasse": "7",
  "klasse_oms": "Opbrengsten",
  "rubriek": "74",
  "rubriek_oms": "Andere bedrijfsopbrengsten"
 },
 {
  "nr": 751000,
  "naam": "Opbrengsten uit vlottende activa",
  "apko": "O",
  "klasse": "7",
  "klasse_oms": "Opbrengsten",
  "rubriek": "75",
  "rubriek_oms": "Financiële opbrengsten"
 },
 {
  "nr": 752000,
  "naam": "Meerwaarden op de realisatie van vlottende activa",
  "apko": "O",
  "klasse": "7",
  "klasse_oms": "Opbrengsten",
  "rubriek": "75",
  "rubriek_oms": "Financiële opbrengsten"
 },
 {
  "nr": 754000,
  "naam": "Wisselresultaten: winst",
  "apko": "O",
  "klasse": "7",
  "klasse_oms": "Opbrengsten",
  "rubriek": "75",
  "rubriek_oms": "Financiële opbrengsten"
 },
 {
  "nr": 757000,
  "naam": "Betalingskortingen van leveranciers",
  "apko": "O",
  "klasse": "7",
  "klasse_oms": "Opbrengsten",
  "rubriek": "75",
  "rubriek_oms": "Financiële opbrengsten"
 },
 {
  "nr": 759000,
  "naam": "Diverse financiële opbrengsten",
  "apko": "O",
  "klasse": "7",
  "klasse_oms": "Opbrengsten",
  "rubriek": "75",
  "rubriek_oms": "Financiële opbrengsten"
 },
 {
  "nr": 764000,
  "naam": "Andere niet-recurrente bedrijfsopbrengsten",
  "apko": "O",
  "klasse": "7",
  "klasse_oms": "Opbrengsten",
  "rubriek": "76",
  "rubriek_oms": "Niet-recurrente bedrijfs- of financiële opbrengsten"
 },
 {
  "nr": 768000,
  "naam": "Andere niet-recurrente financiële opbrengsten",
  "apko": "O",
  "klasse": "7",
  "klasse_oms": "Opbrengsten",
  "rubriek": "76",
  "rubriek_oms": "Niet-recurrente bedrijfs- of financiële opbrengsten"
 },
 {
  "nr": 790000,
  "naam": "Overgedragen winst van het vorige boekjaar",
  "apko": "O",
  "klasse": "7",
  "klasse_oms": "Opbrengsten",
  "rubriek": "79",
  "rubriek_oms": "Resultaatverwerking"
 },
 {
  "nr": 793000,
  "naam": "Over te dragen verlies",
  "apko": "O",
  "klasse": "7",
  "klasse_oms": "Opbrengsten",
  "rubriek": "79",
  "rubriek_oms": "Resultaatverwerking"
 }
];
