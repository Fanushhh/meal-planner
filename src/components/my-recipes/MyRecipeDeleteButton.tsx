"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRecipeAction } from "@/server/actions/userRecipes";

interface MyRecipeDeleteButtonProps {
  id: string;
  label: string;
  variant?: "btn" | "link";
}

export function MyRecipeDeleteButton({ id, label, variant = "btn" }: MyRecipeDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Delete this recipe? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteRecipeAction(id);
      router.push("/my-recipes");
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className={variant === "btn" ? "btn btn-ghost" : undefined}
      style={variant === "link" ? {
        background: "none",
        border: "none",
        fontFamily: "var(--font-jetbrains, monospace)",
        fontSize: 10,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: "var(--ink-3)",
        cursor: "pointer",
        padding: 0,
      } : undefined}
    >
      {label}
    </button>
  );
}
