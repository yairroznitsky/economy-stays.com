-- Partial composite btree index on staging_hotels coordinates.
-- Enables efficient bounding-box queries for the /api/nearby endpoint
-- (latitude=gte.X&latitude=lte.Y&longitude=gte.A&longitude=lte.B via PostgREST GET).
-- A 50 km radius spans ~0.9° of latitude so the leading column is highly selective.
-- Deliberately not PostGIS to avoid extension/backfill requirements.

create index if not exists staging_hotels_lat_lng_idx
  on public.staging_hotels (latitude, longitude)
  where latitude is not null and longitude is not null;
