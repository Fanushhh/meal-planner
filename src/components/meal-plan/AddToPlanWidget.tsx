"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  addMealToPlanAction,
  addUserRecipeToPlanAction,
  getWeekSlotsAction,
} from "@/server/actions/meal-plan";
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

const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getAllowedTypes(mealType: string): string[] {
  if (mealType === "lunch" || mealType === "dinner") return ["lunch", "dinner"];
  return [mealType];
}

function getNextWeekStart(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}

function buildWeekDays(weekStart: string): string[] {
  const d = new Date(weekStart + "T00:00:00Z");
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setUTCDate(day.getUTCDate() + i);
    return `${DAY_SHORT[i]} ${day.getUTCDate()}`;
  });
}

type CellState =
  | { kind: "past" }
  | { kind: "empty" }
  | { kind: "self" }
  | { kind: "other"; name: string };

type ConflictKey = `${number}-${string}`;
type SelectedWeek = "this" | "next";

interface Props {
  source: "meal" | "userRecipe";
  recipeId: string;
  mealType: string;
  weekStart: string;
  weekDays: string[];
  todayIndex: number;
  weekSlots: WeekSlot[];
}

export function AddToPlanWidget({
  source,
  recipeId,
  mealType,
  weekStart,
  weekDays,
  todayIndex,
  weekSlots,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<SelectedWeek>("this");
  const [localThisWeekSlots, setLocalThisWeekSlots] = useState<WeekSlot[]>(weekSlots);
  const [nextWeekSlots, setNextWeekSlots] = useState<WeekSlot[] | null>(null);
  const [loadingNextWeek, setLoadingNextWeek] = useState(false);
  const [pendingKey, setPendingKey] = useState<ConflictKey | null>(null);
  const [confirmKey, setConfirmKey] = useState<ConflictKey | null>(null);
  const [isPending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const nextWeekStart = getNextWeekStart(weekStart);
  const nextWeekDays = buildWeekDays(nextWeekStart);

  const effectiveWeekStart = selectedWeek === "this" ? weekStart : nextWeekStart;
  const effectiveWeekDays = selectedWeek === "this" ? weekDays : nextWeekDays;
  const effectiveTodayIndex = selectedWeek === "this" ? todayIndex : -1;
  const effectiveSlots = selectedWeek === "this" ? localThisWeekSlots : (nextWeekSlots ?? []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleSelectNextWeek() {
    setSelectedWeek("next");
    setConfirmKey(null);
    if (nextWeekSlots === null && !loadingNextWeek) {
      setLoadingNextWeek(true);
      const slots = await getWeekSlotsAction(nextWeekStart);
      setNextWeekSlots(slots);
      setLoadingNextWeek(false);
    }
  }

  function handleSelectThisWeek() {
    setSelectedWeek("this");
    setConfirmKey(null);
  }

  const allowedTypes = getAllowedTypes(mealType);

  function slotKey(day: number, type: string): ConflictKey {
    return `${day}-${type}`;
  }

  function cellState(day: number, type: string): CellState {
    if (day < effectiveTodayIndex) return { kind: "past" };
    const existing = effectiveSlots.find(
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
          ? await addMealToPlanAction(recipeId, day, type, effectiveWeekStart)
          : await addUserRecipeToPlanAction(recipeId, day, type, effectiveWeekStart);

      if ("success" in result) {
        const newSlot: WeekSlot = {
          dayOfWeek: day,
          mealType: type,
          mealName: "",
          mealId: source === "meal" ? recipeId : null,
          userRecipeId: source === "userRecipe" ? recipeId : null,
        };
        if (selectedWeek === "this") {
          setLocalThisWeekSlots((prev) => [
            ...prev.filter((s) => !(s.dayOfWeek === day && s.mealType === type)),
            newSlot,
          ]);
        } else {
          setNextWeekSlots((prev) => [
            ...(prev ?? []).filter((s) => !(s.dayOfWeek === day && s.mealType === type)),
            newSlot,
          ]);
        }
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
        style={{ zIndex: 49, background: "rgba(42,38,32,0.55)" }}
        onClick={() => setOpen(false)}
      />

      {/* Modal panel */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: Math.min(860, window.innerWidth - 32),
          maxHeight: "calc(100vh - 64px)",
          overflowY: "auto",
          zIndex: 50,
          background: "var(--paper-2)",
          borderTop: "3px solid var(--accent)",
          borderLeft: "1px solid var(--rule)",
          borderRight: "1px solid var(--rule)",
          borderBottom: "1px solid var(--rule)",
          boxShadow: "0 20px 60px rgba(42,38,32,0.22), 0 4px 16px rgba(42,38,32,0.1)",
          padding: "28px 28px 24px",
        }}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p
              className="small-caps"
              style={{ color: "var(--ink-3)", marginBottom: 2 }}
            >
              Schedule
            </p>
            <h2
              style={{
                fontFamily: "var(--font-fraunces, Georgia, serif)",
                fontStyle: "italic",
                fontSize: 22,
                color: "var(--ink)",
                lineHeight: 1,
              }}
            >
              Add to plan
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            style={{
              color: "var(--ink-3)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
              marginTop: 2,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-3)"; }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1 1l10 10M11 1 1 11" />
            </svg>
          </button>
        </div>

        {/* Week tabs */}
        <div
          className="mb-5 flex gap-0"
          style={{ borderBottom: "1px solid var(--rule)" }}
        >
          {(["this", "next"] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={w === "this" ? handleSelectThisWeek : handleSelectNextWeek}
              className="small-caps"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: selectedWeek === w ? "2px solid var(--accent)" : "2px solid transparent",
                marginBottom: -1,
                padding: "0 4px 10px",
                marginRight: 20,
                color: selectedWeek === w ? "var(--ink)" : "var(--ink-3)",
                cursor: "pointer",
                transition: "color .15s, border-color .15s",
              }}
            >
              {w === "this" ? "This week" : "Next week"}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          {loadingNextWeek && selectedWeek === "next" ? (
            <div
              style={{
                height: 128,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16" height="16" viewBox="0 0 10 10"
                fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                className="animate-spin"
                style={{ color: "var(--accent)" }}
              >
                <path d="M5 1a4 4 0 1 1-4 4" />
              </svg>
            </div>
          ) : (
            <table className="w-full table-fixed border-collapse" style={{ minWidth: 660 }}>
              <thead>
                <tr>
                  <th className="w-[80px]" />
                  {effectiveWeekDays.map((label, i) => {
                    const isToday = selectedWeek === "this" && i === todayIndex;
                    const isPast = i < effectiveTodayIndex;
                    return (
                      <th
                        key={i}
                        className={`pb-3 text-center ${isPast ? "w-[32px]" : "w-[82px]"}`}
                        style={{
                          fontFamily: "var(--font-jetbrains, monospace)",
                          fontSize: 10,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: isToday ? "var(--accent)" : "var(--ink-3)",
                          opacity: isPast ? 0.4 : 1,
                          fontWeight: isToday ? 600 : 400,
                        }}
                      >
                        {isPast ? null : label}
                        {isToday && (
                          <span
                            className="mx-auto mt-1 block h-0.5 w-4 rounded-full"
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
                          className="h-3.5 w-0.5"
                          style={{ background: ROW_BAR_COLORS[type] ?? "var(--rule)" }}
                        />
                        <span
                          className="small-caps"
                          style={{ color: "var(--ink-3)" }}
                        >
                          {MEAL_TYPE_LABELS[type]}
                        </span>
                      </div>
                    </td>
                    {effectiveWeekDays.map((_, dayIndex) => {
                      const state = cellState(dayIndex, type);
                      const key = slotKey(dayIndex, type);
                      const isConfirming = confirmKey === key;
                      const isThisPending = pendingKey === key;
                      return (
                        <td key={dayIndex} className={`h-[72px] align-top ${state.kind === "past" ? "px-0.5 py-1" : "px-1 py-1.5"}`}>
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
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-primary"
      >
        + ADD TO PLAN
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
        className={`${CELL_H} w-full`}
        style={{
          background: `repeating-linear-gradient(135deg, transparent, transparent 3px, var(--rule-2) 3px, var(--rule-2) 4px)`,
          border: "1px solid var(--rule-2)",
          opacity: 0.5,
          cursor: "default",
        }}
      />
    );
  }

  if (state.kind === "self") {
    return (
      <div
        className={`${CELL_H} flex w-full flex-col items-center justify-center gap-1`}
        style={{
          background: "rgba(166,58,31,0.06)",
          border: "1px solid rgba(166,58,31,0.3)",
          color: "var(--accent)",
          cursor: "default",
        }}
      >
        <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 6L5 10L13 2" />
        </svg>
        <span
          style={{
            fontFamily: "var(--font-jetbrains, monospace)",
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            opacity: 0.8,
          }}
        >
          Added
        </span>
      </div>
    );
  }

  if (isConfirming && state.kind === "other") {
    return (
      <div
        className={`${CELL_H} flex w-full overflow-hidden`}
        style={{ border: "1px solid var(--rule)" }}
      >
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="flex flex-1 flex-col items-center justify-center gap-1 disabled:opacity-50"
          style={{
            background: "rgba(166,58,31,0.08)",
            color: "var(--accent)",
            border: "none",
            cursor: "pointer",
            transition: "background .15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(166,58,31,0.14)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(166,58,31,0.08)"; }}
          aria-label="Confirm replace"
        >
          {isPending ? <Spinner /> : (
            <>
              <svg width="13" height="11" viewBox="0 0 13 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 5.5L4.5 9L12 1.5" />
              </svg>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains, monospace)",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Yes
              </span>
            </>
          )}
        </button>

        <div style={{ width: 1, background: "var(--rule)" }} />

        <button
          type="button"
          onClick={onCancelConfirm}
          disabled={isPending}
          className="flex flex-1 flex-col items-center justify-center gap-1 disabled:opacity-50"
          style={{
            background: "var(--paper)",
            color: "var(--ink-3)",
            border: "none",
            cursor: "pointer",
            transition: "background .15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--paper-3)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--paper)"; }}
          aria-label="Cancel"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M1 1l9 9M10 1 1 10" />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-jetbrains, monospace)",
              fontSize: 9,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            No
          </span>
        </button>
      </div>
    );
  }

  if (state.kind === "other") {
    return (
      <button
        type="button"
        onClick={onCellClick}
        className={`${CELL_H} group flex w-full cursor-pointer flex-col items-start justify-center p-2 text-left`}
        style={{
          background: "var(--paper-3)",
          border: "1px solid var(--rule)",
          color: "var(--ink-2)",
          transition: "background .15s, border-color .15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(166,58,31,0.06)";
          e.currentTarget.style.borderColor = "rgba(166,58,31,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--paper-3)";
          e.currentTarget.style.borderColor = "var(--rule)";
        }}
      >
        <span
          className="line-clamp-3"
          style={{
            fontFamily: "var(--font-newsreader, Georgia, serif)",
            fontSize: 11,
            lineHeight: 1.4,
          }}
        >
          {state.name}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onCellClick}
      disabled={isPending}
      className={`${CELL_H} group flex w-full cursor-pointer items-center justify-center disabled:opacity-40`}
      style={{
        background: "transparent",
        border: "1px solid var(--rule-2)",
        color: "var(--ink-3)",
        transition: "background .15s, border-color .15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--rule)";
        e.currentTarget.style.background = "var(--paper)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--rule-2)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      {isPending ? <Spinner /> : (
        <svg
          width="12" height="12" viewBox="0 0 12 12"
          fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
          className="opacity-0 transition-opacity group-hover:opacity-40"
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
      width="10" height="10" viewBox="0 0 10 10"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      className="animate-spin"
      style={{ color: "var(--accent)", opacity: 0.7 }}
    >
      <path d="M5 1a4 4 0 1 1-4 4" />
    </svg>
  );
}
