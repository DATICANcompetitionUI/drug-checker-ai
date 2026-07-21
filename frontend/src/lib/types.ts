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
  category?: string | null;
}

export interface KnowledgeBaseStats {
  version: string;
  totalMedications: number;
  totalAliases: number;
  totalInteractionRecords: number;
  lastUpdated: string | null;
  sourceDatasets: Array<{
    name: string;
    source: string;
    license: string;
    version: string | null;
    recordCount: number;
    importedAt: string;
  }>;
}

export type Severity = "LOW" | "MODERATE" | "HIGH";
export type InteractionStatus =
  | "INTERACTION_FOUND"
  | "NO_KNOWN_INTERACTION";

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

export interface CheckedPair {
  drugA: Drug;
  drugB: Drug;
  status: InteractionStatus;
  severity: Severity | null;
  source: string | null;
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
  hasInteraction: boolean;
  status: InteractionStatus;
  title: string;
  message: string;
  safetyNote: string;
  checkedDrugs: Drug[];
  checkedPairs: CheckedPair[];
  sourceCoverage: {
    dataset: string;
    checkedAt: string;
  };
  metadata?: {
    processingTimeMs: number;
    knowledgeBaseVersion: string;
    interactionRecordsChecked: number;
    knowledgeBaseLastUpdated: string | null;
  };
  checkedAt: string;
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
export type ReportFormat = "pdf" | "xml";

export interface ReportListItem {
  id: number;
  reportReference: string;
  title: string;
  format: ReportFormat;
  status: ReportStatus;
  notes: string | null;
  selectedDrugs: Drug[];
  checkedPairs: CheckedPair[];
  overallStatus: InteractionStatus;
  severitySummary: SeveritySummary;
  severity: Severity | null;
  interactionCount: number;
  generatedAt: string;
  downloadUrl?: string;
  xmlDownloadUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDetail {
  id: number;
  reportReference: string;
  title: string;
  format: ReportFormat;
  status: ReportStatus;
  notes: string | null;
  selectedDrugs: Drug[];
  checkedPairs: CheckedPair[];
  overallStatus: InteractionStatus;
  severitySummary: SeveritySummary;
  severity: Severity | null;
  interactions: Interaction[];
  generatedAt: string;
  downloadUrl?: string;
  xmlDownloadUrl?: string;
  disclaimer: string;
  safetyNote: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}
