---
alwaysApply: true
---

- Never commit secrets, API keys, private certs, or production tokens.
- Never log sensitive data (tokens, OTPs, passwords, payment details).
- Ensure input validation for all external inputs (API, webhooks, queue payloads).
- Use least privilege for service credentials and isolate provider adapters.
- Any security-sensitive change must include tests and a short threat/failure analysis in the PR summary.
