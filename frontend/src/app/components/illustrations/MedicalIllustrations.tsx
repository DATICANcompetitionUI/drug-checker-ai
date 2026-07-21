type IllustrationName =
  | "drug-search"
  | "ai-assistant"
  | "medicine-bottle"
  | "capsule"
  | "interaction"
  | "report"
  | "dashboard"
  | "empty"
  | "no-results"
  | "safe"
  | "moderate"
  | "high"
  | "history"
  | "profile"
  | "scan"
  | "camera"
  | "barcode";

interface IllustrationProps {
  name: IllustrationName;
  className?: string;
}

const colors = {
  blue: "#1428A0",
  lightBlue: "#3046D3",
  green: "#4CD137",
  orange: "#F59E0B",
  red: "#FF0000",
  slate: "#475569",
  muted: "#E2E8F0",
  surface: "#F8FAFC",
};

function Base({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 240 180" fill="none" aria-hidden="true" className={className}>
      <rect x="18" y="18" width="204" height="144" rx="34" fill={colors.surface} />
      <circle cx="196" cy="42" r="16" fill="#EAF0FF" />
      <circle cx="44" cy="138" r="20" fill="#ECFDF3" />
      {children}
    </svg>
  );
}

export default function MedicalIllustration({ name, className = "h-40 w-40" }: IllustrationProps) {
  if (name === "drug-search") {
    return (
      <Base className={className}>
        <rect x="55" y="65" width="96" height="42" rx="21" fill="white" stroke={colors.blue} strokeWidth="6" />
        <path d="M124 107L157 140" stroke={colors.blue} strokeWidth="10" strokeLinecap="round" />
        <path d="M82 86H126" stroke={colors.green} strokeWidth="8" strokeLinecap="round" />
      </Base>
    );
  }
  if (name === "ai-assistant") {
    return (
      <Base className={className}>
        <rect x="67" y="45" width="106" height="88" rx="28" fill="white" stroke={colors.blue} strokeWidth="6" />
        <circle cx="100" cy="86" r="8" fill={colors.green} />
        <circle cx="140" cy="86" r="8" fill={colors.green} />
        <path d="M93 112C109 123 132 123 148 112" stroke={colors.blue} strokeWidth="7" strokeLinecap="round" />
        <path d="M120 32V45" stroke={colors.blue} strokeWidth="7" strokeLinecap="round" />
      </Base>
    );
  }
  if (name === "medicine-bottle") {
    return (
      <Base className={className}>
        <rect x="82" y="43" width="76" height="100" rx="18" fill="white" stroke={colors.blue} strokeWidth="6" />
        <rect x="94" y="29" width="52" height="22" rx="8" fill={colors.blue} />
        <rect x="96" y="78" width="48" height="28" rx="10" fill="#EAF0FF" />
        <path d="M111 92H129M120 83V101" stroke={colors.green} strokeWidth="6" strokeLinecap="round" />
      </Base>
    );
  }
  if (name === "capsule") {
    return (
      <Base className={className}>
        <rect x="57" y="73" width="126" height="44" rx="22" fill="white" stroke={colors.blue} strokeWidth="6" transform="rotate(-18 57 73)" />
        <path d="M111 54L126 96" stroke={colors.orange} strokeWidth="6" />
      </Base>
    );
  }
  if (name === "interaction") {
    return (
      <Base className={className}>
        <rect x="46" y="65" width="64" height="40" rx="20" fill="white" stroke={colors.blue} strokeWidth="6" />
        <rect x="130" y="78" width="64" height="40" rx="20" fill="white" stroke={colors.orange} strokeWidth="6" />
        <path d="M110 86H130M120 76V96" stroke={colors.slate} strokeWidth="5" strokeLinecap="round" />
        <path d="M78 85H92M162 98H176" stroke={colors.green} strokeWidth="5" strokeLinecap="round" />
      </Base>
    );
  }
  if (name === "report") {
    return (
      <Base className={className}>
        <rect x="70" y="34" width="100" height="116" rx="18" fill="white" stroke={colors.blue} strokeWidth="6" />
        <path d="M94 68H146M94 92H146M94 116H126" stroke={colors.slate} strokeWidth="6" strokeLinecap="round" />
        <circle cx="150" cy="128" r="18" fill={colors.green} />
        <path d="M141 128L148 135L161 119" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </Base>
    );
  }
  if (name === "dashboard") {
    return (
      <Base className={className}>
        <rect x="52" y="45" width="136" height="90" rx="18" fill="white" stroke={colors.blue} strokeWidth="6" />
        <rect x="70" y="66" width="36" height="22" rx="8" fill="#EAF0FF" />
        <rect x="116" y="66" width="52" height="22" rx="8" fill="#ECFDF3" />
        <path d="M72 111H166" stroke={colors.blue} strokeWidth="7" strokeLinecap="round" />
      </Base>
    );
  }
  if (name === "empty" || name === "no-results") {
    return (
      <Base className={className}>
        <circle cx="120" cy="84" r="36" fill="white" stroke={colors.muted} strokeWidth="6" />
        <path d="M104 84H136" stroke={name === "empty" ? colors.blue : colors.orange} strokeWidth="7" strokeLinecap="round" />
        {name === "no-results" && <path d="M120 68V100" stroke={colors.orange} strokeWidth="7" strokeLinecap="round" />}
      </Base>
    );
  }
  if (name === "safe" || name === "moderate" || name === "high") {
    const tone = name === "safe" ? colors.green : name === "moderate" ? colors.orange : colors.red;
    return (
      <Base className={className}>
        <circle cx="120" cy="88" r="42" fill="white" stroke={tone} strokeWidth="7" />
        {name === "safe" ? (
          <path d="M98 88L114 104L144 70" stroke={tone} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M120 62V94M120 114V116" stroke={tone} strokeWidth="9" strokeLinecap="round" />
        )}
      </Base>
    );
  }
  if (name === "history") {
    return (
      <Base className={className}>
        <path d="M78 54V128" stroke={colors.blue} strokeWidth="7" strokeLinecap="round" />
        <circle cx="78" cy="64" r="10" fill={colors.green} />
        <circle cx="78" cy="94" r="10" fill={colors.orange} />
        <circle cx="78" cy="124" r="10" fill={colors.blue} />
        <path d="M100 64H156M100 94H176M100 124H146" stroke={colors.slate} strokeWidth="6" strokeLinecap="round" />
      </Base>
    );
  }
  if (name === "profile") {
    return (
      <Base className={className}>
        <circle cx="120" cy="70" r="28" fill="white" stroke={colors.blue} strokeWidth="6" />
        <path d="M76 138C82 113 99 102 120 102C141 102 158 113 164 138" fill="white" stroke={colors.blue} strokeWidth="6" strokeLinecap="round" />
      </Base>
    );
  }
  if (name === "scan" || name === "camera" || name === "barcode") {
    return (
      <Base className={className}>
        <rect x="62" y="45" width="116" height="90" rx="20" fill="white" stroke={colors.blue} strokeWidth="6" />
        {name === "barcode" ? (
          <path d="M85 70V112M99 70V112M118 70V112M134 70V112M154 70V112" stroke={colors.slate} strokeWidth="5" />
        ) : (
          <>
            <circle cx="120" cy="90" r="24" fill="#EAF0FF" stroke={colors.green} strokeWidth="6" />
            <path d="M86 58H104M136 58H154M86 122H104M136 122H154" stroke={colors.blue} strokeWidth="5" strokeLinecap="round" />
          </>
        )}
      </Base>
    );
  }
  return null;
}
