# Architecture

The React/Vite client hosts the landing page and review workspace. It calls FastAPI over `/api`. The service validates submissions, routes them to Groq by default or OpenAI when configured, records the JSON review in SQLite, and renders report PDFs on demand. API keys stay server-side.

OAuth buttons are intentionally left to the deployment identity provider. Add Auth.js, Clerk, or Supabase Auth before enabling protected multi-user history.

