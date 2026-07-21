import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  FileText,
  Lock,
  Pill,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Button from "@/app/components/ui/Button";
import MedicalIllustration from "@/app/components/illustrations/MedicalIllustrations";
import FaqAccordion from "@/app/components/FaqAccordion";

const shell = "mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16 xl:px-24";

const features = [
  {
    icon: Search,
    title: "RxNav medication search",
    text: "Find standardized drug names, brands, dose forms, and RxCUI identifiers instantly.",
  },
  {
    icon: ShieldCheck,
    title: "Verified interaction checks",
    text: "Compare 2 to 5 medications against a verified clinical interaction database.",
  },
  {
    icon: Brain,
    title: "AI-powered explanations",
    text: "Gemini explains verified findings clearly without generating medical claims.",
  },
  {
    icon: FileText,
    title: "Clinical reports",
    text: "Generate and save concise reports from your interaction history for review.",
  },
];

const steps = [
  {
    icon: Search,
    title: "Search medications",
    text: "Use RxNav autocomplete to find drugs by generic name, brand name, or RxCUI.",
    illustration: "drug-search" as const,
  },
  {
    icon: Pill,
    title: "Select up to five",
    text: "Build a medication list and let the platform generate every possible drug pair.",
    illustration: "capsule" as const,
  },
  {
    icon: Activity,
    title: "Review risk",
    text: "Verified interactions are grouped by severity with effect and recommendation details.",
    illustration: "interaction" as const,
  },
  {
    icon: FileText,
    title: "Save reports",
    text: "Turn a saved check into a clinical report for follow-up or provider review.",
    illustration: "report" as const,
  },
];

const team = [
  {
    name: "Quadri Kobiowu",
    role: "Backend and AI Engineer",
    image: "/image/QuadriKobiowu.png",
    initials: "QK",
  },
  {
    name: "Bolatito Heritage",
    role: "Frontend Developer",
    image: "/image/King.png",
    initials: "HB",
  },
  {
    name: "Seyifunmi Oduntan",
    role: "Project Manager",
    image: "/image/Seyi.png",
    initials: "SO",
  },
];

const heroStats = [
  ["2 to 5", "drugs per check"],
  ["RxNav", "drug search"],
  ["Gemini", "clear explanations"],
  ["Reports", "saved history"],
];

