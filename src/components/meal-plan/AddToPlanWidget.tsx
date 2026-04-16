"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { addMealToPlanAction, addUserRecipeToPlanAction } from "@/server/actions/meal-plan";
import type { WeekSlot } from "@/server/queries/plans";

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Mic dejun",
  lunch: "Prânz",
  dinner: "Cină",
};

const ROW_BAR_COLORS: Record<string, string> = {
  breakfast: "#F5A623",
  lunch: "var(--accent)",
  dinner: "#7B95C4",
};

function getAllowedTypes(mealType: string): string[] {
  if (mealType === "lunch" || mealType === "dinner") return ["lunch", "dinner"];
  return [mealType];
}

type CellState =
  | { kind: "past" }
  | { kind: "empty" }
  | { kind: "self" }
  | { kind: "other"; name: string };

type ConflictKey = `${number}-${string}`;

interface Props {
  source: "meal" | "userRecipe";
  recipeId: string;
  mealType: string;
  weekDays: string[];
  todayIndex: number;
  weekSlots: WeekSlot[];
}

export function AddToPlanWidget({
  source,
  recipeId,
  mealType,
  weekDays,
  todayIndex,
  weekSlots,
}: Props) {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [localSlots, setLocalSlots] = useState<WeekSlot[]>(weekSlots);
  const [pendingKey, setPendingKey] = useState<ConflictKey | null>(null);
  const [confirmKey, setConfirmKey] = useState<ConflictKey | null>(null);
  const [isPending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const allowedTypes = getAllowedTypes(mealType);

  function handleOpen() {
    if (buttonRef.current) {
      setAnchorRect(buttonRef.current.getBoundingClientRect());
    }
    setOpen(true);
  }

  function slotKey(day: number, type: string): ConflictKey {
    return `${day}-${type}`;
  }

  function cellState(day: number, type: string): CellState {
    if (day < todayIndex) return { kind: "past" };
    const existing = localSlots.find(
      (s) => s.dayOfWeek === day && s.mealType === type
    );
    if (!existing) return { kind: "empty" };
    const isThis =
      source === "meal"
        ? existing.mealId === recipeId
        : existing.userRecipeId === recipeId;
    if (isThis) return { kind: "self" };
    return { kind: "other", name: existing.mealName };
  }

  function doAdd(day: number, type: string) {
    const key = slotKey(day, type);
    setPendingKey(key);
    startTransition(async () => {
      const result =
        source === "meal"
          ? await addMealToPlanAction(recipeId, day, type)
          : await addUserRecipeToPlanAction(recipeId, day, type);

      if ("success" in result) {
        setLocalSlots((prev) => {
          const filtered = prev.filter(
            (s) => !(s.dayOfWeek === day && s.mealType === type)
          );
          return [
            ...filtered,
            {
              dayOfWeek: day,
              mealType: type,
              mealName: "",
              mealId: source === "meal" ? recipeId : null,
              userRecipeId: source === "userRecipe" ? recipeId : null,
            },
          ];
        });
        setConfirmKey(null);
      }
      setPendingKey(null);
    });
  }

  function handleCellClick(day: number, type: string) {
    const state = cellState(day, type);
    if (state.kind === "past" || state.kind === "self") return;
    if (state.kind === "empty") {
      doAdd(day, type);
      return;
    }
    const key = slotKey(day, type);
    setConfirmKey((prev) => (prev === key ? null : key));
  }

  const panel = open && (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 49, background: "rgba(0,0,0,0.6)" }}
        onClick={() => setOpen(false)}
      />

      {/* Centered modal panel */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-5"
        style={{
          width: Math.min(860, window.innerWidth - 32),
          maxHeight: "calc(100vh - 64px)",
          overflowY: "auto",
          zIndex: 50,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05) inset",
        }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--text-faint)" }}
          >
            Add to week
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 transition-colors hover:bg-white/5"
            style={{ color: "var(--text-faint)" }}
            aria-label="Close"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1 1l9 9M10 1 1 10" />
            </svg>
          </button>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse" style={{ minWidth: 660 }}>
            <thead>
              <tr>
                {/* Fixed label column */}
                <th className="w-[80px]" />
                {weekDays.map((label, i) => {
                  const isToday = i === todayIndex;
                  const isPast = i < todayIndex;
                  return (
                    <th
                      key={i}
                      className={`pb-3 text-center text-xs font-semibold ${isPast ? "w-[32px]" : "w-[82px]"}`}
                      style={{
                        color: isToday ? "var(--accent)" : "var(--text-muted)",
                        opacity: isPast ? 0.35 : 1,
                      }}
                    >
                      {isPast ? null : label}
                      {isToday && (
                        <span
                          className="mx-auto mt-1 block h-1 w-1 rounded-full"
                          style={{ background: "var(--accent)" }}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {allowedTypes.map((type) => (
                <tr key={type}>
                  <td className="py-1.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3.5 w-0.5 rounded-full"
                        style={{ background: ROW_BAR_COLORS[type] ?? "var(--border)" }}
                      />
                      <span
                        className="text-xs font-medium"
                        style={{ color: "var(--text-faint)" }}
                      >
                        {MEAL_TYPE_LABELS[type]}
                      </span>
                    </div>
                  </td>
                  {weekDays.map((_, dayIndex) => {
                    const state = cellState(dayIndex, type);
                    const key = slotKey(dayIndex, type);
                    const isConfirming = confirmKey === key;
                    const isThisPending = pendingKey === key;
                    return (
                      <td key={dayIndex} className={`h-[72px] align-top ${cellState(dayIndex, type).kind === "past" ? "px-0.5 py-1" : "px-1 py-1.5"}`}>
                        <Cell
                          state={state}
                          isConfirming={isConfirming}
                          isPending={isThisPending}
                          onCellClick={() => handleCellClick(dayIndex, type)}
                          onConfirm={() => doAdd(dayIndex, type)}
                          onCancelConfirm={() => setConfirmKey(null)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
        style={{ background: "var(--accent)", color: "#0D0E11" }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M6 1v10M1 6h10" />
        </svg>
        Add to plan
      </button>

      {mounted && panel && createPortal(panel, document.body)}
    </>
  );
}

// ─── Cell sub-component ───────────────────────────────────────────────────────

interface CellProps {
  state: CellState;
  isConfirming: boolean;
  isPending: boolean;
  onCellClick: () => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
}

function Cell({
  state,
  isConfirming,
  isPending,
  onCellClick,
  onConfirm,
  onCancelConfirm,
}: CellProps) {
  const CELL_H = "h-full w-full";

  if (state.kind === "past") {
    return (
      <div
        className={`${CELL_H} w-full rounded-lg`}
        style={{
          background: "repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 6px)",
          border: "1px solid var(--border-subtle)",
          opacity: 0.3,
          cursor: "default",
        }}
      />
    );
  }

  if (state.kind === "self") {
    return (
      <div
        className={`${CELL_H} flex w-full flex-col items-center justify-center gap-1 rounded-lg`}
        style={{
          background: "rgba(45,212,191,0.1)",
          border: "1px solid rgba(45,212,191,0.35)",
          color: "#2DD4BF",
          cursor: "default",
        }}
      >
        <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 6L5 10L13 2" />
        </svg>
        <span className="text-[10px] font-medium opacity-70">Added</span>
      </div>
    );
  }

  if (isConfirming && state.kind === "other") {
    return (
      <div
        className={`${CELL_H} flex w-full overflow-hidden rounded-lg`}
        style={{ border: "1px solid rgba(212,120,67,0.35)" }}
      >
        {/* Confirm half */}
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="flex flex-1 flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50 hover:brightness-110"
          style={{ background: "rgba(45,212,191,0.13)", color: "#2DD4BF" }}
          aria-label="Confirm replace"
        >
          {isPending ? <Spinner /> : (
            <>
              <svg width="13" height="11" viewBox="0 0 13 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 5.5L4.5 9L12 1.5" />
              </svg>
              <span className="text-[10px] font-semibold">Yes</span>
            </>
          )}
        </button>

        {/* 1px divider */}
        <div className="w-px" style={{ background: "rgba(212,120,67,0.25)" }} />

        {/* Cancel half */}
        <button
          type="button"
          onClick={onCancelConfirm}
          disabled={isPending}
          className="flex flex-1 flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50 hover:brightness-110"
          style={{ background: "rgba(212,120,67,0.07)", color: "var(--text-faint)" }}
          aria-label="Cancel"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M1 1l9 9M10 1 1 10" />
          </svg>
          <span className="text-[10px] font-semibold">No</span>
        </button>
      </div>
    );
  }

  if (state.kind === "other") {
    return (
      <button
        type="button"
        onClick={onCellClick}
        className={`${CELL_H} group flex w-full cursor-pointer flex-col items-start justify-center rounded-lg p-2 text-left transition-all`}
        style={{
          background: "rgba(212,120,67,0.05)",
          border: "1px solid rgba(212,120,67,0.18)",
          color: "var(--text-muted)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,120,67,0.1)"; e.currentTarget.style.borderColor = "rgba(212,120,67,0.3)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(212,120,67,0.05)"; e.currentTarget.style.borderColor = "rgba(212,120,67,0.18)"; }}
      >
        <span className="line-clamp-3 text-[11px] leading-snug">{state.name}</span>
      </button>
    );
  }

  // empty
  return (
    <button
      type="button"
      onClick={onCellClick}
      disabled={isPending}
      className={`${CELL_H} group flex w-full cursor-pointer items-center justify-center rounded-lg transition-all disabled:opacity-40`}
      style={{
        background: "transparent",
        border: "1px solid var(--border-subtle)",
        color: "var(--text-faint)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface-raised)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.background = "transparent"; }}
    >
      {isPending ? <Spinner /> : (
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="opacity-0 transition-opacity group-hover:opacity-50"
        >
          <path d="M6 1v10M1 6h10" />
        </svg>
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="animate-spin opacity-60"
      style={{ color: "var(--accent)" }}
    >
      <path d="M5 1a4 4 0 1 1-4 4" />
    </svg>
  );
}
