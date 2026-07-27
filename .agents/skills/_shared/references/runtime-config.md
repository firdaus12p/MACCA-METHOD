# Runtime Config Contract

## Table of Contents

1. Purpose
2. Required Reading Order
3. Language Preferences
4. Stable Shared Fields
5. additionalSkills Compatibility
6. Mutation Rules

## Purpose

This file is the single source of truth for how MACCA skills read and update
`.agents/developer-config.json`.

Treat `developer-config.json` as a stable public contract. Do not introduce
breaking schema changes that force existing users to edit the file manually
after an update.

## Required Reading Order

Before any user-facing output or config mutation:

1. Read `.agents/developer-config.json` if it exists.
2. Preserve unknown fields when writing updates.
3. Merge changes into the existing object. Never replace the whole file unless
   the file does not exist yet.

## Language Preferences

Use these fields when present:

```json
{
  "languagePreferences": {
    "communication": {
      "raw": "Bahasa Indonesia",
      "normalized": "indonesian"
    },
    "documents": {
      "raw": "Bahasa Indonesia",
      "normalized": "indonesian"
    }
  }
}
```

### Accepted Compatibility Values

Readers must accept both long and short normalized values:

- Indonesian: `indonesian`, `id`
- English: `english`, `en`

Writers should preserve an existing known value when possible. If a skill must
write a new normalized value, use the installer's canonical form unless the
installer is updated to a new canonical form first.

### Output Rules

- Use `languagePreferences.communication.normalized` for chat output, reports,
  prompts, and confirmations.
- Use `languagePreferences.documents.normalized` for generated project
  documents.
- Never translate filenames, traceability IDs, config keys, or code literals.

## Stable Shared Fields

These fields are part of the stable contract and must remain backward
compatible:

- `name`
- `project`
- `languagePreferences`
- `developerPreferences.workMode`
- `developerPreferences.scope`
- `brainstormPreferences`
- `additionalSkills`
- `availableMCPs`

## additionalSkills Compatibility

> **Internal contract only.** These shapes exist for backward compatibility across
> multiple AI hosts (Copilot, OpenCode, Codex, etc.), each of which stores skill
> files at different paths. Users do not choose a shape — skills always write the
> canonical extensible shape when saving. Readers must tolerate all three shapes.

Readers must support all of these shapes:

### Legacy single-path shape

```json
{
  "name": "frontend-react-best-practices",
  "path": ".agents/skills/frontend-react-best-practices/SKILL.md",
  "purpose": "Use when working on React UI code."
}
```

### Legacy host-specific shape

```json
{
  "name": "frontend-react-best-practices",
  "opencodePath": ".opencode/skill/frontend-react-best-practices/SKILL.md",
  "githubPath": ".github/skills/frontend-react-best-practices/SKILL.md",
  "purpose": "Use when working on React UI code."
}
```

### Canonical extensible shape

```json
{
  "name": "frontend-react-best-practices",
  "purpose": "Use when working on React UI code.",
  "paths": {
    "copilot": ".github/skills/frontend-react-best-practices/SKILL.md",
    "opencode": ".opencode/skill/frontend-react-best-practices/SKILL.md",
    "codex": ".agents/skills/frontend-react-best-practices/SKILL.md"
  }
}
```

### Read Fallback Order

When selecting a skill path for the current host, use this order:

1. `paths[currentHost]`
2. `path`
3. legacy host-specific fields such as `githubPath`, `opencodePath`,
   `claudePath`, `cursorPath`, `windsurfPath`, `geminiPath`, `kiloPath`,
   `kimiPath`, `codexPath`

Do not delete legacy fields during unrelated updates.

## Mutation Rules

- Additive changes only by default.
- Do not rename or repurpose existing keys silently.
- If a future migration is unavoidable, skills must remain tolerant readers
  until upgrade tooling can migrate old configs automatically.