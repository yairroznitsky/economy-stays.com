
export type SkyscannerProduct = 'car' | 'flights' | 'hotels';

export interface ProductConfig {
  apiPath: string;
  sessionUrl: string;
  referer: string;
  clientName: string;
  autosuggestExp?: string;
  partnersPath: string;
}

export const PRODUCT_CONFIG: Record<SkyscannerProduct, ProductConfig> = {
  car: {
    apiPath: 'search-car',
    sessionUrl: 'https://www.skyscanner.net/carhire',
    referer: 'https://www.skyscanner.net/carhire',
    clientName: 'car-hire-search-controls',
    autosuggestExp: 'neighborhood_b',
    partnersPath: 'carhire',
  },
  flights: {
    apiPath: 'search-flight',
    sessionUrl: 'https://www.skyscanner.net/',
    referer: 'https://www.skyscanner.net/',
    clientName: 'flight-search-controls',
    partnersPath: 'flights',
  },
  hotels: {
    apiPath: 'search-hotel',
    sessionUrl: 'https://www.skyscanner.net/hotels',
    referer: 'https://www.skyscanner.net/hotels',
    clientName: 'hotel-search-controls',
    partnersPath: 'hotels',
  },
};

export function parseProduct(value: string | null): SkyscannerProduct {
  if (value === 'flights' || value === 'hotels' || value === 'car') {
    return value;
  }
  return 'flights';
}