export default function HomePage() {
  return (
    <main className="bg-white text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border-app bg-white/90 backdrop-blur-xl">
        <nav className={`${shell} flex h-20 items-center justify-between`}>
          <Link href="/" className="inline-flex transition hover:opacity-85">
            <span className="flex items-center gap-2 leading-none">
              <span className="text-[1.35rem] font-black tracking-tight text-text-primary">
                Drug<span className="text-primary-blue">Checker</span>
              </span>
              <span className="rounded-md bg-primary-blue px-1.5 py-[3px] text-[10px] font-black uppercase tracking-widest text-white">
                AI
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-bold text-text-secondary md:flex">
            <a href="#features" className="transition-colors hover:text-primary-blue">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-primary-blue">How it works</a>
            <a href="#team" className="transition-colors hover:text-primary-blue">Team</a>
            <a href="#faq" className="transition-colors hover:text-primary-blue">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden rounded-2xl px-4 py-2 text-sm font-bold text-text-secondary transition-colors hover:bg-surface-app sm:inline-flex">
              Sign in
            </Link>
            <Link href="/register">
              <Button className="px-5 py-2.5">
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative isolate min-h-[calc(100vh-80px)] overflow-hidden bg-primary-blue">
        <Image
          src="/image/hero.jpg"
          alt="Clinical medication safety workspace"
          fill
          className="object-cover object-center opacity-55"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,40,160,0.96)_0%,rgba(20,40,160,0.82)_42%,rgba(15,23,42,0.38)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full medical-grid opacity-[0.08]" />

        <div className={`${shell} relative z-10 grid min-h-[calc(100vh-80px)] items-center py-20 lg:grid-cols-[1fr_0.82fr] lg:gap-14`}>
          <div className="max-w-4xl">
            <div className="animate-rise-in inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-100 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              AI-assisted medication safety
            </div>

            <h1 className="animate-rise-in animation-delay-100 mt-8 max-w-5xl text-5xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Know before you combine medications.
            </h1>

            <p className="animate-rise-in animation-delay-200 mt-6 max-w-2xl text-lg font-medium leading-8 text-blue-100">
              Drug Checker AI helps users search medications, check verified drug-drug interactions, and understand risks through careful AI explanations based only on confirmed data.
            </p>

            <div className="animate-rise-in animation-delay-300 mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-bold text-primary-blue shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 sm:w-auto"
              >
                Start checking medications <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-7 py-4 text-sm font-bold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/20 sm:w-auto"
              >
                Sign in to dashboard
              </Link>
            </div>

            <div className="animate-rise-in animation-delay-400 mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {heroStats.map(([main, sub]) => (
                <div key={main} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-sm font-black text-white">{main}</p>
                  <p className="mt-0.5 text-xs font-semibold text-blue-200">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-scale-in animation-delay-300 hidden lg:block">
            <div className="relative ml-auto max-w-md">
              <div className="rounded-[36px] border border-white/20 bg-white/14 p-5 shadow-premium backdrop-blur-xl">
                <div className="rounded-[28px] bg-white p-5 text-text-primary shadow-soft">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-primary-blue">Live check</p>
                      <h2 className="mt-2 text-2xl font-black">Interaction review</h2>
                    </div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-blue text-white">
                      <ScanLine className="h-6 w-6" />
                    </span>
                  </div>

                  <div className="relative mt-6 overflow-hidden rounded-3xl border border-border-app bg-surface-app p-5">
                    <div className="animate-glow-sweep absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-primary-blue/10 to-transparent" />
                    <div className="relative space-y-3">
                      {["Ibuprofen", "Aspirin", "Warfarin"].map((drug) => (
                        <div key={drug} className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-soft">
                          <span className="flex items-center gap-3 text-sm font-black">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-blue/10 text-primary-blue">
                              <Pill className="h-4 w-4" />
                            </span>
                            {drug}
                          </span>
                          <CheckCircle2 className="h-5 w-5 text-medical-green" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl border border-danger-red/15 bg-danger-red/5 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-danger-red">High severity found</p>
                      <span className="rounded-full bg-danger-red px-3 py-1 text-xs font-black text-white">88%</span>
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-5 text-text-secondary">
                      Verified findings are explained in plain language with clinical recommendations.
                    </p>
                  </div>
                </div>
              </div>
              <div className="animate-float-gentle absolute -bottom-6 -left-8 rounded-3xl border border-white/20 bg-white p-4 shadow-premium">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-medical-green/15 text-medical-green">
                    <Lock className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-text-primary">Secure workspace</p>
                    <p className="text-xs font-semibold text-text-muted">Cookie-based sessions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative overflow-hidden bg-white py-24">
        <div className={shell}>
          <div className="max-w-2xl animate-rise-in">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-primary-blue">Platform features</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-text-primary">Built for clarity, not clutter.</h2>
            <p className="mt-4 text-base font-medium leading-7 text-text-secondary">
              Every feature is designed around one goal: helping users make safer medication decisions with verified data.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className={`animate-rise-in rounded-[28px] border border-border-app bg-white p-7 shadow-soft transition hover:-translate-y-1 hover:border-primary-blue/20 hover:shadow-premium ${index === 1 ? "animation-delay-100" : index === 2 ? "animation-delay-200" : index === 3 ? "animation-delay-300" : ""}`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-blue/10 transition group-hover:bg-primary-blue">
                  <feature.icon className="h-6 w-6 text-primary-blue" />
                </div>
                <h3 className="mt-5 text-lg font-black text-text-primary">{feature.title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-text-secondary">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative overflow-hidden bg-surface-app py-24">
        <div className="pointer-events-none absolute inset-0 medical-grid opacity-70" />
        <div className={shell}>
          <div className="mx-auto max-w-3xl text-center animate-rise-in">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-primary-blue">How it works</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-text-primary">A guided medication safety flow.</h2>
            <p className="mt-4 text-base font-medium leading-7 text-text-secondary">
              From search to report, the workflow stays simple while the system handles pairing, verification, and summaries.
            </p>
          </div>

          <div className="relative mt-16">
            <div className="absolute left-8 top-12 hidden h-1 w-[calc(100%-4rem)] rounded-full bg-border-app lg:block" />
            <div className="absolute left-8 top-12 hidden h-1 w-2/3 rounded-full bg-primary-blue lg:block" />
            <div className="grid gap-6 lg:grid-cols-4">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className={`animate-rise-in relative rounded-[30px] border border-border-app bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-premium ${index === 1 ? "animation-delay-100" : index === 2 ? "animation-delay-200" : index === 3 ? "animation-delay-300" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-blue text-white shadow-soft">
                      <step.icon className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-black text-primary-blue/40">0{index + 1}</span>
                  </div>
                  <MedicalIllustration name={step.illustration} className="mt-5 h-32 w-full" />
                  <h3 className="mt-5 text-xl font-black text-text-primary">{step.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-text-secondary">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="team" className="relative overflow-hidden bg-white py-24">
        <div className={shell}>
          <div className="max-w-2xl animate-rise-in">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-primary-blue">Our team</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-text-primary">The people building Drug Checker AI.</h2>
            <p className="mt-4 text-base font-medium leading-7 text-text-secondary">
              A focused project team working to make medication safety easier to understand and act on.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {team.map((member, index) => (
              <article
                key={member.name}
                className={`animate-rise-in overflow-hidden rounded-[30px] border border-border-app bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-premium ${index === 1 ? "animation-delay-100" : index === 2 ? "animation-delay-200" : ""}`}
              >
                <div className="relative flex h-64 items-center justify-center overflow-hidden bg-surface-app">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-[32px] border border-primary-blue/15 bg-white text-4xl font-black text-primary-blue shadow-soft">
                      {member.initials}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary-blue">
                    <UserRound className="h-4 w-4" />
                    Team member
                  </div>
                  <h3 className="mt-3 text-2xl font-black text-text-primary">{member.name}</h3>
                  <p className="mt-2 text-sm font-semibold text-text-secondary">{member.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-primary-blue py-24 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className={`${shell} grid gap-12 lg:grid-cols-2 lg:items-center`}>
          <div className="animate-rise-in">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Clinical reports</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight">Turn a medication check into a shareable clinical report.</h2>
            <p className="mt-5 text-base font-medium leading-8 text-blue-100">
              Reports are generated from saved history, keeping the workflow simple and connected to verified checks.
            </p>
            <ul className="mt-8 space-y-3">
              {["Severity summary and risk indicator", "Full list of verified interactions", "AI safety summary", "Clinician notes field"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-semibold text-blue-100">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-300" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-bold text-primary-blue shadow-lg transition hover:bg-blue-50"
            >
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="animate-scale-in animation-delay-100 rounded-[32px] bg-white/10 p-8 backdrop-blur-sm ring-1 ring-white/10">
            <MedicalIllustration name="report" className="h-52 w-full" />
            <div className="mt-6 space-y-3">
              {["Severity summary", "Verified interactions", "AI safety summary", "Clinician notes"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-sm font-bold text-white">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="relative overflow-hidden bg-surface-app py-24">
        <div className="pointer-events-none absolute inset-0 medical-grid opacity-60" />
        <div className={shell}>
          <div className="mx-auto max-w-4xl text-center animate-rise-in">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-primary-blue">FAQ</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-text-primary">Clear answers for safer use.</h2>
          </div>

          <div className="mx-auto mt-12 max-w-4xl animate-rise-in animation-delay-100">
            <FaqAccordion />
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className={shell}>
          <div className="relative overflow-hidden rounded-[40px] bg-primary-blue px-10 py-16 text-center shadow-premium md:px-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 medical-grid opacity-10" />
            <div className="relative animate-rise-in">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Ready to start?</p>
              <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-black tracking-tight text-white">Check medication safety with confidence.</h2>
              <p className="mx-auto mt-4 max-w-xl text-base font-medium text-blue-100">
                Create a free account, search medications, and generate clinical reports from verified interaction data.
              </p>
              <Link
                href="/register"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-primary-blue shadow-lg transition hover:bg-blue-50"
              >
                Create free account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border-app bg-white py-12">
        <div className={`${shell} flex flex-col gap-8 md:flex-row md:items-start md:justify-between`}>
          <div>
            <Link href="/" className="inline-flex transition hover:opacity-85">
              <span className="flex items-center gap-2 leading-none">
                <span className="text-[1.35rem] font-black tracking-tight text-text-primary">
                  Drug<span className="text-primary-blue">Checker</span>
                </span>
                <span className="rounded-md bg-primary-blue px-1.5 py-[3px] text-[10px] font-black uppercase tracking-widest text-white">
                  AI
                </span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm font-medium text-text-muted">Know before you combine.</p>
          </div>

          <div className="flex flex-wrap gap-12">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-text-muted">Product</p>
              <ul className="mt-3 space-y-2">
                {[["Features", "#features"], ["How it works", "#how-it-works"], ["Team", "#team"], ["FAQ", "#faq"]].map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="text-sm font-semibold text-text-secondary transition-colors hover:text-primary-blue">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-text-muted">Account</p>
              <ul className="mt-3 space-y-2">
                {[["Sign in", "/login"], ["Register", "/register"], ["Dashboard", "/dashboard"]].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm font-semibold text-text-secondary transition-colors hover:text-primary-blue">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className={`${shell} mt-10 border-t border-border-app pt-6`}>
          <p className="text-xs font-medium text-text-muted">
            Drug Checker AI is for reference only and does not replace professional medical advice, diagnosis, or treatment. Copyright {new Date().getFullYear()} Drug Checker AI.
          </p>
        </div>
      </footer>
    </main>
  );
}
