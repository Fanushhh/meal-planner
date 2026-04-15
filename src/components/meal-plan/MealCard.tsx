import Link from "next/link";
import { MealCardMenu } from "./MealCardMenu";
import type { PlanMealDisplay } from "@/server/queries/plans";

const MEAL_TYPE_COLORS: Record<string, string> = {
  breakfast: "#F5A623",
  lunch: "var(--accent)",
  dinner: "#7B95C4",
  snack: "#8B77C5",
};

interface MealCardProps {
  meal: PlanMealDisplay;
  planId: string;
  dayOfWeek: number;
  mealType: string;
}

export function MealCard({ meal, planId, dayOfWeek, mealType }: MealCardProps) {
  const barColor = MEAL_TYPE_COLORS[mealType] ?? "var(--accent)";

  return (
    <div
      className="meal-card-animate group relative h-full w-full rounded-lg"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Left colour bar */}
      <div
        className="absolute inset-y-0 left-0 w-[3px] rounded-l-lg"
        style={{ background: barColor, opacity: 0.65 }}
      />

      <Link
        href={meal.detailUrl}
        className="block h-full overflow-hidden py-2 pl-3.5 pr-8 cursor-pointer"
        style={{ textDecoration: "none" }}
      >
        <p
          className="mt-1 min-w-0 leading-snug line-clamp-3 font-medium"
          style={{
            fontFamily: "var(--font-dm-sans)",
            color: "var(--text)",
            fontSize: "13px",
            wordBreak: "break-word",
          }}
        >
          {meal.name}
        </p>

        {meal.prepTimeMin && (
          <div className="mt-1.5 flex items-center gap-0.5">
            <svg className="h-2.5 w-2.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-faint)" }}>
              <circle cx="8" cy="8" r="6.5" />
              <path strokeLinecap="round" d="M8 4.5V8l2.5 1.5" />
            </svg>
            <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
              {meal.prepTimeMin}m
            </span>
          </div>
        )}
      </Link>

      <div className="absolute right-1 top-1.5 z-10">
        <MealCardMenu
          planId={planId}
          dayOfWeek={dayOfWeek}
          mealType={mealType}
          mealId={meal.id}
        />
      </div>
    </div>
  );
}
