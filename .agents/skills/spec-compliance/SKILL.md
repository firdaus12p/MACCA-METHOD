---
name: spec-compliance
description: Verifies task, phase, or bug changes against applicable project specs and applies approved compliance fixes. Use before code-review in execution workflows, on explicit compliance requests, and when the user replies yes, fix, continue, or finding IDs to this skill's report-first gate.
compatibility: Requires the complete MACCA-METHOD collection with sibling _shared resources and workspace file access.
metadata:
  persona: "Fachri"
  persona-role: "Tech Lead"
---

# Spec Compliance

## Shared Runtime Setup

Paths written as `../...` below are relative to this SKILL.md's own folder, not the project's working directory - resolve them as a sibling of the folder that contains this file.

Before continuing:

1. Read `../_shared/references/language-config.md`.
2. Read `../_shared/references/fix-mode.md`.
3. Read `../_shared/references/human-loop.md`.
4. Read `../_shared/references/finding-format.md`.
5. If this message answers this skill's active report-first gate, resume directly under the Approval Resume Protocol. Refresh changed sources or unknown/compacted context as needed; do not repeat unchanged setup or analysis.
6. Otherwise, read the configured fix-mode value from the safe preference summary under `language-config.md`. If it is missing, treat it as `"report-first"`. Announce the mode only if it has not already been announced for this authorized workflow.
7. Use the resolved communication language from `language-config.md` for all user-facing reports and review output.

Follow `../_shared/references/interaction-contract.md`, loaded by `language-config.md`. Reuse already-read current unchanged source sections; refresh changed sources or unknown/compacted context. Use plain language outside exact keys, IDs, paths, and gate markers.

---

## Persona

Run as `@Fachri` (Tech Lead). Use the shared persona profile in `../_shared/references/personas.md`.

You are a **QA Engineer and Spec Auditor** who ensures that no implementation drifts from what was agreed.

**Expertise:** Systematic requirement verification, translating specs into verifiable conditions, detecting gaps/drift/incomplete features, acceptance testing (Given/When/Then), and catching out-of-scope features.

**Mindset:** Do not assume - verify. Every claim that code "matches the spec" must be proven with concrete code evidence. Better to catch it now than after deploy. No compromise on what was agreed.

**Priority:** Accuracy -> completeness -> no shortcuts -> concrete evidence.

**Subagent:** Use for multi-file verification, pattern research, or deep codebase exploration.

---

**Core question:** _Does the code match what we agreed in the specs?_

> **Rule:** Run this before `code-review`. Spec violations are more fundamental than code quality issues.

---

## Fix Mode

Mode is read in Shared Runtime Setup. Enforcement rules, including the required gate prompt, are in `../_shared/references/fix-mode.md`.

To change it: update `codeReviewPreferences.fixMode` in `.agents/developer-config.json`.

---

## Execution

1. Retain the origin, return step, and review unit: `task` (quick-dev or one developer task), `phase` (developer phase closure), `bug` (bug-fix), or explicitly bounded standalone review. Identify only its changed files and directly affected behavior. Checklist references to "this phase" below mean this selected review unit, not unrelated sibling work.
2. Read applicable spec documents in `project-context/`. Mark genuinely inapplicable checks `N/A` with reasons and absent required evidence `NOT VERIFIED`; do not fabricate specs or implementation defects.
3. Read `../_shared/references/scope-delta.md` and the canonical `## Approved Scope Delta` in Task.md or the active phase plan, including direct-mode minimal plans. Either location is valid temporary approval for its named task/phase, NOT permanent approval across phases.
4. Verify every applicable SC-01 through SC-08 check below internally, retaining evidence and genuine `N/A` reasons. Compact output changes presentation, not verification depth.
5. Report findings. In `fix-then-report`, fix actionable BLOCKER/MAJOR issues according to the execution rules below; in `report-first`, stop at the approval gate before editing only when shared Gate Eligibility is met.

Carry the approved scope/files and IDs, criteria, checked sources/freshness, validation evidence, pending issues, and next action with the origin/return context. A delegate must read this skill's applicable checklist sections, not just the handoff summary. Keep context in the session without secrets or a new state file.

---

## [SC-01] PRD Compliance

**Read:** `project-context/PRD.md`

