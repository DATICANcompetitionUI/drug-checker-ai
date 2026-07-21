import Image from "next/image";
import Link from "next/link";
import Logo from "@/app/components/ui/Logo";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <main className="flex min-h-screen">
      {/* Left — image panel (desktop only) */}
      <div className="relative hidden lg:flex lg:w-[55%] xl:w-[60%]">
        <Image
          src="/image/accuray-AaVTg7jXUew-unsplash.jpg"
          alt="Medical facility"
          fill
          className="object-cover"
          priority
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-blue/90 via-primary-blue/75 to-slate-900/60" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
          {/* Logo — inverted (white) text mark */}
          <Link href="/" className="inline-flex self-start transition hover:opacity-80">
            <Logo href="" inverted showTagline={false} />
          </Link>

          {/* Headline */}
          <div className="max-w-md">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
              Secure medication workspace
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white xl:text-5xl">
              Clinical clarity for every medication decision.
            </h1>
            <p className="mt-5 text-base font-medium leading-7 text-blue-100">
              Search RxNav medications, check verified interactions, and generate concise clinical reports with AI explanations.
            </p>

            {/* Feature bullets */}
            <ul className="mt-8 space-y-3">
              {[
                "2–5 drug interaction checks",
                "Verified database + AI explanations",
                "Saved history and clinical reports",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-semibold text-blue-100">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-white text-[10px] font-black">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs font-medium text-blue-200/70">
            Drug Checker AI is for reference only and does not replace professional medical advice.
          </p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 sm:px-10">
        {/* Mobile logo */}
        <Link href="/" className="mb-10 inline-flex self-start transition hover:opacity-90 lg:hidden">
          <Logo href="" showTagline={false} />
        </Link>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight text-text-primary">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-sm font-medium leading-6 text-text-secondary">{subtitle}</p>
            )}
          </div>

          {children}

          <p className="mt-8 text-center text-xs font-semibold text-text-muted">
            Need help?{" "}
            <Link href="/#faq" className="text-primary-blue hover:underline">
              Read safety guidance
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
