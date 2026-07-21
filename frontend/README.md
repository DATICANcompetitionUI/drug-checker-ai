# Drug Checker AI Frontend

Drug Checker AI is a modern healthcare web app for checking medication safety. The frontend provides a calm, light-mode dashboard where users can search medications, add 2 to 5 drugs, check verified interaction records, review AI explanations, save history, and generate clinical reports.

Website: https://bit.ly/drugcheckerai

This project was built for a hackathon demo. It is designed to be honest about scanning limits: camera OCR is a best-effort helper, barcode scan is marked as coming soon, and typing the generic active ingredient is the most reliable way to add a drug.

## Key Features

- Premium light-mode healthcare landing page
- Register, login, logout, refresh-token session handling
- HTTP-only cookie authentication support
- Medication dashboard with search, recent searches, popular drugs, and selected drug chips
- Drug interaction checking for 2 to 5 selected medications
- AI safety summary based on verified backend interaction data
- Camera label scan with free browser OCR fallback through `tesseract.js`
- Barcode scanner UI marked as coming soon
- Manual fallback search when camera scanning is not accurate
- Interaction history timeline
- Backend-generated PDF clinical reports from saved history
- Optional XML report export
- Knowledge-base coverage statistics on the dashboard
- Profile page and account actions
- Loading states, empty states, toast feedback, and responsive layouts

## Important Accuracy Note

Drug Checker AI is a safety assistant, not a doctor or pharmacist.

For the hackathon version:

- Camera scan can misread medicine packs, especially with glare, handwriting, stylized fonts, blurry images, or Nigerian/local brand names.
- Barcode lookup is not currently exposed in the UI; it is marked as coming soon.
- The safest app flow is to type the generic active ingredient printed on the pack, for example `ibuprofen`, `paracetamol`, `artemisinin`, `piperaquine`, `amoxicillin`, or `metformin`.
- AI is used only to explain interaction findings returned by the backend. It should not be treated as a source of new medical interaction data.
- When the backend returns `NO_KNOWN_INTERACTION`, the UI shows `No known interaction found`, the checked medications, the checked time, and the safety note. It does not claim a combination is completely safe.

Always confirm medication decisions with a qualified clinician or pharmacist.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React icons
- Sonner toasts
- Tesseract.js for free browser OCR fallback
- Backend API integration with credentials/cookies

## Project Structure

```text
src/
  app/
    (auth)/
    (dashboard)/
    api/
    components/
  lib/
    api.ts
    types.ts
```

Important components:

```text
src/app/components/dashboard/DrugChecker.tsx
src/app/components/dashboard/DrugScanner.tsx
src/app/components/dashboard/Sidebar.tsx
src/app/components/dashboard/DashboardHeader.tsx
src/lib/api.ts
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

On Windows PowerShell, if script execution blocks `npm.ps1`, use:

```powershell
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

## Backend Requirement

The frontend expects the backend to be running and reachable through the Next.js API rewrite/proxy setup.

Typical backend URL:

```text
http://localhost:5000
```

The backend exposes routes under:

```text
/api
/api/v1
```

Frontend API calls are defined in:

```text
src/lib/api.ts
```

All authenticated requests use:

```ts
credentials: "include"
```

This is required because the backend stores `accessToken` and `refreshToken` in HTTP-only cookies.

Create `.env` from the example when needed:

```bash
cp .env.example .env
```

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

`NEXT_PUBLIC_API_URL` is still accepted as a legacy alias, but new deployments should use `NEXT_PUBLIC_API_BASE_URL`.

For production, the Render backend URL is:

```env
NEXT_PUBLIC_API_BASE_URL=https://drugchecker-ai-backend.onrender.com/api/v1
```

The app keeps browser API calls same-origin and uses Next.js rewrites to proxy `/users`, `/drugs`, `/interactions`, `/history`, `/reports`, and `/admin` to the configured backend. This keeps authenticated cookie requests simpler on Vercel.

## Demo Workflow

1. Register or log in.
2. Go to the dashboard.
3. Search for medicines by generic name, for example:
   - `ibuprofen`
   - `aspirin`
   - `warfarin`
   - `metformin`
   - `lisinopril`
4. Add 2 to 5 medications.
5. Click `Check interactions`.
6. Review:
   - risk summary
   - verified interactions
   - AI explanation
   - saved history status
   - knowledge-base medication, alias, and interaction counts
7. Open History to view saved checks.
8. Generate a PDF clinical report from a saved history item.
9. Download PDF or export XML from the Clinical Reports page.

Good high-risk demo combination:

```text
Aspirin + Warfarin
```

Good moderate-risk demo combination:

```text
Ibuprofen + Aspirin
```

## Camera Scan Workflow

Camera scan is available from the dashboard search card.

It tries:

1. Backend image scan
2. Local product mapping
3. Free browser OCR fallback with `tesseract.js`
4. Manual search prefill when OCR reads partial text

For best results:

- keep the medicine name and active ingredient inside the frame
- avoid glare
- capture when the text is sharp
- type the generic name manually if the scan is wrong

Known scanner limitation examples:

- `Inbu-400` should resolve to `Ibuprofen`, but poor OCR may read only `Inbu`
- `Artequick` should resolve to `Artemisinin + Piperaquine`, but OCR can misread stylized lettering
- local brands may need dictionary aliases before they resolve perfectly

## Barcode Scan Status

Barcode scan is currently marked as coming soon in the dashboard UI.

For now, use Camera scan or type the generic active ingredient.

## Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

## Build Check

Run:

```bash
npm install
npm run lint
npm run build
```

## Production Deployment With Vercel CLI

The frontend can be deployed from the monorepo without GitHub import by using the Vercel CLI from the `frontend/` directory:

```bash
cd frontend
npm install
npm run build
npm install -g vercel
vercel login
vercel
vercel --prod
```

When Vercel builds the app, `next.config.ts` uses `NEXT_PUBLIC_API_BASE_URL` if it is configured. If it is not configured, Vercel builds default to:

```text
https://drugchecker-ai-backend.onrender.com/api/v1
```

Recommended Vercel environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://drugchecker-ai-backend.onrender.com/api/v1
```

No frontend database credentials or AI API keys are required.

## Submission Notes

Drug Checker AI focuses on verified interaction data and practical medication search. Camera scan is included as a best-effort helper, barcode is marked as coming soon, and the UI encourages typing the generic drug name for accuracy.
