import dotenv from "dotenv";
import sequelize from "../database/db.js";
import "../schemas/index.js";
import { assertImportFileExists, importKnowledgeBaseDataset } from "../services/knowledgeBase/importPipeline.js";

dotenv.config();

const getArg = (name: string) => {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
};

const main = async () => {
  const filePath = getArg("file");
  const datasetName = getArg("dataset");
  const source = getArg("source") || "Manual import";
  const license = getArg("license") || "Unknown - verify before redistribution";
  const version = getArg("version");
  const format = getArg("format") as any;
  const dryRun = process.argv.includes("--dry-run");

  if (!filePath || !datasetName) {
    throw new Error("Usage: npm run import:kb -- --file=path --dataset=name --source=url --license=license [--version=v1] [--format=csv|json|xlsx] [--dry-run]");
  }

  assertImportFileExists(filePath);
  await sequelize.authenticate();
  await sequelize.sync();

  const summary = await importKnowledgeBaseDataset({
    filePath,
    datasetName,
    source,
    license,
    version,
    format,
    dryRun,
  });

  console.log(JSON.stringify(summary, null, 2));
  await sequelize.close();
};

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await sequelize.close().catch(() => undefined);
  process.exit(1);
});
