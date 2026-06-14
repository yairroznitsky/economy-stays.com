import { describe, expect, it } from "vitest";
import {
  isSpiderMode,
  pickRandomSpiderDestination,
  SPIDER_DEADLINE_MS,
  SPIDER_TOURIST_CITIES,
} from "@/lib/spiderMode";

describe("spiderMode", () => {
  it("detects spider=1 in the query string", () => {
    window.history.replaceState({}, "", "/?spider=1");
    expect(isSpiderMode()).toBe(true);
  });

  it("ignores other query values", () => {
    window.history.replaceState({}, "", "/?spider=0");
    expect(isSpiderMode()).toBe(false);

    window.history.replaceState({}, "", "/");
    expect(isSpiderMode()).toBe(false);
  });

  it("uses a 2 second deadline", () => {
    expect(SPIDER_DEADLINE_MS).toBe(2000);
  });
});

describe("spider tourist cities", () => {
  it("lists 100 top tourist destinations", () => {
    expect(SPIDER_TOURIST_CITIES).toHaveLength(100);
    expect(new Set(SPIDER_TOURIST_CITIES).size).toBe(100);
  });

  it("picks a destination from the list", () => {
    const picked = pickRandomSpiderDestination();
    expect(SPIDER_TOURIST_CITIES).toContain(picked);
  });
});
