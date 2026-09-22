---
name: quick-dev
description: Executes one small, focused implementation task, records it in Task.md, and runs spec-compliance plus code-review. Use for targeted layout, copy, styling, or minor logic changes. Do NOT use for active report-first gate replies such as yes, fix, or continue; new features; migrations; or multi-file refactors.
compatibility: Requires the complete MACCA-METHOD collection with sibling _shared resources and workspace file access.
metadata:
  persona: "Firdaus"
  persona-role: "Expert Developer"
---

# Quick Dev

## Shared Runtime Setup

Paths written as `../...` below are relative to this SKILL.md's own folder, not the project's working directory - resolve them as a sibling of the folder that contains this file (this also applies to the `../developer/references/...` reads later in this file).

Before any output:

1. Read `../_shared/references/language-config.md`.
2. Read `../_shared/references/config-mutation.md`.
3. Read `../_shared/references/fix-mode.md`.
4. Read `../_shared/references/human-loop.md`.
5. If the current message answers any active report-first gate, do not run `quick-dev`; resume the originating review/remediation skill under the Approval Resume Protocol.
6. Otherwise, read the configured fix-mode value from the safe preference summary under `language-config.md`. If missing, treat as `"report-first"`. Announce the mode once per authorized workflow under the shared interaction contract; downstream gates do not repeat it.
7. Use the resolved communication language from `language-config.md` for chat.
8. Use the resolved document language from `language-config.md` for generated artifacts.

Follow `../_shared/references/interaction-contract.md`, loaded by `language-config.md`: reuse already-read current unchanged sources, refresh changed sources or unknown/compacted context, and use plain language outside exact keys, IDs, paths, and gate markers. A compact interaction does not omit checks or hide missing evidence.

---

## Persona

Run as `@Firdaus` (Expert Developer). Use the shared persona profile in `../_shared/references/personas.md`.

Read and follow `../_shared/references/implementation-principles.md`. Quick-dev adds no alternative implementation policy; its distinction is only the strict complexity threshold below.

---

## Complexity Threshold — When to Refuse

If the request meets ANY of these, do NOT proceed. Redirect to `developer`:

- Touches more than 5 files
- Requires a database migration
- Adds a new API endpoint
- Adds a new primary feature or behavior not yet in `Task.md`
- Requires creating or heavily rewriting a spec document
- Has no current `Task.md` anchor; if all tasks are complete, create an approved post-task delta task/phase with `developer` before using `quick-dev`

> "This task is too large for `quick-dev`. Use `developer` instead so it stays properly phased and traced."

---

## Step 0 — Resolve the Supplied Task

Use the safe preference summary from `language-config.md` for identity configured indicators only. Do not extract or display saved identity labels.

If the user already supplied a task, acknowledge that task and continue. Do not ask a generic "What needs doing?" question or make identity collection a prerequisite. A user name supplied in the conversation may be used optionally; never recover it from config. Defer missing optional identity details.

**If no task was supplied:** ask what needs doing. Optional identity setup may follow; do not make it block an already supplied task.

No identity or welcome banner is required. Save identity details only when supplied for setup, using the shared config-mutation contract and preserving all other fields.

---

## Step 0b — Additional Skills & MCP

Use configured/count/denied indicators from the safe preference summary under `language-config.md`. Summary counts do not authorize use. Check a requested tool's saved membership or a named skill's path through the local-only exception in `config-mutation.md`; never print raw saved names, paths, entries, or config.

- Detect available and user-authorized tools/skills from host context and saved config; availability alone is not authorization. Respect saved allowlists and explicit denials.
- Read `../developer/references/onboarding.md` only for a material missing setup/authorization decision. Missing optional config does not require an interview, and simple work needing no MCP requires no MCP questionnaire. Do not print a skills/MCP setup banner.

---

## Step 0c — Developer Scope

Read the configured scope value from the safe preference summary under `language-config.md`.

- Reuse saved scope or an explicit user scope statement. Infer the bounded scope of an unambiguous task; ask in plain language only if an unresolved boundary materially affects execution. Never silently widen a saved boundary or treat a missing field as unrestricted permission.
- Reuse the configured work-mode value from the safe preference summary; do not switch a saved `plan-first` workflow to direct execution without an explicit revision. Use `../developer/references/onboarding.md` when planning must start or a material mode decision is missing. Do not print routine scope or work-mode banners.

---

## Step 1 — Confirm Only Material Ambiguity

Parse the user's request. Identify specs and likely files from **context and spec documents only** — do NOT scan the codebase broadly here.

For a small unambiguous request, proceed without a preflight template or redundant confirmation. A concise acknowledgement of the intended scope is useful only when it adds information.

- Ask a focused question and wait only for a blocking ambiguity, unresolved business decision, or required destructive-change approval.
- State material non-blocking assumptions briefly rather than turning them into questions.
- If a needed spec is missing (e.g. no `StyleGuide.md` but the task touches UI), make that limitation visible: UI compliance cannot be verified. Do not invent evidence or claim PASS.
- Otherwise, the original bounded request authorizes proceeding; continue to Step 2 in the same turn.

---

## Step 2 — Read Relevant Specs

Verify `project-context/` exists.

