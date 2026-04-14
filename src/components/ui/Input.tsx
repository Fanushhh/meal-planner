import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={id}
            className="text-[11px] font-semibold uppercase tracking-[0.13em]"
            style={{ color: "var(--text-faint)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-xl px-4 py-3 text-sm transition-all outline-none",
            "placeholder:opacity-40",
            className
          )}
          style={{
            background: "var(--surface-raised)",
            border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "var(--border)"}`,
            color: "var(--text)",
            boxShadow: error
              ? "0 0 0 3px rgba(239,68,68,0.1)"
              : undefined,
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = `1px solid ${error ? "rgba(239,68,68,0.6)" : "var(--accent)"}`;
            e.currentTarget.style.boxShadow = error
              ? "0 0 0 3px rgba(239,68,68,0.12)"
              : "var(--accent-glow)";
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = `1px solid ${error ? "rgba(239,68,68,0.5)" : "var(--border)"}`;
            e.currentTarget.style.boxShadow = error ? "0 0 0 3px rgba(239,68,68,0.1)" : "none";
            props.onBlur?.(e);
          }}
          {...props}
        />
        {error && (
          <p className="text-xs" style={{ color: "#f87171" }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
