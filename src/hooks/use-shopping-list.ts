"use client";

import { useState, useEffect, useCallback } from "react";
import { aggregateInto, expandIngredient, makeKey, normalizeStoredItems } from "@/lib/shopping-list-utils";
import type { ShoppingItem, AddableItem } from "@/lib/shopping-list-utils";

const STORAGE_KEY = "meal-planner-shopping-list-v1";
const UNSEEN_KEY = "meal-planner-shopping-unseen-v1";

function load(): ShoppingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ShoppingItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: ShoppingItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

function loadUnseen(): number {
  try {
    return parseInt(localStorage.getItem(UNSEEN_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

function saveUnseen(n: number) {
  try {
    if (n === 0) localStorage.removeItem(UNSEEN_KEY);
    else localStorage.setItem(UNSEEN_KEY, String(n));
  } catch {}
}

function notifyChange() {
  window.dispatchEvent(new CustomEvent("shopping-list-change"));
}

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = load();
    const migrated = normalizeStoredItems(raw);
    // If normalization changed anything, persist the cleaned-up list immediately
    if (
      migrated.length !== raw.length ||
      migrated.some((m, i) => m.name !== raw[i]?.name || m.unit !== raw[i]?.unit)
    ) {
      save(migrated);
    }
    setItems(migrated);
    setUnseenCount(loadUnseen());
    setHydrated(true);
  }, []);

  const addItem = useCallback((item: AddableItem) => {
    const expanded = expandIngredient(item);
    const newCount = expanded.filter(
      (e) => !items.some((i) => makeKey(i.name, i.unit) === makeKey(e.name, e.unit))
    ).length;
    setItems((prev) => {
      let next = prev;
      for (const e of expanded) next = aggregateInto(next, e);
      save(next);
      return next;
    });
    if (newCount > 0) {
      const n = loadUnseen() + newCount;
      saveUnseen(n);
      setUnseenCount(n);
    }
    notifyChange();
  }, [items]);

  const addItems = useCallback((incoming: AddableItem[]) => {
    const allExpanded = incoming.flatMap(expandIngredient);
    // newCount uses the current items snapshot for badge counting (minor race acceptable)
    const newCount = allExpanded.filter(
      (e) => !items.some((i) => makeKey(i.name, i.unit) === makeKey(e.name, e.unit))
    ).length;
    setItems((prev) => {
      let next = prev;
      for (const item of allExpanded) next = aggregateInto(next, item);
      save(next);
      return next;
    });
    if (newCount > 0) {
      const n = loadUnseen() + newCount;
      saveUnseen(n);
      setUnseenCount(n);
    }
    notifyChange();
  }, [items]);

  const updateItem = useCallback(
    (
      name: string,
      unit: string | null,
      patch: { name?: string; quantity?: number | null; unit?: string | null },
    ) => {
      const key = makeKey(name, unit);
      setItems((prev) => {
        const next = prev.map((i) =>
          makeKey(i.name, i.unit) === key ? { ...i, ...patch } : i,
        );
        save(next);
        return next;
      });
      notifyChange();
    },
    [],
  );

  const removeItem = useCallback((name: string, unit: string | null) => {
    const key = makeKey(name, unit);
    setItems((prev) => {
      const next = prev.filter((i) => makeKey(i.name, i.unit) !== key);
      save(next);
      return next;
    });
    notifyChange();
  }, []);

  const toggleChecked = useCallback((name: string, unit: string | null) => {
    const key = makeKey(name, unit);
    setItems((prev) => {
      const next = prev.map((i) =>
        makeKey(i.name, i.unit) === key ? { ...i, checked: !i.checked } : i
      );
      save(next);
      return next;
    });
  }, []);

  const clearChecked = useCallback(() => {
    setItems((prev) => {
      const next = prev.filter((i) => !i.checked);
      save(next);
      return next;
    });
    notifyChange();
  }, []);

  const clearAll = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setItems([]);
    saveUnseen(0);
    setUnseenCount(0);
    notifyChange();
  }, []);

  const clearUnseen = useCallback(() => {
    saveUnseen(0);
    setUnseenCount(0);
    notifyChange();
  }, []);

  const isInList = useCallback(
    (name: string, unit: string | null) => {
      const key = makeKey(name, unit);
      return items.some((i) => makeKey(i.name, i.unit) === key);
    },
    [items]
  );

  return {
    items,
    hydrated,
    unseenCount,
    addItem,
    addItems,
    updateItem,
    removeItem,
    toggleChecked,
    clearChecked,
    clearAll,
    clearUnseen,
    isInList,
  };
}
