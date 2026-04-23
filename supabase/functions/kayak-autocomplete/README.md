# kayak-autocomplete

Kayak-first destination autocomplete proxy for frontend search UI.

## Request

`POST /functions/v1/kayak-autocomplete`

```json
{
  "query": "nyc",
  "locale": "en",
  "country": "US"
}
```

## Response

Returns only normalized `city` and `hotel` suggestions for UI consumption.

## Environment variables

- `KAYAK_AUTOCOMPLETE_BASE_URL` (optional, defaults to Kayak smarty endpoint)
- `KAYAK_AUTOCOMPLETE_SIZE` (optional, defaults to 50 upstream results before filtering)

## Notes

- Input under 3 characters returns an empty suggestions array.
- The normalization layer is defensive because Kayak response fields can vary.
