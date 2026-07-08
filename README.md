# 🚀 GrowEasy CSV Importer

An AI-powered CSV importer that intelligently extracts CRM lead information from any CSV format. Upload CSVs from Facebook Ads, Google Ads, Excel, real estate CRMs, sales reports, or manually created spreadsheets — the AI maps arbitrary columns into the GrowEasy CRM format.

## ✨ Features

- **AI-Powered Extraction**: Uses Llama 3.3 70B (via Groq) to intelligently map any column names to CRM fields
- **Universal CSV Support**: Works with Facebook Lead exports, Google Ads, Excel sheets, CRM exports, and more
- **Drag & Drop Upload**: Beautiful upload experience with drag & drop and file picker
- **CSV Preview**: Scrollable table with sticky headers showing your data before processing
- **Batch Processing**: Records processed in configurable batches with retry logic
- **Status Mapping**: AI maps arbitrary status values to allowed CRM statuses
- **Smart Field Merging**: Combines First/Last names, splits phone country codes, merges extra contacts into notes
- **Download Results**: Export processed CRM records as CSV
- **Dark Mode UI**: Premium dark theme with glassmorphism and smooth animations
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Rate Limiting**: API rate limiting to prevent abuse

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Vanilla CSS |
| Backend | Node.js, Express, TypeScript |
| AI | Llama 3.3 70B via Groq API |
| CSV Parsing | PapaParse (client), csv-parse (server) |
| Validation | Zod |
| Containerization | Docker + Docker Compose |

## 📂 Project Structure

```
groweasy/
├── backend/
│   ├── src/
│   │   ├── server.ts                 # Express app entry point
│   │   ├── routes/
│   │   │   └── import.route.ts       # POST /api/import endpoint
│   │   ├── services/
│   │   │   ├── csv.service.ts        # CSV parsing with auto-delimiter
│   │   │   └── ai.service.ts         # Groq/Llama 3.3 extraction pipeline
│   │   ├── prompts/
│   │   │   └── crm-extraction.prompt.ts  # AI prompt engineering
│   │   ├── types/
│   │   │   └── crm.types.ts          # TypeScript interfaces
│   │   ├── middleware/
│   │   │   └── error.middleware.ts    # Global error handler
│   │   └── utils/
│   │       ├── batch.utils.ts        # Batch processing + retry logic
│   │       └── validate.utils.ts     # Zod schemas + sanitization
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Main wizard page
│   │   │   ├── layout.tsx            # Root layout
│   │   │   └── globals.css           # Design system
│   │   ├── components/steps/
│   │   │   ├── UploadStep.tsx        # Drag & drop upload
│   │   │   ├── PreviewStep.tsx       # CSV preview table
│   │   │   ├── ProcessingStep.tsx    # AI processing indicator
│   │   │   └── ResultsStep.tsx       # Results + download
│   │   └── lib/
│   │       ├── api.ts                # API client
│   │       └── types.ts              # Shared types
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm
- A [Groq API key](https://console.groq.com/) (free tier available)

### 1. Clone & Setup

```bash
git clone <repo-url>
cd groweasy
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
npm install
npm run dev
```

The backend will start at `http://localhost:3001`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:3000`.

### 4. Open the App

Navigate to [http://localhost:3000](http://localhost:3000) and start importing CSVs!

## 🐳 Docker Setup

```bash
# Set your Groq API key
export GROQ_API_KEY=your_key_here

# Build and run
docker-compose up --build
```

Frontend: http://localhost:3000
Backend: http://localhost:3001

## 🧠 AI Prompt Engineering

The core of this application is the AI prompt that maps arbitrary CSV columns to CRM fields. Key techniques used:

1. **Semantic Synonym Lists**: For each CRM field, the prompt lists dozens of common column name variants (e.g., `mobile` → "Phone", "Cell", "WhatsApp", "Contact Number")
2. **Status Mapping Rules**: Incoming statuses like "Interested", "Hot Lead", "Not Reachable" are mapped to the 4 allowed CRM statuses
3. **Data Source Constraints**: Only the 5 allowed data source values are used; unmatched sources go to `crm_note`
4. **Multi-Value Handling**: First email/phone → primary field, extras → `crm_note`
5. **Name Merging**: "First Name" + "Last Name" → combined "name"
6. **Skip Logic**: Records without email or mobile are skipped with a reason

## 📡 API Reference

### `GET /api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "model": "llama-3.3-70b-versatile",
  "provider": "groq"
}
```

### `POST /api/import`

Upload and process a CSV file.

**Request:** `multipart/form-data` with `file` field (CSV, max 10MB)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": { "total": 100, "imported": 94, "skipped": 6, "batches": 4 },
    "records": [ { "name": "John Doe", "email": "john@example.com", ... } ],
    "skipped": [ { "row": 5, "reason": "No email or mobile", "raw": {...} } ]
  }
}
```

## 🎯 CRM Fields Extracted

| Field | Description |
|-------|-------------|
| created_at | Lead creation date |
| name | Full name |
| email | Primary email |
| country_code | Phone country code |
| mobile_without_country_code | Mobile number |
| company | Company name |
| city | City |
| state | State/Province |
| country | Country |
| lead_owner | Assigned lead owner |
| crm_status | GOOD_LEAD_FOLLOW_UP / DID_NOT_CONNECT / BAD_LEAD / SALE_DONE |
| crm_note | Notes, extra contacts, remarks |
| data_source | leads_on_demand / meridian_tower / eden_park / varah_swamy / sarjapur_plots |
| possession_time | Property possession timeline |
| description | Additional description |

## 📋 Environment Variables

### Backend (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| GROQ_API_KEY | — | Your Groq API key (required) |
| PORT | 3001 | Backend port |
| ALLOWED_ORIGIN | http://localhost:3000 | CORS origin |
| BATCH_SIZE | 25 | Records per AI batch |
| MAX_CONCURRENT_BATCHES | 3 | Parallel batch processing |

### Frontend (`.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| NEXT_PUBLIC_API_URL | http://localhost:3001 | Backend API URL |

## 📄 License

# groweasy
