# JobShield AI

> Built with **Claude Opus 4.6** (GitHub Copilot)

> AI-powered fake job posting detector with **RLHF-style feedback learning** — runs **100% locally** via Ollama. No data ever leaves your machine.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Model Specifications](#model-specifications)
- [Prerequisites](#prerequisites)
- [Setup (Step-by-Step)](#setup-step-by-step)
- [API Endpoints](#api-endpoints)
- [Features](#features)
- [RLHF Feedback System](#rlhf-feedback-system)
- [Environment Variables](#environment-variables-optional)
- [Limitations](#limitations)
- [License](#license)

---

## How It Works

1. **You paste** a job description, **upload a PDF**, or **upload a screenshot**.
2. **A local LLM** (running on your machine via Ollama) analyses it for fraud signals.
3. **You get** a fraud score (0–100), risk level, reasons, and highlighted suspicious phrases.
4. **If the result is wrong**, you correct the AI — your feedback is saved and used to improve **all future predictions across every model** instantly.

---

## Architecture

```
ghost_job/
├── backend/              FastAPI (Python 3.11+)
│   ├── main.py           App entry point + CORS + lifespan
│   ├── config.py         Settings (Ollama URL, model, timeouts)
│   ├── api/
│   │   └── routes.py     /analyze, /feedback, /models, /health
│   ├── services/
│   │   ├── llm_service.py       LLM prompt + Ollama communication
│   │   ├── feedback_service.py  RLHF feedback store + pattern learning
│   │   ├── ocr_service.py       Image OCR text extraction (Tesseract)
│   │   ├── pdf_service.py       PDF text extraction (PyMuPDF)
│   │   └── text_service.py      Text cleaning + validation
│   ├── models/
│   │   └── schemas.py    Pydantic request/response models
│   ├── utils/
│   │   └── json_parser.py  Robust LLM JSON extraction
│   ├── data/
│   │   ├── feedback_store.json    User corrections (few-shot examples)
│   │   └── learned_patterns.json  Extracted fraud/legit patterns
│   └── requirements.txt
│
├── frontend/             Next.js 14 + TypeScript + Tailwind CSS
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              Landing page
│   │   └── dashboard/page.tsx    Main dashboard
│   ├── components/
│   │   ├── FileUpload.tsx        Drag & drop PDF upload
│   │   ├── ImageUpload.tsx       Screenshot / image OCR upload
│   │   ├── TextInput.tsx         Text paste input
│   │   ├── ModelSelector.tsx     Ollama model picker
│   │   ├── RiskMeter.tsx         Animated circular score gauge
│   │   ├── ResultPanel.tsx       Analysis results display
│   │   ├── FeedbackPanel.tsx     RLHF feedback UI (teach the AI)
│   │   ├── SuspiciousHighlight.tsx  Phrase highlighting
│   │   ├── ThemeToggle.tsx       Dark/light mode toggle
│   │   └── Loader.tsx            Loading animation
│   ├── lib/api.ts        API client functions
│   ├── styles/globals.css
│   └── tailwind.config.ts
│
└── README.md
```

---

## Model Specifications

| Property | Details |
|----------|---------|
| **Default model** | `qwen3.5:4b` (fast, ~3–5s per analysis) |
| **Supported models** | Any Ollama model (Mistral 7B, Llama 3.2, Qwen, Phi, etc.) |
| **Model selection** | User picks from a dropdown — all locally installed Ollama models are listed |
| **Temperature** | 0.2 (low randomness for consistent structured output) |
| **Max tokens** | 512 output, 8192 context window |
| **Input limit** | 10,000 characters |
| **Output format** | Structured JSON: `fraud_score`, `risk_level`, `reasons[]`, `suspicious_phrases[]` |
| **Retry logic** | Retries once on malformed JSON; returns safe fallback on double failure |
| **Learning method** | Dynamic few-shot prompting from user's feedback (not weight updates) |

---

## Prerequisites

Before you start, make sure you have these installed:

| Tool | Version | What it does | Install link |
|------|---------|--------------|--------------|
| **Python** | 3.11 or higher | Runs the backend API server | [python.org/downloads](https://www.python.org/downloads/) |
| **Node.js** | 18 or higher | Runs the frontend web app | [nodejs.org](https://nodejs.org/) |
| **Ollama** | latest | Runs AI models locally on your machine | [ollama.com/download](https://ollama.com/download) |
| **Tesseract** | latest | OCR engine for image/screenshot uploads | `brew install tesseract` (macOS) |

### How to check if you already have them

Open a terminal and run:

```bash
python3 --version    # Should show Python 3.11+
node --version       # Should show v18+
ollama --version     # Should show ollama version X.X.X
tesseract --version  # Should show tesseract X.X.X
```

If any command says "not found", install that tool from the links above.

---

## Setup (Step-by-Step)

### Step 1: Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ghost_job.git
cd ghost_job
```

### Step 2: Install and start Ollama

**macOS (Homebrew):**
```bash
brew install ollama
```

**macOS / Linux (direct download):**
Download from [ollama.com/download](https://ollama.com/download) and follow the installer.

**Start the Ollama server** (keep this terminal open):
```bash
ollama serve
```

You should see something like `Listening on 127.0.0.1:11434`.

### Step 3: Download an AI model

Open a **new terminal** (keep `ollama serve` running in the first one):

```bash
# Recommended: fast and capable (~2.5 GB)
ollama pull qwen3.5:4b

# Optional: larger and more accurate (~4 GB)
ollama pull mistral

# Optional: Meta's Llama (~2 GB)
ollama pull llama3.2:3b
```

> **Tip:** You can install multiple models and switch between them in the app.

Verify a model is downloaded:
```bash
curl http://localhost:11434/api/tags
```

You should see a JSON response listing your models.

### Step 4: Set up the backend

Open a **new terminal**:

```bash
# Navigate to the backend folder
cd backend

# Create a Python virtual environment (isolates dependencies)
python3 -m venv venv

# Activate the virtual environment
# macOS / Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Preloading model qwen3.5:4b…
```

**Verify it's working:** Open http://localhost:8000/docs in your browser — you should see the Swagger API docs.

### Step 5: Set up the frontend

Open a **new terminal**:

```bash
# Navigate to the frontend folder
cd frontend

# Install JavaScript dependencies
npm install

# Start the development server
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

### Step 6: Use the app

Open **http://localhost:3000** in your browser. That's it!

1. Click **"Get Started"** on the landing page
2. **Select a model** from the dropdown (top of the dashboard)
3. **Paste a job description**, **upload a PDF**, or **upload a screenshot/image**
4. Click **"Analyse Text"** and wait for results
5. If the analysis is wrong, click **"Not Accurate — Teach AI"** to correct it

### Summary: Terminals you need running

| Terminal | Command | Purpose |
|----------|---------|---------|
| 1 | `ollama serve` | AI model server |
| 2 | `cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000` | API server |
| 3 | `cd frontend && npm run dev` | Web app |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check + model info |
| `GET` | `/api/models` | List locally available Ollama models with avg response times |
| `POST` | `/api/analyze` | Analyse a job posting (PDF, image, text, or combination) |
| `POST` | `/api/feedback` | Submit user correction (RLHF-style feedback) |
| `GET` | `/api/feedback/stats` | Get aggregated feedback statistics |

### POST `/api/analyze`

Accepts **multipart/form-data** with:
- `file` (optional) — PDF or image upload (PDF, PNG, JPEG, GIF, WebP, BMP, TIFF)
- `text` (optional) — plain-text job description
- `model` (optional) — Ollama model name to use

At least `file` or `text` must be provided. Images are processed via Tesseract OCR server-side.

```bash
# Text only
curl -X POST http://localhost:8000/api/analyze \
  -F 'text=Hiring immediately! No experience needed. Earn $5000/week working from home. Send your bank details to get started.'

# PDF only
curl -X POST http://localhost:8000/api/analyze \
  -F 'file=@job_posting.pdf'

# With a specific model
curl -X POST http://localhost:8000/api/analyze \
  -F 'text=Some job posting...' \
  -F 'model=mistral'
```

### Response Shape

```json
{
  "success": true,
  "data": {
    "fraud_score": 85,
    "risk_level": "High",
    "reasons": [
      "Unrealistic salary promises",
      "No experience required for high pay",
      "Request for bank details upfront",
      "Pressure tactics with urgency",
      "Vague job description"
    ],
    "suspicious_phrases": [
      "Earn $5000/week",
      "Send your bank details",
      "once in a lifetime opportunity"
    ]
  },
  "error": null
}
```

### POST `/api/feedback`

Submit a correction when the model gets it wrong:

```bash
curl -X POST http://localhost:8000/api/feedback \
  -H 'Content-Type: application/json' \
  -d '{
    "job_text": "The original job posting text...",
    "model_used": "qwen3.5:4b",
    "original_score": 85,
    "original_risk": "High",
    "original_reasons": ["Unrealistic salary"],
    "corrected_score": 20,
    "corrected_risk": "Low",
    "is_fraud": false,
    "user_explanation": "This is a real Google job posting with standard compensation."
  }'
```

---

## Features

### Core Analysis
- **PDF Upload** — drag & drop or browse; text extracted via PyMuPDF
- **Image / Screenshot Upload** — drag & drop or browse; text extracted via Tesseract OCR
- **Text Paste** — paste any job description directly
- **Model Selection** — pick from any locally installed Ollama model
- **Local LLM** — zero data ever leaves your machine
- **Structured Output** — fraud score (0–100), risk level, reasons, suspicious phrases
- **Retry Logic** — retries LLM call once on malformed JSON; safe fallback on double failure

### RLHF Feedback System
- **Teach the AI** — correct wrong predictions with fraud/legit toggle, score slider, and explanation
- **Instant Learning** — feedback applies to ALL models immediately (not just the one that was wrong)
- **Pattern Extraction** — automatically builds a knowledge base of fraud and legitimate patterns
- **Few-Shot Retrieval** — only the most relevant past feedback is injected into prompts
- **Shared Learnings** — feedback files are committed to Git so everyone who clones the repo benefits

### UI / UX
- **Animated Risk Meter** — circular gauge with colour-coded score
- **Suspicious Phrase Highlighting** — flagged phrases highlighted in the original text
- **Dark / Light Mode** — system-aware with manual toggle
- **Glassmorphism UI** — premium design with Framer Motion animations
- **Responsive** — fully mobile-friendly
- **Toast Notifications** — clear error and success messages

---

## RLHF Feedback System

### How it works

```
User analyses a job posting
         ↓
Model returns a prediction
         ↓
User clicks "Not Accurate — Teach AI"
         ↓
User provides: is_fraud?, corrected_score, explanation
         ↓
Stored in backend/data/feedback_store.json
Patterns extracted → backend/data/learned_patterns.json
         ↓
Next analysis (ANY model) →
  feedback_service finds the most relevant past corrections
  + learned fraud/legit patterns
         ↓
Injected as few-shot examples into the LLM prompt
         ↓
Qwen, Mistral, Llama — ALL benefit instantly
```

### Important: This is NOT fine-tuning

The model weights are **not** updated. Instead, user corrections are injected into the prompt as context (dynamic few-shot learning). This means:

- Learning is **instant** (no training time)
- Works across **all models** (model-agnostic)
- Effective for **dozens to hundreds** of corrections
- Feedback files are portable and committable to Git

---

## Environment Variables (optional)

Create a `backend/.env` file to override defaults:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3.5:4b
OLLAMA_TIMEOUT=60
DEBUG=false
```

Frontend env (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Limitations

| Limitation | Details |
|------------|---------|
| **No real fine-tuning** | Model weights are never updated. Learning is via prompt injection only, which has a quality ceiling. |
| **Context window limit** | As feedback accumulates, only the top 3 most relevant examples + last 10 patterns are injected to avoid overloading the prompt. Older feedback may be eclipsed. |
| **Small model accuracy** | Smaller models (e.g. `qwen3.5:4b`) are fast but less accurate at nuanced fraud detection. Larger models (Mistral 7B, Llama 3.2) give better results but are slower. |
| **JSON parsing fragility** | Small models sometimes produce malformed JSON. The retry + fallback logic handles this, but you may occasionally see `fraud_score: 0` fallback results. |
| **Local only** | Requires Ollama running on the same machine. No cloud deployment without modifications. |
| **No user accounts** | Feedback is global — all corrections go into the same pool. No per-user isolation. |
| **PDF extraction** | Complex PDFs with tables, images, or scanned text may not extract cleanly. Best with text-based PDFs. |
| **Input size cap** | Job postings over 10,000 characters are rejected. Long postings may use more tokens and slightly slow inference. |
| **Similarity matching** | Feedback retrieval uses simple word-overlap (Jaccard similarity), not semantic embeddings. Unrelated feedback with overlapping common words could be retrieved. |
| **Single-machine storage** | Feedback is stored in local JSON files. No database, no sync between multiple users/machines (beyond Git). |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | FastAPI, Pydantic v2, httpx, PyMuPDF, pytesseract, Pillow |
| **LLM Runtime** | Ollama (local inference) |
| **Models** | Any Ollama-compatible model (Qwen, Mistral, Llama, Phi, etc.) |
| **AI Assistant** | Built with Claude Opus 4.6 via GitHub Copilot |

---

## License

MIT
