"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRecipeAction } from "@/server/actions/userRecipes";

interface MyRecipeDeleteButtonProps {
  id: string;
  label: string;
}

export function MyRecipeDeleteButton({ id, label }: MyRecipeDeleteButtonProps) {
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
      className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-red-500/10 disabled:opacity-50"
      style={{ color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
    >
      {label}
    </button>
  );
}
