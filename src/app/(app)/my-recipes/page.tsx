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
      <div className="mx-auto max-w-[1400px] px-6 pb-16">
        <MyRecipesClient recipes={recipes} meals={meals} />
      </div>
    </div>
  );
}
