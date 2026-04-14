import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { meals } from "../src/server/db/schema";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

type RawIngredient = {
  quantity: number | null;
  unit: string | null;
  name: string;
  note?: string;
};

type RawRecipe = {
  name: string;
  description: string;
  mealType: string;
  servings: number;
  prepTimeMin: number | null;
  cookTimeMin: number | null;
  ingredients: RawIngredient[];
  instructions: string[];
};

async function main() {
  const jsonPath = join(process.cwd(), "recipes/extracted-recipes.json");
  const recipes: RawRecipe[] = JSON.parse(readFileSync(jsonPath, "utf-8"));

  // Fetch existing meal names to avoid duplicates
  const existing = await db.select({ name: meals.name }).from(meals);
  const existingNames = new Set(existing.map((m) => m.name.toLowerCase().trim()));

  const now = Date.now();
  const toInsert = recipes.filter(
    (r) => !existingNames.has(r.name.toLowerCase().trim())
  );

  if (toInsert.length === 0) {
    console.log("All recipes already exist in the database — nothing to insert.");
    return;
  }

  const rows = toInsert.map((r) => ({
    id: randomUUID(),
    name: r.name,
    description: r.description,
    servings: r.servings ?? 2,
    prepTimeMin: r.prepTimeMin ?? null,
    cookTimeMin: r.cookTimeMin ?? null,
    ingredients: JSON.stringify(r.ingredients),
    instructions: JSON.stringify(r.instructions),
    imageUrl: null,
    mealType: r.mealType,
    createdAt: now,
  }));

  await db.insert(meals).values(rows);
  console.log(`Inserted ${rows.length} new recipes (skipped ${recipes.length - rows.length} duplicates).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
