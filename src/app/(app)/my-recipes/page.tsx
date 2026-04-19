import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/server/lib/auth";
import { getUserPreferences } from "@/server/queries/users";
import { getUserRecipes } from "@/server/queries/userRecipes";
import { getAllMeals } from "@/server/queries/meals";
import { MyRecipesClient } from "@/components/my-recipes/MyRecipesClient";

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
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "52px 40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ textAlign: "left", marginBottom: 4 }}>
              <span style={{
                fontFamily: "var(--font-fraunces, Georgia, serif)",
                fontStyle: "italic",
                fontWeight: 400,
                color: "var(--ink-3)",
                fontSize: 14,
                letterSpacing: ".06em",
              }}>
                Chapter III
              </span>
            </div>
            <h1 style={{
              fontFamily: "var(--font-fraunces, Georgia, serif)",
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 500,
              margin: "4px 0 0",
              letterSpacing: "-0.02em",
              fontStyle: "italic",
              color: "var(--ink)",
            }}>
              The Pantry of Recipes
            </h1>
          </div>

          <Link
            href="/my-recipes/new"
            style={{
              border: "1px solid var(--accent)",
              padding: "9px 16px",
              fontFamily: "var(--font-jetbrains, monospace)",
              fontSize: 11,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              background: "var(--accent)",
              color: "#fff4e2",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              transition: "all .15s",
              flexShrink: 0,
              marginTop: 16,
            }}
          >
            + Write a new recipe
          </Link>
        </div>

        {/* Rule */}
        <div style={{ height: 1, background: "var(--rule)", marginBottom: 32 }} />
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 40px 80px" }}>
        <MyRecipesClient recipes={recipes} meals={meals} />
      </div>
    </div>
  );
}
