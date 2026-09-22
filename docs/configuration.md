# Configuration

[README](../README.md) · [Workflows](workflows.md) · [Troubleshooting](troubleshooting.md)

MACCA shares preferences across AI hosts through `.agents/developer-config.json`. Configuration is optional for ordinary work. Use [setup-macca-method](../.agents/skills/setup-macca-method/SKILL.md), operated by Galbi, when you explicitly want to inspect or save preferences.

## Show, set up, or change one preference

| Request | Result |
| --- | --- |
| “Show my MACCA settings.” | Read-only summary of saved values, effective defaults **not saved**, session-only choices, and unconfigured choices. An absent file stays absent. |
| “Set up MACCA preferences.” | Ask only for missing preferences you want to choose. Name/project are optional; skipped choices and inferred defaults are not saved. |
| “Set only document language to English.” | Update only that channel's `raw` and `normalized` leaves, preserving its extensions and every unrelated setting. Exact intent already supplies consent. |
| “Use English for this reply.” | Session-only instruction, not a request to persist a preference. |

Setup alone does not create specs or begin implementation. `help` reads and routes settings requests to setup. Other workflows may save a specific explicitly chosen preference under the same mutation contract, without starting a full setup interview.

Preference changes apply on the next config read. Restart the AI host when installing/upgrading skill files so it can discover those files; that is separate from reading a changed preference.

## Supported fields: an example, not a required form

This is documentation of supported shapes, **not a JSON Schema file**. Every top-level field is optional; known fields that are present must have the expected types and values. The shared validator accepts unknown extensions without rewriting them. This illustrative configuration is not a list of installed or automatically authorized tools in your project:

```json
{
  "name": "Your name",
  "project": "Project name",
  "languagePreferences": {
    "communication": {
      "raw": "Bahasa Indonesia",
      "normalized": "indonesian"
    },
    "documents": {
      "raw": "English",
      "normalized": "english"
    }
  },
  "developerPreferences": {
    "workMode": "direct",
    "scope": "fullstack"
  },
  "brainstormPreferences": {
    "discussionMode": "one-by-one",
    "recommendations": true,
    "discoveryDepth": "standard"
  },
  "codeReviewPreferences": {
    "fixMode": "report-first"
  },
  "additionalSkills": [
    {
      "name": "laravel-best-practices",
      "purpose": "Use when writing Laravel code",
      "paths": {
        "copilot": ".github/skills/laravel-best-practices/SKILL.md",
        "opencode": ".opencode/skills/laravel-best-practices/SKILL.md",
        "codex": ".agents/skills/laravel-best-practices/SKILL.md"
      }
    }
  ],
  "availableMCPs": ["context7", "supabase"]
}
```

| Field | Accepted shape and meaning |
| --- | --- |
| `name`, `project` | Optional strings; save labels only when chosen. |
| `languagePreferences.communication`, `.documents` | Objects with optional string `raw` and `normalized` fields; resolution is described below. |
| `developerPreferences.workMode` | `direct` or `plan-first`. With no saved mode, explicit task intent can resolve the current mode without saving it. |
| `developerPreferences.scope` | `frontend`, `backend`, or `fullstack`. Architecture defines file boundaries; missing scope is not unrestricted implementation permission. |
| `brainstormPreferences.discussionMode` | `one-by-one`, `three-at-a-time`, or `all-at-once`; controls question batching. |
| `brainstormPreferences.recommendations` | Boolean; `false` is a valid saved choice, not a missing value. |
| `brainstormPreferences.discoveryDepth` | `quick`, `standard`, or `critical`; controls depth independently of pacing. Evidence can escalate session depth without saving an inferred preference. |
| `codeReviewPreferences.fixMode` | `report-first` or `fix-then-report`; missing means effective `report-first`. Existing workflow approval gates still apply. |
| `additionalSkills` | Array of objects with a nonempty `name`, optional string `purpose`, optional `paths` object with string values under host keys, and optional string legacy path fields. |
| `availableMCPs` | Array of nonempty tool-name strings, or legacy string `"none"`. It records authorization restrictions, not proof of availability. |

