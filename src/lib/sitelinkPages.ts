import type { SitelinkDatePreset } from "./sitelinkDates";
import type { LandingPageBenefit, LandingPageFaq } from "../types/landingPage";

/** Google Ads sitelink landing pages � SEO guides at /{slug}. */

export type SitelinkArticleSection = {
  heading: string;
  paragraphs: string[];
};

export type SitelinkPageConfig = {
  slug: string;
  /** Sitelink link text / H1 */
  title: string;
  /** Sitelink description line 1 � hero subtitle */
  description1: string;
  /** Sitelink description line 2 � intro heading */
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
  /** When set, browse links go to /stay/{cc}/{city}/{theme}; otherwise city pages. */
  browseIntentSlug?: string;
  benefits: LandingPageBenefit[];
  faqs: LandingPageFaq[];
};

const PUBLISHED = "2026-09-01";
const MODIFIED = "2026-09-01";

export const SITELINK_PAGES: readonly SitelinkPageConfig[] = [
  // ??????????????????????????????????????????????????????????????????????
  // 1. Tonight's stays (was: last-minute-hotel-deals)
  // ??????????????????????????????????????????????????????????????????????
  {
    slug: "tonight-stays",
    title: "Tonight's Hotel Stays",
    description1: "Tonight is pre-set. Pick a city and see what's available now.",
    description2: "A place to sleep tonight, sorted in minutes",
    datePreset: "tonight",
    dateHint: "Tonight is pre-filled � swap the dates whenever you like.",
    intro:
      "Searching for a place to stay tonight means looking at real availability, not a fixed offer. Economy Stays pre-fills this evening's check-in so you can type a city straight into the search and browse what's actually listed � hotels, apartments and serviced rentals � before deciding whether to book.",
    metaTitle: "Tonight's Hotel Stays � Browse What's Available | Economy Stays",
    metaDescription:
      "Browse hotel stays available tonight. Enter a city, see what's listed right now, and head to a booking partner only when you find something that fits.",
    focusKeyword: "hotel stays tonight",
    heroImageAlt: "Warm hotel lobby glowing at night through glass windows",
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    destinationsTitle: "Browse tonight in popular cities",
    destinationsSubtitle: "Tap a destination to see what's listed for tonight, or search any city above.",
    browseTitle: "Tonight's stays by destination",
    browseSubtitle: "Open a city page to see availability already filtered for this evening.",
    browseIntentSlug: "top-rated",
    sections: [
      {
        heading: "What it means to search for a stay tonight",
        paragraphs: [
          "A same-night search pulls from live listings in the city you enter. Economy Stays doesn't hold a special inventory for evening searches � you see the hotels and apartments that happen to have tonight available, the same ones you'd find by searching elsewhere. Pre-filling tonight just saves you from opening a date picker before you've even chosen a city.",
          "Availability changes through the day. A property that has space at lunchtime might sell out by evening, and a cancellation can free up rooms that didn't appear this morning. The results are a snapshot, not a reservation.",
        ],
      },
      {
        heading: "How to look for a place to stay tonight",
        paragraphs: [
          "Type a city or neighbourhood into the search form above. Tonight's check-in and a one-night stay are already set � a sensible default for most same-evening needs. If you're staying two nights, or if you mean tomorrow rather than today, adjust the calendar before you compare.",
          "Browse the results on your chosen booking partner's site. Check the check-in cut-off time, the cancellation policy, and the total before you commit. Property rules live on the booking site; Economy Stays doesn't hold the reservation.",
        ],
      },
      {
        heading: "Why same-night searches need a bit of flexibility",
        paragraphs: [
          "Central locations tend to fill earlier in the day, so searching tonight from a midday position gives a wider choice than waiting until after dinner. If the first city you try looks sparse, try a nearby town or consider a property slightly further from the centre � travel time matters less when you only need one night.",
          "Some properties have late check-in cutoffs; others require you to arrive by a specific hour. Scanning those details on the partner site before you click confirm can save a difficult conversation at reception.",
        ],
      },
      {
        heading: "City guides for tonight's stays",
        paragraphs: [
          "If you already know your destination, jump straight to a city page � Paris, London, Tokyo, and other major travel markets are listed below. Those pages open with the city's inventory already in view, which is faster than starting from a blank search when you know where you're headed.",
          "If the destination is still open, use the destination cards to browse availability in a city you've been considering, or type anywhere in the form above. Economy Stays doesn't recommend one city over another; that part is yours to decide.",
        ],
      },
    ],
    howTo: {
      name: "How to find a hotel stay for tonight",
      steps: [
        "Type your city in the search form. Tonight's check-in is pre-filled; adjust the date if you mean a different evening.",
        "Browse hotel and apartment listings available for those dates.",
        "Open a listing that looks suitable and read the check-in time, room details and cancellation terms on the booking site.",
        "Complete the booking on that site if the stay still fits your plans.",
      ],
    },
    benefits: [
      {
        title: "No date-picking to start",
        text: "Tonight is already in the form so you can go straight to choosing a city and browsing what's listed.",
      },
      {
        title: "Any destination",
        text: "Search any city worldwide � or tap a popular destination to jump straight to tonight's availability.",
      },
      {
        title: "Book where you prefer",
        text: "You complete the reservation on a trusted booking site. Their prices, policies and room details apply.",
      },
    ],
    faqs: [
      {
        q: "Is this a special tonight-only rate?",
        a: "No � tonight is simply the date that's pre-filled. Rates and availability are whatever's listed on partner booking sites for the city and dates you choose.",
      },
      {
        q: "Can I search for a different night instead?",
        a: "Yes. Open the date picker and choose any check-in and check-out that suits your trip.",
      },
      {
        q: "Where do I actually book?",
        a: "On a travel booking partner such as Kayak or Booking.com. Economy Stays helps you browse options; the reservation is completed on their platform.",
      },
      {
        q: "What if the city I want shows no availability?",
        a: "Try adjusting the dates, searching a nearby town, or looking for properties slightly outside the city centre. Availability is whatever's currently listed on partner sites.",
      },
    ],
  },

  // ??????????????????????????????????????????????????????????????????????
  // 2. Unsold rooms tonight (was: unsold-room-deals)
  // ??????????????????????????????????????????????????????????????????????
  {
    slug: "unsold-rooms-tonight",
    title: "Unsold Hotel Rooms Tonight",
    description1: "Hotels list unsold rooms through booking sites until arrival. Browse what remains.",
    description2: "Same-night rooms that haven't sold yet",
    datePreset: "tonight",
    dateHint: "Tonight is set � adjust the date if you're looking ahead.",
    intro:
      "An unsold hotel room is one that hasn't been booked yet for the night in question. Those rooms appear in standard booking searches alongside rooms available further out � there's no separate unsold inventory. Economy Stays pre-fills tonight so you can browse what a city still has listed, and continue to a booking partner if something suits.",
    metaTitle: "Unsold Hotel Rooms Tonight � Browse Available Stays | Economy Stays",
    metaDescription:
      "Browse hotel rooms listed for tonight that haven't sold yet. Enter a city to see what's still available and head to a booking partner to reserve.",
    focusKeyword: "unsold hotel rooms tonight",
    heroImageAlt: "Hotel corridor with doors slightly open, suggesting vacant rooms",
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    destinationsTitle: "Cities with rooms listed tonight",
    destinationsSubtitle: "Browse availability in a popular destination or search any city above.",
    browseTitle: "Same-night hotel pages by city",
    browseSubtitle: "Open a city page already filtered for tonight to see what's still listed.",
    browseIntentSlug: "with-free-cancellation",
    sections: [
      {
        heading: "How unsold rooms work in practice",
        paragraphs: [
          "Hotels list rooms through online travel agencies and their own sites until check-in time � sometimes even after. An unsold room isn't in a hidden pool; it's simply any room that hasn't been reserved yet for the night. That means searching tonight works the same way as searching any other date: you're seeing rooms that happen to still be listed.",
          "Properties sometimes adjust their pricing as arrival approaches, though whether that means lower or higher rates depends on the hotel and the market. There's no rule that says an unsold room must be discounted, but in competitive markets some properties do reduce rates rather than have the room go empty.",
        ],
      },
      {
        heading: "Why tonight's search is different from planning ahead",
        paragraphs: [
          "When you search tonight, the pool of options is smaller than it was a week ago � some properties and room types have already been taken. But the options that remain are listed at a current rate, which may reflect the hotel's calculation about what it can realistically fill at short notice.",
          "The trade-off is real: fewer choices, but rates set for same-day rather than months-out inventory. Whether that trade works in your favour depends on the city, the season, and the day of the week.",
        ],
      },
      {
        heading: "What to check before you book a same-night room",
        paragraphs: [
          "Late check-in can be an issue. Some properties have a cutoff after which the front desk closes or the rate changes. Confirm the check-in window on the booking partner's site before you commit.",
          "Same-night rooms are sometimes non-refundable. Read the cancellation policy on the booking partner's page � if the room isn't what you expected on arrival, you may have limited options.",
        ],
      },
    ],
    howTo: {
      name: "How to find an unsold hotel room for tonight",
      steps: [
        "Enter your destination city in the search above. Tonight is pre-filled.",
        "Browse listings that still show availability for this evening.",
        "Check the check-in time and cancellation policy on the booking partner's page.",
        "Complete the booking there if the room and terms suit you.",
      ],
    },
    benefits: [
      {
        title: "Tonight pre-filled",
        text: "Same-night availability is already set so you can focus on the city rather than the calendar.",
      },
      {
        title: "Live listings",
        text: "You see what's actually listed right now � not a cached snapshot from earlier in the day.",
      },
      {
        title: "No hidden inventory",
        text: "Economy Stays connects you to the same booking partners you'd use directly. No separate late-night pool.",
      },
    ],
    faqs: [
      {
        q: "Are unsold rooms cheaper?",
        a: "Not always. Some hotels reduce rates near check-in; others hold their price or raise it if demand is high. What you see depends on the property and market conditions.",
      },
      {
        q: "Can I search for unsold rooms on a different night?",
        a: "Yes � change the dates in the form. The same principle applies: you're browsing rooms that haven't been reserved yet for the dates you choose.",
      },
      {
        q: "What if I find something but can't check in until late?",
        a: "Check the property's stated check-in hours on the booking partner's page before reserving. Some hotels require arrival by a certain time or charge for late arrival.",
      },
    ],
  },

  // ??????????????????????????????????????????????????????????????????????
  // 3. Stays under $100 (was: hotels-under-100)
  // ??????????????????????????????????????????????????????????????????????
  {
    slug: "stays-under-100",
    title: "Hotel Stays Under $100",
    description1: "Filter by price on the booking site. Tonight or your dates.",
    description2: "Budget accommodation, searched honestly",
    datePreset: "tonight",
    dateHint: "Tonight is pre-filled � change dates to suit your trip.",
    intro:
      "Finding a hotel stay under $100 is a matter of searching the right dates in the right city and then filtering by price on the booking site. Economy Stays connects you to travel partners where you can set your own price ceiling � whether that's $100, $80 or less. The rate you see depends on your destination, travel dates and the partners' current inventory.",
    metaTitle: "Hotel Stays Under $100 � Search by Budget | Economy Stays",
    metaDescription:
      "Browse hotel stays within a budget. Search by city and dates, then filter by price on the booking partner's site to find accommodation under $100.",
    focusKeyword: "hotel stays under 100",
    heroImageAlt: "Clean and tidy budget hotel room with warm bedside lighting",
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    destinationsTitle: "Budget-friendly destinations to browse",
    destinationsSubtitle: "Cities where travellers regularly find accommodation within budget.",
    browseTitle: "Budget stay pages by city",
    browseSubtitle: "Open a city guide and filter by price on the booking partner's site.",
    browseIntentSlug: "under-150",
    sections: [
      {
        heading: "What determines whether a stay fits your budget",
        paragraphs: [
          "The nightly rate for any hotel depends on the destination, season, day of the week and how far in advance you're searching. A $100 budget stretches further in cities with high accommodation supply and lower overall cost of living, while major European capitals and popular beach resorts tend to sit higher at peak times.",
          "Midweek nights, travel in the shoulder season (the months just outside the peak tourist period) and staying slightly outside the city centre are the three most reliable ways to bring a nightly rate into a tighter budget without sacrificing comfort.",
        ],
      },
      {
        heading: "How to use price filters effectively",
        paragraphs: [
          "When you reach a booking partner's site from Economy Stays, use their price filter to set your ceiling. Most major travel sites let you cap the nightly rate, which removes options outside your range immediately. Sorting by price lowest-first then lets you compare what remains by location, review score and cancellation flexibility.",
          "Watch for the all-in total, not just the headline rate. Some properties add taxes, city levies or resort fees at checkout. The final figure is what matters when you're working to a budget.",
        ],
      },
      {
        heading: "Property types that often sit within tighter budgets",
        paragraphs: [
          "Guesthouses, bed and breakfasts, budget hotel chains and serviced apartments frequently price below or around $100 in mid-sized cities. Hostels with private rooms are also worth considering if you don't need full hotel amenities.",
          "Economy Stays surfaces options from booking partners who carry a wide range of property types. Tap through to the partner site and use their filters to narrow by type as well as price.",
        ],
      },
    ],
    howTo: {
      name: "How to find a hotel stay under $100",
      steps: [
        "Enter your destination and travel dates in the search above.",
        "Continue to the booking partner's site from the results.",
        "Use the price filter to set a ceiling (e.g. $100 per night).",
        "Sort remaining options by review score or location to find the best match.",
      ],
    },
    benefits: [
      {
        title: "Search any city",
        text: "The right budget accommodation depends on the destination. Search any city worldwide to see what's available at your price point.",
      },
      {
        title: "Your dates, your price",
        text: "Set your own travel dates and apply the price filter on the booking partner's site to match your budget exactly.",
      },
      {
        title: "Wide property range",
        text: "Booking partners carry hotels, apartments, guesthouses and hostels. Filter by type to find the best fit for your trip.",
      },
    ],
    faqs: [
      {
        q: "Can Economy Stays guarantee stays under $100?",
        a: "No. Rates depend on your destination, dates and the booking partner's current inventory. Use the price filter on the partner's site to find options within your budget.",
      },
      {
        q: "Are taxes included in the price shown?",
        a: "Usually not at the initial listing stage. Check the total at checkout on the booking partner's site before confirming.",
      },
      {
        q: "Does the budget stretch further on certain days?",
        a: "Often yes. Midweek nights (Sunday through Thursday) and shoulder-season travel tend to surface more options within a tight budget than peak weekends.",
      },
      {
        q: "What if my destination has nothing under $100?",
        a: "Try adjusting your dates, expanding the search radius to nearby towns, or considering a different property type such as a guesthouse or serviced apartment.",
      },
    ],
  },

  // ??????????????????????????????????????????????????????????????????????
  // 4. Half-price stays (was: 60-off-hotel-deals)
  // ??????????????????????????????????????????????????????????????????????
  {
    slug: "half-price-stays",
    title: "Half-Price Hotel Stays",
    description1: "Some hotels price well below their usual rate. Browse and compare.",
    description2: "Stays worth looking at before you settle on a price",
    datePreset: "nextWeekend",
    dateHint: "Next weekend is set � change the dates if you need different nights.",
    intro:
      "A half-price hotel stay is a room priced noticeably below the rate the same property typically charges for similar dates. These appear in ordinary search results � there's no special filter for 'half price'. Economy Stays connects you to booking partners where you can compare rates, check recent price history where available, and continue to book if the saving looks genuine.",
    metaTitle: "Half-Price Hotel Stays � Browse Reduced Rates | Economy Stays",
    metaDescription:
      "Browse hotels where rates are well below their usual level. Search your dates, compare prices across booking partners, and continue to reserve when a saving looks real.",
    focusKeyword: "half price hotel stays",
    heroImageAlt: "Hotel pool terrace at dusk with empty sun loungers",
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    destinationsTitle: "Destinations worth comparing rates",
    destinationsSubtitle: "Browse accommodation across booking partners in popular cities.",
    browseTitle: "Browse rates by city",
    browseSubtitle: "Open a city page and compare rates for your travel dates.",
    browseIntentSlug: "top-rated",
    sections: [
      {
        heading: "When hotel rates drop significantly",
        paragraphs: [
          "Hotels adjust rates constantly. A property may price below its usual level when it has unsold inventory close to arrival, during a slow period in the local calendar, or when nearby competition increases. None of these show up labelled as 'half price' in search results � you find them by comparing rates across dates and properties.",
          "Price comparison sites sometimes show a property's recent rate history, which makes it easier to judge whether the current figure is genuinely low or the usual rate reframed as a deal. Economy Stays connects you to partners where those tools exist.",
        ],
      },
      {
        heading: "How to spot a genuinely reduced rate",
        paragraphs: [
          "Search the same property across a few date combinations. If rates for midweek or shoulder-season dates are meaningfully lower than the same property on a peak weekend, that's genuine variation, not a manufactured deal.",
          "Cross-reference on the booking partner's site. Many platforms show a 'was' price alongside the current rate, or display a rate history chart. Reading that figure before you filter gives you a baseline to judge the discount against.",
        ],
      },
      {
        heading: "What to check before booking a reduced-rate stay",
        paragraphs: [
          "A lower rate sometimes comes with conditions: a stricter cancellation policy, a non-refundable pre-payment, or a minimum stay requirement. Read the full terms before you confirm. A saving that costs you the flexibility to cancel may not be worth it depending on how certain your plans are.",
          "Economy Stays passes you through to a booking partner where those terms are clearly stated. We don't hold rates or offer our own discount codes � the rate you see is set by the property and the partner platform.",
        ],
      },
    ],
    howTo: {
      name: "How to find a significantly reduced hotel rate",
      steps: [
        "Enter your destination and travel dates in the search above.",
        "Browse results on the booking partner's site.",
        "Check the price history or 'was' price where the platform shows it.",
        "Read the cancellation terms before confirming � reduced rates sometimes come with conditions.",
      ],
    },
    benefits: [
      {
        title: "Compare across partners",
        text: "Booking partners sometimes have different rates for the same property. Browsing through Economy Stays connects you to multiple options.",
      },
      {
        title: "Rate context matters",
        text: "A lower number only makes sense against a baseline. Use the partner site's price history where available to judge the saving honestly.",
      },
      {
        title: "Your terms, your choice",
        text: "Check cancellation flexibility before you book. A saving that locks you in may not be the right call if travel plans can change.",
      },
    ],
    faqs: [
      {
        q: "Can Economy Stays show me properties at exactly half price?",
        a: "No. There's no filter for a specific percentage saving. Compare rates across dates and properties to judge where prices are relatively low for the destination.",
      },
      {
        q: "Are sale prices genuine?",
        a: "Some are, some aren't. Use the booking partner's price history tool (where available) to compare the listed rate against recent prices for the same property and date window.",
      },
      {
        q: "Do discounted rates always have stricter terms?",
        a: "Not always, but it's common. Non-refundable rates typically price lower than flexible ones. Check the cancellation policy before you confirm.",
      },
      {
        q: "Which cities tend to have the most rate variation?",
        a: "Cities with high hotel supply and distinct peak and off-peak seasons tend to show more variation. Major capital cities, beach resorts and convention destinations often fluctuate considerably.",
      },
    ],
  },

  // ??????????????????????????????????????????????????????????????????????
  // 5. Stays near me (was: cheap-hotels-near-you)
  // ??????????????????????????????????????????????????????????????????????
  {
    slug: "stays-near-me",
    title: "Hotel Stays Near Me",
    description1: "Allow location access and browse hotels within a few kilometres.",
    description2: "Accommodation close to where you are right now",
    datePreset: "tonight",
    dateHint: "Tonight is set � adjust the dates to match your actual stay.",
    intro:
      "Finding a hotel near your current location means allowing the browser to share your position, which Economy Stays uses to suggest the nearest city and fill the destination field. From there, you search normally and browse results from booking partners on a map or in a list � sorted by distance if the partner platform supports it.",
    metaTitle: "Hotels Near Me � Browse Stays Close to Your Location | Economy Stays",
    metaDescription:
      "Browse hotel stays near your current location. Allow location access and Economy Stays fills the destination automatically so you can compare nearby accommodation.",
    focusKeyword: "hotel stays near me",
    heroImageAlt: "City street at night with hotel signs visible through light rain",
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    destinationsTitle: "Popular cities travellers search from",
    destinationsSubtitle: "Or use the search above with your location to find nearby stays.",
    browseTitle: "Browse nearby stays by city",
    browseSubtitle: "Open a city page to browse accommodation with a destination already set.",
    sections: [
      {
        heading: "How location-based hotel search works here",
        paragraphs: [
          "When you visit this page, Economy Stays asks permission to access your device's location. If you allow it, the search form fills in the nearest city automatically. You can adjust that city if the suggestion isn't quite right � for example if you're near a city boundary and a different name describes your actual location better.",
          "Location access is optional. If you'd rather not share your position, type the city or area you want into the search directly. The location feature just removes that one step when convenience matters.",
        ],
      },
      {
        heading: "What 'near me' means for hotel searches",
        paragraphs: [
          "A hotel search centred on your location returns properties in and around the city the booking partner associates with your position. On the partner's site you can often switch to a map view and drag the search area, which is useful when you're between cities or looking for something in a specific neighbourhood rather than the city overall.",
          "Distance in a hotel search is typically measured from the city centre, not from your exact coordinates. If you need the stay to be within walking distance of where you actually are, use the map view on the booking partner's site to check the property's location directly.",
        ],
      },
      {
        heading: "Choosing the right stay when you're already in a city",
        paragraphs: [
          "If you're searching while already in a destination, tonight is pre-filled and one night is the default stay length. That's the most common pattern for a same-day location search. Adjust the duration if you need more than one night.",
          "On the booking partner's site, sorting by distance from a fixed point (an address, transport hub or attraction) is often more useful than sorting by price when proximity is the main consideration. Check the map before you book.",
        ],
      },
    ],
    howTo: {
      name: "How to find a hotel near your current location",
      steps: [
        "Allow location access when prompted � Economy Stays fills the city for you.",
        "Adjust the destination if the suggestion isn't quite right for your position.",
        "Set your dates and number of guests, then search.",
        "Use the map view on the booking partner's site to confirm how close each property actually is.",
      ],
    },
    benefits: [
      {
        title: "Auto-filled destination",
        text: "Allow location access once and the search form fills your nearest city � no typing required.",
      },
      {
        title: "Tonight pre-set",
        text: "Same-day searches are the most common near-me use case, so tonight is already in the check-in field.",
      },
      {
        title: "Map view on the partner site",
        text: "Head to the booking partner's map to see exactly how close each property is to where you need to be.",
      },
    ],
    faqs: [
      {
        q: "Does Economy Stays store my location?",
        a: "No. Your location is used only to suggest the nearest city in the search form and isn't stored or shared.",
      },
      {
        q: "What if the city suggestion is wrong?",
        a: "Type the correct city or area into the destination field. The auto-fill is a starting point, not a fixed value.",
      },
      {
        q: "Can I search near a specific address rather than my current location?",
        a: "Type the city or neighbourhood you want in the search form. For address-level proximity, use the map filter on the booking partner's site.",
      },
      {
        q: "What if there are no hotels near my current location?",
        a: "Try searching the nearest town with accommodation, or expand the search area on the booking partner's map view.",
      },
    ],
  },

  // ??????????????????????????????????????????????????????????????????????
  // 6. Weekend away (was: weekend-hotel-deals)
  // ??????????????????????????????????????????????????????????????????????
  {
    slug: "weekend-away",
    title: "Weekend Away � Hotel Stays",
    description1: "Friday to Sunday is pre-set. Search a destination and browse.",
    description2: "Two nights, one search, any destination",
    datePreset: "nextWeekend",
    dateHint: "Coming Friday to Sunday is pre-filled � adjust if you need different nights.",
    intro:
      "A weekend stay is two or three nights, typically checking in on Friday and out on Sunday. Economy Stays pre-fills the coming weekend so you can jump straight to choosing a destination rather than setting dates first. Browse hotels, aparthotels and serviced apartments on booking partners, then continue to reserve when you find the right place.",
    metaTitle: "Weekend Hotel Stays � Browse Fri�Sun Accommodation | Economy Stays",
    metaDescription:
      "Browse hotel stays for a weekend break. Friday to Sunday is pre-filled � enter a destination to compare accommodation across booking partners.",
    focusKeyword: "weekend away hotel",
    heroImageAlt: "Countryside hotel at golden hour with a winding path through gardens",
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    destinationsTitle: "Popular destinations for a weekend break",
    destinationsSubtitle: "Browse hotel options in cities and regions worth the trip.",
    browseTitle: "Weekend stay pages by destination",
    browseSubtitle: "Open a city or region guide with your dates already set.",
    browseIntentSlug: "boutique-hotels",
    sections: [
      {
        heading: "Planning a two-night break",
        paragraphs: [
          "A weekend break works best when the destination is reachable in a few hours, leaving Friday evening and most of Saturday and Sunday actually in the place rather than in transit. Economy Stays doesn't weight results by travel time, but that's worth factoring in when you're comparing options.",
          "Friday to Sunday is the default because it fits most working schedules, but the form is flexible. If you prefer to check in Thursday evening and leave Sunday, or if a long weekend gives you an extra day, adjust the calendar before you search.",
        ],
      },
      {
        heading: "Types of stay that suit a weekend break",
        paragraphs: [
          "Boutique hotels and design properties often charge a premium on weekends, but they can make two nights feel like a genuine occasion rather than just a place to sleep. Aparthotels give more space if you want to cook one meal rather than eating out every sitting. Standard hotels in city centres remain the practical choice when you're there to see the city rather than linger in the accommodation.",
          "Browse on the booking partner's site with their property-type filter active to see how prices compare across different categories for the same city and weekend.",
        ],
      },
      {
        heading: "Getting more from a weekend search",
        paragraphs: [
          "Searching for a weekend break a few weeks in advance tends to surface more options at a wider range of prices than searching the same week. Popular city properties in particular often have limited availability on peak Friday nights if you leave it too late.",
          "If the destination you want looks expensive for a specific weekend, try shifting the dates by one week � prices can vary significantly across adjacent weekends depending on local events and seasonal patterns.",
        ],
      },
      {
        heading: "Weekend city pages",
        paragraphs: [
          "The city links below open accommodation pages for popular weekend destinations with your dates already attached. That's a faster route than starting from scratch if you've already decided on a city.",
          "If you're still deciding, use the destination cards or type a city in the form above. Economy Stays doesn't suggest one destination over another � that choice is yours.",
        ],
      },
    ],
    howTo: {
      name: "How to plan a weekend hotel stay",
      steps: [
        "Enter your destination in the search above. Friday to Sunday is pre-set.",
        "Adjust the check-in to Thursday if you want an extra night, or change to a different weekend entirely.",
        "Browse options on the booking partner's site and filter by property type or price.",
        "Check the total and cancellation terms before confirming your booking.",
      ],
    },
    benefits: [
      {
        title: "Weekend dates pre-filled",
        text: "Friday to Sunday is already set so you can focus on destination and property rather than the calendar.",
      },
      {
        title: "Flexible for any weekend",
        text: "Change the dates to any Friday�Sunday (or extend to Thursday or Monday) before you compare.",
      },
      {
        title: "Hotels and more",
        text: "Browse hotels, boutique stays and aparthotels from booking partners � all from the same search.",
      },
    ],
    faqs: [
      {
        q: "Which weekend is pre-filled?",
        a: "The coming Friday to Sunday. If today is Saturday, it moves to the next weekend. Adjust the dates in the form if you need a different one.",
      },
      {
        q: "Can I add a Thursday night?",
        a: "Yes. Open the date picker and change check-in to Thursday. The comparison updates for those dates.",
      },
      {
        q: "Are weekend rates always higher?",
        a: "In city centres, often yes � demand is higher on weekends. Countryside and coastal properties sometimes work the other way. Searching midweek dates alongside the weekend gives you a useful baseline for comparison.",
      },
      {
        q: "How far ahead should I book a weekend stay?",
        a: "Popular city properties can fill up for Friday nights a few weeks out. Boutique hotels in particular tend to have limited inventory. Searching three to four weeks ahead generally gives a wider choice.",
      },
      {
        q: "Does Economy Stays take a cut of the booking?",
        a: "Economy Stays may receive a commission when you book through a partner link. That doesn't change the price you pay � the rate is set by the property and the booking partner.",
      },
    ],
  },
];

export const SITELINK_SLUGS = SITELINK_PAGES.map((page) => page.slug);

export const getSitelinkPage = (slug: string): SitelinkPageConfig | undefined =>
  SITELINK_PAGES.find((page) => page.slug === slug);
