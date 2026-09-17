# Contributing

## Before changing code

1. Start from a clean checkout of the supported OpenClaw tag.
2. Keep the patch narrowly scoped to the Control UI feature.
3. Do not add provider scraping, credential access, or backend services.
4. Preserve the custom-root installation strategy. Never patch OpenClaw's global npm installation.

## Validation

Run the commands in [README.md](README.md#validate-before-publishing), then confirm the patch still applies cleanly to the documented upstream commit:

```bash
git apply --check patches/openclaw-v2026.9.3.patch
```

## Pull requests

Explain the UX impact, update tests and documentation, and state the exact OpenClaw version tested. Keep changes focused and avoid unrelated formatting churn.
