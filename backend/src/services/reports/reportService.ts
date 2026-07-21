import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import Report from "../../schemas/reports/reportSchema.js";
import { GenerateReportRequest, ReportDownloadData, ReportFormat, ReportResponse, UpdateReportRequest } from "../../types/reports/report.js";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, SUCCESS } from "../../constants/statusCode.js";
import { messageHandler } from "../../utils/index.js";
import { Severity } from "../../constants/severity.js";
import { ReportStatus } from "../../constants/reportStatus.js";
import InteractionHistory from "../../schemas/history/interactionHistorySchema.js";
import User from "../../schemas/users/authSchema.js";
import {
  MEDICAL_SAFETY_NOTE,
  NO_KNOWN_INTERACTION_MESSAGE,
  NO_KNOWN_INTERACTION_TITLE,
  VERIFIED_DATASET_NAME,
} from "../interactions/interactionService.js";

const REPORT_STORAGE_DIR = path.resolve(process.env.REPORT_STORAGE_DIR || path.join(process.cwd(), "storage", "reports"));
const DISCLAIMER = "This report is for educational medication safety support only. It does not replace a doctor, pharmacist, or qualified healthcare professional. Do not start, stop, or combine medicines without professional advice.";

const buildSeveritySummary = (interactionResults: any[]) => {
  const summary = {
    [Severity.LOW]: 0,
    [Severity.MODERATE]: 0,
    [Severity.HIGH]: 0,
  };

  interactionResults.forEach((result) => {
    if (result?.severity && result.severity in summary) {
      summary[result.severity as Severity] += 1;
    }
  });

  return summary;
};

const isInvalidId = (id: number) => !Number.isInteger(id) || id < 1;

const parseHistoryId = (data: GenerateReportRequest) => {
  const suppliedId = data.historyId ?? data.interactionCheckId;
  if (suppliedId === undefined || suppliedId === null || suppliedId === "") {
    return null;
  }

  const parsedId = Number(suppliedId);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : NaN;
};

const slimInteraction = (interaction: any) => ({
  drugA: interaction.drugA,
  drugB: interaction.drugB,
  severity: interaction.severity,
  effect: interaction.effect,
  recommendation: interaction.recommendation,
  source: interaction.source,
  aiExplanation: interaction.aiExplanation,
});

const getHighestSeverity = (summary: Record<string, number> | null | undefined) => {
  if (!summary) return null;
  if (summary.HIGH) return Severity.HIGH;
  if (summary.MODERATE) return Severity.MODERATE;
  if (summary.LOW) return Severity.LOW;
  return null;
};

const resolveOverallStatus = (interactionResults: any[], severitySummary: Record<string, number>) => {
  const hasSeverity = Object.values(severitySummary).some((count) => Number(count) > 0);
  return interactionResults.length > 0 || hasSeverity ? "INTERACTION_FOUND" : "NO_KNOWN_INTERACTION";
};

const sanitizeFilePart = (value: string) => {
  return value
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .toLowerCase() || "report";
};

