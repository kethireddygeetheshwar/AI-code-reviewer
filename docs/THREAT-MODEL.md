# Threat Model

## Assets

- Source code submitted for analysis
- Review results and stored analysis history
- Authentication tokens
- AI provider credentials
- Application configuration

## Trust boundaries

1. Browser → API
2. API → AI provider
3. API → persistence layer
4. Deployment environment → application secrets

## Main threats and mitigations

| Threat | Risk | Mitigation |
|---|---|---|
| Credential exposure | High | Keep provider keys and auth secrets in server-side environment/secret storage |
| Unauthorized review access | High | Use authenticated, user-scoped authorization before persisting or returning review history |
| Prompt injection in submitted code | Medium/High | Treat source code as untrusted input; do not grant model output direct tool privileges |
| Oversized requests | Medium | Enforce request-size limits and reject excessive input |
| AI provider abuse | Medium | Add rate limiting, quotas, and monitoring before public deployment |
| Sensitive logging | High | Do not log source code, tokens, provider keys, or private review content |
| Dependency vulnerabilities | Medium | Keep dependencies updated and run automated security checks |

## Security principle

The application should treat both user-submitted code and model-generated output as untrusted data. Authentication, authorization, validation, and least privilege should be enforced independently of the AI model's output.

## Current limitation

The lightweight API-token model is a deployment guard, not a complete multi-user identity and authorization system. A public multi-user deployment should implement user identities and resource-level authorization before storing private review history.
