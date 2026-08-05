-- Auxiliary slug column for fast hotel lookups by URL city segment.
-- Backfill after import: npm run backfill:hotel-city-slugs

alter table public.staging_hotels
  add column if not exists city_slug text;

create unique index if not exists staging_hotels_external_id_uidx
  on public.staging_hotels (external_id);

create index if not exists staging_hotels_city_slug_idx
  on public.staging_hotels (city_slug);

create index if not exists staging_hotels_city_slug_reviews_idx
  on public.staging_hotels (city_slug, reviews desc nulls last);
