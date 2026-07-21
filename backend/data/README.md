# Knowledge Base Import Data

Place approved dataset files in this folder before running the importer.

The docs command uses `./data/ddinter.csv` as an example path. That file is not bundled because DDInter/Kaggle datasets must be downloaded separately and their license terms verified before redistribution.

Use the template to confirm the importer works:

```bash
npm run import:kb -- --file=./data/ddi-import-template.csv --dataset="Local Template" --source="Local template" --license="Internal test" --dry-run
```

For a real dataset:

```bash
npm run import:kb -- --file=./data/your-approved-dataset.csv --dataset="Dataset Name" --source="https://source.example" --license="License name or terms" --version="YYYY-MM-DD"
```

Expected columns can be named flexibly:

- `drugAName`, `drugBName`
- `drugARxcui`, `drugBRxcui`
- `severity`
- `effect` or `description`
- `recommendation` or `management`
- `evidenceSource`
