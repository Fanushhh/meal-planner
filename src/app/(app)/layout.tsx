import { redirect } from "next/navigation";
import { getSession } from "@/server/lib/auth";
import { getUserPreferences } from "@/server/queries/users";
import { Header } from "@/components/layout/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const prefs = await getUserPreferences(session.user.id);
  const isOnboarding = !prefs?.onboardingCompleted;

  // Allow access to /onboarding without completing it
  // The individual page handles the onboarding guard via the middleware

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {!isOnboarding && <Header />}
      <main>{children}</main>
    </div>
  );
}
