"use client";

import { useCallback, useEffect, useState } from "react";
import { useShoppingList } from "@/hooks/use-shopping-list";
import { buildCategories, formatItem, makeKey } from "@/lib/shopping-list-utils";

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied">("idle");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    });
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
      style={
        state === "copied"
          ? {
              background: "rgba(45, 212, 191, 0.1)",
              border: "1px solid rgba(45, 212, 191, 0.35)",
              color: "#2DD4BF",
            }
          : {
              background: "var(--surface-raised)",
              border: "1px solid var(--border-bright)",
              color: "var(--text-muted)",
            }
      }
    >
      {state === "copied" ? (
        <>
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 8l4 4 8-8" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="5" width="9" height="9" rx="1.5" />
            <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
          </svg>
          Copy list
        </>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ShoppingListClient() {
  const { items, hydrated, toggleChecked, removeItem, clearChecked, clearAll, clearUnseen } =
    useShoppingList();

  useEffect(() => {
    if (hydrated) clearUnseen();
  }, [hydrated, clearUnseen]);

  const categories = buildCategories(items);
  const totalItems = items.length;
  const checkedCount = items.filter((i) => i.checked).length;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const copyText = categories
    .map((cat) => {
      const lines = cat.items.map((item) => `  • ${formatItem(item)}`);
      return [`${cat.icon}  ${cat.name.toUpperCase()}`, ...lines].join("\n");
    })
    .join("\n\n");

  if (!hydrated) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-32 animate-pulse rounded-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          />
        ))}
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div
        className="rounded-2xl p-16 text-center"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <p className="mb-3 text-3xl" aria-hidden>🛒</p>
        <p
          className="mb-2 text-lg"
          style={{
            fontFamily: "var(--font-dm-serif)",
            fontStyle: "italic",
            color: "var(--text)",
          }}
        >
          Your list is empty
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Add ingredients from any recipe page.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Count + progress */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              <span style={{ color: "var(--text)", fontWeight: 600 }}>{checkedCount}</span>
              {" / "}
              {totalItems}{" "}
              <span
                className="text-[11px] uppercase tracking-[0.08em]"
                style={{ color: "var(--text-faint)" }}
              >
                items across {categories.length} {categories.length === 1 ? "category" : "categories"}
              </span>
            </span>
            <div
              className="h-1 w-48 overflow-hidden rounded-full"
              style={{ background: "var(--border)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: progress === 100 ? "rgba(45,212,191,0.7)" : "var(--accent)",
                }}
              />
            </div>
          </div>

          {/* Clear actions */}
          <div className="flex items-center gap-3">
            {checkedCount > 0 && (
              <button
                type="button"
                onClick={clearChecked}
                className="text-xs transition-opacity hover:opacity-100"
                style={{ color: "var(--text-faint)", opacity: 0.7 }}
              >
                Remove ticked
              </button>
            )}
            <button
              type="button"
              onClick={clearAll}
              className="text-xs transition-opacity hover:opacity-100"
              style={{ color: "var(--text-faint)", opacity: 0.5 }}
            >
              Clear all
            </button>
          </div>
        </div>

        <CopyButton text={copyText} />
      </div>

      {/* Category sections */}
      <div className="space-y-5">
        {categories.map((cat) => {
          const catChecked = cat.items.filter((i) => i.checked).length;
          const allDone = catChecked === cat.items.length;

          return (
            <section
              key={cat.name}
              className="overflow-hidden rounded-2xl transition-opacity duration-300"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                opacity: allDone ? 0.45 : 1,
              }}
            >
              {/* Category header */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base" aria-hidden>{cat.icon}</span>
                  <h2
                    className="text-[11px] font-semibold uppercase tracking-[0.13em]"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {cat.name}
                  </h2>
                </div>
                <span className="tabular-nums text-xs" style={{ color: "var(--text-faint)" }}>
                  {catChecked}/{cat.items.length}
                </span>
              </div>

              {/* Items */}
              <ul>
                {cat.items.map((item, idx) => {
                  const key = makeKey(item.name, item.unit);

                  return (
                    <li
                      key={idx}
                      className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                      style={{
                        borderTop: idx > 0 ? "1px solid var(--border-subtle)" : undefined,
                      }}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleChecked(item.name, item.unit)}
                        className="shrink-0 flex items-center justify-center rounded transition-all"
                        style={{
                          width: "1.125rem",
                          height: "1.125rem",
                          border: item.checked
                            ? "1.5px solid var(--accent)"
                            : "1.5px solid var(--border-bright)",
                          background: item.checked ? "var(--accent-light)" : "transparent",
                        }}
                        aria-label={item.checked ? "Unmark" : "Mark as got"}
                      >
                        {item.checked && (
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path
                              d="M1 3.5L3.5 6L8 1"
                              stroke="var(--accent)"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Label */}
                      <span
                        className="flex-1 text-sm leading-snug"
                        style={{
                          color: item.checked ? "var(--text-faint)" : "var(--text-muted)",
                          textDecoration: item.checked ? "line-through" : "none",
                          transition: "color 0.15s",
                        }}
                      >
                        {formatItem(item)}
                      </span>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.name, item.unit)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ color: "var(--text-faint)" }}
                        aria-label="Remove item"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Completion banner */}
      {progress === 100 && totalItems > 0 && (
        <div
          className="mt-8 rounded-2xl px-6 py-5 text-center"
          style={{
            background: "rgba(45, 212, 191, 0.06)",
            border: "1px solid rgba(45, 212, 191, 0.2)",
          }}
        >
          <p
            className="text-lg"
            style={{ fontFamily: "var(--font-dm-serif)", fontStyle: "italic", color: "#2DD4BF" }}
          >
            All done — enjoy your meal!
          </p>
        </div>
      )}
    </div>
  );
}
