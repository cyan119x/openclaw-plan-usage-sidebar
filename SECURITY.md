# Security policy

## Supported version

Only the patch for OpenClaw `v2026.9.3` is currently supported.

## Reporting a vulnerability

Do not publish security-sensitive details in a public issue. Contact the repository owner privately through GitHub first, with a concise reproduction and impact description.

## Data handling

The patch calls only OpenClaw's native, authenticated `usage.status` RPC. It does not collect or transmit provider credentials, OAuth tokens, cookies, prompts, or session transcripts. A valid usage summary may be stored only in the current browser session for up to two minutes to avoid blank UI during reload.
