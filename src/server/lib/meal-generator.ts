import type { ParsedMeal } from "@/server/queries/meals";
import { MEAL_TYPES, type MealType } from "@/server/db/schema";

export type MealSlot = {
  dayOfWeek: number; // 0-6 (Monday-Sunday)
  mealId: string;
  mealType: MealType;
};

/**
 * Score a meal based on how recently it has been used.
 * Returns a weight (higher = more likely to be selected).
 */
export function scoreMeal(
  meal: ParsedMeal,
  usedMealIds: Set<string>
): number {
  let score = 10; // base weight
  if (usedMealIds.has(meal.id)) {
    score -= 8; // penalty for repeats
  }
  return Math.max(score, 1); // minimum weight of 1
}

/**
 * Weighted random selection from a list of (item, weight) pairs.
 */
export function weightedRandom<T>(items: Array<{ item: T; weight: number }>): T {
  const total = items.reduce((sum, { weight }) => sum + weight, 0);
  let rand = Math.random() * total;
  for (const { item, weight } of items) {
    rand -= weight;
    if (rand <= 0) return item;
  }
  return items[items.length - 1]!.item;
}

/**
 * Generate a full weekly plan: one meal per day per meal type (breakfast/lunch/dinner).
 * Skips a type entirely if no meals of that type exist.
 */
export function generateWeeklyPlan(allMeals: ParsedMeal[]): MealSlot[] {
  if (allMeals.length === 0) return [];

  const slots: MealSlot[] = [];

  for (const mealType of MEAL_TYPES) {
    const mealsOfType = allMeals.filter((m) => m.mealType === mealType);
    if (mealsOfType.length === 0) continue;

    const usedMealIds = new Set<string>();

    for (let day = 0; day < 7; day++) {
      const weighted = mealsOfType.map((meal) => ({
        item: meal,
        weight: scoreMeal(meal, usedMealIds),
      }));

      const selected = weightedRandom(weighted);
      usedMealIds.add(selected.id);
      slots.push({ dayOfWeek: day, mealId: selected.id, mealType });
    }
  }

  return slots;
}

/**
 * Pick a replacement meal for a re-roll.
 * Filters to the given meal type, excludes the current meal and already-used meals for variety.
 */
export function pickRerollMeal(
  allMeals: ParsedMeal[],
  mealType: MealType,
  currentMealId: string,
  planMealIds: string[]
): ParsedMeal | null {
  const mealsOfType = allMeals.filter((m) => m.mealType === mealType);
  const eligible = mealsOfType.filter((m) => m.id !== currentMealId);
  if (eligible.length === 0) return null;

  const usedSet = new Set(planMealIds.filter((id) => id !== currentMealId));
  const weighted = eligible.map((meal) => ({
    item: meal,
    weight: scoreMeal(meal, usedSet),
  }));

  return weightedRandom(weighted);
}
