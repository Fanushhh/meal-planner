import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/server/lib/auth";
import { getUserPreferences } from "@/server/queries/users";
import { getUserRecipes } from "@/server/queries/userRecipes";
import { getAllMeals } from "@/server/queries/meals";
import { MyRecipeDeleteButton } from "@/components/my-recipes/MyRecipeDeleteButton";
import { MEAL_TYPE_LABELS, MEAL_TYPE_COLORS, type MealType } from "@/server/db/schema";

export default async function MyRecipesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [prefs, recipes, meals] = await Promise.all([
    getUserPreferences(session.user.id),
    getUserRecipes(session.user.id),
    getAllMeals(),
  ]);
  if (!prefs) redirect("/onboarding");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Page header */}
      <div className="mx-auto max-w-[1400px] px-6 pb-8 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--text-faint)" }}
              >
                Recipes
              </span>
              <span
                className="inline-block h-px w-8"
                style={{ background: "var(--border-subtle)" }}
              />
              <span
                className="text-[11px] font-medium uppercase tracking-[0.1em]"
                style={{ color: "var(--accent)", opacity: 0.85 }}
              >
                Your collection
              </span>
            </div>

            <h1
              className="text-[40px] leading-none"
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontStyle: "italic",
                color: "var(--text)",
              }}
            >
              My Recipes
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Recipes you&apos;ve added to your collection.
            </p>
          </div>

          <Link
            href="/my-recipes/new"
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "var(--accent)", color: "#0D0E11" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 1v10M1 6h10" />
            </svg>
            Add recipe
          </Link>
        </div>

        {/* Gradient rule */}
        <div
          className="mt-8 h-px"
          style={{ background: "linear-gradient(to right, var(--border), transparent 70%)" }}
        />
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[1400px] px-6 pb-16 space-y-12">
        {/* User recipes */}
        <section>
          <h2
            className="mb-5 text-sm font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--text-faint)" }}
          >
            Rețetele mele
          </h2>
          {recipes.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <h3
                className="mb-2 text-xl"
                style={{ fontFamily: "var(--font-dm-serif)", fontStyle: "italic", color: "var(--text)" }}
              >
                Nicio rețetă încă
              </h3>
              <p className="mb-6 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
                Adaugă prima rețetă și va apărea în planul tău săptămânal.
              </p>
              <Link
                href="/my-recipes/new"
                className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "var(--accent)", color: "#0D0E11" }}
              >
                Adaugă rețetă
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => {
                const totalTime = (recipe.prepTimeMin ?? 0) + (recipe.cookTimeMin ?? 0);
                return (
                  <div
                    key={recipe.id}
                    className="group flex flex-col rounded-2xl p-5 transition-all"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <Link href={`/my-recipes/${recipe.id}`} className="flex-1 no-underline" style={{ textDecoration: "none" }}>
                      {recipe.mealType && (
                        <MealTypeBadge mealType={recipe.mealType as MealType} />
                      )}
                      <h3
                        className="mb-1 text-lg leading-snug transition-colors group-hover:opacity-80"
                        style={{ fontFamily: "var(--font-dm-serif)", fontStyle: "italic", color: "var(--text)" }}
                      >
                        {recipe.name}
                      </h3>
                      {recipe.description && (
                        <p className="mb-3 line-clamp-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                          {recipe.description}
                        </p>
                      )}
                    </Link>
                    <div className="mt-auto flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-faint)" }}>
                        {totalTime > 0 && <span>{totalTime}m</span>}
                        <span>{recipe.servings} porții</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/my-recipes/${recipe.id}/edit`}
                          className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Editează
                        </Link>
                        <MyRecipeDeleteButton id={recipe.id} label="Șterge" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Seeded meals collection */}
        {meals.length > 0 && (
          <section>
            <h2
              className="mb-5 text-sm font-semibold uppercase tracking-[0.12em]"
              style={{ color: "var(--text-faint)" }}
            >
              Colecție — Săptămâna I
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {meals.map((meal) => {
                const totalTime = (meal.prepTimeMin ?? 0) + (meal.cookTimeMin ?? 0);
                return (
                  <div
                    key={meal.id}
                    className="group flex flex-col rounded-2xl p-5 transition-all"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <Link href={`/meals/${meal.id}`} className="flex-1 no-underline" style={{ textDecoration: "none" }}>
                      {meal.mealType && (
                        <MealTypeBadge mealType={meal.mealType as MealType} />
                      )}
                      <h3
                        className="mb-1 text-lg leading-snug transition-colors group-hover:opacity-80"
                        style={{ fontFamily: "var(--font-dm-serif)", fontStyle: "italic", color: "var(--text)" }}
                      >
                        {meal.name}
                      </h3>
                      {meal.description && (
                        <p className="mb-3 line-clamp-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                          {meal.description}
                        </p>
                      )}
                    </Link>
                    <div className="mt-auto flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-faint)" }}>
                        {totalTime > 0 && <span>{totalTime}m</span>}
                        <span>{meal.servings} porții</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function MealTypeBadge({ mealType }: { mealType: MealType }) {
  const label = MEAL_TYPE_LABELS[mealType];
  const colors = MEAL_TYPE_COLORS[mealType];
  if (!label || !colors) return null;
  return (
    <span
      className="mb-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
    >
      {label}
    </span>
  );
}
