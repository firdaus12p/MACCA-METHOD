# Brainstorm Session Policy

## Purpose

This file defines the shared session setup for all `brainstorm-*` skills.

Read `../references/runtime-config.md` first when a brainstorming skill needs
language preferences or shared config behavior.

## Shared Preferences

Brainstorming skills may use `brainstormPreferences` in
`.agents/developer-config.json` to remember session behavior across runs.

Supported fields today:

```json
{
  "brainstormPreferences": {
    "discussionMode": "one-by-one",
    "recommendations": true
  }
}
```

Accepted values for `discussionMode`: `"one-by-one"`, `"three-at-a-time"`, `"all-at-once"`.

## Interview Pacing

Brainstorm skills may batch questions when the user explicitly wants faster
progress. This is different from approval gates in execution skills.

Allowed pacing strategies:

- `one-by-one` — one topic per turn
- `three-at-a-time` — three topics sent together in one message
- `all-at-once` — all topics sent in one message; user answers all, then AI generates the document

### Important Distinction

- Interview pacing is for discovery-heavy `brainstorm-*` workflows.
- Approval and risk confirmations in `developer`, `bug-fix`, `spec-init`, and
  similar skills should stay focused on one decision topic per pause.

## Recommendations Toggle

Use `brainstormPreferences.recommendations` as a persistent preference:

- `true` — research first, then present a recommendation with reasoning
- `false` — ask questions without recommendations

## Session Setup Rules

When a brainstorming skill starts:

1. Read `languagePreferences` using `runtime-config.md`.
2. Read `brainstormPreferences` if present.
3. **Announce the session** before asking anything:
   - If preferences already saved — show a brief confirmation and allow override:
     ```
     Sesi ini ada [N] topik.
     Preferensi tersimpan: [pacing] | rekomendasi: [aktif/nonaktif]
     Lanjutkan dengan pengaturan ini? Atau ketik perubahan yang kamu mau.
     ```
   - If preferences missing — ask both before starting:
     ```
     Sesi ini ada [N] topik. Dua hal sebelum kita mulai:
     1. Pacing: (A) satu per satu  (B) tiga sekaligus  (C) semua sekaligus
     2. Rekomendasi jawaban: AI berikan saran jawaban di tiap pertanyaan? (Y/N)
     ```
4. Save chosen preferences. Preserve all unrelated config fields when saving changes.

## Recommended Prompt Pattern

For pacing:

```text
This session has [N] topics. Do you want to cover them one by one or three at a time?
```

For recommendations:

```text
Should I provide recommendations based on current best practices?
```

Use concise questions. The setup exists to speed the session up, not to create
extra friction.