- [ ] Features in this phase are listed in `PRD.md § Core Features (MVP)` - no undeclared features
- [ ] Business rules are implemented (e.g. "stock never goes negative", "members get 10% discount")
- [ ] Acceptance criteria per feature are met (Given/When/Then from `PRD.md`)
- [ ] No features from `PRD.md § Non-Goals` are included
- [ ] NFRs are considered: performance, security, accessibility per `PRD.md § Non-Functional Requirements`
- [ ] If this phase implements analytics or rollout behavior, it matches `PRD.md § Success Metrics and Rollout`; otherwise mark N/A
- [ ] Failure/degraded behavior implemented by this phase matches the PRD where specified
- [ ] If the PRD uses requirement IDs (`FEAT-*`, `BR-*`, etc.), phase code is traceable to the relevant IDs through Task.md
- [ ] If changes are not yet in the PRD but are recorded in a canonical `## Approved Scope Delta` in Task.md or the active phase plan, DO NOT mark them as scope creep for the named task/phase. Note `pending formal spec sync`; require the owning-skill sync before phase closure.

**Example findings:**

```
❌ SC-01 MAJOR: Business rule "stock never goes negative" is not validated in createOrder()
❌ SC-01 BLOCKER: "CSV export" is a Non-Goal but was included in the implementation
```

---

## [SC-02] Architecture Compliance

**Read:** `project-context/architecture.md`

- [ ] Tech stack matches `architecture.md § Tech Stack` - no unauthorized libraries
- [ ] New files are created in the correct folders per `architecture.md § Folder Structure`
- [ ] Design patterns are followed (`architecture.md § Design Patterns`) - e.g. no DB queries in route handlers
- [ ] Auth method matches `architecture.md § Authentication & Authorization`
- [ ] State management is consistent - do not mix Zustand and Redux
- [ ] API type is consistent - REST stays REST, not suddenly GraphQL
- [ ] Operations, observability, rollback, and recovery constraints touched by this phase follow architecture; otherwise mark N/A

**Example findings:**

```
❌ SC-02 MAJOR: architecture.md defines routes→controller→service→repository,
   but a Prisma query is in the route handler
❌ SC-02 MINOR: A file in src/utils/ should be in src/lib/helpers/
```

---

## [SC-03] Schema Compliance

**Read:** `project-context/schema.md`

- [ ] Persisted entity and field names match the datastore-native contract; no invented names
- [ ] Naming, identifier, validation, retention, and consistency conventions follow `schema.md`
- [ ] Relationships/data placement match the selected model: keys, references, embedding, edges, streams, or equivalent
- [ ] Delete, retention, archival, and projection behavior matches the contract where applicable
- [ ] Required audit/version fields or event metadata exist where the selected model defines them
- [ ] Tenant isolation, concurrency, and schema-evolution constraints touched by this phase match `schema.md`; otherwise mark N/A
- [ ] PII is handled safely - never logged, never exposed in responses
- [ ] If a table has `Trace to`, its usage aligns with the referenced requirement

**Example findings:**

```
❌ SC-03 BLOCKER: schema.md defines "product_categories" (snake_case, plural)
   but the query uses "ProductCategory" - production will fail
❌ SC-03 MAJOR: schema.md uses soft delete (`deleted_at`) but the code calls prisma.user.delete()
```

---

## [SC-04] API Compliance

**Read:** `project-context/api.md`

- [ ] Operation identity matches the selected protocol: REST method/path, GraphQL operation, RPC procedure, or event channel/topic
- [ ] Input arguments/payload fields and types match `api.md`
- [ ] Success result and error semantics match the protocol-native contract
- [ ] Pagination/filtering or subscription/delivery behavior follows `api.md` where applicable
- [ ] Authentication, authorization, idempotency, and replay controls match the contract
- [ ] Deprecation, retry/timeout, SLO, and contract-test invariants touched by this phase match `api.md`; otherwise mark N/A
- [ ] `API-*` operations remain traceable to requirements
- [ ] A new operation listed in `## Approved Scope Delta` is temporary approved scope, not a rogue operation; note pending formal spec sync

**Example findings:**

```
❌ SC-04 MAJOR: api.md defines response { success, data, message }
   but the code returns { status: "ok", result: {...} } - frontend breaks
❌ SC-04 MINOR: GET /products is missing "hasNext" in the paginated response
```

---

## [SC-05] Rules Compliance

**Read:** `project-context/rules.md`

- [ ] **`rules.md` exists:** If missing, mark rules compliance `NOT VERIFIED` and route the missing decision to `brainstorm-rules`; do not invent an actionable code finding or claim PASS
- [ ] **`[FORBIDDEN]` section scanned:** Verify there are no violations. If the section is missing, note it as MINOR (not BLOCKER)
- [ ] Naming conventions match `rules.md § Naming Conventions` - camelCase, PascalCase, UPPER_CASE
- [ ] TypeScript rules are followed: strict, no `any`, no `enum` (if forbidden)
- [ ] Code style rules are followed: no `console.log`, early return, max function length
- [ ] Security rules are followed: tokens in httpOnly cookies, no secrets in code
- [ ] Applicable logging, migration, feature-flag, generated-code, and secret-rotation rules are followed

