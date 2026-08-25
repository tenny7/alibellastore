import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-surface-fg">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-gray-900 placeholder:text-surface-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50",
            error && "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-[#DC2626]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
