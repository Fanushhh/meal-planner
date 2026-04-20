"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePreferences } from "@/server/actions/preferences";

export function OnboardingWizard() {
  const [numPeople, setNumPeople] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit() {
    startTransition(async () => {
      const result = await savePreferences({ numPeople });
      if (result && "error" in result) {
        setError(result.error);
      } else {
        router.push("/dashboard");
      }
    });
  }

  return (
    <div
      style={{
        background: "var(--paper)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 16px",
      }}
    >
      {/* Wordmark */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div
          style={{
            fontFamily: "var(--font-fraunces, Georgia, serif)",
            fontStyle: "italic",
            fontSize: 30,
            color: "var(--ink)",
            letterSpacing: "0.01em",
          }}
        >
          La Cucina
        </div>
        <div
          style={{
            fontFamily: "var(--font-jetbrains, monospace)",
            fontSize: 9,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            marginTop: 5,
          }}
        >
          EST. MCMXCII
        </div>
      </div>

      {/* Ornament */}
      <div
        style={{
          color: "var(--rule)",
          fontSize: 12,
          marginBottom: 32,
          letterSpacing: "0.4em",
        }}
      >
        ✦
      </div>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--paper-2)",
          borderTop: "3px solid var(--accent)",
          borderLeft: "1px solid var(--rule)",
          borderRight: "1px solid var(--rule)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div style={{ padding: "36px 40px" }}>
          <p
            className="small-caps"
            style={{ color: "var(--ink-3)", marginBottom: 6 }}
          >
            One quick question
          </p>
          <h1
            style={{
              fontFamily: "var(--font-fraunces, Georgia, serif)",
              fontStyle: "italic",
              fontSize: 34,
              color: "var(--ink)",
              lineHeight: 1,
              marginBottom: 10,
            }}
          >
            Welcome
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--ink-2)",
              marginBottom: 28,
              fontFamily: "var(--font-newsreader, Georgia, serif)",
            }}
          >
            How many people are you cooking for? Ingredient quantities will be scaled to this number.
          </p>

          <div className="rule" style={{ marginBottom: 28 }} />

          {/* People picker */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 28,
              padding: "20px 16px",
              background: "var(--paper)",
              border: "1px solid var(--rule)",
            }}
          >
            <button
              type="button"
              onClick={() => setNumPeople((p) => Math.max(1, p - 1))}
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "1px solid var(--rule)",
                color: "var(--ink-2)",
                fontSize: 20,
                cursor: "pointer",
                fontFamily: "var(--font-fraunces, Georgia, serif)",
                transition: "background .15s, border-color .15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--paper-3)"; e.currentTarget.style.borderColor = "var(--ink-3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--rule)"; }}
            >
              −
            </button>

            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--font-fraunces, Georgia, serif)",
                  fontStyle: "italic",
                  fontSize: 52,
                  lineHeight: 1,
                  color: "var(--ink)",
                }}
              >
                {numPeople}
              </span>
              <span
                className="small-caps"
                style={{ color: "var(--ink-3)", marginTop: 4, display: "block" }}
              >
                {numPeople === 1 ? "person" : "people"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setNumPeople((p) => Math.min(20, p + 1))}
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "1px solid var(--rule)",
                color: "var(--ink-2)",
                fontSize: 20,
                cursor: "pointer",
                fontFamily: "var(--font-fraunces, Georgia, serif)",
                transition: "background .15s, border-color .15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--paper-3)"; e.currentTarget.style.borderColor = "var(--ink-3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--rule)"; }}
            >
              +
            </button>
          </div>

          {error && (
            <p
              style={{
                marginBottom: 16,
                fontSize: 13,
                color: "var(--accent)",
                fontFamily: "var(--font-newsreader, Georgia, serif)",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "11px 24px" }}
          >
            {isPending ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg
                  width="10" height="10" viewBox="0 0 10 10"
                  fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                  className="animate-spin"
                >
                  <path d="M5 1a4 4 0 1 1-4 4" />
                </svg>
                Saving…
              </span>
            ) : (
              "Start planning →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
