
import { userAgents } from './constants.ts';
import { getRandomUserAgent, getRandomDelay, parseSetCookieHeaders, sleep } from './utils.ts';
import { sessionCache } from './cache.ts';
import { PRODUCT_CONFIG, type SkyscannerProduct } from './products.ts';

export async function establishSkyscannerSession(
  product: SkyscannerProduct,
): Promise<{ cookies: string; userAgent: string }> {
  const cookieOverride = Deno.env.get('SKYSCANNER_COOKIE_OVERRIDE');
  const userAgent = getRandomUserAgent(userAgents);
  const sessionKey = `skyscanner_session_${product}`;

  if (cookieOverride) {
    console.log(`Skyscanner Places: Using SKYSCANNER_COOKIE_OVERRIDE for ${product}`);
    return { cookies: cookieOverride, userAgent };
  }

  const cached = sessionCache.get(sessionKey);
  if (cached && Date.now() - cached.timestamp < 300000) {
    return { cookies: cached.cookies, userAgent: cached.userAgent };
  }

  const { sessionUrl } = PRODUCT_CONFIG[product];

  try {
    console.log(`Skyscanner Places: Establishing session for ${product} via ${sessionUrl}`);

    const response = await fetch(sessionUrl, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
      redirect: 'follow',
    });

    const cookies = parseSetCookieHeaders(response.headers);
    console.log(`Skyscanner Places: Session established for ${product}, status:`, response.status);

    sessionCache.set(sessionKey, {
      cookies,
      userAgent,
      timestamp: Date.now(),
    });

    await sleep(getRandomDelay(100, 300));
    return { cookies, userAgent };
  } catch (error) {
    console.error(`Skyscanner Places: Failed to establish session for ${product}:`, error);
    return { cookies: '', userAgent };
  }
}
