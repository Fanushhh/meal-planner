import { db } from "@/server/db";
import { weeklyPlans, plannedMeals, meals, userRecipes } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type { WeeklyPlan } from "@/server/db/schema";

const now = () => Date.now();

export type PlanMealDisplay = {
  id: string;
  name: string;
  prepTimeMin: number | null;
  detailUrl: string;
  source: "meal" | "userRecipe";
};

export type PlannedMealWithMeal = {
  id: string;
  planId: string;
  mealId: string | null;
  userRecipeId: string | null;
  dayOfWeek: number;
  mealType: string;
  rerolledAt: number | null;
  meal: PlanMealDisplay;
};

export type WeeklyPlanWithMeals = WeeklyPlan & {
  plannedMeals: PlannedMealWithMeal[];
};

export async function getPlanForWeek(
  userId: string,
  weekStart: string
): Promise<WeeklyPlanWithMeals | null> {
  const planRows = await db
    .select()
    .from(weeklyPlans)
    .where(and(eq(weeklyPlans.userId, userId), eq(weeklyPlans.weekStart, weekStart)))
    .limit(1);

  const plan = planRows[0];
  if (!plan) return null;

  const rows = await db
    .select({ pm: plannedMeals, meal: meals, userRecipe: userRecipes })
    .from(plannedMeals)
    .leftJoin(meals, eq(plannedMeals.mealId, meals.id))
    .leftJoin(userRecipes, eq(plannedMeals.userRecipeId, userRecipes.id))
    .where(eq(plannedMeals.planId, plan.id));

  const resolved: PlannedMealWithMeal[] = [];
  for (const { pm, meal: m, userRecipe: ur } of rows) {
    let display: PlanMealDisplay | null = null;
    if (m) {
      display = {
        id: m.id,
        name: m.name,
        prepTimeMin: m.prepTimeMin ?? null,
        detailUrl: `/meals/${m.id}`,
        source: "meal",
      };
    } else if (ur) {
      display = {
        id: ur.id,
        name: ur.name,
        prepTimeMin: ur.prepTimeMin ?? null,
        detailUrl: `/my-recipes/${ur.id}`,
        source: "userRecipe",
      };
    }
    if (!display) continue;
    resolved.push({
      id: pm.id,
      planId: pm.planId,
      mealId: pm.mealId ?? null,
      userRecipeId: pm.userRecipeId ?? null,
      dayOfWeek: pm.dayOfWeek,
      mealType: pm.mealType,
      rerolledAt: pm.rerolledAt ?? null,
      meal: display,
    });
  }

  return { ...plan, plannedMeals: resolved };
}

export async function getOrCreatePlan(
  userId: string,
  weekStart: string
): Promise<WeeklyPlan> {
  const existing = await db
    .select()
    .from(weeklyPlans)
    .where(and(eq(weeklyPlans.userId, userId), eq(weeklyPlans.weekStart, weekStart)))
    .limit(1);
  if (existing[0]) return existing[0];

  const plan = { id: createId(), userId, weekStart, generatedAt: now() };
  await db.insert(weeklyPlans).values(plan);
  return plan;
}

export async function createWeeklyPlan(
  userId: string,
  weekStart: string,
  slots: Array<{ dayOfWeek: number; mealId: string; mealType: string }>
): Promise<WeeklyPlan> {
  const t = now();
  const plan = { id: createId(), userId, weekStart, generatedAt: t };
  await db.insert(weeklyPlans).values(plan);
  await db.insert(plannedMeals).values(
    slots.map((slot) => ({
      id: createId(),
      planId: plan.id,
      mealId: slot.mealId,
      userRecipeId: null,
      dayOfWeek: slot.dayOfWeek,
      mealType: slot.mealType,
      rerolledAt: null,
    }))
  );
  return plan;
}

export async function updatePlannedMeal(
  planId: string,
  dayOfWeek: number,
  mealType: string,
  newMealId: string
): Promise<void> {
  await db
    .update(plannedMeals)
    .set({ mealId: newMealId, userRecipeId: null, rerolledAt: now() })
    .where(
      and(
        eq(plannedMeals.planId, planId),
        eq(plannedMeals.dayOfWeek, dayOfWeek),
        eq(plannedMeals.mealType, mealType)
      )
    );
}

export async function upsertUserRecipeSlot(
  planId: string,
  dayOfWeek: number,
  mealType: string,
  userRecipeId: string
): Promise<void> {
  await db
    .insert(plannedMeals)
    .values({
      id: createId(),
      planId,
      mealId: null,
      userRecipeId,
      dayOfWeek,
      mealType,
      rerolledAt: null,
    })
    .onConflictDoUpdate({
      target: [plannedMeals.planId, plannedMeals.dayOfWeek, plannedMeals.mealType],
      set: { userRecipeId, mealId: null, rerolledAt: now() },
    });
}

export type ScheduledSlot = { dayOfWeek: number; mealType: string };

