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
      {/* "Add all" button */}
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={handleAddAll}
          disabled={allInList}
          style={{
            border: "1px solid " + (allInList ? "var(--leaf)" : "var(--ink)"),
            padding: "8px 14px",
            fontFamily: "var(--font-jetbrains, monospace)",
            fontSize: 10,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            background: allInList ? "rgba(79,92,42,0.1)" : "transparent",
            color: allInList ? "#4f5c2a" : "var(--ink)",
            cursor: allInList ? "default" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            transition: "all .15s",
          }}
        >
          {allInList ? (
            <>
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              All added to list
            </>
          ) : (
            <>
              + Add all to list
            </>
          )}
        </button>
      </div>

      {/* Ingredient rows */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {ingredients.map((item, i) => {
          const inList = hydrated && isInList(item.name, item.unit);

          return (
            <li
              key={i}
              className="ingredient-flash"
              style={{
                display: "flex",
                gap: 14,
                padding: "10px 0",
                borderBottom: i === ingredients.length - 1 ? "none" : "1px dashed var(--rule-2)",
                alignItems: "baseline",
              }}
            >
              {/* Index number */}
              <span style={{
                fontFamily: "var(--font-jetbrains, monospace)",
                fontSize: 10,
                color: "var(--ink-3)",
                letterSpacing: ".12em",
                minWidth: 22,
                flexShrink: 0,
              }}>
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Text */}
              <span style={{
                flex: 1,
                fontSize: 16,
                color: "var(--ink)",
                lineHeight: 1.4,
              }}>
                {formatItem(item)}
              </span>

              {/* Add button */}
              <button
                type="button"
                onClick={() => addItem(item)}
                disabled={inList}
                title={inList ? "Already in list" : "Add to market list"}
                style={{
                  width: 22,
                  height: 22,
                  border: "1px solid " + (inList ? "var(--accent)" : "var(--rule)"),
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: inList ? "var(--accent)" : "var(--ink-2)",
                  background: inList ? "rgba(166,58,31,0.1)" : "var(--paper-3)",
                  cursor: inList ? "default" : "pointer",
                  transition: "all .15s",
                  flexShrink: 0,
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
