import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/server/lib/auth";
import { getUserPreferences } from "@/server/queries/users";
import { getUserRecipeById } from "@/server/queries/userRecipes";
import { IngredientsPanel } from "@/components/meals/IngredientsPanel";
import { MyRecipeDeleteButton } from "@/components/my-recipes/MyRecipeDeleteButton";
import { AddToPlanButton } from "@/components/my-recipes/AddToPlanButton";
import { getWeekStart, getDayName } from "@/server/lib/date";
import { getScheduledDaysForRecipe } from "@/server/queries/plans";
import { MEAL_TYPE_LABELS } from "@/server/db/schema";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MyRecipeDetailPage({ params }: Props) {
  const { id } = await params;

  const session = await getSession();
  if (!session) redirect("/login");

  const [recipe, prefs] = await Promise.all([
    getUserRecipeById(id, session.user.id),
    getUserPreferences(session.user.id),
  ]);
  if (!recipe) notFound();
  if (!prefs) redirect("/onboarding");

  const weekStart = getWeekStart();
  const scheduledDays = await getScheduledDaysForRecipe(session.user.id, weekStart, recipe.id);

  const weekDate = new Date(weekStart + "T00:00:00Z");
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekDate);
    d.setUTCDate(d.getUTCDate() + i);
    return `${getDayName(i).slice(0, 3)} ${d.getUTCDate()}`;
  });

  const numPeople = prefs.numPeople;
  const scale = numPeople / recipe.servings;
  const servingsLabel = numPeople === 1 ? "1 serving" : `${numPeople} servings`;
  const totalTime = (recipe.prepTimeMin ?? 0) + (recipe.cookTimeMin ?? 0);

  const scaledIngredients = recipe.ingredients.map((ing) => ({
    name: ing.name,
    quantity: ing.quantity !== null ? ing.quantity * scale : null,
    unit: ing.unit ?? null,
    note: ing.note,
  }));

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-4xl px-6 py-10">

        {/* Back link + actions row */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/my-recipes"
            className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-100"
            style={{ color: "var(--text-faint)", textDecoration: "none", opacity: 0.7 }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
            My Recipes
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`/my-recipes/${recipe.id}/edit`}
              className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/5"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              Edit
            </Link>
            <MyRecipeDeleteButton id={recipe.id} label="Delete" />
          </div>
        </div>

        {scheduledDays.length > 0 && (
          <PlanBadge slots={scheduledDays} />
        )}

        {/* Add to plan */}
        <div className="mb-6">
          <AddToPlanButton recipeId={recipe.id} weekDays={weekDays} scheduledDays={scheduledDays} mealType={recipe.mealType} />
        </div>

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
            {recipe.name}
          </h1>

          {recipe.description && (
            <p
              className="mt-3 max-w-2xl text-base leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              {recipe.description}
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
          {recipe.prepTimeMin != null && (
            <TimeBlock label="Prep" minutes={recipe.prepTimeMin} />
          )}
          {recipe.cookTimeMin != null && recipe.cookTimeMin > 0 && (
            <TimeBlock label="Cook" minutes={recipe.cookTimeMin} />
          )}
          {totalTime > 0 && (
            <TimeBlock label="Total" minutes={totalTime} bold />
          )}

          {totalTime > 0 && (
            <span className="hidden h-8 w-px sm:block" style={{ background: "var(--border)" }} />
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

          <div>
            <h2
              className="mb-5 text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--text-faint)" }}
            >
              Instructions
            </h2>
            <ol className="space-y-4">
              {recipe.instructions.map((step, i) => (
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
