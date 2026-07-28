# Code Review Checklist

## Table of Contents

1. Phase 1 — 27-Item Code Quality
2. Phase 2 — Security Essentials
3. Self-Review Before Reporting
4. Phase 3 — Report & Fix
5. Key Points

## Phase 1 — 27-Item Code Quality (All Required)

Check CR-01 through CR-27 without skipping. Proceed to Phase 2 only after all 27 checked.

### Tier 1: BLOCKER

- **CR-01 Hallucination / Wrong Imports** — verify every import/require against installed APIs
- **CR-02 Runtime Errors** — trace data flow for crashes and undeclared values
- **CR-03 Null / Undefined Not Handled** — verify access safety and defaults
- **CR-04 SQL Injection** — no string interpolation for queries
- **CR-05 Deprecated Methods** — check current library guidance

### Tier 2: MAJOR

- **CR-06 Duplicate Function** — grep first before accepting new helpers
- **CR-07 Unused Code** — imports, variables, functions
- **CR-08 Duplicate / Redundant Code Blocks** — consolidate repeated logic
- **CR-09 Obsolete Code Not Removed** — commented code, TODOs, replaced paths
- **CR-10 Inconsistent Naming** — align with `project-context/rules.md`
- **CR-11 Ignoring Existing Code** — ensure solution fits the codebase
- **CR-12 Dependency Missing** — imported but not declared, or wrong version
- **CR-13 Dependency Conflict** — peer/version incompatibilities
- **CR-14 Memory Leaks** — listeners, timers, subscriptions, connections
- **CR-15 Security Ignored** — sensitive surfaces not reviewed deeply enough
- **CR-16 API Rate Limit Missing** — no handling around repeated external API calls
- **CR-17 No Tests (TDD Violation)** — missing tests for new logic

### Tier 3: MINOR

- **CR-18 Edge Cases Missed**
- **CR-19 Test Only Happy Path**
- **CR-20 Performance Problem**
- **CR-21 Outdated Pattern**
- **CR-22 Under-Engineering**
- **CR-23 Over-Engineering**
- **CR-24 Environment Assumptions**

For **CR-23**, prefer these tags:
- `delete:` dead code or needless flexibility
- `stdlib:` standard library replacement exists
- `native:` platform/framework native feature exists
- `yagni:` abstraction/config/layer with no real variation
- `shrink:` same behavior, fewer lines

Never flag a single smoke test, regression test, or safety guard as bloat.

### Tier 4: INFO

- **CR-25 Missing Comments**
- **CR-26 Jargon Without Clarity**
- **CR-27 Comment Quality Imbalance**

## Phase 2 — Security Essentials

Check all of these:

- **SEC-01 Injection Prevention** — SQL, shell, eval-style execution
- **SEC-02 Authentication** — password hashing, cookie attributes, safe error messages
- **SEC-03 Authorization** — deny-by-default, ownership checks, mass assignment
- **SEC-04 XSS Prevention** — innerHTML, dangerouslySetInnerHTML, safe templating
- **SEC-05 API Security** — rate limiting, CORS, JWT verification, filtered responses
- **SEC-06 Data Protection & Logging** — no sensitive logs, no hardcoded secrets
- **SEC-07 Error Handling Security** — fail-closed, no swallowed exceptions
- **SEC-08 Input Validation** — runtime validation for body/params/query/headers/cookies
- **SEC-09 Framework-Specific Security** — read `architecture.md` to detect the framework in use, then apply the relevant checks below. If the framework is not listed, apply the equivalent: CSRF protection, secret management, auth middleware coverage, and input sanitization.
  - **Next.js**: no sensitive data in `NEXT_PUBLIC_*` env vars; Server Actions validate authentication before execution; `middleware.ts` covers all protected routes with no bypass; no wildcard `*` in `next.config.js` image domains; `dangerouslySetInnerHTML` avoided or sanitized with DOMPurify
  - **Laravel**: CSRF token present on all POST/PUT/DELETE forms and Ajax requests; SQL uses Eloquent or parameterized queries; `.env` not committed; Sanctum/Passport configured correctly
  - **Django**: `ALLOWED_HOSTS` set for production; `CSRF_TRUSTED_ORIGINS` configured; `SECRET_KEY` not hardcoded or exposed; `DEBUG=False` enforced in production settings
  - **Express / Fastify / NestJS**: `helmet` configured; CORS restricted to known origins (no wildcard in production); `body-parser` size limits set; no raw `req.body` passed directly to queries or shell commands
  - **Rails**: strong parameters enforced for all mass assignment; CSRF protection not disabled; secrets in `credentials.yml.enc`, not in plaintext
