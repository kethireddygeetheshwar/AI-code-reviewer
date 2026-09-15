# AI Code Reviewer · ReviewLens

A full-stack AI code-review workspace for Python, JavaScript, Java, and C++. ReviewLens combines LLM-assisted review with local analysis to surface bugs, security concerns, complexity issues, quality scores, suggested code, and follow-up reviewer chat.

## Why this project

Code review often requires checking the same categories repeatedly: correctness, security, complexity, and maintainability. ReviewLens brings those checks into one workflow while keeping provider credentials on the backend.

## Features

- Responsive React UI with dark/light modes and Monaco editor
- Groq by default, with OpenAI selectable through server-side environment variables
- Persistent SQLite review history and downloadable PDF reports
- Severity-labelled findings, quality scorecards, security guidance, and complexity analysis
- AI-assisted follow-up chat and test generation
- CSV-based ML analysis workflow
- Docker support and GitHub Actions CI
- Backend Pytest and frontend Testing Library tests
- Vercel + Render deployment configuration

## Architecture

```text
React + Monaco
      |
      | HTTPS / API
      v
FastAPI backend
      |
      +---- Pydantic validation
      +---- Review / ML analysis
      +---- SQLite persistence
      +---- AI provider adapter
      |
      v
Groq / OpenAI
```

The backend is responsible for provider credentials and external AI calls. Client-side configuration should contain only public frontend values.

## Security

The project includes explicit request-size validation, configurable CORS origins, optional bearer-token protection for API endpoints, and guidance for keeping AI provider secrets server-side. See [`SECURITY.md`](SECURITY.md) for the current controls, limitations, and production hardening checklist.

**Important:** the current bearer-token mechanism is a lightweight API guard, not a complete multi-user identity system. Persisted review history is not yet scoped to individual users, so multi-user production deployments should implement user authentication and authorization before treating stored reviews as private user data.

## Local installation

```bash
git clone https://github.com/kethireddygeetheshwar/AI-code-reviewer.git
cd AI-code-reviewer
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

### Start the API

```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. API documentation is available at `http://localhost:8000/docs`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `AI_PROVIDER` | `groq` (default) or `openai` |
| `GROQ_API_KEY` | Groq server-side secret |
| `GROQ_MODEL` | Groq model name |
| `OPENAI_API_KEY` | OpenAI server-side secret |
| `OPENAI_MODEL` | OpenAI model name |
| `DATABASE_URL` | SQLite database URL |
| `CORS_ORIGINS` | Comma-separated allowed client origins |
| `API_TOKEN` | Optional bearer token for API protection |

Never commit real secret values to the repository.

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

1. Create a Render Web Service from this repository using `render.yaml` and configure server-side AI secrets.
2. Import `frontend/` into Vercel and configure `VITE_API_URL` with the deployed API URL.
3. Set `CORS_ORIGINS` to the exact production frontend origin.
4. Keep provider API keys only in server-side environment settings.

## Development roadmap

- Add complete multi-user authentication and user-scoped review history.
- Add rate limiting for AI-backed endpoints.
- Add static analyzers such as Ruff, Semgrep, and ESLint alongside LLM review.
- Expand integration tests and security scanning in CI.
- Add repository/PR integrations with explicit least-privilege permissions.
