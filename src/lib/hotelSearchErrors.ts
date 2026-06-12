export const DESTINATION_PICK_LIST_TOAST = {
  title: "Pick a destination from the list",
  description: "Start typing, then choose a city or hotel from the suggestions.",
} as const;

const PICK_FROM_LIST_PATTERNS = [
  "non-2xx",
  "destination_id",
  "select a destination",
  "autocomplete before searching",
  "invalid redirect response",
  "missing entity_id",
  "could not resolve destination",
  "select a city or hotel",
];

const SEARCH_VALIDATION_PATTERNS = [
  "checkout must be after checkin",
  "children_ages",
  "check-out must be after check-in",
  "number of adults",
  "maximum 4 guests",
  "invalid checkin",
  "invalid checkout",
];

export const isDestinationPickRequiredMessage = (message: string): boolean => {
  const lower = message.toLowerCase();
  return PICK_FROM_LIST_PATTERNS.some((pattern) => lower.includes(pattern));
};

export const isSearchValidationMessage = (message: string): boolean => {
  const lower = message.toLowerCase();
  return SEARCH_VALIDATION_PATTERNS.some((pattern) => lower.includes(pattern));
};

export const parseEdgeFunctionInvokeError = async (
  error: unknown
): Promise<string> => {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === "function") {
      try {
        const body = (await context.json()) as { error?: string };
        if (typeof body?.error === "string" && body.error.trim()) {
          return body.error.trim();
        }
      } catch {
        // Fall through to generic message below.
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "Unable to open hotel results.";
};
