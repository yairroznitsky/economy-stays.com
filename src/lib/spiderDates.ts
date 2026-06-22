export type SpiderDateRange = { from: Date; to: Date };

type WeightedItem<T> = { value: T; weight: number };

const pickWeighted = <T>(items: WeightedItem<T>[], random: () => number): T => {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll < 0) return item.value;
  }
  return items[items.length - 1]!.value;
};

const randomInt = (min: number, max: number, random: () => number): number =>
  min + Math.floor(random() * (max - min + 1));

const startOfLocalDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const pickLeadDays = (random: () => number): number =>
  pickWeighted(
    [
      { value: randomInt(1, 14, random), weight: 0.45 },
      { value: randomInt(15, 35, random), weight: 0.35 },
      { value: randomInt(36, 60, random), weight: 0.15 },
      { value: randomInt(61, 90, random), weight: 0.05 },
    ],
    random,
  );

const pickNights = (random: () => number): number =>
  pickWeighted(
    [
      { value: 1, weight: 0.45 },
      { value: 2, weight: 0.3 },
      { value: 3, weight: 0.15 },
      { value: 4, weight: 0.06 },
      { value: randomInt(5, 7, random), weight: 0.04 },
    ],
    random,
  );

export const pickRandomSpiderDateRange = (
  now: Date = new Date(),
  random: () => number = Math.random,
): SpiderDateRange => {
  const today = startOfLocalDay(now);
  const leadDays = pickLeadDays(random);
  const nights = pickNights(random);
  const from = addDays(today, leadDays);
  const to = addDays(from, nights);
  return { from, to };
};
