"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePreferences } from "@/server/actions/preferences";

interface SettingsFormProps {
  initialNumPeople: number;
}

export function SettingsForm({ initialNumPeople }: SettingsFormProps) {
  const router = useRouter();
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
        setTimeout(() => router.push("/dashboard"), 1200);
      }
    });
  }

  return (
    <div>
      {/* Servings section */}
      <div style={{ marginBottom: 36 }}>
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
            Servings
          </div>
          <div className="small-caps">For ingredient scaling</div>
        </div>
        <div className="rule" style={{ marginBottom: 20 }} />

        <p style={{
          fontFamily: "var(--font-newsreader, Georgia, serif)",
          fontSize: 15,
          color: "var(--ink-2)",
          fontStyle: "italic",
          marginBottom: 20,
        }}>
          Ingredient quantities on recipes are scaled to this number.
        </p>

        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <button
            type="button"
            onClick={() => { setSaved(false); setNumPeople((p) => Math.max(1, p - 1)); }}
            style={{
              background: "none",
              border: "none",
              fontFamily: "var(--font-jetbrains, monospace)",
              fontSize: 20,
              color: "var(--ink-3)",
              cursor: "pointer",
              padding: "0 4px",
            }}
          >−</button>
          <span style={{
            fontFamily: "var(--font-fraunces, Georgia, serif)",
            fontSize: 48,
            fontWeight: 500,
            color: "var(--ink)",
            minWidth: 48,
            textAlign: "center",
            lineHeight: 1,
          }}>
            {numPeople}
          </span>
          <button
            type="button"
            onClick={() => { setSaved(false); setNumPeople((p) => Math.min(20, p + 1)); }}
            style={{
              background: "none",
              border: "none",
              fontFamily: "var(--font-jetbrains, monospace)",
              fontSize: 20,
              color: "var(--ink-3)",
              cursor: "pointer",
              padding: "0 4px",
            }}
          >+</button>
          <span className="small-caps">people</span>
        </div>
      </div>

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

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className={saved ? "btn" : "btn btn-primary"}
        style={saved ? {
          borderColor: "var(--leaf)",
          color: "var(--leaf)",
        } : { opacity: isPending ? 0.6 : 1 }}
      >
        {isPending ? "Saving…" : saved ? "✓ Saved" : "Save changes"}
      </button>
    </div>
  );
}
