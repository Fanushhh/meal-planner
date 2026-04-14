"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/server/lib/auth";
import { getWeekStart } from "@/server/lib/date";
import { getAllMeals } from "@/server/queries/meals";
import { db } from "@/server/db";
import { meals, userRecipes } from "@/server/db/schema";
import { inArray } from "drizzle-orm";
import { getUserPreferences } from "@/server/queries/users";
import type { AddableItem } from "@/lib/shopping-list-utils";
import {
  getPlanForWeek,
  createWeeklyPlan,
  updatePlannedMeal,
  getMealIdsInPlan,
  getMealIdsByTypeInPlan,
  getOrCreatePlan,
  upsertUserRecipeSlot,
  removePlannedMeal,
  deletePlanForWeek,
} from "@/server/queries/plans";
import { getUserRecipeById } from "@/server/queries/userRecipes";
import { generateWeeklyPlan, pickRerollMeal } from "@/server/lib/meal-generator";
import type { WeeklyPlanWithMeals } from "@/server/queries/plans";
import type { MealType } from "@/server/db/schema";

export async function getOrGeneratePlan(): Promise<WeeklyPlanWithMeals | null> {
  const session = await getSession();
  if (!session) return null;

  const weekStart = getWeekStart();
  const existing = await getPlanForWeek(session.user.id, weekStart);
  if (existing) return existing;

  const allMeals = await getAllMeals();
  const slots = generateWeeklyPlan(allMeals);

  if (slots.length === 0) return null;

  await createWeeklyPlan(session.user.id, weekStart, slots);
  return getPlanForWeek(session.user.id, weekStart);
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

export async function regeneratePlan(): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const weekStart = getWeekStart();
  await deletePlanForWeek(session.user.id, weekStart);

  const allMeals = await getAllMeals();
  const slots = generateWeeklyPlan(allMeals);
  if (slots.length > 0) {
    await createWeeklyPlan(session.user.id, weekStart, slots);
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getPlanIngredients(): Promise<AddableItem[]> {
  const session = await getSession();
  if (!session) return [];

  const weekStart = getWeekStart();
  const plan = await getPlanForWeek(session.user.id, weekStart);
  if (!plan) return [];

  const prefs = await getUserPreferences(session.user.id);
  const numPeople = prefs?.numPeople ?? 2;

  const mealIds = plan.plannedMeals.flatMap((pm) => pm.mealId ? [pm.mealId] : []);
  const recipeIds = plan.plannedMeals.flatMap((pm) => pm.userRecipeId ? [pm.userRecipeId] : []);

  const [mealRows, recipeRows] = await Promise.all([
    mealIds.length > 0 ? db.select().from(meals).where(inArray(meals.id, mealIds)) : [],
    recipeIds.length > 0 ? db.select().from(userRecipes).where(inArray(userRecipes.id, recipeIds)) : [],
  ]);

  type Ingredient = { quantity: number | null; unit: string | null; name: string; note?: string };

  const items: AddableItem[] = [];
  for (const row of [...mealRows, ...recipeRows]) {
    const scale = numPeople / (row.servings ?? 1);
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

  return items;
}

export async function addUserRecipeToPlanAction(
  recipeId: string,
  dayOfWeek: number,
  mealType: string
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const recipe = await getUserRecipeById(recipeId, session.user.id);
  if (!recipe) return { error: "Recipe not found." };

  const weekStart = getWeekStart();
  const plan = await getOrCreatePlan(session.user.id, weekStart);
  await upsertUserRecipeSlot(plan.id, dayOfWeek, mealType, recipeId);
  revalidatePath("/dashboard");

  return { success: true };
}
