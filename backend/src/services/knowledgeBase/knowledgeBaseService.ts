import { SUCCESS, INTERNAL_SERVER_ERROR } from "../../constants/statusCode.js";
import DrugInteraction from "../../schemas/interactions/drugInteractionSchema.js";
import KnowledgeBaseDataset from "../../schemas/knowledgeBase/knowledgeBaseDatasetSchema.js";
import MedicationAlias from "../../schemas/medications/medicationAliasSchema.js";
import Medication from "../../schemas/medications/medicationSchema.js";
import { messageHandler } from "../../utils/index.js";

export const getKnowledgeBaseStatsService = async (callback: (data: any) => void) => {
  try {
    const [totalMedications, totalAliases, totalInteractionRecords, sourceDatasets] = await Promise.all([
      Medication.count(),
      MedicationAlias.count(),
      DrugInteraction.count(),
      KnowledgeBaseDataset.findAll({ order: [["importedAt", "DESC"]] }),
    ]);

    const newestDataset = sourceDatasets[0] || null;

    return callback(messageHandler("Knowledge base statistics fetched successfully", true, SUCCESS, {
      version: newestDataset?.version || "bundled",
      totalMedications,
      totalAliases,
      totalInteractionRecords,
      lastUpdated: newestDataset?.importedAt || null,
      sourceDatasets: sourceDatasets.map((dataset) => ({
        name: dataset.name,
        source: dataset.source,
        license: dataset.license,
        version: dataset.version,
        recordCount: dataset.recordCount,
        importedAt: dataset.importedAt,
      })),
    }));
  } catch (error) {
    return callback(messageHandler("Unable to fetch knowledge base statistics.", false, INTERNAL_SERVER_ERROR, error));
  }
};
