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

const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV"];
function toRoman(n: number) { return ROMAN[n - 1] ?? String(n); }

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
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <div className="recipe-pad" style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 56px 100px" }}>

        {/* Back link + actions row */}
        <div className="recipe-back-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <Link
            href="/my-recipes"
            style={{
              fontFamily: "var(--font-jetbrains, monospace)",
              fontSize: 11,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              color: "var(--ink-2)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ← back to the pantry
          </Link>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <AddToPlanWidget
              source="userRecipe"
              recipeId={recipe.id}
              mealType={recipe.mealType ?? "lunch"}
              weekStart={weekStart}
              weekDays={weekDays}
              todayIndex={todayIndex}
              weekSlots={weekSlots}
            />
            <Link href={`/my-recipes/${recipe.id}/edit`} className="btn btn-ghost">
              Edit
            </Link>
            <MyRecipeDeleteButton id={recipe.id} label="Delete" />
          </div>
        </div>

        {/* Title block */}
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <span style={{
            fontFamily: "var(--font-fraunces, Georgia, serif)",
            fontStyle: "italic",
            fontWeight: 400,
            color: "var(--ink-3)",
            fontSize: 14,
            letterSpacing: ".06em",
          }}>
            My Recipe
          </span>
        </div>

        <h1 style={{
          fontFamily: "var(--font-fraunces, Georgia, serif)",
          textAlign: "center",
          fontSize: "clamp(40px, 6vw, 72px)",
          fontWeight: 500,
          margin: "8px 0 6px",
          letterSpacing: "-0.02em",
          fontStyle: "italic",
          lineHeight: 1,
          color: "var(--ink)",
        }}>
          {recipe.name}
        </h1>

        {recipe.description && (
          <p style={{
            textAlign: "center",
            color: "var(--ink-2)",
            fontSize: 15,
            fontStyle: "italic",
            marginBottom: 10,
          }}>
            {recipe.description}
          </p>
        )}

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span className="flourish">✦ ❖ ✦</span>
        </div>

        {/* Meta strip */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          borderTop: "1px solid var(--rule)",
          borderBottom: "1px solid var(--rule)",
          padding: "18px 0",
          marginBottom: 52,
        }} className="recipe-meta-strip">
          {[
            { k: "Time",        v: totalTime > 0 ? `${totalTime} min` : "—" },
            { k: "Course",      v: (recipe.mealType ?? "lunch")[0].toUpperCase() + (recipe.mealType ?? "lunch").slice(1) },
            { k: "Ingredients", v: String(recipe.ingredients.length).padStart(2, "0") },
            { k: "Serves",      v: servingsLabel },
          ].map((row) => (
            <div key={row.k} style={{
              textAlign: "center",
              borderLeft: "1px solid var(--rule-2)",
              padding: "0 12px",
            }}>
              <div style={{
                fontFamily: "var(--font-jetbrains, monospace)",
                letterSpacing: ".18em",
                textTransform: "uppercase",
                fontSize: 11,
                color: "var(--ink-3)",
                marginBottom: 4,
              }}>
                {row.k}
              </div>
              <div style={{
                fontFamily: "var(--font-fraunces, Georgia, serif)",
                fontSize: 24,
                fontStyle: "italic",
                fontWeight: 500,
                color: "var(--ink)",
              }}>
                {row.v}
              </div>
            </div>
          ))}
        </div>

        {/* Two-column: ingredients + instructions */}
        <div className="recipe-two-col" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.4fr", gap: 72 }}>

          <div>
            <div style={{
              fontFamily: "var(--font-fraunces, Georgia, serif)",
              fontStyle: "italic",
              fontWeight: 400,
              color: "var(--ink-3)",
              fontSize: 14,
              letterSpacing: ".06em",
              marginBottom: 4,
            }}>
              I.
            </div>
            <h2 style={{
              fontFamily: "var(--font-fraunces, Georgia, serif)",
              fontSize: 30,
              fontWeight: 500,
              fontStyle: "italic",
              margin: "0 0 16px",
              letterSpacing: "-0.01em",
              color: "var(--ink)",
            }}>
              What you need
            </h2>
            <div style={{ height: 1, background: "var(--rule)", marginBottom: 16 }} />
            <IngredientsPanel ingredients={scaledIngredients} />
          </div>

          <div>
            <div style={{
              fontFamily: "var(--font-fraunces, Georgia, serif)",
              fontStyle: "italic",
              fontWeight: 400,
              color: "var(--ink-3)",
              fontSize: 14,
              letterSpacing: ".06em",
              marginBottom: 4,
            }}>
              II.
            </div>
            <h2 style={{
              fontFamily: "var(--font-fraunces, Georgia, serif)",
              fontSize: 30,
              fontWeight: 500,
              fontStyle: "italic",
              margin: "0 0 16px",
              letterSpacing: "-0.01em",
              color: "var(--ink)",
            }}>
              The method
            </h2>
            <div style={{ height: 1, background: "var(--rule)", marginBottom: 20 }} />
            <ol style={{ padding: 0, margin: 0, listStyle: "none" }}>
              {recipe.instructions.map((step, i) => (
                <li key={i} style={{
                  display: "flex",
                  gap: 20,
                  padding: "14px 0",
                  borderBottom: i === recipe.instructions.length - 1 ? "none" : "1px solid var(--rule-2)",
                }}>
                  <div style={{
                    fontFamily: "var(--font-fraunces, Georgia, serif)",
                    fontSize: 36,
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "var(--accent)",
                    lineHeight: 1,
                    minWidth: 44,
                  }}>
                    {toRoman(i + 1)}.
                  </div>
                  <p style={{ fontSize: 16, lineHeight: 1.55, color: "var(--ink)", flex: 1, margin: 0 }}>
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>

        </div>

        <div style={{ textAlign: "center", marginTop: 64 }}>
          <span className="flourish">— fin —</span>
        </div>

      </div>
    </div>
  );
}
