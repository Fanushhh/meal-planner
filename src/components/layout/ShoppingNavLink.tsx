"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const UNSEEN_KEY = "meal-planner-shopping-unseen-v1";

function readUnseen(): number {
  try {
    return parseInt(localStorage.getItem(UNSEEN_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function ShoppingNavLink({ label, hideLabelOnMobile }: { label: string; hideLabelOnMobile?: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(readUnseen());
    const handler = () => setCount(readUnseen());
    window.addEventListener("shopping-list-change", handler);
    return () => window.removeEventListener("shopping-list-change", handler);
  }, []);

  return (
    <Link
      href="/shopping-list"
      style={{
        position: "relative",
        fontFamily: "var(--font-jetbrains, monospace)",
        fontSize: 10,
        letterSpacing: ".18em",
        textTransform: "uppercase",
        color: "var(--ink-2)",
        textDecoration: "none",
        padding: "6px 12px",
        border: "1px solid transparent",
        transition: "all .15s",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {hideLabelOnMobile ? (
        <>
          <span className="header-nav-text">{label}</span>
          <svg className="header-shopping-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
        </>
      ) : label}
      {count > 0 && (
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            background: "var(--accent)",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            lineHeight: 1,
            minWidth: 16,
            height: 16,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
          }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
