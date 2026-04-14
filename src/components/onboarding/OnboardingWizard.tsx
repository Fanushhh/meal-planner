"use client";

import { useState, useTransition } from "react";
import { savePreferences } from "@/server/actions/preferences";

export function OnboardingWizard() {
  const [numPeople, setNumPeople] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await savePreferences({ numPeople });
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-16"
      style={{ background: "var(--bg)" }}
    >
      {/* Wordmark */}
      <div className="mb-10 flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl text-base"
          style={{
            background: "var(--accent-light)",
            border: "1px solid rgba(212,120,67,0.22)",
          }}
        >
          🍽
        </span>
        <span
          className="text-[17px] leading-none"
          style={{ fontFamily: "var(--font-dm-serif)", color: "var(--text)" }}
        >
          Meal Planner
        </span>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Accent top bar */}
        <div
          className="h-px w-full"
          style={{
            background: "linear-gradient(to right, var(--accent), rgba(212,120,67,0.15) 60%, transparent)",
          }}
        />

        <div className="px-8 py-8">
          {/* Heading */}
          <div className="mb-8">
            <p
              className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--accent)", opacity: 0.9 }}
            >
              One quick question
            </p>
            <h1
              className="text-[32px] leading-none"
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontStyle: "italic",
                color: "var(--text)",
              }}
            >
              Welcome
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              How many people are you cooking for? Ingredient quantities will be scaled to this number.
            </p>
          </div>

          {/* People picker */}
          <div
            className="mb-7 flex items-center justify-between rounded-xl px-5 py-4"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
            }}
          >
            <button
              type="button"
              onClick={() => setNumPeople((p) => Math.max(1, p - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border-bright)",
                color: "var(--text-muted)",
              }}
            >
              −
            </button>

            <div className="text-center">
              <span
                className="block text-[42px] leading-none"
                style={{
                  fontFamily: "var(--font-dm-serif)",
                  color: "var(--text)",
                }}
              >
                {numPeople}
              </span>
              <span
                className="mt-1 block text-[11px] uppercase tracking-[0.12em]"
                style={{ color: "var(--text-faint)" }}
              >
                {numPeople === 1 ? "person" : "people"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setNumPeople((p) => Math.min(20, p + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border-bright)",
                color: "var(--text-muted)",
              }}
            >
              +
            </button>
          </div>

          {error && (
            <div
              className="mb-5 rounded-xl px-4 py-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
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
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: "var(--accent)",
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
            ) : (
              "Start planning →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
