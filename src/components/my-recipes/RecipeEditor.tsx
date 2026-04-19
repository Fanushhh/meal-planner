"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRecipeAction, updateRecipeAction } from "@/server/actions/userRecipes";
import type { ParsedUserRecipe } from "@/server/queries/userRecipes";
import type { Ingredient } from "@/server/queries/meals";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/server/db/schema";
import type { MealType } from "@/server/db/schema";

const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV"];
function toRoman(n: number) { return ROMAN[n - 1] ?? String(n); }

interface RecipeEditorProps {
  mode: "create" | "edit";
  initialData?: ParsedUserRecipe;
}

function emptyIngredient(): Ingredient {
  return { quantity: null, unit: null, name: "" };
}

const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "6px 0",
  border: 0,
  borderBottom: "1px solid var(--rule)",
  background: "transparent",
  color: "var(--ink)",
  fontFamily: "var(--font-newsreader, Georgia, serif)",
  fontSize: 17,
  outline: "none",
};

function FormSection({
  label,
  hint,
  children,
  flush,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <div style={{ marginBottom: flush ? 0 : 36 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 10,
      }}>
        <div style={{
          fontFamily: "var(--font-fraunces, Georgia, serif)",
          fontSize: 20,
          fontStyle: "italic",
          fontWeight: 500,
          color: "var(--ink)",
        }}>
          {label}
        </div>
        {hint && (
          <div className="small-caps">{hint}</div>
        )}
      </div>
      <div className="rule" style={{ marginBottom: 14 }} />
      {children}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 12px",
        border: "1px solid " + (active ? "var(--ink)" : "var(--rule)"),
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--paper)" : "var(--ink-2)",
        fontFamily: "var(--font-jetbrains, monospace)",
        fontSize: 10,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "all .15s",
      }}
    >
      {children}
    </button>
  );
}

