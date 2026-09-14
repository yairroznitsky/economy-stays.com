# Economy Stays

Same stays. Just cheaper.

Kayak-first hotel monetization flow with Supabase Edge Function routing.

Economy Stays is operated by Media Smarter.

## Local setup

1. Install dependencies:
   - `npm install`
2. Create env file:
   - copy `.env.example` to `.env`
   - set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - set server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for landings / rental_clicks writes
   - or run `npm run setup:env` to copy Supabase credentials from the sibling `../Cheap-Stays/.env`
3. Run app:
   - `npm run dev`
   - open the URL Vite prints (default `http://localhost:8080/`). If port 8080 is already in use, Vite picks another port — use that one, not an older dev server still running on 8080.
   - after changing `.env`, restart `npm run dev` so Vite reloads env vars

## Shared Supabase tracking

Browser never inserts into `landings` / `rental_clicks` directly. The app server does:

| Route | Table | When |
|-------|--------|------|
| `POST /api/landings` | `public.landings` | New session (no cookie / no `?landing_id=`) |
| `POST /api/search` | `public.rental_clicks` | Partner click-out (≤500ms race, then redirect) |

Uses `SUPABASE_SERVICE_ROLE_KEY`. Continuity is the `landing_id` query param + `landing_id` cookie (max-age 300, SameSite=Lax). Economy-stays IDs are `ES-` + 12 hex (`metadata.source_app` = `economy-stays`).

Same-origin paths work on `economy-stays.com`. For `api.economy-stays.com/landings` and `/search`, set `VITE_TRACKING_API_BASE=https://api.economy-stays.com` (Vercel rewrites bare paths to `/api/*`).

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
- `SITE_DOMAIN` (e.g. `economy-stays.com`)

## Multi-domain deployments

Site branding, tracking labels, and analytics are driven by Vite env vars (see [`.env.example`](.env.example)).

### Economy Stays (production edge proxy)

Production builds default to the same `/api/edge/*` proxy path used in local dev (`VITE_USE_EDGE_PROXY`, on unless set to `false`). The browser does not need `VITE_SUPABASE_*` for autocomplete.

On Vercel, set **runtime** env (Production):

- `SUPABASE_URL` (or `VITE_SUPABASE_URL`)
- `SUPABASE_ANON_KEY` (or `VITE_SUPABASE_ANON_KEY`)

Then redeploy. `api/edge/[name].ts` forwards `kayak-autocomplete` (and allowed functions) to Supabase.

### Alternate brands (full API proxy)

For an alternate domain on the **same Supabase project** without exposing it in the browser:

1. Copy [`.env.secret-booking.example`](.env.secret-booking.example) to `.env.secret-booking`.
2. Set `VITE_USE_API_PROXY=true` and **do not** set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
3. Add server-only `SUPABASE_URL` and `SUPABASE_ANON_KEY` in your Vercel project (not `VITE_` prefixed).
4. Build with `vite build --mode secret-booking` and deploy to a separate Vercel project.
5. Edge Function calls go through `/api/edge/*` on your domain — the Supabase project ID never appears in the JS bundle.
6. Client-side DB tracking (`landings`, `rental_clicks`) is automatically disabled in proxy mode (no-op stubs). Economy-stays uses server `POST /api/landings` and `POST /api/search` instead of browser→Supabase inserts.

For lowest exposure also use separate pixels (or leave blank), unique favicon/logo assets, and matching Edge Function secrets (`SITE_SLUG`, `BOT_NAME`, `SITE_DOMAIN`).

## Remaining integration placeholders

- Insert the exact Kayak deeplink template in `supabase/functions/hotel-affiliate-router/index.ts`.
- Replace local autocomplete list with Kayak/provider destination API when available.
