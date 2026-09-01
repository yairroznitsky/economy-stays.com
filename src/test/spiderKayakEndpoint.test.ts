import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleKayakAutocomplete } from "../../server/edge/kayakAutocomplete";
import {
  pickSpiderSuggestion,
  runSpiderKayakRedirect,
} from "../../server/spider/runSpiderKayakRedirect";
import {
  isValidSpiderToken,
  tokensMatch,
} from "../../server/spider/spiderToken";

vi.mock("../../server/edge/kayakAutocomplete", () => ({
  handleKayakAutocomplete: vi.fn(),
}));

const mockedAutocomplete = vi.mocked(handleKayakAutocomplete);

const parisSuggestion = {
  id: "5085",
  label: "Paris, France",
  type: "city",
  raw: {
    city_id: "5085",
    city: "Paris",
    country: "France",
  },
};

describe("spider token", () => {
  const originalToken = process.env.SPIDER_TOKEN;

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.SPIDER_TOKEN;
    } else {
      process.env.SPIDER_TOKEN = originalToken;
    }
  });

  it("matches only when the token equals SPIDER_TOKEN", () => {
    process.env.SPIDER_TOKEN = "abc123secret-token-value";
    expect(tokensMatch("abc123secret-token-value", "abc123secret-token-value")).toBe(true);
    expect(tokensMatch("wrong-token-value-here", "abc123secret-token-value")).toBe(false);
    expect(isValidSpiderToken("abc123secret-token-value")).toBe(true);
    expect(isValidSpiderToken("wrong-token-value-here")).toBe(false);
  });

  it("rejects all tokens when SPIDER_TOKEN is unset", () => {
    delete process.env.SPIDER_TOKEN;
    expect(isValidSpiderToken("anything")).toBe(false);
  });
});

describe("pickSpiderSuggestion", () => {
  it("prefers a city suggestion with city_id", () => {
    const picked = pickSpiderSuggestion([
      { id: "h1", label: "Hotel Example", type: "hotel", raw: { hotel_id: "99" } },
      parisSuggestion,
    ]);
    expect(picked?.label).toBe("Paris, France");
  });

  it("falls back to the first suggestion with a usable id", () => {
    const picked = pickSpiderSuggestion([
      {
        id: "air1",
        label: "Charles de Gaulle (CDG)",
        type: "ap",
        raw: { id: "777", airport_code: "CDG" },
      },
    ]);
    expect(picked?.id).toBe("air1");
  });
});

describe("runSpiderKayakRedirect", () => {
  beforeEach(() => {
    mockedAutocomplete.mockReset();
  });

  it("builds a Kayak affiliate deeplink from autocomplete", async () => {
    mockedAutocomplete.mockResolvedValue({
      status: 200,
      body: {
        success: true,
        query: "Paris, France",
        suggestions: [parisSuggestion],
      },
    });

    const result = await runSpiderKayakRedirect({
      destinationQuery: "Paris, France",
      now: new Date(2026, 5, 1),
      random: () => 0,
      clickId: "test-click-abc",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const parsed = new URL(result.redirectUrl);
    expect(parsed.origin + parsed.pathname).toBe("https://www.kayak.com/in");
    expect(parsed.searchParams.get("a")).toBe("kan_317716_594040");
    expect(parsed.searchParams.get("enc_cid")).toBe("test-click-abc");
    expect(parsed.searchParams.get("enc_lid")).toBe("hotels");
    expect(parsed.searchParams.get("enc_pid")).toBe("deeplinks");
    expect(parsed.searchParams.get("encoder")).toBe("27_1");
    expect(parsed.searchParams.get("utm_medium")).toBe("affiliate");

    const kayakPath = parsed.searchParams.get("url");
    expect(kayakPath).toContain("-c5085");
    expect(kayakPath).toContain("/2026-06-02/2026-06-03/");
    expect(kayakPath).toContain("2adults");
    expect(kayakPath).toContain("1rooms");
  });

  it("returns an error when autocomplete has no usable suggestions", async () => {
    mockedAutocomplete.mockResolvedValue({
      status: 200,
      body: {
        success: true,
        query: "Paris, France",
        suggestions: [],
      },
    });

    const result = await runSpiderKayakRedirect({
      destinationQuery: "Paris, France",
      now: new Date(2026, 5, 1),
      random: () => 0,
    });

    expect(result).toEqual({
      ok: false,
      error: "No usable Kayak destination suggestion",
    });
  });

  it("returns an error when autocomplete is unavailable", async () => {
    mockedAutocomplete.mockResolvedValue({
      status: 200,
      body: {
        success: false,
        query: "Paris, France",
        suggestions: [],
        error: "Autocomplete unavailable",
      },
    });

    const result = await runSpiderKayakRedirect({
      destinationQuery: "Paris, France",
    });

    expect(result).toEqual({
      ok: false,
      error: "Kayak autocomplete unavailable",
    });
  });
});
