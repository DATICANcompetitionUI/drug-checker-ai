# Knowledge Base Dataset Research

Last reviewed: 2026-07-21

Drug Checker AI should only import interaction records from datasets with reusable licensing and clear provenance. Gemini must not create interaction facts.

## Recommended Sources

### DDInter 2.0

- Source: https://ddinter2.scbdd.com/
- License: Open-access website; original DDInter paper indicates Creative Commons BY-NC for the article. Verify dataset terms before commercial redistribution.
- Records: 302,516 DDI associations connecting 2,290 approved drugs.
- Fields: drug names, DDI association, mechanism/description, risk level, management guidance, therapeutic duplication data, ATC annotations.
- Suitability: Best direct source for bulk DDI import because it is curated for drug-drug interactions and includes risk/management annotations.

### DDInter 1.0

- Source: https://ddinter.scbdd.com/
- License: Open-access website; verify download terms and attribution requirements.
- Records: 236,834 DDI associations connecting 1,833 approved drugs.
- Fields: drug names, mechanisms, risk levels, management strategies, alternatives.
- Suitability: Useful fallback if DDInter 2.0 download access changes.

### RxNorm / RxNav

- Source: https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html
- License: NLM states no license is needed for most RxNorm API use because RxNorm is a non-proprietary NLM vocabulary.
- Records: Vocabulary/normalization data, not a current DDI source.
- Fields: RxCUIs, normalized names, ingredients, brand names, related concepts, NDC links.
- Suitability: Excellent for normalizing imported drug names and mapping brands/products to ingredients. Do not rely on it as the DDI source because the RxNav interaction API has been discontinued.

### DailyMed / FDA SPL

- Source: https://dailymed.nlm.nih.gov/dailymed/spl-resources-all-drug-labels.cfm
- License: Public US FDA/NLM labeling data; verify specific reuse language for downstream packaging.
- Records: Current downloads include thousands of label files per periodic update and large full-release archives split into parts.
- Fields: SPL XML labels, active ingredients, brand names, indications, contraindications, warnings, drug interaction sections.
- Suitability: Strong source for label-backed evidence and future extraction of interaction warnings. Import should use deterministic section extraction plus manual review.

### FDALabel

- Source: https://www.fda.gov/science-research/bioinformatics-tools/fdalabel-full-text-search-drug-product-labeling
- License: FDA public labeling source; verify downstream terms.
- Records: FDA states the database searches more than 155,000 labeling documents.
- Fields: full-text labeling, drug interaction sections, warnings, contraindications.
- Suitability: Good source for label text validation and evidence URLs, but less direct than DDInter for ready-to-import pair records.

### Kaggle DDI Datasets

- Source examples:
  - https://www.kaggle.com/datasets/mghobashy/drug-drug-interactions
  - https://www.kaggle.com/datasets/shayanhusain/drug-drug-interactions-management-and-safer-alters
  - https://www.kaggle.com/datasets/montassarba/drug-drug-interactions-database-ddinter
- License: Dataset-specific. Kaggle pages must be checked before import; many DDI datasets are DrugBank-derived and may not permit redistribution.
- Records: Varies from small clinical teaching sets to large DrugBank/DDInter mirrors.
- Fields: Usually drug names, interaction text, severity/type, sometimes management alternatives.
- Suitability: Good for experimentation and import-pipeline tests. Do not import DrugBank-derived data into production unless the Kaggle license and upstream DrugBank license permit the intended use.

### HODDI / FAERS-derived Academic Datasets

- Source: https://github.com/TIML-Group/HODDI
- License: Check repository license before import.
- Records: Paper reports more than 100,000 higher-order DDI records from FAERS.
- Fields: multi-drug combinations, side effects, quarterly signals.
- Suitability: Research/pharmacovigilance only. These are adverse-event signals, not verified clinical pairwise interaction rules, so keep separate from the main DDI table unless clinically curated.

## Import Policy

1. Prefer DDInter for direct DDI associations after license confirmation.
2. Use RxNorm for normalization and alias enrichment.
3. Use DailyMed/FDALabel as evidence text and future label extraction sources.
4. Treat FAERS/HODDI/TWOSIDES-style signals as research signals, not verified clinical interactions.
5. Do not import DrugBank-derived files unless explicit redistribution rights are confirmed.
