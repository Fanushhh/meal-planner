"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRecipeAction, updateRecipeAction } from "@/server/actions/userRecipes";
import type { ParsedUserRecipe } from "@/server/queries/userRecipes";
import type { Ingredient } from "@/server/queries/meals";

interface RecipeEditorProps {
  mode: "create" | "edit";
  initialData?: ParsedUserRecipe;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl p-6"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <h2
        className="mb-5 text-[11px] font-semibold uppercase tracking-[0.13em]"
        style={{ color: "var(--text-faint)" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    background: "var(--surface-raised)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: "0.625rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    width: "100%",
    outline: "none",
  };
}

function labelStyle(): React.CSSProperties {
  return {
    display: "block",
    fontSize: "0.6875rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "var(--text-faint)",
    marginBottom: "0.375rem",
  };
}

function emptyIngredient(): Ingredient {
  return { quantity: null, unit: null, name: "" };
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
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients.length ? initialData.ingredients : [emptyIngredient()]
  );
  const [instructions, setInstructions] = useState<string[]>(
    initialData?.instructions.length ? initialData.instructions : [""]
  );

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

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function updateInstruction(index: number, value: string) {
    setInstructions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function removeInstruction(index: number) {
    setInstructions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!name.trim()) {
      setError("Recipe name is required.");
      return;
    }
    setError(null);

    const data = {
      name: name.trim(),
      description: description.trim() || null,
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
    <div className="space-y-5">
      {/* Basic info */}
      <SectionCard title="Basic Info">
        <div className="space-y-4">
          <div>
            <label style={labelStyle()}>Recipe name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spaghetti Carbonara"
              style={inputStyle()}
            />
          </div>

          <div>
            <label style={labelStyle()}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description of the recipe..."
              rows={3}
              style={{ ...inputStyle(), resize: "vertical" }}
            />
          </div>
        </div>
      </SectionCard>

      {/* Timing & servings */}
      <SectionCard title="Timing & Servings">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label style={labelStyle()}>Servings</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setServings((v) => Math.max(1, v - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium transition-colors"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                −
              </button>
              <span
                className="w-8 text-center text-2xl font-semibold"
                style={{ fontFamily: "var(--font-dm-serif)", color: "var(--text)" }}
              >
                {servings}
              </span>
              <button
                type="button"
                onClick={() => setServings((v) => Math.min(100, v + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium transition-colors"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle()}>Prep time (min)</label>
            <input
              type="number"
              min="0"
              value={prepTimeMin}
              onChange={(e) => setPrepTimeMin(e.target.value)}
              placeholder="0"
              style={inputStyle()}
            />
          </div>

          <div>
            <label style={labelStyle()}>Cook time (min)</label>
            <input
              type="number"
              min="0"
              value={cookTimeMin}
              onChange={(e) => setCookTimeMin(e.target.value)}
              placeholder="0"
              style={inputStyle()}
            />
          </div>
        </div>
      </SectionCard>

      {/* Ingredients */}
      <SectionCard title="Ingredients">
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="any"
                value={ing.quantity ?? ""}
                onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
                placeholder="Qty"
                style={{ ...inputStyle(), width: "5rem", flexShrink: 0 }}
              />
              <input
                type="text"
                value={ing.unit ?? ""}
                onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                placeholder="Unit"
                style={{ ...inputStyle(), width: "5rem", flexShrink: 0 }}
              />
              <input
                type="text"
                value={ing.name}
                onChange={(e) => updateIngredient(i, "name", e.target.value)}
                placeholder="Ingredient name"
                style={{ ...inputStyle(), flex: 1 }}
              />
              <input
                type="text"
                value={ing.note ?? ""}
                onChange={(e) => updateIngredient(i, "note", e.target.value)}
                placeholder="Note"
                style={{ ...inputStyle(), width: "6rem", flexShrink: 0 }}
              />
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-red-500/10"
                style={{ color: "var(--text-faint)" }}
                aria-label="Remove ingredient"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M1 1l10 10M11 1L1 11" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}
          className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors"
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 1v8M1 5h8" />
          </svg>
          Add ingredient
        </button>
      </SectionCard>

      {/* Instructions */}
      <SectionCard title="Instructions">
        <div className="space-y-3">
          {instructions.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span
                className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  color: "var(--text-faint)",
                }}
              >
                {i + 1}
              </span>
              <textarea
                value={step}
                onChange={(e) => updateInstruction(i, e.target.value)}
                placeholder={`Step ${i + 1}...`}
                rows={2}
                style={{ ...inputStyle(), flex: 1, resize: "vertical" }}
              />
              <button
                type="button"
                onClick={() => removeInstruction(i)}
                className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-red-500/10"
                style={{ color: "var(--text-faint)" }}
                aria-label="Remove step"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M1 1l10 10M11 1L1 11" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setInstructions((prev) => [...prev, ""])}
          className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors"
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 1v8M1 5h8" />
          </svg>
          Add step
        </button>
      </SectionCard>

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            color: "#f87171",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: "var(--accent)",
          border: "1px solid transparent",
          color: "#0D0E11",
        }}
      >
        {isPending ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving…
          </>
        ) : mode === "create" ? (
          "Save recipe"
        ) : (
          "Save changes"
        )}
      </button>
    </div>
  );
}
