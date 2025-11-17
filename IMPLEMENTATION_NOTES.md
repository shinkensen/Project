# PDF Processing & AI Rate Limiting Setup

## 📋 Implementation Summary

This update adds automatic PDF parsing, AI summarization, and per-user rate limiting to IntelliNotes.

### ✅ Features Added

1. **Automatic PDF Processing Pipeline**
   - Extracts text from PDFs using `pdfjs-dist` (first 10 pages, max 5000 chars)
   - Summarizes content via Hugging Face Inference API (`facebook/bart-large-cnn`)
   - Stores summaries in Supabase for context-aware chat

2. **Context-Aware AI Chat**
   - Injects user's note summaries (max 500 chars) into Gemini prompts
   - Reduces redundancy by referencing stored summaries instead of raw PDFs
   - Maintains token efficiency

3. **Per-User Rate Limiting**
   - **Daily Limits:** 50 prompts/day per user
   - Tracks usage in `user_ai_limits` table
   - Auto-resets daily
   - Returns 429 status when exceeded

4. **Frontend Quota Display**
   - Shows remaining prompts in chat UI
   - Warning colors when quota is low
   - Clear error messages on limit

---

## 🛠️ Required Setup Steps

### 1. Install New Dependencies

```bash
cd backend
yarn add @huggingface/inference pdfjs-dist
```

### 2. Create Supabase Tables

Run the SQL in `backend/supabase-tables.sql` in your Supabase SQL Editor:

```sql
-- Creates note_summaries and user_ai_limits tables
-- Includes indexes and auto-update triggers
```

### 3. Set Environment Variables

Add to your Render environment (or `.env` locally):

```bash
HF_TOKEN=your_huggingface_token_here
```

Get a free token at: https://huggingface.co/settings/tokens

---

## 📊 Database Schema

### `note_summaries` Table
```
pdf_url (TEXT, PRIMARY KEY)  - Public URL of uploaded PDF
summary (TEXT)                - AI-generated summary
user_id (TEXT)                - User who uploaded
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### `user_ai_limits` Table
```
user_id (TEXT, PRIMARY KEY)   - User UUID
daily_prompt_count (INT)      - Prompts today
last_reset_date (DATE)        - Last reset date
total_tokens_used (INT)       - Total token count
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

---

## 🔄 How It Works

### Upload Flow
1. User uploads PDF → `/upload-notes`
2. Backend stores file in Supabase Storage
3. **PDF parsing:** Extract text (pdfjs)
4. **Summarization:** Call HF Inference API
5. **Storage:** Save summary to `note_summaries`
6. Return success response

### Chat Flow
1. User sends prompt → `/chat`
2. **Rate limit check:** Query `user_ai_limits`
3. If allowed:
   - Fetch user's note summaries
   - Append summaries to prompt (context injection)
   - Call Gemini API
   - Update prompt count
   - Return response + remaining quota
4. If exceeded:
   - Return 429 error with reset time

---

## 🚀 Deployment Checklist

- [ ] Run SQL schema in Supabase
- [ ] Add `HF_TOKEN` to Render environment
- [ ] Deploy updated backend
- [ ] Test PDF upload (check Supabase `note_summaries` table)
- [ ] Test chat rate limiting (send 51 prompts)
- [ ] Verify quota display in frontend

---

## 🔧 Configuration

### Adjusting Limits

In `backend/backend.js`:

```javascript
const DAILY_PROMPT_LIMIT = 50;        // Prompts per day
const DAILY_TOKEN_LIMIT = 10000;      // Reserved for future use
const MAX_SUMMARY_LENGTH = 150;       // Max summary chars
```

### Character Limit

In `chatbot.js` and `backend.js`:

```javascript
const MAX_MESSAGE_LENGTH = 250;       // Max prompt length
const MAX_PROMPT_LENGTH = 250;        // Backend validation
```

---

## 📦 New Files

- `backend/supabase-tables.sql` - Database schema
- Updated: `backend/package.json` - New dependencies
- Updated: `backend/backend.js` - PDF processing + rate limiting
- Updated: `chatbot.js` - Quota display + 429 handling
- Updated: `chatbot.html` - Quota UI element
- Updated: `style.css` - Quota styling

---

## 🐛 Troubleshooting

**PDF parsing fails:**
- Check file MIME type is `application/pdf`
- Verify `pdfjs-dist` installed correctly
- Check Supabase Storage permissions

**Summarization errors:**
- Confirm `HF_TOKEN` is set and valid
- Check HF Inference API rate limits (free tier)
- Review extracted text length (must be >100 chars)

**Rate limit not working:**
- Verify `user_ai_limits` table exists
- Check `userId` is passed in `/chat` requests
- Confirm date comparison logic (timezone issues)

**Context not injecting:**
- Verify summaries exist in `note_summaries`
- Check `user_id` matches upload + chat
- Review `getUserContext()` query

---

## 💡 Future Enhancements

- Token-based limits (estimate via prompt length)
- Premium tiers (adjust limits per subscription)
- Summary caching/regeneration triggers
- Multi-language summarization
- Batch PDF processing queue
