"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Info,
  Loader2,
  Pill,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import DashboardHeader from "@/app/components/dashboard/DashboardHeader";
import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import MedicalIllustration from "@/app/components/illustrations/MedicalIllustrations";
import { api } from "@/lib/api";
import { ReportDetail, ReportListItem } from "@/lib/types";

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function highest(summary: { HIGH: number; MODERATE: number; LOW: number }) {
  if (summary.HIGH) return "HIGH";
  if (summary.MODERATE) return "MODERATE";
  if (summary.LOW) return "LOW";
  return null;
}

function variant(severity?: string | null) {
  if (severity === "HIGH") return "high";
  if (severity === "MODERATE") return "moderate";
  if (severity === "LOW") return "low";
  return "none";
}

function statusLabel(report: ReportListItem | ReportDetail) {
  if (report.overallStatus === "NO_KNOWN_INTERACTION") return "NO KNOWN";
  return highest(report.severitySummary) || "FOUND";
}

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = Number(searchParams.get("id"));
  const selectedId = Number.isFinite(reportId) && reportId > 0 ? reportId : null;

  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.reports.list();
      setReports(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reports.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReports();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadReports]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setIsLoadingDetail(true);
      api.reports
        .detail(selectedId)
        .then((response) => {
          if (active) setDetail(response.data);
        })
        .catch((err) => {
          if (!active) return;
          toast.error(err instanceof Error ? err.message : "Unable to load report.");
          router.replace("/dashboard/report");
        })
        .finally(() => {
          if (active) setIsLoadingDetail(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [router, selectedId]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return reports;
    return reports.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.reportReference.toLowerCase().includes(term) ||
        item.selectedDrugs.some((drug) => drug.name.toLowerCase().includes(term))
    );
  }, [query, reports]);

  async function downloadReport(id: number, format: "pdf" | "xml") {
    const key = `${id}-${format}`;
    setDownloading(key);
    try {
      const { blob, fileName } = await api.reports.download(id, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(format === "pdf" ? "PDF report downloaded." : "XML export downloaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to download report.");
    } finally {
      setDownloading(null);
    }
  }

  async function deleteReport(id: number) {
    setIsDeletingReport(true);
    setConfirmDeleteId(null);
    try {
      await api.reports.remove(id);
      toast.success("Report deleted.");
      setReports((current) => current.filter((item) => item.id !== id));
      if (selectedId === id) {
        setDetail(null);
        router.replace("/dashboard/report");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete report.");
    } finally {
      setIsDeletingReport(false);
    }
  }

  const isDetailPage = Boolean(selectedId);

  return (
    <div>
      <DashboardHeader
        title={isDetailPage ? "Clinical report" : "Clinical reports"}
        description={
          isDetailPage
            ? "Review generated report metadata and download backend-generated PDF or XML exports."
            : "Search, view, download, export, and delete reports generated from saved interaction checks."
        }
      />

      {isDetailPage ? (
        <section className="mt-6">
          {isLoadingDetail ? (
            <Card padding="lg">
              <div className="space-y-4">
                <div className="h-5 w-40 animate-pulse rounded-full bg-border-app" />
                <div className="h-10 w-3/4 animate-pulse rounded-full bg-border-app" />
                <div className="grid gap-4 md:grid-cols-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-24 animate-pulse rounded-3xl bg-surface-app" />
                  ))}
                </div>
              </div>
            </Card>
          ) : detail ? (
            <div className="space-y-6">
              <Card padding="lg" className="overflow-hidden border-primary-blue/15">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <Button variant="secondary" onClick={() => router.replace("/dashboard/report")} className="mb-5 px-3 py-2">
                      <ArrowLeft className="h-4 w-4" />
                      Back to reports
                    </Button>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-primary-blue">Clinical report</p>
                    <h1 className="mt-2 max-w-4xl text-2xl font-black tracking-tight text-text-primary md:text-3xl">
                      {detail.title}
                    </h1>
                    <p className="mt-2 text-xs font-black uppercase tracking-wide text-primary-blue">{detail.reportReference}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-text-muted">
                      <Calendar className="h-4 w-4" />
                      Generated {formatDate(detail.generatedAt || detail.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                    <Button onClick={() => downloadReport(detail.id, "pdf")} disabled={downloading === `${detail.id}-pdf`} className="w-full sm:w-auto">
                      {downloading === `${detail.id}-pdf` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Download PDF
                    </Button>
                    <Button variant="secondary" onClick={() => downloadReport(detail.id, "xml")} disabled={downloading === `${detail.id}-xml`} className="w-full sm:w-auto">
                      {downloading === `${detail.id}-xml` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Export XML
                    </Button>
                    <Button variant="danger" onClick={() => setConfirmDeleteId(detail.id)} className="w-full sm:w-auto">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <div className="space-y-6">
                  <Card padding="lg">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-text-muted">Overall result</p>
                        <h2 className="mt-2 text-2xl font-black text-text-primary">
                          {detail.overallStatus === "NO_KNOWN_INTERACTION" ? "No known interaction found" : "Verified interaction found"}
                        </h2>
                      </div>
                      <Badge variant={variant(highest(detail.severitySummary))}>{statusLabel(detail)}</Badge>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      {[
                        ["Drugs", detail.selectedDrugs.length],
                        ["Findings", detail.interactions.length],
                        ["High", detail.severitySummary.HIGH],
                        ["Moderate", detail.severitySummary.MODERATE],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-3xl border border-border-app bg-surface-app p-4">
                          <p className="text-xs font-bold text-text-muted">{label}</p>
                          <p className="mt-1 text-2xl font-black text-text-primary">{value}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card padding="lg">
                    <p className="text-xs font-black uppercase tracking-wide text-text-muted">Medications assessed</p>
                    <div className="mt-4 space-y-3">
                      {detail.selectedDrugs.map((drug) => (
                        <div key={drug.rxcui} className="flex items-center gap-3 rounded-3xl border border-border-app bg-surface-app p-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-blue/10 text-primary-blue">
                            <Pill className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-black text-text-primary">{drug.name}</p>
                            <p className="text-xs font-semibold text-text-muted">RXCUI: {drug.rxcui || "Not available"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {detail.notes && (
                    <Card padding="lg">
                      <p className="text-xs font-black uppercase tracking-wide text-text-muted">Clinical notes</p>
                      <p className="mt-2 text-sm font-medium leading-6 text-text-secondary">{detail.notes}</p>
                    </Card>
                  )}
                </div>

                <Card padding="lg">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-blue/10 text-primary-blue">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-text-muted">Interaction findings</p>
                      <h2 className="text-xl font-black text-text-primary">Verified clinical records</h2>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {detail.interactions.length ? (
                      detail.interactions.map((interaction) => (
                        <article
                          key={`${interaction.drugA.rxcui}-${interaction.drugB.rxcui}`}
                          className="rounded-[28px] border border-border-app bg-surface-app p-5"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-lg font-black text-text-primary">
                                {interaction.drugA.name} + {interaction.drugB.name}
                              </h3>
                              <p className="mt-1 text-xs font-black uppercase tracking-wide text-primary-blue">{interaction.source}</p>
                            </div>
                            <Badge variant={variant(interaction.severity)}>{interaction.severity}</Badge>
                          </div>
                          <div className="mt-5 space-y-4">
                            <div>
                              <p className="text-xs font-black uppercase tracking-wide text-text-muted">Clinical effect</p>
                              <p className="mt-1 text-sm font-medium leading-6 text-text-secondary">{interaction.effect}</p>
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-wide text-text-muted">Recommendation</p>
                              <p className="mt-1 text-sm font-bold leading-6 text-text-primary">{interaction.recommendation}</p>
                            </div>
                            {interaction.aiExplanation && (
                              <div>
                                <p className="text-xs font-black uppercase tracking-wide text-text-muted">Plain-language explanation</p>
                                <p className="mt-1 text-sm font-medium leading-6 text-text-secondary">{interaction.aiExplanation}</p>
                              </div>
                            )}
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="rounded-[28px] border border-medical-green/25 bg-medical-green/5 p-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-medical-green shadow-soft">
                            <CheckCircle2 className="h-6 w-6" />
                          </span>
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary-blue">Knowledge base search complete</p>
                            <h3 className="mt-1 text-xl font-black text-text-primary">No verified interaction records found</h3>
                            <p className="mt-2 text-sm font-medium leading-6 text-text-secondary">
                              No interaction matching the selected medications was found in the current Drug Checker AI Knowledge Base.
                            </p>
                            <p className="mt-3 text-sm font-semibold leading-6 text-text-secondary">{detail.safetyNote}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <Card padding="lg" className="border-primary-blue/15 bg-primary-blue/5">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary-blue" />
                  <div>
                    <p className="font-black text-text-primary">Medical disclaimer</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-text-secondary">{detail.disclaimer}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-text-secondary">{detail.safetyNote}</p>
                  </div>
                </div>
              </Card>
            </div>
          ) : null}
        </section>
      ) : (
        <>
          <Card padding="lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reports, references, or medications"
                className="w-full rounded-2xl border border-border-app bg-surface-app py-3 pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/10"
              />
            </div>
          </Card>

          <div className="mt-6">
            {isLoading ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <Card key={item} padding="lg">
                    <div className="h-4 w-28 animate-pulse rounded-full bg-border-app" />
                    <div className="mt-4 h-7 w-3/4 animate-pulse rounded-full bg-border-app" />
                    <div className="mt-6 h-20 animate-pulse rounded-3xl bg-surface-app" />
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="p-10 text-center">
                <MedicalIllustration name="no-results" className="mx-auto h-40 w-52" />
                <p className="mt-4 font-black">{error}</p>
              </Card>
            ) : filtered.length === 0 ? (
              <Card className="p-12 text-center">
                <MedicalIllustration name="report" className="mx-auto h-44 w-56" />
                <h3 className="mt-4 text-xl font-black">No reports yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm font-medium text-text-secondary">
                  Run an interaction check, save it to history, and generate a clinical report.
                </p>
              </Card>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {filtered.map((item) => {
                  const severity = highest(item.severitySummary);
                  return (
                    <Card key={item.id} className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Badge variant={variant(severity)}>{statusLabel(item)}</Badge>
                          <h3 className="mt-3 text-lg font-black text-text-primary">{item.title}</h3>
                          <p className="mt-1 text-xs font-black uppercase tracking-wide text-primary-blue">{item.reportReference}</p>
                          <p className="mt-2 flex items-center gap-1 text-xs font-bold text-text-muted">
                            <Calendar className="h-4 w-4" /> {formatDate(item.generatedAt || item.createdAt)}
                          </p>
                        </div>
                        <FileText className="h-7 w-7 shrink-0 text-primary-blue" />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.selectedDrugs.map((drug) => (
                          <span key={drug.rxcui} className="rounded-full bg-surface-app px-3 py-1 text-xs font-bold text-text-secondary">
                            {drug.name}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-col gap-4 border-t border-border-app pt-4 xl:flex-row xl:items-center xl:justify-between">
                        <span className="text-xs font-bold text-text-muted">
                          {item.interactionCount} finding{item.interactionCount === 1 ? "" : "s"} - {severity || "No severity"}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => downloadReport(item.id, "pdf")} disabled={downloading === `${item.id}-pdf`} className="px-3 py-2">
                            {downloading === `${item.id}-pdf` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            PDF
                          </Button>
                          <Button variant="secondary" onClick={() => downloadReport(item.id, "xml")} disabled={downloading === `${item.id}-xml`} className="px-3 py-2">
                            {downloading === `${item.id}-xml` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            XML
                          </Button>
                          <Button variant="secondary" onClick={() => router.replace(`/dashboard/report?id=${item.id}`)} className="px-3 py-2">
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button variant="secondary" onClick={() => setConfirmDeleteId(item.id)} className="px-3 py-2">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Delete report?"
        description="This clinical report will be permanently deleted and cannot be recovered."
        confirmLabel="Yes, delete"
        isLoading={isDeletingReport}
        onConfirm={() => confirmDeleteId !== null && deleteReport(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center"><Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-blue" /></div>}>
      <ReportContent />
    </Suspense>
  );
}
