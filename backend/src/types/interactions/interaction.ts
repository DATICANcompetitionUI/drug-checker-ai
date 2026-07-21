import { BaseResponse } from "../users/auth.js";

export interface SelectedDrug {
  rxcui: string;
  name: string;
}

export type InteractionStatus =
  | "INTERACTION_FOUND"
  | "NO_KNOWN_INTERACTION";

export interface InteractionCheckRequest {
  drugs: SelectedDrug[];
}

export interface InteractionResult {
  drugA: SelectedDrug;
  drugB: SelectedDrug;
  matchedDrugA?: SelectedDrug;
  matchedDrugB?: SelectedDrug;
  verified: boolean;
  isAiAssessed?: boolean;
  severity: string | null;
  effect: string;
  recommendation: string;
  source: string;
  aiExplanation: string | null;
}

export interface DuplicateTherapyWarning {
  ingredient: SelectedDrug;
  drugs: SelectedDrug[];
  severity: "LOW" | "MODERATE" | "HIGH";
  effect: string;
  recommendation: string;
  source: string;
}

export interface SafetySummary {
  totalSelectedDrugs: number;
  totalPairsChecked: number;
  verifiedInteractions: number;
  unverifiedPairs: number;
  duplicateTherapies: number;
  severitySummary: {
    LOW: number;
    MODERATE: number;
    HIGH: number;
  };
  highestSeverity: "LOW" | "MODERATE" | "HIGH" | null;
  actionMessage: string;
}

export interface CheckedPair {
  drugA: SelectedDrug;
  drugB: SelectedDrug;
  status: InteractionStatus;
  severity: "LOW" | "MODERATE" | "HIGH" | null;
  source: string | null;
}

export interface SourceCoverage {
  dataset: string;
  checkedAt: string;
}

export interface InteractionCheckMetadata {
  processingTimeMs: number;
  knowledgeBaseVersion: string;
  interactionRecordsChecked: number;
  knowledgeBaseLastUpdated: string | null;
}

export type InteractionResponse = BaseResponse;
