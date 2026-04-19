"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useShoppingList } from "@/hooks/use-shopping-list";
import { buildCategories, formatItem, makeKey } from "@/lib/shopping-list-utils";
import type { ShoppingItem } from "@/lib/shopping-list-utils";

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
      style={{
        fontFamily: "var(--font-jetbrains, monospace)",
        fontSize: 10,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        background: state === "copied" ? "rgba(79,92,42,0.12)" : "transparent",
        border: "1px solid " + (state === "copied" ? "#4f5c2a" : "var(--rule)"),
        color: state === "copied" ? "#4f5c2a" : "var(--ink-2)",
        padding: "6px 12px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "all .15s",
      }}
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

// ─── Inline edit row ─────────────────────────────────────────────────────────

function EditRow({
  item,
  onSave,
  onCancel,
}: {
  item: ShoppingItem;
  onSave: (patch: { name: string; quantity: number | null; unit: string | null }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [qty, setQty] = useState(item.quantity !== null ? String(item.quantity) : "");
  const [unit, setUnit] = useState(item.unit ?? "");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSave({
      name: trimmedName,
      quantity: qty.trim() !== "" ? parseFloat(qty) || null : null,
      unit: unit.trim() || null,
    });
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--surface-raised)",
    border: "1px solid var(--border-bright)",
    borderRadius: "0.375rem",
    color: "var(--text)",
    fontSize: "0.8125rem",
    padding: "0.25rem 0.5rem",
    outline: "none",
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1">
      <input
        type="number"
        min="0"
        step="any"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="qty"
        style={{ ...inputStyle, width: "4rem" }}
      />
      <input
        type="text"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        placeholder="unit"
        style={{ ...inputStyle, width: "5rem" }}
      />
      <input
        ref={nameRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="name"
        style={{ ...inputStyle, flex: 1 }}
      />
      <button
        type="submit"
        style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: "0 2px" }}
        aria-label="Save"
      >
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
          <path d="M1 5.5L5 9.5L13 1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onCancel}
        style={{ color: "var(--text-faint)", background: "none", border: "none", cursor: "pointer", padding: "0 2px" }}
        aria-label="Cancel"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}

const CONDIMENTE_CATEGORY = "Condimente & Uleiuri"; // matches CATEGORY_RULES name in shopping-list-utils.ts
const HIDE_STAPLES_KEY = "meal-planner-hide-condimente-v1";

// ─── Main component ───────────────────────────────────────────────────────────

