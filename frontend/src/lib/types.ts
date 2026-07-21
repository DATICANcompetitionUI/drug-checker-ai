export interface ApiResponse<T> {
  message: string;
  success: boolean;
  statusCode: number;
  data: T;
}

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Drug {
  id?: number;
  rxcui: string;
  name: string;
  aliases?: string[];
  synonym?: string;
  tty?: string;
}

export type Severity = "LOW" | "MODERATE" | "HIGH";

export interface SeveritySummary {
  LOW: number;
  MODERATE: number;
  HIGH: number;
}

export interface SafetySummary {
  totalSelectedDrugs: number;
  totalPairsChecked: number;
  verifiedInteractions: number;
  unverifiedPairs: number;
  duplicateTherapies: number;
  severitySummary: SeveritySummary;
  highestSeverity: Severity | null;
  actionMessage: string;
}

export interface Interaction {
  drugA: Drug;
  drugB: Drug;
  severity: Severity;
  effect: string;
  recommendation: string;
  source: string;
  aiExplanation: string | null;
  isAiGenerated?: boolean;
}

export interface DuplicateTherapy {
  ingredient: Drug;
  drugs: Drug[];
  severity: Severity;
  effect: string;
  recommendation: string;
  source: string;
}

export interface InteractionCheckResult {
  selectedDrugs: Drug[];
  duplicateTherapies: DuplicateTherapy[];
  safetySummary: SafetySummary;
  aiSummary: string | null;
  interactions: Interaction[];
  historySaved: boolean;
  historyId: number | null;
}

export interface HistoryListItem {
  id: number;
  selectedDrugs: Drug[];
  safetySummary: SafetySummary | null;
  interactionCount: number;
  duplicateTherapyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryDetail {
  id: number;
  selectedDrugs: Drug[];
  duplicateTherapies: DuplicateTherapy[];
  safetySummary: SafetySummary | null;
  aiSummary: string | null;
  interactions: Interaction[];
  createdAt: string;
  updatedAt: string;
}

export type ReportStatus = "GENERATED" | "REVIEWED" | "ARCHIVED";

export interface ReportListItem {
  id: number;
  title: string;
  status: ReportStatus;
  notes: string | null;
  selectedDrugs: Drug[];
  severitySummary: SeveritySummary;
  interactionCount: number;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDetail {
  id: number;
  title: string;
  status: ReportStatus;
  notes: string | null;
  selectedDrugs: Drug[];
  severitySummary: SeveritySummary;
  interactions: Interaction[];
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
