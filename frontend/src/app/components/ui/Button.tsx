import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-blue text-white shadow-soft hover:bg-primary-blue-light",
  secondary:
    "border border-border-app bg-white text-text-secondary hover:border-primary-blue/30 hover:bg-surface-app hover:text-text-primary",
  ghost: "text-text-secondary hover:bg-surface-app hover:text-text-primary",
  danger: "bg-danger-red text-white shadow-soft hover:bg-red-700",
};

export default function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition duration-200 disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
