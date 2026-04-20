import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const variantClass =
      variant === "primary" ? "btn btn-primary" :
      variant === "ghost" ? "btn btn-ghost" :
      variant === "danger" ? "btn" :
      "btn btn-ghost";

    const sizeStyle: React.CSSProperties =
      size === "lg" ? { width: "100%", justifyContent: "center", padding: "11px 24px" } :
      size === "sm" ? { padding: "6px 12px" } :
      {};

    const dangerStyle: React.CSSProperties =
      variant === "danger"
        ? { borderColor: "var(--accent)", color: "var(--accent)", background: "rgba(166,58,31,0.06)" }
        : {};

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(variantClass, "disabled:opacity-50 disabled:cursor-not-allowed", className)}
        style={{ ...sizeStyle, ...dangerStyle }}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              width="10" height="10" viewBox="0 0 10 10"
              fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
              className="animate-spin"
            >
              <path d="M5 1a4 4 0 1 1-4 4" />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
