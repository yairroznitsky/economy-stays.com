type HeaderBag = Record<string, string | string[] | undefined>;

export interface RequestLike {
  headers: HeaderBag;
  socket?: { remoteAddress?: string | null };
}

const headerValue = (headers: HeaderBag, name: string): string => {
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0]?.trim() ?? "";
  return typeof raw === "string" ? raw.trim() : "";
};

export const getClientIp = (req: RequestLike): string => {
  const forwarded = headerValue(req.headers, "x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "";
  }

  const realIp = headerValue(req.headers, "x-real-ip");
  if (realIp) return realIp;

  const vercelIp = headerValue(req.headers, "x-vercel-forwarded-for");
  if (vercelIp) {
    return vercelIp.split(",")[0]?.trim() ?? "";
  }

  return req.socket?.remoteAddress?.trim() ?? "";
};

export const getUserAgent = (req: RequestLike): string =>
  headerValue(req.headers, "user-agent");

export const getReferrer = (req: RequestLike): string =>
  headerValue(req.headers, "referer") || headerValue(req.headers, "referrer");
