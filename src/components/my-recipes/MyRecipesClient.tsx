"use client";

import { useState } from "react";
import Link from "next/link";
import { MyRecipeDeleteButton } from "@/components/my-recipes/MyRecipeDeleteButton";
import { MEAL_TYPE_LABELS, MEAL_TYPE_COLORS, type MealType } from "@/server/db/schema";
import type { ParsedUserRecipe } from "@/server/queries/userRecipes";
import type { ParsedMeal, Ingredient } from "@/server/queries/meals";

type Props = {
  recipes: ParsedUserRecipe[];
  meals: ParsedMeal[];
};

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

  const filteredRecipes = recipes.filter((r) =>
    matchesSearch(query, r.name, r.ingredients)
  );
  const filteredMeals = meals.filter((m) =>
    matchesSearch(query, m.name, m.ingredients)
  );

  const hasResults = filteredRecipes.length > 0 || filteredMeals.length > 0;
  const isSearching = query.trim().length > 0;

  return (
    <div className="space-y-8">
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

      {/* No results */}
      {isSearching && !hasResults && (
        <div
          className="flex flex-col items-center justify-center rounded-2xl px-6 py-14 text-center"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No recipes or meals found for &ldquo;<span style={{ color: "var(--text)" }}>{query}</span>&rdquo;.
          </p>
        </div>
      )}

      {/* User recipes */}
      {(!isSearching || filteredRecipes.length > 0) && (
        <section>
          <h2
            className="mb-5 text-sm font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--text-faint)" }}
          >
            Rețetele mele
            {isSearching && (
              <span className="ml-2 font-normal normal-case tracking-normal" style={{ color: "var(--text-faint)", opacity: 0.6 }}>
                — {filteredRecipes.length} result{filteredRecipes.length !== 1 ? "s" : ""}
              </span>
            )}
          </h2>
          {!isSearching && recipes.length === 0 ? (
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
      {meals.length > 0 && (!isSearching || filteredMeals.length > 0) && (
        <section>
          <h2
            className="mb-5 text-sm font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--text-faint)" }}
          >
            Colecție — Săptămâna I
            {isSearching && (
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
