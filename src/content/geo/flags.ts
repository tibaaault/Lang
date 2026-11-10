// Drapeaux des pays, sous forme de pictogrammes : aucun fichier image à
// charger. Chaque pays est rattaché à son code ISO à deux lettres, dont le
// drapeau se déduit.

const ISO: Record<string, string> = {
  // Europe
  Albanie: 'AL', Allemagne: 'DE', Andorre: 'AD', Autriche: 'AT', Belgique: 'BE',
  Biélorussie: 'BY', 'Bosnie-Herzégovine': 'BA', Bulgarie: 'BG', Chypre: 'CY',
  Croatie: 'HR', Danemark: 'DK', Espagne: 'ES', Estonie: 'EE', Finlande: 'FI',
  France: 'FR', Grèce: 'GR', Hongrie: 'HU', Irlande: 'IE', Islande: 'IS',
  Italie: 'IT', Kosovo: 'XK', Lettonie: 'LV', Liechtenstein: 'LI', Lituanie: 'LT',
  Luxembourg: 'LU', 'Macédoine du Nord': 'MK', Malte: 'MT', Moldavie: 'MD',
  Monaco: 'MC', Monténégro: 'ME', Norvège: 'NO', 'Pays-Bas': 'NL', Pologne: 'PL',
  Portugal: 'PT', 'République tchèque': 'CZ', Roumanie: 'RO', 'Royaume-Uni': 'GB',
  Russie: 'RU', 'Saint-Marin': 'SM', Serbie: 'RS', Slovaquie: 'SK', Slovénie: 'SI',
  Suède: 'SE', Suisse: 'CH', Ukraine: 'UA', Vatican: 'VA',
  // Afrique
  'Afrique du Sud': 'ZA', Algérie: 'DZ', Angola: 'AO', Bénin: 'BJ', Botswana: 'BW',
  'Burkina Faso': 'BF', Burundi: 'BI', Cameroun: 'CM', 'Cap-Vert': 'CV',
  Centrafrique: 'CF', Comores: 'KM', Congo: 'CG', "Côte d'Ivoire": 'CI',
  Djibouti: 'DJ', Égypte: 'EG', Érythrée: 'ER', Eswatini: 'SZ', Éthiopie: 'ET',
  Gabon: 'GA', Gambie: 'GM', Ghana: 'GH', Guinée: 'GN', 'Guinée équatoriale': 'GQ',
  'Guinée-Bissau': 'GW', Kenya: 'KE', Lesotho: 'LS', Liberia: 'LR', Libye: 'LY',
  Madagascar: 'MG', Malawi: 'MW', Mali: 'ML', Maroc: 'MA', Maurice: 'MU',
  Mauritanie: 'MR', Mozambique: 'MZ', Namibie: 'NA', Niger: 'NE', Nigeria: 'NG',
  Ouganda: 'UG', 'République démocratique du Congo': 'CD', Rwanda: 'RW',
  'Sao Tomé-et-Principe': 'ST', Sénégal: 'SN', Seychelles: 'SC',
  'Sierra Leone': 'SL', Somalie: 'SO', Soudan: 'SD', 'Soudan du Sud': 'SS',
  Tanzanie: 'TZ', Tchad: 'TD', Togo: 'TG', Tunisie: 'TN', Zambie: 'ZM',
  Zimbabwe: 'ZW',
  // Asie
  Afghanistan: 'AF', 'Arabie saoudite': 'SA', Arménie: 'AM', Azerbaïdjan: 'AZ',
  Bahreïn: 'BH', Bangladesh: 'BD', Bhoutan: 'BT', Birmanie: 'MM', Brunei: 'BN',
  Cambodge: 'KH', Chine: 'CN', 'Corée du Nord': 'KP', 'Corée du Sud': 'KR',
  'Émirats arabes unis': 'AE', Géorgie: 'GE', Inde: 'IN', Indonésie: 'ID',
  Irak: 'IQ', Iran: 'IR', Israël: 'IL', Japon: 'JP', Jordanie: 'JO',
  Kazakhstan: 'KZ', Kirghizistan: 'KG', Koweït: 'KW', Laos: 'LA', Liban: 'LB',
  Malaisie: 'MY', Maldives: 'MV', Mongolie: 'MN', Népal: 'NP', Oman: 'OM',
  Ouzbékistan: 'UZ', Pakistan: 'PK', Palestine: 'PS', Philippines: 'PH',
  Qatar: 'QA', Singapour: 'SG', 'Sri Lanka': 'LK', Syrie: 'SY', Tadjikistan: 'TJ',
  Taïwan: 'TW', Thaïlande: 'TH', 'Timor oriental': 'TL', Turkménistan: 'TM',
  Turquie: 'TR', 'Viêt Nam': 'VN', Yémen: 'YE',
  // Amérique du Nord et Caraïbes
  'Antigua-et-Barbuda': 'AG', Bahamas: 'BS', Barbade: 'BB', Belize: 'BZ',
  Canada: 'CA', 'Costa Rica': 'CR', Cuba: 'CU', Dominique: 'DM', 'États-Unis': 'US',
  Grenade: 'GD', Guatemala: 'GT', Haïti: 'HT', Honduras: 'HN', Jamaïque: 'JM',
  Mexique: 'MX', Nicaragua: 'NI', Panama: 'PA', 'République dominicaine': 'DO',
  'Saint-Christophe-et-Niévès': 'KN', 'Saint-Vincent-et-les-Grenadines': 'VC',
  'Sainte-Lucie': 'LC', Salvador: 'SV', 'Trinité-et-Tobago': 'TT',
  // Amérique du Sud
  Argentine: 'AR', Bolivie: 'BO', Brésil: 'BR', Chili: 'CL', Colombie: 'CO',
  Équateur: 'EC', Guyana: 'GY', Paraguay: 'PY', Pérou: 'PE', Suriname: 'SR',
  Uruguay: 'UY', Venezuela: 'VE',
  // Océanie
  Australie: 'AU', Fidji: 'FJ', 'Îles Marshall': 'MH', 'Îles Salomon': 'SB',
  Kiribati: 'KI', Micronésie: 'FM', Nauru: 'NR', 'Nouvelle-Zélande': 'NZ',
  Palaos: 'PW', 'Papouasie-Nouvelle-Guinée': 'PG', Samoa: 'WS', Tonga: 'TO',
  Tuvalu: 'TV', Vanuatu: 'VU',
}

/** Le drapeau d'un pays, ou rien si le pays n'est pas répertorié. */
export function flagOf(country: string): string | undefined {
  const code = ISO[country]
  if (!code) return undefined
  return String.fromCodePoint(
    ...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  )
}
