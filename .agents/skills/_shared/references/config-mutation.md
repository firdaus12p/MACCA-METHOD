# Config Mutation Contract

Read and follow `workspace-safety.md` before any mutation.

## Ownership and Consent

`.agents/developer-config.json` is the single source of persistent MACCA preferences, shared across hosts. `setup-macca-method` (`@Galbi`) is its default configuration owner. Do not create per-host copies, a second settings file, or a persistent setup-state artifact.

All skills READ this contract through `language-config.md` or directly before using config. Other skills may persist a specific answer explicitly chosen as a saved preference in their own workflow under this same contract; they must not run a whole configuration interview or require setup before normal work. `help` stays read-only and routes configuration requests to the owner.

- An exact instruction such as “set only document language to English” already authorizes that field update. Do not ask the same permission again. Ask only about an ambiguous target/value or materially changed scope.
- A session-local answer, inferred project name, discovery result, working default, or request to show settings is not consent to save it. Offer optional setup only when relevant; absent optional config never blocks ordinary work.
- `name` is optional. Infer a project label for display if useful, but save `project` only when the user chooses it. Never collect API keys, tokens, passwords, or other credentials for this config.

## Read-Only Display

For show/status, do not create the file, fill missing fields, normalize it on disk, write defaults, or start an interview. Distinguish **saved**, **effective default (not saved)**, **session-only**, and **not configured**. Missing allowlists are not equivalent to explicit empty allowlists or `none`.

Use `../scripts/read-preferences.js <config-file>` through Node.js as the default read path for every skill (see `language-config.md`). It requires its sibling validator, validates locally, and emits only known finite preferences, canonical effective languages, and configured/missing indicators. It withholds all free text, including identity, raw languages, skill names/purposes/paths, and MCP names; hide unknown extension names and values as well. Missing config is exit 0 with `absent: true`; invalid/unreadable, symlink/nonregular, or over-1-MiB config is exit 1 with redacted diagnostics. Reads never write or change permissions. Missing helper/runtime/validator stops the affected config read; do not substitute a raw read or claim preferences are absent.

The helper intentionally does not expose tool names or skill paths. Only when an authorized targeted operation actually needs them, a permitted local module may validate and read the intended field in memory to resolve a named skill path or compare a requested tool against saved restrictions. Keep raw data inside that local operation: return only a safe boolean/status or perform the already-permitted local resolution without printing raw names, paths, entries, or config. This is not permission for a read dump, external transmission, or broader discovery. Apply the same regular-file, no-symlink, bounded-read protections; if unavailable, stop that lookup. Mutation may likewise parse locally under the sequence below. Do not serialize secret fields into reports, prompts, diffs, logs, command arguments, or external services. Unknown fields remain supported and retained locally. A malformed file gets a redacted field/type or `$` JSON-syntax report, never a source excerpt.

Both read CLIs require sibling `../scripts/config-file.js`. Its internal `loadConfig(file, {allowMissing})` returns parsed data only to the local caller; never print that return value. The exact user/host-authorized file path is the read authority, not an inferred workspace root. It checks every resolved path component with `lstat`, rejecting ancestor/leaf symlinks and Windows junctions (including dangling links), and requires directories followed by a regular file. Pass an authorized physical local path; do not automatically resolve a rejected link to its external target. Reads are bounded to 1 MiB plus one overflow-detection byte and recheck path/descriptor identities before and after content reads. Missing components mean absent only for the preference reader; the validator CLI reports missing input.

On POSIX, nonzero `O_NOFOLLOW` and `O_NONBLOCK` are required; unavailable/zero flags stop the read. On Windows, ordinary local drive paths use native read-only open plus the same component/type/identity checks, without claiming POSIX no-follow protection. UNC/device namespaces, DOS device names, alternate data streams, and ambiguous drive-relative paths are rejected. These synchronous checks provide best-effort detection of ordinary local races, not an OS sandbox against malicious concurrent ancestor replacement or arbitrary reparse-point behavior. Host permissions/sandbox must bound adversarial workspaces; pause the read if concurrent hostile replacement cannot be excluded. Neither CLI prints filenames, parser excerpts, nor filesystem exception text, and neither writes or changes permissions.

## Validation and Scoped Mutation

The canonical validator is `../scripts/config-validator.js`, resolved relative to this reference. It exports `validateConfig` (returns an array of redacted field/message errors) and `assertValidConfig`; its read-only CLI is:

```text
node <resolved-shared-scripts>/config-validator.js <config-file>
```

