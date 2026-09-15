import type { LandingTranslations } from "./types";

export const en: LandingTranslations = {
  heroEyebrow: "Trusted by travellers worldwide",
  heroTitle: "One search. Every hotel. Your perfect stay.",
  heroSubtitle:
    "Browse hotels, apartments and rentals by star rating, reviews and type — then book through partners you know.",
  heroImageAlt:
    "Clifftop resort with infinity pool overlooking the ocean at sunset",
  featuresTitle: (siteName) => `Why travellers choose ${siteName}`,
  featuresSubtitle:
    "One search connects you to hotel options from trusted partners — organised by stars, reviews and your dates.",
  features: [
    {
      title: "Browse before you book",
      desc: "Filter by star rating, property type and guest score to see which hotels genuinely match your trip.",
    },
    {
      title: "Hotels in every corner",
      desc: "City breaks, coastal retreats or extended stays — we surface options across thousands of destinations worldwide.",
    },
    {
      title: "Book through trusted partners",
      desc: "Continue to established booking sites when you're ready — no hidden sign-up, no mark-up on rates.",
    },
  ],
  destinationsTitle: "Popular destinations",
  destinationsSubtitle: "Browse hotels in the world's most visited cities.",
  compareRates: "Compare rates",
  checkingRates: "Checking rates…",
  ctaTitle: "Ready to find your stay?",
  ctaSubtitle:
    "Search above to browse hotel options and continue to your preferred booking partner.",
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
      `${siteName} may receive a commission when you book through our links.`,
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
