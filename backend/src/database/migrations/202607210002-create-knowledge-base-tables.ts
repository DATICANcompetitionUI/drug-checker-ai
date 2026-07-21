import { DataTypes, QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.addColumn("medications", "category", {
    type: DataTypes.STRING(120),
    allowNull: true,
    defaultValue: null,
  });

  await queryInterface.createTable("medication_aliases", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    medicationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "medications", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    alias: { type: DataTypes.STRING(512), allowNull: false },
    normalizedAlias: { type: DataTypes.STRING(512), allowNull: false },
    country: { type: DataTypes.STRING(80), allowNull: true, defaultValue: null },
    source: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await queryInterface.addIndex("medication_aliases", ["normalizedAlias"]);
  await queryInterface.addIndex("medication_aliases", ["medicationId", "normalizedAlias", "country"], {
    unique: true,
    name: "med_alias_med_norm_country_unique",
  });

  await queryInterface.addColumn("drug_interactions", "evidenceSource", {
    type: DataTypes.STRING(512),
    allowNull: true,
    defaultValue: null,
  });
  await queryInterface.addColumn("drug_interactions", "sourceDataset", {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  });

  await queryInterface.createTable("knowledge_base_datasets", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    source: { type: DataTypes.STRING(512), allowNull: false },
    license: { type: DataTypes.STRING(255), allowNull: false },
    version: { type: DataTypes.STRING(120), allowNull: true, defaultValue: null },
    recordCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    importedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await queryInterface.addIndex("knowledge_base_datasets", ["name", "version"], {
    unique: true,
    name: "kb_dataset_name_version_unique",
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable("knowledge_base_datasets");
  await queryInterface.removeColumn("drug_interactions", "sourceDataset");
  await queryInterface.removeColumn("drug_interactions", "evidenceSource");
  await queryInterface.dropTable("medication_aliases");
  await queryInterface.removeColumn("medications", "category");
};
