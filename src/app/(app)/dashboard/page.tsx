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
  const day = new Date().getUTCDay();
  return day === 0 ? 6 : day - 1;
}

function parseWeekParam(param: string | undefined): string {
  if (!param || !/^\d{4}-\d{2}-\d{2}$/.test(param)) return getWeekStart();
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

  const fmtShort = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const fmtLong = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });

  const weekLabel =
    isCurrentWeek ? "This week"
    : weekStart === offsetWeek(currentWeekStart, 1) ? "Next week"
    : weekStart === offsetWeek(currentWeekStart, -1) ? "Last week"
    : fmtShort(weekDate) + " – " + fmtShort(weekEnd);

  const prevWeek = offsetWeek(weekStart, -1);
  const nextWeek = offsetWeek(weekStart, 1);

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <Suspense>
        <WeekViewPersist weekStart={weekStart} currentWeekStart={currentWeekStart} />
      </Suspense>

      {/* ── Cookbook header banner ── */}
      <div className="dash-pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "52px 40px 0" }}>
        {/* Chapter label */}
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <span style={{
            fontFamily: "var(--font-fraunces, Georgia, serif)",
            fontStyle: "italic",
            fontWeight: 400,
            color: "var(--ink-3)",
            fontSize: 14,
            letterSpacing: ".06em",
          }}>
            Chapter I
          </span>
        </div>

        {/* Main title */}
        <h1 style={{
          fontFamily: "var(--font-fraunces, Georgia, serif)",
          textAlign: "center",
          fontSize: "clamp(56px, 8vw, 96px)",
          fontWeight: 500,
          margin: "0 0 6px",
          letterSpacing: "-0.03em",
          fontStyle: "italic",
          lineHeight: 0.95,
          color: "var(--ink)",
        }}>
          The Week Ahead
        </h1>

        {/* Flourish */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span className="flourish">— carefully chosen —</span>
        </div>

        {/* Week nav + actions row */}
        <div className="dash-nav-row" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid var(--rule)",
          borderBottom: "1px solid var(--rule)",
          padding: "14px 4px",
          marginBottom: 32,
        }}>
          {/* Week navigation */}
          <div className="dash-nav-left" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Link
              href={`/dashboard?week=${prevWeek}`}
              style={{
                fontFamily: "var(--font-jetbrains, monospace)",
                fontSize: 11,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--ink-2)",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              ← Prev
            </Link>

            <div className="dash-nav-center" style={{ minWidth: 240, textAlign: "center" }}>
              <div style={{
                fontFamily: "var(--font-fraunces, Georgia, serif)",
                fontSize: 20,
                fontStyle: "italic",
                fontWeight: 500,
                color: "var(--ink)",
              }}>
                {fmtLong(weekDate)} – {fmtLong(weekEnd)}
              </div>
              <div style={{
                fontFamily: "var(--font-jetbrains, monospace)",
                fontSize: 9,
                letterSpacing: ".22em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginTop: 2,
              }}>
                {weekLabel}
              </div>
            </div>

            <Link
              href={`/dashboard?week=${nextWeek}`}
              style={{
                fontFamily: "var(--font-jetbrains, monospace)",
                fontSize: 11,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--ink-2)",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              Next →
            </Link>
          </div>

          {/* Action buttons */}
          {plan && <div className="dash-actions-wrap" style={{ display: "flex", justifyContent: "flex-end" }}><DashboardActions weekStart={weekStart} /></div>}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="dash-grid-pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 40px 80px" }}>
        {plan ? (
          <div style={{
            border: "1px solid var(--rule)",
            boxShadow: "var(--shadow)",
            background: "var(--paper)",
          }}>
            <WeeklyPlanGrid plan={plan} todayIndex={todayIndex} weekStart={weekStart} />
          </div>
        ) : (
          <div style={{
            padding: "64px 40px",
            textAlign: "center",
            border: "1px solid var(--rule)",
          }}>
            <p style={{
              fontFamily: "var(--font-fraunces, Georgia, serif)",
              fontStyle: "italic",
              fontSize: 24,
              color: "var(--ink-2)",
              marginBottom: 8,
            }}>
              No meals planned yet
            </p>
            <p style={{ fontSize: 15, color: "var(--ink-3)" }}>
              Add recipes from{" "}
              <Link href="/my-recipes" style={{ color: "var(--accent)" }}>
                My Recipes
              </Link>{" "}
              to fill your week.
            </p>
          </div>
        )}

        {/* Footer note */}
        <div className="dash-footer" style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "18px 4px 0",
          color: "var(--ink-3)",
          fontSize: 13,
          fontStyle: "italic",
        }}>
          <span>Hover a meal to reroll or remove it.</span>
          <span style={{
            fontFamily: "var(--font-jetbrains, monospace)",
            fontSize: 10,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            fontStyle: "normal",
          }}>
            pg. I
          </span>
        </div>
      </div>
    </div>
  );
}
