import { DataTypes } from "sequelize";
import sequelize from "./db.js";
import { ReportStatus } from "../constants/reportStatus.js";

const addColumnIfMissing = async (
  table: Record<string, unknown>,
  columnName: string,
  definition: Parameters<ReturnType<typeof sequelize.getQueryInterface>["addColumn"]>[2]
) => {
  if (!table[columnName]) {
    await sequelize.getQueryInterface().addColumn("reports", columnName, definition);
  }
};

export const ensureReportColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable("reports");

  await addColumnIfMissing(table, "reportReference", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await addColumnIfMissing(table, "format", {
    type: DataTypes.ENUM("pdf", "xml"),
    allowNull: false,
    defaultValue: "pdf",
  });

  if (!table.status) {
    await queryInterface.addColumn("reports", "status", {
      type: DataTypes.ENUM(...Object.values(ReportStatus)),
      allowNull: false,
      defaultValue: ReportStatus.GENERATED,
    });
  }

  if (!table.notes) {
    await queryInterface.addColumn("reports", "notes", {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    });
  }

  if (!table.pdfUrl) {
    await queryInterface.addColumn("reports", "pdfUrl", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    });
  }

  await addColumnIfMissing(table, "checkedPairs", {
    type: DataTypes.JSON,
    allowNull: true,
  });

  await addColumnIfMissing(table, "overallStatus", {
    type: DataTypes.ENUM("INTERACTION_FOUND", "NO_KNOWN_INTERACTION"),
    allowNull: false,
    defaultValue: "NO_KNOWN_INTERACTION",
  });

  await addColumnIfMissing(table, "fileName", {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  });

  await addColumnIfMissing(table, "filePath", {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  });

  await addColumnIfMissing(table, "storageUrl", {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  });

  await addColumnIfMissing(table, "mimeType", {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  });

  await addColumnIfMissing(table, "generatedAt", {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  });

  await sequelize.query("UPDATE reports SET reportReference = CONCAT('DCA-', LPAD(id, 6, '0')) WHERE reportReference IS NULL OR reportReference = ''");

  const indexes = await queryInterface.showIndex("reports") as any[];
  const hasReportReferenceIndex = indexes.some((index: any) => index.name === "reports_report_reference_unique");
  if (!hasReportReferenceIndex) {
    await queryInterface.addIndex("reports", ["reportReference"], {
      unique: true,
      name: "reports_report_reference_unique",
    });
  }
};

export const ensureKnowledgeBaseColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();

  const medications = await queryInterface.describeTable("medications");
  if (!medications.category) {
    await queryInterface.addColumn("medications", "category", {
      type: DataTypes.STRING(120),
      allowNull: true,
      defaultValue: null,
    });
  }

  const interactions = await queryInterface.describeTable("drug_interactions");
  if (!interactions.evidenceSource) {
    await queryInterface.addColumn("drug_interactions", "evidenceSource", {
      type: DataTypes.STRING(512),
      allowNull: true,
      defaultValue: null,
    });
  }

  if (!interactions.sourceDataset) {
    await queryInterface.addColumn("drug_interactions", "sourceDataset", {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    });
  }
};
