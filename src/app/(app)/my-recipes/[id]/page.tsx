import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/server/lib/auth";
import { getUserPreferences } from "@/server/queries/users";
import { getUserRecipeById } from "@/server/queries/userRecipes";
import { IngredientsPanel } from "@/components/meals/IngredientsPanel";
import { MyRecipeDeleteButton } from "@/components/my-recipes/MyRecipeDeleteButton";
import { AddToPlanWidget } from "@/components/meal-plan/AddToPlanWidget";
import { getWeekStart, getDayName, getTodayIndex } from "@/server/lib/date";
import { getWeekSlots } from "@/server/queries/plans";

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
  const todayIndex = getTodayIndex();
  const weekSlots = await getWeekSlots(session.user.id, weekStart);

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
    sources: [recipe.name],
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
            <AddToPlanWidget
              source="userRecipe"
              recipeId={recipe.id}
              mealType={recipe.mealType ?? "lunch"}
              weekStart={weekStart}
              weekDays={weekDays}
              todayIndex={todayIndex}
              weekSlots={weekSlots}
            />
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
