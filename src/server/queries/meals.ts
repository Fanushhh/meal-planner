import { db } from "@/server/db";
import { meals } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import type { Meal } from "@/server/db/schema";

export type Ingredient = {
  quantity: number | null;
  unit: string | null;
  name: string;
  note?: string;
};

export type ParsedMeal = Omit<Meal, "ingredients" | "instructions"> & {
  ingredients: Ingredient[];
  instructions: string[];
};

function parseMeal(meal: Meal): ParsedMeal {
  return {
    ...meal,
    ingredients: JSON.parse(meal.ingredients) as Ingredient[],
    instructions: JSON.parse(meal.instructions) as string[],
  };
}

export async function getAllMeals(): Promise<ParsedMeal[]> {
  const rows = await db.select().from(meals);
  return rows.map(parseMeal);
}

export async function getMealById(id: string): Promise<ParsedMeal | null> {
  const rows = await db.select().from(meals).where(eq(meals.id, id)).limit(1);
  return rows[0] ? parseMeal(rows[0]) : null;
}
