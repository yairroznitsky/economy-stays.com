
import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from './constants.ts';
import { getCacheKey, resolveSearchTermForIata } from './utils.ts';
import { getCachedResponse, setCachedResponse } from './cache.ts';
import { establishSkyscannerSession } from './session.ts';
import { fetchSkyscannerAutosuggest } from './api.ts';
import { transformSkyscannerData } from './transform.ts';

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

    if (!searchTerm) {
      return jsonResponse({ error: 'Search term is required' }, 400);
    }

    if (searchTerm.length < 2) {
      return jsonResponse([]);
    }

    console.log(`Skyscanner Function: Processing search for "${searchTerm}" (${market}/${locale})`);

    const cacheKey = getCacheKey(searchTerm, market, locale);

    if (!debug) {
      const cachedData = getCachedResponse(cacheKey);
      if (cachedData) {
        console.log('Skyscanner Function: Returning cached result for', searchTerm);
        return jsonResponse(cachedData);
      }
    }

    const apiSearchTerm = resolveSearchTermForIata(searchTerm);
    if (apiSearchTerm !== searchTerm) {
      console.log(`Skyscanner Function: Expanded IATA "${searchTerm}" → "${apiSearchTerm}"`);
    }

    const { cookies, userAgent } = await establishSkyscannerSession();
    const result = await fetchSkyscannerAutosuggest(apiSearchTerm, market, locale, cookies, userAgent);

    if (debug) {
      return jsonResponse({
        skyscannerStatus: result.status,
        contentType: result.contentType,
        cookiesSent: cookies ? 'yes' : 'no',
        cookieOverride: Boolean(Deno.env.get('SKYSCANNER_COOKIE_OVERRIDE')),
        rawBodyPreview: result.body.slice(0, 2000),
        parsed: result.parsed,
      });
    }

    if (!result.isJson || result.status !== 200) {
      return jsonResponse(
        {
          error: 'Skyscanner blocked or returned non-JSON response',
          status: result.status,
          preview: result.body.slice(0, 500),
        },
        502,
      );
    }

    const finalData = transformSkyscannerData(result.parsed, searchTerm);
    setCachedResponse(cacheKey, finalData);

    console.log(`Skyscanner Function: Returning ${finalData.length} locations for "${searchTerm}"`);
    return jsonResponse(finalData);
  } catch (error) {
    console.error('Skyscanner Function: Error in skyscanner-locations function:', error);
    return jsonResponse(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
