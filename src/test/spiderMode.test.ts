import { describe, expect, it } from "vitest";
import {
  isSpiderMode,
  pickRandomSpiderDateRange,
  pickRandomSpiderDestination,
  SPIDER_DEADLINE_MS,
  SPIDER_TOURIST_CITIES,
} from "@/lib/spiderMode";

const createSequentialRandom = (values: number[]) => {
  let index = 0;
  return () => values[index++] ?? values[values.length - 1]!;
};

const daysBetween = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

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

describe("spider dates", () => {
  const now = new Date(2026, 5, 1);

  it("returns check-out after check-in using local calendar dates", () => {
    const { from, to } = pickRandomSpiderDateRange(
      now,
      createSequentialRandom([0, 0, 0]),
    );

    expect(from).toEqual(new Date(2026, 5, 2));
    expect(to).toEqual(new Date(2026, 5, 3));
    expect(to.getTime()).toBeGreaterThan(from.getTime());
  });

  it("keeps check-in within 1-90 days and stay within 1-7 nights", () => {
    const { from, to } = pickRandomSpiderDateRange(
      now,
      createSequentialRandom([0.99, 0.99, 0.99]),
    );

    const leadDays = daysBetween(now, from);
    const nights = daysBetween(from, to);

    expect(leadDays).toBeGreaterThanOrEqual(1);
    expect(leadDays).toBeLessThanOrEqual(90);
    expect(nights).toBeGreaterThanOrEqual(1);
    expect(nights).toBeLessThanOrEqual(7);
    expect(from).toEqual(new Date(2026, 7, 30));
    expect(to).toEqual(new Date(2026, 8, 6));
  });

  it("never picks check-in before tomorrow", () => {
    for (let i = 0; i < 50; i += 1) {
      const { from } = pickRandomSpiderDateRange(now, Math.random);
      expect(from.getTime()).toBeGreaterThanOrEqual(new Date(2026, 5, 2).getTime());
    }
  });
});
