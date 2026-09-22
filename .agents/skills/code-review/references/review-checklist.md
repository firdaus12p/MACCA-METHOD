# Code Review Checklist

Follow `../../_shared/references/interaction-contract.md` loaded through the parent skill. Reuse current unchanged sources already read; refresh changed sources or unknown/compacted context. Delegates must read this checklist before reviewing. All checks below remain mandatory to assess internally: perform applicable checks, retain evidence, and mark only genuinely inapplicable checks `N/A` with a reason. Missing required evidence is `NOT VERIFIED`, never `N/A` or an assumed pass.

## Table of Contents

1. Phase 1 - 27 Code Quality Points
2. Phase 2 - Essential Security
3. Self-Review Before Reporting
4. Phase 3 - Report & Fix
5. Post-Fix Validation
6. Completion Handoff
7. Key Points

## Phase 1 - 27 Code Quality Points (All Required)

Check CR-01 through CR-27 without skipping. Continue to Phase 2 only after all 27 are reviewed.

### Level 1: BLOCKER

- **CR-01 Hallucinated / Wrong Imports** - verify every import/require against installed APIs
- **CR-02 Runtime Errors** - trace data flow for crashes and undeclared values
- **CR-03 Unhandled Null / Undefined** - verify safe access and default values
- **CR-04 SQL Injection** - no string interpolation in queries
- **CR-05 Deprecated Methods** - check current library guidance

### Level 2: MAJOR

- **CR-06 Duplicate Functions** - search the codebase with the host's available symbol, graph, or content-search tool before accepting a new helper
- **CR-07 Unused Code** - imports, variables, functions
- **CR-08 Duplicate / Redundant Code Blocks** - consolidate repeated logic
- **CR-09 Stale Code Not Removed** - commented code, TODOs, replaced paths
- **CR-10 Inconsistent Naming** - align with `project-context/rules.md`
- **CR-11 Ignoring Existing Code** - ensure the solution fits the codebase
- **CR-12 Missing Dependencies** - imported but not declared, or wrong version
- **CR-13 Dependency Conflicts** - peer/version mismatches
- **CR-14 Memory Leaks** - listeners, timers, subscriptions, connections
- **CR-15 Security Ignored** - sensitive surfaces were not reviewed deeply enough
- **CR-16 Missing API Rate Limits** - no handling around repeated external API calls
- **CR-17 Missing Required Tests** - new logic lacks the tests required by `rules.md`; call it a TDD violation only when test-first is explicitly required

### Level 3: MINOR

- **CR-18 Missed Edge Cases**
- **CR-19 Tests Cover Only Happy Paths**
- **CR-20 Performance Issues**
- **CR-21 Outdated Patterns**
- **CR-22 Under-Engineering**
- **CR-23 Over-Engineering**
- **CR-24 Environment Assumptions**

For **CR-23**, prefer these tags:

- `delete:` dead code or unnecessary flexibility
- `stdlib:` a standard-library replacement exists
- `native:` a native platform/framework feature exists
- `yagni:` abstraction/configuration/layer with no real variation
- `shrink:` same behavior, fewer lines

Never mark a single smoke test, regression test, or safety guard as bloat.

Assess CR-22 and CR-23 together: the smallest design must still satisfy current requirements, applicable security/integrity controls, maintainability, and meaningful validation. Justify a "best practice" finding with relevant project evidence or version-appropriate official guidance, not taste or novelty. Do not recommend custom high-risk replacements merely to remove a dependency. Escalate severity according to concrete impact; an under-engineered security or correctness failure is not automatically MINOR.

### Level 4: INFO

- **CR-25 Missing Comments**
- **CR-26 Jargon Without Clarity**
- **CR-27 Unbalanced Comment Quality**

## Phase 2 - Essential Security

Check all of these:

- **SEC-01 Injection Prevention** - SQL, shell, eval-style execution
- **SEC-02 Authentication** - password hashing, cookie attributes, safe error messages
- **SEC-03 Authorization** - deny-by-default, ownership checks, mass assignment
- **SEC-04 XSS Prevention** - innerHTML, dangerouslySetInnerHTML, safe templating
- **SEC-05 API Security** - rate limiting, CORS, JWT verification, filtered responses
- **SEC-06 Data Protection & Logging** - no sensitive logs, no hardcoded secrets
- **SEC-07 Safe Error Handling** - fail-closed, no swallowed exceptions
- **SEC-08 Input Validation** - runtime validation for body/params/query/header/cookie
- **SEC-09 Framework-Specific Security** - read `architecture.md` to detect the framework in use, then apply the relevant checks below. If the framework is not listed, apply equivalent checks for CSRF, secret management, auth middleware coverage, and input sanitization.
  - **Next.js**: no sensitive data in `NEXT_PUBLIC_*` env vars; Server Actions validate auth before execution; `middleware.ts` covers all protected routes with no bypass; no wildcard `*` in `next.config.js` image domains; `dangerouslySetInnerHTML` is avoided or sanitized with DOMPurify
  - **Laravel**: CSRF tokens exist on all POST/PUT/DELETE forms and Ajax requests; SQL uses Eloquent or parameterized queries; `.env` is not committed; Sanctum/Passport is configured correctly
  - **Django**: `ALLOWED_HOSTS` is set for production; `CSRF_TRUSTED_ORIGINS` is configured; `SECRET_KEY` is not hardcoded or exposed; `DEBUG=False` is enforced in production settings
  - **Express / Fastify / NestJS**: `helmet` is configured; CORS is limited to known origins (no wildcards in production); `body-parser` size limits are set; raw `req.body` is not passed directly into queries or shell commands
  - **Rails**: strong parameters are enforced for all mass assignment; CSRF protection is not disabled; secrets are stored in `credentials.yml.enc`, not plain text
