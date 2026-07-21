# Drug Checker AI

Drug Checker AI is an AI-assisted medication safety platform built for helping users search medicines, check possible drug-drug interactions, understand risk levels, and save clinical-style reports.

The project focuses on a practical healthcare problem: many people take multiple medicines at the same time, but they may not understand whether those combinations are risky. Drug Checker AI gives users a clean workflow to search for medications, select up to five drugs, check verified interaction records, and read plain-language AI explanations based only on confirmed data.

> Important: Drug Checker AI is a safety assistant for education and hackathon demonstration. It does not replace a doctor, pharmacist, or qualified healthcare professional.

## Screenshots

![Drug Checker AI dashboard](https://res.cloudinary.com/dscoqfcw0/image/upload/v1784642621/Screenshot_2026-07-21_145720_yrki63.png)

![Drug Checker AI report view](https://res.cloudinary.com/dscoqfcw0/image/upload/v1784642708/Screenshot_2026-07-21_145856_ytcphj.png)

## Core Idea

Drug Checker AI combines verified local interaction data, RxNav drug search, local Nigerian/common medicine aliases, and AI explanations.

The key design rule is simple:

```text
AI explains verified interaction data.
AI does not invent medical interaction data.
```

If no known interaction exists in the verified dataset, the app does not claim the combination is safe. It shows `No known interaction found` with a visible safety note and advises professional confirmation.

## Main Features

- User registration and login
- HTTP-only cookie authentication with access and refresh tokens
- Medication search by generic name or brand name
- Local Nigerian/common medicine alias support
- RxNav integration for standardized drug concepts
- Camera label scan with OCR-assisted matching
- Free browser OCR fallback using Tesseract.js on the frontend
- Barcode scan with best-effort lookup
- Manual drug-name fallback when scan/barcode misses
- Interaction checking for 2 to 5 medications
- Automatic generation of every possible drug pair
- Duplicate therapy warnings
- Severity summary: `LOW`, `MODERATE`, `HIGH`
- AI explanation and AI safety summary
- Interaction history
- Clinical report generation from saved history
- Knowledge-base statistics for medication, alias, interaction, and source coverage
- CSV, JSON, and Excel import pipeline for verified interaction datasets
- Report list, report detail, update, and delete
- Admin interaction management
- Responsive healthcare-focused frontend UI

## Why This Project Matters

Medication safety is especially important for people managing chronic conditions, older adults, and patients taking medicines from multiple sources. In many local contexts, drug packaging can include brand names that are not easy to find in US-focused public APIs.

Drug Checker AI improves the user workflow by supporting both:

- standardized drug names, such as `ibuprofen`, `aspirin`, `warfarin`
- common/local product names, such as `Inbu-400`, `Artequick`, `Acycor Plus`, `P-Alaxin`, `TLD`, `RHZE`

For the most reliable result, the user should type the generic active ingredient printed on the medication pack.

## Tech Stack

### Backend

- Node.js
- Express.js
- TypeScript
- MySQL
- Sequelize ORM
- JWT authentication
- bcrypt/bcryptjs
- cookie-parser
- express-validator
- axios
- RxNav API
- Google Gemini API
- Optional Google Cloud Vision OCR
- pdfkit
- xlsx import support

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React icons
- Sonner toast notifications
- Tesseract.js for free OCR fallback
- Browser BarcodeDetector API where supported

## Repository Layout

This workspace is a synchronized monorepo with frontend and backend projects:

```text
drug-checker-ai/
  backend/
    README.md
    package.json
    src/
      config/
      constants/
      controllers/
      database/
      middlewares/
      routes/
      schemas/
      services/
      types/
      utils/
      validations/

  frontend/
    README.md
    package.json
    src/
      app/
      lib/
      public/
```

## System Architecture

```text
User
  |
  v
Next.js Frontend
  - Auth screens
  - Dashboard
  - Search
  - Camera scan
  - Barcode scan
  - History
  - Reports
  |
  v
Express + TypeScript Backend
  - Auth controllers/services
  - Drug search service
  - Interaction service
  - History service
  - Report service
  - Gemini service
  - RxNav service
  |
  v
MySQL + Sequelize
  - users
  - drug_interactions
  - interaction_histories
  - reports
  - medications
```

## How Interaction Checking Works

1. The user selects 2 to 5 medications.
2. The backend generates every possible pair.
3. Each pair is matched against the local verified interaction database.
4. Matching works in both directions:
   - `Ibuprofen + Aspirin`
   - `Aspirin + Ibuprofen`
5. RxNav ingredient resolution helps product RXCUIs match generic ingredient rows.
6. Duplicate therapy is checked separately.
7. Gemini is called only to explain verified findings.
8. If the user is logged in, the result is saved to history.

Example:

```text
4 selected drugs = 6 pair checks

A + B
A + C
A + D
B + C
B + D
C + D
```

## AI Safety Rule

Gemini is used for:

- plain-language interaction explanation
- overall safety summary
- explaining verified interaction rows

Gemini is not used as the source of drug interaction facts.

The verified source remains the local `drug_interactions` table.

## Camera and Barcode Limitations

Camera scan and barcode scan are included to make the experience faster, but they are best-effort helpers.

Camera OCR may fail because of:

- blurry images
- glare
- low light
- stylized medicine packaging
- handwriting on the pack
- cropped labels
- local brands not available in public medicine APIs

Barcode lookup may fail because:

- many Nigerian/local medication barcodes are not indexed in public drug databases
- OpenFDA and RxNorm are US-focused
- a barcode can identify a package without revealing a medication name

The app therefore tells users to type the generic active ingredient for the best result.

Good manual search examples:

```text
ibuprofen
aspirin
warfarin
paracetamol
artemisinin
piperaquine
amoxicillin
metformin
lisinopril
```

## Demo Combinations

Useful combinations for judges:

```text
Ibuprofen + Aspirin
Result: MODERATE

Aspirin + Warfarin
Result: HIGH

Lisinopril + Potassium Supplement
Result: HIGH

Simvastatin + Clarithromycin
Result: HIGH

Ciprofloxacin + Tizanidine
Result: HIGH
```

Useful search/scan examples:

```text
Inbu-400 -> Ibuprofen
Artequick -> Artemisinin + Piperaquine
Acycor Plus -> Aceclofenac + Paracetamol
P-Alaxin -> Dihydroartemisinin + Piperaquine
TLD -> Tenofovir + Lamivudine + Dolutegravir
RHZE -> Rifampicin + Isoniazid + Pyrazinamide + Ethambutol
```

## Backend Setup

Move into the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create `.env`:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure:

```env
PORT=5000
CLIENT_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=drug_checker_ai
DB_USER=root
DB_PASSWORD=

JWT_ACCESS_SECRET=change_me_access_secret
JWT_REFRESH_SECRET=change_me_refresh_secret

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

GOOGLE_CLOUD_VISION_API_KEY=
RXNAV_BASE_URL=https://rxnav.nlm.nih.gov/REST

AUTO_SEED_INTERACTIONS=true
AUTO_SEED_MEDICATIONS=true
ADMIN_EMAILS=admin@example.com
REPORT_STORAGE_DIR=storage/reports
```

Start MySQL, then run:

```bash
npm run dev
```

On Windows PowerShell:

```powershell
npm.cmd run dev
```

Build:

```bash
npm run build
```

Start compiled backend:

```bash
npm start
```

## Frontend Setup

Move into the frontend folder:

```bash
cd ../frontend
```

Install dependencies:

```bash
npm install
```

Create frontend `.env` if needed:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## API Base URL

The backend mounts routes under:

```text
http://localhost:5000/api/v1
```

The frontend uses rewrites, so frontend requests look like:

```text
/users/login
/drugs/search
/interactions/check
/history
/reports
```

and are forwarded to:

```text
http://localhost:5000/api/v1
```

## Authentication

Authentication uses HTTP-only cookies:

- `accessToken`
- `refreshToken`

Login, register, and refresh set cookies automatically.

Protected routes read the cookie first and also support `Authorization: Bearer <token>` for API testing.

### Register

```http
POST /api/v1/users/register
```

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!"
}
```

### Login

```http
POST /api/v1/users/login
```

```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```

### Refresh Token

```http
POST /api/v1/users/refresh-token
```

### Logout

```http
POST /api/v1/users/logout
```

### Profile

```http
GET /api/v1/users/profile
```

## Drug APIs

### Search Drugs

```http
GET /api/v1/drugs/search?q=ibuprofen
```

### Get Drug Details

```http
GET /api/v1/drugs/:rxcui
```

Example:

```http
GET /api/v1/drugs/5640
```

### Scan Medication Label

```http
POST /api/v1/drugs/scan
```

```json
{
  "image": "<base64-image-without-data-url-prefix>",
  "mimeType": "image/jpeg"
}
```

### Barcode Lookup

```http
POST /api/v1/drugs/barcode
```

```json
{
  "barcodeValue": "8901296050545",
  "format": "ean_13"
}
```

Barcode lookup tries:

- OpenFDA NDC lookup
- RxNav NDC lookup
- UPCitemdb product lookup
- Gemini fallback

If all fail, the frontend lets the user type the generic name manually.

## Interaction API

```http
POST /api/v1/interactions/check
```

Request:

```json
{
  "drugs": [
    {
      "rxcui": "5640",
      "name": "Ibuprofen"
    },
    {
      "rxcui": "1191",
      "name": "Aspirin"
    }
  ]
}
```

Rules:

- minimum 2 drugs
- maximum 5 drugs
- each drug requires `rxcui` and `name`
- all possible pairs are checked
- verified interactions are returned
- unverified pair count is summarized
- logged-in checks are saved to history

Response includes:

- `hasInteraction`
- `status`: `INTERACTION_FOUND` or `NO_KNOWN_INTERACTION`
- `title`
- `message`
- `safetyNote`
- `checkedDrugs`
- `checkedPairs`
- `sourceCoverage`
- `checkedAt`
- `selectedDrugs`
- `duplicateTherapies`
- `safetySummary`
- `aiSummary`
- `interactions`
- `historySaved`
- `historyId`

When no known interaction is found, the backend returns `NO_KNOWN_INTERACTION` with the title `No known interaction found` and a safety note. The app must not claim that medication combinations are completely safe.

## History APIs

All history routes are protected.

```http
POST   /api/v1/history
GET    /api/v1/history
GET    /api/v1/history/:id
DELETE /api/v1/history/:id
```

Users can only access their own history.

## Knowledge Base APIs

```http
GET /api/v1/drugs/knowledge-base/stats
```

Returns:

- `version`
- `totalMedications`
- `totalAliases`
- `totalInteractionRecords`
- `lastUpdated`
- `sourceDatasets`

The frontend dashboard displays these statistics to make dataset coverage transparent.

## Report APIs

All report routes are protected.

```http
POST   /api/v1/reports/generate
GET    /api/v1/reports
GET    /api/v1/reports/:id
GET    /api/v1/reports/:id/download?format=pdf
GET    /api/v1/reports/:id/download?format=xml
PATCH  /api/v1/reports/:id
DELETE /api/v1/reports/:id
```

Preferred report flow:

1. Run an interaction check while logged in.
2. Use the returned `historyId`.
3. Generate a report from the history item.

Example:

```json
{
  "interactionCheckId": 12,
  "preferredFormat": "pdf",
  "title": "Medication Safety Report",
  "notes": "Review with pharmacist before combining."
}
```

PDF generation is handled by the backend with `pdfkit`. XML export is available from the download endpoint. Report metadata is stored in MySQL, and downloads are ownership-protected.

## Knowledge Base Imports

Use the backend import pipeline for future verified datasets:

```bash
cd backend
npm run import:kb -- --file=./data/your-approved-ddi-dataset.csv --dataset="DDInter 2.0" --source="https://ddinter2.scbdd.com/" --license="Verify dataset terms before redistribution" --version="2024-05-14"
```

Supported file types:

- CSV
- JSON
- Excel `.xlsx`

The importer normalizes medications, aliases, pair ordering, severity, evidence source, and dataset metadata. Failed rows are logged under `backend/storage/imports`.

To test the importer without a real dataset:

```bash
cd backend
npm run import:kb -- --file=./data/ddi-import-template.csv --dataset="Local Template" --source="Local template" --license="Internal test" --dry-run
```

Dataset research and licensing notes:

```text
backend/docs/knowledge-base-datasets.md
```

## Admin APIs

Admin routes require authentication and an email listed in `ADMIN_EMAILS`.

```http
POST   /api/v1/admin/interactions
GET    /api/v1/admin/interactions
GET    /api/v1/admin/interactions/:id
PUT    /api/v1/admin/interactions/:id
DELETE /api/v1/admin/interactions/:id
```

Admins can create and manage verified interaction rows.

## Database Models

### User

- `id`
- `name`
- `email`
- `password`
- `refreshToken`
- `refreshTokenExpiresAt`
- `createdAt`
- `updatedAt`

### DrugInteraction

- `id`
- `drugAName`
- `drugBName`
- `drugARxcui`
- `drugBRxcui`
- `severity`
- `effect`
- `recommendation`
- `source`
- `evidenceSource`
- `sourceDataset`
- `createdAt`
- `updatedAt`

### InteractionHistory

- `id`
- `userId`
- `selectedDrugs`
- `results`
- `createdAt`
- `updatedAt`

### Report

- `id`
- `userId`
- `title`
- `reportReference`
- `format`
- `selectedDrugs`
- `interactionResults`
- `checkedPairs`
- `overallStatus`
- `severitySummary`
- `status`
- `notes`
- `fileName`
- `filePath`
- `storageUrl`
- `mimeType`
- `generatedAt`
- `createdAt`
- `updatedAt`

### Medication

- `id`
- `rxcui`
- `genericName`
- `aliases`
- `category`
- `createdAt`
- `updatedAt`

### MedicationAlias

- `id`
- `medicationId`
- `alias`
- `normalizedAlias`
- `country`
- `source`
- `createdAt`
- `updatedAt`

### KnowledgeBaseDataset

- `id`
- `name`
- `source`
- `license`
- `version`
- `recordCount`
- `importedAt`
- `createdAt`
- `updatedAt`

## Seed Data

The backend seeds verified interaction rows such as:

- Ibuprofen + Aspirin
- Warfarin + Aspirin
- Metformin + Alcohol
- Lisinopril + Potassium Supplement
- Simvastatin + Clarithromycin
- Amoxicillin + Methotrexate
- Ciprofloxacin + Tizanidine

The backend also seeds and patches medication aliases for common generic names and local brands.

To disable auto-seeding:

```env
AUTO_SEED_INTERACTIONS=false
AUTO_SEED_MEDICATIONS=false
```

## Response Format

Most backend responses follow this shape:

```json
{
  "message": "Request completed successfully",
  "success": true,
  "statusCode": 200,
  "data": {}
}
```

## Development Notes

- The backend uses the existing controller-service-route-validation structure.
- Sequelize `sync()` runs on startup.
- `schemaPatches` ensures newer report columns exist.
- Interaction checks are intentionally compact in response size.
- History and reports are protected by JWT middleware.
- Frontend requests use `credentials: "include"` for cookie auth.
- Camera and barcode are intentionally labelled as best-effort in the UI.

## Team

- Quadri Kobiowu - Backend and AI Engineer
- Heritage Bolanle - Frontend Developer
- Seyifunmi - Project Manager

## Final Submission Notes

Drug Checker AI is built to demonstrate a realistic medication safety workflow:

1. Search or scan medication.
2. Add 2 to 5 drugs.
3. Check verified interactions.
4. Read an AI explanation.
5. Save history.
6. Generate a clinical report.

The strongest demo path is to type generic names manually, then show camera/barcode as helpful but honest best-effort features.
