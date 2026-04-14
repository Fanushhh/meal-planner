"use client";

import { useActionState } from "react";
import { verifyOtpAction } from "@/server/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

export function VerifyForm({ email }: { email: string }) {
  const action = verifyOtpAction.bind(null, email);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        id="code"
        name="code"
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        label="Verification code"
        placeholder="123456"
        required
        autoFocus
        autoComplete="one-time-code"
        error={state && "error" in state ? state.error : undefined}
      />
      <Button type="submit" loading={isPending} size="lg" className="w-full">
        {isPending ? "Verifying…" : "Verify code"}
      </Button>
    </form>
  );
}
