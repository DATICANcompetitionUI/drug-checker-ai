import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";
import * as XLSX from "xlsx";
import { Op } from "sequelize";
import DrugInteraction from "../../schemas/interactions/drugInteractionSchema.js";
import KnowledgeBaseDataset from "../../schemas/knowledgeBase/knowledgeBaseDatasetSchema.js";
import MedicationAlias from "../../schemas/medications/medicationAliasSchema.js";
import Medication from "../../schemas/medications/medicationSchema.js";
import { canonicalPairKey, normalizeSeverity, normalizeText, uniqueStrings } from "../../utils/knowledgeBase.js";
import { clearMedicationCache } from "../drugs/medicationService.js";

type ImportFormat = "csv" | "json" | "xlsx";

export interface KnowledgeBaseImportOptions {
  filePath: string;
  datasetName: string;
  source: string;
  license: string;
  version?: string;
  format?: ImportFormat;
  dryRun?: boolean;
}

type RawRow = Record<string, any>;

const pick = (row: RawRow, keys: string[]) => {
  for (const key of keys) {
    const value = row[key] ?? row[key.toLowerCase()] ?? row[key.toUpperCase()];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
};

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
};

const readCsv = async (filePath: string): Promise<RawRow[]> => {
  const content = await fsp.readFile(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<RawRow>((row, header, index) => {
      row[header] = values[index] || "";
      return row;
    }, {});
  });
};

const readRows = async (filePath: string, format?: ImportFormat): Promise<RawRow[]> => {
  const inferred = format || path.extname(filePath).replace(".", "").toLowerCase();
  if (inferred === "json") {
    const parsed = JSON.parse(await fsp.readFile(filePath, "utf8"));
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.records)) return parsed.records;
    if (Array.isArray(parsed.data)) return parsed.data;
    const firstArrayKey = Object.keys(parsed).find((key) => Array.isArray(parsed[key]));
    return firstArrayKey ? parsed[firstArrayKey] : [];
  }
  if (inferred === "xlsx" || inferred === "xls") {
    const workbook = XLSX.readFile(filePath);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(firstSheet, { defval: "" }) as RawRow[];
  }
  return readCsv(filePath);
};

const resolveMedication = async (name: string, rxcui: string, aliases: string[], category: string | null, source: string) => {
  const cleanName = name.trim();
  const cleanRxcui = rxcui.trim() || `LOCAL-${normalizeText(cleanName).replace(/\s+/g, "-").toUpperCase()}`;

  let medication = await Medication.findOne({
    where: {
      [Op.or]: [
        { rxcui: cleanRxcui },
        { genericName: cleanName },
      ],
    },
  });

  if (!medication) {
    medication = await Medication.create({
      rxcui: cleanRxcui,
      genericName: cleanName,
      aliases: uniqueStrings(aliases),
      category,
    });
  } else {
    await medication.update({
      aliases: uniqueStrings([...(medication.aliases || []), ...aliases]),
      category: medication.category || category,
    });
  }

  for (const alias of uniqueStrings([cleanName, ...aliases])) {
    const normalizedAlias = normalizeText(alias);
    const existing = await MedicationAlias.findOne({
      where: { medicationId: medication.id, normalizedAlias },
    });
    if (!existing) {
      await MedicationAlias.create({
        medicationId: medication.id,
        alias,
        normalizedAlias,
        country: null,
        source,
      });
    }
  }

  return medication;
};

