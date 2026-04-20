import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="small-caps"
            style={{ color: "var(--ink-3)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn("w-full bg-transparent py-2 text-sm outline-none", className)}
          style={{
            fontFamily: "var(--font-newsreader, Georgia, serif)",
            color: "var(--ink)",
            border: 0,
            borderBottom: `1px solid ${error ? "var(--accent)" : "var(--rule)"}`,
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderBottom = `1px solid ${error ? "var(--accent-ink)" : "var(--accent)"}`;
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderBottom = `1px solid ${error ? "var(--accent)" : "var(--rule)"}`;
            props.onBlur?.(e);
          }}
          {...props}
        />
        {error && (
          <p className="text-xs" style={{ color: "var(--accent)" }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
