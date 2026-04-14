"use client";

import { useState, useTransition } from "react";
import { addUserRecipeToPlanAction } from "@/server/actions/meal-plan";

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Mic dejun",
  lunch: "Prânz",
  dinner: "Cină",
};

interface AddToPlanButtonProps {
  recipeId: string;
  weekDays: string[]; // 7 items, e.g. ["Mon 17", "Tue 18", ...]
  scheduledDays: number[]; // day indices already in the plan for this recipe
  mealType: string;
}

export function AddToPlanButton({ recipeId, weekDays, scheduledDays, mealType }: AddToPlanButtonProps) {
  const [open, setOpen] = useState(false);
  const [addedDay, setAddedDay] = useState<number | null>(null);
  const [confirmedDays, setConfirmedDays] = useState<Set<number>>(new Set(scheduledDays));
  const [isPending, startTransition] = useTransition();

  function handleDayClick(dayIndex: number) {
    startTransition(async () => {
      const result = await addUserRecipeToPlanAction(recipeId, dayIndex, mealType);
      if ("success" in result) {
        setAddedDay(dayIndex);
        setTimeout(() => {
          setAddedDay(null);
          setConfirmedDays((prev) => new Set([...prev, dayIndex]));
        }, 1000);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
        style={{ background: "var(--accent)", color: "#0D0E11" }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 1v10M1 6h10" />
        </svg>
        Add to plan
      </button>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-2xl p-3"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: "var(--text-faint)" }}
      >
        Select day
      </span>
      {mealType && MEAL_TYPE_LABELS[mealType] && (
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          {MEAL_TYPE_LABELS[mealType]}
        </span>
      )}
      {weekDays.map((label, i) => {
        const isConfirmed = confirmedDays.has(i);
        const isJustAdded = addedDay === i;

        return (
          <button
            key={i}
            type="button"
            onClick={() => !isConfirmed && handleDayClick(i)}
            disabled={isPending || isConfirmed}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed"
            style={
              isJustAdded
                ? {
                    background: "rgba(45, 212, 191, 0.12)",
                    border: "1px solid rgba(45, 212, 191, 0.4)",
                    color: "#2DD4BF",
                  }
                : isConfirmed
                ? {
                    background: "rgba(45, 212, 191, 0.06)",
                    border: "1px solid rgba(45, 212, 191, 0.25)",
                    color: "rgba(45, 212, 191, 0.5)",
                  }
                : {
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                  }
            }
          >
            {isJustAdded ? (
              <span className="flex items-center gap-1">
                <svg width="8" height="7" viewBox="0 0 8 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 3.5L3 5.5L7 1" />
                </svg>
                Added
              </span>
            ) : isConfirmed ? (
              <span className="flex items-center gap-1">
                <svg width="8" height="7" viewBox="0 0 8 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 3.5L3 5.5L7 1" />
                </svg>
                {label}
              </span>
            ) : (
              label
            )}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="ml-auto rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-white/5"
        style={{ color: "var(--text-faint)" }}
      >
        ✕
      </button>
    </div>
  );
}
