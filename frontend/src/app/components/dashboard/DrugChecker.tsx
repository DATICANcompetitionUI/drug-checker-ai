"use client";

import {
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
  Check,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileText,
  Info,
  Layers,
  Loader2,
  Mic,
  Pill,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";
import DashboardHeader from "@/app/components/dashboard/DashboardHeader";
import DrugScanner from "@/app/components/dashboard/DrugScanner";
import MedicalIllustration from "@/app/components/illustrations/MedicalIllustrations";
import { api } from "@/lib/api";
import { Drug, InteractionCheckResult, KnowledgeBaseStats, Severity } from "@/lib/types";

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

function formatDateTime(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function medicationType(drug: Drug) {
  return drug.category ? `Generic ${drug.category}` : "Generic medication";
}

function visibleAliases(drug: Drug, count = 3) {
  return (drug.aliases || []).filter((alias) => alias.toLowerCase() !== drug.name.toLowerCase()).slice(0, count);
}

function AiSummaryBody({ text }: { text?: string | null }) {
  if (!text) {
    return null;
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
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportNotes, setReportNotes] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [kbStats, setKbStats] = useState<KnowledgeBaseStats | null>(null);
  const [resultProcessOpen, setResultProcessOpen] = useState(false);

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      api.drugs.knowledgeBaseStats()
        .then((response) => setKbStats(response.data))
        .catch(() => setKbStats(null));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const canCheck = selectedDrugs.length >= 2 && selectedDrugs.length <= 5;
  const highestSeverity = result?.safetySummary.highestSeverity ?? null;
  const hasResult = Boolean(result);
  const riskTitle = !hasResult ? "Awaiting check" : result?.title || (highestSeverity ? `${highestSeverity} verified interaction` : "No known interaction found");
  const riskBadge = !hasResult ? "READY" : result?.status === "NO_KNOWN_INTERACTION" ? "NO KNOWN" : highestSeverity || "FOUND";
  const riskBadgeVariant = hasResult && !highestSeverity ? "low" : severityVariant(highestSeverity);
  const interactionRecordsChecked = result?.metadata?.interactionRecordsChecked ?? kbStats?.totalInteractionRecords ?? 0;
  const knowledgeBaseVersion = result?.metadata?.knowledgeBaseVersion || kbStats?.version || "Current Version";

  const selectDrug = useCallback(
    (drug: Drug) => {
      if (selectedDrugs.length >= 5) {
        toast.error("You can check up to 5 medications at a time.");
        return;
      }
      if (selectedDrugs.some((d) => d.rxcui === drug.rxcui)) return;

      setSelectedDrugs((prev) => [...prev, drug]);
      setResult(null);
      setResultProcessOpen(false);
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
    setResultProcessOpen(false);
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
    setResultProcessOpen(false);
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

  function startAnotherCheck() {
    setSelectedDrugs([]);
    setResult(null);
    setReportOpen(false);
    setReportNotes("");
    setReportTitle("");
    inputRef.current?.focus();
  }

  async function downloadReportFile(reportId: number, format: "pdf" | "xml") {
    const { blob, fileName } = await api.reports.download(reportId, format);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function generateReport(preferredFormat: "pdf" | "xml" = "pdf") {
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
        preferredFormat,
      });
      await downloadReportFile(response.data.id, preferredFormat);
      toast.success(preferredFormat === "pdf" ? "PDF report downloaded." : "XML export downloaded.");
      setReportOpen(false);
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        {/* Left column */}
        <section className="min-w-0 space-y-5">

          {/* Search card */}
          <Card padding="lg">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-primary-blue">Search medication</p>
                <h2 className="mt-1.5 text-2xl font-black text-text-primary">Find a medication</h2>
                <p className="mt-1 text-sm font-medium text-text-secondary">
                  Add drugs by typing the generic name for best accuracy. Brand names and camera scan are best-effort helpers.
                </p>
              </div>

              {/* Scan buttons */}
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  onClick={() => setScannerOpen(true)}
                  title="Best-effort camera OCR. If it misses, type the generic drug name."
                  className="flex items-center gap-1.5 rounded-2xl border border-primary-blue/30 bg-primary-blue/5 px-3 py-2 text-xs font-bold text-primary-blue transition hover:bg-primary-blue/10"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Camera
                </button>
                <div className="relative">
                  <button
                    disabled
                    title="Barcode scan coming soon"
                    className="flex cursor-not-allowed items-center gap-1.5 rounded-2xl border border-border-app bg-surface-app px-3 py-2 text-xs font-bold text-text-muted opacity-60"
                  >
                    <Barcode className="h-3.5 w-3.5" />
                    Barcode
                  </button>
                  <span className="absolute -right-1 -top-1.5 rounded-full bg-primary-blue px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                    Soon
                  </span>
                </div>
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
                      {suggestions.map((drug, idx) => {
                        const brands = visibleAliases(drug, 3);
                        return (
                          <button
                            key={drug.rxcui}
                            role="option"
                            aria-selected={idx === activeIndex}
                            aria-label={`Select ${drug.name}`}
                            onClick={() => selectDrug(drug)}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={`flex w-full items-start gap-4 border-b border-border-app px-5 py-4 text-left last:border-b-0 transition ${idx === activeIndex ? "bg-primary-blue/6 ring-1 ring-inset ring-primary-blue/20" : "hover:bg-surface-app"}`}
                          >
                            <span className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${idx === activeIndex ? "bg-primary-blue text-white" : "bg-primary-blue/10 text-primary-blue"}`}>
                              <Pill className="h-5 w-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-base font-black leading-5 text-text-primary">{drug.name}</span>
                              <span className="mt-1 block text-xs font-black uppercase tracking-wide text-primary-blue/70">{medicationType(drug)}</span>
                              {brands.length > 0 && (
                                <span className="mt-2 flex flex-wrap gap-1.5">
                                  <span className="mr-1 text-[11px] font-black uppercase tracking-wide text-text-muted">Brands</span>
                                  {brands.map((alias) => (
                                    <span key={alias} className="rounded-full border border-border-app bg-white px-2 py-0.5 text-[11px] font-bold text-text-secondary">
                                      {alias}
                                    </span>
                                  ))}
                                </span>
                              )}
                            </span>
                            <span className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${idx === activeIndex ? "bg-primary-blue text-white" : "bg-surface-app text-text-muted"}`}>
                              <Plus className="h-4 w-4" />
                            </span>
                          </button>
                        );
                      })}
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                className="w-full shrink-0 px-5 py-3 sm:w-auto"
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
                {selectedDrugs.map((drug, idx) => {
                  const aliases = visibleAliases(drug, 3);
                  return (
                    <div
                      key={drug.rxcui}
                      className="group relative flex items-start gap-3 rounded-[26px] border border-border-app bg-white p-4 shadow-soft transition hover:border-primary-blue/20 hover:shadow-premium"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-blue/10 text-primary-blue">
                        <Pill className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-text-primary">{drug.name}</p>
                          <span className="rounded-full bg-primary-blue/8 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-primary-blue">
                            #{idx + 1}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-black uppercase tracking-wide text-primary-blue/70">Generic drug</p>
                        <p className="mt-1 text-xs font-semibold text-text-secondary">{medicationType(drug)}</p>
                        {aliases.length > 0 && (
                          <div className="mt-3">
                            <p className="text-[10px] font-black uppercase tracking-wide text-text-muted">Aliases</p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {aliases.map((alias) => (
                                <span key={alias} className="rounded-full border border-border-app bg-surface-app px-2 py-0.5 text-[11px] font-bold text-text-secondary">
                                  {alias}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeDrug(drug.rxcui)}
                        aria-label={`Remove ${drug.name}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border-app p-1 text-text-muted transition hover:bg-danger-red/10 hover:text-danger-red"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
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
        <aside className="min-w-0 space-y-5 xl:sticky xl:top-24 xl:self-start">
          <Card padding="lg" className={`overflow-hidden ${hasResult ? "border-primary-blue/20" : ""}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-primary-blue">Overall result</p>
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

            <div className="mt-5 rounded-[24px] border border-border-app bg-surface-app p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-text-muted">Knowledge Base Search Complete</p>
                  <p className="mt-1 text-lg font-black text-text-primary">
                    {hasResult ? (result?.status === "NO_KNOWN_INTERACTION" ? "No Known Interaction" : "Verified Interaction Found") : "Ready to Search"}
                  </p>
                </div>
                <Badge variant={riskBadgeVariant}>{riskBadge}</Badge>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 2xl:grid-cols-4">
              {statCards.map(({ label, value }) => (
                <div key={label} className="rounded-2xl border border-border-app bg-surface-app p-3">
                  <p className="text-[10px] font-bold text-text-muted">{label}</p>
                  <p className="mt-1 text-xl font-black text-text-primary">{value}</p>
                </div>
              ))}
            </div>

            {result?.hasInteraction && result.aiSummary && (
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

            {result && !result.hasInteraction && (
              <div className="mt-5 rounded-[24px] border border-primary-blue/15 bg-primary-blue/5 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-primary-blue shadow-soft">
                    <Info className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-text-primary">Clinical Guidance</h3>
                    <div className="mt-2 space-y-2 text-sm font-semibold leading-6 text-text-secondary">
                      <p>We did not find a verified interaction for the selected medications in the current Drug Checker AI Knowledge Base.</p>
                      <p>This result should not be interpreted as confirmation that the combination is completely safe.</p>
                      <p>Medication effects may vary depending on dosage, allergies, medical history, underlying conditions, and other medications.</p>
                      <p>Always consult a qualified healthcare professional before combining medicines.</p>
                    </div>
                  </div>
                </div>
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
                  "Generate a backend PDF clinical report",
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

      {kbStats && (
        <section className="mt-6">
          <Card padding="lg" className="overflow-hidden border-primary-blue/15">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-blue/10 text-primary-blue">
                  <Database className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary-blue">Drug Checker AI</p>
                  <h3 className="text-2xl font-black text-text-primary">Knowledge Base</h3>
                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-text-secondary">
                    Verified medication names, brand aliases, and interaction records used by the current clinical search engine.
                  </p>
                </div>
              </div>

              <div className="rounded-[22px] border border-primary-blue/15 bg-primary-blue/5 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-primary-blue">Current Version</p>
                <p className="mt-1 text-lg font-black text-text-primary">{kbStats.version || "Current Version"}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: "Verified Interaction Records", value: kbStats.totalInteractionRecords, icon: <ShieldCheck className="h-5 w-5" /> },
                { label: "Generic Medications", value: kbStats.totalMedications, icon: <Pill className="h-5 w-5" /> },
                { label: "Brand Aliases", value: kbStats.totalAliases, icon: <Tags className="h-5 w-5" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex min-w-0 items-center gap-4 rounded-[24px] border border-border-app bg-surface-app p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primary-blue shadow-soft">
                    {icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-wide text-text-muted">{label}</p>
                    <p className="mt-1 text-2xl font-black text-text-primary">{Number(value).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[0.7fr_1.3fr]">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[22px] border border-border-app bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-wide text-text-muted">Knowledge Base Version</p>
                  <p className="mt-1 text-base font-black text-text-primary">{kbStats.version || "Current Version"}</p>
                </div>
                <div className="rounded-[22px] border border-border-app bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-wide text-text-muted">Last Updated</p>
                  <p className="mt-1 text-base font-black text-text-primary">{kbStats.lastUpdated ? formatDateTime(kbStats.lastUpdated) : "Current Version"}</p>
                </div>
              </div>

              <div className="rounded-[22px] border border-border-app bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-wide text-text-muted">Data Sources</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(kbStats.sourceDatasets.length ? kbStats.sourceDatasets.slice(0, 4) : [{ name: "Drug Checker AI Verified Dataset" }, { name: "Nigerian Medication Alias Database" }]).map((source) => (
                    <p key={source.name} className="flex min-w-0 items-start gap-2 text-sm font-bold text-text-secondary">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-medical-green" />
                      <span className="min-w-0 break-words">{source.name}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {isChecking && (
        <section className="mt-6">
          <Card padding="lg">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-blue/10 text-primary-blue">
                <Database className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-primary-blue">Knowledge Base Search</p>
                <h2 className="mt-1 text-xl font-black text-text-primary">Checking verified interaction records</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="rounded-[24px] border border-border-app bg-surface-app p-4">
                  <div className="h-3 w-1/2 animate-pulse rounded-full bg-border-app" />
                  <div className="mt-3 h-8 w-2/3 animate-pulse rounded-full bg-border-app" />
                  <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-border-app" />
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

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
                    : "No Verified Interaction Records Found"}
                </h2>
              </div>
              <Button disabled={!canCheck || !result || !result.historyId || isGeneratingReport} onClick={() => setReportOpen(true)} className="shrink-0 px-5 py-3">
                <FileText className="h-4 w-4" />
                Generate PDF Report
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
                      <div className="grid gap-3 bg-white px-6 py-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-border-app bg-surface-app p-3">
                          <p className="text-[10px] font-black uppercase tracking-wide text-text-muted">Verified Source</p>
                          <p className="mt-1 text-xs font-bold text-text-primary">{interaction.source}</p>
                        </div>
                        <div className="rounded-2xl border border-border-app bg-surface-app p-3">
                          <p className="text-[10px] font-black uppercase tracking-wide text-text-muted">Knowledge Base Reference</p>
                          <p className="mt-1 text-xs font-bold text-text-primary">Drug Checker AI KB v{knowledgeBaseVersion}</p>
                        </div>
                        <div className="rounded-2xl border border-border-app bg-surface-app p-3">
                          <p className="text-[10px] font-black uppercase tracking-wide text-text-muted">Confidence</p>
                          <p className="mt-1 text-xs font-bold text-text-primary">Verified interaction record</p>
                        </div>
                      </div>

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
              <div className="mt-6 overflow-hidden rounded-[28px] border border-medical-green/25 bg-medical-green/5">
                <div className="flex flex-col gap-4 border-b border-medical-green/20 bg-white px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-medical-green/12 text-medical-green">
                      <CheckCircle2 className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-primary-blue">Interaction result</p>
                      <h3 className="mt-1 text-2xl font-black text-text-primary">No Verified Interaction Records Found</h3>
                      <p className="mt-2 text-sm font-medium leading-6 text-text-secondary">
                        No interaction matching the selected medications was found in the current Drug Checker AI Knowledge Base.
                      </p>
                    </div>
                  </div>
                  <Badge variant="low">NO KNOWN</Badge>
                </div>

                <div className="grid gap-5 p-6 lg:grid-cols-[1fr_0.9fr]">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-text-muted">Checked medications</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.checkedDrugs.map((drug) => (
                        <span key={drug.rxcui} className="inline-flex items-center gap-1.5 rounded-full border border-border-app bg-white px-3 py-1.5 text-xs font-bold text-text-secondary">
                          <Pill className="h-3.5 w-3.5 text-primary-blue" /> {drug.name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-4 text-xs font-bold text-text-muted">
                      Checked {formatDateTime(result.checkedAt)} using {result.sourceCoverage.dataset}.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-primary-blue/15 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-primary-blue">Safety note</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-text-secondary">{result.safetyNote}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-medical-green/20 bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-end">
                  <Button variant="secondary" onClick={startAnotherCheck}>
                    <RefreshCw className="h-4 w-4" />
                    Start another check
                  </Button>
                  <Button disabled={!result.historyId || isGeneratingReport} onClick={() => setReportOpen(true)}>
                    <FileText className="h-4 w-4" />
                    Generate PDF Report
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card padding="lg" className="border-primary-blue/15">
            <button
              type="button"
              onClick={() => setResultProcessOpen((open) => !open)}
              aria-expanded={resultProcessOpen}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-blue/10 text-primary-blue">
                  <Layers className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-base font-black text-text-primary">How This Result Was Generated</span>
                  <span className="mt-0.5 block text-xs font-semibold text-text-muted">Verified-data workflow and knowledge-base coverage</span>
                </span>
              </span>
              <ChevronDown className={`h-5 w-5 shrink-0 text-text-muted transition ${resultProcessOpen ? "rotate-180" : ""}`} />
            </button>

            {resultProcessOpen && (
              <div className="mt-5 grid gap-5 border-t border-border-app pt-5 lg:grid-cols-[1fr_0.65fr]">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-text-muted">Search Process</p>
                  <div className="mt-3 space-y-2">
                    {[
                      "Generic medication names identified",
                      "Brand aliases resolved",
                      "Medication pairs generated",
                      "Verified interaction database searched",
                      `${interactionRecordsChecked.toLocaleString()} interaction records checked`,
                      "Search completed successfully",
                    ].map((step) => (
                      <p key={step} className="flex items-start gap-2 text-sm font-semibold text-text-secondary">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-medical-green" />
                        {step}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-[22px] border border-border-app bg-surface-app p-4">
                    <p className="text-[10px] font-black uppercase tracking-wide text-text-muted">Processing Time</p>
                    <p className="mt-1 text-xl font-black text-text-primary">{result.metadata?.processingTimeMs ?? 0} ms</p>
                  </div>
                  <div className="rounded-[22px] border border-border-app bg-surface-app p-4">
                    <p className="text-[10px] font-black uppercase tracking-wide text-text-muted">Knowledge Base Version</p>
                    <p className="mt-1 text-xl font-black text-text-primary">v{knowledgeBaseVersion}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </section>
      )}

      {/* Generate report modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/35 backdrop-blur-sm sm:items-center sm:p-4">
          <form onSubmit={(e) => { e.preventDefault(); void generateReport("pdf"); }} className="w-full max-w-lg rounded-t-[34px] border border-border-app bg-white p-6 shadow-premium sm:rounded-[34px]">
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
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setReportOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="button" variant="secondary" disabled={isGeneratingReport} onClick={() => generateReport("xml")} className="w-full sm:w-auto">
                {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export XML
              </Button>
              <Button type="submit" disabled={isGeneratingReport} className="w-full sm:w-auto">
                {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                {isGeneratingReport ? "Preparing your clinical report..." : "Generate PDF Report"}
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
    </div>
  );
}
