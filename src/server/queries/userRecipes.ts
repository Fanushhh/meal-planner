import { db } from "@/server/db";
import { userRecipes } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type { UserRecipe } from "@/server/db/schema";
import type { Ingredient } from "./meals";

export type { Ingredient };

export type ParsedUserRecipe = Omit<
  UserRecipe,
  "ingredients" | "instructions"
> & {
  ingredients: Ingredient[];
  instructions: string[];
};

function parseRecipe(recipe: UserRecipe): ParsedUserRecipe {
  return {
    ...recipe,
    ingredients: JSON.parse(recipe.ingredients) as Ingredient[],
    instructions: JSON.parse(recipe.instructions) as string[],
  };
}

export type RecipeInput = {
  name: string;
  description?: string | null;
  mealType?: string;
  servings: number;
  prepTimeMin?: number | null;
  cookTimeMin?: number | null;
  ingredients: Ingredient[];
  instructions: string[];
};

export async function getUserRecipes(userId: string): Promise<ParsedUserRecipe[]> {
  const rows = await db
    .select()
    .from(userRecipes)
    .where(eq(userRecipes.userId, userId));
  return rows.map(parseRecipe);
}

export async function getUserRecipeById(
  id: string,
  userId: string
): Promise<ParsedUserRecipe | null> {
  const rows = await db
    .select()
    .from(userRecipes)
    .where(and(eq(userRecipes.id, id), eq(userRecipes.userId, userId)))
    .limit(1);
  return rows[0] ? parseRecipe(rows[0]) : null;
}

export async function createUserRecipe(
  userId: string,
  data: RecipeInput
): Promise<ParsedUserRecipe> {
  const now = Date.now();
  const id = createId();
  await db.insert(userRecipes).values({
    id,
    userId,
    name: data.name,
    description: data.description ?? null,
    mealType: data.mealType ?? "lunch",
    servings: data.servings,
    prepTimeMin: data.prepTimeMin ?? null,
    cookTimeMin: data.cookTimeMin ?? null,
    ingredients: JSON.stringify(data.ingredients),
    instructions: JSON.stringify(data.instructions),
    createdAt: now,
    updatedAt: now,
  });
  const rows = await db
    .select()
    .from(userRecipes)
    .where(eq(userRecipes.id, id))
    .limit(1);
  return parseRecipe(rows[0]!);
}

export async function updateUserRecipe(
  id: string,
  userId: string,
  data: RecipeInput
): Promise<ParsedUserRecipe | null> {
  await db
    .update(userRecipes)
    .set({
      name: data.name,
      description: data.description ?? null,
      mealType: data.mealType ?? "lunch",
      servings: data.servings,
      prepTimeMin: data.prepTimeMin ?? null,
      cookTimeMin: data.cookTimeMin ?? null,
      ingredients: JSON.stringify(data.ingredients),
      instructions: JSON.stringify(data.instructions),
      updatedAt: Date.now(),
    })
    .where(and(eq(userRecipes.id, id), eq(userRecipes.userId, userId)));
  return getUserRecipeById(id, userId);
}

export async function deleteUserRecipe(id: string, userId: string): Promise<void> {
  await db
    .delete(userRecipes)
    .where(and(eq(userRecipes.id, id), eq(userRecipes.userId, userId)));
}
