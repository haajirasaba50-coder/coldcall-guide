# CallCompass — Cold Call Guide

A live-call companion for an eight-stage cold-call structure. The caller can see the purpose of the current stage, likely prospect responses, tap what happened, capture the prospect's exact words, move forward, and close the call. A separate history screen shows saved calls and the stage each reached.

## Stack
- Frontend: React + Vite (deploy to Vercel)
- Backend: Node.js + Express (deploy to Render)
- Database: Supabase Postgres
- LLM: Groq's OpenAI-compatible chat-completions API (optional free developer key). It generates a concise, stage-aware response suggestion from the caller's notes. The app still works if no key is configured.

## Important research note
The assignment asks for decisions grounded in all 100 supplied call transcripts. This starter implementation includes the eight stages and the common patterns explicitly described in the assignment's structure page, but those 100 transcripts were not available to this build environment. Before submitting, read the provided ZIP and replace/validate the illustrative `likelySay` examples and stage patterns in `frontend/src/data/stages.js` against the transcripts. Do not claim the transcript review is complete until you have done it.

## Local setup

### 1. Supabase
1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Copy the project URL and service-role key from Project Settings → API. Keep the service-role key only in the backend environment; never put it in the Vite frontend.

### 2. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `GROQ_API_KEY`.
The API listens on `PORT` (default 10000).
Health check: `GET /health`.

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Set `VITE_API_BASE_URL=http://localhost:10000`.

## Deploy
### Render
- Create a **Web Service** from the GitHub repo.
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY` (optional), `FRONTEND_ORIGIN` (your Vercel URL), and `NODE_ENV=production`.
- Health endpoint: `https://YOUR-RENDER-SERVICE.onrender.com/health`

### Vercel
- Import the same GitHub repo.
- Root directory: `frontend`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com`

## API
- `GET /health` — backend status
- `POST /api/calls` — start a call
- `PATCH /api/calls/:id/stages/:stageNumber` — save what happened and the prospect's words for a stage
- `POST /api/calls/:id/close` — close a call and save outcome / next step
- `GET /api/calls` — list recent calls
- `GET /api/calls/:id` — retrieve one call and its stage records
- `POST /api/coach` — optional LLM stage-aware suggestion

## LLM use
The LLM is used only for an optional short coaching suggestion based on the current stage, selected event, and caller-entered prospect words. It does not decide or fabricate call outcomes. If no `GROQ_API_KEY` is set, the endpoint returns a helpful fallback. Obtain a free key at https://console.groq.com/keys and configure it as a Render secret.

## Before submitting
- [ ] Read all 100 transcripts and revise `frontend/src/data/stages.js` using evidence from them.
- [ ] Test start, save-stage, next-stage, early close, outcome, and history.
- [ ] Deploy Supabase, Render, and Vercel; replace placeholder URLs here.
- [ ] Create a public GitHub repository and push the project.
- [ ] Record a 6+ minute video with your camera visible. Walk through one actual transcript, explain one design decision in your own words, and upload it to Google Drive with “Anyone with the link” viewer access.
- [ ] Put the actual GitHub, Vercel, Render health, and Google Drive links in the submission message.

## Privacy and limitations
This is a demo product. Use fictional/demo prospect names in test calls. The Supabase service-role key must stay on the backend. The LLM prompt is constrained to suggestions, not factual claims or automated outcome logging.
# coldcall-guide
AI-Powered Real-Time Sales Call Assistant
