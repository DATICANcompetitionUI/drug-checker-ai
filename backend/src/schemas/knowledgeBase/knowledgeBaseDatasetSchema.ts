import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database/db.js";

export interface KnowledgeBaseDatasetAttributes {
  id: number;
  name: string;
  source: string;
  license: string;
  version: string | null;
  recordCount: number;
  importedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeBaseDatasetCreationAttributes
  extends Optional<KnowledgeBaseDatasetAttributes, "id" | "version" | "recordCount" | "importedAt" | "createdAt" | "updatedAt"> {}

export class KnowledgeBaseDataset
  extends Model<KnowledgeBaseDatasetAttributes, KnowledgeBaseDatasetCreationAttributes>
  implements KnowledgeBaseDatasetAttributes
{
  declare id: number;
  declare name: string;
  declare source: string;
  declare license: string;
  declare version: string | null;
  declare recordCount: number;
  declare importedAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
}

KnowledgeBaseDataset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    license: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING(120),
      allowNull: true,
      defaultValue: null,
    },
    recordCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    importedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "KnowledgeBaseDataset",
    tableName: "knowledge_base_datasets",
    indexes: [{ unique: true, fields: ["name", "version"], name: "kb_dataset_name_version_unique" }],
  }
);

export default KnowledgeBaseDataset;
