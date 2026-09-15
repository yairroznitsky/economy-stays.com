import { useState, useCallback } from "react";

export interface ShortlistItem {
  id: string;
  name: string;
  type?: string;
  starRating?: number;
  rating?: number;
  cityName: string;
}

const STORAGE_KEY = "es_shortlist";

const load = (): ShortlistItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ShortlistItem[]) : [];
  } catch {
    return [];
  }
};

const save = (items: ShortlistItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable — fail silently */
  }
};

export const useShortlist = () => {
  const [items, setItems] = useState<ShortlistItem[]>(load);

  const mutate = useCallback((next: ShortlistItem[]) => {
    save(next);
    setItems(next);
  }, []);

  const add = useCallback(
    (item: ShortlistItem) => {
      mutate([...items.filter((i) => i.id !== item.id), item]);
    },
    [items, mutate]
  );

  const remove = useCallback(
    (id: string) => {
      mutate(items.filter((i) => i.id !== id));
    },
    [items, mutate]
  );

  const toggle = useCallback(
    (item: ShortlistItem) => {
      if (items.some((i) => i.id === item.id)) {
        remove(item.id);
      } else {
        add(item);
      }
    },
    [items, add, remove]
  );

  const clear = useCallback(() => mutate([]), [mutate]);

  const has = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  );

  return { items, add, remove, toggle, clear, has };
};
