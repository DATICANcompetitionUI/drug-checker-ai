import { Severity } from "../constants/severity.js";

export const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

export const uniqueStrings = (values: string[]) => {
  const seen = new Set<string>();
  return values
    .map((value) => String(value || "").trim())
    .filter((value) => {
      if (!value) return false;
      const key = normalizeText(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export const canonicalPairKey = (drugARxcui: string, drugBRxcui: string) => {
  const [left, right] = [drugARxcui.trim(), drugBRxcui.trim()].sort((a, b) => a.localeCompare(b));
  return `${left}::${right}`;
};

export const normalizeSeverity = (value: unknown): Severity => {
  const raw = String(value || "").trim().toLowerCase();
  if (["high", "major", "serious", "contraindicated", "avoid", "danger"].some((term) => raw.includes(term))) {
    return Severity.HIGH;
  }
  if (["moderate", "medium", "monitor", "caution"].some((term) => raw.includes(term))) {
    return Severity.MODERATE;
  }
  return Severity.LOW;
};
