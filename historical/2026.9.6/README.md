# Archived v2026.9.6 development variant

## Provenance and contents

The inspected source checkout is a shallow development snapshot at `eb377ac59e6c9fd6c7705028034812becf00271b`, identified locally as OpenClaw 2026.9.6. Its nine modified tracked files and five added source/test/style files are preserved byte-identically under `source/`. The complete upstream graph, dependencies and generated output are not included. This is not a reconstructed historical commit chain.

`original-port.patch` is the separately retained earlier port artifact, preserved exactly. It is distinct from the inspected worktree and is not claimed to reproduce the later variant. `worktree-delta.patch` is newly derived from the exact inspected baseline and all14 changed/added files. A check and apply against isolated copies of the nine baseline files reproduced all14 source files byte-for-byte. That is patch integrity evidence, not dependency, type, test, build, browser or runtime acceptance.

[SOURCE_MAP.json](SOURCE_MAP.json) records portable source labels, relative paths and hashes. The full source originals and local preservation remain outside this public receiving copy.

## Behavior represented in source

The variant factors quota rendering into a shared component, adds a sidebar usage component, maps native usage summaries, preserves successful snapshots during refresh, and includes synthetic UI tests. Quota fixtures use reserved example.com or .test addresses, not captured provider accounts. The copied mock-development script is archival upstream-derived source; do not execute it as part of reading this archive.

## Rights and limitations

The accompanying LICENSE and THIRD_PARTY_NOTICES.md are exact files from the inspected OpenClaw source baseline. Original attribution is retained. This narrow archival handoff is not a warranty of all upstream authorship or compatibility.

No dependency installation, application to an operational checkout, UI build, Gateway RPC, browser interaction, configuration edit, runtime publication or restart occurred for this handoff. The existing utility continues to support only the baseline stated in the root README. A future port needs a complete independently obtained matching source tree and separately authorized validation.