Exit 0 prints only `Valid config.`; exit 1 means missing/unreadable/invalid input or an unsafe path/oversized file, with redacted diagnostics. It does not mutate or migrate config. The CLI accepts a file path, not `--stdin`. Do not invent another schema or assume unsupported validator flags. The in-memory `validateConfig` / `assertValidConfig` exports remain pure and do not load files or require the loader.

Before any persistent write:

1. Verify the validator and its runtime are available. Validate the existing file if present before building an update. A missing file is allowed for an authorized creation; an unreadable, malformed, or invalid existing file stops mutation. Preserve it and report only the validator's redacted field and expected shape. Do not silently repair, overwrite, or replace it with defaults. If the validator is unavailable, say validation is unavailable and stop mutation until it is available; never claim it was checked. Read-only show also requires the safe reader and validator; stop the affected read rather than bypassing them.
2. Record the explicit field-level intent and current file identity/content locally. Parse in a local process that does not print source or parser excerpts. Merge only the specified leaf fields. Preserve unknown and unrelated fields at every level, including nested extension objects, tests/test preferences, and legacy paths. Do not replace the whole object or a containing section to change one preference. Use literal own-property keys, not unsafe generic merges that interpret prototype keys.
3. Validate the complete merged candidate **before persistent write**, with the shared module's `validateConfig` or `assertValidConfig` in memory. Load the existing data locally and keep it out of shell arguments, interpolated script text, prompts, and tool output. Catch JSON parser errors without printing their messages/source. If a file-based check is needed instead, follow **Temporary Candidate Safety** below. Failure leaves the original untouched.
4. Re-read/check the target immediately before applying the scoped patch or guarded replacement. Preserve concurrent user edits, file ownership, and permission restrictions; do not follow an unexpected symlink or change target identity. If the source changed, rebuild from the fresh valid source and revalidate, or stop the conflicting edit. Use an expected-content/identity guard where supported; if concurrent writing cannot be excluded safely, pause rather than overwrite. Creation must not overwrite a file that appeared in the meantime.
5. Persist only the authorized delta to `.agents/developer-config.json`, preserving all other values. Avoid whole-file reformatting. Validate the final file with the shared validator, clean up any temporary candidate, and report changed safe field names plus actual validation status. An unexpected final failure requires a redacted report and bounded recovery of only your own change, never a blind rollback over user work.

For example, a documents-only language change updates `languagePreferences.documents.raw` and `.normalized`, retaining any extensions inside `documents`. It preserves `languagePreferences.communication`, `developerPreferences.scope`, work mode, testing settings, and all other unknown fields. Do not opportunistically normalize aliases elsewhere.

## Temporary Candidate Safety

Prefer in-memory module validation. A temporary candidate is allowed only for pre-write validation, never as another persistent source of truth. It may contain unknown sensitive values: use an approved private local location, exclusive creation, owner-only access (0600 with a private 0700 directory on POSIX, equivalent restrictive ACLs elsewhere), and host permissions. Do not use a shared/external/synced directory or an existing predictable filename. If these protections cannot be established, stop mutation.

Do not expose candidate contents in tools, logs, diffs, network calls, or command text. Pass paths as literal arguments, not interpolated shell commands. Remove the candidate on success, validation failure, or cancellation using guaranteed cleanup where possible; report cleanup failure without content and do not leave a backup/duplicate settings file. No credential collection is needed for validation.

## Stable Fields and Compatibility

All top-level fields are optional; unknown extensions remain supported at every level. Known fields follow the shared validator, with reader normalization separate from validation:

- `name`, `project`: strings, saved only when chosen.
- `languagePreferences.communication` / `.documents`: objects with optional string `raw` and `normalized`; aliases and fallback resolution follow `language-config.md` without rewriting saved input.
- `developerPreferences.workMode`: `direct` / `plan-first`; `.scope`: `frontend` / `backend` / `fullstack`.
- `brainstormPreferences.discussionMode`: `one-by-one` / `three-at-a-time` / `all-at-once`; `.recommendations`: boolean; `.discoveryDepth`: `quick` / `standard` / `critical`.
- `codeReviewPreferences.fixMode`: `report-first` / `fix-then-report`.
- `additionalSkills`: an array of skill objects, using canonical `paths` or accepted legacy fields under `additional-skills.md`.
- `availableMCPs`: an array of nonempty tool-name strings or the legacy literal `none`; both `[]` and `none` are explicit denials.

Prefer additive schema changes. Do not silently rename or repurpose keys. If migration becomes unavoidable, readers must remain backward compatible until an explicitly authorized migration is available.
