# Security Policy

## Reporting a vulnerability

Do not publish credentials, access tokens, or exploitable details in a public issue.

For this educational repository, contact the repository owner privately through GitHub to report a suspected vulnerability. Include the affected file, reproduction steps, and impact without including live secrets.

## Secret handling

- Store MongoDB, Supabase, and JWT secrets in GitHub Codespaces Secrets or the deployment platform's secret manager.
- Never commit `.env`, access tokens, or service-role/secret API keys.
- Rotate any credential that was exposed in chat, logs, screenshots, or Git history.
