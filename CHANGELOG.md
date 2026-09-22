# Changelog

## 3.0.0-rc.1 — Prerelease candidate

This version is a **prerelease candidate, not a stable release**, designated for the npm `next` channel. Local validation, static contract checks, and a configured CI matrix do not establish release stability or live-agent acceptance. `macca-method@latest` remains the stable channel; publishing this candidate to `next` does not replace it. Check registry availability with `npm view macca-method dist-tags`.

### Breaking changes from 2.x

- Node.js **22+** is required. Runtimes below 22 are rejected; the configured platform matrix uses Node.js **22 and 24**.
- Installer safety checks reject symlinked target ancestors, Windows UNC/network paths, and device paths. Use an inspected physical local path.
- Invalid existing preferences stop writes rather than being replaced with defaults. Managed local edits, unowned folder collisions, and inconsistent transaction evidence require review; `--force` is not a general bypass.
- Runtime preference reads require the installed safe reader and sibling validator. If safe reading or permitted execution is unavailable, affected config-dependent work stops with a disclosed limitation; there is no raw-config fallback.

### Integrated changes

- Package the shared read-only preference reader and its regression suite with an exact required-file allowlist. Summary output uses fixed keys and closed choices, with no user-provided free text, dynamic extension names, skill paths, or tool names.
- Preserve the existing validator exports and accepted configuration shapes, including optional fields, unknown extensions, independent language fallback, explicit `false`, empty restrictions, and legacy fields.
- Include preference syntax/runtime tests in `npm run validate`, retain static loading-contract checks for all 19 official skills, and include this changelog in the package contract.
- Document configuration ownership, privacy, recovery, migration, and the distinction between static checks and live-agent evidence. Ignore only scoped local preferences and generated evaluation results/workspaces; retain evaluation definitions and preparation scripts.

### Migration

Back up the project, especially modified skills, preferences, installer metadata, and pending recovery files. Inspect changes before upgrading; **do not use `--force` by default**. Switch to Node.js 22 or 24, use the physical project path, run read-only diagnosis, and upgrade with the intended candidate CLI. Preserve unknown/legacy config fields and reinstall the complete collection if shared helpers are missing. Restart the host and diagnose again afterward.

See [the migration guide](docs/troubleshooting.md#migrate-from-2x-to-the-3x-candidate), [legacy 1.1.0 handling](docs/troubleshooting.md#upgrade-from-110), and [safe preference reading](docs/configuration.md#safe-preference-reader). Unmodified recognized legacy payloads can be adopted; modified/unknown folders are not made owned by force, and legacy global Kimi copies are not deleted automatically.

### Known evidence and versioning limits

- Downgrade protection uses SemVer precedence, including prerelease identifiers: stable `3.0.0` is newer than `3.0.0-rc.1`, and `rc.10` is newer than `rc.2`. Build metadata does not change precedence; invalid recorded versions stop the operation for inspection.
- Ubuntu/Windows/macOS × Node.js 22/24 is the configured matrix, not a claim that every run has passed. Platform-specific run logs and actual live-agent evaluation evidence are required for those claims.
- This changelog records the candidate delta only; it does not reconstruct earlier release history or authorize publication.
