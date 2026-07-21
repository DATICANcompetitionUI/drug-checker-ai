import { BaseResponse } from "../users/auth.js";
import { InteractionResult, SelectedDrug } from "../interactions/interaction.js";
import { ReportStatus } from "../../constants/reportStatus.js";

export type ReportFormat = "pdf" | "xml";
export type InteractionStatus =
  | "INTERACTION_FOUND"
  | "NO_KNOWN_INTERACTION";

export interface GenerateReportRequest {
  historyId?: number;
  interactionCheckId?: number | string;
  title?: string;
  notes?: string;
  selectedDrugs?: SelectedDrug[];
  interactionResults?: InteractionResult[];
  preferredFormat?: ReportFormat;
  checkedPairs?: any[];
  checkedAt?: string;
  overallStatus?: InteractionStatus;
  safetyNote?: string;
}

export interface UpdateReportRequest {
  title?: string;
  notes?: string | null;
  status?: ReportStatus;
}

export interface ReportDownloadData {
  filePath?: string;
  content?: string;
  fileName: string;
  mimeType: string;
}

export type ReportResponse = BaseResponse;
