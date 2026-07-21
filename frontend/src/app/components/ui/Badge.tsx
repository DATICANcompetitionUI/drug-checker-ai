type BadgeVariant = "critical" | "high" | "moderate" | "low" | "none" | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  critical: "bg-danger-red/10 border-danger-red/20 text-danger-red border",
  high: "bg-severity-high/10 border-severity-high/20 text-severity-high border",
  moderate: "bg-severity-moderate/10 border-severity-moderate/20 text-severity-moderate border",
  low: "bg-severity-low/10 border-severity-low/20 text-severity-low border",
  none: "bg-severity-safe/10 border-severity-safe/20 text-severity-safe border",
  default: "bg-slate-100 border-slate-200 text-text-secondary border",
};

export default function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
