import { redirect } from "next/navigation";
import { getSession } from "@/server/lib/auth";
import { getUserPreferences } from "@/server/queries/users";
import { getOrGeneratePlan } from "@/server/actions/meal-plan";
import { WeeklyPlanGrid } from "@/components/meal-plan/WeeklyPlanGrid";
import { DashboardActions } from "@/components/meal-plan/DashboardActions";
import { getWeekStart } from "@/server/lib/date";
import Link from "next/link";

function getTodayDayIndex(): number {
  const day = new Date().getUTCDay(); // 0=Sun
  return day === 0 ? 6 : day - 1; // 0=Mon … 6=Sun
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const prefs = await getUserPreferences(session.user.id);
  if (!prefs?.onboardingCompleted) redirect("/onboarding");

  const plan = await getOrGeneratePlan();
  const todayIndex = getTodayDayIndex();

  const weekStart = getWeekStart();
  const weekDate = new Date(weekStart + "T00:00:00Z");
  const weekEnd = new Date(weekDate);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayName = dayNames[todayIndex];

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
                Weekly Plan
              </span>
              <span
                className="h-px flex-1"
                style={{ background: "var(--border-subtle)", display: "inline-block", width: "32px" }}
              />
              <span
                className="text-[11px] font-medium uppercase tracking-[0.1em]"
                style={{ color: "var(--accent)", opacity: 0.85 }}
              >
                {todayName} · Today
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
              {fmt(weekDate)}
              <span style={{ color: "var(--text-faint)", margin: "0 10px", fontStyle: "normal" }}>–</span>
              {fmt(weekEnd)}
            </h1>
          </div>

          {plan && <DashboardActions />}
        </div>

        {/* Gradient rule */}
        <div
          className="mt-8 h-px"
          style={{
            background: "linear-gradient(to right, var(--border), transparent 70%)",
          }}
        />
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-[1400px] px-6 pb-12">
        {plan ? (
          <WeeklyPlanGrid
            plan={plan}
            todayIndex={todayIndex}
          />
        ) : (
          <div
            className="rounded-2xl p-16 text-center"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="text-3xl mb-3" aria-hidden>🥗</p>
            <p
              className="mb-2 text-lg"
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontStyle: "italic",
                color: "var(--text)",
              }}
            >
              No meals planned yet
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Add recipes from{" "}
              <Link
                href="/my-recipes"
                style={{ color: "var(--accent)" }}
                className="hover:underline"
              >
                My Recipes
              </Link>{" "}
              to fill your week.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
