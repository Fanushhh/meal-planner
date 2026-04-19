import Link from "next/link";
import { MealCardMenu } from "./MealCardMenu";
import type { PlanMealDisplay } from "@/server/queries/plans";

interface MealCardProps {
  meal: PlanMealDisplay;
  planId: string;
  dayOfWeek: number;
  mealType: string;
  ornament?: string;
}

export function MealCard({ meal, planId, dayOfWeek, mealType, ornament = "·" }: MealCardProps) {
  const totalTime = meal.prepTimeMin ?? 0;

  return (
    <div
      className="meal-card-animate group slot-surface"
      style={{
        minHeight: 130,
        display: "flex",
        flexDirection: "column",
        padding: "18px 18px 14px",
        position: "relative",
      }}
    >
      {/* Ornament + menu row */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 6,
      }}>
        <span style={{
          fontFamily: "var(--font-fraunces, Georgia, serif)",
          fontSize: 13,
          color: "var(--ink-3)",
        }}>
          {ornament}
        </span>

        {/* Slot tools — visible on hover */}
        <div className="slot-tools" style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}>
          <MealCardMenu
            planId={planId}
            dayOfWeek={dayOfWeek}
            mealType={mealType}
            mealId={meal.id}
          />
        </div>
      </div>

      {/* Meal name */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Link
          href={meal.detailUrl}
          className="meal-name-link"
          style={{
            fontFamily: "var(--font-fraunces, Georgia, serif)",
            fontWeight: 500,
            fontSize: 17,
            lineHeight: 1.2,
            letterSpacing: "-0.005em",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            display: "block",
          }}
        >
          {meal.name}
        </Link>

        {totalTime > 0 && (
          <div style={{
            marginTop: 8,
            fontFamily: "var(--font-jetbrains, monospace)",
            fontSize: 10,
            color: "var(--ink-3)",
            letterSpacing: ".08em",
          }}>
            {totalTime} min
          </div>
        )}
      </div>
    </div>
  );
}
