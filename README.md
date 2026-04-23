# Secret Stays

Kayak-first hotel monetization flow with Supabase Edge Function routing.

## Local setup

1. Install dependencies:
   - `npm install`
2. Create env file:
   - copy `.env.example` to `.env`
   - set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Run app:
   - `npm run dev`

## Affiliate architecture

- Frontend search and destination clicks call Supabase Edge Function `hotel-affiliate-router`.
- Edge Function normalizes inputs, provides autocomplete, builds Kayak deeplinks, and can persist click events.
- Affiliate secrets stay on the server in Supabase function environment variables.

## Supabase function secrets

Set these on `hotel-affiliate-router`:

- `KAYAK_DEEPLINK_BASE_URL`
- `KAYAK_AFFILIATE_SOURCE`
- `KAYAK_LANDING_ID_DEFAULT`
- Optional fallback: `BOOKING_FALLBACK_BASE_URL`
- Optional click logging: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

## Remaining integration placeholders

- Insert the exact Kayak deeplink template in `supabase/functions/hotel-affiliate-router/index.ts`.
- Replace local autocomplete list with Kayak/provider destination API when available.
