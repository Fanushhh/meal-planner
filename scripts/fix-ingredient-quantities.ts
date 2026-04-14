/**
 * One-time fix: replace null/range quantities in seeded meal ingredients
 * with proper numeric values so scaling for multiple people works correctly.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { meals } from "../src/server/db/schema";
import { eq } from "drizzle-orm";
import path from "path";

const DB_PATH = path.join(process.cwd(), "local.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite);

type Ingredient = {
  quantity: number | null;
  unit: string | null;
  name: string;
  note?: string;
};

// Map of meal name → function that fixes its ingredients array
const fixes: Record<string, (ings: Ingredient[]) => Ingredient[]> = {
  "Wrap cu ou fiert și prosciutto": (ings) =>
    ings.map((i) =>
      i.name === "prosciutto crudo"
        ? { quantity: 3, unit: "felie", name: "prosciutto crudo" }
        : i
    ),

  "Pâine cu prosciutto și hummus": (ings) =>
    ings.map((i) =>
      i.name === "prosciutto crudo"
        ? { quantity: 3, unit: "felie", name: "prosciutto crudo" }
        : i
    ),

  "Pastă de avocado cu cottage cheese": (ings) =>
    ings.map((i) =>
      i.name === "avocado"
        ? { quantity: 0.5, unit: null, name: "avocado" }
        : i
    ),

  "Pastă de ficat de cod": (ings) =>
    ings.map((i) =>
      i.name === "conservă ficat de cod"
        ? { quantity: 0.5, unit: "conservă", name: "ficat de cod" }
        : i
    ),

  "Salată de fasole roșie cu avocado și feta": (ings) =>
    ings.map((i) =>
      i.name === "avocado"
        ? { quantity: 0.5, unit: null, name: "avocado" }
        : i
    ),

  "Cartof dulce la cuptor cu feta": (ings) =>
    ings.map((i) => {
      if (i.name === "usturoi")
        return { quantity: 3, unit: "cățel", name: "usturoi" };
      if (i.name === "brânză feta")
        return { quantity: 40, unit: "g", name: "brânză feta" };
      return i;
    }),

  "Salată cu quinoa și curcan la grătar": (ings) =>
    ings.map((i) =>
      i.name === "măsline"
        ? { quantity: 4, unit: null, name: "măsline" }
        : i
    ),
};

const allMeals = db.select().from(meals).all();
let updated = 0;

for (const meal of allMeals) {
  const fix = fixes[meal.name];
  if (!fix) continue;

  const ingredients = JSON.parse(meal.ingredients) as Ingredient[];
  const fixed = fix(ingredients);

  db.update(meals)
    .set({ ingredients: JSON.stringify(fixed) })
    .where(eq(meals.id, meal.id))
    .run();

  console.log(`Fixed: ${meal.name}`);
  updated++;
}

console.log(`\nDone — updated ${updated} meals.`);
