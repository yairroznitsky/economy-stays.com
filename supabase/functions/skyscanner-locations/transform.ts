import { isIATACode, METRO_IATA_TO_CITY } from './utils.ts';

function mapSkyscannerType(type: string | undefined): string {
  const normalized = (type ?? '').toLowerCase();
  switch (normalized) {
    case 'place_type_airport':
    case 'airport':
      return 'airport';
    case 'place_type_city':
    case 'city':
      return 'city';
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

function transformResultItem(item: Record<string, unknown>) {
  const entityId = String(
    item.entityId ?? item.entity_id ?? item.id ?? item.location_id ?? '',
  );
  const entityName = String(
    item.entity_name ?? item.name ?? item.location_name ?? `Entity ${entityId}`,
  );
  const hierarchy = String(item.hierarchy ?? item.displayName ?? '');
  const parts = hierarchy.split('|').filter(Boolean);
  const iataCode = extractIataCode(entityName);
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
      source: 'website-autosuggest',
    },
  };
}

type TransformedLocation = ReturnType<typeof transformResultItem>;

function prioritizeIataResults(locations: TransformedLocation[], searchTerm: string): TransformedLocation[] {
  if (!isIATACode(searchTerm) || locations.length === 0) {
    return locations;
  }

  const upper = searchTerm.trim().toUpperCase();

  const exactMatches = locations.filter(
    (loc) =>
      loc.code === upper ||
      String(loc.partnerMetadata?.entityName ?? '').toUpperCase().includes(`(${upper})`),
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

export function transformSkyscannerData(data: unknown, searchTerm?: string) {
  let locations: TransformedLocation[] = [];

  if (Array.isArray(data)) {
    locations = data.map((item) => transformResultItem(item as Record<string, unknown>));
  } else if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>;

    if (Array.isArray(payload.results)) {
      locations = payload.results.map((item) => transformResultItem(item as Record<string, unknown>));
    } else if (Array.isArray(payload.places)) {
      locations = payload.places.map((item) => transformResultItem(item as Record<string, unknown>));
    } else {
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
          source: 'website-autosuggest',
        },
      }));
    }
  }

  const trimmed = searchTerm ? prioritizeIataResults(locations.slice(0, 15), searchTerm) : locations.slice(0, 15);
  return trimmed;
}