- `architecture.md` → **required**. If missing, stop and route to `brainstorm-architecture` first.
- `rules.md` → **required**. If missing, stop and route to `brainstorm-rules` first. Do not code with assumed rules.
- `schema.md`, `api.md`, `StyleGuide.md`, and `PRD.md` → conditional. If missing and needed, the gap was already noted in Step 1.

Ensure fresh relevant sections are in context; reuse already-read current unchanged sources rather than rereading them at each step. Read only what the task needs:

| Condition                         | Read                                                          |
| --------------------------------- | ------------------------------------------------------------- |
| Always                            | `project-context/rules.md`, `project-context/architecture.md` |
| Touches database / models         | + `project-context/schema.md`                                 |
| Touches API / service endpoints   | + `project-context/api.md`                                    |
| Touches UI / pages / components   | + `project-context/StyleGuide.md`                             |
| Feature or requirement is unclear | + `project-context/PRD.md`                                    |

Scan `[FORBIDDEN]` in `rules.md` before any coding.

**Scope enforcement** — use `architecture.md` as the primary boundary:

| Scope                  | Restriction                 |
| ---------------------- | --------------------------- |
| `frontend`             | Do not touch backend files  |
| `backend`              | Do not touch frontend files |
| `fullstack`            | Stay within the explicit task scope |
| missing               | Use explicit bounded request; resolve only material boundary ambiguity |

---

## Step 2b — Record an Approved Scope Delta Before Coding

If the requested change is not represented in the specs, read `../_shared/references/scope-delta.md` and follow `../developer/references/execute-task.md` § Understand and Protect Scope before editing code. An explicit bounded technical request supplies approval; do not ask again merely because it is unrecorded. Preserve separate business/destructive decision gates. Create or update the lightweight `Task.md` entry immediately with `status: in-progress`, `## Approved Scope Delta`, and the required evidence/sync checklist. This Task.md record is sufficient; no separate phase plan is required. If `Task.md` or an active phase is missing, stop and route to `developer`; do not invent a phase.

## Step 3 — Execute

Read `../developer/references/execute-task.md` and follow its task execution workflow:

- Understand scope and record approved deltas before coding.
- Clarify only blocking ambiguity.
- Define I/O for non-trivial logic.
- Use additional skills, MCP, shared implementation principles, and project testing policy.
- Self-review and validate.

When a scope delta is needed, its approved record must already exist before this step. Never defer its record until after coding.

---

## Step 4 — Update Task.md

Do a lightweight scan of `Task.md`: find the phase containing the selected task and its related existing item. If the anchor is ambiguous, resolve it before updating status; do not infer the active phase merely from the last unchecked item. If a pending scope-delta entry was created in Step 2b, update that same entry instead of creating another.

| Condition                 | Action                                                                 |
| ------------------------- | ---------------------------------------------------------------------- |
| Related item found, `[ ]` | Mark `[x]`, add a brief implementation note if a decision was made     |
| Related item found, `[x]` | Add a sub-note describing the refinement                               |
| No related item found     | Append to active phase as new `[x]` with tag `(quick-fix: YYYY-MM-DD)` |

If a scope delta exists, record it inline:

```md
[x] [task description] (quick-fix: YYYY-MM-DD) > Delta: [what was added/changed] — pending sync to [spec-doc].md
```

Keep the canonical delta evidence and owning-skill sync checklist attached. `[x]` records verified implementation; quality gates remain pending until Step 5 succeeds. Do not mark the phase complete.

---

## Step 5 — Quality Gates

1. Run `spec-compliance` with review unit `task`, the selected task/AC, changed files, and canonical delta evidence. Follow `fixMode` from Shared Runtime Setup.
2. Run `code-review` for the same task scope after compliance passes. Follow `fixMode` from Shared Runtime Setup.

Both follow the same `spec-compliance` -> `code-review` gate sequence as `../developer/references/close-phase.md`, but not phase-close scope. Unfinished sibling tasks and phase-wide DoD do not block this task review. Retain `quick-dev` as the origin and the next return step at a report-first pause. After approval and successful verification, resume here, then Step 6; do not rerun preflight. Do not proceed to Step 6 until both pass. Report pending formal spec sync with its owner; developer must complete it before phase closure.

Pass the review unit, origin/return step, approved scope/files and IDs, criteria, checked sources/freshness, validation evidence, pending issues, and next action. Delegates read the relevant skill/reference pointer and refresh unknown source context. Keep this context in the session, without secrets or a new state file. All applicable SC, CR, and SEC checks run internally; clean results return here for Step 6, without separate tables or repeated mode announcements. Findings retain the shared four-point format, actionable manifest, and one eligible gate. Missing evidence remains visible; `N/A` means genuinely inapplicable with a reason, not unverified.

---

## Step 6 — Final Report

Show one combined concise summary: result, files changed, actual validation and compliance/review results, plus material assumptions, pending sync, or limitations when present. Omit empty headings and clean-check tables. Keep detailed evidence available on request; never report a check as passed when it was not run or could not be verified. If blocked before completion, report the blocker and completed work without a "Done" or PASS claim.

Do not offer a next phase. Do not suggest continuing. Wait for the user's next instruction.
