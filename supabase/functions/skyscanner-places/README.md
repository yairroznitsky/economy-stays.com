# skyscanner-places

Proxies Skyscanner destination autosuggest for hotels, flights, and car hire.

## Request

```
GET /functions/v1/skyscanner-places?q={searchTerm}&market=US&locale=en-US&product=hotels
Authorization: Bearer {SUPABASE_ANON_KEY}
```

| Param | Required | Default |
|-------|----------|---------|
| `q` | Yes | — |
| `product` | No | `flights` |
| `market` | No | `US` |
| `locale` | No | `en-US` |
| `debug` | No | `0` |

## Upstream

The function prefers the official Skyscanner Partners Autosuggest API when configured. Otherwise it calls Skyscanner's website autosuggest endpoint.

**Important:** Skyscanner blocks website autosuggest from Supabase/datacenter IPs (403 + captcha). For production, set `SKYSCANNER_API_KEY`.

## Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `SKYSCANNER_API_KEY` | **Recommended** | Skyscanner Travel API key (`x-api-key` header) |
| `SKYSCANNER_COOKIE_OVERRIDE` | No | Dev-only cookie string for website autosuggest |

```bash
supabase secrets set SKYSCANNER_API_KEY=your-key-here --project-ref vbtmydsmqlkzfmbcmfxb
supabase functions deploy skyscanner-places --project-ref vbtmydsmqlkzfmbcmfxb
```

## Debug

```
GET .../skyscanner-places?q=london&product=hotels&debug=1
```

Returns upstream status, content type, and a raw body preview.
