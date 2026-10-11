# Project status and receiving checklist

## Goal

Maintain a small compatibility-pinned Control UI overlay that exposes native read-only provider usage in the sidebar. The utility source, an experimental core variant and any installed custom UI are separate assets.

## Current supported source

The public utility remains pinned to OpenClaw v2026.9.3 / `1391f7cd2d40ab5bbcf2f5f831d3a64f520e72d7`. The prior four public commits through `47fa1cf62d5499c009b48a77c99808a1f20bb2e5` remain unchanged. This handoff adds receiving documentation and selected archival source, not a supported-version upgrade.

Existing root README, CHANGELOG, LICENSE, NOTICE and guarded scripts retain priority for utility behavior and installation guidance. Root AGENTS/CLAUDE guidance was preserved from source-only local migration; its migration statements are historical, not evidence of current runtime acceptance.

## Decisions

- Keep the existing public utility repository; do not create a private development duplicate.
- Preserve the v2026.9.6 port as a distinct historical source variant, never silently replace the supported patch.
- Keep deployment and Gateway configuration separate from source preservation. Do not run the operational scripts merely to inspect or archive this repository.
- Preserve exact upstream license/notices with the archived derived source.
- Keep raw private notes, runtime/configuration, credentials, browser state, logs, caches, dependencies and generated UI output out of the public handoff.

## Checks and remaining work

- [x] Preserve existing public graph and utility source.
- [x] Preserve the nine modified and five added variant files, separate earlier patch, and licenses with source mapping.
- [x] Prove generated variant delta roundtrip against isolated baseline-file copies.
- [ ] Establish complete dependency/type/test/build acceptance for the archived variant before claiming support.
- [ ] Revalidate against any newer OpenClaw version before applying it.
- [ ] Perform separately authorized browser/runtime/Mac acceptance if deployment is later requested.

Historical public screenshot bytes remain unchanged; no new image or visual acceptance was performed. Existing GitHub CI validates the supported v2026.9.3 utility, not the archived variant. Its hosted dependency/actions lifecycle is not a complete supply-chain audit.

## Provenance and coverage limits

Facts above derive from existing README/CHANGELOG/NOTICE/scripts, canonical project routing and selected project-purpose notes, source Git metadata, and exact retained source/patch inventories. Raw notes and operational history were not copied. The separate broader core-patch project is not merged here. The variant checkout was shallow; no claim is made to recover the full upstream development graph or private runtime data. Originals remain intact locally; this repository is not a machine backup.
