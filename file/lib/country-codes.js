/**
 * ============================================================================
 * Country Codes - ISO-3166 Alpha-3 Mapping
 * ============================================================================
 * 
 * Comprehensive mapping of 3-letter country codes to country names.
 * Supports all passport nationalities.
 * ============================================================================
 */

const COUNTRY_CODES = {
    // A
    'AFG': 'Afghanistan',
    'ALB': 'Albania',
    'DZA': 'Algeria',
    'AND': 'Andorra',
    'AGO': 'Angola',
    'ATG': 'Antigua and Barbuda',
    'ARG': 'Argentina',
    'ARM': 'Armenia',
    'AUS': 'Australia',
    'AUT': 'Austria',
    'AZE': 'Azerbaijan',

    // B
    'BHS': 'Bahamas',
    'BHR': 'Bahrain',
    'BGD': 'Bangladesh',
    'BRB': 'Barbados',
    'BLR': 'Belarus',
    'BEL': 'Belgium',
    'BLZ': 'Belize',
    'BEN': 'Benin',
    'BTN': 'Bhutan',
    'BOL': 'Bolivia',
    'BIH': 'Bosnia and Herzegovina',
    'BWA': 'Botswana',
    'BRA': 'Brazil',
    'BRN': 'Brunei',
    'BGR': 'Bulgaria',
    'BFA': 'Burkina Faso',
    'BDI': 'Burundi',

    // C
    'KHM': 'Cambodia',
    'CMR': 'Cameroon',
    'CAN': 'Canada',
    'CPV': 'Cape Verde',
    'CAF': 'Central African Republic',
    'TCD': 'Chad',
    'CHL': 'Chile',
    'CHN': 'China',
    'COL': 'Colombia',
    'COM': 'Comoros',
    'COG': 'Congo',
    'COD': 'Democratic Republic of the Congo',
    'CRI': 'Costa Rica',
    'CIV': 'Ivory Coast',
    'HRV': 'Croatia',
    'CUB': 'Cuba',
    'CYP': 'Cyprus',
    'CZE': 'Czech Republic',

    // D
    'DNK': 'Denmark',
    'DJI': 'Djibouti',
    'DMA': 'Dominica',
    'DOM': 'Dominican Republic',

    // E
    'ECU': 'Ecuador',
    'EGY': 'Egypt',
    'SLV': 'El Salvador',
    'GNQ': 'Equatorial Guinea',
    'ERI': 'Eritrea',
    'EST': 'Estonia',
    'SWZ': 'Eswatini',
    'ETH': 'Ethiopia',

    // F
    'FJI': 'Fiji',
    'FIN': 'Finland',
    'FRA': 'France',

    // G
    'GAB': 'Gabon',
    'GMB': 'Gambia',
    'GEO': 'Georgia',
    'DEU': 'Germany',
    'D': 'Germany',  // Alternative code
    'GHA': 'Ghana',
    'GRC': 'Greece',
    'GRD': 'Grenada',
    'GTM': 'Guatemala',
    'GIN': 'Guinea',
    'GNB': 'Guinea-Bissau',
    'GUY': 'Guyana',

    // H
    'HTI': 'Haiti',
    'HND': 'Honduras',
    'HUN': 'Hungary',

    // I
    'ISL': 'Iceland',
    'IND': 'India',
    'IDN': 'Indonesia',
    'IRN': 'Iran',
    'IRQ': 'Iraq',
    'IRL': 'Ireland',
    'ISR': 'Israel',
    'ITA': 'Italy',

    // J
    'JAM': 'Jamaica',
    'JPN': 'Japan',
    'JOR': 'Jordan',

    // K
    'KAZ': 'Kazakhstan',
    'KEN': 'Kenya',
    'KIR': 'Kiribati',
    'PRK': 'North Korea',
    'KOR': 'South Korea',
    'KWT': 'Kuwait',
    'KGZ': 'Kyrgyzstan',

    // L
    'LAO': 'Laos',
    'LVA': 'Latvia',
    'LBN': 'Lebanon',
    'LSO': 'Lesotho',
    'LBR': 'Liberia',
    'LBY': 'Libya',
    'LIE': 'Liechtenstein',
    'LTU': 'Lithuania',
    'LUX': 'Luxembourg',

    // M
    'MDG': 'Madagascar',
    'MWI': 'Malawi',
    'MYS': 'Malaysia',
    'MDV': 'Maldives',
    'MLI': 'Mali',
    'MLT': 'Malta',
    'MHL': 'Marshall Islands',
    'MRT': 'Mauritania',
    'MUS': 'Mauritius',
    'MEX': 'Mexico',
    'FSM': 'Micronesia',
    'MDA': 'Moldova',
    'MCO': 'Monaco',
    'MNG': 'Mongolia',
    'MNE': 'Montenegro',
    'MAR': 'Morocco',
    'MOZ': 'Mozambique',
    'MMR': 'Myanmar',

    // N
    'NAM': 'Namibia',
    'NRU': 'Nauru',
    'NPL': 'Nepal',
    'NLD': 'Netherlands',
    'NZL': 'New Zealand',
    'NIC': 'Nicaragua',
    'NER': 'Niger',
    'NGA': 'Nigeria',
    'MKD': 'North Macedonia',
    'NOR': 'Norway',

    // O
    'OMN': 'Oman',

    // P
    'PAK': 'Pakistan',
    'PLW': 'Palau',
    'PSE': 'Palestine',
    'PAN': 'Panama',
    'PNG': 'Papua New Guinea',
    'PRY': 'Paraguay',
    'PER': 'Peru',
    'PHL': 'Philippines',
    'POL': 'Poland',
    'PRT': 'Portugal',

    // Q
    'QAT': 'Qatar',

    // R
    'ROU': 'Romania',
    'RUS': 'Russia',
    'RWA': 'Rwanda',

    // S
    'KNA': 'Saint Kitts and Nevis',
    'LCA': 'Saint Lucia',
    'VCT': 'Saint Vincent and the Grenadines',
    'WSM': 'Samoa',
    'SMR': 'San Marino',
    'STP': 'Sao Tome and Principe',
    'SAU': 'Saudi Arabia',
    'SEN': 'Senegal',
    'SRB': 'Serbia',
    'SYC': 'Seychelles',
    'SLE': 'Sierra Leone',
    'SGP': 'Singapore',
    'SVK': 'Slovakia',
    'SVN': 'Slovenia',
    'SLB': 'Solomon Islands',
    'SOM': 'Somalia',
    'ZAF': 'South Africa',
    'SSD': 'South Sudan',
    'ESP': 'Spain',
    'LKA': 'Sri Lanka',
    'SDN': 'Sudan',
    'SUR': 'Suriname',
    'SWE': 'Sweden',
    'CHE': 'Switzerland',
    'SYR': 'Syria',

    // T
    'TWN': 'Taiwan',
    'TJK': 'Tajikistan',
    'TZA': 'Tanzania',
    'THA': 'Thailand',
    'TLS': 'Timor-Leste',
    'TGO': 'Togo',
    'TON': 'Tonga',
    'TTO': 'Trinidad and Tobago',
    'TUN': 'Tunisia',
    'TUR': 'Turkey',
    'TKM': 'Turkmenistan',
    'TUV': 'Tuvalu',

    // U
    'UGA': 'Uganda',
    'UKR': 'Ukraine',
    'ARE': 'United Arab Emirates',
    'UAE': 'United Arab Emirates',  // Common alternative
    'GBR': 'United Kingdom',
    'USA': 'United States of America',
    'URY': 'Uruguay',
    'UZB': 'Uzbekistan',

    // V
    'VUT': 'Vanuatu',
    'VAT': 'Vatican City',
    'VEN': 'Venezuela',
    'VNM': 'Vietnam',

    // Y
    'YEM': 'Yemen',

    // Z
    'ZMB': 'Zambia',
    'ZWE': 'Zimbabwe',
};

/**
 * Get country name from ISO-3166 alpha-3 code.
 * 
 * @param {string} code - 3-letter country code
 * @returns {{code: string, name: string|null}} - Country info
 */
function getCountryName(code) {
    if (!code) return { code: null, name: null };

    const cleanCode = code.toUpperCase().replace(/[^A-Z]/g, '');
    const name = COUNTRY_CODES[cleanCode] || null;

    return { code: cleanCode, name };
}

module.exports = { COUNTRY_CODES, getCountryName };
