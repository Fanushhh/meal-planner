import { redirect } from "next/navigation";
import { getSession } from "@/server/lib/auth";
import { getUserPreferences } from "@/server/queries/users";
import { ShoppingListClient } from "@/components/shopping-list/ShoppingListClient";

export default async function ShoppingListPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const prefs = await getUserPreferences(session.user.id);
  if (!prefs?.onboardingCompleted) redirect("/onboarding");

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {/* Cookbook header */}
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "52px 40px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <span style={{
            fontFamily: "var(--font-fraunces, Georgia, serif)",
            fontStyle: "italic",
            fontWeight: 400,
            color: "var(--ink-3)",
            fontSize: 14,
            letterSpacing: ".06em",
          }}>
            Chapter II
          </span>
        </div>

        <h1 style={{
          fontFamily: "var(--font-fraunces, Georgia, serif)",
          textAlign: "center",
          fontSize: "clamp(48px, 6vw, 72px)",
          fontWeight: 500,
          margin: "4px 0 6px",
          letterSpacing: "-0.02em",
          fontStyle: "italic",
          color: "var(--ink)",
        }}>
          The Market List
        </h1>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span className="flourish">✦ ❖ ✦</span>
        </div>
      </div>

      {/* List */}
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 40px 80px" }}>
        <ShoppingListClient />
      </div>
    </div>
  );
}
