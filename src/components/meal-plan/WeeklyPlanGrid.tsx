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

// Shared today-column visual language — warm accent rails + barely-there wash
const TODAY_BG        = "rgba(212, 120, 67, 0.045)";
const TODAY_RAIL      = "1px solid rgba(212, 120, 67, 0.13)";
const TODAY_CAP_TOP   = "2px solid rgba(212, 120, 67, 0.55)";
const TODAY_CAP_BTM   = "1px solid rgba(212, 120, 67, 0.13)";

export function WeeklyPlanGrid({ plan, todayIndex, weekStart }: WeeklyPlanGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    // 80px label column + todayIndex * (140px min column + 5px gap)
    // Subtract 80px so the label column stays visible at the left edge
    const offset = 80 + todayIndex * 145 - 80;
    scrollRef.current.scrollLeft = Math.max(0, offset);
  }, [todayIndex]);

  const activeMealTypes = MEAL_TYPES.filter((t) =>
    plan.plannedMeals.some((pm) => pm.mealType === t)
  );
  const lastTypeIndex = activeMealTypes.length - 1;

  return (
    <div ref={scrollRef} className="overflow-x-auto scroll-x pb-3">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "80px repeat(7, minmax(140px, 1fr))",
          columnGap: "5px",
          minWidth: "1060px",
        }}
      >
        {/* ── Header row ── */}
        <div />

        {DAYS.map((day) => {
          const isToday = day === todayIndex;
          return (
            <div
              key={`dh-${day}`}
              className="pb-3 text-center"
              style={{
                borderBottom: `2px solid ${isToday ? "var(--accent)" : "var(--border-subtle)"}`,
                // Today column: accent cap on top + side rails + warm wash + top rounding
                ...(isToday && {
                  borderTop: TODAY_CAP_TOP,
                  borderLeft: TODAY_RAIL,
                  borderRight: TODAY_RAIL,
                  background: TODAY_BG,
                  borderRadius: "6px 6px 0 0",
                  paddingLeft: "4px",
                  paddingRight: "4px",
                }),
              }}
            >
              <p
                className="text-[9px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: isToday ? "var(--accent)" : "var(--text-faint)" }}
              >
                {getDayName(day).slice(0, 3)}
              </p>
              <p
                className="mt-0.5 text-[22px] leading-none"
                style={{
                  fontFamily: "var(--font-dm-serif)",
                  color: isToday ? "var(--text)" : "var(--text-muted)",
                  fontStyle: isToday ? "italic" : "normal",
                }}
              >
                {getDateForDay(day, weekStart)}
              </p>
            </div>
          );
        })}

        {/* ── Meal type rows ── */}
        {activeMealTypes.map((mealType: MealType, typeIndex) => (
          <React.Fragment key={mealType}>
            {/*
             * Separator between groups — rendered as per-column cells so the
             * today column can carry its side rails through without a crossing line.
             */}
            {typeIndex > 0 && (
              <>
                {/* Label column spacer */}
                <div style={{ height: "9px" }} />

                {DAYS.map((day) => {
                  const isToday = day === todayIndex;
                  return (
                    <div
                      key={`sep-${mealType}-${day}`}
                      style={{
                        height: "9px",
                        background: isToday ? TODAY_BG : "transparent",
                        borderLeft:  isToday ? TODAY_RAIL : "none",
                        borderRight: isToday ? TODAY_RAIL : "none",
                        // Non-today columns get the visible divider line
                        ...(!isToday && {
                          borderTop: "1px solid var(--border-subtle)",
                          marginTop: "4px",
                        }),
                      }}
                    />
                  );
                })}
              </>
            )}

            {/* Row label */}
            <div
              className="flex items-center"
              style={{ paddingTop: typeIndex === 0 ? "6px" : "0" }}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--text-faint)" }}
              >
                {MEAL_TYPE_LABELS[mealType]}
              </span>
            </div>

            {/* Day slots */}
            {DAYS.map((day) => {
              const isToday   = day === todayIndex;
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
                      height: "110px",
                      padding: "3px",
                      marginTop: "6px",
                      // Today: side rails persist through every row; last row closes the column
                      ...(isToday
                        ? {
                            background: TODAY_BG,
                            borderLeft:  TODAY_RAIL,
                            borderRight: TODAY_RAIL,
                            ...(isLastRow && {
                              borderBottom: TODAY_CAP_BTM,
                              borderRadius: "0 0 6px 6px",
                            }),
                          }
                        : {}),
                    } as React.CSSProperties
                  }
                >
                  {slot ? (
                    <MealCard
                      meal={slot.meal}
                      planId={plan.id}
                      dayOfWeek={day}
                      mealType={mealType}
                    />
                  ) : (
                    <div
                      className="h-full w-full rounded-lg"
                      style={{ border: "1.5px dashed var(--border-subtle)" }}
                    />
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
