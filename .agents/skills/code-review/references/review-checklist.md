# Code Review Checklist

## Table of Contents

1. Phase 1 - 27 Code Quality Points
2. Phase 2 - Essential Security
3. Self-Review Before Reporting
4. Phase 3 - Report & Fix
5. Post-Fix Validation
6. Key Points

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

Before a report-first gate, retain this fix manifest for actionable findings:

```markdown
### Fix Manifest
| Finding | Target | Intended change | Validation |
|---|---|---|---|
| [ID] | `[path]` | [bounded change] | [targeted check] |
```

If the workflow will update a phase plan status or append Code Review Notes, include that plan file and mutation in the manifest. Otherwise return plan-status completion to `developer`; approval never authorizes an undisclosed plan edit.

Format every finding with the shared `finding-format.md` loaded by the parent skill. Keep exact technical targets and validation in the fix manifest, not as a fifth finding point.

Fix priority - follow `fixMode` from Shared Runtime Setup:

**`report-first` (default):**
Present the full report and fix manifest. Show the gate prompt from the shared runtime contract loaded by the parent skill. **End the response. DO NOT apply any fixes in the same response.** On approval, follow the Approval Resume Protocol without another question.

**`fix-then-report`:**
- `💥 BLOCKER` -> fix now
- `🔴 MAJOR` -> fix before the next phase
- `⚠️ MINOR` -> report and discuss
- `ℹ️ INFO` -> backlog

## Post-Fix Validation

Before updating plan status or claiming completion:

1. Run the narrowest relevant tests and available type/lint/build checks.
2. Recheck the approved findings and directly affected CR/SEC items only.
3. If validation fails, repair within approved scope and validate one more time.
4. Report every approved ID as `resolved`, `partial`, or `unresolved`, with command/check evidence.
5. Do not start a fresh unbounded finding pass. Newly noticed unrelated work is reported separately and is not auto-fixed.

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