- **SEC-10 Dependency Vulnerabilities** - note known CVEs in packages used in this phase. Run the applicable installed audit command only when network policy permits; never install audit tooling during review. Mark critical/high issues in direct dependencies as MAJOR.

## Self-Review Before Reporting

Before producing the report:

1. Verify that all 27 CR checks and 10 SEC checks were actually reviewed.
2. Recheck touched code for duplicate functions and hallucinated imports using fresh source already in context; read changed or missing sections instead of repeating unchanged file I/O.
3. Recheck severity proportionality.
4. Ask whether rerunning after fixing the current findings would reveal new findings. If yes, include them now.

## Phase 3 - Report & Fix

**Clean result:** Return evidence internally to developer, quick-dev, or bug-fix for one combined summary at the origin. Do not print the full clean checklist, zero-count table, or another mode announcement. A standalone review shows a compact result with reviewed scope, actual status, validation evidence, and limitations. Detailed check evidence remains available on request.

**Findings or requested detail:** Use this report structure for findings; expand the internal checklist/evidence when requested. Missing required evidence and its owner must always be visible, even with zero findings. Omit empty headings and zero-count tables unless useful.

```markdown
## Code Review Report

**Task/Phase:** [name]
**Scope:** [reviewed files]
**Status:** [💥 BLOCKER | 🔴 MAJOR | ⚠️ MINOR | NOT VERIFIED | ✅ PASS]

### Summary

| Category   | Count |
| ---------- | ----- |
| 💥 Blocker | X     |
| 🔴 Major   | X     |
| ⚠️ Minor   | X     |
| ℹ️ Info    | X     |
```

Then list all findings by severity using the shared four-point format. Include affected or unverified checks; include the full checklist status table only on request. Do not suppress findings to make a report compact.

Before a report-first gate, retain this fix manifest for actionable findings:

```markdown
### Fix Manifest

| Finding | Target   | Intended change  | Validation       |
| ------- | -------- | ---------------- | ---------------- |
| [ID]    | `[path]` | [bounded change] | [targeted check] |
```

Return plan-status completion and deviation notes to `developer`. Do not add a status-only finding to obtain mutation approval. An explicitly requested bounded plan correction must be disclosed as such; it does not authorize marking a whole phase done.

Format every finding with the shared `finding-format.md` loaded by the parent skill. Keep exact technical targets and validation in the fix manifest, not as a fifth finding point.

Fix priority - follow `fixMode` from Shared Runtime Setup:

**`report-first` (default):**

- **When actionable findings exist (`💥 BLOCKER`, `🔴 MAJOR`, or actionable `⚠️ MINOR`):** Present all findings and the fix manifest. Show the gate prompt (`[GATE — Mode: report-first]`) from the shared runtime contract (`fix-mode.md`) once. **End the response. DO NOT apply any fixes in the same response.** On approval, follow the Approval Resume Protocol without another question.
- **When all applicable required checks pass (including INFO-only reports):** Return `Status: ✅ PASS`, notes, and evidence to the origin for its combined summary; show a compact result if standalone. **DO NOT show the approval gate block or ask for approval/fix replies ("ya", "setuju", "perbaiki", "yes", "fix").** Do not edit plan status.
- **When required evidence is missing:** Report `NOT VERIFIED`, identify the evidence/owner, and apply shared Gate Eligibility. Zero actionable findings is not sufficient for PASS; do not fabricate a fix manifest.

**`fix-then-report`:**

- `💥 BLOCKER` -> fix now
- `🔴 MAJOR` -> fix before the next phase
- `⚠️ MINOR` -> report and discuss
- `ℹ️ INFO` -> backlog
- `✅ PASS` -> no fixes needed, return evidence to the origin without editing plan status

## Post-Fix Validation

Before claiming remediation completion:

1. Run the narrowest relevant tests and available type/lint/build checks.
2. Recheck the approved findings and directly affected CR/SEC items only.
3. If validation fails, repair within approved scope and validate one more time.
4. Report every approved ID as `resolved`, `partial`, or `unresolved`, with command/check evidence.
5. Do not start a fresh unbounded finding pass. Newly noticed unrelated work is reported separately and is not auto-fixed.

## Completion Handoff

Retain the review unit, origin/return step, approved scope/files and IDs, criteria, checked sources/freshness, validation evidence, pending issues, and next action. Keep this context in the session without secrets or a new state file. A clean result is consolidated at the origin; findings and missing evidence are shown when discovered. Use plain language outside exact keys, IDs, paths, and gate markers.

- **Standalone:** End with the report. Do not mutate Task.md or plan status automatically, even when every check passes or a phase plan exists.
- **Task or bug review:** Return evidence to quick-dev, developer's selected task, or bug-fix at the retained return step. A task review never marks the whole phase done.
- **Phase review:** Return the result and any plan-level deviations to developer's `close-phase.md`. Developer owns status completion after all phase tasks, formal spec sync, applicable DoD, and both gates pass.

Plan deviations mean disagreement with an explicit plan decision (library, architecture, scope, or approach), not merely naming, formatting, tests, performance, or security findings. Report what differed and how it was resolved; the phase owner records useful Code Review Notes. Do not create an artifact for a standalone report unless requested.

## Key Points

- Read the existing code before writing or recommending a new helper.
- Verify imports and runtime APIs.
- Security review is mandatory.
