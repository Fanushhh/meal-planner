import Link from "next/link";
import { ShoppingNavLink } from "./ShoppingNavLink";

export async function Header() {
  return (
    <header
      style={{
        background: "var(--paper-2)",
        borderBottom: "1px solid var(--rule)",
      }}
    >
      <div
        className="header-outer"
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 40px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Wordmark */}
        <Link href="/dashboard" className="nav-link" style={{
          fontSize: 22,
          fontFamily: "var(--font-fraunces, Georgia, serif)",
          fontWeight: 500,
          fontStyle: "italic",
          letterSpacing: "-0.01em",
          padding: 0,
          border: "none",
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          whiteSpace: "nowrap",
        }}>
          La Cucina
          <span className="header-tagline" style={{
            fontFamily: "var(--font-jetbrains, monospace)",
            fontSize: 9,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            fontStyle: "normal",
            fontWeight: 400,
          }}>
            ——  EST. MCMXCII
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Link href="/my-recipes" className="nav-link">
            Recipes
          </Link>

          <ShoppingNavLink label="Market List" hideLabelOnMobile />

          <Link
            href="/settings"
            className="nav-link"
            aria-label="Settings"
            style={{ padding: "6px 8px" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
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