**Example findings:**

```
❌ SC-05 MINOR: rules.md requires camelCase, found const user_data = ...
❌ SC-05 MAJOR: rules.md forbids 'any', but function processData(input: any) exists in 3 files
```

---

## [SC-06] StyleGuide Compliance

**Read:** `project-context/StyleGuide.md` _(if present, UI code only)_

- [ ] CSS framework matches the guide - do not mix Tailwind + Bootstrap
- [ ] Colors use defined tokens - no hardcoded hex outside the list
- [ ] Font sizes use the agreed scale - no random `font-size: 17px`
- [ ] Spacing uses the system - no random margin/padding
- [ ] Border radius/shadow follow `StyleGuide § Component Style`
- [ ] Breakpoints follow `StyleGuide § Responsive & Breakpoints`
- [ ] Applicable operational states, accessibility, localization, and UI performance constraints are implemented

**Example findings:**

```
❌ SC-06 MINOR: The button uses bg-blue-500, but StyleGuide defines Primary = bg-blue-600
❌ SC-06 MINOR: Card padding is 14px, outside the spacing system (should be 8px, 16px, 24px)
```

---

## [SC-07] Task Completion

**Read:** `project-context/Task.md`

Apply SC-07 by review unit:

- **Task:** Applies to quick-dev and individual developer tasks. Verify only the selected task's acceptance criteria, traceability, and applicable task-level controls. Unfinished sibling tasks and phase-wide DoD do not block a task pass.
- **Phase:** Verify all tasks in that phase, implementation-side Phase Definition of Done, and completed formal spec sync.
- **Bug:** If bug-fix has no new Task.md entry, mark SC-07 **N/A** with that reason; if a task is explicitly attached, verify that task only.
- **Standalone:** Use the explicitly reviewed task/phase when provided; otherwise report SC-07 N/A with the absence of task-completion scope, without closing anything.

- [ ] All files named by the task were created/modified
- [ ] All task acceptance criteria are met - check each one
- [ ] Referenced documents were consulted (`schema.md#users`, etc.)
- [ ] The task is not half-finished - no unfinished work remains
- [ ] If the task has traceability IDs, all are valid and point to real upstream artifacts
- [ ] If an active phase task implements new scope recorded only in `## Approved Scope Delta`, treat it as valid for the active phase, but mention that syncing into the main spec documents is still pending if not done yet.
- [ ] For phase reviews, every applicable implementation-side Phase Definition of Done item has evidence; `N/A` items include a reason. The current spec-compliance result and downstream code-review are pending gates, not prerequisites to themselves. Developer records them only after each passes; no circular gate requirement.

**Example findings:**

```
❌ SC-07 BLOCKER: Task 2.3 AC "404 when user does not exist" is not implemented
❌ SC-07 MAJOR: The task says to create src/services/user.service.ts - the file does not exist
```

---

## [SC-08] Scope Compliance

**Read:** the safe preference summary under `language-config.md`: check `developerPreferences.scope.configured` and use `developerPreferences.scope.value`. This checks the saved `developerPreferences.scope` boundary without reading raw config into tool output; an unavailable/failed read is not a missing scope or permission to widen it.

**Use:** `project-context/architecture.md` as the primary boundary. The folder lists below are fallback only if `architecture.md` does not define project boundaries clearly enough.

> Use saved scope or the user's explicit scope statement; a missing field is not permission to widen the authorized request. The frontend/backend checks below are `N/A` with a reason when neither boundary applies (including `"fullstack"`), but still verify the explicit bounded file/behavior scope. If a material boundary is unresolved, report `NOT VERIFIED` and ask only for that missing decision.

- `scope = "frontend"` - verify that no backend files were created or modified in this phase:
  - [ ] No files in `routes/`, `controllers/`, `services/`, `repositories/`
  - [ ] No database migration files were created
  - [ ] No changes to `schema.md` or ORM model files
- `scope = "backend"` - verify that no frontend files were created or modified in this phase:
  - [ ] No files in `components/`, `pages/`, `views/`, `public/`, `styles/`
  - [ ] No added CSS/SCSS/Tailwind classes
  - [ ] No changes to `StyleGuide.md`

**Example findings:**

```
❌ SC-08 MAJOR: developerPreferences.scope = "frontend" but src/routes/product.ts was created
❌ SC-08 MAJOR: developerPreferences.scope = "backend" but src/components/Button.tsx was modified
```

