import { supabase } from "@/lib/supabaseClient";

const LANDING_COOKIE = "landing_id";
const COOKIE_MAX_AGE_SEC = 5 * 60;
const LANDING_ID_PREFIX = "SB-";
const LANDING_ID_LENGTH = 10;
const ID_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

type DeviceType = "mobile" | "tablet" | "desktop";

interface IpInfo {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
}

export interface PartnerLandingData {
  partner: string;
  deeplink: string;
  parameters?: Record<string, unknown>;
  method: "new_tab" | "redirect";
}

const randomChars = (length: number): string => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ID_CHARS[b % ID_CHARS.length]).join("");
};

export const generateClickId = (): string => randomChars(10);

const getDeviceType = (): DeviceType => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
};

const readCookie = (name: string): string | null => {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
};

const writeCookie = (value: string) => {
  document.cookie = `${LANDING_COOKIE}=${encodeURIComponent(value)}; max-age=${COOKIE_MAX_AGE_SEC}; path=/; SameSite=Lax`;
};

const clearLandingCookie = () => {
  document.cookie = `${LANDING_COOKIE}=; max-age=0; path=/; SameSite=Lax`;
};

const fetchIpInfo = async (): Promise<IpInfo> => {
  try {
    const response = await fetch("https://ipinfo.io/json");
    if (!response.ok) return {};
    return (await response.json()) as IpInfo;
  } catch {
    return {};
  }
};

const buildLocationFromIp = (ipInfo: IpInfo) => {
  const [lat, lng] = ipInfo.loc?.split(",") ?? [];
  return {
    city: ipInfo.city,
    region: ipInfo.region,
    country: ipInfo.country,
    lat: lat || undefined,
    lng: lng || undefined,
  };
};

export class LandingTrackingService {
  static generateLandingId(): string {
    return `${LANDING_ID_PREFIX}${randomChars(LANDING_ID_LENGTH)}`;
  }

  static getCurrentLandingId(): string | null {
    return readCookie(LANDING_COOKIE);
  }

  static setExistingLandingId(id: string): void {
    writeCookie(id);
  }

  private static getLandingIdFromUrl(): string | null {
    return new URLSearchParams(window.location.search).get("landing_id");
  }

  static async getOrCreateLandingId(): Promise<string> {
    const fromCookie = this.getCurrentLandingId();
    if (fromCookie) return fromCookie;

    const fromUrl = this.getLandingIdFromUrl();
    if (fromUrl) {
      this.setExistingLandingId(fromUrl);
      return fromUrl;
    }

    const landingId = this.generateLandingId();
    this.setExistingLandingId(landingId);
    try {
      await this.logLanding(landingId);
      return landingId;
    } catch (error) {
      clearLandingCookie();
      throw error;
    }
  }

  static async logLanding(
    landingId: string,
    partnerData?: PartnerLandingData
  ): Promise<void> {
    const ipInfo = await fetchIpInfo();

    const metadata: Record<string, unknown> = {
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      ip: ipInfo.ip ?? "",
      source_app: "cheap-stays",
    };

    if (partnerData) {
      metadata.location = buildLocationFromIp(ipInfo);
      metadata.device = getDeviceType();
      metadata.partner = partnerData.partner;
      metadata.deeplink = partnerData.deeplink;
      metadata.parameters = partnerData.parameters;
      metadata.method = partnerData.method;
    }

    const { error } = await supabase.from("landings").insert({
      landing_id: landingId,
      metadata,
      url_params: window.location.search || "",
    });

    if (error) throw error;
  }

  static async logPartnerLanding(
    partner: string,
    deeplink: string,
    parameters: Record<string, unknown> | undefined,
    method: "new_tab" | "redirect"
  ): Promise<string> {
    const landingId = await this.getOrCreateLandingId();
    await this.logLanding(landingId, {
      partner,
      deeplink,
      parameters,
      method,
    });
    return landingId;
  }

  static updateLandingLocation(
    city: string,
    region: string,
    country: string
  ): void {
    const landingId = this.getCurrentLandingId();
    if (!landingId) return;

    void (async () => {
      try {
        const { data, error } = await supabase
          .from("landings")
          .select("metadata")
          .eq("landing_id", landingId)
          .maybeSingle();

        if (error || !data?.metadata) return;

        const metadata = {
          ...(data.metadata as Record<string, unknown>),
          location: {
            ...(((data.metadata as Record<string, unknown>).location as
              | Record<string, unknown>
              | undefined) ?? {}),
            city,
            region,
            country,
          },
        };

        await supabase
          .from("landings")
          .update({ metadata })
          .eq("landing_id", landingId);
      } catch {
        // fire-and-forget
      }
    })();
  }
}

export const appendLandingIdQuery = (href: string): string => {
  const landingId = LandingTrackingService.getCurrentLandingId();
  if (!landingId) return href;

  const url = new URL(href, window.location.origin);
  url.searchParams.set("landing_id", landingId);
  return `${url.pathname}${url.search}`;
};
