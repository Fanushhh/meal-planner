"use client";

import { useShoppingList } from "@/hooks/use-shopping-list";
import { formatItem } from "@/lib/shopping-list-utils";
import type { AddableItem } from "@/lib/shopping-list-utils";

interface IngredientsPanelProps {
  ingredients: AddableItem[];
}

export function IngredientsPanel({ ingredients }: IngredientsPanelProps) {
  const { addItem, addItems, isInList, hydrated } = useShoppingList();

  const allInList = hydrated && ingredients.every((i) => isInList(i.name, i.unit));

  function handleAddAll() {
    if (allInList) return;
    addItems(ingredients);
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
          disabled={allInList}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all disabled:cursor-default"
          style={
            allInList
              ? {
                  background: "rgba(212, 120, 67, 0.1)",
                  border: "1px solid rgba(212, 120, 67, 0.3)",
                  color: "var(--accent)",
                }
              : {
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border-bright)",
                  color: "var(--text-muted)",
                }
          }
        >
          {allInList ? (
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
          const inList = hydrated && isInList(item.name, item.unit);

          return (
            <li key={i} className="group flex items-start gap-3 px-2 -mx-2">
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
                onClick={() => addItem(item)}
                disabled={inList}
                title={inList ? "Already in list" : "Add to shopping list"}
                className="shrink-0 flex items-center justify-center rounded-md transition-all disabled:cursor-default"
                style={{
                  width: "1.625rem",
                  height: "1.625rem",
                  background: inList ? "rgba(212, 120, 67, 0.1)" : "transparent",
                  border: inList
                    ? "1px solid rgba(212, 120, 67, 0.3)"
                    : "1px solid transparent",
                  color: inList ? "var(--accent)" : "var(--text-faint)",
                  opacity: !hydrated ? 0 : 1,
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
