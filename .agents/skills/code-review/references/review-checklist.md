# Code Review Checklist

## Table of Contents

1. Phase 1 - 27 Code Quality Points
2. Phase 2 - Essential Security
3. Self-Review Before Reporting
4. Phase 3 - Report & Fix
5. Key Points

## Phase 1 - 27 Code Quality Points (All Required)

Check CR-01 through CR-27 without skipping. Continue to Phase 2 only after all 27 are reviewed.

### Level 1: BLOCKER

- **CR-01 Hallucinated / Wrong Imports** - verify every import/require against installed APIs
- **CR-02 Runtime Errors** - trace data flow for crashes and undeclared values
- **CR-03 Unhandled Null / Undefined** - verify safe access and default values
- **CR-04 SQL Injection** - no string interpolation in queries
- **CR-05 Deprecated Methods** - check current library guidance

### Level 2: MAJOR

- **CR-06 Duplicate Functions** - grep first before accepting a new helper
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
- **CR-17 No Tests (TDD Violation)** - missing tests for new logic

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
- **SEC-10 Dependency Vulnerabilities** - note if packages used in this phase have known CVEs. Mark MAJOR for critical/high severity in direct dependencies. Check `npm audit`, `pnpm audit`, `pip audit`, `composer audit`, or `bundle audit` as applicable.

## Self-Review Before Reporting

Before producing the report:
1. Verify that all 27 CR checks and 10 SEC checks were actually reviewed.
2. Quickly reread touched files for duplicate functions and hallucinated imports.
3. Recheck severity proportionality.
4. Ask whether rerunning after fixing the current findings would reveal new findings. If yes, include them now.

## Phase 3 - Report & Fix

Use this report structure:

```markdown
## Code Review Report

**Task/Phase:** [name]
**Scope:** [reviewed files]
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

For each finding, use EXACTLY this structure. MUST NOT show code in any point:

```markdown
#### [Severity] [ID] [Short Title]

**Where?**
[Page or file name only]

**What happens if it is not fixed?**
[Explain the impact in simple app-level logic. Short and direct.]

**What happens if it is fixed?**
[Explain the practical benefit in simple app-level logic. Short and direct.]

**Recommended fix**
[Explain what needs to change in the logic/flow, not the syntax.]
```

Finding rules:
- `Where?` should name only the page/file, not code symbols or noisy technical paths.
- `Not fixed?` must describe a real app/user consequence, not technical jargon.
- `Fixed?` must describe a practical benefit, not jargon.
- `Recommendation` must explain change logic, not code or a diff.
- MUST NOT add a 5th point or a `Why this fix?` section.
- If a checklist item has no issue, MUST NOT create an empty finding just to fill the format.

Fix priority - follow `fixMode` from Shared Runtime Setup:

**`report-first` (default):**
Present the full report. Show the gate prompt from `../_shared/references/runtime-config.md § Fix Mode Contract`. **End the response. DO NOT apply any fixes in the same response.** Wait for user confirmation in the next message.

**`fix-then-report`:**
- `💥 BLOCKER` -> fix now
- `🔴 MAJOR` -> fix before the next phase
- `⚠️ MINOR` -> report and discuss
- `ℹ️ INFO` -> backlog

## Plan Status Update (run after all fixes are done)

After fixes are applied and the review is complete, check whether a plan file exists for this phase (`project-context/plans/phase-[N]-*.md`). If it does:

**Step 1 - Detect plan-level deviations.**

A plan-level deviation is any finding where the implementation differs from a decision explicitly stated in the plan, for example:
- The wrong library was used (the plan says Prisma, the code uses Drizzle)
- The architectural pattern was not followed (the plan says repository pattern, the code puts queries in the controller)
- Scope was expanded or reduced compared to the plan
- The approach changed during implementation without a plan update

Code quality findings are **not** plan deviations - naming issues, missing tests, performance, formatting, and security hardening do not count as plan deviations even if marked BLOCKER/MAJOR.

**Step 2 - Update the plan file.**

- **If plan-level deviations were found:**
  1. Add this section at the bottom of the plan file:
     ```markdown
     ## Code Review Notes

     **Reviewed:** [YYYY-MM-DD]
     **Plan deviations found:**

     - [Deviation 1 - short description of what differed and how it was resolved]
     - [Deviation 2 - ...]

     > These deviations were identified during code review. The implementation was corrected where possible. See the review report for full detail.
     ```
  2. Update the plan header: `status: code-review` -> `status: done`

- **If no plan-level deviations were found (only code-quality findings):**
  1. Update only the plan header: `status: code-review` -> `status: done`
  2. Do not add a notes section.

## Key Points

- Read the existing code before writing or recommending a new helper.
- Verify imports and runtime APIs.
- Security review is mandatory.
