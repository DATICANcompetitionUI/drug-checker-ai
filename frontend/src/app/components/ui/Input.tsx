import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-2xl border border-border-app bg-white px-4 py-3 text-text-primary placeholder:text-text-muted transition focus:border-primary-blue disabled:cursor-not-allowed disabled:bg-surface-app ${error ? "border-danger-red focus:border-danger-red" : ""} ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-danger-red">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
