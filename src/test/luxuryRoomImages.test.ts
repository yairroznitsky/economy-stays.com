import {
  getLuxuryRoomImage,
  getLuxuryRoomImageIndex,
  hashLuxuryRoomKey,
  LUXURY_ROOM_IMAGE_COUNT,
  LUXURY_ROOM_IMAGES,
} from "@/lib/luxuryRoomImages";

describe("luxuryRoomImages", () => {
  it("defines six room image paths", () => {
    expect(LUXURY_ROOM_IMAGES).toHaveLength(LUXURY_ROOM_IMAGE_COUNT);
    expect(LUXURY_ROOM_IMAGES[0]).toMatch(/^\/images\/luxury-rooms\//);
  });

  it("assigns a stable image for the same hotel key", () => {
    const key = "hotel-48291";
    expect(getLuxuryRoomImageIndex(key)).toBe(getLuxuryRoomImageIndex(key));
    expect(getLuxuryRoomImage(key)).toBe(
      LUXURY_ROOM_IMAGES[getLuxuryRoomImageIndex(key)]
    );
  });

  it("keeps hash index within pool bounds", () => {
    for (const key of ["a", "paris-hilton", "12345"]) {
      const index = getLuxuryRoomImageIndex(key);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(LUXURY_ROOM_IMAGE_COUNT);
    }
  });

  it("distributes keys across the pool", () => {
    const indices = new Set(
      Array.from({ length: 30 }, (_, i) =>
        getLuxuryRoomImageIndex(`hotel-${i}-${hashLuxuryRoomKey(String(i))}`)
      )
    );
    expect(indices.size).toBeGreaterThan(3);
  });
});
