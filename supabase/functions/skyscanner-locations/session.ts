
import { userAgents } from './constants.ts';
import { getRandomUserAgent, getRandomDelay, parseSetCookieHeaders, sleep } from './utils.ts';
import { sessionCache } from './cache.ts';

const SESSION_KEY = 'skyscanner_session';

export async function establishSkyscannerSession(): Promise<{ cookies: string; userAgent: string }> {
  const cookieOverride = Deno.env.get('SKYSCANNER_COOKIE_OVERRIDE');
  const userAgent = getRandomUserAgent(userAgents);

  if (cookieOverride) {
    console.log('Skyscanner Function: Using SKYSCANNER_COOKIE_OVERRIDE');
    return { cookies: cookieOverride, userAgent };
  }

  const cached = sessionCache.get(SESSION_KEY);
  if (cached && Date.now() - cached.timestamp < 300000) {
    return { cookies: cached.cookies, userAgent: cached.userAgent };
  }

  try {
    console.log('Skyscanner Function: Establishing new session via /carhire');

    const response = await fetch('https://www.skyscanner.net/carhire', {
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
    console.log('Skyscanner Function: Session established, status:', response.status);

    sessionCache.set(SESSION_KEY, {
      cookies,
      userAgent,
      timestamp: Date.now(),
    });

    await sleep(getRandomDelay(100, 300));
    return { cookies, userAgent };
  } catch (error) {
    console.error('Skyscanner Function: Failed to establish session:', error);
    return { cookies: '', userAgent };
  }
}
