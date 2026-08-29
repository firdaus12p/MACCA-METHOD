# Brainstorm Session Policy

## Table of Contents

1. Purpose
2. Shared Preferences
3. Discovery Depth
4. Interview Pace
5. Recommendations Toggle
6. Session Setup Rules
7. Recommended Prompt Patterns

## Purpose

This file defines shared session behavior for all `brainstorm-*` skills.

The caller skill must read `language-config.md` and `config-mutation.md` before using persisted preferences.

## Shared Preferences

Brainstorm skills may use `brainstormPreferences` in
`.agents/developer-config.json` to persist session behavior across sessions.

Currently supported fields:

```json
{
  "brainstormPreferences": {
    "discussionMode": "one-by-one",
    "recommendations": true,
    "discoveryDepth": "standard"
  }
}
```

Accepted `discussionMode` values: `"one-by-one"`, `"three-at-a-time"`, `"all-at-once"`.

Accepted `discoveryDepth` values: `"quick"`, `"standard"`, `"critical"`.

## Discovery Depth

Depth controls detail, not whether mandatory safety topics are skipped:

- `quick` — prototype or small internal experiment; concise answers and fewer follow-ups. Use only when the user explicitly identifies the project as disposable/prototype work.
- `standard` — default production depth.
- `critical` — deeper evidence, failure, security, recovery, and operational detail for payments, sensitive/regulated data, multi-tenancy, public uploads/webhooks, privileged administration, high availability, or material financial/legal impact.

Determine depth from existing evidence before asking:

1. Start from a saved valid value if present.
2. If current evidence shows critical-risk signals, escalate the active depth to `critical` even when a saved value is `quick` or `standard`.
3. Select `quick` only from explicit user intent for disposable prototype/internal work.
4. Otherwise use `standard`.

Announce the selected depth with the saved pacing. The user may override it, but do not add a separate setup question merely to choose depth.

## Interview Pace

Brainstorm skills may batch questions when the user explicitly wants faster progress. This is separate from approval gates in execution skills.

Allowed pace strategies:

- `one-by-one` — one topic per turn
- `three-at-a-time` — three topics in one message
- `all-at-once` — all topics in one message; the user answers all of them, then the AI writes the document

### Important Difference

- Interview pace is for discovery-heavy `brainstorm-*` workflows.
- Approval and risk confirmation in `developer`, `bug-fix`, `spec-init`, and similar skills must still stay limited to one decision topic per pause.

## Recommendations Toggle

Use `brainstormPreferences.recommendations` as a persistent preference:

- `true` — research first, then present recommendations with reasoning
- `false` — ask questions without recommendations

## Session Setup Rules

When a brainstorming skill starts:

1. Read `languagePreferences` via `language-config.md`.
2. Read `brainstormPreferences` if present.
3. **Announce the session** before asking anything:
   - If preferences are already saved, announce and proceed in the same response. The user may override them at any time:
      ```
      This session has [N] topics.
      Saved preferences: [pacing] | recommendations: [on/off] | depth: [quick/standard/critical]
      Using these settings. Type different settings at any time.
      ```
   - If no preferences are saved — ask both before starting:
     ```
     This session has [N] topics. Two things before we start:
     1. Pace: (A) one by one  (B) three at a time  (C) all at once
      2. Answer recommendations: should the AI suggest answers for each question? (Y/N)
      Depth defaults to standard and increases automatically for sensitive systems. Type quick/standard/critical only to override it.
     ```
4. Save the chosen preferences. Preserve all unrelated config fields when writing the update.

## Recommended Prompt Patterns

For pace:

```text
This session has [N] topics. Choose one by one, three at a time, or all at once.
```

For recommendations:

```text
Should I provide recommendations based on current best practices?
```

Use brief questions. These settings should speed up the session, not add friction.
