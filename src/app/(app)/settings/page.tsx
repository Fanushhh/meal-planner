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
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Page header */}
      <div className="mx-auto max-w-[1400px] px-6 pb-8 pt-10">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--text-faint)" }}
          >
            Account
          </span>
          <span
            className="inline-block h-px w-8"
            style={{ background: "var(--border-subtle)" }}
          />
          <span
            className="text-[11px] font-medium uppercase tracking-[0.1em]"
            style={{ color: "var(--accent)", opacity: 0.85 }}
          >
            Preferences
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
          Settings
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Adjust how recipes are scaled for you.
        </p>

        {/* Gradient rule */}
        <div
          className="mt-8 h-px"
          style={{
            background:
              "linear-gradient(to right, var(--border), transparent 70%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[1400px] px-6 pb-16">
        <div className="max-w-2xl space-y-8">

          {/* Account identity card */}
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Accent top bar */}
            <div
              className="h-px w-full"
              style={{
                background:
                  "linear-gradient(to right, var(--accent), rgba(212,120,67,0.2) 55%, transparent)",
              }}
            />

            <div className="flex items-center justify-between gap-4 px-6 py-5">
              {/* Avatar + email */}
              <div className="flex items-center gap-4">
                {/* Monogram avatar */}
                <div
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 35%, rgba(212,120,67,0.22), rgba(212,120,67,0.06))",
                    border: "1px solid rgba(212,120,67,0.32)",
                    color: "var(--accent)",
                    fontFamily: "var(--font-dm-serif)",
                    boxShadow:
                      "0 0 0 4px rgba(212,120,67,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                >
                  {initials}
                </div>

                <div>
                  <p
                    className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: "var(--text-faint)" }}
                  >
                    Signed in as
                  </p>
                  <p
                    className="text-[15px] font-medium leading-snug"
                    style={{ color: "var(--text)" }}
                  >
                    {session.user.email}
                  </p>
                </div>
              </div>

              {/* Sign out */}
              <form action={logout} className="shrink-0">
                <button
                  type="submit"
                  className="rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all hover:bg-white/5 active:scale-95"
                  style={{
                    color: "var(--text-muted)",
                    border: "1px solid var(--border-bright)",
                    letterSpacing: "0.02em",
                  }}
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>

          {/* Preferences */}
          <SettingsForm initialNumPeople={prefs.numPeople} />
        </div>
      </div>
    </div>
  );
}
