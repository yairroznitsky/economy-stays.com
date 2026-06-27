
import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from './constants.ts';
import { getCacheKey, isIATACode, resolveSearchTermForIata } from './utils.ts';
import { getCachedResponse, setCachedResponse } from './cache.ts';
import { establishSkyscannerSession } from './session.ts';
import { fetchPartnersAutosuggest, fetchSkyscannerAutosuggest } from './api.ts';
import { transformSkyscannerData } from './transform.ts';
import { parseProduct } from './products.ts';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const searchTerm = url.searchParams.get('q');
    const market = url.searchParams.get('market') ?? 'US';
    const locale = url.searchParams.get('locale') ?? 'en-US';
    const debug = url.searchParams.get('debug') === '1';
    const product = parseProduct(url.searchParams.get('product'));

    if (!searchTerm) {
      return jsonResponse({ error: 'Search term is required' }, 400);
    }

    if (searchTerm.length < 2) {
      return jsonResponse([]);
    }

    console.log(
      `Skyscanner Places: Processing ${product} search for "${searchTerm}" (${market}/${locale})`,
    );

    const cacheKey = getCacheKey(searchTerm, market, locale, product);

    if (!debug) {
      const cachedData = getCachedResponse(cacheKey);
      if (cachedData) {
        console.log('Skyscanner Places: Returning cached result for', searchTerm, product);
        return jsonResponse(cachedData);
      }
    }

    const apiSearchTerm = product === 'flights' && isIATACode(searchTerm)
      ? searchTerm
      : resolveSearchTermForIata(searchTerm);

    if (apiSearchTerm !== searchTerm) {
      console.log(`Skyscanner Places: Expanded IATA "${searchTerm}" → "${apiSearchTerm}"`);
    }

    const apiKey = Deno.env.get('SKYSCANNER_API_KEY')?.trim() ?? '';
    const usePartnersApi = apiKey.length > 0;

    let result;
    let cookiesSent = 'n/a';
    if (usePartnersApi) {
      result = await fetchPartnersAutosuggest(apiSearchTerm, market, locale, product, apiKey);
    } else {
      const { cookies, userAgent } = await establishSkyscannerSession(product);
      cookiesSent = cookies ? 'yes' : 'no';
      result = await fetchSkyscannerAutosuggest(
        apiSearchTerm,
        market,
        locale,
        product,
        cookies,
        userAgent,
      );
    }

    if (debug) {
      return jsonResponse({
        product,
        upstream: usePartnersApi ? 'partners-api' : 'website-autosuggest',
        skyscannerStatus: result.status,
        contentType: result.contentType,
        cookiesSent,
        cookieOverride: Boolean(Deno.env.get('SKYSCANNER_COOKIE_OVERRIDE')),
        rawBodyPreview: result.body.slice(0, 2000),
        parsed: result.parsed,
      });
    }

    if (!result.isJson || result.status !== 200) {
      const blockedByBotProtection =
        result.status === 403 &&
        (result.body.includes('"reason":"blocked"') || result.body.includes('captcha'));

      if (blockedByBotProtection && !usePartnersApi) {
        console.warn(
          `Skyscanner Places: ${product} website autosuggest blocked from edge runtime; configure SKYSCANNER_API_KEY`,
        );
        return jsonResponse([]);
      }

      return jsonResponse(
        {
          error: usePartnersApi
            ? 'Skyscanner partners autosuggest request failed'
            : 'Skyscanner blocked or returned non-JSON response',
          product,
          status: result.status,
          preview: result.body.slice(0, 500),
        },
        usePartnersApi ? result.status || 502 : 502,
      );
    }

    const finalData = transformSkyscannerData(result.parsed, searchTerm, product);
    setCachedResponse(cacheKey, finalData);

    console.log(
      `Skyscanner Places: Returning ${finalData.length} ${product} locations for "${searchTerm}"`,
    );
    return jsonResponse(finalData);
  } catch (error) {
    console.error('Skyscanner Places: Error in skyscanner-places function:', error);
    return jsonResponse(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
