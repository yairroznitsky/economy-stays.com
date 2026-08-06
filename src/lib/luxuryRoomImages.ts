/**
 * Pool of generic luxury hotel room photos for related-hotel cards.
 * Stable assignment via hash — same hotel always gets the same image.
 */

export const LUXURY_ROOM_IMAGE_COUNT = 6;

export const LUXURY_ROOM_IMAGES = [
  "/images/luxury-rooms/luxury-room-01.webp",
  "/images/luxury-rooms/luxury-room-02.webp",
  "/images/luxury-rooms/luxury-room-03.webp",
  "/images/luxury-rooms/luxury-room-04.webp",
  "/images/luxury-rooms/luxury-room-05.webp",
  "/images/luxury-rooms/luxury-room-06.webp",
] as const;

/** FNV-1a — stable, fast string hash for image index. */
export const hashLuxuryRoomKey = (key: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const getLuxuryRoomImageIndex = (key: string): number =>
  hashLuxuryRoomKey(key) % LUXURY_ROOM_IMAGE_COUNT;

export const getLuxuryRoomImage = (key: string): string =>
  LUXURY_ROOM_IMAGES[getLuxuryRoomImageIndex(key)];

export const getLuxuryRoomImageAlt = (hotelName: string): string =>
  `${hotelName} — luxury hotel room`;
