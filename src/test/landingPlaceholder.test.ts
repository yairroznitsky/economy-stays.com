import { describe, expect, it } from "vitest";
import { buildPlaceholderConfig } from "@/lib/landingPlaceholder";

describe("buildPlaceholderConfig", () => {
  it("builds a city page shell from the city slug", () => {
    const config = buildPlaceholderConfig("/hotels/paris", "paris");
    expect(config.content.h1).toBe("Hotels in Paris");
    expect(config.searchDefaults.destinationQuery).toBe("Paris");
  });

  it("builds an intent page shell", () => {
    const config = buildPlaceholderConfig(
      "/hotels/paris/cheap-hotels",
      "paris",
      "cheap-hotels"
    );
    expect(config.content.h1).toBe("Cheap Hotels in Paris");
    expect(config.intent?.slug).toBe("cheap-hotels");
  });

  it("builds a hotel page shell from the hotel slug", () => {
    const config = buildPlaceholderConfig(
      "/hotels/praiano/la-barbera",
      "praiano",
      "la-barbera"
    );
    expect(config.content.h1).toBe("La Barbera");
    expect(config.hotel?.name).toBe("La Barbera");
    expect(config.searchDefaults.destinationQuery).toBe("La Barbera");
  });
});
