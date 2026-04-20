import { VerifyForm } from "@/components/auth/VerifyForm";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const { email } = await searchParams;

  if (!email) {
    return (
      <div
        style={{
          background: "var(--paper)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 16px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: 14,
              color: "var(--ink-2)",
              fontFamily: "var(--font-newsreader, Georgia, serif)",
            }}
          >
            No email address provided.
          </p>
          <Link
            href="/login"
            style={{
              display: "inline-block",
              marginTop: 8,
              fontSize: 12,
              fontFamily: "var(--font-jetbrains, monospace)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent)",
            }}
          >
            Back to login
          </Link>
        </div>
      </div>
    );
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
            Check your inbox
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
            Enter code
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--ink-2)",
              marginBottom: 28,
              fontFamily: "var(--font-newsreader, Georgia, serif)",
            }}
          >
            We sent a 6-digit code to{" "}
            <span style={{ color: "var(--ink)", fontStyle: "italic" }}>{email}</span>
          </p>
          <div className="rule" style={{ marginBottom: 28 }} />
          <VerifyForm email={email} />
        </div>
      </div>

      {/* Footer link */}
      <p
        style={{
          marginTop: 20,
          fontFamily: "var(--font-jetbrains, monospace)",
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
        }}
      >
        Wrong email?{" "}
        <Link
          href="/login"
          style={{ color: "var(--ink-2)", textDecoration: "underline", textDecorationColor: "var(--rule)" }}
        >
          Go back
        </Link>
      </p>
    </div>
  );
}
