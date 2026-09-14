import { siteConfig } from "@/lib/siteConfig";
import { postTrackingJson } from "@/lib/trackingApi";

const LANDING_COOKIE = "landing_id";
const COOKIE_MAX_AGE_SEC = 5 * 60;
const LANDING_ID_PREFIX = siteConfig.landingIdPrefix;
const ID_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

type DeviceType = "mobile" | "tablet" | "desktop";

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

const randomHex = (byteLength: number): string => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
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

export class LandingTrackingService {
  private static loggedLandingIds = new Set<string>();

  /** Economy-stays: ES- + 12 hex. Other brands (e.g. SB-): prefix + 10 alphanumeric. */
  static generateLandingId(): string {
    if (LANDING_ID_PREFIX === "ES-" || LANDING_ID_PREFIX === "CS-") {
      return `${LANDING_ID_PREFIX}${randomHex(6)}`;
    }
    return `${LANDING_ID_PREFIX}${randomChars(10)}`;
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
    // DB insert is best-effort — never block search / autocomplete / redirects.
    void this.logLanding(landingId);
    return landingId;
  }

  static async logLanding(
    landingId: string,
    partnerData?: PartnerLandingData
  ): Promise<void> {
    if (!landingId || this.loggedLandingIds.has(landingId)) return;
    this.loggedLandingIds.add(landingId);

    const metadata: Record<string, unknown> = {
      referrer: document.referrer,
    };

    if (partnerData) {
      metadata.device = getDeviceType();
      metadata.partner = partnerData.partner;
      metadata.deeplink = partnerData.deeplink;
      metadata.parameters = partnerData.parameters;
      metadata.method = partnerData.method;
    }

    try {
      await postTrackingJson("/landings", {
        landing_id: landingId,
        url_params: window.location.search || "",
        metadata,
      });
    } catch (error) {
      this.loggedLandingIds.delete(landingId);
      console.warn("[tracking] landings insert failed", error);
    }
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
    _city: string,
    _region: string,
    _country: string
  ): void {
    // Location enrichment is server-side via landings metadata on insert only.
  }
}

export const appendLandingIdQuery = (href: string): string => {
  const landingId = LandingTrackingService.getCurrentLandingId();
  if (!landingId) return href;

  const url = new URL(href, window.location.origin);
  url.searchParams.set("landing_id", landingId);
  return `${url.pathname}${url.search}`;
};
