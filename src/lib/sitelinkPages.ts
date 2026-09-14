import type { SitelinkDatePreset } from "./sitelinkDates";
import type { LandingPageBenefit, LandingPageFaq } from "../types/landingPage";

/** Google Ads sitelink landing pages — SEO guides at /{slug}. */

export type SitelinkArticleSection = {
  heading: string;
  paragraphs: string[];
};

export type SitelinkPageConfig = {
  slug: string;
  /** Sitelink link text / H1 */
  title: string;
  /** Sitelink description line 1 — hero subtitle */
  description1: string;
  /** Sitelink description line 2 — intro heading */
  description2: string;
  datePreset: SitelinkDatePreset;
  dateHint: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  heroImageAlt: string;
  datePublished: string;
  dateModified: string;
  sections: SitelinkArticleSection[];
  howTo: { name: string; steps: string[] };
  destinationsTitle: string;
  destinationsSubtitle: string;
  browseTitle: string;
  browseSubtitle: string;
  /** When set, browse links go to /hotels/{city}/{intent}; otherwise city pages. */
  browseIntentSlug?: string;
  benefits: LandingPageBenefit[];
  faqs: LandingPageFaq[];
};

const PUBLISHED = "2026-08-14";
const MODIFIED = "2026-08-14";

export const SITELINK_PAGES: readonly SitelinkPageConfig[] = [
  {
    slug: "last-minute-hotel-deals",
    title: "Last Minute Hotel Deals",
    description1: "Tonight’s already selected. Search a city and see what’s still listed.",
    description2: "A last-minute stay, without the scramble",
    datePreset: "tonight",
    dateHint: "Tonight is selected — change the dates anytime.",
    intro:
      "Last-minute hotel deals are simply stays you can compare close to arrival. Economy Stays prefills tonight so you can search a city and review hotels, apartments, and rentals listed now — then continue to book only if a stay looks right.",
    metaTitle: "Last-Minute Hotel Deals: Compare Tonight | Economy Stays",
    metaDescription:
      "Compare last-minute hotel deals for tonight. Search any city, review what’s listed right now, and continue to book only if a stay looks right.",
    focusKeyword: "last-minute hotel deals",
    heroImageAlt:
      "Hotel at dusk overlooking water, suggesting a same-day or last-minute stay",
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    destinationsTitle: "Tonight, in cities people love",
    destinationsSubtitle:
      "Tap a destination to compare what’s listed for tonight — or search any city above.",
    browseTitle: "Last-minute hotel pages by city",
    browseSubtitle: "Open a city guide, then search the night you actually need.",
    browseIntentSlug: "last-minute-hotels",
    sections: [
      {
        heading: "What last-minute hotel deals mean here",
        paragraphs: [
          "A last-minute hotel search is a date-first comparison: you are looking at stays that start tonight or in the next night or two, not a secret inventory we control. Rooms and rates update throughout the day, so what you see is a snapshot for the city and dates you choose.",
          "That is useful when plans shift, a flight lands late, or you would rather not wait until you arrive to think about a bed. It is not a promise that every city still has space, or that a rate will hold until you finish booking.",
        ],
      },
      {
        heading: "How to compare a same-day hotel stay",
        paragraphs: [
          "Enter a destination in the search above. Tonight is already selected as check-in, with a one-night stay — a typical last-minute pattern. Adjust the calendar if you are arriving tomorrow or staying longer, then compare hotels, apartments, and rentals side by side.",
          "When a listing looks like a fit, continue to the travel site to confirm the room type, cancellation rules, and the total. Policies live there, not on Economy Stays.",
        ],
      },
      {
        heading: "Why tonight is preselected",
        paragraphs: [
          "Most last-minute travelers are solving for the next check-in, not a trip three weeks out. Prefilling tonight removes a step so you can focus on the city. If you meant a different night, change it — the comparison follows your dates, not a locked offer.",
          "Short-notice availability moves. A room that appears at lunch may be gone in the evening, or a new listing can show up after a cancellation. Treat the results as current, not reserved.",
        ],
      },
      {
        heading: "City pages for last-minute hotel searches",
        paragraphs: [
          "If you already know the destination, jump to a last-minute city page below — Paris, London, Tokyo, and other popular markets. Those landings keep the same comparison idea with a city already in mind, which is often faster than starting from a blank search.",
          "Still deciding where to go? Use a destination card to open current listings for tonight in a well-known city, or type anywhere in the form. Economy Stays does not rank a “best” last-minute city; we help you look.",
        ],
      },
      {
        heading: "What to review before you book",
        paragraphs: [
          "On the booking site, check arrival time, check-in hours, and whether the rate can be cancelled. Last-minute stays are sometimes non-refundable. Location matters more when you are tired: scan the map for the airport, station, or neighborhood you actually need.",
          "Economy Stays may earn a commission if you book. That does not change the price you pay. We do not operate hotels or process the reservation.",
        ],
      },
    ],
    howTo: {
      name: "How to compare last-minute hotel deals",
      steps: [
        "Enter your city in the search. Tonight is already selected; change dates if you need a different night.",
        "Compare hotels, apartments, and rentals listed for those dates.",
        "Open a stay that looks right and read the room, rate, and cancellation details on the booking site.",
        "Complete the booking on that site only if the stay still fits.",
      ],
    },
    benefits: [
      {
        title: "Skip the date math",
        text: "Tonight is already in the form, so you can hunt for a stay instead of filling calendars first.",
      },
      {
        title: "Go anywhere",
        text: "Type a city or tap a favorite destination and compare what is listed right now.",
      },
      {
        title: "Book where you trust",
        text: "You finish on a known travel site. Their rates, rooms, and cancellation rules apply.",
      },
    ],
    faqs: [
      {
        q: "Is this a special last-minute rate?",
        a: "It is a last-minute search: tonight is prefilled so you can see what’s listed right now. Rates and rooms can change as availability does.",
      },
      {
        q: "Can I travel a different night?",
        a: "Yes. Open the dates and pick whatever check-in and check-out you need before you compare.",
      },
      {
        q: "Who do I book with?",
        a: "A travel site such as Kayak. Economy Stays helps you search and compare; the booking happens on their site.",
      },
      {
        q: "Do last-minute hotel deals stay available all evening?",
        a: "Not necessarily. Listings can disappear or change. If a stay looks right, review it on the booking site promptly.",
      },
      {
        q: "Can I compare apartments and rentals too?",
        a: "Yes. The search can include hotels, apartments, and vacation rentals, depending on what’s listed for your city and dates.",
      },
      {
        q: "Does Economy Stays hold rooms for last-minute travelers?",
        a: "No. We do not hold inventory. You see what is currently listed for the search you run.",
      },
    ],
  },
  {
    slug: "unsold-room-deals",
    title: "Unsold Room Deals",
    description1: "Still deciding tonight? See which rooms are still listed.",
    description2: "Late availability, when a room is still on the board",
    datePreset: "tonight",
    dateHint: "Tonight is selected — change the dates anytime.",
    intro:
      "Unsold room deals, on this site, means comparing hotels that still show availability close to check-in. We do not warehouse leftover rooms. Search tonight — or any night — and review what travel sites still list for your city.",
    metaTitle: "Unsold Hotel Room Deals for Tonight | Economy Stays",
    metaDescription:
      "Compare unsold hotel room deals and late availability. Search tonight’s dates, see what is still listed, and review terms before you book.",
    focusKeyword: "unsold hotel room deals",
    heroImageAlt: "Hotel corridor and lobby suggesting rooms still listed close to check-in",
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    destinationsTitle: "See what’s still listed tonight",
    destinationsSubtitle:
      "Start with a popular city, or search the place you’re actually heading.",
    browseTitle: "Explore more cities",
    browseSubtitle: "Open a city page, then search tonight or any dates you prefer.",
    sections: [
      {
        heading: "What unsold rooms means on Economy Stays",
        paragraphs: [
          "Hotels sometimes keep rooms listed as the day of arrival gets close. Those listings can look like “leftover” inventory, but they still belong to the property and the booking site — not to us. Economy Stays is a comparison search: we help you see what is currently offered for your dates.",
          "If a city is busy, late availability can be thin. If a city is quiet, you may see more choice. Neither outcome is something we guarantee; it is simply what the search shows when you search.",
        ],
      },
      {
        heading: "Searching close to check-in",
        paragraphs: [
          "Tonight is selected so you can browse short-notice stays without setting the calendar first. That matches how people look for a room after a delayed trip or a spontaneous overnight. Change the dates if you are arriving later this week.",
          "Compare a few options rather than the first card you see. Location, check-in time, and cancellation rules often matter more than a headline rate when you are booking the same day.",
        ],
      },
      {
        heading: "Availability can move in both directions",
        paragraphs: [
          "A listing can vanish when someone else books it. A listing can also appear when a stay is listed again. Refreshing a search later in the day is reasonable; treating an earlier screenshot as a hold is not.",
          "Continue to the booking site to see whether the room type you want is still offered. Checkout is the source of truth for price and availability.",
        ],
      },
      {
        heading: "How to compare leftover hotel listings",
        paragraphs: [
          "Pick a city, keep tonight or set your night, and scan hotels and rentals together. Destination cards below run the same dates in popular markets if you want a faster start.",
          "City landings are useful when you want a broader guide first, then a search. Use them if you are still choosing a neighborhood or want context before you compare rates.",
        ],
      },
      {
        heading: "Short-notice travel, minus the myth",
        paragraphs: [
          "There is no private unsold-room warehouse behind this page. Marketing language around “last rooms” is common in travel; we would rather be plain: you are looking at what’s still listed close to arrival.",
          "If nothing useful appears, try a nearby date, a wider area, or another city. Then read the booking terms before you pay — especially for same-day check-in.",
        ],
      },
    ],
    howTo: {
      name: "How to look for unsold hotel rooms",
      steps: [
        "Search your city with tonight selected, or set the night you actually arrive.",
        "Compare which hotels and rentals are still listed for those dates.",
        "Open a stay and confirm the room is still offered on the booking site.",
        "Book on that site if the details still work for your arrival.",
      ],
    },
    benefits: [
      {
        title: "Made for tonight",
        text: "Dates are set for a stay starting tonight, so you can look at rooms still listed close to arrival.",
      },
      {
        title: "Whatever is still listed",
        text: "You’re comparing live listings — not leftover rooms we own or hold.",
      },
      {
        title: "Choose with a clear view",
        text: "Scan options side by side, then continue to the booking site only if a stay feels like a fit.",
      },
    ],
    faqs: [
      {
        q: "Do you sell leftover rooms yourselves?",
        a: "No. We send you to a travel site such as Kayak. A room appears here only if it’s still listed for your dates.",
      },
      {
        q: "Why start with tonight?",
        a: "Short-notice searches are most useful close to arrival. Traveling later? Change the dates in the form.",
      },
      {
        q: "Will every city have something tonight?",
        a: "Not always. Busy nights can look thin. Try nearby dates or another destination if listings are scarce.",
      },
      {
        q: "Are unsold rooms always cheaper?",
        a: "Not always. Late listings can be a bargain, full price, or limited in type. Compare and read the offer.",
      },
      {
        q: "Can I book an unsold room for next month?",
        a: "You can search any dates. This page starts on tonight because that is when leftover-style availability is most relevant.",
      },
      {
        q: "Who confirms the room is still available?",
        a: "The travel site at checkout. Economy Stays does not reserve or confirm rooms.",
      },
    ],
  },
  {
    slug: "hotels-under-100",
    title: "Hotels Under $100",
    description1: "Hunt for wallet-friendly stays — then then sort by price.",
    description2: "Stretch the budget without locking a number",
    datePreset: "tomorrow",
    dateHint: "Tomorrow is selected — change the dates anytime.",
    intro:
      "This page is for travelers who want to compare more affordable hotels and rentals. We do not filter to a fixed nightly cap. Search a city, then sort by price on the booking site to lean toward budget-friendly stays for your dates.",
    metaTitle: "Budget Hotels: Compare Affordable Stays | Economy Stays",
    metaDescription:
      "Compare budget hotels and affordable stays by city. Rates vary with dates and destination — sort the results by price to see lower options.",
    focusKeyword: "budget hotels",
    heroImageAlt: "Simple, comfortable hotel room suggesting an affordable stay",
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    destinationsTitle: "Start with a city, then sort by price",
    destinationsSubtitle:
      "Popular places to begin — then use price filters to lean toward lower rates.",
    browseTitle: "Browse budget-friendly city pages",
    browseSubtitle: "Open a city landing made for more affordable stay searches.",
    browseIntentSlug: "cheap-hotels",
    sections: [
      {
        heading: "Searching for budget hotels without a hard cap",
        paragraphs: [
          "The sitelink title talks about a round number because that is how many people think about a simple stay. On the page itself, Economy Stays cannot enforce a price ceiling. Travel sites list a range of hotels and rentals; some will feel budget-friendly for your city and some will not.",
          "The practical move is to search, then sort or filter by price on the results. That is where lower nightly rates — when they exist for your dates — become easier to see.",
        ],
      },
      {
        heading: "Why affordable hotel rates move",
        paragraphs: [
          "The same property can look inexpensive on a Tuesday in shoulder season and much higher on a holiday weekend. Citywide events, remaining rooms, and stay length all change the picture. Comparing two dates is often more useful than assuming a “budget city” stays budget.",
          "A modest room in a high-demand destination can cost more than a nicer stay somewhere quieter. Use the city pages below if you want a cheaper-hotel landing for a specific market, then run your own dates.",
        ],
      },
      {
        heading: "How to lean toward more affordable stays",
        paragraphs: [
          "Tomorrow is selected as a default one-night search so you can start quickly. Set the nights you actually need. After you compare, open the booking site and sort by price, and consider slightly outside the very center if that still fits your plans.",
          "Read what is included. A low headline rate can exclude breakfast, or carry a stricter cancellation rule. The total on checkout is the number that matters.",
        ],
      },
      {
        heading: "City guides for cheaper hotel searches",
        paragraphs: [
          "Paris, London, Bangkok, and other popular cities have cheap-hotels landings linked below. Those pages keep the budget-search intent while you still choose dates and compare stays.",
          "If your trip is not in that list, type the city in the form. Economy Stays works as a worldwide comparison search, not a closed catalog of a few markets.",
        ],
      },
      {
        heading: "What we will not claim",
        paragraphs: [
          "We will not promise that every result sits under a fixed amount, or that we have the lowest rate on the internet. We show current listings for your search and let you continue to book where the offer is real.",
          "Economy Stays does not add a booking fee. If you complete a stay, we may earn a commission. Your price is set by the hotel and the site you book on.",
        ],
      },
    ],
    howTo: {
      name: "How to compare budget hotel stays",
      steps: [
        "Enter your destination and set the dates you need (tomorrow is only a starting point).",
        "Compare hotels and rentals listed for that search.",
        "On the booking site, sort by price and open a few of the more affordable options.",
        "Read the total and cancellation rules, then book on that site if the stay fits.",
      ],
    },
    benefits: [
      {
        title: "Built for budget browsing",
        text: "Pick a city, compare what’s listed, then sort on the booking site to lean toward lower nightly rates.",
      },
      {
        title: "Dates change the picture",
        text: "Weekends and holidays can look pricier. Nudge the calendar and compare again.",
      },
      {
        title: "The listed rate is the listed rate",
        text: "We don’t mark up stays or invent a price. You see what’s listed for your search.",
      },
    ],
    faqs: [
      {
        q: "Will every stay be a budget rate?",
        a: "No. We don’t cap results at a fixed price. Search, then sort by price on the booking site to find more affordable options for your dates.",
      },
      {
        q: "Why do some cities cost more?",
        a: "Demand, season, and the kind of stay all play a part. A simple room in one city can cost more than a nicer stay in another.",
      },
      {
        q: "Do you add extra fees?",
        a: "Economy Stays doesn’t add a booking fee. What you pay is set by the hotel and the booking site.",
      },
      {
        q: "Should I search weekdays to save?",
        a: "Sometimes weekday dates look easier on the budget, but it depends on the city. Compare both if your plans are flexible.",
      },
      {
        q: "Are apartments included in budget searches?",
        a: "They can be, when they’re listed. Compare stay types and check what the rate includes.",
      },
      {
        q: "Do you verify a property is “budget”?",
        a: "No. “Budget” is about the rate and the stay you choose — not a label we assign to every hotel.",
      },
    ],
  },
  {
    slug: "60-off-hotel-deals",
    title: "60% Off Hotel Deals",
    description1: "Spot hotel promotions when a hotel is listing a deal.",
    description2: "Look for marked-down stays — offer size depends on the hotel",
    datePreset: "tomorrow",
    dateHint: "Tomorrow is selected — change the dates anytime.",
    intro:
      "Hotel deals on Economy Stays means comparing rates hotels currently list — including properties that show a promotional price. We do not set markdowns or promise a fixed percentage off. Search a city, then read the offer details on the booking site.",
    metaTitle: "Hotel Deals & Promotional Rates Compared | Economy Stays",
    metaDescription:
      "Compare hotel deals and promotional rates from travel sites. Offer size varies by property and dates — review the details before you book.",
    focusKeyword: "hotel deals",
    heroImageAlt: "Resort pool at sunset suggesting a hotel stay with a promotional rate",
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    destinationsTitle: "See which cities are listing deals",
    destinationsSubtitle:
      "Promotions come and go with dates and hotels. Explore a city, then review the offer.",
    browseTitle: "Browse stays by city",
    browseSubtitle: "Open a city page, then search to compare current listed rates.",
    sections: [
      {
        heading: "Hotel deals vs a fixed markdown",
        paragraphs: [
          "Ads and sitelinks often use a striking discount line because travelers scan for a deal. On this page, the honest version is: some hotels show a promotional rate next to a usual one, and some do not. Economy Stays does not choose the markdown and does not guarantee a percentage off.",
          "When a hotel lists a deal, you can see it after you search a destination and open the offer. The conditions — dates, room type, cancellation — are on that site, with the hotel.",
        ],
      },
      {
        heading: "How promotional hotel rates show up",
        paragraphs: [
          "Run a search for your city and dates. Tomorrow is only a default so the form is ready. Compare the stays that come back. If a property is promoting a rate, that can appear in the comparison or on the page you continue to.",
          "A promotion for next month may not apply this weekend. If you can flex dates, try a second search. If you cannot, read the offer that actually matches your nights.",
        ],
      },
      {
        heading: "Read the deal where you book",
        paragraphs: [
          "Headline savings are easy to misunderstand. Check whether the rate is prepaid, whether breakfast is included, and whether you can cancel. A marked-down stay with no flexibility can still be a good fit — if you know that before you pay.",
          "Economy Stays does not invent crossed-out prices. Anything that looks like a discount should be confirmed on the booking site.",
        ],
      },
      {
        heading: "Timing a hotel-deal search",
        paragraphs: [
          "Deal density changes with season, events, and how full a hotel is. Searching early can surface advance-purchase rates. Searching closer to arrival can surface a different mix. Neither approach is “the trick”; they are just different snapshots.",
          "Use the destination cards to sample popular cities, or open a city landing if you want a broader guide before you compare.",
        ],
      },
      {
        heading: "Related ways to compare stays",
        paragraphs: [
          "If you care more about stretching a budget than spotting a promotion, try the budget-hotel guide. If you are going Friday to Sunday, the weekend page prefills those dates. If you need a room tonight, use last-minute or unsold-room searches instead.",
          "All of these pages compare current listings. None of them is a coupon we stamp on every hotel.",
        ],
      },
    ],
    howTo: {
      name: "How to compare hotel deals",
      steps: [
        "Search your destination and set real travel dates.",
        "Compare hotels and rentals that are listed — including any promotional rates they show.",
        "Open the offer on the booking site and read conditions, dates, and cancellation rules.",
        "Book on that site only if the deal still matches the stay you want.",
      ],
    },
    benefits: [
      {
        title: "Promotions, when they’re listed",
        text: "If a hotel is showing a deal, it can appear in your comparison after you search a city.",
      },
      {
        title: "Timing matters",
        text: "An offer for next month may not show this weekend. Shift the dates to see what’s actually on.",
      },
      {
        title: "Read before you book",
        text: "Conditions and cancellation rules live on the booking site — that’s where the offer is real.",
      },
    ],
    faqs: [
      {
        q: "Is every hotel on sale?",
        a: "No. You’ll see a mix of standard and promotional rates. Check the offer details on the booking site before you book.",
      },
      {
        q: "Do you choose the markdown?",
        a: "No. Any discount is between the hotel and the booking site. We don’t set or promise a percentage off.",
      },
      {
        q: "How do I find a stronger current rate?",
        a: "Enter your destination and dates, compare the options, then sort or filter on the booking site.",
      },
      {
        q: "Do deals apply to every room type?",
        a: "Often they do not. A promotion may be limited to certain rooms or dates. The offer spells that out.",
      },
      {
        q: "Can I combine a deal with other coupons?",
        a: "That depends on the booking site. Economy Stays does not issue coupons or stack codes.",
      },
      {
        q: "Why did a deal disappear when I clicked through?",
        a: "Promotional inventory can be limited. If it is gone, compare other listings or try nearby dates.",
      },
    ],
  },
  {
    slug: "cheap-hotels-near-you",
    title: "Cheap Hotels Near You",
    description1: "Save up to 70% on hotels near you — compare tonight's rates free.",
    description2: "Your location · Tonight · Compare rates in seconds",
    datePreset: "tonight",
    dateHint: "Tonight is selected — change the dates anytime.",
    intro:
      "Cheap hotels near you uses your approximate location to surface budget-friendly stays close to where you are. We detect your city from your IP address on load — no permission prompt. If IP lookup fails, your browser may ask once for location as a fallback. You can also search any city in the form above.",
    metaTitle: "Cheap Hotels Near You: Budget Stays Nearby | Economy Stays",
    metaDescription:
      "Find budget-friendly hotels near your location. We detect your city automatically and show nearby stays — tap to compare on a travel site.",
    focusKeyword: "cheap hotels near you",
    heroImageAlt: "City street with hotels, suggesting affordable stays near a destination",
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    destinationsTitle: "Budget-friendly stays near you",
    destinationsSubtitle:
      "Filtered to lower-tier properties by star rating. No price claim — sort by price on the booking site.",
    browseTitle: "Browse budget-friendly city pages",
    browseSubtitle: "Open a city landing made for more affordable stay searches.",
    browseIntentSlug: "cheap-hotels",
    sections: [
      {
        heading: "How we find stays near you",
        paragraphs: [
          "When you land on this page, we read your approximate city from your IP address — the same signal your browser uses for region-based content. No GPS prompt in the normal case. The city is used to surface budget-friendly hotel cards and to prefill the search form so you can compare immediately.",
          "If IP lookup cannot place you, your browser may ask for location once as a backup. Deny it and the search form still works — type any destination and compare.",
        ],
      },
      {
        heading: "What budget-friendly means on this page",
        paragraphs: [
          "There are no prices in the hotel cards. We filter the catalog to properties with a lower star rating, which is a proxy for budget tier — not a guarantee of a low nightly rate. Rates change with dates, demand, and season.",
          "Tap a card to open that specific property on Kayak. Sort by price there to see which options fit your budget for the dates you pick.",
        ],
      },
      {
        heading: "Searching by city instead",
        paragraphs: [
          "The hotel cards show stays near your detected location, but the search form above works for any destination. Type a city, set your dates, and compare hotels and rentals across the full catalog.",
          "City cheap-hotels pages below are useful if you already know the destination and want a budget-oriented landing with more context.",
        ],
      },
      {
        heading: "City center vs nearby areas",
        paragraphs: [
          "Staying slightly outside the core can look easier on the budget if transit still works for your plans. Compare a few map pins rather than assuming farther is always cheaper.",
          "Airports, old towns, and event venues each have their own rate patterns. Search the area you will actually use at night, not only the famous name.",
        ],
      },
      {
        heading: "From a nearby card to a booking",
        paragraphs: [
          "Tap a hotel card and you will be taken to that specific property on a booking partner. Read the room type, rate, and cancellation policy there — those details live on the booking site, not here. Economy Stays does not process reservations. We may earn a commission if you complete a stay; it does not change the rate you are offered.",
          "If nothing nearby fits, change your dates in the form above, or search any city there.",
        ],
      },
    ],
    howTo: {
      name: "How to compare cheap hotels near you",
      steps: [
        "Land on the page — your approximate city is detected from IP and nearby budget-friendly hotels appear.",
        "If IP lookup fails, allow the one-time location prompt for closer results, or type a city in the form.",
        "Set tonight's dates (or change them) and tap a hotel card to compare on a booking site.",
      ],
    },
    benefits: [
      {
        title: "Nearby stays, found automatically",
        text: "Your city is detected from IP on load — no permission needed. Nearby budget hotels appear immediately.",
      },
      {
        title: "GPS only if IP fails",
        text: "Most visitors see nearby hotels with no permission prompt. Location is requested only when IP lookup cannot place you.",
      },
      {
        title: "Familiar booking sites",
        text: "Cards open on Kayak or your preferred partner. Review the property and rate there before you book.",
      },
    ],
    faqs: [
      {
        q: "Does this page use my location?",
        a: "Approximately, yes. We read your city from your IP address on load — usually with no GPS prompt. If IP lookup fails, your browser may ask for location once as a backup.",
      },
      {
        q: "When does the browser ask for location?",
        a: "Only if IP lookup cannot place you. Allow it for closer nearby hotels, or deny it and search any city in the form above.",
      },
      {
        q: "Are these the cheapest hotels available?",
        a: "They are a budget-tier starting point. We filter by star rating, not by price — actual rates depend on your dates and the booking site. Sort by price there to find the most affordable options.",
      },
      {
        q: "Can I search a different city?",
        a: "Yes. Type any destination in the search form above. The nearby cards use your location; the form works for any city.",
      },
      {
        q: "What if I am booking from another country?",
        a: "The nearby hotel cards use your current location. To search a different destination, type it in the form above.",
      },
      {
        q: "Do you store my location?",
        a: "Your IP city is read once to load nearby hotels and is not stored by Economy Stays. If the browser location fallback runs, those coordinates are used only for the hotel query and are not stored.",
      },
    ],
  },
  {
    slug: "weekend-hotel-deals",
    title: "Weekend Hotel Deals",
    description1: "Friday to Sunday is ready. Pick a city and plan a two-night escape.",
    description2: "Your weekend stay, already on the calendar",
    datePreset: "weekend",
    dateHint: "This weekend is selected — change the dates anytime.",
    intro:
      "Weekend hotel deals here means comparing a Friday-to-Sunday stay. Economy Stays prefills the coming weekend so you can search a city for a two-night getaway, then continue to the booking site if a hotel or rental looks right.",
    metaTitle: "Weekend Hotel Deals: Friday–Sunday Stays | Economy Stays",
    metaDescription:
      "Compare weekend hotel deals with Friday–Sunday dates ready. Search any city for a two-night stay and review listed rates before you book.",
    focusKeyword: "weekend hotel deals",
    heroImageAlt: "Weekend getaway hotel with terrace seating for a Friday to Sunday stay",
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    destinationsTitle: "This weekend, somewhere great",
    destinationsSubtitle:
      "Compare Friday–Sunday in a popular city, or search any destination above.",
    browseTitle: "Browse weekend-ready city pages",
    browseSubtitle: "Open a city landing, then keep these dates or pick another weekend.",
    sections: [
      {
        heading: "Planning a Friday-to-Sunday hotel stay",
        paragraphs: [
          "A classic weekend getaway is two nights: check in Friday, check out Sunday. That pattern is already selected so you can compare hotels, apartments, and rentals without doing calendar math. If today is Friday, this weekend is selected; otherwise it is the next Friday–Sunday.",
          "Weekend demand is often different from midweek. Starting with those dates means you are comparing the nights most people actually travel for a short trip — not a random Tuesday pair.",
        ],
      },
      {
        heading: "Why weekend dates are prefilled",
        paragraphs: [
          "Travelers clicking a weekend sitelink usually want a short escape, not a week-long stay. Prefill gets you to the comparison faster. You can still stretch to a long weekend (Thursday or Monday) in the date picker.",
          "If you are looking at tonight instead of Friday, the last-minute page is a better starting point. If budget is the main filter, use the budget-hotel guide after you set weekend dates.",
        ],
      },
      {
        heading: "City getaways to compare",
        paragraphs: [
          "Destination cards open current listings for the same Friday–Sunday in cities people often weekend in — Paris, Barcelona, London, and others. City landings below are useful when you want a destination guide first.",
          "There is no ranked “best weekend city” on Economy Stays. Train time, events, and what you like to do matter more than a generic list. Search the place you would actually enjoy for two nights.",
        ],
      },
      {
        heading: "Hotels, apartments, and short rentals",
        paragraphs: [
          "A weekend stay might be a hotel near a station, an apartment with a kitchen, or a small rental. Compare stay types for the same dates. Weekend rates can be higher for some hotels and more flexible for others; look at the total, not only the Friday night.",
          "Check Saturday checkout quirks, late check-in if you leave after work, and cancellation if plans are still loose.",
        ],
      },
      {
        heading: "From comparison to a booked weekend",
        paragraphs: [
          "When a stay looks right, continue to the booking site to confirm the room and the policy. Economy Stays does not take the booking. We may earn a commission if you complete a reservation.",
          "If you hoped for a giant automatic markdown, this page isn’t a sitewide weekend coupon — promotions appear only when a hotel is actually listing one.",
        ],
      },
    ],
    howTo: {
      name: "How to compare weekend hotel deals",
      steps: [
        "Keep the prefilled Friday–Sunday dates, or shift to the weekend you are actually traveling.",
        "Search a city and compare hotels and rentals for those two nights.",
        "Open a stay on the booking site and check the total, check-in time, and cancellation rules.",
        "Book on that site if the weekend stay still fits.",
      ],
    },
    benefits: [
      {
        title: "The weekend is set",
        text: "Check-in is the coming Friday and check-out is Sunday — a two-night stay without extra calendar work.",
      },
      {
        title: "Going a different weekend?",
        text: "Change the dates in the form and compare whatever Friday (or Thursday) you have in mind.",
      },
      {
        title: "Stay your way",
        text: "Hotels, apartments, and rentals from travel sites. Finish on the site you prefer.",
      },
    ],
    faqs: [
      {
        q: "Which weekend is selected?",
        a: "The coming Friday through Sunday. If today is Friday, that’s this weekend; otherwise it’s the next one.",
      },
      {
        q: "Can I stay longer than two nights?",
        a: "Yes. Open the date picker and stretch the stay before you compare.",
      },
      {
        q: "Are weekend rates different?",
        a: "They often are. Starting with Friday–Sunday means you’re comparing the dates most weekend trips actually use.",
      },
      {
        q: "Can I check in Thursday after work?",
        a: "Yes. Change check-in to Thursday (or any night) in the form, then compare again.",
      },
      {
        q: "Do you offer a weekend-only coupon?",
        a: "No. This page prefills weekend dates. Any promotional rate comes from the listing, not a Economy Stays coupon.",
      },
      {
        q: "What if Friday is sold out?",
        a: "Try Saturday check-in, a nearby area, or another city. Availability is whatever is listed for your search.",
      },
    ],
  },
];

export const SITELINK_SLUGS = SITELINK_PAGES.map((page) => page.slug);

export const getSitelinkPage = (slug: string): SitelinkPageConfig | undefined =>
  SITELINK_PAGES.find((page) => page.slug === slug);
