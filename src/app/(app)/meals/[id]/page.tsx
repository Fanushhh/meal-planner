import { notFound } from "next/navigation";
import Link from "next/link";
import { getMealById } from "@/server/queries/meals";
import { getSession } from "@/server/lib/auth";
import { getUserPreferences } from "@/server/queries/users";
import { IngredientsPanel } from "@/components/meals/IngredientsPanel";
import { getScheduledDaysForMeal } from "@/server/queries/plans";
import { getWeekStart, getDayName } from "@/server/lib/date";
import { MEAL_TYPE_LABELS } from "@/server/db/schema";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: Props) {
  const { id } = await params;

  const [meal, session] = await Promise.all([getMealById(id), getSession()]);
  if (!meal) notFound();

  const prefs = session ? await getUserPreferences(session.user.id) : null;
  const numPeople = prefs?.numPeople ?? meal.servings;
  const scale = numPeople / meal.servings;
  const servingsLabel = numPeople === 1 ? "1 serving" : `${numPeople} servings`;

  const weekStart = getWeekStart();
  const scheduledSlots = session
    ? await getScheduledDaysForMeal(session.user.id, weekStart, meal.id)
    : [];

  const totalTime = (meal.prepTimeMin ?? 0) + (meal.cookTimeMin ?? 0);

  const scaledIngredients = meal.ingredients.map((ing) => ({
    name: ing.name,
    quantity: ing.quantity !== null ? ing.quantity * scale : null,
    unit: ing.unit ?? null,
    note: ing.note,
  }));

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-4xl px-6 py-10">

        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-100"
          style={{ color: "var(--text-faint)", textDecoration: "none", opacity: 0.7 }}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          Back to plan
        </Link>

        {scheduledSlots.length > 0 && (
          <PlanBadge slots={scheduledSlots} />
        )}

        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-5xl leading-tight"
            style={{
              fontFamily: "var(--font-dm-serif)",
              fontStyle: "italic",
              color: "var(--text)",
            }}
          >
            {meal.name}
          </h1>

          {meal.description && (
            <p
              className="mt-3 max-w-2xl text-base leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              {meal.description}
            </p>
          )}
        </div>

        {/* Time + servings row */}
        <div
          className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {meal.prepTimeMin != null && (
            <TimeBlock label="Prep" minutes={meal.prepTimeMin} />
          )}
          {meal.cookTimeMin != null && meal.cookTimeMin > 0 && (
            <TimeBlock label="Cook" minutes={meal.cookTimeMin} />
          )}
          {totalTime > 0 && (
            <TimeBlock label="Total" minutes={totalTime} bold />
          )}

          {totalTime > 0 && (
            <span
              className="hidden h-8 w-px sm:block"
              style={{ background: "var(--border)" }}
            />
          )}
          <div className="flex flex-col">
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--text-faint)" }}
            >
              Serves
            </span>
            <span
              className="text-lg leading-tight"
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontStyle: "italic",
                color: "var(--accent)",
              }}
            >
              {servingsLabel}
            </span>
          </div>
        </div>

        {/* Gradient rule */}
        <div
          className="mb-8 h-px"
          style={{ background: "linear-gradient(to right, var(--border), transparent 60%)" }}
        />

        {/* Two-column: ingredients + instructions */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.6fr]">

          <IngredientsPanel ingredients={scaledIngredients} />

          {/* Instructions */}
          <div>
            <h2
              className="mb-5 text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--text-faint)" }}
            >
              Instructions
            </h2>
            <ol className="space-y-4">
              {meal.instructions.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{
                      background: "var(--accent-light)",
                      color: "var(--accent)",
                      border: "1px solid rgba(212, 120, 67, 0.25)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <p
                    className="pt-0.5 text-sm leading-relaxed"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>

        </div>
      </div>
    </div>
  );
}

const SHORT_DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function PlanBadge({ slots }: { slots: { dayOfWeek: number; mealType: string }[] }) {
  return (
    <div
      className="mb-6 flex flex-wrap items-center gap-2 rounded-xl px-4 py-2.5"
      style={{
        background: "rgba(45, 212, 191, 0.07)",
        border: "1px solid rgba(45, 212, 191, 0.22)",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#2DD4BF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <rect x="2" y="3" width="12" height="11" rx="2" />
        <path d="M5 1v3M11 1v3M2 7h12" />
      </svg>
      <span className="text-xs font-semibold" style={{ color: "#2DD4BF" }}>
        In this week&apos;s plan
      </span>
      <span className="mx-0.5 text-xs" style={{ color: "rgba(45,212,191,0.35)" }}>·</span>
      <div className="flex flex-wrap gap-1.5">
        {slots.map((s, i) => (
          <span
            key={i}
            className="rounded-md px-2 py-0.5 text-[11px] font-medium"
            style={{
              background: "rgba(45, 212, 191, 0.1)",
              border: "1px solid rgba(45, 212, 191, 0.25)",
              color: "rgba(45, 212, 191, 0.85)",
            }}
          >
            {SHORT_DAY[s.dayOfWeek]} · {MEAL_TYPE_LABELS[s.mealType as keyof typeof MEAL_TYPE_LABELS] ?? s.mealType}
          </span>
        ))}
      </div>
    </div>
  );
}

function TimeBlock({ label, minutes, bold = false }: {
  label: string;
  minutes: number;
  bold?: boolean;
}) {
  const display = minutes >= 60
    ? `${Math.floor(minutes / 60)}h${minutes % 60 > 0 ? ` ${minutes % 60}m` : ""}`
    : `${minutes}m`;

  return (
    <div className="flex flex-col">
      <span
        className="text-[9px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--text-faint)" }}
      >
        {label}
      </span>
      <span
        className="text-lg leading-tight"
        style={{
          fontFamily: "var(--font-dm-serif)",
          fontStyle: "italic",
          color: bold ? "var(--accent)" : "var(--text)",
        }}
      >
        {display}
      </span>
    </div>
  );
}