const createReportReference = () => {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `DCA-${stamp}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
};

const ensureReportDirectory = async () => {
  await fsp.mkdir(REPORT_STORAGE_DIR, { recursive: true });
};

const formatReportListItem = (report: Report) => ({
  id: report.id,
  reportReference: report.reportReference,
  title: report.title,
  format: report.format,
  status: report.status,
  notes: report.notes,
  selectedDrugs: report.selectedDrugs,
  checkedPairs: report.checkedPairs || [],
  overallStatus: report.overallStatus,
  severitySummary: report.severitySummary,
  severity: getHighestSeverity(report.severitySummary),
  interactionCount: Array.isArray(report.interactionResults) ? report.interactionResults.length : 0,
  generatedAt: report.generatedAt,
  downloadUrl: `/reports/${report.id}/download?format=pdf`,
  xmlDownloadUrl: `/reports/${report.id}/download?format=xml`,
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
});

const formatReportDetail = (report: Report) => ({
  ...formatReportListItem(report),
  interactions: Array.isArray(report.interactionResults) ? report.interactionResults.map(slimInteraction) : [],
  disclaimer: DISCLAIMER,
  safetyNote: MEDICAL_SAFETY_NOTE,
  source: VERIFIED_DATASET_NAME,
});

const extractHistoryReportData = (history: InteractionHistory) => {
  const storedResults: any = history.results || {};
  const rawInteractions = storedResults.interactions || storedResults.results || [];
  const interactions = Array.isArray(rawInteractions)
    ? rawInteractions.filter((interaction: any) => interaction.verified !== false && interaction.severity).map(slimInteraction)
    : [];

  const severitySummary = storedResults.safetySummary?.severitySummary || buildSeveritySummary(interactions);

  return {
    selectedDrugs: history.selectedDrugs || storedResults.selectedDrugs || storedResults.checkedDrugs || [],
    interactionResults: interactions,
    checkedPairs: storedResults.checkedPairs || [],
    severitySummary,
    overallStatus: storedResults.status || resolveOverallStatus(interactions, severitySummary),
    checkedAt: storedResults.checkedAt || history.createdAt?.toISOString?.() || null,
  };
};

const resolveReportSource = async (userId: number, data: GenerateReportRequest) => {
  const historyId = parseHistoryId(data);

  if (Number.isNaN(historyId)) {
    return { error: "Interaction check id must be a valid number", selectedDrugs: [], interactionResults: [], checkedPairs: [], severitySummary: null, overallStatus: null };
  }

  if (historyId) {
    const history = await InteractionHistory.findOne({ where: { id: historyId, userId } });

    if (!history) {
      return { error: "Interaction history not found", selectedDrugs: [], interactionResults: [], checkedPairs: [], severitySummary: null, overallStatus: null };
    }

    return { error: null, ...extractHistoryReportData(history) };
  }

  const interactionResults = data.interactionResults || [];
  const severitySummary = buildSeveritySummary(interactionResults);

  return {
    error: null,
    selectedDrugs: data.selectedDrugs || [],
    interactionResults,
    checkedPairs: data.checkedPairs || [],
    severitySummary,
    overallStatus: data.overallStatus || resolveOverallStatus(interactionResults, severitySummary),
    checkedAt: data.checkedAt || null,
  };
};

const text = (value: unknown) => String(value ?? "");

const PAGE_MARGIN = 48;
const FOOTER_HEIGHT = 58;

const contentWidth = (doc: any) => doc.page.width - doc.page.margins.left - doc.page.margins.right;
const pageBottom = (doc: any) => doc.page.height - FOOTER_HEIGHT;

const ensureSpace = (doc: any, height: number) => {
  if (doc.y + height > pageBottom(doc)) {
    doc.addPage();
    doc.y = doc.page.margins.top;
  }
};

const measureText = (doc: any, value: string, options: Record<string, unknown> = {}) => (
  doc.heightOfString(value || "Not available", {
    width: contentWidth(doc),
    lineGap: 2,
    ...options,
  })
);

const addSectionTitle = (doc: any, title: string) => {
  ensureSpace(doc, 38);
  if (doc.y > doc.page.margins.top + 4) {
    doc.moveDown(0.65);
  }
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#1428A0").text(title, {
    width: contentWidth(doc),
    lineGap: 1,
  });
  doc.moveDown(0.25);
};

const addParagraph = (doc: any, value: string, options: Record<string, unknown> = {}) => {
  const body = value || "Not available";
  doc.font("Helvetica").fontSize(9.5);
  ensureSpace(doc, Math.min(measureText(doc, body, options) + 8, pageBottom(doc) - doc.page.margins.top));
  doc.fillColor("#475569").text(body, {
    width: contentWidth(doc),
    lineGap: 2,
    ...options,
  });
};

const addKeyValue = (doc: any, label: string, value: string) => {
  const body = value || "Not available";
  doc.font("Helvetica-Bold").fontSize(8.5);
  const labelHeight = measureText(doc, label.toUpperCase());
  doc.font("Helvetica").fontSize(9.5);
  const valueHeight = measureText(doc, body);
  ensureSpace(doc, labelHeight + valueHeight + 12);

  doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#64748B").text(label.toUpperCase(), {
    width: contentWidth(doc),
    lineGap: 1,
  });
  doc.font("Helvetica").fontSize(9.5).fillColor("#0F172A").text(body, {
    width: contentWidth(doc),
    lineGap: 2,
  });
  doc.moveDown(0.35);
};

const addListLine = (doc: any, primary: string, secondary?: string) => {
  const lineHeight = 26 + (secondary ? measureText(doc, secondary) : 0);
  ensureSpace(doc, lineHeight);
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0F172A").text(primary, {
    width: contentWidth(doc),
    lineGap: 1,
  });
  if (secondary) {
    doc.font("Helvetica").fontSize(8.8).fillColor("#64748B").text(secondary, {
      width: contentWidth(doc),
      lineGap: 1,
    });
  }
  doc.moveDown(0.2);
};

const addFindingCard = (doc: any, interaction: any, index: number) => {
  const title = `${index + 1}. ${text(interaction.drugA?.name)} + ${text(interaction.drugB?.name)}`;
  const fields = [
    ["Severity", text(interaction.severity)],
    ["Verified clinical effect", text(interaction.effect)],
    ["Recommendation", text(interaction.recommendation)],
    ["Plain-language explanation", text(interaction.aiExplanation) || "No plain-language explanation was generated for this finding."],
    ["Source", text(interaction.source)],
  ];

  const estimatedHeight = fields.reduce((sum, [label, value]) => {
    doc.font("Helvetica-Bold").fontSize(8.5);
    const labelHeight = measureText(doc, label);
    doc.font("Helvetica").fontSize(9.5);
    return sum + labelHeight + measureText(doc, value) + 10;
  }, measureText(doc, title) + 18);

  ensureSpace(doc, Math.min(estimatedHeight, 210));
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#0F172A").text(title, {
    width: contentWidth(doc),
    lineGap: 1,
  });
  doc.moveDown(0.25);
  fields.forEach(([label, value]) => addKeyValue(doc, label, value));
};

const drawHeader = (doc: any, report: Report, userName: string | null) => {
  doc.rect(0, 0, doc.page.width, 96).fill("#1428A0");
  doc.circle(52, 39, 15).fill("#4CD137");
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(18).text("Drug Checker AI", 76, 25, { width: 420 });
  doc.font("Helvetica").fontSize(9.5).text("Verified medication interaction report", 77, 50, { width: 420 });

  doc.y = 124;
  doc.font("Helvetica-Bold").fontSize(20).fillColor("#0F172A").text(report.title, PAGE_MARGIN, doc.y, {
    width: contentWidth(doc),
    lineGap: 1,
  });
  doc.moveDown(0.55);
  doc.font("Helvetica").fontSize(9.5).fillColor("#475569").text(`Reference: ${report.reportReference}`, PAGE_MARGIN, doc.y, {
    width: contentWidth(doc),
  });
  doc.text(`Generated: ${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(report.generatedAt)}`, {
    width: contentWidth(doc),
  });
  if (userName) {
    doc.text(`User: ${userName}`, { width: contentWidth(doc) });
  }
  doc.moveDown(0.9);
};

const drawFooter = (doc: any) => {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const lineY = doc.page.height - doc.page.margins.bottom - 20;
    const textY = doc.page.height - doc.page.margins.bottom - 12;
    doc.moveTo(PAGE_MARGIN, lineY).lineTo(doc.page.width - PAGE_MARGIN, lineY).strokeColor("#E2E8F0").stroke();
    doc.font("Helvetica").fontSize(8).fillColor("#64748B").text("Drug Checker AI", PAGE_MARGIN, textY, {
      lineBreak: false,
    });
    doc.text(`Page ${i + 1} of ${range.count}`, doc.page.width - 140, textY, {
      width: 92,
      align: "right",
      lineBreak: false,
    });
  }
};

export const generatePdf = async (report: Report, userName: string | null) => {
  await ensureReportDirectory();
  const fileName = `${sanitizeFilePart(report.reportReference)}.pdf`;
  const filePath = path.join(REPORT_STORAGE_DIR, fileName);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: PAGE_MARGIN, size: "A4", bufferPages: true, autoFirstPage: true });
    const stream = fs.createWriteStream(filePath);
    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);
    doc.pipe(stream);

    drawHeader(doc, report, userName);

    const severity = getHighestSeverity(report.severitySummary);
    const resultText = report.overallStatus === "NO_KNOWN_INTERACTION"
      ? "No known interaction found in the current verified dataset."
      : `${severity || "Known"} interaction finding identified.`;

    addSectionTitle(doc, "Result Summary");
    addKeyValue(doc, "Overall result", resultText);
    addKeyValue(doc, "Severity level", severity || "None identified");
    addKeyValue(doc, "Data source", VERIFIED_DATASET_NAME);
    if (report.overallStatus === "NO_KNOWN_INTERACTION") {
      addKeyValue(doc, "Safety note", MEDICAL_SAFETY_NOTE);
    }

    addSectionTitle(doc, "Selected Medications");
    report.selectedDrugs.forEach((drug: any, index: number) => {
      addListLine(doc, `${index + 1}. ${text(drug.name)}`, `RXCUI: ${text(drug.rxcui) || "Not available"}`);
    });

    addSectionTitle(doc, "Drug Pairs Checked");
    const pairs = report.checkedPairs?.length
      ? report.checkedPairs
      : [];
    if (pairs.length) {
      pairs.forEach((pair: any) => {
        const pairText = `${text(pair.drugA?.name)} + ${text(pair.drugB?.name)}`;
        const pairStatus = pair.status === "INTERACTION_FOUND" ? `Finding: ${pair.severity || "Known"}` : NO_KNOWN_INTERACTION_TITLE;
        addListLine(doc, pairText, pairStatus);
      });
    } else {
      addParagraph(doc, "Pair-level details were not available for this report.");
    }

    addSectionTitle(doc, "Clinical Findings");
    if (Array.isArray(report.interactionResults) && report.interactionResults.length > 0) {
      report.interactionResults.forEach((interaction: any, index: number) => {
        addFindingCard(doc, interaction, index);
      });
    } else {
      addListLine(doc, "Result: No known interaction found in the current verified dataset.");
      addParagraph(doc, NO_KNOWN_INTERACTION_MESSAGE);
    }

    if (report.notes) {
      addSectionTitle(doc, "Clinical Notes");
      addParagraph(doc, report.notes);
    }

    addSectionTitle(doc, "Medical Disclaimer");
    addParagraph(doc, DISCLAIMER);
    doc.moveDown(0.3);
    addParagraph(doc, MEDICAL_SAFETY_NOTE);

    drawFooter(doc);
    doc.end();
  });

  return { fileName, filePath };
};

const escapeXml = (value: unknown) => {
  return text(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const buildXml = (report: Report, userName: string | null) => {
  const selectedDrugs = (report.selectedDrugs || [])
    .map((drug: any) => `    <drug><rxcui>${escapeXml(drug.rxcui)}</rxcui><name>${escapeXml(drug.name)}</name></drug>`)
    .join("\n");
  const interactionResults = (report.interactionResults || [])
    .map((interaction: any) => [
      "    <interaction>",
      `      <drugA>${escapeXml(interaction.drugA?.name)}</drugA>`,
      `      <drugB>${escapeXml(interaction.drugB?.name)}</drugB>`,
      `      <severity>${escapeXml(interaction.severity)}</severity>`,
      `      <effect>${escapeXml(interaction.effect)}</effect>`,
      `      <recommendation>${escapeXml(interaction.recommendation)}</recommendation>`,
      `      <source>${escapeXml(interaction.source)}</source>`,
      "    </interaction>",
    ].join("\n"))
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<drugInteractionReport>",
    `  <reportId>${escapeXml(report.reportReference)}</reportId>`,
    `  <generatedAt>${escapeXml(report.generatedAt.toISOString())}</generatedAt>`,
    `  <user>${escapeXml(userName || "")}</user>`,
    "  <selectedDrugs>",
    selectedDrugs,
    "  </selectedDrugs>",
    "  <interactionResults>",
    interactionResults,
    "  </interactionResults>",
    `  <overallStatus>${escapeXml(report.overallStatus)}</overallStatus>`,
    `  <disclaimer>${escapeXml(DISCLAIMER)}</disclaimer>`,
    "</drugInteractionReport>",
  ].join("\n");
};

export const generateReportService = async (
  userId: number,
  data: GenerateReportRequest,
  callback: (data: ReportResponse) => void
) => {
  try {
    const preferredFormat: ReportFormat = data.preferredFormat === "xml" ? "xml" : "pdf";
    const reportSource = await resolveReportSource(userId, data);

    if (reportSource.error) {
      return callback(messageHandler(reportSource.error, false, reportSource.error.includes("valid") ? BAD_REQUEST : NOT_FOUND, {}));
    }

    if (!reportSource.selectedDrugs || reportSource.selectedDrugs.length < 2 || reportSource.selectedDrugs.length > 5) {
      return callback(messageHandler("Selected drugs must contain 2 to 5 drugs", false, BAD_REQUEST, {}));
    }

    const user = await User.findByPk(userId);
    const generatedAt = new Date();
    const severitySummary = reportSource.severitySummary || buildSeveritySummary(reportSource.interactionResults || []);
    const report = await Report.create({
      userId,
      reportReference: createReportReference(),
      title: data.title || "Drug Interaction Report",
      notes: data.notes || null,
      format: preferredFormat,
      status: ReportStatus.GENERATED,
      selectedDrugs: reportSource.selectedDrugs,
      interactionResults: reportSource.interactionResults || [],
      checkedPairs: reportSource.checkedPairs || [],
      severitySummary,
      overallStatus: reportSource.overallStatus || resolveOverallStatus(reportSource.interactionResults || [], severitySummary),
      generatedAt,
    });

    const pdf = await generatePdf(report, user?.name || null);
    await report.update({
      fileName: pdf.fileName,
      filePath: pdf.filePath,
      mimeType: "application/pdf",
    });

    return callback(messageHandler("Report generated successfully", true, SUCCESS, formatReportDetail(report)));
  } catch (error) {
    return callback(messageHandler("An error occured while generating report.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const updateReportService = async (
  userId: number,
  reportId: number,
  data: UpdateReportRequest,
  callback: (data: ReportResponse) => void
) => {
  try {
    if (isInvalidId(reportId)) {
      return callback(messageHandler("Invalid report id", false, BAD_REQUEST, {}));
    }

    const report = await Report.findOne({ where: { id: reportId, userId } });
    if (!report) {
      return callback(messageHandler("Report not found", false, NOT_FOUND, {}));
    }

    await report.update({
      ...data,
      updatedAt: new Date(),
    });

    return callback(messageHandler("Report updated successfully", true, SUCCESS, formatReportDetail(report)));
  } catch (error) {
    return callback(messageHandler("An error occured while updating report.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const getReportsService = async (userId: number, callback: (data: ReportResponse) => void) => {
  try {
    const reports = await Report.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    return callback(messageHandler("Reports fetched successfully", true, SUCCESS, reports.map(formatReportListItem)));
  } catch (error) {
    return callback(messageHandler("An error occured while fetching reports.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const getReportService = async (userId: number, reportId: number, callback: (data: ReportResponse) => void) => {
  try {
    if (isInvalidId(reportId)) {
      return callback(messageHandler("Invalid report id", false, BAD_REQUEST, {}));
    }

    const report = await Report.findOne({ where: { id: reportId, userId } });
    if (!report) {
      return callback(messageHandler("Report not found", false, NOT_FOUND, {}));
    }

    return callback(messageHandler("Report fetched successfully", true, SUCCESS, formatReportDetail(report)));
  } catch (error) {
    return callback(messageHandler("An error occured while fetching report.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const getReportDownloadService = async (
  userId: number,
  reportId: number,
  format: ReportFormat,
  callback: (error: ReportResponse | null, data?: ReportDownloadData) => void
) => {
  try {
    if (isInvalidId(reportId)) {
      return callback(messageHandler("Invalid report id", false, BAD_REQUEST, {}));
    }

    const report = await Report.findOne({ where: { id: reportId, userId } });
    if (!report) {
      return callback(messageHandler("Report not found", false, NOT_FOUND, {}));
    }

    const user = await User.findByPk(userId);

    if (format === "xml") {
      return callback(null, {
        content: buildXml(report, user?.name || null),
        fileName: `${sanitizeFilePart(report.reportReference)}.xml`,
        mimeType: "application/xml",
      });
    }

    const pdf = await generatePdf(report, user?.name || null);
    const filePath = pdf.filePath;
    const fileName = pdf.fileName;
    await report.update({
      fileName,
      filePath,
      mimeType: "application/pdf",
    });

    return callback(null, {
      filePath,
      fileName,
      mimeType: "application/pdf",
    });
  } catch (error) {
    return callback(messageHandler("An error occured while downloading report.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const deleteReportService = async (userId: number, reportId: number, callback: (data: ReportResponse) => void) => {
  try {
    if (isInvalidId(reportId)) {
      return callback(messageHandler("Invalid report id", false, BAD_REQUEST, {}));
    }

    const report = await Report.findOne({ where: { id: reportId, userId } });
    if (!report) {
      return callback(messageHandler("Report not found", false, NOT_FOUND, {}));
    }

    const filePath = report.filePath;
    await report.destroy();

    if (filePath) {
      await fsp.unlink(filePath).catch(() => undefined);
    }

    return callback(messageHandler("Report deleted successfully", true, SUCCESS, {}));
  } catch (error) {
    return callback(messageHandler("An error occured while deleting report.", false, INTERNAL_SERVER_ERROR, error));
  }
};
