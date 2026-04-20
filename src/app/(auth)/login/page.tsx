import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
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
            Welcome back
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
            Sign in
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--ink-2)",
              marginBottom: 28,
              fontFamily: "var(--font-newsreader, Georgia, serif)",
            }}
          >
            Enter your email to receive a sign-in code.
          </p>
          <div className="rule" style={{ marginBottom: 28 }} />
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
