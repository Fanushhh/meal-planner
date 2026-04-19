import { notFound } from "next/navigation";
import Link from "next/link";
import { getMealById } from "@/server/queries/meals";
import { getSession } from "@/server/lib/auth";
import { getUserPreferences } from "@/server/queries/users";
import { IngredientsPanel } from "@/components/meals/IngredientsPanel";
import { getWeekSlots } from "@/server/queries/plans";
import { getWeekStart, getDayName, getTodayIndex } from "@/server/lib/date";
import { AddToPlanWidget } from "@/components/meal-plan/AddToPlanWidget";

interface Props {
  params: Promise<{ id: string }>;
}

const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV"];
function toRoman(n: number) { return ROMAN[n - 1] ?? String(n); }

export default async function RecipePage({ params }: Props) {
  const { id } = await params;

  const [meal, session] = await Promise.all([getMealById(id), getSession()]);
  if (!meal) notFound();

  const prefs = session ? await getUserPreferences(session.user.id) : null;
  const numPeople = prefs?.numPeople ?? meal.servings;
  const scale = numPeople / meal.servings;
  const servingsLabel = numPeople === 1 ? "1 serving" : `${numPeople} servings`;

  const weekStart = getWeekStart();
  const todayIndex = getTodayIndex();
  const weekSlots = session ? await getWeekSlots(session.user.id, weekStart) : [];

  const weekDate = new Date(weekStart + "T00:00:00Z");
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekDate);
    d.setUTCDate(d.getUTCDate() + i);
    return `${getDayName(i).slice(0, 3)} ${d.getUTCDate()}`;
  });

  const totalTime = (meal.prepTimeMin ?? 0) + (meal.cookTimeMin ?? 0);

  const scaledIngredients = meal.ingredients.map((ing) => ({
    name: ing.name,
    quantity: ing.quantity !== null ? ing.quantity * scale : null,
    unit: ing.unit ?? null,
    note: ing.note,
    sources: [meal.name],
  }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <div className="recipe-pad" style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 56px 100px" }}>

        {/* Back link + action row */}
        <div className="recipe-back-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <Link
            href="/dashboard"
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
            ← back to the week
          </Link>

          {session && (
            <AddToPlanWidget
              source="meal"
              recipeId={meal.id}
              mealType={meal.mealType ?? "lunch"}
              weekStart={weekStart}
              weekDays={weekDays}
              todayIndex={todayIndex}
              weekSlots={weekSlots}
            />
          )}
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
            Recipe № {meal.id.toUpperCase()}
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
          {meal.name}
        </h1>

        {meal.description && (
          <p style={{
            textAlign: "center",
            color: "var(--ink-2)",
            fontSize: 15,
            fontStyle: "italic",
            marginBottom: 10,
          }}>
            {meal.description}
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
            { k: "Course",      v: (meal.mealType ?? "lunch")[0].toUpperCase() + (meal.mealType ?? "lunch").slice(1) },
            { k: "Ingredients", v: String(meal.ingredients.length).padStart(2, "0") },
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

          {/* Ingredients */}
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

          {/* Instructions */}
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
              {meal.instructions.map((step, i) => (
                <li key={i} style={{
                  display: "flex",
                  gap: 20,
                  padding: "14px 0",
                  borderBottom: i === meal.instructions.length - 1 ? "none" : "1px solid var(--rule-2)",
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
                  <p style={{
                    fontSize: 16,
                    lineHeight: 1.55,
                    color: "var(--ink)",
                    flex: 1,
                    margin: 0,
                  }}>
                    {step}
                  </p>
                </li>
              ))}
            </ol>

            {/* Pull quote */}
            <div style={{
              marginTop: 40,
              padding: "24px 0",
              borderTop: "1px solid var(--rule)",
              borderBottom: "1px solid var(--rule)",
              textAlign: "center",
            }}>
              <div style={{
                fontFamily: "var(--font-fraunces, Georgia, serif)",
                fontSize: 20,
                fontStyle: "italic",
                color: "var(--ink-2)",
              }}>
                "Cook with care, taste as you go, and season more generously than you think."
              </div>
              <div style={{
                fontFamily: "var(--font-jetbrains, monospace)",
                fontSize: 10,
                color: "var(--ink-3)",
                letterSpacing: ".2em",
                textTransform: "uppercase",
                marginTop: 10,
              }}>
                — From the house kitchen
              </div>
            </div>
          </div>

        </div>

        <div style={{ textAlign: "center", marginTop: 64 }}>
          <span className="flourish">— fin —</span>
        </div>

      </div>
    </div>
  );
}
