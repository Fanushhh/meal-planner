"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { rerollMeal, removePlannedMealAction } from "@/server/actions/meal-plan";

interface MealCardMenuProps {
  planId: string;
  dayOfWeek: number;
  mealType: string;
  mealId: string;
}

export function MealCardMenu({ planId, dayOfWeek, mealType, mealId }: MealCardMenuProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function handleRandomize() {
    setOpen(false);
    startTransition(async () => { await rerollMeal(planId, dayOfWeek, mealType, mealId); });
  }

  function handleRemove() {
    setOpen(false);
    startTransition(async () => { await removePlannedMealAction(planId, dayOfWeek, mealType); });
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        disabled={isPending}
        title="Meal options"
        style={{
          width: 22,
          height: 22,
          border: "1px solid var(--rule)",
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-2)",
          background: "rgba(251, 245, 231, 0.92)",
          cursor: "pointer",
          transition: "border-color .15s",
          flexShrink: 0,
        }}
      >
        {isPending ? (
          <svg style={{ width: 11, height: 11, animation: "spin .6s linear infinite" }} viewBox="0 0 24 24" fill="none">
            <circle style={{ opacity: .2 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path style={{ opacity: .8 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.2" />
            <circle cx="8" cy="8" r="1.2" />
            <circle cx="8" cy="13" r="1.2" />
          </svg>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 28,
            zIndex: 30,
            minWidth: 130,
            background: "var(--paper)",
            border: "1px solid var(--ink)",
            boxShadow: "0 8px 24px -8px rgba(42,38,32,.22)",
            padding: "4px 0",
          }}
        >
          <button
            onClick={handleRandomize}
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              fontFamily: "var(--font-jetbrains, monospace)",
              fontSize: 10,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "var(--ink-2)",
              background: "none",
              border: 0,
              cursor: "pointer",
              transition: "background .1s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.04)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M3 12a9 9 0 0115-6.7L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 01-15 6.7L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Randomize
          </button>
          <button
            onClick={handleRemove}
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              fontFamily: "var(--font-jetbrains, monospace)",
              fontSize: 10,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "var(--ink-2)",
              background: "none",
              border: 0,
              cursor: "pointer",
              transition: "background .1s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.04)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M5 12h14" />
            </svg>
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
