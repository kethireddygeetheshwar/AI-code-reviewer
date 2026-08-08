# AI Code Reviewer · ReviewLens

A polished full-stack AI code-review workspace. Paste Python, JavaScript, Java, or C++ and receive bug findings, security guidance, complexity analysis, quality scoring, suggested code, and a follow-up reviewer chat.

## Features

- Premium responsive React UI with dark/light modes, glassmorphism, motion, and Monaco editor
- Groq by default, with OpenAI selection through environment variables
- Persistent SQLite review history and downloadable PDF reports
- Code quality scorecards, severity-labelled issues, security and complexity analysis
- Docker, GitHub Actions CI, backend Pytest and frontend Testing Library coverage
- Vercel + Render configuration included

## Screenshots

Add screenshots here after running locally:

`![Review workspace](assets/review-workspace.png)`

## Local installation

```bash
git clone https://github.com/YOUR_USERNAME/ai-code-reviewer.git
cd ai-code-reviewer
cp .env.example .env
```

Add `GROQ_API_KEY` (recommended) or set `AI_PROVIDER=openai` and provide `OPENAI_API_KEY`.

### Supabase Auth setup

1. Create a project at [Supabase](https://supabase.com/dashboard).
2. In **Project Settings → API**, copy the **Project URL** and **anon public** key.
3. Copy `frontend/.env.example` to `frontend/.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. In **Authentication → URL Configuration**, add `http://localhost:5173` as a redirect URL for local development.
5. To enable the buttons, configure Google and GitHub providers in **Authentication → Providers** and add the callback URL shown by Supabase to each provider's OAuth app.

Only the public anonymous key belongs in the frontend. Never put Supabase's `service_role` key in a Vite environment file.

Start the API:

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

In a second terminal start the client:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The API documentation is at `http://localhost:8000/docs`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `AI_PROVIDER` | `groq` (default) or `openai` |
| `GROQ_API_KEY` | Groq secret key |
| `GROQ_MODEL` | Defaults to `llama-3.3-70b-versatile` |
| `OPENAI_API_KEY` | OpenAI secret key |
| `OPENAI_MODEL` | Defaults to `gpt-4o-mini` |
| `DATABASE_URL` | SQLite URL, default is `sqlite:///./data/reviews.db` |
| `CORS_ORIGINS` | Comma-separated allowed client origins |

Without a key, the app still runs with conservative local pattern checks, making onboarding friction-free.

## Docker

```bash
docker compose up --build
```

Visit `http://localhost:5173`.

## Tests

```bash
cd backend && pytest
cd frontend && npm test
```

## Deploy

1. Create a Render Web Service from this repo, using `render.yaml`; add the AI key and set `CORS_ORIGINS` to your Vercel URL.
2. Import `frontend/` into Vercel. Update `frontend/vercel.json` with the real Render service hostname (or set `VITE_API_URL` to `https://your-api.onrender.com/api` before building).
3. Keep AI keys only in Render environment settings—never in Vercel client variables.

## Future improvements

- Add Auth.js/Clerk/Supabase Auth for real Google and GitHub OAuth plus user-scoped history.
- Stream model output, background jobs for large files, repository/PR integrations, and team workspaces.
- Add language-specific static analyzers (Ruff, Semgrep, ESLint) alongside LLM review.
