"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  Download,
  FileText,
  Loader2,
  Printer,
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
import { ReportDetail, ReportListItem } from "@/lib/types";

function formatDate(value: string) {
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

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const id = Number(searchParams.get("id"));
    return Number.isFinite(id) && id > 0 ? id : null;
  });
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeletingReport, setIsDeletingReport] = useState(false);

  const openModal = useCallback((id: number) => {
    setSelectedId(id);
    router.replace(`/dashboard/report?id=${id}`);
  }, [router]);

  const closeModal = useCallback(() => {
    setSelectedId(null);
    setDetail(null);
    router.replace("/dashboard/report");
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setError("");
      api.reports
        .list()
        .then((res) => setReports(res.data))
        .catch((err) => setError(err instanceof Error ? err.message : "Unable to load reports."))
        .finally(() => setIsLoading(false));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!selectedId) {
        setDetail(null);
        return;
      }
      setIsLoadingDetail(true);
      api.reports
        .detail(selectedId)
        .then((res) => setDetail(res.data))
        .catch(() => {
          toast.error("Unable to load report.");
          closeModal();
        })
        .finally(() => setIsLoadingDetail(false));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedId, closeModal]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return reports;
    return reports.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.selectedDrugs.some((drug) => drug.name.toLowerCase().includes(term))
    );
  }, [query, reports]);

  async function deleteReport(reportId: number, fromModal = false) {
    setIsDeletingReport(true);
    setConfirmDeleteId(null);
    try {
      await api.reports.remove(reportId);
      toast.success("Report deleted.");
      if (fromModal) closeModal();
      setReports((current) => current.filter((item) => item.id !== reportId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete report.");
    } finally {
      setIsDeletingReport(false);
    }
  }

  return (
    <div>
      <DashboardHeader
        title="Clinical reports"
        description="Search, view, print, and delete reports generated from saved interaction history."
      />

      <Card padding="lg">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports or medications"
            className="w-full rounded-2xl border border-border-app bg-surface-app py-3 pl-10 pr-4 text-sm font-semibold"
          />
        </div>
      </Card>

      <div className="mt-6">
        {isLoading ? (
          <div className="py-24 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-blue" />
            <p className="mt-3 text-sm font-semibold text-text-secondary">Loading reports…</p>
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
                <Card key={item.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge variant={variant(severity)}>{severity || "CLEAR"}</Badge>
                      <h3 className="mt-3 text-lg font-black">{item.title}</h3>
                      <p className="mt-2 flex items-center gap-1 text-xs font-bold text-text-muted">
                        <Calendar className="h-4 w-4" /> {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <FileText className="h-7 w-7 text-primary-blue shrink-0" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.selectedDrugs.map((drug) => (
                      <span key={drug.rxcui} className="rounded-full bg-surface-app px-3 py-1 text-xs font-bold text-text-secondary">
                        {drug.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-border-app pt-4">
                    <span className="text-xs font-bold text-text-muted">{item.interactionCount} verified findings</span>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setConfirmDeleteId(item.id)} className="px-3 py-2">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => openModal(item.id)} className="px-4 py-2">
                        View
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Delete report?"
        description="This clinical report will be permanently deleted and cannot be recovered."
        confirmLabel="Yes, delete"
        isLoading={isDeletingReport}
        onConfirm={() => confirmDeleteId !== null && deleteReport(confirmDeleteId, selectedId === confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Report detail modal */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-900/40 backdrop-blur-sm sm:items-start sm:p-4">
          <div className="w-full max-w-2xl rounded-t-[34px] border border-border-app bg-white shadow-premium sm:my-8 sm:rounded-[34px]">
            <div className="flex items-center justify-between border-b border-border-app px-7 py-5 print:hidden">
              <h3 className="text-xl font-black">Clinical report</h3>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => window.print()} className="px-3 py-2">
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="secondary" onClick={() => window.print()} className="px-3 py-2">
                  <Download className="h-4 w-4" />
                </Button>
                {detail && (
                  <Button variant="danger" onClick={() => setConfirmDeleteId(detail.id)} className="px-3 py-2">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <button
                  onClick={closeModal}
                  className="rounded-2xl border border-border-app p-2 text-text-muted hover:bg-surface-app"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isLoadingDetail ? (
              <div className="py-20 text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-blue" />
                <p className="mt-3 text-sm font-semibold text-text-secondary">Loading report…</p>
              </div>
            ) : detail ? (
              <div className="p-7 md:p-10">
                <div className="flex flex-col gap-4 border-b border-border-app pb-7 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-primary-blue">Clinical report</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight">{detail.title}</h1>
                    <p className="mt-2 text-sm font-medium text-text-muted">Generated {formatDate(detail.createdAt)}</p>
                  </div>
                  <Badge variant={variant(highest(detail.severitySummary))}>
                    {highest(detail.severitySummary) || "CLEAR"}
                  </Badge>
                </div>

                <div className="mt-7 grid gap-4 md:grid-cols-4">
                  {[
                    ["Drugs", detail.selectedDrugs.length],
                    ["Findings", detail.interactions.length],
                    ["High", detail.severitySummary.HIGH],
                    ["Moderate", detail.severitySummary.MODERATE],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-3xl border border-border-app bg-surface-app p-4 text-center">
                      <p className="text-xs font-bold text-text-muted">{label}</p>
                      <p className="mt-1 text-2xl font-black">{value}</p>
                    </div>
                  ))}
                </div>

                {detail.notes && (
                  <div className="mt-7 rounded-[28px] border border-border-app bg-surface-app p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-text-muted">Clinical notes</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-text-secondary">{detail.notes}</p>
                  </div>
                )}

                <div className="mt-7">
                  <p className="text-xs font-black uppercase tracking-wide text-text-muted">Medications assessed</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {detail.selectedDrugs.map((drug) => (
                      <span key={drug.rxcui} className="rounded-full border border-border-app bg-white px-3 py-1.5 text-xs font-bold text-text-secondary">
                        {drug.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <h2 className="text-xl font-black">Verified interactions</h2>
                  {detail.interactions.length ? (
                    detail.interactions.map((interaction) => (
                      <article
                        key={`${interaction.drugA.rxcui}-${interaction.drugB.rxcui}`}
                        className="rounded-[28px] border border-border-app bg-surface-app p-5"
                      >
                        <Badge variant={variant(interaction.severity)}>{interaction.severity}</Badge>
                        <h3 className="mt-3 text-lg font-black">
                          {interaction.drugA.name} + {interaction.drugB.name}
                        </h3>
                        <p className="mt-3 text-sm font-medium leading-6 text-text-secondary">{interaction.effect}</p>
                        <p className="mt-3 text-sm font-bold leading-6 text-text-primary">{interaction.recommendation}</p>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-[28px] border border-dashed border-border-app bg-surface-app p-8 text-center">
                      <MedicalIllustration name="safe" className="mx-auto h-32 w-44" />
                      <p className="mt-2 text-sm font-black">No verified interactions in this report.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
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
