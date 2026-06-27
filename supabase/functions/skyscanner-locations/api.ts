
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
  cookies: string,
  userAgent: string,
): Promise<SkyscannerAutosuggestResult> {
  const url =
    `https://www.skyscanner.net/g/autosuggest-search/api/v1/search-car/${market}/${locale}/${encodeURIComponent(searchTerm)}?autosuggestExp=neighborhood_b`;

  console.log(`Skyscanner API: Fetching autosuggest for "${searchTerm}" (${market}/${locale})`);

  const headers: Record<string, string> = {
    accept: 'application/json',
    'accept-language': 'en-US,en;q=0.9',
    referer: 'https://www.skyscanner.net/carhire',
    'skyscanner-client-name': 'car-hire-search-controls',
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

  console.log(`Skyscanner API: Response status ${response.status}, content-type: ${contentType}`);

  return {
    status: response.status,
    contentType,
    body,
    isJson: contentType.includes('application/json'),
    parsed: contentType.includes('application/json') ? safeJsonParse(body) : null,
  };
}
