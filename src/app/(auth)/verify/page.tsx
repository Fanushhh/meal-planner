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
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: "var(--bg)" }}
      >
        <div className="text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No email address provided.
          </p>
          <Link
            href="/login"
            className="mt-2 inline-block text-sm transition-opacity hover:opacity-80"
            style={{ color: "var(--accent)" }}
          >
            Back to login
          </Link>
        </div>
      </div>
    );
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
          <div className="mb-7">
            <p
              className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--accent)", opacity: 0.9 }}
            >
              Check your inbox
            </p>
            <h1
              className="text-[32px] leading-none"
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontStyle: "italic",
                color: "var(--text)",
              }}
            >
              Enter code
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              We sent a 6-digit code to{" "}
              <span style={{ color: "var(--text)" }}>{email}</span>
            </p>
          </div>

          <VerifyForm email={email} />
        </div>
      </div>

      {/* Footer link */}
      <p className="mt-5 text-sm" style={{ color: "var(--text-faint)" }}>
        Wrong email?{" "}
        <Link
          href="/login"
          className="transition-opacity hover:opacity-80"
          style={{ color: "var(--text-muted)" }}
        >
          Go back
        </Link>
      </p>
    </div>
  );
}
