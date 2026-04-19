"use client";

import { useTransition, useState } from "react";
import { regeneratePlan, getPlanIngredients } from "@/server/actions/meal-plan";
import { useShoppingList } from "@/hooks/use-shopping-list";

export function DashboardActions({ weekStart }: { weekStart: string }) {
  const [isRegenerating, startRegenerate] = useTransition();
  const [isAddingToList, startAddToList] = useTransition();
  const [listAdded, setListAdded] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const { addItems } = useShoppingList();

  function handleRegenerate() {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 650);
    startRegenerate(async () => {
      await regeneratePlan(weekStart);
    });
  }

  function handleAddToList() {
    startAddToList(async () => {
      const { items } = await getPlanIngredients(weekStart);
      if (items.length > 0) {
        addItems(items);
        setListAdded(true);
        setTimeout(() => setListAdded(false), 2500);
      }
    });
  }

  const btnBase: React.CSSProperties = {
    border: "1px solid var(--ink)",
    padding: "9px 16px",
    fontFamily: "var(--font-jetbrains, monospace)",
    fontSize: 11,
    letterSpacing: ".16em",
    textTransform: "uppercase",
    background: "transparent",
    color: "var(--ink)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    transition: "all .15s",
    opacity: isAddingToList || isRegenerating ? 0.5 : 1,
  };

  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    background: listAdded ? "rgba(79, 92, 42, 0.12)" : "var(--accent)",
    borderColor: listAdded ? "#4f5c2a" : "var(--accent)",
    color: listAdded ? "#4f5c2a" : "#fff4e2",
  };

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {/* Reroll the week */}
      <button
        onClick={handleRegenerate}
        disabled={isRegenerating || isAddingToList}
        style={btnBase}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--ink)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--paper)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)";
        }}
      >
        <span
          style={{ display: "inline-block" }}
          className={spinning ? "spin-once" : ""}
        >
          ⟳
        </span>
        {isRegenerating ? "Rerolling…" : (
          <><span className="dash-btn-long">Reroll the week</span><span className="dash-btn-short">Reroll</span></>
        )}
      </button>

      {/* Add all to market list */}
      <button
        onClick={handleAddToList}
        disabled={isAddingToList || isRegenerating}
        style={btnPrimary}
        onMouseEnter={(e) => {
          if (!listAdded) {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-ink)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-ink)";
          }
        }}
        onMouseLeave={(e) => {
          if (!listAdded) {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
          }
        }}
      >
        {isAddingToList ? (
          <>
            <svg style={{ width: 12, height: 12, animation: "spin .6s linear infinite" }} viewBox="0 0 24 24" fill="none">
              <circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Adding…
          </>
        ) : listAdded ? (
          <>✦ Added</>
        ) : (
          <><span className="dash-btn-long">+ Add all to market list</span><span className="dash-btn-short">+ Add to list</span></>
        )}
      </button>
    </div>
  );
}
