import { redirect } from "next/navigation";
import { getSession } from "@/server/lib/auth";
import { getUserPreferences } from "@/server/queries/users";
import { SettingsForm } from "@/components/onboarding/SettingsForm";
import { logout } from "@/server/actions/auth";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const prefs = await getUserPreferences(session.user.id);
  if (!prefs) redirect("/onboarding");

  const initials = session.user.email[0].toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <div className="settings-pad" style={{ maxWidth: 860, margin: "0 auto", padding: "48px 56px 100px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span className="small-caps">Account</span>
          <span style={{ display: "inline-block", height: 1, width: 32, background: "var(--rule-2)" }} />
          <span className="small-caps" style={{ color: "var(--accent)" }}>Preferences</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "var(--font-fraunces, Georgia, serif)",
          fontSize: "clamp(36px, 4vw, 56px)",
          fontWeight: 500,
          fontStyle: "italic",
          letterSpacing: "-0.02em",
          color: "var(--ink)",
          margin: "0 0 40px",
        }}>
          Settings
        </h1>

        {/* Account section */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 10,
          }}>
            <div style={{
              fontFamily: "var(--font-fraunces, Georgia, serif)",
              fontSize: 20,
              fontStyle: "italic",
              fontWeight: 500,
              color: "var(--ink)",
            }}>
              Your account
            </div>
          </div>
          <div className="rule" style={{ marginBottom: 20 }} />

          <div className="settings-account-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Monogram */}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "radial-gradient(circle at 35% 35%, rgba(166,58,31,0.18), rgba(166,58,31,0.05))",
                border: "1px solid rgba(166,58,31,0.28)",
                color: "var(--accent)",
                fontFamily: "var(--font-fraunces, Georgia, serif)",
                fontSize: 18,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div>
                <div className="small-caps" style={{ marginBottom: 3 }}>Signed in as</div>
                <div style={{
                  fontFamily: "var(--font-newsreader, Georgia, serif)",
                  fontSize: 16,
                  color: "var(--ink)",
                }}>
                  {session.user.email}
                </div>
              </div>
            </div>

            <form action={logout}>
              <button type="submit" className="btn btn-ghost">
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Preferences */}
        <SettingsForm initialNumPeople={prefs.numPeople} />
      </div>
    </div>
  );
}
