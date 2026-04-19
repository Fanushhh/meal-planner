"use server";

import { z } from "zod";
import { getSession } from "@/server/lib/auth";
import {
  createUserRecipe,
  updateUserRecipe,
  deleteUserRecipe,
} from "@/server/queries/userRecipes";

const ingredientSchema = z.object({
  quantity: z.number().nullable(),
  unit: z.string().nullable(),
  name: z.string().min(1),
  note: z.string().optional(),
});

const recipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required."),
  description: z.string().nullable().optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner"]).default("lunch"),
  servings: z.number().int().min(1).max(100),
  prepTimeMin: z.number().int().min(0).nullable().optional(),
  cookTimeMin: z.number().int().min(0).nullable().optional(),
  ingredients: z.array(ingredientSchema),
  instructions: z.array(z.string()),
});

export type RecipeActionResult = { success: true; id: string } | { error: string };
export type DeleteActionResult = { success: true } | { error: string };

export async function createRecipeAction(
  data: z.infer<typeof recipeSchema>
): Promise<RecipeActionResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const parsed = recipeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const recipe = await createUserRecipe(session.user.id, parsed.data);
  return { success: true, id: recipe.id };
}

export async function updateRecipeAction(
  id: string,
  data: z.infer<typeof recipeSchema>
): Promise<RecipeActionResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const parsed = recipeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const recipe = await updateUserRecipe(id, session.user.id, parsed.data);
  if (!recipe) return { error: "Recipe not found." };
  return { success: true, id: recipe.id };
}

export async function deleteRecipeAction(id: string): Promise<DeleteActionResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  await deleteUserRecipe(id, session.user.id);
  return { success: true };
}
