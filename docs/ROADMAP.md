# ReviewLens Roadmap

This roadmap records concrete engineering work instead of artificial activity. Each milestone should result in working code, tests, and documentation.

## Phase 1 — Quality baseline

- [ ] Keep backend and frontend tests passing in CI
- [ ] Add coverage reporting for backend and frontend
- [ ] Add linting/formatting checks
- [ ] Add dependency vulnerability scanning

## Phase 2 — Security hardening

- [ ] Replace the shared API token with user authentication
- [ ] Scope review history and reports to the authenticated user
- [ ] Add rate limiting to AI-backed endpoints
- [ ] Add request correlation IDs and safe structured logging
- [ ] Add security headers at the deployed edge
- [ ] Add automated security tests for authorization and input validation

## Phase 3 — AI reliability

- [ ] Add deterministic local checks alongside LLM findings
- [ ] Validate and normalize model output before persistence
- [ ] Add tests for prompt-injection and malformed model responses
- [ ] Track provider errors and latency without logging secrets or submitted source code

## Phase 4 — Engineering depth

- [ ] Add background processing for large analysis jobs
- [ ] Add repository/PR integration with least-privilege OAuth scopes
- [ ] Add release notes for meaningful versions
- [ ] Publish architecture and threat-model documentation
