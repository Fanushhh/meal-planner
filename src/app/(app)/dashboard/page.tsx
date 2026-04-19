import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/server/lib/auth";
import { getUserPreferences } from "@/server/queries/users";
import { getOrGeneratePlan } from "@/server/actions/meal-plan";
import { WeeklyPlanGrid } from "@/components/meal-plan/WeeklyPlanGrid";
import { DashboardActions } from "@/components/meal-plan/DashboardActions";
import { WeekViewPersist } from "@/components/meal-plan/WeekViewPersist";
import { getWeekStart, offsetWeek } from "@/server/lib/date";
import Link from "next/link";

function getTodayDayIndex(): number {
  const day = new Date().getUTCDay(); // 0=Sun
  return day === 0 ? 6 : day - 1; // 0=Mon … 6=Sun
}

function parseWeekParam(param: string | undefined): string {
  if (!param || !/^\d{4}-\d{2}-\d{2}$/.test(param)) return getWeekStart();
  // Snap to the Monday of whatever week the param falls in
  return getWeekStart(new Date(param + "T00:00:00Z"));
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const prefs = await getUserPreferences(session.user.id);
  if (!prefs?.onboardingCompleted) redirect("/onboarding");

  const { week: weekParam } = await searchParams;
  const weekStart = parseWeekParam(weekParam);
  const currentWeekStart = getWeekStart();
  const isCurrentWeek = weekStart === currentWeekStart;

  const plan = await getOrGeneratePlan(weekStart);
  const todayIndex = isCurrentWeek ? getTodayDayIndex() : -1;

  const weekDate = new Date(weekStart + "T00:00:00Z");
  const weekEnd = new Date(weekDate);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayName = dayNames[getTodayDayIndex()] ?? "Today";

  const prevWeek = offsetWeek(weekStart, -1);
  const nextWeek = offsetWeek(weekStart, 1);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Suspense>
        <WeekViewPersist weekStart={weekStart} currentWeekStart={currentWeekStart} />
      </Suspense>
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
              {isCurrentWeek ? (
                <span
                  className="text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ color: "var(--accent)", opacity: 0.85 }}
                >
                  {todayName} · Today
                </span>
              ) : (
                <Link
                  href="/dashboard"
                  className="text-[11px] font-medium uppercase tracking-[0.1em] hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-faint)", opacity: 0.7 }}
                >
                  ← This week
                </Link>
              )}
            </div>

            {/* Date range + prev/next navigation */}
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard?week=${prevWeek}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all hover:bg-white/5"
                style={{ border: "1px solid var(--border-bright)", color: "var(--text-muted)" }}
                aria-label="Previous week"
              >
                <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 1L1 6l5 5" />
                </svg>
              </Link>

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

              <Link
                href={`/dashboard?week=${nextWeek}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all hover:bg-white/5"
                style={{ border: "1px solid var(--border-bright)", color: "var(--text-muted)" }}
                aria-label="Next week"
              >
                <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 1l5 5-5 5" />
                </svg>
              </Link>
            </div>
          </div>

          {plan && <DashboardActions weekStart={weekStart} />}
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
            weekStart={weekStart}
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
