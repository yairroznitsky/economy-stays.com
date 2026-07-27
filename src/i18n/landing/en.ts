import type { LandingTranslations } from "./types";

export const en: LandingTranslations = {
  heroEyebrow: "Independent stay search",
  heroTitle: "A calmer way to compare stays",
  heroSubtitle:
    "Search hotels, apartments, and rentals in one place — then book through partners you trust.",
  heroImageAlt:
    "Clifftop resort with infinity pool overlooking the ocean at sunset",
  featuresTitle: (siteName) => `Why travelers use ${siteName}`,
  featuresSubtitle:
    "One search surfaces rates from trusted partners so you can choose with confidence.",
  features: [
    {
      title: "Clear price comparison",
      desc: "See hotels, apartments, and rentals side by side so you can pick the best option for your dates.",
    },
    {
      title: "Worldwide coverage",
      desc: "Weekend escapes, beach breaks, or longer stays — options across cities and coastlines worldwide.",
    },
    {
      title: "Established partners",
      desc: "Flexible policies on many listings, backed by travel partners you already know.",
    },
  ],
  destinationsTitle: "Popular destinations",
  destinationsSubtitle: "Explore cities travelers are searching this week.",
  compareRates: "Compare rates",
  checkingRates: "Checking rates…",
  ctaTitle: "Ready to plan your trip?",
  ctaSubtitle:
    "Use the search above to compare stays and continue to your preferred booking partner.",
  destinationNotFound: (city) =>
    `We couldn't find ${city}. Try searching manually above.`,
  reviewSearch: "Review your search",
  ratesUnavailable: "Rates unavailable right now",
  ratesUnavailableDesc: "Please try again using the search bar above.",
  destinationPickTitle: "Select from the suggestions",
  destinationPickDesc:
    "Type a destination name, then choose a match from the dropdown.",
  footer: {
    about: "About",
    contact: "Contact",
    privacy: "Privacy",
    rightsReserved: "All rights reserved.",
    operatedBy: (siteName, operator) =>
      `${siteName} is operated by ${operator}.`,
    commission: (siteName) =>
      `${siteName} may receive a commission when you book through partner links.`,
  },
  search: {
    where: "Where",
    wherePlaceholder: "Where are you headed?",
    whereError: "Choose where you're staying",
    loadingSuggestions: "Loading suggestions...",
    when: "When",
    pickDates: "Pick dates",
    checkIn: "Check-in",
    checkOut: "Check-out",
    selectCheckIn: "Select check-in",
    selectCheckOut: "Select check-out",
    selectDate: "Select date",
    pickYourDates: "Pick your dates",
    chooseArrival: "Choose your arrival date",
    chooseDeparture: "Now choose your departure date",
    pickCheckInFirst: "Pick check-in first, then check-out",
    nowChooseCheckOut: "Now choose your check-out",
    who: "Who",
    guestSummary: (guests, rooms) =>
      `${guests} guest${guests !== 1 ? "s" : ""} · ${rooms} room${rooms !== 1 ? "s" : ""}`,
    adults: "Adults",
    adultsSub: "Age 13+",
    children: "Children",
    childrenSub: "Age 0–12",
    rooms: "Rooms",
    comparePrices: "Compare prices",
    comparingRates: "Comparing rates...",
    datesRequired: "Dates required",
    datesRequiredDesc:
      "Select both check-in and check-out to compare available stays.",
    destinationTooShort: "Destination too short",
    destinationTooShortDesc:
      "Type at least 3 letters — city, hotel, or airport code (e.g. VAR).",
    airportNotFound: "Airport not found",
    airportNotFoundDesc: (code) =>
      `No airport matched "${code}". Check the code and try again.`,
    couldNotCompare: "Couldn't compare rates",
    couldNotCompareDesc:
      "Please try again or select a destination from the suggestions.",
    suggestionType: {
      state: "State",
      airport: "Airport",
      landmark: "Landmark",
      city: "City",
    },
    validation: {
      checkoutAfterCheckin: "Check-out must be after check-in",
      adultsGteRooms:
        "Number of adults must be greater than or equal to number of rooms",
      adultsRoomsMin: "Adults and rooms must be at least 1",
    },
  },
  countries: {},
};
