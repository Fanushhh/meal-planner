"use client";

import React, { useRef, useEffect } from "react";
import { MealCard } from "./MealCard";
import { getDayName } from "@/server/lib/date";
import { MEAL_TYPES, MEAL_TYPE_LABELS, type MealType } from "@/server/db/schema";
import type { WeeklyPlanWithMeals } from "@/server/queries/plans";

interface WeeklyPlanGridProps {
  plan: WeeklyPlanWithMeals;
  todayIndex: number;
  weekStart: string;
}

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const SLOT_ORNAMENT: Record<string, string> = {
  breakfast: "☉",
  lunch: "☼",
  dinner: "☾",
  snack: "✦",
};

export function WeeklyPlanGrid({ plan, todayIndex, weekStart }: WeeklyPlanGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const offset = 170 + todayIndex * 145 - 170;
    scrollRef.current.scrollLeft = Math.max(0, offset);
  }, [todayIndex]);

  const activeMealTypes = MEAL_TYPES.filter((t) =>
    plan.plannedMeals.some((pm) => pm.mealType === t)
  );
  const lastTypeIndex = activeMealTypes.length - 1;

  return (
    <div ref={scrollRef} className="scroll-x" style={{ overflowX: "auto", paddingBottom: 2 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "170px repeat(7, minmax(0, 1fr))",
          background: "var(--paper-2)",
          width: "100%",
          overflow: "hidden",
          minWidth: 1060,
        }}
      >
        {/* ── Header row: corner + 7 days ── */}
        <div style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--rule)",
          borderRight: "1px solid var(--rule)",
          display: "flex",
          alignItems: "center",
        }}>
          <span style={{ color: "var(--rule)", fontSize: 16 }}>✦</span>
        </div>

        {DAYS.map((day) => {
          const isToday = day === todayIndex;
          const d = getDateForDay(day, weekStart);
          const dateObj = new Date(weekStart + "T00:00:00Z");
          dateObj.setUTCDate(dateObj.getUTCDate() + day);
          const dateStr = dateObj
            .toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
            .toUpperCase();

          return (
            <div
              key={`dh-${day}`}
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--rule)",
                borderRight: day === 6 ? "none" : "1px solid var(--rule)",
                background: isToday ? "rgba(166,58,31,0.04)" : "var(--paper-2)",
                borderTop: isToday ? "2px solid rgba(166,58,31,0.55)" : "none",
              }}
            >
              <div style={{
                fontFamily: "var(--font-fraunces, Georgia, serif)",
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: ".01em",
                color: isToday ? "var(--accent)" : "var(--ink)",
              }}>
                {getDayName(day)}
              </div>
              <div style={{
                fontFamily: "var(--font-jetbrains, monospace)",
                fontSize: 10,
                color: "var(--ink-3)",
                marginTop: 2,
                letterSpacing: ".12em",
              }}>
                {dateStr}
              </div>
            </div>
          );
        })}

        {/* ── Meal type rows ── */}
        {activeMealTypes.map((mealType: MealType, typeIndex) => (
          <React.Fragment key={mealType}>
            {/* Row label cell */}
            <div style={{
              padding: "20px 14px",
              borderBottom: typeIndex === lastTypeIndex ? "none" : "1px solid var(--rule)",
              borderRight: "1px solid var(--rule)",
              background: "var(--paper-2)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 0,
              overflow: "hidden",
            }}>
              <div style={{
                fontFamily: "var(--font-fraunces, Georgia, serif)",
                fontSize: 17,
                fontWeight: 500,
                fontStyle: "italic",
                letterSpacing: "-0.01em",
                lineHeight: 1.15,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: "var(--ink)",
              }}>
                {MEAL_TYPE_LABELS[mealType]}
              </div>
              <div style={{
                fontFamily: "var(--font-jetbrains, monospace)",
                fontSize: 10,
                color: "var(--ink-3)",
                letterSpacing: ".1em",
                marginTop: 4,
                textTransform: "uppercase",
              }}>
                {mealType === "breakfast" ? "morning"
                  : mealType === "lunch" ? "midday"
                  : mealType === "dinner" ? "evening"
                  : "anytime"}
              </div>
            </div>

            {/* Day slots */}
            {DAYS.map((day) => {
              const isToday = day === todayIndex;
              const isLastRow = typeIndex === lastTypeIndex;
              const slot = plan.plannedMeals.find(
                (pm) => pm.dayOfWeek === day && pm.mealType === mealType
              );

              return (
                <div
                  key={`slot-${mealType}-${day}`}
                  className="day-col-animate"
                  style={
                    {
                      "--col-delay": `${day * 30}ms`,
                      borderRight: day === 6 ? "none" : "1px solid var(--rule)",
                      borderBottom: isLastRow ? "none" : "1px solid var(--rule)",
                      background: isToday ? "rgba(166,58,31,0.04)" : "var(--paper)",
                      minWidth: 0,
                    } as React.CSSProperties
                  }
                >
                  {slot ? (
                    <MealCard
                      meal={slot.meal}
                      planId={plan.id}
                      dayOfWeek={day}
                      mealType={mealType}
                      ornament={SLOT_ORNAMENT[mealType] ?? "·"}
                    />
                  ) : (
                    <div style={{
                      height: "100%",
                      minHeight: 130,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <span style={{
                        fontFamily: "var(--font-fraunces, Georgia, serif)",
                        fontStyle: "italic",
                        color: "var(--rule)",
                        fontSize: 15,
                      }}>
                        — empty —
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function getDateForDay(dayIndex: number, weekStart: string): number {
  const monday = new Date(weekStart + "T00:00:00Z");
  monday.setUTCDate(monday.getUTCDate() + dayIndex);
  return monday.getUTCDate();
}
