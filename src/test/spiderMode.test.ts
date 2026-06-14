import { describe, expect, it } from "vitest";
import { isSpiderMode, SPIDER_DEADLINE_MS, SPIDER_DESTINATION_QUERY } from "@/lib/spiderMode";

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

  it("exports NYC as the spider destination", () => {
    expect(SPIDER_DESTINATION_QUERY).toBe("NYC");
    expect(SPIDER_DEADLINE_MS).toBe(2000);
  });
});
