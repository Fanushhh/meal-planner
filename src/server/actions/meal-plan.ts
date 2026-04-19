"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/server/lib/auth";
import { getWeekStart, getTodayIndex } from "@/server/lib/date";
import { getAllMeals } from "@/server/queries/meals";
import { db } from "@/server/db";
import { meals, userRecipes, weeklyPlans } from "@/server/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { getUserPreferences } from "@/server/queries/users";
import type { AddableItem } from "@/lib/shopping-list-utils";
import {
  getPlanForWeek,
  createWeeklyPlan,
  updatePlannedMeal,
  getMealIdsInPlan,
  getMealIdsByTypeInPlan,
  getOrCreatePlan,
  getWeekSlots,
  upsertUserRecipeSlot,
  upsertMealSlot,
  removePlannedMeal,
  deletePlanForWeek,
} from "@/server/queries/plans";
import { getUserRecipeById } from "@/server/queries/userRecipes";
import { generateWeeklyPlan, pickRerollMeal } from "@/server/lib/meal-generator";
import type { WeeklyPlanWithMeals, WeekSlot } from "@/server/queries/plans";
import type { MealType } from "@/server/db/schema";

export async function getOrGeneratePlan(weekStart?: string): Promise<WeeklyPlanWithMeals | null> {
  const session = await getSession();
  if (!session) return null;

  const ws = weekStart ?? getWeekStart();
  const existing = await getPlanForWeek(session.user.id, ws);
  if (existing) return existing;

  const allMeals = await getAllMeals();
  const slots = generateWeeklyPlan(allMeals);

  if (slots.length === 0) return null;

  await createWeeklyPlan(session.user.id, ws, slots);
  return getPlanForWeek(session.user.id, ws);
}

export type RerollResult = { error: string } | { success: true };

export async function rerollMeal(
  planId: string,
  dayOfWeek: number,
  mealType: string,
  currentMealId: string
): Promise<RerollResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  // Verify the plan belongs to the current user by planId+userId (works for any week)
  const planRows = await db
    .select({ id: weeklyPlans.id })
    .from(weeklyPlans)
    .where(and(eq(weeklyPlans.id, planId), eq(weeklyPlans.userId, session.user.id)))
    .limit(1);
  if (!planRows[0]) return { error: "Plan not found." };

  const allMeals = await getAllMeals();
  const planMealIds = await getMealIdsByTypeInPlan(planId, mealType);

  const newMeal = pickRerollMeal(allMeals, mealType as MealType, currentMealId, planMealIds);
  if (!newMeal) return { error: "No alternative meals available." };

  await updatePlannedMeal(planId, dayOfWeek, mealType, newMeal.id);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function removePlannedMealAction(
  planId: string,
  dayOfWeek: number,
  mealType: string
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  await removePlannedMeal(planId, dayOfWeek, mealType, session.user.id);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function regeneratePlan(weekStart?: string): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const ws = weekStart ?? getWeekStart();
  await deletePlanForWeek(session.user.id, ws);

  const allMeals = await getAllMeals();
  const slots = generateWeeklyPlan(allMeals);
  if (slots.length > 0) {
    await createWeeklyPlan(session.user.id, ws, slots);
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export type PlanIngredients = {
  items: AddableItem[];
};

export async function getPlanIngredients(weekStart?: string): Promise<PlanIngredients> {
  const session = await getSession();
  if (!session) return { items: [] };

  const ws = weekStart ?? getWeekStart();
  const plan = await getPlanForWeek(session.user.id, ws);
  if (!plan) return { items: [] };

  const prefs = await getUserPreferences(session.user.id);
  const numPeople = prefs?.numPeople ?? 2;

  type Ingredient = { quantity: number | null; unit: string | null; name: string; note?: string };

  // For the current week, skip days that have already passed.
  // For other weeks, include all days.
  const currentWeekStart = getWeekStart();
  const todayIndex = ws === currentWeekStart ? getTodayIndex() : -1;
  const mealCounts = new Map<string, number>();
  const recipeCounts = new Map<string, number>();
  for (const pm of plan.plannedMeals) {
    if (todayIndex >= 0 && pm.dayOfWeek < todayIndex) continue;
    if (pm.mealId) mealCounts.set(pm.mealId, (mealCounts.get(pm.mealId) ?? 0) + 1);
    if (pm.userRecipeId) recipeCounts.set(pm.userRecipeId, (recipeCounts.get(pm.userRecipeId) ?? 0) + 1);
  }

  const uniqueMealIds = [...mealCounts.keys()];
  const uniqueRecipeIds = [...recipeCounts.keys()];

  const [mealRows, recipeRows] = await Promise.all([
    uniqueMealIds.length > 0 ? db.select().from(meals).where(inArray(meals.id, uniqueMealIds)) : [],
    uniqueRecipeIds.length > 0 ? db.select().from(userRecipes).where(inArray(userRecipes.id, uniqueRecipeIds)) : [],
  ]);

  const items: AddableItem[] = [];

  for (const row of [...mealRows, ...recipeRows]) {
    const occurrences = mealCounts.get(row.id) ?? recipeCounts.get(row.id) ?? 1;
    const scale = (numPeople / (row.servings ?? 1)) * occurrences;
    const ingredients = JSON.parse(row.ingredients) as Ingredient[];
    for (const ing of ingredients) {
      items.push({
        name: ing.name,
        quantity: ing.quantity !== null ? Math.round(ing.quantity * scale * 100) / 100 : null,
        unit: ing.unit ?? null,
        note: ing.note,
      });
    }
  }

  return { items };
}

export async function getWeekSlotsAction(weekStart: string): Promise<WeekSlot[]> {
  const session = await getSession();
  if (!session) return [];
  return getWeekSlots(session.user.id, weekStart);
}

export async function addMealToPlanAction(
  mealId: string,
  dayOfWeek: number,
  mealType: string,
  weekStart?: string
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const mealRows = await db.select({ id: meals.id }).from(meals).where(eq(meals.id, mealId)).limit(1);
  if (!mealRows[0]) return { error: "Meal not found." };

  const ws = weekStart ?? getWeekStart();
  const plan = await getOrCreatePlan(session.user.id, ws);
  await upsertMealSlot(plan.id, dayOfWeek, mealType, mealId);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function addUserRecipeToPlanAction(
  recipeId: string,
  dayOfWeek: number,
  mealType: string,
  weekStart?: string
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const recipe = await getUserRecipeById(recipeId, session.user.id);
  if (!recipe) return { error: "Recipe not found." };

  const ws = weekStart ?? getWeekStart();
  const plan = await getOrCreatePlan(session.user.id, ws);
  await upsertUserRecipeSlot(plan.id, dayOfWeek, mealType, recipeId);
  revalidatePath("/dashboard");

  return { success: true };
}
