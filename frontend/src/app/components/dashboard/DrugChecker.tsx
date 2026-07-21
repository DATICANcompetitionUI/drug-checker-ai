"use client";

import {
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Barcode,
  Brain,
  Camera,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Mic,
  Pill,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";
import DashboardHeader from "@/app/components/dashboard/DashboardHeader";
import DrugScanner from "@/app/components/dashboard/DrugScanner";
import BarcodeScanner from "@/app/components/dashboard/BarcodeScanner";
import MedicalIllustration from "@/app/components/illustrations/MedicalIllustrations";
import { api } from "@/lib/api";
import { Drug, InteractionCheckResult, Severity } from "@/lib/types";

const POPULAR_MEDICATIONS = [
  "Ibuprofen", "Aspirin", "Paracetamol", "Metformin", "Lisinopril",
  "Atorvastatin", "Amoxicillin", "Warfarin", "Omeprazole", "Amlodipine",
  "Simvastatin", "Metoprolol",
];
const RECENT_KEY = "drug-checker-recent";
const MAX_RECENT = 6;

function severityVariant(severity?: Severity | null) {
  if (severity === "HIGH") return "high";
  if (severity === "MODERATE") return "moderate";
  if (severity === "LOW") return "low";
  return "none";
}

function riskPercentage(severity?: Severity | null, hasResult = false) {
  if (severity === "HIGH") return 88;
  if (severity === "MODERATE") return 58;
  if (severity === "LOW") return 24;
  if (hasResult) return 0;
  return 0;
}

function severityColor(severity?: Severity | null, hasResult = false) {
  if (severity === "HIGH") return "bg-danger-red";
  if (severity === "MODERATE") return "bg-warning-orange";
  if (severity === "LOW") return "bg-medical-green";
  if (hasResult) return "bg-medical-green";
  return "bg-primary-blue/20";
}

function severityTextColor(severity?: Severity | null, hasResult = false) {
  if (severity === "HIGH") return "text-danger-red";
  if (severity === "MODERATE") return "text-warning-orange";
  if (severity === "LOW") return "text-medical-green";
  if (hasResult) return "text-medical-green";
  return "text-text-muted";
}

const SECTION_HEADERS = new Set([
  "overall risk", "key findings", "next steps", "summary", "findings", "recommendations",
]);

function AiSummaryBody({ text }: { text?: string | null }) {
  if (!text) {
    return <p className="mt-4 text-sm font-medium text-text-muted">No AI summary available for this combination.</p>;
  }

  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="mt-4 space-y-4">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) return null;

        const firstLine = lines[0];
        const isHeader = SECTION_HEADERS.has(firstLine.toLowerCase().replace(/[*:#]+/g, "").trim()) || /^#{1,3}\s/.test(firstLine);
        const headerText = firstLine.replace(/^#{1,3}\s+/, "").replace(/\*+/g, "").trim();
        const bodyLines = isHeader ? lines.slice(1) : lines;

        return (
          <div key={bi}>
            {isHeader && (
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-primary-blue">{headerText}</p>
            )}
            {bodyLines.map((line, li) => {
              const isBullet = /^[-*]\s/.test(line);
              const content = isBullet ? line.replace(/^[-*]\s+/, "") : line;
              if (isBullet) {
                return (
                  <div key={li} className="flex items-start gap-2.5 py-1">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-blue/50" />
                    <p className="text-sm font-medium leading-6 text-text-secondary">{content}</p>
                  </div>
                );
              }
              return (
                <p key={li} className="text-sm font-medium leading-6 text-text-secondary">
                  {content}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function loadRecentSearches(): string[] {
  try {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)));
  } catch {}
}

export default function DrugChecker() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Drug[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedDrugs, setSelectedDrugs] = useState<Drug[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadRecentSearches());
  const [isSearching, setIsSearching] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [result, setResult] = useState<InteractionCheckResult | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportNotes, setReportNotes] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Debounced search
  useEffect(() => {
    const clean = query.trim();
    if (clean.length < 2) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");
      setActiveIndex(-1);
      try {
        const response = await api.drugs.search(clean);
        const selectedIds = new Set(selectedDrugs.map((d) => d.rxcui));
        const filtered = response.data.drugs.filter((d) => !selectedIds.has(d.rxcui));
        setSuggestions(filtered);
        setDropdownOpen(true);
      } catch (err) {
        setSuggestions([]);
        setSearchError(err instanceof Error ? err.message : "Unable to search medications.");
        setDropdownOpen(true);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [query, selectedDrugs]);

  const canCheck = selectedDrugs.length >= 2 && selectedDrugs.length <= 5;
  const highestSeverity = result?.safetySummary.highestSeverity ?? null;
  const hasResult = Boolean(result);
  const risk = riskPercentage(highestSeverity, hasResult);
  const riskTitle = !hasResult ? "Awaiting check" : highestSeverity ? `${highestSeverity} risk` : "No verified risk";
  const riskBadge = !hasResult ? "READY" : highestSeverity || "CLEAR";
  const riskBadgeVariant = hasResult && !highestSeverity ? "low" : severityVariant(highestSeverity);

  const selectDrug = useCallback(
    (drug: Drug) => {
      if (selectedDrugs.length >= 5) {
        toast.error("You can check up to 5 medications at a time.");
        return;
      }
      if (selectedDrugs.some((d) => d.rxcui === drug.rxcui)) return;

      setSelectedDrugs((prev) => [...prev, drug]);
      setResult(null);
      setQuery("");
      setSuggestions([]);
      setDropdownOpen(false);
      setActiveIndex(-1);

      // Persist recent searches
      setRecentSearches((prev) => {
        const next = [drug.name, ...prev.filter((n) => n !== drug.name)].slice(0, MAX_RECENT);
        saveRecentSearches(next);
        return next;
      });

      inputRef.current?.focus();
    },
    [selectedDrugs]
  );

  function removeDrug(rxcui: string) {
    setSelectedDrugs((prev) => prev.filter((d) => d.rxcui !== rxcui));
    setResult(null);
  }

  function updateQuery(value: string) {
    setQuery(value);
    const clean = value.trim();
    if (clean.length < 2) {
      setSuggestions([]);
      setSearchError("");
      setActiveIndex(-1);
      setDropdownOpen(false);
    }
  }

  function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!dropdownOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectDrug(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleClickOutside(e: MouseEvent<HTMLDivElement>) {
    if (!dropdownRef.current?.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) {
      setDropdownOpen(false);
    }
  }

  async function checkInteractions() {
    if (!canCheck) return;
    setIsChecking(true);
    setResult(null);
    try {
      const response = await api.interactions.check(selectedDrugs);
      setResult(response.data);
      setReportTitle(`Medication safety report: ${selectedDrugs.map((d) => d.name).join(" + ")}`);
      toast.success(response.data.historySaved ? "Interaction check saved to history." : "Interaction check complete.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to check interactions.");
    } finally {
      setIsChecking(false);
    }
  }

  async function generateReport(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!result?.historyId) {
      toast.error("Sign in and run a saved interaction check before generating a report.");
      return;
    }
    setIsGeneratingReport(true);
    try {
      const response = await api.reports.generate({
        historyId: result.historyId,
        title: reportTitle || "Drug Interaction Report",
        notes: reportNotes,
      });
      toast.success("Clinical report generated.");
      router.push(`/dashboard/report?id=${response.data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to generate report.");
    } finally {
      setIsGeneratingReport(false);
    }
  }

  const statCards = useMemo(() => {
    const s = result?.safetySummary;
    return [
      { label: "Selected", value: selectedDrugs.length },
      { label: "Pairs checked", value: s?.totalPairsChecked ?? Math.max(0, (selectedDrugs.length * (selectedDrugs.length - 1)) / 2) },
      { label: "Interactions", value: s?.verifiedInteractions ?? 0 },
      { label: "Duplicates", value: s?.duplicateTherapies ?? 0 },
    ];
  }, [result, selectedDrugs.length]);

  const showDropdown = dropdownOpen && query.trim().length >= 2;

  return (
    <div onClick={handleClickOutside}>
      <DashboardHeader
        title="Medication safety workspace"
        description="Type generic medication names when possible, select up to 5 drugs, and check verified interaction records with AI explanations."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Left column */}
        <section className="space-y-5">

          {/* Search card */}
          <Card padding="lg">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-primary-blue">Search medication</p>
                <h2 className="mt-1.5 text-2xl font-black text-text-primary">Find a medication</h2>
                <p className="mt-1 text-sm font-medium text-text-secondary">
                  Add drugs by typing the generic name for best accuracy. Brand names, camera scan, and barcode are best-effort helpers.
                </p>
              </div>

              {/* Scan buttons */}
              <div className="flex flex-wrap shrink-0 gap-2">
                <button
                  onClick={() => setScannerOpen(true)}
                  title="Best-effort camera OCR. If it misses, type the generic drug name."
                  className="flex items-center gap-1.5 rounded-2xl border border-primary-blue/30 bg-primary-blue/5 px-3 py-2 text-xs font-bold text-primary-blue transition hover:bg-primary-blue/10"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Camera
                </button>
                <button
                  onClick={() => setBarcodeScannerOpen(true)}
                  title="Best-effort barcode lookup. If it misses, type the generic drug name."
                  className="flex items-center gap-1.5 rounded-2xl border border-primary-blue/30 bg-primary-blue/5 px-3 py-2 text-xs font-bold text-primary-blue transition hover:bg-primary-blue/10"
                >
                  <Barcode className="h-3.5 w-3.5" />
                  Barcode
                </button>
                <div className="relative">
                  <button
                    disabled
                    title="Voice coming soon"
                    className="flex items-center gap-1.5 rounded-2xl border border-border-app bg-surface-app px-3 py-2 text-xs font-bold text-text-muted opacity-60 cursor-not-allowed"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    Voice
                  </button>
                  <span className="absolute -right-1 -top-1.5 rounded-full bg-primary-blue px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                    Soon
                  </span>
                </div>
              </div>
            </div>

            {/* Search input */}
            <div className="relative mt-5" ref={dropdownRef}>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => updateQuery(e.target.value)}
                onFocus={() => query.trim().length >= 2 && setDropdownOpen(true)}
                onKeyDown={handleInputKeyDown}
                placeholder="Type generic name: ibuprofen, aspirin, paracetamol..."
                autoComplete="off"
                aria-label="Search medications"
                aria-autocomplete="list"
                className="w-full rounded-3xl border border-border-app bg-surface-app py-4 pl-12 pr-12 text-base font-semibold text-text-primary placeholder:font-medium placeholder:text-text-muted focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/10 transition"
              />
              {isSearching ? (
                <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-primary-blue" />
              ) : query ? (
                <button
                  onClick={() => updateQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl p-1 text-text-muted hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}

              {/* Search dropdown */}
              {showDropdown && (
                <div
                  role="listbox"
                  className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[26px] border border-border-app bg-white shadow-premium"
                >
                  {isSearching && (
                    <div className="space-y-2 p-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 rounded-2xl p-3">
                          <div className="h-9 w-9 animate-pulse rounded-2xl bg-surface-app" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3.5 w-1/3 animate-pulse rounded-full bg-surface-app" />
                            <div className="h-3 w-1/2 animate-pulse rounded-full bg-surface-app" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isSearching && suggestions.length > 0 && (
                    <div className="max-h-72 overflow-y-auto">
                      {suggestions.map((drug, idx) => (
                        <button
                          key={drug.rxcui}
                          role="option"
                          aria-selected={idx === activeIndex}
                          onClick={() => selectDrug(drug)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex w-full items-center gap-4 border-b border-border-app px-5 py-3.5 text-left last:border-b-0 transition-colors ${idx === activeIndex ? "bg-primary-blue/5" : "hover:bg-surface-app"}`}
                        >
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition ${idx === activeIndex ? "bg-primary-blue text-white" : "bg-primary-blue/10 text-primary-blue"}`}>
                            <Pill className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-black text-text-primary">{drug.name}</span>
                            {drug.aliases && drug.aliases.length > 0 && (
                              <span className="mt-0.5 block truncate text-xs font-medium text-text-muted">
                                Also: {drug.aliases.slice(0, 4).join(", ")}
                              </span>
                            )}
                            <span className="mt-0.5 block text-xs font-bold text-primary-blue/60">Generic medicine</span>
                          </span>
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition ${idx === activeIndex ? "bg-primary-blue text-white" : "bg-surface-app text-text-muted"}`}>
                            <Plus className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {!isSearching && suggestions.length === 0 && (
                    <div className="p-8 text-center">
                      <MedicalIllustration name={searchError ? "no-results" : "empty"} className="mx-auto h-24 w-32" />
                      <p className="mt-3 text-sm font-black text-text-primary">{searchError || "No medications found"}</p>
                      <p className="mt-1 text-xs font-medium text-text-muted">
                        Try a different spelling, brand name, or the active generic ingredient printed on the pack.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent searches / Popular medications */}
            <div className="mt-5 space-y-3">
              {recentSearches.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-text-muted">
                    <Clock className="h-3.5 w-3.5" /> Recent
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((name) => (
                      <button
                        key={name}
                        onClick={() => updateQuery(name)}
                        className="flex items-center gap-1.5 rounded-full border border-border-app bg-white px-3 py-1.5 text-xs font-bold text-text-secondary hover:border-primary-blue/30 hover:text-primary-blue transition"
                      >
                        <Clock className="h-3 w-3 text-text-muted" />
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-text-muted">
                  <TrendingUp className="h-3.5 w-3.5" /> Popular
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_MEDICATIONS.map((name) => (
                    <button
                      key={name}
                      onClick={() => updateQuery(name)}
                      className="rounded-full border border-border-app bg-white px-3 py-1.5 text-xs font-bold text-text-secondary hover:border-primary-blue/30 hover:text-primary-blue transition"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Selected medications card */}
          <Card padding="lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-primary-blue">Selected medications</p>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <h2 className="text-2xl font-black text-text-primary">{selectedDrugs.length} / 5</h2>
                  <span className="text-sm font-medium text-text-muted">
                    {selectedDrugs.length < 2 ? `(${2 - selectedDrugs.length} more needed)` : "ready to check"}
                  </span>
                </div>
              </div>
              <Button
                disabled={!canCheck || isChecking}
                onClick={checkInteractions}
                className="shrink-0 px-5 py-3"
              >
                {isChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isChecking ? "Checking..." : "Check interactions"}
              </Button>
            </div>

            {selectedDrugs.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {selectedDrugs.map((drug, idx) => (
                  <div
                    key={drug.rxcui}
                    className="group relative flex items-start gap-3 rounded-[26px] border border-border-app bg-white p-4 shadow-soft transition hover:border-primary-blue/20"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-blue/10 text-primary-blue">
                      <Pill className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-text-primary">{drug.name}</p>
                      {drug.aliases && drug.aliases.length > 0 ? (
                        <p className="mt-0.5 truncate text-xs font-medium text-text-muted">
                          {drug.aliases.slice(0, 3).join(", ")}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs font-bold text-primary-blue/60">Generic drug</p>
                      )}
                      <span className="mt-1.5 inline-flex items-center rounded-full bg-primary-blue/8 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-primary-blue">
                        #{idx + 1}
                      </span>
                    </div>
                    <button
                      onClick={() => removeDrug(drug.rxcui)}
                      aria-label={`Remove ${drug.name}`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-transparent p-1 text-text-muted opacity-0 transition group-hover:border-border-app group-hover:opacity-100 hover:bg-danger-red/10 hover:text-danger-red"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[28px] border border-dashed border-border-app bg-surface-app p-10 text-center">
                <MedicalIllustration name="drug-search" className="mx-auto h-32 w-40" />
                <p className="mt-3 text-sm font-black text-text-primary">No medications selected yet</p>
                <p className="mt-1 text-sm font-medium text-text-secondary">
                  Search and add at least 2 medications to start the check.
                </p>
              </div>
            )}
          </Card>
        </section>

        {/* Right column */}
        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <Card padding="lg" className={`overflow-hidden ${hasResult ? "border-primary-blue/20" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-primary-blue">Risk summary</p>
                <h2 className={`mt-2 text-2xl font-black ${hasResult ? severityTextColor(highestSeverity, hasResult) : "text-text-primary"}`}>
                  {riskTitle}
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-text-secondary">
                  {result?.safetySummary.actionMessage ||
                    "Select at least 2 medications and run a check to see the safety summary."}
                </p>
              </div>
              <Badge variant={riskBadgeVariant}>
                {riskBadge}
              </Badge>
            </div>

            <div className="mt-5">
              <div className="flex items-end justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Risk indicator</span>
                <span className="text-4xl font-black text-text-primary">{risk}%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-app">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${severityColor(highestSeverity, hasResult)}`}
                  style={{ width: `${risk}%` }}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {statCards.map(({ label, value }) => (
                <div key={label} className="rounded-2xl border border-border-app bg-surface-app p-3">
                  <p className="text-[10px] font-bold text-text-muted">{label}</p>
                  <p className="mt-1 text-xl font-black text-text-primary">{value}</p>
                </div>
              ))}
            </div>

            {result && (
              <div className="mt-5 border-t border-border-app pt-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary-blue/10">
                    <Brain className="h-4 w-4 text-primary-blue" />
                  </span>
                  <h3 className="text-base font-black">AI safety summary</h3>
                </div>
                <AiSummaryBody text={result.aiSummary} />
              </div>
            )}
          </Card>

          {!result && (
            <Card padding="lg" className="border-dashed bg-surface-app/50">
              <div className="flex items-center gap-2.5">
                <Zap className="h-5 w-5 text-primary-blue" />
                <h3 className="text-sm font-black text-text-primary">How it works</h3>
              </div>
              <ol className="mt-4 space-y-3 text-sm font-medium text-text-secondary">
                {[
                  "Search and select 2 to 5 generic medications",
                  "Click Check interactions to scan the verified database",
                  "Review severity, clinical effects, and AI explanations",
                  "Optionally save as a clinical report",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-blue/10 text-xs font-black text-primary-blue">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </aside>
      </div>

      {/* Interaction results */}
      {result && (
        <section className="mt-6 space-y-5">
          {/* Duplicate therapy warnings */}
          {result.duplicateTherapies.length > 0 && (
            <Card padding="lg" className="border-warning-orange/25 bg-warning-orange/5">
              <h3 className="flex items-center gap-2.5 text-base font-black text-warning-orange">
                <AlertTriangle className="h-5 w-5" /> Duplicate therapy warnings
              </h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {result.duplicateTherapies.map((warning) => (
                  <div key={warning.ingredient.rxcui} className="rounded-3xl bg-white p-4 shadow-soft">
                    <p className="font-black text-text-primary">{warning.ingredient.name}</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-text-secondary">{warning.effect}</p>
                    <p className="mt-2 text-sm font-bold text-warning-orange">{warning.recommendation}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Verified interactions */}
          <Card padding="lg">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-primary-blue">Interaction findings</p>
                <h2 className="mt-1.5 text-2xl font-black text-text-primary">
                  {result.interactions.length
                    ? `${result.interactions.length} finding${result.interactions.length !== 1 ? "s" : ""}`
                    : "No findings"}
                </h2>
              </div>
              <Button disabled={!result.historyId} onClick={() => setReportOpen(true)} className="shrink-0 px-5 py-3">
                <FileText className="h-4 w-4" />
                Generate report
              </Button>
            </div>

            {result.interactions.length > 0 ? (
              <div className="mt-6 space-y-4">
                {result.interactions.map((interaction) => (
                  <article
                    key={`${interaction.drugA.rxcui}-${interaction.drugB.rxcui}`}
                    className="overflow-hidden rounded-[32px] border border-border-app bg-white shadow-soft"
                  >
                    {/* Header: drug pair and severity */}
                    <div className="flex flex-col gap-3 border-b border-border-app bg-surface-app px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2 text-sm font-black text-text-primary shadow-soft">
                          <Pill className="h-4 w-4 text-primary-blue" /> {interaction.drugA.name}
                        </span>
                        <span className="text-text-muted font-bold">+</span>
                        <span className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2 text-sm font-black text-text-primary shadow-soft">
                          <Pill className="h-4 w-4 text-primary-blue" /> {interaction.drugB.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <Badge variant={severityVariant(interaction.severity)}>{interaction.severity}</Badge>
                        {interaction.isAiGenerated ? (
                          <span className="flex items-center gap-1 rounded-full border border-primary-blue/20 bg-primary-blue/8 px-3 py-1 text-xs font-bold text-primary-blue">
                            <Brain className="h-3 w-3" />
                            AI Analysis
                          </span>
                        ) : (
                          <span className="rounded-full border border-border-app bg-white px-3 py-1 text-xs font-bold text-text-muted">
                            {interaction.source}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Flow body */}
                    <div className="divide-y divide-border-app">
                      <div className="flex gap-4 px-6 py-4">
                        <div className="flex flex-col items-center gap-1 pt-0.5">
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs font-black ${severityColor(interaction.severity)}`}>
                            !
                          </span>
                          <div className="w-px flex-1 bg-border-app" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-text-muted">Clinical effect</p>
                          <p className="mt-1.5 text-sm font-medium leading-6 text-text-secondary">{interaction.effect}</p>
                        </div>
                      </div>

                      <div className="flex gap-4 px-6 py-4">
                        <div className="flex flex-col items-center gap-1 pt-0.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-blue text-white">
                            <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                          <div className="w-px flex-1 bg-border-app" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-text-muted">Recommendation</p>
                          <p className="mt-1.5 text-sm font-bold leading-6 text-text-primary">{interaction.recommendation}</p>
                        </div>
                      </div>

                      {interaction.aiExplanation && (
                        <div className="flex gap-4 px-6 py-4">
                          <div className="pt-0.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-blue/10">
                              <Brain className="h-3.5 w-3.5 text-primary-blue" />
                            </span>
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-text-muted">AI explanation</p>
                            <p className="mt-1.5 text-sm font-medium leading-6 text-text-secondary">{interaction.aiExplanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[28px] border border-dashed border-border-app bg-surface-app p-10 text-center">
                <MedicalIllustration name="safe" className="mx-auto h-32 w-40" />
                <p className="mt-3 text-sm font-black text-text-primary">No significant interactions found</p>
                <p className="mt-1 text-sm font-medium text-text-secondary">
                  Neither the clinical database nor AI analysis identified significant interactions for this combination.
                </p>
              </div>
            )}
          </Card>
        </section>
      )}

      {/* Generate report modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/35 backdrop-blur-sm sm:items-center sm:p-4">
          <form onSubmit={generateReport} className="w-full max-w-lg rounded-t-[34px] border border-border-app bg-white p-6 shadow-premium sm:rounded-[34px]">
            <div className="flex items-center justify-between border-b border-border-app pb-4">
              <h3 className="text-xl font-black">Generate clinical report</h3>
              <button type="button" onClick={() => setReportOpen(false)} className="rounded-2xl border border-border-app p-2 text-text-muted hover:bg-surface-app">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mt-5 block text-sm font-bold text-text-secondary">Report title</label>
            <input
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-border-app px-4 py-3 text-sm font-semibold focus:border-primary-blue focus:outline-none"
            />
            <label className="mt-4 block text-sm font-bold text-text-secondary">Clinical notes</label>
            <textarea
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              rows={4}
              className="mt-2 w-full resize-none rounded-2xl border border-border-app px-4 py-3 text-sm font-semibold placeholder:text-text-muted focus:border-primary-blue focus:outline-none"
              placeholder="Optional note for patient or clinician review"
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setReportOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isGeneratingReport}>
                {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                Save report
              </Button>
            </div>
          </form>
        </div>
      )}

      <DrugScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDrugDetected={(drug) => selectDrug(drug)}
      />
      <BarcodeScanner
        isOpen={barcodeScannerOpen}
        onClose={() => setBarcodeScannerOpen(false)}
        onDrugDetected={(drug) => selectDrug(drug)}
        onUseCamera={() => {
          setBarcodeScannerOpen(false);
          setScannerOpen(true);
        }}
      />
    </div>
  );
}
