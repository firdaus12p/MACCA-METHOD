# Brainstorm Session Policy

## Purpose

This file defines shared session behavior for all `brainstorm-*` skills.

The caller skill must read `runtime-config.md` before this file.

## Shared Preferences

Brainstorm skills may use `brainstormPreferences` in
`.agents/developer-config.json` to persist session behavior across sessions.

Currently supported fields:

```json
{
  "brainstormPreferences": {
    "discussionMode": "one-by-one",
    "recommendations": true
  }
}
```

Accepted `discussionMode` values: `"one-by-one"`, `"three-at-a-time"`, `"all-at-once"`.

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

1. Read `languagePreferences` via `runtime-config.md`.
2. Read `brainstormPreferences` if present.
3. **Announce the session** before asking anything:
   - If preferences are already saved — show a short confirmation and allow changes:
     ```
     This session has [N] topics.
     Saved preferences: [pacing] | recommendations: [on/off]
     Continue with these settings? Or type the changes you want.
     ```
   - If no preferences are saved — ask both before starting:
     ```
     This session has [N] topics. Two things before we start:
     1. Pace: (A) one by one  (B) three at a time  (C) all at once
     2. Answer recommendations: should the AI suggest answers for each question? (Y/N)
     ```
4. Save the chosen preferences. Preserve all unrelated config fields when writing the update.

## Recommended Prompt Patterns

For pace:

```text
This session has [N] topics. Do you want to discuss them one by one or three at a time?
```

For recommendations:

```text
Should I provide recommendations based on current best practices?
```

Use brief questions. These settings should speed up the session, not add friction.
