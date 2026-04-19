import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
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
          style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", color: "var(--text)" }}
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
          <div className="mb-7">
            <p
              className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--accent)", opacity: 0.9 }}
            >
              Welcome back
            </p>
            <h1
              className="text-[32px] leading-none"
              style={{
                fontFamily: "var(--font-fraunces, Georgia, serif)",
                fontStyle: "italic",
                color: "var(--text)",
              }}
            >
              Sign in
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Enter your email to receive a sign-in code.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
