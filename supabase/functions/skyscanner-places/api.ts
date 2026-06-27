import { PARTNERS_AUTOSUGGEST_BASE_URL } from './constants.ts';
import { PRODUCT_CONFIG, type SkyscannerProduct } from './products.ts';
import { safeJsonParse } from './utils.ts';

export interface SkyscannerAutosuggestResult {
  status: number;
  contentType: string;
  body: string;
  isJson: boolean;
  parsed: unknown | null;
}

export async function fetchSkyscannerAutosuggest(
  searchTerm: string,
  market: string,
  locale: string,
  product: SkyscannerProduct,
  cookies: string,
  userAgent: string,
): Promise<SkyscannerAutosuggestResult> {
  const config = PRODUCT_CONFIG[product];
  const querySuffix = config.autosuggestExp ? `?autosuggestExp=${config.autosuggestExp}` : '';
  const url =
    `https://www.skyscanner.net/g/autosuggest-search/api/v1/${config.apiPath}/${market}/${locale}/${encodeURIComponent(searchTerm)}${querySuffix}`;

  console.log(`Skyscanner Places API: Fetching ${product} autosuggest for "${searchTerm}" (${market}/${locale})`);

  const headers: Record<string, string> = {
    accept: 'application/json',
    'accept-language': 'en-US,en;q=0.9',
    referer: config.referer,
    'skyscanner-client-name': config.clientName,
    'user-agent': userAgent,
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
  };

  if (cookies) {
    headers.cookie = cookies;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const body = await response.text();

  console.log(`Skyscanner Places API: ${product} response status ${response.status}, content-type: ${contentType}`);

  return {
    status: response.status,
    contentType,
    body,
    isJson: contentType.includes('application/json'),
    parsed: contentType.includes('application/json') ? safeJsonParse(body) : null,
  };
}

export async function fetchPartnersAutosuggest(
  searchTerm: string,
  market: string,
  locale: string,
  product: SkyscannerProduct,
  apiKey: string,
): Promise<SkyscannerAutosuggestResult> {
  const config = PRODUCT_CONFIG[product];
  const url = `${PARTNERS_AUTOSUGGEST_BASE_URL}/${config.partnersPath}`;

  console.log(
    `Skyscanner Places API: Fetching ${product} partners autosuggest for "${searchTerm}" (${market}/${locale})`,
  );

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      query: {
        market,
        locale,
        searchTerm,
      },
      limit: 15,
    }),
  });

  const contentType = response.headers.get('content-type') ?? '';
  const body = await response.text();

  console.log(
    `Skyscanner Places API: partners ${product} response status ${response.status}, content-type: ${contentType}`,
  );

  return {
    status: response.status,
    contentType,
    body,
    isJson: contentType.includes('application/json'),
    parsed: contentType.includes('application/json') ? safeJsonParse(body) : null,
  };
}
