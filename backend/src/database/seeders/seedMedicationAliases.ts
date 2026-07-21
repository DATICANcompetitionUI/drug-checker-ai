import Medication from "../../schemas/medications/medicationSchema.js";
import MedicationAlias from "../../schemas/medications/medicationAliasSchema.js";
import KnowledgeBaseDataset from "../../schemas/knowledgeBase/knowledgeBaseDatasetSchema.js";
import { normalizeText, uniqueStrings } from "../../utils/knowledgeBase.js";
import { nigerianMedicationAliases } from "./nigerianMedicationAliases.js";

const upsertAlias = async (medicationId: number, alias: string, country: string | null, source: string | null) => {
  const normalizedAlias = normalizeText(alias);
  const existing = await MedicationAlias.findOne({
    where: {
      medicationId,
      normalizedAlias,
      country,
    },
  });

  if (existing) return existing;

  return MedicationAlias.create({
    medicationId,
    alias,
    normalizedAlias,
    country,
    source,
  });
};

export const seedMedicationAliases = async () => {
  let aliasCount = 0;

  for (const entry of nigerianMedicationAliases) {
    const [medication] = await Medication.findOrCreate({
      where: { rxcui: entry.rxcui },
      defaults: {
        rxcui: entry.rxcui,
        genericName: entry.genericName,
        aliases: uniqueStrings(entry.aliases),
        category: entry.category,
      },
    });

    const mergedAliases = uniqueStrings([...(medication.aliases || []), ...entry.aliases]);
    await medication.update({
      genericName: medication.genericName || entry.genericName,
      category: medication.category || entry.category,
      aliases: mergedAliases,
    });

    for (const alias of mergedAliases) {
      await upsertAlias(medication.id, alias, "Nigeria", entry.source);
      aliasCount += 1;
    }
  }

  const medications = await Medication.findAll();
  for (const medication of medications) {
    for (const alias of uniqueStrings([medication.genericName, ...(medication.aliases || [])])) {
      await upsertAlias(medication.id, alias, null, "Bundled medication seed");
      aliasCount += 1;
    }
  }

  await KnowledgeBaseDataset.findOrCreate({
    where: {
      name: "Bundled Nigerian medication aliases",
      version: "2026-07-21",
    },
    defaults: {
      name: "Bundled Nigerian medication aliases",
      source: "NAFDAC Greenbook, Nigerian pharmacy listings, and curated brand-to-generic mappings",
      license: "Source-dependent public reference metadata; verify before commercial redistribution",
      version: "2026-07-21",
      recordCount: aliasCount,
      importedAt: new Date(),
    },
  });

  console.log(`Medication aliases seeded: ${aliasCount} aliases processed.`);
};
