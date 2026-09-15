# Security Policy

## Scope

ReviewLens (AI Code Reviewer) accepts source code and sends review requests to an AI provider when configured. Treat submitted code and review history as potentially sensitive.

## Current security controls

- Request bodies have explicit size limits through Pydantic validation.
- API endpoints can require a bearer token when `API_TOKEN` is configured.
- CORS origins are configurable rather than left to an implicit wildcard.
- AI provider secrets are intended to remain server-side; the frontend should never receive provider API keys.
- Production deployment should use HTTPS and platform secret storage.

## Important limitations

The current API-token model is intended as a lightweight deployment guard, not a complete multi-user identity system. Stored review history is not yet scoped to individual authenticated users, so deployments serving multiple users should add proper authentication and authorization before treating persisted reviews as private user data.

## Recommended production hardening

1. Use a real identity provider and user-scoped authorization for persisted reviews.
2. Store secrets only in server-side environment/secret management systems.
3. Restrict `CORS_ORIGINS` to the exact production frontend origin(s).
4. Put the API behind HTTPS and an appropriate reverse proxy/WAF.
5. Add rate limiting for AI-backed endpoints.
6. Run dependency, SAST, and container scans in CI.
7. Avoid logging submitted source code, prompts, provider keys, or other sensitive data.
8. Review uploaded code and generated outputs for prompt-injection and untrusted-content risks before connecting additional tools or repository integrations.

## Reporting a vulnerability

Please report security issues privately to the repository owner rather than opening a public issue containing exploit details.
