import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database/db.js";

export interface MedicationAliasAttributes {
  id: number;
  medicationId: number;
  alias: string;
  normalizedAlias: string;
  country: string | null;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationAliasCreationAttributes
  extends Optional<MedicationAliasAttributes, "id" | "country" | "source" | "createdAt" | "updatedAt"> {}

export class MedicationAlias
  extends Model<MedicationAliasAttributes, MedicationAliasCreationAttributes>
  implements MedicationAliasAttributes
{
  declare id: number;
  declare medicationId: number;
  declare alias: string;
  declare normalizedAlias: string;
  declare country: string | null;
  declare source: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

MedicationAlias.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    medicationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    alias: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    normalizedAlias: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(80),
      allowNull: true,
      defaultValue: null,
    },
    source: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
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
    modelName: "MedicationAlias",
    tableName: "medication_aliases",
    indexes: [
      { fields: ["normalizedAlias"] },
      { unique: true, fields: ["medicationId", "normalizedAlias", "country"], name: "med_alias_med_norm_country_unique" },
    ],
  }
);

export default MedicationAlias;
