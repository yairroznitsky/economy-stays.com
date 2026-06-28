import { siteConfig } from "@/lib/siteConfig";

const LANDING_COOKIE = "landing_id";
const COOKIE_MAX_AGE_SEC = 5 * 60;
const LANDING_ID_PREFIX = siteConfig.landingIdPrefix;
const LANDING_ID_LENGTH = 10;
const ID_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

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

const readCookie = (name: string): string | null => {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
};

const writeCookie = (value: string) => {
  document.cookie = `${LANDING_COOKIE}=${encodeURIComponent(value)}; max-age=${COOKIE_MAX_AGE_SEC}; path=/; SameSite=Lax`;
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
    return landingId;
  }

  static async logLanding(
    _landingId: string,
    _partnerData?: PartnerLandingData
  ): Promise<void> {}

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
    _city: string,
    _region: string,
    _country: string
  ): void {}
}

export const appendLandingIdQuery = (href: string): string => {
  const landingId = LandingTrackingService.getCurrentLandingId();
  if (!landingId) return href;

  const url = new URL(href, window.location.origin);
  url.searchParams.set("landing_id", landingId);
  return `${url.pathname}${url.search}`;
};
