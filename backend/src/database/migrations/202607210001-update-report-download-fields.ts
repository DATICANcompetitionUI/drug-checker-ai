import { DataTypes, QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.addColumn("reports", "reportReference", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn("reports", "format", {
    type: DataTypes.ENUM("pdf", "xml"),
    allowNull: false,
    defaultValue: "pdf",
  });
  await queryInterface.addColumn("reports", "checkedPairs", {
    type: DataTypes.JSON,
    allowNull: true,
  });
  await queryInterface.addColumn("reports", "overallStatus", {
    type: DataTypes.ENUM("INTERACTION_FOUND", "NO_KNOWN_INTERACTION"),
    allowNull: false,
    defaultValue: "NO_KNOWN_INTERACTION",
  });
  await queryInterface.addColumn("reports", "fileName", {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  });
  await queryInterface.addColumn("reports", "filePath", {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  });
  await queryInterface.addColumn("reports", "storageUrl", {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  });
  await queryInterface.addColumn("reports", "mimeType", {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  });
  await queryInterface.addColumn("reports", "generatedAt", {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  });

  await queryInterface.sequelize.query("UPDATE reports SET reportReference = CONCAT('DCA-', LPAD(id, 6, '0')) WHERE reportReference IS NULL OR reportReference = ''");
  await queryInterface.addIndex("reports", ["reportReference"], {
    unique: true,
    name: "reports_report_reference_unique",
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.removeIndex("reports", "reports_report_reference_unique");
  await queryInterface.removeColumn("reports", "generatedAt");
  await queryInterface.removeColumn("reports", "mimeType");
  await queryInterface.removeColumn("reports", "storageUrl");
  await queryInterface.removeColumn("reports", "filePath");
  await queryInterface.removeColumn("reports", "fileName");
  await queryInterface.removeColumn("reports", "overallStatus");
  await queryInterface.removeColumn("reports", "checkedPairs");
  await queryInterface.removeColumn("reports", "format");
  await queryInterface.removeColumn("reports", "reportReference");
};
