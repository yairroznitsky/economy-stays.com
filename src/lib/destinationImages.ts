import parisImg from "@/assets/destinations/paris.jpg";
import londonImg from "@/assets/destinations/london.jpg";
import tokyoImg from "@/assets/destinations/tokyo.jpg";
import romeImg from "@/assets/destinations/rome.jpg";
import barcelonaImg from "@/assets/destinations/barcelona.jpg";
import dubaiImg from "@/assets/destinations/dubai.jpg";
import sydneyImg from "@/assets/destinations/sydney.jpg";
import bangkokImg from "@/assets/destinations/bangkok.jpg";
import heroImage from "@/assets/hero-hotel.jpg";

const destinationImages: Record<string, string> = {
  paris: parisImg,
  london: londonImg,
  tokyo: tokyoImg,
  rome: romeImg,
  barcelona: barcelonaImg,
  dubai: dubaiImg,
  sydney: sydneyImg,
  bangkok: bangkokImg,
};

export const getDestinationHeroImage = (citySlug: string): string =>
  destinationImages[citySlug.toLowerCase()] ?? heroImage;
