
export const sessionCache = new Map<string, { cookies: string; userAgent: string; timestamp: number }>();
export const responseCache = new Map<string, { data: unknown; timestamp: number }>();

export function getCachedResponse(cacheKey: string) {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 180000) {
    return cached.data;
  }
  return null;
}

export function setCachedResponse(cacheKey: string, data: unknown) {
  responseCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}
