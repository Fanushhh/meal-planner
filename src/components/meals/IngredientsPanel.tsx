"use client";

import { useState } from "react";
import { useShoppingList } from "@/hooks/use-shopping-list";
import { makeKey, formatItem } from "@/lib/shopping-list-utils";
import type { AddableItem } from "@/lib/shopping-list-utils";

interface IngredientsPanelProps {
  ingredients: AddableItem[];
}

export function IngredientsPanel({ ingredients }: IngredientsPanelProps) {
  const { addItem, addItems, isInList, hydrated } = useShoppingList();
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());
  const [allAdded, setAllAdded] = useState(false);

  function flashKey(key: string) {
    setJustAdded((prev) => new Set([...prev, key]));
    setTimeout(
      () =>
        setJustAdded((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        }),
      1500
    );
  }

  function handleAdd(item: AddableItem) {
    addItem(item);
    flashKey(makeKey(item.name, item.unit));
  }

  function handleAddAll() {
    addItems(ingredients);
    setAllAdded(true);
    setTimeout(() => setAllAdded(false), 2000);
  }

  return (
    <div>
      {/* Section header */}
      <div className="mb-5 flex items-center justify-between">
        <h2
          className="text-xs font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--text-faint)" }}
        >
          Ingredients
        </h2>

        <button
          type="button"
          onClick={handleAddAll}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all"
          style={
            allAdded
              ? {
                  background: "rgba(45, 212, 191, 0.08)",
                  border: "1px solid rgba(45, 212, 191, 0.3)",
                  color: "#2DD4BF",
                }
              : {
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border-bright)",
                  color: "var(--text-muted)",
                }
          }
        >
          {allAdded ? (
            <>
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Added all
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Add all to list
            </>
          )}
        </button>
      </div>

      {/* Ingredient rows */}
      <ul className="space-y-1.5">
        {ingredients.map((item, i) => {
          const key = makeKey(item.name, item.unit);
          const inList = hydrated && isInList(item.name, item.unit);
          const flash = justAdded.has(key);
          const active = inList || flash;

          return (
            <li key={i} className={`group flex items-start gap-3 px-2 -mx-2${flash ? " ingredient-flash" : ""}`}>
              {/* Dot */}
              <span
                className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: "var(--accent)", opacity: 0.7 }}
              />

              {/* Text */}
              <span
                className="flex-1 text-sm leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {formatItem(item)}
              </span>

              {/* Add button */}
              <button
                type="button"
                onClick={() => handleAdd(item)}
                title={inList ? "Add more to list" : "Add to shopping list"}
                className="shrink-0 flex items-center justify-center rounded-md transition-all"
                style={{
                  width: "1.625rem",
                  height: "1.625rem",
                  background: active ? "rgba(212, 120, 67, 0.1)" : "transparent",
                  border: active
                    ? "1px solid rgba(212, 120, 67, 0.3)"
                    : "1px solid transparent",
                  color: active ? "var(--accent)" : "var(--text-faint)",
                  opacity: !hydrated ? 0 : 1,
                  cursor: "pointer",
                }}
              >
                {inList ? (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
