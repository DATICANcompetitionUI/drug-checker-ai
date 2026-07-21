import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database/db.js";
import { ReportStatus } from "../../constants/reportStatus.js";

export interface ReportAttributes {
  id: number;
  userId: number;
  reportReference: string;
  title: string;
  format: "pdf" | "xml";
  selectedDrugs: any[];
  interactionResults: any[];
  checkedPairs: any[];
  overallStatus: "INTERACTION_FOUND" | "NO_KNOWN_INTERACTION";
  severitySummary: Record<string, number>;
  status: ReportStatus;
  notes: string | null;
  fileName: string | null;
  filePath: string | null;
  storageUrl: string | null;
  mimeType: string | null;
  pdfUrl: string | null;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportCreationAttributes extends Optional<
  ReportAttributes,
  | "id"
  | "reportReference"
  | "format"
  | "checkedPairs"
  | "overallStatus"
  | "status"
  | "notes"
  | "fileName"
  | "filePath"
  | "storageUrl"
  | "mimeType"
  | "pdfUrl"
  | "generatedAt"
  | "createdAt"
  | "updatedAt"
> {}

export class Report extends Model<ReportAttributes, ReportCreationAttributes> implements ReportAttributes {
  declare id: number;
  declare userId: number;
  declare reportReference: string;
  declare title: string;
  declare format: "pdf" | "xml";
  declare selectedDrugs: any[];
  declare interactionResults: any[];
  declare checkedPairs: any[];
  declare overallStatus: "INTERACTION_FOUND" | "NO_KNOWN_INTERACTION";
  declare severitySummary: Record<string, number>;
  declare status: ReportStatus;
  declare notes: string | null;
  declare fileName: string | null;
  declare filePath: string | null;
  declare storageUrl: string | null;
  declare mimeType: string | null;
  declare pdfUrl: string | null;
  declare generatedAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export const ReportSchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reportReference: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  format: {
    type: DataTypes.ENUM("pdf", "xml"),
    allowNull: false,
    defaultValue: "pdf",
  },
  selectedDrugs: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  interactionResults: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  checkedPairs: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  overallStatus: {
    type: DataTypes.ENUM("INTERACTION_FOUND", "NO_KNOWN_INTERACTION"),
    allowNull: false,
    defaultValue: "NO_KNOWN_INTERACTION",
  },
  severitySummary: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(ReportStatus)),
    allowNull: false,
    defaultValue: ReportStatus.GENERATED,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  storageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  pdfUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  generatedAt: {
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
} as const;

Report.init(ReportSchema, {
  sequelize,
  modelName: "Report",
  tableName: "reports",
});

export default Report;