export async function getScheduledDaysForMeal(
  userId: string,
  weekStart: string,
  mealId: string
): Promise<ScheduledSlot[]> {
  const planRows = await db
    .select({ id: weeklyPlans.id })
    .from(weeklyPlans)
    .where(and(eq(weeklyPlans.userId, userId), eq(weeklyPlans.weekStart, weekStart)))
    .limit(1);

  if (!planRows[0]) return [];

  const rows = await db
    .select({ dayOfWeek: plannedMeals.dayOfWeek, mealType: plannedMeals.mealType })
    .from(plannedMeals)
    .where(
      and(
        eq(plannedMeals.planId, planRows[0].id),
        eq(plannedMeals.mealId, mealId)
      )
    );

  return rows;
}

export async function getScheduledDaysForRecipe(
  userId: string,
  weekStart: string,
  userRecipeId: string
): Promise<ScheduledSlot[]> {
  const planRows = await db
    .select({ id: weeklyPlans.id })
    .from(weeklyPlans)
    .where(and(eq(weeklyPlans.userId, userId), eq(weeklyPlans.weekStart, weekStart)))
    .limit(1);

  if (!planRows[0]) return [];

  const rows = await db
    .select({ dayOfWeek: plannedMeals.dayOfWeek, mealType: plannedMeals.mealType })
    .from(plannedMeals)
    .where(
      and(
        eq(plannedMeals.planId, planRows[0].id),
        eq(plannedMeals.userRecipeId, userRecipeId)
      )
    );

  return rows;
}

export async function getMealIdsInPlan(planId: string): Promise<string[]> {
  const rows = await db
    .select({ mealId: plannedMeals.mealId })
    .from(plannedMeals)
    .where(eq(plannedMeals.planId, planId));
  return rows.flatMap((r) => (r.mealId ? [r.mealId] : []));
}

export async function getMealIdsByTypeInPlan(
  planId: string,
  mealType: string
): Promise<string[]> {
  const rows = await db
    .select({ mealId: plannedMeals.mealId })
    .from(plannedMeals)
    .where(and(eq(plannedMeals.planId, planId), eq(plannedMeals.mealType, mealType)));
  return rows.flatMap((r) => (r.mealId ? [r.mealId] : []));
}

export async function deletePlanForWeek(
  userId: string,
  weekStart: string
): Promise<void> {
  await db
    .delete(weeklyPlans)
    .where(and(eq(weeklyPlans.userId, userId), eq(weeklyPlans.weekStart, weekStart)));
}

export type WeekSlot = {
  dayOfWeek: number;
  mealType: string;
  mealName: string;
  mealId: string | null;
  userRecipeId: string | null;
};

export async function getWeekSlots(
  userId: string,
  weekStart: string
): Promise<WeekSlot[]> {
  const planRows = await db
    .select({ id: weeklyPlans.id })
    .from(weeklyPlans)
    .where(and(eq(weeklyPlans.userId, userId), eq(weeklyPlans.weekStart, weekStart)))
    .limit(1);

  if (!planRows[0]) return [];

  const rows = await db
    .select({ pm: plannedMeals, meal: meals, userRecipe: userRecipes })
    .from(plannedMeals)
    .leftJoin(meals, eq(plannedMeals.mealId, meals.id))
    .leftJoin(userRecipes, eq(plannedMeals.userRecipeId, userRecipes.id))
    .where(eq(plannedMeals.planId, planRows[0].id));

  return rows.flatMap(({ pm, meal: m, userRecipe: ur }) => {
    const name = m?.name ?? ur?.name;
    if (!name) return [];
    return [{
      dayOfWeek: pm.dayOfWeek,
      mealType: pm.mealType,
      mealName: name,
      mealId: pm.mealId ?? null,
      userRecipeId: pm.userRecipeId ?? null,
    }];
  });
}

export async function upsertMealSlot(
  planId: string,
  dayOfWeek: number,
  mealType: string,
  mealId: string
): Promise<void> {
  await db
    .insert(plannedMeals)
    .values({
      id: createId(),
      planId,
      mealId,
      userRecipeId: null,
      dayOfWeek,
      mealType,
      rerolledAt: null,
    })
    .onConflictDoUpdate({
      target: [plannedMeals.planId, plannedMeals.dayOfWeek, plannedMeals.mealType],
      set: { mealId, userRecipeId: null, rerolledAt: now() },
    });
}

export async function removePlannedMeal(
  planId: string,
  dayOfWeek: number,
  mealType: string,
  userId: string
): Promise<void> {
  const planRows = await db
    .select({ id: weeklyPlans.id })
    .from(weeklyPlans)
    .where(and(eq(weeklyPlans.id, planId), eq(weeklyPlans.userId, userId)))
    .limit(1);

  if (!planRows[0]) return;

  await db
    .delete(plannedMeals)
    .where(
      and(
        eq(plannedMeals.planId, planId),
        eq(plannedMeals.dayOfWeek, dayOfWeek),
        eq(plannedMeals.mealType, mealType)
      )
    );
}
