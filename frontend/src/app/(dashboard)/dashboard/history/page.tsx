"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Brain,
  Calendar,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Pill,
  Search,
  Trash2,
  X,
} from "lucide-react";
import DashboardHeader from "@/app/components/dashboard/DashboardHeader";
import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import MedicalIllustration from "@/app/components/illustrations/MedicalIllustrations";
import { api } from "@/lib/api";
import { HistoryDetail, HistoryListItem } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function variant(severity?: string | null) {
  if (severity === "HIGH") return "high";
  if (severity === "MODERATE") return "moderate";
  if (severity === "LOW") return "low";
  return "none";
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryListItem[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Detail modal
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<HistoryDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Generate report modal
  const [reportItem, setReportItem] = useState<HistoryListItem | null>(null);
  const [reportTitle, setReportTitle] = useState("");
  const [reportNotes, setReportNotes] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  async function loadHistory() {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.history.list();
      setItems(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load history.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadHistory(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!detailId) {
        setDetail(null);
        return;
      }
      setIsLoadingDetail(true);
      api.history
        .detail(detailId)
        .then((res) => setDetail(res.data))
        .catch(() => toast.error("Unable to load interaction details."))
        .finally(() => setIsLoadingDetail(false));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [detailId]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => item.selectedDrugs.some((drug) => drug.name.toLowerCase().includes(term)));
  }, [items, query]);

  async function deleteHistory(id: number) {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await api.history.remove(id);
      setItems((current) => current.filter((item) => item.id !== id));
      toast.success("History item deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete history.");
    } finally {
      setDeletingId(null);
    }
  }

  function openReportModal(item: HistoryListItem) {
    setReportItem(item);
    setReportTitle(`Drug interaction report: ${item.selectedDrugs.map((d) => d.name).join(" + ")}`);
    setReportNotes("");
  }

  async function handleGenerateReport(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await generateReport("pdf");
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

  async function generateReport(preferredFormat: "pdf" | "xml") {
    if (!reportItem) return;
    setIsGeneratingReport(true);
    try {
      const response = await api.reports.generate({
        historyId: reportItem.id,
        title: reportTitle || "Drug Interaction Report",
        notes: reportNotes || undefined,
        preferredFormat,
      });
      await downloadReportFile(response.data.id, preferredFormat);
      toast.success(preferredFormat === "pdf" ? "PDF report downloaded. View it in Clinical reports." : "XML export downloaded. View it in Clinical reports.");
      setReportItem(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to generate report.");
    } finally {
      setIsGeneratingReport(false);
    }
  }

  return (
    <div>
      <DashboardHeader
        title="Interaction history"
        description="Review previous medication safety checks and create clinical reports from saved history."
      />

      <Card padding="lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-primary-blue">Timeline</p>
            <h2 className="mt-2 text-2xl font-black">{items.length} saved checks</h2>
          </div>
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by medication"
              className="w-full rounded-2xl border border-border-app bg-surface-app py-3 pl-10 pr-4 text-sm font-semibold"
            />
          </div>
        </div>
      </Card>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-32 animate-pulse rounded-[28px] bg-white shadow-soft" />
            ))}
          </div>
        ) : error ? (
          <Card className="p-10 text-center">
            <MedicalIllustration name="no-results" className="mx-auto h-36 w-44" />
            <p className="mt-3 font-black text-text-primary">{error}</p>
            <Button onClick={loadHistory} className="mt-5">Retry</Button>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <MedicalIllustration name="history" className="mx-auto h-44 w-56" />
            <h3 className="mt-4 text-xl font-black">No history yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-text-secondary">
              Run an interaction check while signed in and it will appear here automatically.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => (
              <Card key={item.id} className="p-5 cursor-pointer hover:shadow-premium transition-shadow" onClick={() => setDetailId(item.id)}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant={variant(item.safetySummary?.highestSeverity)}>
                        {item.safetySummary?.highestSeverity || "CLEAR"}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-text-muted">
                        <Calendar className="h-4 w-4" /> {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-black text-text-primary">
                      {item.selectedDrugs.map((drug) => drug.name).join(" + ")}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-text-secondary">
                      {item.safetySummary?.actionMessage || "Medication safety check completed."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-text-muted">
                      <span>{item.interactionCount} verified interactions</span>
                      <span>{item.duplicateTherapyCount} duplicate warnings</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="secondary"
                      onClick={() => openReportModal(item)}
                      className="px-4 py-2.5"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">PDF Report</span>
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setConfirmDeleteId(item.id)}
                      disabled={deletingId === item.id}
                      className="px-4 py-2.5"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* History detail modal */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-900/40 backdrop-blur-sm sm:items-start sm:p-4">
          <div className="w-full max-w-2xl rounded-t-[34px] border border-border-app bg-white shadow-premium sm:my-8 sm:rounded-[34px]">
            <div className="flex items-center justify-between border-b border-border-app px-7 py-5">
              <h3 className="text-xl font-black">Interaction details</h3>
              <button
                onClick={() => setDetailId(null)}
                className="rounded-2xl border border-border-app p-2 text-text-muted hover:bg-surface-app"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isLoadingDetail ? (
              <div className="py-16 text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-blue" />
                <p className="mt-3 text-sm font-semibold text-text-secondary">Loading details…</p>
              </div>
            ) : detail ? (
              <div className="space-y-6 p-7">
                <div className="flex flex-wrap gap-2">
                  {detail.selectedDrugs.map((drug) => (
                    <span key={drug.rxcui} className="inline-flex items-center gap-1.5 rounded-full border border-border-app bg-surface-app px-3 py-1.5 text-xs font-bold text-text-secondary">
                      <Pill className="h-3.5 w-3.5 text-primary-blue" /> {drug.name}
                    </span>
                  ))}
                </div>

                {detail.safetySummary && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["Pairs checked", detail.safetySummary.totalPairsChecked],
                      ["Verified", detail.safetySummary.verifiedInteractions],
                      ["Duplicates", detail.safetySummary.duplicateTherapies],
                      ["Unverified", detail.safetySummary.unverifiedPairs],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-3xl border border-border-app bg-surface-app p-4 text-center">
                        <p className="text-xs font-bold text-text-muted">{label}</p>
                        <p className="mt-1 text-2xl font-black">{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {detail.aiSummary && (
                  <div className="rounded-[24px] border border-border-app bg-surface-app p-5">
                    <div className="flex items-center gap-2 text-primary-blue">
                      <Brain className="h-4 w-4" />
                      <p className="text-xs font-black uppercase tracking-wide">AI safety summary</p>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm font-medium leading-7 text-text-secondary">{detail.aiSummary}</p>
                  </div>
                )}

                {detail.duplicateTherapies.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-black text-warning-orange">
                      <AlertTriangle className="h-4 w-4" /> Duplicate therapy warnings
                    </h4>
                    <div className="mt-3 grid gap-3">
                      {detail.duplicateTherapies.map((dup) => (
                        <div key={dup.ingredient.rxcui} className="rounded-[24px] border border-warning-orange/20 bg-warning-orange/5 p-4">
                          <p className="font-black text-text-primary">{dup.ingredient.name}</p>
                          <p className="mt-2 text-sm text-text-secondary">{dup.effect}</p>
                          <p className="mt-1 text-sm font-bold text-text-primary">{dup.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detail.interactions.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-wide text-text-muted">Verified interactions</h4>
                    {detail.interactions.map((interaction) => (
                      <article
                        key={`${interaction.drugA.rxcui}-${interaction.drugB.rxcui}`}
                        className="rounded-[24px] border border-border-app bg-surface-app p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Badge variant={variant(interaction.severity)}>{interaction.severity}</Badge>
                            <h5 className="mt-3 text-base font-black">
                              {interaction.drugA.name} + {interaction.drugB.name}
                            </h5>
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-medium text-text-secondary">{interaction.effect}</p>
                        <p className="mt-2 text-sm font-bold text-text-primary">{interaction.recommendation}</p>
                        {interaction.aiExplanation && (
                          <p className="mt-3 text-xs font-medium leading-6 text-text-muted">{interaction.aiExplanation}</p>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-border-app p-8 text-center">
                    <MedicalIllustration name="safe" className="mx-auto h-28 w-36" />
                    <p className="mt-2 text-sm font-black">No verified interactions found</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-border-app pt-4">
                  <Button variant="secondary" onClick={() => setDetailId(null)}>Close</Button>
                  <Button onClick={() => {
                    const item = items.find((i) => i.id === detailId);
                    if (item) {
                      setDetailId(null);
                      openReportModal(item);
                    }
                  }}>
                    <FileText className="h-4 w-4" /> Generate report
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Delete history?"
        description="This interaction check will be permanently removed from your history. This cannot be undone."
        confirmLabel="Yes, delete"
        isLoading={deletingId !== null}
        onConfirm={() => confirmDeleteId !== null && deleteHistory(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Generate report modal */}
      {reportItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4">
          <form
            onSubmit={handleGenerateReport}
            className="w-full max-w-lg rounded-t-[34px] border border-border-app bg-white p-6 shadow-premium sm:rounded-[34px] sm:p-7"
          >
            <div className="flex items-center justify-between border-b border-border-app pb-5">
              <h3 className="text-xl font-black">Generate clinical report</h3>
              <button
                type="button"
                onClick={() => setReportItem(null)}
                className="rounded-2xl border border-border-app p-2 text-text-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-[24px] bg-surface-app p-4">
              <p className="text-xs font-black uppercase tracking-wide text-text-muted">Medications</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {reportItem.selectedDrugs.map((drug) => (
                  <span key={drug.rxcui} className="rounded-full border border-border-app bg-white px-3 py-1 text-xs font-bold text-text-secondary">
                    {drug.name}
                  </span>
                ))}
              </div>
            </div>

            <label className="mt-5 block text-sm font-bold text-text-secondary">Report title</label>
            <input
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-border-app px-4 py-3 font-semibold focus:border-primary-blue focus:outline-none"
              placeholder="Enter report title"
            />

            <label className="mt-4 block text-sm font-bold text-text-secondary">Clinical notes</label>
            <textarea
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              rows={4}
              className="mt-2 w-full resize-none rounded-2xl border border-border-app px-4 py-3 font-semibold focus:border-primary-blue focus:outline-none"
              placeholder="Optional note for patient or clinician review"
            />

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setReportItem(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isGeneratingReport}>
                {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                {isGeneratingReport ? "Preparing your clinical report..." : "Generate PDF Report"}
              </Button>
              <Button type="button" variant="secondary" disabled={isGeneratingReport} onClick={() => generateReport("xml")}>
                {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export XML
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
