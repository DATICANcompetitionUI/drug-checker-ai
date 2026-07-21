import Link from "next/link";

interface LogoProps {
  href?: string;
  showTagline?: boolean;
  className?: string;
  inverted?: boolean;
}

function LogoMark({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2 leading-none">
      <span className={`text-[1.35rem] font-black tracking-tight leading-none ${inverted ? "text-white" : "text-text-primary"}`}>
        Drug<span className={inverted ? "text-blue-200" : "text-primary-blue"}>Checker</span>
      </span>
      <span className={`rounded-md px-1.5 py-[3px] text-[10px] font-black uppercase tracking-widest leading-none ${inverted ? "border border-white/30 bg-white/15 text-white" : "bg-primary-blue text-white"}`}>
        AI
      </span>
    </span>
  );
}

export default function Logo({ href = "/", showTagline = true, className = "", inverted = false }: LogoProps) {
  const mark = (
    <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <LogoMark inverted={inverted} />
      {showTagline && (
        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${inverted ? "text-white/50" : "text-text-muted"}`}>
          Know before you combine
        </span>
      )}
    </div>
  );

  if (!href) return mark;

  return (
    <Link href={href} className="inline-flex transition hover:opacity-85">
      {mark}
    </Link>
  );
}