- **SEC-10 Dependency Vulnerabilities** — note if packages used in this phase have known CVEs. Flag MAJOR for critical/high severity in direct dependencies. Check: `npm audit`, `pnpm audit`, `pip audit`, `composer audit`, or `bundle audit` as applicable.

## Self-Review Before Reporting

Before producing the report:
1. Verify all 27 CR checks and 10 SEC checks were actually reviewed.
2. Re-read the touched files quickly for duplicate functions and hallucinated imports.
3. Re-check severity proportionality.
4. Ask whether a rerun after fixing current findings would reveal new findings. If yes, include them now.

## Phase 3 — Report & Fix

Use this report structure:

```markdown
## Code Review Report

**Task/Phase:** [name]
**Scope:** [files reviewed]
**Status:** [💥 BLOCKER | 🔴 MAJOR | ⚠️ MINOR | ✅ PASS]

### Summary
| Category | Count |
|----------|-------|
| 💥 Blocker | X |
| 🔴 Major | X |
| ⚠️ Minor | X |
| ℹ️ Info | X |
```

Then list findings by severity, followed by the checklist status table.

For each finding, use this structure:

```markdown
#### [Severity] [ID] [Short Title]

**Where?**
- [Exact file, symbol, endpoint, query, or execution path]

**Why is this happening?**
- [Root cause, broken assumption, missing guard, wrong dependency usage, or design flaw]

**What happens if not fixed?**
- [Concrete impact, failure mode, exploit path, maintenance cost, or user-facing risk]

**What happens if fixed?**
- [Concrete improvement after the change]

**Recommended fix**
- [Specific code or design change to make]

**Why this fix?**
- [Reason this recommendation is preferred over other options]
```

Rules for writing findings:
- `Where?` must be specific enough that the user can open the exact place and understand the scope.
- `Why is this happening?` must explain the real cause, not restate the symptom.
- `What happens if not fixed?` must describe the real consequence, not generic wording.
- `What happens if fixed?` must explain the tangible improvement so the user understands the value of the change.
- `Recommended fix` must be actionable, not vague advice like "improve this" or "handle better".
- `Why this fix?` must justify the recommendation with correctness, security, maintainability, consistency, or performance reasoning.
- If no issue is found for a checklist item, do not invent a finding just to fill the format.

Fix priority — honor `fixMode` from Shared Runtime Setup:

**`report-first` (default):**
Present full report. Display gate prompt from `../_shared/references/runtime-config.md § Fix Mode Contract`. **End response. Do NOT apply any fix in the same response.** Wait for user confirmation in the next message.

**`fix-then-report`:**
- `💥 BLOCKER` → fix now
- `🔴 MAJOR` → fix before next phase
- `⚠️ MINOR` → report and discuss
- `ℹ️ INFO` → backlog

## Plan Status Update (run after all fixes are done)

After fixes are applied and the review is complete, check if a plan file exists for this phase (`project-context/plans/phase-[N]-*.md`). If it exists:

**Step 1 — Detect plan-level deviations.**

A plan-level deviation is any finding where the implementation diverged from a decision explicitly stated in the plan — for example:
- Wrong library used (plan said Prisma, code used Drizzle)
- Architectural pattern not followed (plan said repository pattern, code put queries in controller)
- Scope expanded or reduced compared to plan
- Approach changed mid-implementation without update to plan

A code-quality finding is **not** a plan deviation — naming issues, missing tests, performance, formatting, and security hardening do not count as plan deviations even if flagged as BLOCKER/MAJOR.

**Step 2 — Update plan file.**

- **If plan-level deviations were found:**
  1. Append the following section at the bottom of the plan file:
     ```markdown
     ## Code Review Notes

     **Reviewed:** [YYYY-MM-DD]
     **Plan deviations found:**

     - [Deviation 1 — brief description of what differed and how it was resolved]
     - [Deviation 2 — ...]

     > These deviations were identified during code-review. Implementation has been corrected where possible. See review report for full detail.
     ```
  2. Update plan header: `status: code-review` → `status: done`

- **If no plan-level deviations (only code-quality findings):**
  1. Update plan header only: `status: code-review` → `status: done`
  2. Do not append any notes section.

## Key Points

- Read existing code first before writing or recommending new helpers.
- Verify imports and runtime APIs.
- Security review is mandatory, not optional.