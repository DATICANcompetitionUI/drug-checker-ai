import User from "./users/authSchema.js";
import "./interactions/drugInteractionSchema.js";
import "./history/interactionHistorySchema.js";
import Report from "./reports/reportSchema.js";
import Medication from "./medications/medicationSchema.js";
import MedicationAlias from "./medications/medicationAliasSchema.js";
import "./knowledgeBase/knowledgeBaseDatasetSchema.js";

User.hasMany(Report, {
  foreignKey: "userId",
  as: "reports",
});

Report.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Medication.hasMany(MedicationAlias, {
  foreignKey: "medicationId",
  as: "normalizedAliases",
});

MedicationAlias.belongsTo(Medication, {
  foreignKey: "medicationId",
  as: "medication",
});
