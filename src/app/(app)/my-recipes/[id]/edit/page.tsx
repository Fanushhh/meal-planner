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
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 56px 100px" }}>
        <RecipeEditor mode="edit" initialData={recipe} />
      </div>
    </div>
  );
}
