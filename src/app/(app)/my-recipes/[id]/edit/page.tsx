import { notFound, redirect } from "next/navigation";
import { getSession } from "@/server/lib/auth";
import { getUserPreferences } from "@/server/queries/users";
import { getUserRecipeById } from "@/server/queries/userRecipes";
import { RecipeEditor } from "@/components/my-recipes/RecipeEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;

  const session = await getSession();
  if (!session) redirect("/login");

  const [recipe, prefs] = await Promise.all([
    getUserRecipeById(id, session.user.id),
    getUserPreferences(session.user.id),
  ]);
  if (!recipe) notFound();
  if (!prefs) redirect("/onboarding");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-[1400px] px-6 pb-8 pt-10">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--text-faint)" }}
          >
            My Recipes
          </span>
          <span
            className="inline-block h-px w-8"
            style={{ background: "var(--border-subtle)" }}
          />
          <span
            className="text-[11px] font-medium uppercase tracking-[0.1em]"
            style={{ color: "var(--accent)", opacity: 0.85 }}
          >
            Edit recipe
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
          Edit Recipe
        </h1>

        <div
          className="mt-8 h-px"
          style={{ background: "linear-gradient(to right, var(--border), transparent 70%)" }}
        />
      </div>

      <div className="mx-auto max-w-[1400px] px-6 pb-16">
        <div className="max-w-2xl">
          <RecipeEditor mode="edit" initialData={recipe} />
        </div>
      </div>
    </div>
  );
}
