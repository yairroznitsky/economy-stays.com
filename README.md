# Cheap Stays

Same stays. Just cheaper.

Kayak-first hotel monetization flow with Supabase Edge Function routing.

Cheap Stays is operated by Media Smarter.

## Local setup

1. Install dependencies:
   - `npm install`
2. Create env file:
   - copy `.env.example` to `.env`
   - set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - set server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for landings / rental_clicks writes
3. Run app:
   - `npm run dev`

## Shared Supabase tracking

Browser never inserts into `landings` / `rental_clicks` directly. The app server does:

| Route | Table | When |
|-------|--------|------|
| `POST /api/landings` | `public.landings` | New session (no cookie / no `?landing_id=`) |
| `POST /api/search` | `public.rental_clicks` | Partner click-out (≤500ms race, then redirect) |

Uses `SUPABASE_SERVICE_ROLE_KEY`. Continuity is the `landing_id` query param + `landing_id` cookie (max-age 300, SameSite=Lax). Cheap-stays IDs are `CS-` + 12 hex (`metadata.source_app` = `cheap-stays`).

Same-origin paths work on `cheap-stays.com`. For `api.cheap-stays.com/landings` and `/search`, set `VITE_TRACKING_API_BASE=https://api.cheap-stays.com` (Vercel rewrites bare paths to `/api/*`).

## Affiliate architecture

- Frontend search and destination clicks call Supabase Edge Function `hotel-affiliate-router`.
- Edge Function normalizes inputs, provides autocomplete, builds Kayak deeplinks, and can persist click events.
- Affiliate secrets stay on the server in Supabase function environment variables.

## Supabase function secrets

Set these on `hotel-affiliate-router`:

- `KAYAK_DEEPLINK_BASE_URL`
- `KAYAK_AFFILIATE_SOURCE`
- `KAYAK_LANDING_ID_DEFAULT`
- `SITE_SLUG` or `SKYSCANNER_UTM_SOURCE` for outbound attribution labels
- Optional fallback: `BOOKING_FALLBACK_BASE_URL`
- Optional click logging: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

Set these on `kayak-autocomplete`:

- `BOT_NAME` (default `AffiliateBot`)
- `SITE_DOMAIN` (e.g. `cheap-stays.com`)

## Multi-domain deployments

Site branding, tracking labels, and analytics are driven by Vite env vars (see [`.env.example`](.env.example)).

For an alternate domain on the **same Supabase project** without exposing it in the browser:

1. Copy [`.env.secret-booking.example`](.env.secret-booking.example) to `.env.secret-booking`.
2. Set `VITE_USE_API_PROXY=true` and **do not** set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
3. Add server-only `SUPABASE_URL` and `SUPABASE_ANON_KEY` in your Vercel project (not `VITE_` prefixed).
4. Build with `vite build --mode secret-booking` and deploy to a separate Vercel project.
5. Edge Function calls go through `/api/edge/*` on your domain — the Supabase project ID never appears in the JS bundle.
6. Client-side DB tracking (`landings`, `rental_clicks`) is automatically disabled in proxy mode (no-op stubs). Cheap-stays uses server `POST /api/landings` and `POST /api/search` instead of browser→Supabase inserts.

For lowest exposure also use separate pixels (or leave blank), unique favicon/logo assets, and matching Edge Function secrets (`SITE_SLUG`, `BOT_NAME`, `SITE_DOMAIN`).

## Remaining integration placeholders

- Insert the exact Kayak deeplink template in `supabase/functions/hotel-affiliate-router/index.ts`.
- Replace local autocomplete list with Kayak/provider destination API when available.
