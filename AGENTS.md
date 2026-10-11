# openclaw-plan-usage-sidebar: shared working rules
Read README.md first. This is a source-only patch/overlay utility, not the active runtime UI.
Inspect Git root, branch and local modifications before editing. Keep existing source layout.
The migration preserved the full original working tree. No commit or remote mutation was made.
Safe checks verified in this migration: bash -n scripts/*.sh (each explicit file).
These are syntax checks, not installed-runtime acceptance.
Do not run install/publish/restart scripts without separate authorization. Do not copy agent memory, sessions, or credentials into this repository.
Keep README/CHANGELOG or existing progress documents as the source of project state. Record test results and remaining work when handing off.
GitHub publication requires selected-file checkpoint, history/secret review and Cyan approval. Mac compatibility has not been verified.
