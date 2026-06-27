import { isIATACode, METRO_IATA_TO_CITY } from './utils.ts';
import type { SkyscannerProduct } from './products.ts';

export interface TransformedLocation {
  id: string;
  name: string;
  displayName: string;
  city: string;
  country: string;
  code: string;
  type: string;
  iconUrl: null;
  partnerMetadata: Record<string, unknown>;
}

function mapSkyscannerType(type: string | undefined): string {
  const normalized = (type ?? '').toLowerCase();
  switch (normalized) {
    case 'place_type_airport':
    case 'airport':
      return 'airport';
    case 'place_type_city':
    case 'city':
      return 'city';
    case 'place_type_hotel':
    case 'hotel':
      return 'hotel';
    case 'place_type_district':
    case 'district':
      return 'location';
    case 'place_type_train_station':
    case 'train station':
      return 'location';
    default:
      return 'location';
  }
}

function extractIataCode(entityName: string): string {
  const match = entityName.match(/\(([A-Z]{3})\)\s*$/);
  return match?.[1] ?? '';
}

function transformPlaceResultItem(
  item: Record<string, unknown>,
  product: SkyscannerProduct,
): TransformedLocation {
  const entityId = String(
    item.entityId ?? item.entity_id ?? item.id ?? item.location_id ?? '',
  );
  const entityName = String(
    item.entity_name ?? item.name ?? item.location_name ?? `Entity ${entityId}`,
  );
  const hierarchy = String(item.hierarchy ?? item.displayName ?? '');
  const parts = hierarchy.split('|').filter(Boolean);
  const iataCode = extractIataCode(entityName) ||
    String(item.iataCode ?? item.iata_code ?? '').toUpperCase();
  const skyscannerClass = String(item.class ?? item.type ?? '');

  return {
    id: entityId,
    name: entityName.replace(/\s*\([A-Z]{3}\)\s*$/, '').trim() || entityName,
    displayName: hierarchy ? parts.join(', ') : entityName,
    city: String(item.city ?? item.cityName ?? parts[0] ?? ''),
    country: String(item.country ?? item.countryName ?? parts[parts.length - 1] ?? ''),
    code: iataCode || entityId,
    type: mapSkyscannerType(skyscannerClass),
    iconUrl: null,
    partnerMetadata: {
      entityId,
      entityName,
      skyscannerClass,
      location: item.location ?? null,
      product,
      source: `${product}-autosuggest`,
    },
  };
}

function transformFlightResultItem(item: Record<string, unknown>): TransformedLocation {
  const entityId = String(item.GeoId ?? item.GeoContainerId ?? '');
  const placeName = String(item.PlaceName ?? '');
  const resultingPhrase = String(item.ResultingPhrase ?? item.UntransliteratedResultingPhrase ?? '');
  const cityName = String(item.CityName ?? '');
  const countryName = String(item.CountryName ?? '');
  const placeId = String(item.PlaceId ?? '');
  const iataFromField = String(item.IataCode ?? '').toUpperCase();
  const phraseLead = resultingPhrase.split(',')[0] ?? placeName;
  const iataFromPhrase = extractIataCode(phraseLead);
  const iataCode = iataFromPhrase || iataFromField || (/^[A-Z]{3}$/.test(placeId) ? placeId : '');

  const isAirport = /^[A-Z]{3}$/.test(placeId) && iataFromPhrase === placeId;
  const isCity = !isAirport;

  const hierarchyParts = resultingPhrase.split(',').slice(1).join(',').split('|').map((p) => p.trim()).filter(Boolean);
  const displayName = hierarchyParts.length > 0
    ? hierarchyParts.join(', ')
    : [cityName, countryName].filter(Boolean).join(', ');

  return {
    id: entityId,
    name: placeName,
    displayName: displayName || placeName,
    city: cityName,
    country: countryName,
    code: iataCode || placeId,
    type: isAirport ? 'airport' : isCity ? 'city' : 'location',
    iconUrl: null,
    partnerMetadata: {
      entityId,
      placeId,
      cityId: item.CityId ?? null,
      regionId: item.RegionId ?? null,
      location: item.Location ?? null,
      resultingPhrase,
      product: 'flights',
      source: 'flights-autosuggest',
    },
  };
}

function prioritizeIataResults(locations: TransformedLocation[], searchTerm: string): TransformedLocation[] {
  if (!isIATACode(searchTerm) || locations.length === 0) {
    return locations;
  }

  const upper = searchTerm.trim().toUpperCase();

  const exactMatches = locations.filter(
    (loc) =>
      loc.code === upper ||
      loc.partnerMetadata?.placeId === upper ||
      String(loc.partnerMetadata?.entityName ?? '').toUpperCase().includes(`(${upper})`) ||
      String(loc.partnerMetadata?.resultingPhrase ?? '').toUpperCase().includes(`(${upper})`),
  );

  if (exactMatches.length > 0) {
    const best = exactMatches[0];
    return [best, ...locations.filter((loc) => loc.id !== best.id)].slice(0, 15);
  }

  const metroCity = METRO_IATA_TO_CITY[upper];
  if (metroCity) {
    const cityMatch = locations.find(
      (loc) => loc.type === 'city' && loc.name.toLowerCase() === metroCity.toLowerCase(),
    );
    if (cityMatch) {
      const tagged = { ...cityMatch, code: upper };
      return [tagged, ...locations.filter((loc) => loc.id !== cityMatch.id)].slice(0, 15);
    }
  }

  return locations;
}

function extractRawItems(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data as Record<string, unknown>[];
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  const payload = data as Record<string, unknown>;
  if (Array.isArray(payload.results)) return payload.results as Record<string, unknown>[];
  if (Array.isArray(payload.places)) return payload.places as Record<string, unknown>[];
  return [];
}

export function transformSkyscannerData(
  data: unknown,
  searchTerm: string,
  product: SkyscannerProduct,
): TransformedLocation[] {
  const rawItems = extractRawItems(data);

  let locations: TransformedLocation[];

  if (product === 'flights') {
    locations = rawItems.map(transformFlightResultItem);
  } else {
    locations = rawItems.map((item) => transformPlaceResultItem(item, product));
  }

  if (locations.length === 0 && data && typeof data === 'object') {
    const payload = data as Record<string, unknown>;
    const ids = String(payload.suggested_entity_ids ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    locations = ids.map((id) => ({
      id,
      name: `Entity ${id}`,
      displayName: `Skyscanner entity ${id}`,
      city: '',
      country: '',
      code: id,
      type: 'location',
      iconUrl: null,
      partnerMetadata: {
        entityId: id,
        product,
        source: `${product}-autosuggest`,
      },
    }));
  }

  return prioritizeIataResults(locations.slice(0, 15), searchTerm);
}
