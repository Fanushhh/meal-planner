"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/server/lib/auth";
import { upsertPreferences } from "@/server/queries/users";

const preferencesSchema = z.object({
  numPeople: z.coerce.number().int().min(1).max(20),
});

export type PreferencesActionResult = { error: string } | { success: true };

export async function savePreferences(
  data: z.infer<typeof preferencesSchema>
): Promise<PreferencesActionResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const parsed = preferencesSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await upsertPreferences(session.user.id, parsed.data);
  redirect("/dashboard");
}
