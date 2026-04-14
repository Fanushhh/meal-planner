"use client";

import { useActionState } from "react";
import { sendOtp } from "@/server/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(sendOtp, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        id="email"
        name="email"
        type="email"
        label="Email address"
        placeholder="you@example.com"
        required
        autoFocus
        autoComplete="email"
        error={state && "error" in state ? state.error : undefined}
      />
      <Button type="submit" loading={isPending} size="lg" className="w-full">
        {isPending ? "Sending…" : "Send code"}
      </Button>
    </form>
  );
}
