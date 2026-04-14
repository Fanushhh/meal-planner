import { describe, it, expect } from "vitest";
import {
  generateWeeklyPlan,
  pickRerollMeal,
  scoreMeal,
} from "@/server/lib/meal-generator";
import type { ParsedMeal } from "@/server/queries/meals";

function makeMeal(overrides: Partial<ParsedMeal> = {}): ParsedMeal {
  return {
    id: Math.random().toString(36).slice(2),
    name: "Test Meal",
    description: null,
    servings: 2,
    prepTimeMin: 30,
    cookTimeMin: null,
    imageUrl: null,
    createdAt: 0,
    mealType: "lunch",
    ingredients: [] as import("@/server/queries/meals").Ingredient[],
    instructions: [],
    ...overrides,
  };
}

// 7 lunch meals (one per day for generateWeeklyPlan)
const sampleMeals: ParsedMeal[] = [
  makeMeal({ id: "m1", mealType: "lunch" }),
  makeMeal({ id: "m2", mealType: "lunch" }),
  makeMeal({ id: "m3", mealType: "lunch" }),
  makeMeal({ id: "m4", mealType: "lunch" }),
  makeMeal({ id: "m5", mealType: "lunch" }),
  makeMeal({ id: "m6", mealType: "lunch" }),
  makeMeal({ id: "m7", mealType: "lunch" }),
];

describe("scoreMeal", () => {
  it("gives lower score to already-used meals", () => {
    const meal = makeMeal({ id: "m1" });
    const used = new Set(["m1"]);
    const scoreUsed = scoreMeal(meal, used);
    const scoreFresh = scoreMeal(meal, new Set());
    expect(scoreUsed).toBeLessThan(scoreFresh);
  });

  it("returns at least 1", () => {
    const meal = makeMeal({ id: "m1" });
    const used = new Set(["m1"]);
    const score = scoreMeal(meal, used);
    expect(score).toBeGreaterThanOrEqual(1);
  });
});

describe("generateWeeklyPlan", () => {
  it("generates 7 slots when only lunch meals are provided", () => {
    const slots = generateWeeklyPlan(sampleMeals);
    expect(slots).toHaveLength(7);
  });

  it("generates 21 slots when all 3 meal types are present", () => {
    const all = [
      ...Array.from({ length: 7 }, (_, i) => makeMeal({ id: `b${i}`, mealType: "breakfast" })),
      ...Array.from({ length: 7 }, (_, i) => makeMeal({ id: `l${i}`, mealType: "lunch" })),
      ...Array.from({ length: 7 }, (_, i) => makeMeal({ id: `d${i}`, mealType: "dinner" })),
    ];
    const slots = generateWeeklyPlan(all);
    expect(slots).toHaveLength(21);
  });

  it("each slot has a valid dayOfWeek, mealId, and mealType", () => {
    const slots = generateWeeklyPlan(sampleMeals);
    for (const slot of slots) {
      expect(slot.dayOfWeek).toBeGreaterThanOrEqual(0);
      expect(slot.dayOfWeek).toBeLessThanOrEqual(6);
      expect(typeof slot.mealId).toBe("string");
      expect(["breakfast", "lunch", "dinner"]).toContain(slot.mealType);
    }
  });

  it("returns empty when no meals provided", () => {
    const slots = generateWeeklyPlan([]);
    expect(slots).toHaveLength(0);
  });

  it("can generate a plan with a single meal (repeated)", () => {
    const one = [makeMeal({ id: "only", mealType: "lunch" })];
    const slots = generateWeeklyPlan(one);
    expect(slots).toHaveLength(7);
    expect(slots.every((s) => s.mealId === "only")).toBe(true);
  });
});

describe("pickRerollMeal", () => {
  it("never returns the current meal", () => {
    const pool = Array.from({ length: 10 }, (_, i) => makeMeal({ id: `d${i}`, mealType: "lunch" }));
    for (let i = 0; i < 20; i++) {
      const result = pickRerollMeal(pool, "lunch", "d0", []);
      expect(result?.id).not.toBe("d0");
    }
  });

  it("returns null when no alternatives exist", () => {
    const pool = [makeMeal({ id: "only", mealType: "lunch" })];
    const result = pickRerollMeal(pool, "lunch", "only", []);
    expect(result).toBeNull();
  });

  it("returns null when no meals of the given type exist", () => {
    const pool = [makeMeal({ id: "b1", mealType: "breakfast" })];
    const result = pickRerollMeal(pool, "lunch", "b1", []);
    expect(result).toBeNull();
  });
});
