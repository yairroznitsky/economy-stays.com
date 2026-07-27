import { createContext, useContext, useEffect, type ReactNode } from "react";
import { en } from "./en";
import { es } from "./es";
import { ptBR } from "./pt-BR";
import type { LandingLocale, LandingTranslations } from "./types";

export type { LandingLocale, LandingTranslations };

const translations: Record<LandingLocale, LandingTranslations> = {
  en,
  es,
  "pt-BR": ptBR,
};

export const getLandingTranslations = (locale: LandingLocale): LandingTranslations =>
  translations[locale];

const VALIDATION_MESSAGE_MAP: Record<
  LandingLocale,
  Record<string, string>
> = {
  en: {},
  es: {
    "Check-out must be after check-in":
      translations.es.search.validation.checkoutAfterCheckin,
    "Number of adults must be greater than or equal to number of rooms":
      translations.es.search.validation.adultsGteRooms,
    "Adults and rooms must be at least 1":
      translations.es.search.validation.adultsRoomsMin,
  },
  "pt-BR": {
    "Check-out must be after check-in":
      translations["pt-BR"].search.validation.checkoutAfterCheckin,
    "Number of adults must be greater than or equal to number of rooms":
      translations["pt-BR"].search.validation.adultsGteRooms,
    "Adults and rooms must be at least 1":
      translations["pt-BR"].search.validation.adultsRoomsMin,
  },
};

export const translateValidationMessage = (
  locale: LandingLocale,
  message: string
): string => VALIDATION_MESSAGE_MAP[locale][message] ?? message;

type LandingLocaleContextValue = {
  locale: LandingLocale;
  t: LandingTranslations;
};

const LandingLocaleContext = createContext<LandingLocaleContextValue>({
  locale: "en",
  t: en,
});

export const LandingLocaleProvider = ({
  locale,
  children,
}: {
  locale: LandingLocale;
  children: ReactNode;
}) => {
  const t = getLandingTranslations(locale);

  useEffect(() => {
    document.documentElement.lang = locale === "pt-BR" ? "pt-BR" : locale;
  }, [locale]);

  return (
    <LandingLocaleContext.Provider value={{ locale, t }}>
      {children}
    </LandingLocaleContext.Provider>
  );
};

export const useLandingI18n = () => useContext(LandingLocaleContext);

export const localizeCountryName = (
  t: LandingTranslations,
  country: string
): string => t.countries[country] ?? country;
