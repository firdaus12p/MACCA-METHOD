# Brainstorm Session Policy

## Table of Contents

1. Purpose
2. Shared Preferences
3. Discovery Depth
4. Interview Pace
5. Recommendations Toggle
6. Session Setup Rules
7. Recommended Prompt Patterns
8. Mode Selection and Bounded Completion
9. Planning Scope and Handoff

## Purpose

This file defines shared session behavior for all `brainstorm-*` skills.

Read `planning-principles.md` before discovery recommendations or generating specs/tasks. Apply proportionate planning at every depth; deeper discovery does not automatically require a more complex architecture.

The caller skill must read `language-config.md` and `config-mutation.md` before using persisted preferences. The shared `interaction-contract.md` is loaded automatically through `language-config.md`; follow it for cached reads, compact clean reports, and handoff context. Reuse cached reads only when unchanged and backed by current evidence; refresh changed, stale, or uncertain applicable sections rather than indiscriminately rereading every document.

For a bounded owning-skill sync handoff with an already approved technical delta, read `scope-delta.md` and apply only the named correction. This sync path takes precedence over the caller's new-document interview and generation flow. Reuse the recorded decision and saved preferences; skip fresh discovery/setup interviews. Ask only for a materially new decision or conflict.

## Mode Selection and Bounded Completion

**Decide mode before startup questions.** Inspect user intent, the active approval, owner handoff, and the target document before announcing an interview or asking preferences. The following modes override local new-document instructions:

- **Approved technical sync:** apply the already approved named delta under `scope-delta.md`. No new interview or repeat approval for the same scope. An explicit approval such as "oke mari perbaiki" resumes the bounded work without onboarding.
- **Baseline-completion mode:** a `spec-init` document has `Missing Decisions` selected by the user or an authorized owner handoff. Ask targeted questions only for those unresolved decisions and their material dependencies. This mode gathers missing decisions; it is distinct from approved technical sync, which already has them.
- **Targeted update mode:** the user requests a bounded change to an existing owner document. Reuse settled decisions and ask only about the requested change, new risks, or conflicts.
- **New-document mode:** run applicable discovery for a new document. Full regeneration of an existing document requires an explicit request and approval naming what will be replaced; document existence alone never triggers an overwrite/regeneration interview.

In baseline-completion and targeted update modes:

1. Identify the exact document, sections, decision/requirement IDs, current evidence, and unresolved questions in scope.
2. Retain `Input Evidence`, `Confidence Summary`, stable IDs, unrelated unknowns, and unrelated text. Distinguish a user-approved decision from an observed code fact; do not raise code confidence merely because the user chose a policy.
3. Use current evidence to satisfy already answered mandatory discovery. Ask only missing applicable questions; risk depth still governs affected security, reliability, recovery, and other mandatory topics. Leave unanswered items explicitly unresolved.
4. Present the bounded update and obtain approval before writing, unless the current approval already covers that exact update. Change only approved sections and selected `Missing Decisions` entries; preserve unresolved entries and evidence provenance.
5. Return the changed sections, retained unknowns, approval boundary, and evidence freshness to the caller. Do not run the full template-generation flow unless explicitly requested.

## Planning Scope and Handoff

Resolve planning scope from explicit user context or a valid saved `developerPreferences.scope`. If explicit current context conflicts with the saved scope, clarify that conflict before persisting a change. Persist only user-provided scope through `config-mutation.md`. If scope is absent, announce the `fullstack` working default; do not invent consent or persist the default as a user choice.

Scope is not proof of applicability: require schema only for in-scope persistence, API only for an exposed/consumed contract, and StyleGuide only for in-scope UI. A stateless provider API is valid without schema. Record inapplicable inputs as `N/A` with the reason. For new planning, prioritize PRD → architecture → applicable schema → applicable API → applicable StyleGuide → rules → Task; rules follow all applicable inputs.

Every owner/task handoff carries approved scope, stable IDs, changed sections, input evidence and freshness, unresolved decisions, and the exact authorization boundary. Read fresh applicable sections and their material dependencies; cached summaries alone cannot establish freshness. Recommend one next step in plain language, using the first applicable unmet prerequisite; completion/update returns to its caller when appropriate.

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

Announce the selected depth with the saved pacing when an interview is needed. Users may add context or request more detail; a request for brevity does not suppress mandatory discovery or evidence-backed critical-risk depth. Do not add a separate setup question merely to choose depth.

### User-Facing Language

`quick`, `standard`, and `critical` are internal configuration values. Do not require a non-technical user to understand those terms.

In chat, explain the selected value in plain language:

- `quick` -> **pembahasan ringkas**, only for a disposable prototype or internal experiment
- `standard` -> **pembahasan normal**, the default for a project intended for real use
- `critical` -> **pembahasan sangat mendalam**, used when the project involves money, sensitive data, public uploads/webhooks, privileged administration, high availability, or similar risk

The user does not need to choose a depth explicitly. Tell them the current plain-language level and invite context instead:

```text
Kedalaman pembahasan saat ini: normal.
Anda tidak perlu memahami istilah teknis. Beri tahu jika ini hanya prototype sementara,
atau jika proyek menyangkut uang, data sensitif, atau harus selalu tersedia.
Saya akan menyesuaikan pertanyaan secara otomatis.
```

If the user says the project is only a disposable prototype/internal experiment, that is explicit evidence for `quick`. If the user says they are unsure, keep `standard`. If the project evidence signals high risk, escalate to `critical` automatically and explain why in plain language.

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

After selecting mode:

1. Use the resolved communication/document languages and safe preference summary via `language-config.md`. Read each brainstorm preference's `configured` and `value` fields, preserving a configured `false`; do not interpret a wrapper object as its value or dump raw config. Resolve planning scope from the configured scope value and risk depth from current context. A failed read is not a missing preference.
2. Reuse saved preferences and answers already provided in this conversation. **Ask only missing preferences**, field by field; a saved `recommendations: false` is a valid choice. Never repeat pacing locally or ask both settings when only one is missing.
3. If no interview is needed, proceed with the approved bounded work without setup questions. For a short targeted completion, use existing preferences; announce a working default if needed rather than interrupting a single decision with onboarding. Do not persist an unchosen default.
4. When an interview is needed, briefly announce only the remaining applicable topics, pacing, recommendations, and plain-language depth. With valid preferences, proceed to the first unanswered topic in the same response. For a new interview with missing settings, ask only those missing settings before discovery.
5. Save user-chosen preferences through `config-mutation.md`, preserving unrelated fields. Derived risk depth may control the active session without being represented as user consent.

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
