import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { meals, weeklyPlans } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const mealTypeMap: Record<string, string> = {
  "Wrap cu ou fiert și prosciutto": "breakfast",
  "Sardine cu salată și feta": "breakfast",
  "Omletă cu mozzarella și salată": "breakfast",
  "Ouă fierte cu hummus și morcov": "breakfast",
  "Pastă de avocado cu cottage cheese": "breakfast",
  "Pastă de ficat de cod": "breakfast",
  "Pâine cu prosciutto și hummus": "breakfast",
  "Salată de fasole roșie cu avocado și feta": "lunch",
  "Supă cremă de legume cu kefir": "lunch",
  "Cartof dulce la cuptor cu feta": "lunch",
  "Salată cu quinoa și curcan la grătar": "lunch",
  "Cotlet de porc cu salată de varză și cartof": "lunch",
  "Naked burger": "lunch",
  "Supă cremă de legume cu bacon": "dinner",
  "Pui la grătar cu salată de varză": "dinner",
  "Pulpă de curcan la cuptor cu legume": "dinner",
  "Pește cu conopidă sau broccoli la abur": "dinner",
  "Pește la cuptor cu legume": "dinner",
  "Ciorbă de fasole": "dinner",
};

async function main() {
  const allMeals = await db.select().from(meals);
  let updated = 0;
  for (const meal of allMeals) {
    const mealType = mealTypeMap[meal.name];
    if (mealType && meal.mealType !== mealType) {
      await db.update(meals).set({ mealType }).where(eq(meals.id, meal.id));
      updated++;
    }
  }
  console.log(`Updated meal_type for ${updated} meals.`);

  await db.delete(weeklyPlans);
  console.log("Deleted all weekly_plans rows (planned_meals cascaded).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
