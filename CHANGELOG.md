# Changelog

All notable changes to this project are documented here.

## 0.1.1 - 2026-09-19

- Tightens sidebar spacing below the agent brand for a balanced rhythm with the Sessions section.
- Changes remaining-quota states to green above 40%, yellow from 20–40%, and red below 20%.
- Uses a distinct yellow quota warning fill so light-theme warnings are not confused with danger red.
- Adds boundary regression coverage for 41%, 40%, 20%, and 19% remaining.

## 0.1.0 - 2026-09-17

- Initial public patch for OpenClaw `v2026.9.3`.
- Adds a persistent OpenAI/Codex Plan Usage sidebar card.
- Adds safe handling of cache-cold usage responses and session-local snapshot hydration.
- Adds guarded apply, build, and custom-root publishing scripts.