See [workflow gates](workflows.md#understand-the-two-quality-gates) and the [brainstorm policy](../.agents/skills/_shared/references/brainstorm-session.md) for how preferences affect execution.

## Languages resolve independently

For each channel, readers trim and case-fold `normalized`, try `raw` if it is missing or unrecognized, then fall back to Indonesian. They do not copy the other channel's value.

| Language | Recognized equivalents |
| --- | --- |
| Indonesian | `indonesian`, `id`, `indo`, `indonesia`, `bahasa indonesia` |
| English | `english`, `en`, `eng`, `inggris`, `bahasa inggris` |

New saved choices use canonical `indonesian` or `english`. Existing aliases, empty strings, and unknown strings are reader-resolution concerns; they do not trigger an on-disk rewrite. A fallback is shown as an **effective default (not saved)**. Filenames, IDs, config keys, and code literals remain unchanged. See [language-config.md](../.agents/skills/_shared/references/language-config.md).

The **installer's bootstrap defaults** are distinct: on a fresh interactive install, Enter selects Indonesian communication and documents matching the chosen communication language. A fresh unattended install uses those defaults unless flags override them. The setup skill does not materialize skipped defaults, and later runtime language reads remain independent. See [installer options](troubleshooting.md#commands-and-accepted-options).

## Additional skills and MCP authorization

Distinguish **installed** (on disk), **available** (exposed/resolvable in the host), and **allowed** (authorized for the task and permitted by the host). Discovery does not execute or install a discovered skill/tool, register an entire scan, or override host permissions.

- Missing `additionalSkills` or `availableMCPs` means not configured, not blanket permission. Applicable user/host instructions still determine authorization.
- `additionalSkills: []` explicitly authorizes no additional skills.
- `availableMCPs: []` and `availableMCPs: "none"` explicitly deny MCP use. The string `"none"` is a compatibility form for MCPs, not for `additionalSkills`.
- Save only explicitly authorized names and resolved paths. Do not invent another host's path or remove a restriction because a tool is unavailable today.

Canonical additional-skill paths use `paths[currentHost]`. Readers fall back to `path`, then the matching legacy field: `githubPath`, `opencodePath`, `claudePath`, `cursorPath`, `windsurfPath`, `geminiPath`, `kiloPath`, `kimiPath`, or `codexPath`. Preserve legacy paths and other host entries during unrelated updates. A skill list is an array of objects, not an array of strings or a keyed object.

For a needed user-named skill with an unresolved path, permitted discovery checks supported workspace locations and global locations such as `~/.config/opencode/skills/`, `~/.claude/skills/`, and `~/.agents/skills/` before asking for its location. Uninspectable locations are unverified, not absent. Details: [additional-skills.md](../.agents/skills/_shared/references/additional-skills.md).

## Settings versus installed host files

The MACCA installer places the complete skill collection, including `_shared`, into the selected project-local destinations:

| AI host | CLI key (accepted alias) | Skills folder |
| --- | --- | --- |
| GitHub Copilot | `copilot` (`github-copilot`) | `.github/skills/` |
| Cursor | `cursor` | `.cursor/skills/` |
| Claude Code | `claude` (`claude-code`) | `.claude/skills/` |
| Windsurf | `windsurf` | `.windsurf/skills/` |
| Gemini CLI | `gemini` (`gemini-cli`) | `.gemini/skills/` |
| OpenCode | `opencode` | `.opencode/skills/` |
| Kilo Code | `kilo` (`kilo-code`) | `.kilo/skills/` |
| Codex | `codex` (`openai-codex`) | `.agents/skills/` |
| Kimi CLI | `kimi` (`kimi-cli`) | `.agents/skills/` |

These folders hold instructions, not per-host copies of developer preferences. The shared `.agents/` metadata includes selected hosts (`macca-tools.txt`), managed skill names (`macca-managed-skills.txt`), the package/payload lock (`macca-lock.json`), metadata fingerprints (`macca-state.json`), and a transaction journal during an interrupted update (`macca-transaction.json`). They serve installation and recovery, not user preference editing.

Changing `additionalSkills` or `availableMCPs` does not install host files or configure an MCP server. Use `install` to add a supported host destination and restart that host. Project specs, task plans, and confirmed bug logs are created later by their owning workflows in `project-context/`.

## Validation, preservation, and privacy

The [config-mutation contract](../.agents/skills/_shared/references/config-mutation.md) requires:

```text
Validate existing config → merge only authorized leaves → validate full candidate
→ recheck current target identity/content → guarded write → validate final file
```

An invalid existing file stops an update unchanged; a setting request does not authorize replacing it with defaults. Unknown and unrelated fields survive at every level, including language-channel extensions, testing preferences, and legacy paths. Concurrent changes must be preserved, not overwritten by a stale candidate.

Store no API keys, passwords, tokens, connection credentials, or environment secrets in this file. Settings display uses the validated allowlisted summary described below. Diagnostics report field/type errors, not source excerpts.

### Safe preference reader

Every skill loads the [safe preference reader](../.agents/skills/_shared/scripts/read-preferences.js) by default through [language-config.md](../.agents/skills/_shared/references/language-config.md):

```bash
node .agents/skills/_shared/scripts/read-preferences.js .agents/developer-config.json
```

Replace `.agents/skills` with the selected host's installed skills folder. The reader requires its sibling `config-validator.js` and emits a JSON summary with a **closed vocabulary**: fixed keys, canonical languages, finite preference choices, booleans, counts, and `null`; **no free-form strings** from configuration are returned.

- Each language channel returns `configured`, `effective` (`indonesian` or `english`), and `source` (`normalized`, `raw`, or `default`). The `raw` source label never includes the saved raw text.
- Known developer, brainstorm, and review fields return `{ configured, value }`. Missing choices are `null`; `false` stays `false`.
- Identity returns only `nameSet` and `projectSet`. Additional skills and MCPs return only configured/count indicators, plus MCP `denied`. Names, purposes, paths, tool names, and unknown extension keys/values are withheld.
- Exit **0** with `absent: true` means config is missing; effective language defaults are **not saved**, and no file or parent directory is created. A present valid file has `absent: false`.
- Exit **1** reports a redacted error for invalid/unreadable input, a symlink/nonregular file, input over 1 MiB, or unavailable safe reading/validation. Reads do not write or change permissions.

If the helper, sibling validator, Node.js runtime, safe file-reading support, or permitted execution is unavailable, stop affected **config-dependent work** and report that preferences could not be checked. There is **no raw-file fallback**, and helper failure must not be presented as absent config. Work independent of those preferences can continue; optional config need not be created.

The summary intentionally cannot resolve a skill path or identify an allowed tool. An already-authorized targeted lookup may validate and inspect the necessary field locally under the [config-mutation contract](../.agents/skills/_shared/references/config-mutation.md), returning only a safe boolean/status or performing the permitted local resolution. It must retain regular-file, no-symlink, bounded-read protections and never print raw names, paths, entries, or configuration.

### Optional technical detail: validator module and CLI

The installed [shared validator](../.agents/skills/_shared/scripts/config-validator.js) exports:

- `validateConfig(value)` → an array of redacted `{ field, message }` errors.
- `assertValidConfig(value, label)` → throws on invalid input.

Its read-only CLI takes exactly one config-file path:

```bash
node .agents/skills/_shared/scripts/config-validator.js .agents/developer-config.json
```

Replace `.agents/skills` with your host's installed skills folder when needed. Exit **0** means valid; **1** means missing, unreadable, or invalid input. It neither writes nor migrates configuration and has no `--stdin` option. It validates shapes, not whether a listed tool is installed or permitted.

The validator's API and accepted shapes are unchanged by the reader; language normalization and summary filtering belong to the reader. Saved mutations require Node.js and the shared validator. If either is unavailable, mutation stops; read-only show additionally requires the safe reader and never bypasses validation. Normal work does not require creating optional config merely to satisfy the validator. For installation/runtime issues and migration, use [Troubleshooting](troubleshooting.md#migrate-from-2x-to-3x).
