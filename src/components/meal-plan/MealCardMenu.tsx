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
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        disabled={isPending}
        title="Meal options"
        className="flex h-6 w-6 items-center justify-center rounded-full transition-all opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
        style={{
          color: "var(--text)",
          background: open ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)";
        }}
        onMouseLeave={(e) => {
          if (!open) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
        }}
      >
        {isPending ? (
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.2" />
            <circle cx="8" cy="8" r="1.2" />
            <circle cx="8" cy="13" r="1.2" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-7 z-30 w-32 overflow-hidden rounded-xl py-1 shadow-xl"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
        >
          <button
            onClick={handleRandomize}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/5"
            style={{ color: "var(--text-muted)" }}
          >
            <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
            Randomize
          </button>
          <button
            onClick={handleRemove}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/5"
            style={{ color: "var(--text-muted)" }}
          >
            <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