const normalizeRow = (row: RawRow) => {
  const drugAName = pick(row, ["drugAName", "drug_a_name", "drug1_name", "Drug1_name", "drug_a", "drug1", "drugA", "Drug A", "Drug1", "Drug 1"]);
  const drugBName = pick(row, ["drugBName", "drug_b_name", "drug2_name", "Drug2_name", "drug_b", "drug2", "drugB", "Drug B", "Drug2", "Drug 2"]);
  const drugARxcui = pick(row, ["drugARxcui", "drug_a_rxcui", "drug1_rxcui", "rxcui1", "RxCUI1"]);
  const drugBRxcui = pick(row, ["drugBRxcui", "drug_b_rxcui", "drug2_rxcui", "rxcui2", "RxCUI2"]);
  const effect = pick(row, ["effect", "description", "interaction", "interaction_description", "Interaction", "Interaction Description", "DDI_description", "clinical_effect", "Clinical Effect", "mechanism"]);
  const management = pick(row, ["recommendation", "management", "Management", "clinical_management", "Clinical Management", "action", "advice"]);
  const saferAlternative = pick(row, ["safer_alternative", "Safer Alternative", "alternative"]);
  const recommendation = saferAlternative
    ? `${management || "Review this interaction with a doctor or pharmacist before combining medicines."} Safer alternative noted by source: ${saferAlternative}.`
    : management;
  const severity = normalizeSeverity(pick(row, ["severity", "risk", "level", "Risk Level", "interaction_level"]));
  const evidenceSource = pick(row, ["evidenceSource", "reference", "Reference", "source_url", "pmid", "label_url"]);
  const aliasesA = pick(row, ["drugAAliases", "drug1_aliases", "aliasesA"]).split(/[;|]/).filter(Boolean);
  const aliasesB = pick(row, ["drugBAliases", "drug2_aliases", "aliasesB"]).split(/[;|]/).filter(Boolean);
  const categoryA = pick(row, ["drugACategory", "drug1_category", "categoryA"]) || null;
  const categoryB = pick(row, ["drugBCategory", "drug2_category", "categoryB"]) || null;

  return {
    drugAName,
    drugBName,
    drugARxcui,
    drugBRxcui,
    effect,
    recommendation,
    severity,
    evidenceSource,
    aliasesA,
    aliasesB,
    categoryA,
    categoryB,
  };
};

