"use client";

import { useTransition, useState } from "react";
import { regeneratePlan, getPlanIngredients } from "@/server/actions/meal-plan";
import { useShoppingList } from "@/hooks/use-shopping-list";

export function DashboardActions() {
  const [isRegenerating, startRegenerate] = useTransition();
  const [isAddingToList, startAddToList] = useTransition();
  const [listAdded, setListAdded] = useState(false);
  const { addItems } = useShoppingList();

  function handleRegenerate() {
    startRegenerate(async () => {
      await regeneratePlan();
    });
  }

  function handleAddToList() {
    startAddToList(async () => {
      const { items } = await getPlanIngredients();
      if (items.length > 0) {
        addItems(items);
        setListAdded(true);
        setTimeout(() => setListAdded(false), 2500);
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Add week to shopping list */}
        <button
          onClick={handleAddToList}
          disabled={isAddingToList || isRegenerating}
          className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          style={
            listAdded
              ? {
                  background: "rgba(45,212,191,0.1)",
                  border: "1px solid rgba(45,212,191,0.35)",
                  color: "#2DD4BF",
                }
              : {
                  background: "var(--accent-light)",
                  border: "1px solid rgba(212,120,67,0.28)",
                  color: "var(--accent)",
                }
          }
        >
          {isAddingToList ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Adding…
            </>
          ) : listAdded ? (
            <>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Added to list
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              Add week to list
            </>
          )}
        </button>

        {/* Regenerate week */}
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating || isAddingToList}
          className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all hover:bg-white/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            border: "1px solid var(--border-bright)",
            color: "var(--text-muted)",
          }}
        >
          {isRegenerating ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Regenerating…
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
              Regenerate week
            </>
          )}
        </button>
      </div>

    </>
  );
}