export function ShoppingListClient() {
  const { items, hydrated, toggleChecked, updateItem, removeItem, clearChecked, clearAll, clearUnseen } =
    useShoppingList();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [hideStaples, setHideStaples] = useState(false);

  useEffect(() => {
    if (hydrated) clearUnseen();
  }, [hydrated, clearUnseen]);

  useEffect(() => {
    try {
      setHideStaples(localStorage.getItem(HIDE_STAPLES_KEY) === "true");
    } catch {}
  }, []);

  function toggleHideStaples() {
    setHideStaples((prev) => {
      const next = !prev;
      try { localStorage.setItem(HIDE_STAPLES_KEY, String(next)); } catch {}
      return next;
    });
  }

  const allCategories = buildCategories(items);
  const categories = hideStaples
    ? allCategories.filter((c) => c.name !== CONDIMENTE_CATEGORY)
    : allCategories;
  const hiddenStaplesCount = hideStaples
    ? (allCategories.find((c) => c.name === CONDIMENTE_CATEGORY)?.items.length ?? 0)
    : 0;
  const totalItems = items.length;
  const checkedCount = items.filter((i) => i.checked).length;
  const visibleItems = categories.flatMap((c) => c.items);
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const copyText = categories
    .map((cat) => {
      const lines = cat.items.map((item) => `  • ${formatItem(item)}`);
      return [`${cat.icon}  ${cat.name.toUpperCase()}`, ...lines].join("\n");
    })
    .join("\n\n");

  if (!hydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="animate-pulse"
            style={{ height: 80, background: "var(--paper-2)", border: "1px solid var(--rule)" }}
          />
        ))}
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div style={{
        padding: "64px 40px",
        textAlign: "center",
        border: "1px solid var(--rule)",
      }}>
        <p style={{
          fontFamily: "var(--font-fraunces, Georgia, serif)",
          fontStyle: "italic",
          fontSize: 22,
          color: "var(--ink-2)",
          marginBottom: 8,
        }}>
          Your market list is empty
        </p>
        <p style={{ fontSize: 15, color: "var(--ink-3)" }}>
          Add ingredients from any recipe page.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        padding: "14px 0",
        borderTop: "1px solid var(--rule)",
        borderBottom: "1px solid var(--rule)",
        marginBottom: 32,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Count */}
          <span style={{
            fontFamily: "var(--font-jetbrains, monospace)",
            fontSize: 11,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
          }}>
            {visibleItems.length} ingredients · {checkedCount} gathered
            {hiddenStaplesCount > 0 && ` · ${hiddenStaplesCount} hidden`}
          </span>

          {/* Progress bar */}
          <div style={{ width: 120, height: 2, background: "var(--rule)", overflow: "hidden" }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              background: progress === 100 ? "var(--leaf)" : "var(--accent)",
              transition: "width .3s",
            }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Clear actions */}
          {checkedCount > 0 && (
            <button
              type="button"
              onClick={clearChecked}
              style={{
                fontFamily: "var(--font-jetbrains, monospace)",
                fontSize: 10,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                background: "none",
                border: "1px solid var(--rule)",
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              Remove ticked
            </button>
          )}
          <button
            type="button"
            onClick={clearAll}
            style={{
              fontFamily: "var(--font-jetbrains, monospace)",
              fontSize: 10,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              background: "none",
              border: "1px solid var(--rule)",
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            Clear all
          </button>

          {/* Hide pantry staples toggle */}
          <button
            type="button"
            onClick={toggleHideStaples}
            style={{
              fontFamily: "var(--font-jetbrains, monospace)",
              fontSize: 10,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              background: hideStaples ? "rgba(166,58,31,0.1)" : "transparent",
              border: "1px solid " + (hideStaples ? "var(--accent)" : "var(--rule)"),
              color: hideStaples ? "var(--accent)" : "var(--ink-2)",
              padding: "6px 12px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {hideStaples ? "Staples hidden" : "Hide staples"}
          </button>
          <CopyButton text={copyText} />
        </div>
      </div>

      {/* Category sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {categories.map((cat) => {
          const catChecked = cat.items.filter((i) => i.checked).length;
          const allDone = catChecked === cat.items.length;

          return (
            <section
              key={cat.name}
              style={{
                overflow: "hidden",
                transition: "opacity .3s",
                background: "var(--paper-2)",
                border: "1px solid var(--rule)",
                opacity: allDone ? 0.45 : 1,
              }}
            >
              {/* Category header */}
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--rule-2)" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 15 }} aria-hidden>{cat.icon}</span>
                  <h2 style={{
                    fontFamily: "var(--font-fraunces, Georgia, serif)",
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: 18,
                    color: "var(--ink)",
                    margin: 0,
                  }}>
                    {cat.name}
                  </h2>
                  <span style={{
                    fontFamily: "var(--font-jetbrains, monospace)",
                    fontSize: 11,
                    color: "var(--ink-3)",
                    letterSpacing: ".1em",
                  }}>
                    {String(cat.items.length).padStart(2, "0")}
                  </span>
                </div>
                <span style={{
                  fontFamily: "var(--font-jetbrains, monospace)",
                  fontSize: 11,
                  color: "var(--ink-3)",
                  letterSpacing: ".08em",
                }}>
                  {catChecked}/{cat.items.length}
                </span>
              </div>

              {/* Items */}
              <ul>
                {cat.items.map((item, idx) => {
                  const key = makeKey(item.name, item.unit);
                  const isEditing = editingKey === key;

                  return (
                    <li
                      key={idx}
                      className="group"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 20px",
                        borderTop: idx > 0 ? "1px solid var(--rule-2)" : undefined,
                        transition: "background .15s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLLIElement).style.background = "rgba(0,0,0,0.025)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLLIElement).style.background = ""; }}
                    >
                      {/* Checkbox — hidden while editing */}
                      {!isEditing && (
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
                      )}

                      {isEditing ? (
                        <EditRow
                          item={item}
                          onSave={(patch) => {
                            updateItem(item.name, item.unit, patch);
                            setEditingKey(null);
                          }}
                          onCancel={() => setEditingKey(null)}
                        />
                      ) : (
                        <>
                          {/* Label — clickable to toggle */}
                          <button
                            type="button"
                            onClick={() => toggleChecked(item.name, item.unit)}
                            className="flex-1 text-left"
                            style={{
                              color: item.checked ? "var(--text-faint)" : "var(--text-muted)",
                              textDecoration: item.checked ? "line-through" : "none",
                              transition: "color 0.15s",
                              cursor: "pointer",
                              background: "none",
                              border: "none",
                              padding: 0,
                            }}
                          >
                            <span className="block text-sm leading-snug">{formatItem(item)}</span>
                            {item.sources && item.sources.length > 0 && (
                              <span
                                className="block text-[11px] leading-snug mt-0.5"
                                style={{
                                  color: "var(--text-faint)",
                                  opacity: item.checked ? 0.5 : 0.7,
                                  textDecoration: "none",
                                  fontStyle: "italic",
                                }}
                              >
                                {item.sources.join(" · ")}
                              </span>
                            )}
                          </button>

                          {/* Edit — visible on hover */}
                          <button
                            type="button"
                            onClick={() => setEditingKey(key)}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
                            style={{ color: "var(--text-faint)" }}
                            aria-label="Edit item"
                          >
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                              <path d="M7.5 1.5l2 2L3 10H1V8L7.5 1.5z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>

                          {/* Remove — visible on hover */}
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
                        </>
                      )}
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
        <div style={{
          marginTop: 32,
          padding: "24px 0",
          textAlign: "center",
          borderTop: "1px solid var(--rule)",
          borderBottom: "1px solid var(--rule)",
        }}>
          <p style={{
            fontFamily: "var(--font-fraunces, Georgia, serif)",
            fontStyle: "italic",
            fontSize: 22,
            color: "var(--leaf)",
          }}>
            All gathered — enjoy your meal!
          </p>
        </div>
      )}
    </div>
  );
}
