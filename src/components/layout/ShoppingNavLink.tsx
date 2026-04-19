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

export function ShoppingNavLink({ label }: { label: string }) {
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
      className="relative"
      style={{
        fontFamily: "var(--font-jetbrains, monospace)",
        fontSize: 10,
        letterSpacing: ".18em",
        textTransform: "uppercase",
        color: "var(--ink-2)",
        textDecoration: "none",
        padding: "6px 12px",
        border: "1px solid transparent",
        transition: "all .15s",
      }}
    >
      {label}
      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums"
          style={{
            background: "var(--accent)",
            color: "#fff",
            lineHeight: 1,
          }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
