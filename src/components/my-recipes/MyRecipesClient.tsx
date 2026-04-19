"use client";

import { useState } from "react";
import Link from "next/link";
import { MyRecipeDeleteButton } from "@/components/my-recipes/MyRecipeDeleteButton";
import { MEAL_TYPE_LABELS, MEAL_TYPE_COLORS, MEAL_TYPES, type MealType } from "@/server/db/schema";
import type { ParsedUserRecipe } from "@/server/queries/userRecipes";
import type { ParsedMeal, Ingredient } from "@/server/queries/meals";

type Props = {
  recipes: ParsedUserRecipe[];
  meals: ParsedMeal[];
};

const MAX_TIME = 90;

function matchesSearch(query: string, name: string, ingredients: Ingredient[]): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  if (name.toLowerCase().includes(q)) return true;
  return ingredients.some((ing) => ing.name.toLowerCase().includes(q));
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

export function MyRecipesClient({ recipes, meals }: Props) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | MealType>("all");
  const [maxTime, setMaxTime] = useState(MAX_TIME);

  function matchesFilters(
    name: string,
    ingredients: Ingredient[],
    mealType: string | null,
    prepTimeMin: number | null,
    cookTimeMin: number | null
  ): boolean {
    if (!matchesSearch(query, name, ingredients)) return false;
    if (typeFilter !== "all" && mealType !== typeFilter) return false;
    if (maxTime < MAX_TIME) {
      const total = (prepTimeMin ?? 0) + (cookTimeMin ?? 0);
      // Only filter out items where we know the time and it exceeds the limit
      if (total > 0 && total > maxTime) return false;
    }
    return true;
  }

  const filteredRecipes = recipes.filter((r) =>
    matchesFilters(r.name, r.ingredients, r.mealType, r.prepTimeMin, r.cookTimeMin)
  );
  const filteredMeals = meals.filter((m) =>
    matchesFilters(m.name, m.ingredients, m.mealType, m.prepTimeMin, m.cookTimeMin)
  );

  const hasResults = filteredRecipes.length > 0 || filteredMeals.length > 0;
  const isFiltering = query.trim().length > 0 || typeFilter !== "all" || maxTime < MAX_TIME;
  const isSearching = query.trim().length > 0;

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--text-faint)" }}
          >
            <circle cx="6.5" cy="6.5" r="5" />
            <path d="M10.5 10.5 14 14" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or ingredient…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-colors"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 transition-opacity hover:opacity-70"
              style={{ color: "var(--text-faint)" }}
              aria-label="Clear search"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M1 1l11 11M12 1 1 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Meal type pills + time slider row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Type pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setTypeFilter("all")}
              className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all"
              style={
                typeFilter === "all"
                  ? { background: "var(--accent)", color: "#0D0E11" }
                  : { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }
              }
            >
              All
            </button>
            {MEAL_TYPES.map((t) => {
              const active = typeFilter === t;
              const colors = MEAL_TYPE_COLORS[t];
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(active ? "all" : t)}
                  className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all"
                  style={
                    active
                      ? { background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }
                      : { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }
                  }
                >
                  {MEAL_TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-4 w-px" style={{ background: "var(--border)" }} />

          {/* Total time slider */}
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-faint)" }}>
              Time
            </span>
            <input
              type="range"
              min={5}
              max={MAX_TIME}
              step={5}
              value={maxTime}
              onChange={(e) => setMaxTime(Number(e.target.value))}
              className="w-28 cursor-pointer"
              style={{ accentColor: "var(--accent)" }}
            />
            <span
              className="w-16 text-[11px] font-semibold tabular-nums"
              style={{ color: maxTime < MAX_TIME ? "var(--accent)" : "var(--text-faint)" }}
            >
              {maxTime < MAX_TIME ? `≤ ${maxTime}m` : "Any"}
            </span>
            {maxTime < MAX_TIME && (
              <button
                onClick={() => setMaxTime(MAX_TIME)}
                className="text-[10px] transition-opacity hover:opacity-100"
                style={{ color: "var(--text-faint)", opacity: 0.6 }}
                aria-label="Reset time filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* No results */}
      {isFiltering && !hasResults && (
        <div
          className="flex flex-col items-center justify-center rounded-2xl px-6 py-14 text-center"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No recipes or meals match the current filters.
          </p>
        </div>
      )}

      {/* User recipes */}
      {(!isFiltering || filteredRecipes.length > 0) && (
        <section>
          <h2
            className="mb-5 text-sm font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--text-faint)" }}
          >
            Rețetele mele
            {isFiltering && (
              <span className="ml-2 font-normal normal-case tracking-normal" style={{ color: "var(--text-faint)", opacity: 0.6 }}>
                — {filteredRecipes.length} result{filteredRecipes.length !== 1 ? "s" : ""}
              </span>
            )}
          </h2>
          {!isFiltering && recipes.length === 0 ? (
            <div
              className="flex items-center justify-center rounded-2xl px-6 py-14 text-center"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No recipes yet. Use the <strong style={{ color: "var(--text)" }}>Add recipe</strong> button above to get started.
              </p>
            </div>
          ) : filteredRecipes.length === 0 ? null : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRecipes.map((recipe) => {
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
      )}

      {/* Seeded meals collection */}
      {meals.length > 0 && (!isFiltering || filteredMeals.length > 0) && (
        <section>
          <h2
            className="mb-5 text-sm font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--text-faint)" }}
          >
            Colecție — Săptămâna I
            {isFiltering && (
              <span className="ml-2 font-normal normal-case tracking-normal" style={{ color: "var(--text-faint)", opacity: 0.6 }}>
                — {filteredMeals.length} result{filteredMeals.length !== 1 ? "s" : ""}
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMeals.map((meal) => {
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
  );
}
