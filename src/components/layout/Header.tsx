import Link from "next/link";
import { ShoppingNavLink } from "./ShoppingNavLink";

export async function Header() {
  return (
    <header
      className="sticky top-0 z-20"
      style={{
        background: "rgba(13, 14, 17, 0.85)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6">
        {/* Wordmark */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 no-underline"
          style={{ textDecoration: "none" }}
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
            style={{
              background: "var(--accent-light)",
              border: "1px solid rgba(212, 120, 67, 0.22)",
            }}
          >
            🍽
          </span>
          <span
            className="text-[15px] leading-none"
            style={{ fontFamily: "var(--font-dm-serif)", color: "var(--text)" }}
          >
            Meal Planner
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-0 sm:gap-1">
          <Link
            href="/my-recipes"
            className="rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white/5 sm:px-3"
            style={{ color: "var(--text-muted)" }}
          >
            My Recipes
          </Link>

          <ShoppingNavLink label="Shopping List" />

          <Link
            href="/settings"
            aria-label="Settings"
            className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
            style={{ color: "var(--text-muted)" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>

        </nav>
      </div>
    </header>
  );
}
