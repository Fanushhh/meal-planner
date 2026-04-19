"use client";

import { useState } from "react";
import Link from "next/link";
import { MyRecipeDeleteButton } from "@/components/my-recipes/MyRecipeDeleteButton";
import { MEAL_TYPE_LABELS, MEAL_TYPES, type MealType } from "@/server/db/schema";
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

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        border: "1px solid " + (active ? "var(--ink)" : "var(--rule)"),
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--paper)" : "var(--ink-2)",
        fontFamily: "var(--font-jetbrains, monospace)",
        fontSize: 10,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "all .15s",
      }}
    >
      {children}
    </button>
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

  const totalCount = recipes.length + meals.length;
  const filteredCount = filteredRecipes.length + filteredMeals.length;

  return (
    <div>
      {/* ── Filters ── */}
      <div className="recipes-filter-grid" style={{
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr 1fr",
        gap: 28,
        borderTop: "1px solid var(--rule)",
        borderBottom: "1px solid var(--rule)",
        padding: "20px 0",
        marginBottom: 32,
      }}>
        {/* Search */}
        <div>
          <div className="small-caps" style={{ marginBottom: 8 }}>Search</div>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="dish, ingredient…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 0",
                border: 0,
                borderBottom: "1px solid var(--ink-2)",
                background: "transparent",
                color: "var(--ink)",
                fontFamily: "var(--font-fraunces, Georgia, serif)",
                fontSize: 20,
                fontStyle: "italic",
                outline: "none",
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--ink-3)",
                  cursor: "pointer",
                  padding: "2px 4px",
                }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Meal type */}
        <div>
          <div className="small-caps" style={{ marginBottom: 8 }}>Meal type</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>All</FilterChip>
            {MEAL_TYPES.map((t) => (
              <FilterChip
                key={t}
                active={typeFilter === t}
                onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
              >
                {MEAL_TYPE_LABELS[t]}
              </FilterChip>
            ))}
          </div>
        </div>

        {/* Cooking time */}
        <div>
          <div className="small-caps" style={{ marginBottom: 8 }}>Cooking time</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[
              { k: MAX_TIME, label: "Any" },
              { k: 20, label: "< 20 min" },
              { k: 40, label: "< 40 min" },
            ].map((o) => (
              <FilterChip key={o.k} active={maxTime === o.k} onClick={() => setMaxTime(o.k)}>
                {o.label}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      {/* Count */}
      <div className="small-caps" style={{ textAlign: "center", marginBottom: 24 }}>
        {filteredCount} {filteredCount === 1 ? "recipe" : "recipes"} — of {totalCount}
      </div>

      {/* No results */}
      {isFiltering && !hasResults && (
        <div style={{
          padding: "60px 20px",
          textAlign: "center",
          border: "1px solid var(--rule)",
        }}>
          <span style={{
            fontFamily: "var(--font-fraunces, Georgia, serif)",
            fontStyle: "italic",
            fontSize: 20,
            color: "var(--ink-3)",
          }}>
            Nothing matches that yet. Try a broader search.
          </span>
        </div>
      )}

      {/* Recipe grid */}
      {hasResults && (
        <div className="recipes-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "1px",
          background: "var(--rule-2)",
          border: "1px solid var(--rule)",
        }}>
          {/* User recipes */}
          {filteredRecipes.map((recipe) => {
            const totalTime = (recipe.prepTimeMin ?? 0) + (recipe.cookTimeMin ?? 0);
            return (
              <div
                key={recipe.id}
                style={{
                  background: "var(--paper)",
                  padding: "22px 24px",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(166,58,31,0.05)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--paper)"; }}
              >
                <Link href={`/my-recipes/${recipe.id}`} style={{ textDecoration: "none", flex: 1 }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 6,
                  }}>
                    <span className="small-caps">{recipe.mealType ?? "lunch"}</span>
                    <span style={{
                      fontFamily: "var(--font-jetbrains, monospace)",
                      fontSize: 11,
                      color: "var(--ink-3)",
                      letterSpacing: ".1em",
                    }}>
                      {totalTime > 0 ? `${totalTime} MIN` : "—"}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: "var(--font-fraunces, Georgia, serif)",
                    fontSize: 22,
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                    color: "var(--ink)",
                    marginBottom: 6,
                  }}>
                    {recipe.name}
                  </div>
                  {recipe.description && (
                    <div style={{ fontSize: 13, color: "var(--ink-2)", fontStyle: "italic" }}>
                      {recipe.description}
                    </div>
                  )}
                </Link>
                <div style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px dashed var(--rule-2)",
                }}>
                  <Link
                    href={`/my-recipes/${recipe.id}/edit`}
                    style={{
                      fontFamily: "var(--font-jetbrains, monospace)",
                      fontSize: 10,
                      letterSpacing: ".14em",
                      textTransform: "uppercase",
                      color: "var(--ink-3)",
                      textDecoration: "none",
                    }}
                  >
                    Edit
                  </Link>
                  <MyRecipeDeleteButton id={recipe.id} label="Delete" variant="link" />
                </div>
              </div>
            );
          })}

          {/* Seeded meals */}
          {filteredMeals.map((meal) => {
            const totalTime = (meal.prepTimeMin ?? 0) + (meal.cookTimeMin ?? 0);
            return (
              <Link
                key={meal.id}
                href={`/meals/${meal.id}`}
                style={{
                  background: "var(--paper)",
                  padding: "22px 24px",
                  textDecoration: "none",
                  display: "block",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(166,58,31,0.05)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--paper)"; }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 6,
                }}>
                  <span className="small-caps">{meal.mealType ?? "lunch"}</span>
                  <span style={{
                    fontFamily: "var(--font-jetbrains, monospace)",
                    fontSize: 11,
                    color: "var(--ink-3)",
                    letterSpacing: ".1em",
                  }}>
                    {totalTime > 0 ? `${totalTime} MIN` : "—"}
                  </span>
                </div>
                <div style={{
                  fontFamily: "var(--font-fraunces, Georgia, serif)",
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                  color: "var(--ink)",
                  marginBottom: 6,
                }}>
                  {meal.name}
                </div>
                {meal.description && (
                  <div style={{ fontSize: 13, color: "var(--ink-2)", fontStyle: "italic" }}>
                    {meal.description}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
