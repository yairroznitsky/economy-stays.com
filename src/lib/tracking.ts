const CLICK_ID_STORAGE_KEY = "hotel_affiliate_click_id";
const LANDING_ID_STORAGE_KEY = "hotel_affiliate_landing_id";

const randomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const getOrCreateClickId = () => {
  const existing = localStorage.getItem(CLICK_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const clickId = randomId();
  localStorage.setItem(CLICK_ID_STORAGE_KEY, clickId);
  return clickId;
};

export const getOrCreateLandingId = () => {
  const existing = localStorage.getItem(LANDING_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const landingId = randomId();
  localStorage.setItem(LANDING_ID_STORAGE_KEY, landingId);
  return landingId;
};
