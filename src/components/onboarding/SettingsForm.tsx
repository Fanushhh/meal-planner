"use client";

import { useState, useTransition } from "react";
import { savePreferences } from "@/server/actions/preferences";

interface SettingsFormProps {
  initialNumPeople: number;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl p-6"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
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

export function SettingsForm({ initialNumPeople }: SettingsFormProps) {
  const [numPeople, setNumPeople] = useState(initialNumPeople);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await savePreferences({ numPeople });
      if (result && "error" in result) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Number of people */}
      <SectionCard title="Servings">
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Ingredient quantities on recipes are scaled to this number.
        </p>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => { setSaved(false); setNumPeople((p) => Math.max(1, p - 1)); }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-medium transition-colors"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            −
          </button>
          <span
            className="w-10 text-center text-4xl font-semibold"
            style={{
              fontFamily: "var(--font-dm-serif)",
              color: "var(--text)",
            }}
          >
            {numPeople}
          </span>
          <button
            type="button"
            onClick={() => { setSaved(false); setNumPeople((p) => Math.min(20, p + 1)); }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-medium transition-colors"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            +
          </button>
        </div>
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
        onClick={handleSave}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: saved ? "rgba(45, 212, 191, 0.1)" : "var(--accent)",
          border: saved ? "1px solid rgba(45, 212, 191, 0.4)" : "1px solid transparent",
          color: saved ? "#2DD4BF" : "#0D0E11",
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
        ) : saved ? (
          "Saved"
        ) : (
          "Save changes"
        )}
      </button>
    </div>
  );
}
