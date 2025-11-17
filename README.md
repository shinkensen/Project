# IntelliNotes - Smart Notes & AI Q&A Platform

Student Hackpad Hackathon 2025 submission

## Overview
IntelliNotes lets students upload study notes, generates automatic summaries, and feeds concise context into a Gemini-powered chatbot. A lightweight rate-limit system protects usage while keeping latency low.

## Features
- 📤 **Secure Note Uploads**: Files go straight into Supabase storage
- 🧠 **Auto Summaries**: PDFs are parsed with `pdfjs-dist`, summarized via Hugging Face Inference (DistilBART), and cached in `note_summaries`
- 💬 **Context-Aware Chat**: Gemini 2.5 Flash Lite receives only the most relevant summaries (≤3 snippets / 700 chars) to minimize tokens
- 🚦 **Per-User Rate Limits**: Daily cap (default 20 prompts) tracked in Supabase `user_ai_limits`
- 🎨 **Modern UI**: Dark theme, responsive layout, typing indicators, and character counter
- 🔒 **Frontend Guardrails**: 250-character max prompts, disabled send button once limit hit, quota status display

## Getting Started

### 1. Install dependencies
```powershell
cd backend
npm install
```

### 2. Configure environment variables

| Variable | Description |
| --- | --- |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Google service account JSON string for Gemini access |
| `GEMINI_API_KEY` | Vertex/Gemini API key |
| `HF_TOKEN` | Hugging Face Inference token (fine-grained) |

### 3. Create Supabase tables
Run `backend/supabase-tables.sql` in the Supabase SQL editor to provision `note_summaries` and `user_ai_limits`.

### 4. Start backend
```powershell
cd backend
npm run start
```
Backend listens on `http://localhost:5000` by default.

### 5. Serve frontend
Use any static server from the project root:
```powershell
npx http-server -p 8000
# or
python -m http.server 8000
```
Visit `http://localhost:8000/chatbot.html`.

## How to Use
1. **Upload Notes**: Click the upload area or drag & drop your study notes
2. **Auto Summaries**: Backend extracts + summarizes PDFs and stores results
3. **Ask Questions**: Type up to 250 characters; counter and quota appear under the input
4. **Get Answers**: Gemini replies with context trimmed to only relevant summaries

## Technical Stack
- **Frontend**: HTML/CSS/JS (vanilla)
- **Backend**: Node.js + Express
- **Storage/DB**: Supabase (file bucket + PostgreSQL)
- **AI APIs**: Hugging Face Inference (DistilBART summaries) + Google Gemini 2.5 Flash Lite
- **PDF Parsing**: `pdfjs-dist`

## Project Structure
```
Project-1/
├── index.html      # Main HTML structure
├── style.css       # Styling and animations
├── script.js       # Landing interactions
├── chatbot.html    # Chat UI
├── chatbot.js      # Chat logic + quota UI
├── backend/        # Express server, summarization, Supabase interactions
└── README.md       # Documentation
```

## Future Enhancements
- Semantic search / embeddings for better context selection
- Support for DOCX/TXT parsing pipeline
- Conversation export and note highlighting
- OAuth-based authentication and multi-tenant throttling
- Scheduled summary regeneration when notes change

## Notes
Production deploy (Render) already runs the full pipeline. For local dev, ensure:
- Supabase keys/bucket match the deployed instance or your own project
- `HF_TOKEN` has `Make calls to Inference Providers` permission
- Gemini project has access to `gemini-2.5-flash-lite`
- Rate limiting limits can be tweaked via `DAILY_PROMPT_LIMIT` in `backend.js`

---
Built with ❤️ for Student Hackpad Hackathon 2025