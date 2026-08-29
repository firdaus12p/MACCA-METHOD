# Runtime Config Contract

## Table of Contents

1. Purpose
2. Required Read Order
3. Language Preferences
4. Stable Shared Fields
5. Fix Mode Contract
6. Approval Resume Protocol
7. `additionalSkills` Compatibility
8. Mutation Rules

## Purpose

This file is the source of truth for how MACCA skills read and update `.agents/developer-config.json`.

Treat `developer-config.json` as a stable public contract. Do not make breaking schema changes that force existing users to edit the file manually after an upgrade.

## Required Read Order

Before any user-facing output or config mutation:

1. Read `.agents/developer-config.json` if it exists.
2. Preserve unknown fields when writing updates.
3. Merge changes into the existing object. Never replace the whole file unless the file does not exist yet.

## Language Preferences

Use this field if present:

```json
{
  "languagePreferences": {
    "communication": {
      "raw": "Indonesian",
      "normalized": "indonesian"
    },
    "documents": {
      "raw": "Indonesian",
      "normalized": "indonesian"
    }
  }
}
```

### Accepted Compatibility Values

Readers must accept long and short normalized forms:

- Indonesian: `indonesian`, `id`
- English: `english`, `en`

Writers should preserve known values when possible. If a skill must write a new normalized value, use the installer's canonical form unless the installer is updated to a new canonical form first.

### Output Rules

- Use `languagePreferences.communication.normalized` for chat output, reports, prompts, and confirmations.
- Use `languagePreferences.documents.normalized` for generated project documents.
- Never translate file names, traceability IDs, config keys, or code literals.

## Stable Shared Fields

These fields are part of the stable contract and must remain backward compatible:

- `name`
- `project`
- `languagePreferences`
- `developerPreferences.workMode`
- `developerPreferences.scope`
- `brainstormPreferences`
- `additionalSkills`
- `availableMCPs`
- `codeReviewPreferences.fixMode`

## Fix Mode Contract

`codeReviewPreferences.fixMode` is a **binding setting for review/remediation skills**.
`developer`, `bug-fix`, `spec-compliance`, `code-review`, and `spec-audit` MUST follow this field before they fix findings or change files in a review/remediation workflow.

Brainstorming/document-generation skills such as `brainstorm-*`, `add-feature`, and `spec-init` are NOT required to use `fixMode`, because they do not run a report-findings-then-fix workflow.

### Read and Announce at Startup

Every covered review/remediation skill must read `fixMode` during Shared Runtime Setup — **before any analysis or action begins**:

1. Read `codeReviewPreferences.fixMode` from `developer-config.json`.
2. If it is missing, treat it as `"report-first"` — do not ask the user.
3. Announce it at the top of the output: `[Fix mode: report-first]` or `[Fix mode: fix-then-report]`.

### Values

| Value | Behavior |
|-------|----------|
| `"report-first"` | **Default.** Run all analysis. Present the full findings report. Show the gate prompt below. **End the response.** Wait for user confirmation in the next message before touching any files. |
| `"fix-then-report"` | Automatically apply actionable BLOCKER/MAJOR fixes, validate them, and present the full report at the end. A document-audit skill edits documents only when the invocation requested corrections. |

### Required Gate Prompt (`report-first` only)

After presenting all findings, the skill must display this block **verbatim**, then **end the response immediately**:

```
---
[GATE — Fix mode: report-first]
All findings have been reported. No files were changed.
Reply "yes" / "fix" / "continue" to apply all fixes,
or name which findings you want to fix.
---
```

**Critical rule:** DO NOT apply any fixes, edit any files, run any sub-skill, or add follow-up text in the same response. The response ends at the gate prompt. Act only after the user's next message confirms.

Before the gate, retain a fix manifest for every actionable finding: finding ID, target file, intended change, and validation. It may be shown as a compact report table or kept in the current conversation state when the host reliably preserves it.

## Approval Resume Protocol

This protocol has precedence over ordinary skill routing, startup, identity, onboarding, preflight, and work-mode prompts.

When the immediately preceding assistant response ended with the report-first gate:

1. Normalize the next user message by trimming whitespace and comparing case-insensitively.
2. Exact `yes`, `fix`, or `continue` approves all actionable findings in that immediately preceding report, including MINOR findings with a concrete recommended fix. It does not approve unrelated cleanup or new findings.
3. A response naming finding IDs approves only those IDs.
4. Resume directly at file changes. Do not repeat analysis, report generation, startup announcements, preflight, or the same gate.
5. Ask one new question only if the worktree changed materially, the approved target no longer exists, findings conflict, or implementation would become destructive or exceed the disclosed scope.
6. After editing, run the narrowest relevant tests/checks and a bounded verdict pass against the approved finding IDs. Mark each `resolved`, `partial`, or `unresolved`; do not start an unbounded new review.
7. If validation fails, repair within the approved scope and validate once more. If still failing, stop and report evidence instead of claiming completion.

`quick-dev` and other implementation routers MUST NOT intercept approval replies while a report-first gate is active.

### Default

If `codeReviewPreferences.fixMode` is missing from `developer-config.json`, always treat it as `"report-first"`. Do not ask the user — just use the default and announce it.

## `additionalSkills` Compatibility

> **Internal contract only.** These forms exist for backward compatibility across different AI hosts (Copilot, OpenCode, Codex, etc.), each of which stores skill files in different paths. Users do not choose the form — skills always write the canonical extensible form when saving. Readers must tolerate all three forms.

Readers must support all of these forms:

### Legacy Single-Path Form

```json
{
  "name": "frontend-react-best-practices",
  "path": ".agents/skills/frontend-react-best-practices/SKILL.md",
  "purpose": "Use when working on React UI code."
}
```

### Legacy Host-Specific Form

```json
{
  "name": "frontend-react-best-practices",
    "opencodePath": ".opencode/skills/frontend-react-best-practices/SKILL.md",
  "githubPath": ".github/skills/frontend-react-best-practices/SKILL.md",
  "purpose": "Use when working on React UI code."
}
```

### Canonical Extensible Form

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

### Read Fallback Order

When selecting a skill path for the current host, use this order:

1. `paths[currentHost]`
2. `path`
3. legacy host-specific fields such as `githubPath`, `opencodePath`, `claudePath`, `cursorPath`, `windsurfPath`, `geminiPath`, `kiloPath`, `kimiPath`, `codexPath`

Do not remove legacy fields during unrelated updates.

## Mutation Rules

- Additive changes only by default.
- Do not silently rename or repurpose existing keys.
- If a future migration is unavoidable, skills must remain tolerant readers until upgrade tooling can migrate old configs automatically.