export function RecipeEditor({ mode, initialData }: RecipeEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [servings, setServings] = useState(initialData?.servings ?? 2);
  const [prepTimeMin, setPrepTimeMin] = useState<string>(
    initialData?.prepTimeMin != null ? String(initialData.prepTimeMin) : ""
  );
  const [cookTimeMin, setCookTimeMin] = useState<string>(
    initialData?.cookTimeMin != null ? String(initialData.cookTimeMin) : ""
  );
  const [mealType, setMealType] = useState<MealType>(
    (initialData?.mealType as MealType) ?? "lunch"
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients.length ? initialData.ingredients : [emptyIngredient(), emptyIngredient()]
  );
  const [instructions, setInstructions] = useState<string[]>(
    initialData?.instructions.length ? initialData.instructions : [""]
  );

  const canSave = name.trim() !== "" && ingredients.some((ing) => ing.name.trim() !== "");

  function updateIngredient(index: number, field: keyof Ingredient, value: string) {
    setIngredients((prev) => {
      const next = [...prev];
      if (field === "quantity") {
        next[index] = { ...next[index]!, quantity: value === "" ? null : parseFloat(value) };
      } else if (field === "unit") {
        next[index] = { ...next[index]!, unit: value === "" ? null : value };
      } else if (field === "name") {
        next[index] = { ...next[index]!, name: value };
      } else if (field === "note") {
        next[index] = { ...next[index]!, note: value === "" ? undefined : value };
      }
      return next;
    });
  }

  function handleSubmit() {
    if (!name.trim()) { setError("Recipe name is required."); return; }
    setError(null);

    const data = {
      name: name.trim(),
      description: description.trim() || null,
      mealType,
      servings,
      prepTimeMin: prepTimeMin !== "" ? parseInt(prepTimeMin, 10) : null,
      cookTimeMin: cookTimeMin !== "" ? parseInt(cookTimeMin, 10) : null,
      ingredients: ingredients.filter((ing) => ing.name.trim() !== ""),
      instructions: instructions.filter((s) => s.trim() !== ""),
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createRecipeAction(data)
          : await updateRecipeAction(initialData!.id, data);

      if ("error" in result) {
        setError(result.error);
      } else {
        router.push(`/my-recipes/${result.id}`);
      }
    });
  }

  return (
    <div>
      {/* Top row: back link + save button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <button
          type="button"
          onClick={() => router.push("/my-recipes")}
          style={{
            background: "none",
            border: "none",
            fontFamily: "var(--font-jetbrains, monospace)",
            fontSize: 11,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "var(--ink-2)",
            cursor: "pointer",
            padding: 0,
          }}
        >
          ← back to the pantry
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !canSave}
          className="btn btn-primary"
          style={{ opacity: canSave ? 1 : 0.4 }}
        >
          {isPending ? "Saving…" : mode === "create" ? "Save recipe" : "Save changes"}
        </button>
      </div>

      {/* Cookbook header */}
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <span style={{
          fontFamily: "var(--font-fraunces, Georgia, serif)",
          fontStyle: "italic",
          fontWeight: 400,
          color: "var(--ink-3)",
          fontSize: 14,
          letterSpacing: ".06em",
        }}>
          {mode === "create" ? "A new page" : "Revising"}
        </span>
      </div>
      <h1 style={{
        fontFamily: "var(--font-fraunces, Georgia, serif)",
        textAlign: "center",
        fontSize: "clamp(40px, 5vw, 64px)",
        fontWeight: 500,
        margin: "8px 0 6px",
        letterSpacing: "-0.02em",
        fontStyle: "italic",
        color: "var(--ink)",
      }}>
        {mode === "create" ? "Write a Recipe" : (initialData?.name ?? "Edit Recipe")}
      </h1>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span className="flourish">✦</span>
      </div>

      {/* Name */}
      <FormSection label="Name of the dish" hint="What will you call it?">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sunday Night Ragù"
          style={{
            ...inputBase,
            fontFamily: "var(--font-fraunces, Georgia, serif)",
            fontSize: 28,
            fontStyle: name ? "normal" : "italic",
            fontWeight: 500,
          }}
        />
      </FormSection>

      {/* Description */}
      <FormSection label="A few words" hint="Optional — shown on the recipe card">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short note about this dish…"
          rows={2}
          style={{
            ...inputBase,
            resize: "vertical",
            fontStyle: "italic",
            lineHeight: 1.5,
          }}
        />
      </FormSection>

      {/* Meal type + time */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 40, marginBottom: 36 }}>
        <FormSection label="Meal type" hint="When is it best enjoyed?" flush>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {MEAL_TYPES.map((type) => (
              <FilterChip
                key={type}
                active={mealType === type}
                onClick={() => setMealType(type)}
              >
                {MEAL_TYPE_LABELS[type]}
              </FilterChip>
            ))}
          </div>
        </FormSection>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <FormSection label="Prep time" hint="minutes" flush>
            <input
              type="number"
              min="0"
              value={prepTimeMin}
              onChange={(e) => setPrepTimeMin(e.target.value)}
              placeholder="0"
              style={{
                ...inputBase,
                fontFamily: "var(--font-fraunces, Georgia, serif)",
                fontSize: 28,
                fontWeight: 500,
              }}
            />
          </FormSection>
          <FormSection label="Cook time" hint="minutes" flush>
            <input
              type="number"
              min="0"
              value={cookTimeMin}
              onChange={(e) => setCookTimeMin(e.target.value)}
              placeholder="0"
              style={{
                ...inputBase,
                fontFamily: "var(--font-fraunces, Georgia, serif)",
                fontSize: 28,
                fontWeight: 500,
              }}
            />
          </FormSection>
        </div>
      </div>

      {/* Servings */}
      <FormSection label="Servings" hint="Base portion count for scaling">
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <button
            type="button"
            onClick={() => setServings((v) => Math.max(1, v - 1))}
            style={{
              background: "none",
              border: "none",
              fontFamily: "var(--font-jetbrains, monospace)",
              fontSize: 18,
              color: "var(--ink-3)",
              cursor: "pointer",
              padding: "0 4px",
            }}
          >−</button>
          <span style={{
            fontFamily: "var(--font-fraunces, Georgia, serif)",
            fontSize: 28,
            fontWeight: 500,
            color: "var(--ink)",
            minWidth: 32,
            textAlign: "center",
          }}>
            {servings}
          </span>
          <button
            type="button"
            onClick={() => setServings((v) => Math.min(100, v + 1))}
            style={{
              background: "none",
              border: "none",
              fontFamily: "var(--font-jetbrains, monospace)",
              fontSize: 18,
              color: "var(--ink-3)",
              cursor: "pointer",
              padding: "0 4px",
            }}
          >+</button>
          <span className="small-caps">people</span>
        </div>
      </FormSection>

      {/* Ingredients */}
      <FormSection label="Ingredients" hint="Quantity · unit · what it is.">
        {/* Column headers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "28px 90px 110px 1fr 30px",
          gap: 12,
          padding: "4px 0 8px",
          borderBottom: "1px solid var(--rule)",
        }}>
          <span />
          <span className="small-caps">Qty</span>
          <span className="small-caps">Unit</span>
          <span className="small-caps">Ingredient</span>
          <span />
        </div>

        {ingredients.map((ing, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "28px 90px 110px 1fr 30px",
              gap: 12,
              alignItems: "baseline",
              padding: "10px 0",
              borderBottom: "1px dashed var(--rule-2)",
            }}
          >
            <span style={{
              fontFamily: "var(--font-jetbrains, monospace)",
              fontSize: 10,
              color: "var(--ink-3)",
              letterSpacing: ".12em",
            }}>
              {(i + 1).toString().padStart(2, "0")}
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={ing.quantity ?? ""}
              onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
              placeholder={["2", "1", "400", "½"][i] ?? "—"}
              style={{
                ...inputBase,
                border: 0,
                padding: 0,
                fontFamily: "var(--font-fraunces, Georgia, serif)",
                fontSize: 19,
                fontStyle: "italic",
              }}
            />
            <select
              value={ing.unit ?? ""}
              onChange={(e) => updateIngredient(i, "unit", e.target.value)}
              style={{
                ...inputBase,
                border: 0,
                padding: 0,
                fontFamily: "var(--font-jetbrains, monospace)",
                fontSize: 13,
                color: ing.unit ? "var(--ink)" : "var(--ink-3)",
                letterSpacing: ".08em",
                appearance: "none",
                WebkitAppearance: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <option value="">— none —</option>
              <optgroup label="volume">
                <option value="tsp">tsp</option>
                <option value="tbsp">tbsp</option>
                <option value="cup">cup</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
              </optgroup>
              <optgroup label="weight">
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="oz">oz</option>
                <option value="lb">lb</option>
              </optgroup>
              <optgroup label="count">
                <option value="piece">piece</option>
                <option value="clove">clove</option>
                <option value="slice">slice</option>
                <option value="bunch">bunch</option>
                <option value="pinch">pinch</option>
                <option value="lingură">lingură</option>
                <option value="linguriță">linguriță</option>
                <option value="cană">cană</option>
              </optgroup>
            </select>
            <input
              type="text"
              value={ing.name}
              onChange={(e) => updateIngredient(i, "name", e.target.value)}
              placeholder={["olive oil", "onion, diced", "pasta", "lemon"][i] ?? "what it is…"}
              style={{ ...inputBase, border: 0, padding: 0 }}
            />
            <button
              type="button"
              onClick={() => setIngredients((prev) => prev.filter((_, idx) => idx !== i))}
              disabled={ingredients.length <= 1}
              style={{
                background: "none",
                border: 0,
                color: "var(--ink-3)",
                cursor: "pointer",
                fontSize: 18,
                padding: 0,
              }}
              aria-label="Remove ingredient"
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}
          className="btn btn-ghost"
          style={{ marginTop: 14 }}
        >
          + Add ingredient
        </button>
      </FormSection>

      {/* Steps */}
      <FormSection label="Cooking steps" hint="Walk us through the method.">
        {instructions.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
              padding: "12px 0",
              borderBottom: "1px solid var(--rule-2)",
            }}
          >
            <span style={{
              fontFamily: "var(--font-fraunces, Georgia, serif)",
              fontSize: 28,
              fontStyle: "italic",
              color: "var(--accent)",
              lineHeight: 1,
              minWidth: 36,
            }}>
              {toRoman(i + 1)}.
            </span>
            <textarea
              value={step}
              onChange={(e) => setInstructions((prev) => {
                const next = [...prev];
                next[i] = e.target.value;
                return next;
              })}
              placeholder="Describe what to do…"
              rows={2}
              style={{
                flex: 1,
                background: "transparent",
                border: 0,
                resize: "vertical",
                fontFamily: "var(--font-newsreader, Georgia, serif)",
                fontSize: 16,
                color: "var(--ink)",
                outline: "none",
                padding: 0,
                lineHeight: 1.5,
              }}
            />
            <button
              type="button"
              onClick={() => setInstructions((prev) => prev.filter((_, idx) => idx !== i))}
              disabled={instructions.length <= 1}
              style={{
                background: "none",
                border: 0,
                color: "var(--ink-3)",
                cursor: "pointer",
                fontSize: 18,
                padding: "0 4px",
              }}
              aria-label="Remove step"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setInstructions((prev) => [...prev, ""])}
          className="btn btn-ghost"
          style={{ marginTop: 14 }}
        >
          + Add step
        </button>
      </FormSection>

      {error && (
        <div style={{
          padding: "12px 16px",
          border: "1px solid rgba(166,58,31,0.35)",
          background: "rgba(166,58,31,0.06)",
          color: "var(--accent)",
          fontFamily: "var(--font-jetbrains, monospace)",
          fontSize: 11,
          letterSpacing: ".1em",
          marginBottom: 24,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
