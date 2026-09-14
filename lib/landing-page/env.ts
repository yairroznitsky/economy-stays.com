export const readEnv = (key: string): string | undefined => {
  const value = process.env[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

export const readSiteName = (): string =>
  readEnv("VITE_SITE_NAME")?.trim() || "Economy Stays";
