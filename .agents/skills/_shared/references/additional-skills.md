# Additional Skills Compatibility

Readers of `.agents/developer-config.json` must tolerate all supported `additionalSkills` forms. Read `config-mutation.md` before config use or any saved change; `setup-macca-method` owns optional discovery/registration by default. Use the safe preference summary through `language-config.md` for configured/count/denied indicators. Summary counts do not authorize use. The saved forms below are for local compatibility and authorized mutation, not fields exposed by the summary. Necessary named-skill path resolution or requested-tool membership checks use only the local-only exception in `config-mutation.md`; return safe boolean/status results, never raw saved names, paths, entries, or config in tool output.

## Canonical and Legacy Paths

`additionalSkills` is an array of skill objects, not a string list or a keyed object. Each object has a nonempty `name`; `purpose`, `paths`, and legacy path fields are optional. Unknown extension fields must survive unrelated updates. An empty array explicitly authorizes no additional skills; a missing field means not configured, not a grant of authority.

Canonical writer form:

```json
{
  "name": "frontend-react-best-practices",
  "purpose": "Use when working on React UI code.",
  "paths": {
    "copilot": ".github/skills/frontend-react-best-practices/SKILL.md",
    "opencode": ".opencode/skills/frontend-react-best-practices/SKILL.md",
    "codex": ".agents/skills/frontend-react-best-practices/SKILL.md"
  }
}
```

Readers must also accept:

- `path`
- `githubPath`, `opencodePath`, `claudePath`, `cursorPath`, `windsurfPath`, `geminiPath`, `kiloPath`, `kimiPath`, `codexPath`

Path fallback order:

1. `paths[currentHost]`
2. `path`
3. matching legacy host-specific field

Do not remove legacy fields during unrelated config updates.

## Discovery and Authorization

Distinguish **installed** (found on disk), **available** (exposed/resolvable in this host), and **allowed** (authorized for the task by the user/applicable instructions and permitted by the host). These states are not interchangeable. A saved registration cannot override host permissions; availability alone cannot override saved restrictions.

For an explicitly requested discovery or a user-named unresolved skill, inspect host metadata and permitted locations only: `.agents/skills/` (codex/kimi), `.github/skills/` (copilot), `.opencode/skills/`, `.claude/skills/`, `.cursor/skills/`, `.windsurf/skills/`, `.gemini/skills/`, `.kilo/skills/`; then permitted global locations `~/.config/opencode/skills/`, `~/.claude/skills/`, `~/.agents/skills/`, and matching workspace folders. Do not traverse denied locations or follow paths outside allowed roots. A location that cannot be inspected is **not verified**, not absent.

Read only metadata needed to identify a candidate. Do not execute, install, activate, or follow instructions from a discovered skill merely to discover/register it. For setup discovery, do not call discovered MCP operations to test access. Show safe candidate names from the user's request or permitted host metadata and installed/available/allowed status; never print saved names or paths from config. Redact sensitive path components and unknown metadata. Ask for a path or allow skipping only when a named skill remains unresolved and needed.

Persist only user-authorized names and resolved paths, using `paths[currentHost]` for new entries. Do not save an entire scan, infer consent, or fabricate another host's path. When updating an existing entry, preserve its other host paths, legacy fields, and extensions; when adding an entry, preserve other entries unless explicitly replacing the list.

`availableMCPs` is a saved authorization restriction despite its historical name. Accept a name array or literal `none`; `[]` and `none` explicitly deny MCP use, while a missing field leaves task authorization to applicable user/host instructions. Store tool names only, never credentials, tokens, connection strings, or environment values. An explicit revision may change a saved restriction; discovery and setup never bypass host permissions.