export const importKnowledgeBaseDataset = async (options: KnowledgeBaseImportOptions) => {
  const rows = await readRows(options.filePath, options.format);
  const failures: Array<{ row: number; reason: string; data: RawRow }> = [];
  const normalizedRows: Array<ReturnType<typeof normalizeRow> & { rowNumber: number }> = [];
  let skipped = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const raw = rows[index];
    const row = normalizeRow(raw);
    if (!row.drugAName || !row.drugBName || !row.effect) {
      failures.push({ row: index + 2, reason: "Missing drug names or interaction effect", data: raw });
      continue;
    }
    normalizedRows.push({ ...row, rowNumber: index + 2 });
  }

  if (options.dryRun) {
    return {
      totalRows: rows.length,
      imported: normalizedRows.length,
      skipped,
      failed: failures.length,
      dryRun: true,
    };
  }

  const medicationRequests = new Map<string, { name: string; rxcui: string; aliases: string[]; category: string | null }>();

  normalizedRows.forEach((row) => {
    [
      { name: row.drugAName, rxcui: row.drugARxcui, aliases: row.aliasesA, category: row.categoryA },
      { name: row.drugBName, rxcui: row.drugBRxcui, aliases: row.aliasesB, category: row.categoryB },
    ].forEach((drug) => {
      const key = drug.rxcui.trim() || normalizeText(drug.name);
      const existing = medicationRequests.get(key);
      medicationRequests.set(key, {
        name: drug.name,
        rxcui: drug.rxcui,
        aliases: uniqueStrings([...(existing?.aliases || []), ...drug.aliases]),
        category: existing?.category || drug.category,
      });
    });
  });

  const allMedications = await Medication.findAll();
  const existingByRxcui = new Map(allMedications.map((medication) => [medication.rxcui, medication]));
  const existingByName = new Map(allMedications.map((medication) => [normalizeText(medication.genericName), medication]));
  const missingMedications: Array<{ rxcui: string; genericName: string; aliases: string[]; category: string | null }> = [];

  for (const request of medicationRequests.values()) {
    const cleanName = request.name.trim();
    const cleanRxcui = request.rxcui.trim() || `LOCAL-${normalizeText(cleanName).replace(/\s+/g, "-").toUpperCase()}`;
    const existing = existingByRxcui.get(cleanRxcui) || existingByName.get(normalizeText(cleanName));

    if (!existing && !missingMedications.some((medication) => medication.rxcui === cleanRxcui || normalizeText(medication.genericName) === normalizeText(cleanName))) {
      missingMedications.push({
        rxcui: cleanRxcui,
        genericName: cleanName,
        aliases: uniqueStrings(request.aliases),
        category: request.category,
      });
    }
  }

  for (let index = 0; index < missingMedications.length; index += 1000) {
    await Medication.bulkCreate(missingMedications.slice(index, index + 1000), { ignoreDuplicates: true });
  }

  const refreshedMedications = await Medication.findAll();
  const medicationsByKey = new Map<string, Medication>();
  refreshedMedications.forEach((medication) => {
    medicationsByKey.set(medication.rxcui, medication);
    medicationsByKey.set(normalizeText(medication.genericName), medication);
  });

  const aliasRows: Array<{ medicationId: number; alias: string; normalizedAlias: string; country: null; source: string }> = [];
  medicationRequests.forEach((request) => {
    const cleanName = request.name.trim();
    const cleanRxcui = request.rxcui.trim() || `LOCAL-${normalizeText(cleanName).replace(/\s+/g, "-").toUpperCase()}`;
    const medication = medicationsByKey.get(cleanRxcui) || medicationsByKey.get(normalizeText(cleanName));
    if (!medication) return;

    uniqueStrings([cleanName, ...request.aliases]).forEach((alias) => {
      aliasRows.push({
        medicationId: medication.id,
        alias,
        normalizedAlias: normalizeText(alias),
        country: null,
        source: options.datasetName,
      });
    });
  });

  for (let index = 0; index < aliasRows.length; index += 1000) {
    await MedicationAlias.bulkCreate(aliasRows.slice(index, index + 1000), { ignoreDuplicates: true });
  }

  const existingInteractions = await DrugInteraction.findAll({
    attributes: ["drugARxcui", "drugBRxcui"],
  });
  const seenPairs = new Set(existingInteractions.map((interaction) => canonicalPairKey(interaction.drugARxcui, interaction.drugBRxcui)));
  const newInteractions: Array<{
    drugAName: string;
    drugBName: string;
    drugARxcui: string;
    drugBRxcui: string;
    severity: any;
    effect: string;
    recommendation: string;
    source: string;
    evidenceSource: string;
    sourceDataset: string;
  }> = [];

  for (const row of normalizedRows) {
    const drugA = medicationsByKey.get(row.drugARxcui.trim()) || medicationsByKey.get(normalizeText(row.drugAName));
    const drugB = medicationsByKey.get(row.drugBRxcui.trim()) || medicationsByKey.get(normalizeText(row.drugBName));

    if (!drugA || !drugB) {
      failures.push({ row: row.rowNumber, reason: "Could not resolve medication records", data: row });
      continue;
    }

    const pairKey = canonicalPairKey(drugA.rxcui, drugB.rxcui);

    if (seenPairs.has(pairKey)) {
      skipped += 1;
      continue;
    }
    seenPairs.add(pairKey);

    const [left, right] = drugA.rxcui.localeCompare(drugB.rxcui) <= 0
      ? [drugA, drugB]
      : [drugB, drugA];

    newInteractions.push({
      drugAName: left.genericName,
      drugBName: right.genericName,
      drugARxcui: left.rxcui,
      drugBRxcui: right.rxcui,
      severity: row.severity,
      effect: row.effect,
      recommendation: row.recommendation || "Review this interaction with a doctor or pharmacist before combining medicines.",
      source: options.datasetName,
      evidenceSource: row.evidenceSource || options.source,
      sourceDataset: options.datasetName,
    });
  }

  for (let index = 0; index < newInteractions.length; index += 1000) {
    await DrugInteraction.bulkCreate(newInteractions.slice(index, index + 1000));
  }

  const [dataset] = await KnowledgeBaseDataset.findOrCreate({
    where: { name: options.datasetName, version: options.version || null },
    defaults: {
      name: options.datasetName,
      source: options.source,
      license: options.license,
      version: options.version || null,
      recordCount: newInteractions.length,
      importedAt: new Date(),
    },
  });
  await dataset.update({ recordCount: newInteractions.length, importedAt: new Date() });
  clearMedicationCache();

  if (failures.length) {
    const logPath = path.resolve(process.cwd(), "storage", "imports", `${Date.now()}-${options.datasetName.replace(/[^a-z0-9]+/gi, "-")}-failures.json`);
    await fsp.mkdir(path.dirname(logPath), { recursive: true });
    await fsp.writeFile(logPath, JSON.stringify(failures, null, 2));
  }

  return {
    totalRows: rows.length,
    imported: newInteractions.length,
    skipped,
    failed: failures.length,
    dryRun: Boolean(options.dryRun),
  };
};

export const assertImportFileExists = (filePath: string) => {
  if (!fs.existsSync(filePath)) {
    const resolvedPath = path.resolve(filePath);
    throw new Error([
      `Import file not found: ${filePath}`,
      `Resolved path: ${resolvedPath}`,
      "Place the downloaded dataset at that path, or pass the real file path with --file.",
      "For a local template, see backend/data/ddi-import-template.csv.",
    ].join("\n"));
  }
};