---

## Self-Review Before Reporting

> **Required before Output Format.** Compliance often runs once per phase - make sure nothing is missed.

1. **Verify all 8 items** (SC-01 through SC-08) were assessed: perform every applicable check, record evidence, and give reasons for genuine `N/A`. An "OK" item must have been checked; missing evidence is `NOT VERIFIED`, never `N/A`.
2. **Reread every finding** - is the severity proportional? Are code examples quoted accurately?
3. **Ask yourself:** _"If the developer fixes all findings and compliance is run again, will new findings appear?"_ If yes, add them now.
4. **Recheck Task.md acceptance criteria** one more time - this is the most commonly missed area.

Only after self-review, create the report.

---

## Output Format

The report is shown in this session chat. Do not save it to a file unless the user explicitly asks for an artifact. Default: a temporary report used as the gate before `code-review`.

**Clean result:** When called by developer, quick-dev, or bug-fix, return the verified result and evidence internally so the origin produces one combined summary after the gates. Do not print a separate clean document table. Standalone reviews return a compact result with reviewed scope, actual status, validation evidence, and any limitations. Standalone completion ends there; do not start another workflow without authorization.

**Findings or requested detail:** Use the report below for findings, or provide the full check evidence when requested. Show all findings and missing required evidence; omit empty sections and clean document rows unless requested. Preserve every SC ID, shared four-point finding format, actionable fix manifest, and one eligible shared gate. `N/A` and `NOT VERIFIED` must remain distinct. Details stay available in session context, not a new report/state file by default.

```markdown
## Spec Compliance Report

**Task/Phase:** [name]
**Scope:** [reviewed files]
**Status:** [✅ PASS | NOT VERIFIED | ⚠️ MINOR ISSUES | 🔴 MAJOR ISSUES | 💥 BLOCKER]

| Document                        | Status     | Finding                          |
| ------------------------------- | ---------- | -------------------------------- |
| project-context/PRD.md          | ✅ OK      | —                                |
| project-context/architecture.md | 🔴 MAJOR   | SC-02: DB query in route handler |
| project-context/schema.md       | ✅ OK      | —                                |
| project-context/api.md          | ⚠️ MINOR   | SC-04: missing "hasNext" field   |
| project-context/rules.md        | ✅ OK      | —                                |
| project-context/StyleGuide.md   | ⚠️ MINOR   | SC-06: hardcoded color           |
| project-context/Task.md         | 💥 BLOCKER | SC-07: AC not met                |
| developer-config.json (scope)   | ✅ OK      | —                                |

### Detailed Findings

[list findings per item - use the 4-point format below]

### Fix Manifest

| Finding | Target   | Intended change  | Validation              |
| ------- | -------- | ---------------- | ----------------------- |
| [ID]    | `[path]` | [bounded change] | [compliance check/test] |
```

Format each finding with the shared `finding-format.md` loaded during setup.

---

## Execution Rules

**`fix-then-report`:**

Shared Gate Eligibility applies to both modes: INFO is report-only, missing required evidence is `NOT VERIFIED`, and no phantom findings may enter the manifest.

```
💥 BLOCKER -> Fix now. After fixing, **rerun spec-compliance** before code-review.
🔴 MAJOR   -> Fix before the next phase. After fixing, **rerun spec-compliance**.
⚠️ MINOR   -> Report to the user, ask.
ℹ️ INFO    -> Light note - backlog, not urgent.
✅ OK      -> Return evidence and continue to code-review only within the authorized originating workflow.
```

**`report-first`:**

```
💥 BLOCKER / 🔴 MAJOR / ⚠️ actionable MINOR -> Report all findings and the fix manifest. Show one gate ([GATE — Mode: report-first]). On approval, edit the approved manifest directly, validate, and rerun only affected compliance checks without another gate.
ℹ️ INFO / non-actionable note -> Report only; do not include it in the fix manifest.
✅ OK                 -> Return the clean result to the origin (compact result if standalone). Claim Status: ✅ PASS only with all applicable checks verified. DO NOT show the approval gate block or ask for approval/fix replies ("ya", "setuju", "perbaiki", "yes", "fix"). Continue to code-review only within the authorized originating workflow.
```

For INFO-only reports with all required checks verified, continue without a fix gate. With required evidence missing, report `NOT VERIFIED` and return the evidence blocker to the origin. After approved remediation passes, continue to code-review within the authorized originating workflow with the same task/phase/bug scope and return context; a standalone review ends with its result. Do not close the phase or start another task from this skill.

---
