import { redirect } from "next/navigation";
import { getSession } from "@/server/lib/auth";
import { getUserPreferences } from "@/server/queries/users";
import { RecipeEditor } from "@/components/my-recipes/RecipeEditor";

export default async function NewRecipePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const prefs = await getUserPreferences(session.user.id);
  if (!prefs) redirect("/onboarding");

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 56px 100px" }}>
        <RecipeEditor mode="create" />
      </div>
    </div>
  );
}
