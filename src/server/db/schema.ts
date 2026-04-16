import { pgTable, text, integer, bigint, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const otpCodes = pgTable("otp_codes", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  salt: text("salt").notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
  used: integer("used").notNull().default(0),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  numPeople: integer("num_people").notNull().default(2),
  onboardingCompleted: integer("onboarding_completed").notNull().default(0),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const meals = pgTable("meals", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  servings: integer("servings").notNull().default(2),
  prepTimeMin: integer("prep_time_min"),
  cookTimeMin: integer("cook_time_min"),
  ingredients: text("ingredients").notNull().default("[]"),
  instructions: text("instructions").notNull().default("[]"),
  imageUrl: text("image_url"),
  mealType: text("meal_type").notNull().default("lunch"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const userRecipes = pgTable("user_recipes", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  servings: integer("servings").notNull().default(2),
  prepTimeMin: integer("prep_time_min"),
  cookTimeMin: integer("cook_time_min"),
  ingredients: text("ingredients").notNull().default("[]"),
  instructions: text("instructions").notNull().default("[]"),
  mealType: text("meal_type").notNull().default("lunch"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const weeklyPlans = pgTable(
  "weekly_plans",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekStart: text("week_start").notNull(),
    generatedAt: bigint("generated_at", { mode: "number" }).notNull(),
  },
  (table) => [uniqueIndex("unique_user_week").on(table.userId, table.weekStart)]
);

export const plannedMeals = pgTable(
  "planned_meals",
  {
    id: text("id").primaryKey(),
    planId: text("plan_id")
      .notNull()
      .references(() => weeklyPlans.id, { onDelete: "cascade" }),
    mealId: text("meal_id")
      .references(() => meals.id),
    userRecipeId: text("user_recipe_id")
      .references(() => userRecipes.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    mealType: text("meal_type").notNull().default("lunch"),
    rerolledAt: bigint("rerolled_at", { mode: "number" }),
  },
  (table) => [
    uniqueIndex("unique_plan_day_type").on(table.planId, table.dayOfWeek, table.mealType),
  ]
);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type OtpCode = typeof otpCodes.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type Meal = typeof meals.$inferSelect;
export type WeeklyPlan = typeof weeklyPlans.$inferSelect;
export type PlannedMeal = typeof plannedMeals.$inferSelect;
export type UserRecipe = typeof userRecipes.$inferSelect;

export type MealType = "breakfast" | "lunch" | "dinner";
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Mic dejun",
  lunch: "Prânz",
  dinner: "Cină",
};
export const MEAL_TYPE_COLORS: Record<MealType, { text: string; bg: string; border: string }> = {
  breakfast: { text: "#F5A623", bg: "rgba(245,166,35,0.12)", border: "rgba(245,166,35,0.25)" },
  lunch:     { text: "#D47843", bg: "rgba(212,120,67,0.12)", border: "rgba(212,120,67,0.25)" },
  dinner:    { text: "#7B95C4", bg: "rgba(123,149,196,0.12)", border: "rgba(123,149,196,0.25)" },
};
export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
