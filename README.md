# MACCA — Method

**MACCA** is an AI-based software development system that works from **written specifications**, not guesses. Before a single line of code exists, all important decisions are already documented. AI reads those documents before coding, then verifies the result after coding.

> **Macca** comes from Bugis and means *smart, intelligent, capable*. In Bugis-Makassar philosophy, intelligence is always paired with noble character — a moral identity carried everywhere.

![MACCA Method](image-macca-method.webp)

---

## Table of Contents

1. [Problem Solved](#1-problem-solved)
2. [How It Works](#2-how-it-works)
3. [Planning Skills](#3-planning-skills)
4. [Execution Skills](#4-execution-skills)
5. [Utility Skills](#5-utility-skills)
6. [The MACCA AI Team](#6-the-macca-ai-team)
7. [Workflow](#7-workflow)
8. [Installation & Usage](#8-installation--usage)
9. [Configuration](#9-configuration)
10. [Frequently Asked Questions](#10-frequently-asked-questions)
11. [License](#11-license)

---

## 1. Problem Solved

When using AI for coding without clear guidance, these problems are common:

- AI writes code that does not match business needs
- Each AI session seems to "forget" previous project context
- There is no code standard — each file is written in a different style
- It is hard to know when a feature is truly done
- The same bugs appear again and again

**MACCA solves this** by writing all decisions first in spec documents: features, database, API, UI, and code standards. AI reads those documents before coding, then verifies the result after coding.

---

## 2. How It Works

MACCA uses **skills** — structured instructions given to AI to perform specific tasks. Each skill has a clear responsibility and does not overlap.

```
┌──────────────────────────────────────────────────────┐
│                  PLANNING PHASE                     │
│                                                      │
│  brainstorm-prd → brainstorm-architecture            │
│                            ↓                         │
│                       brainstorm-schema              │
│                            ↓                         │
│                       brainstorm-api                 │
│                            ↓                         │
│                 brainstorm-styleguide (optional)     │
│                            ↓                         │
│                       brainstorm-rules               │
│                            ↓                         │
│                       brainstorm-task                │
└──────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│                  EXECUTION PHASE                     │
│                                                      │
│             developer (per Task.md phase)            │
│                 ↓ (after each phase)                 │
│          spec-compliance → code-review               │
└──────────────────────────────────────────────────────┘
```

All planning output documents are stored in `project-context/` in your project.

> **Any time:** you can call `help` to see project status and recommended next steps, or `rapat` if you need a multi-persona discussion before continuing.

---

## 3. Planning Skills

Planning skills run as interview sessions. At the start of each session, AI announces the topic count, then asks two things (if not already saved in config):
1. **Pacing**: (A) one by one · (B) three at a time · (C) all at once
2. **Recommendations**: should AI provide suggested answers for each question?

These choices are saved and reused in future sessions.

---

<details>
<summary><strong>brainstorm-prd</strong> — Create PRD.md (Product Requirements Document)</summary>

**Persona:** @Galbi — Project Manager

**Called when:** Starting a new project for the first time. If `PRD.md` already exists, AI asks before overwriting it.

**Output:** `project-context/PRD.md`

**Topic count:** 15 topics

**Topics covered:**
1. Project Goal — long-term vision and what makes the project unique
2. Target Users — user personas, demographics, pain points
3. Problem Being Solved — real problems, not assumptions
4. Main Features (MVP) — minimum features required in the first version
5. Business Rules — rules that must never be broken (for example: stock cannot go negative)
6. Non-Goals — what will *not* be built in this version
7. User Stories — real workflows from the user perspective
8. Acceptance Criteria — concrete conditions for a feature to be considered done
9. Non-Functional Requirements — performance, security, accessibility
10. Platform & Constraints — web, mobile, or both; technical limits
11. External Integrations — payment gateway, email, OAuth, etc.
12. Monetization — business model and revenue sources
13. Analytics & Logging — what data must be tracked
14. Roadmap — release priorities and phases after MVP
15. Open Questions — items not yet decided

**Important behavior:**
- Use `Traceability ID` (`FEAT-*`, `BR-*`, `AC-*`, `NFR-*`, `US-*`) so each requirement can be traced to tasks and code
- Do not overwrite existing files without confirmation

</details>

---

<details>
<summary><strong>brainstorm-architecture</strong> — Create architecture.md (System Architecture)</summary>

**Persona:** @Fachri — Tech Lead

**Called when:** After `PRD.md` is complete. **Required** before `brainstorm-schema` and `brainstorm-api`.

**Read before starting:** `project-context/PRD.md`

**Output:** `project-context/architecture.md`

**Topic count:** 10 topics

**Topics covered:**
1. System Context — systems and external services that interact
2. Tech Stack — frontend, backend, database, hosting, CI/CD
3. Folder Structure — project file and directory organization
4. Design Patterns — architecture patterns (MVC, Clean Architecture, Feature-based, Hexagonal)
5. Authentication & Authorization — login method, JWT/session, RBAC
6. API Style — REST, GraphQL, or tRPC
7. State Management — Zustand, Redux, Context API, etc.
8. Deployment — dev/staging/prod environments, deployment strategy, cloud provider
9. Observability — logging, monitoring, error tracking
10. Architecture Decision Records — major decisions and their reasoning

**Important behavior:**
- Every decision must be defensible with reasoning
- The `Tech Stack` and `Folder Structure` fields are mandatory references for `spec-compliance` (SC-02) and `developer` (Step 2)

</details>

---

<details>
<summary><strong>brainstorm-schema</strong> — Create schema.md (Database Design)</summary>

**Persona:** @Fachri — Tech Lead

**Called when:** After `architecture.md` is complete.

**Read before starting:** `project-context/PRD.md`, `project-context/architecture.md`

**Output:** `project-context/schema.md`

**Topic count:** 5 topics

**Topics covered:**
1. Database Conventions — ID strategy (UUID/auto-increment/CUID), naming convention, audit fields, soft delete, timezone
2. Table List — all required tables/collections
3. Per-Table Details — columns, data types, constraints, and indexes
4. Relationships — foreign keys, one-to-many, many-to-many, cascade rules
5. Sensitive Data & Compliance — PII, retention policy, anonymization

**Important behavior:**
- Give each table a `Traceability ID` (`DATA-*`) that can be traced to requirements in `PRD.md`
- Agreed table and column names are a **contract** — `spec-compliance` (SC-03) verifies that code uses the exact names from this document

</details>

---

<details>
<summary><strong>brainstorm-api</strong> — Create api.md (API Endpoint Contract)</summary>

**Persona:** @Fachri — Tech Lead

**Called when:** After `schema.md` is complete.

**Read before starting:** `project-context/PRD.md`, `project-context/architecture.md`, `project-context/schema.md`

**Output:** `project-context/api.md`

**Topic count:** 5 topics

**Topics covered:**
1. Base URL, Versioning & Auth — dev/prod base URL, versioning, authentication method, standard response format
2. Error Catalog — all possible error codes and their meanings
3. Core Endpoints — main endpoints based on features in `PRD.md`
4. Pagination, Filter & Sorting — standard patterns for list endpoints
5. Rate Limiting & Security — request-per-minute limits, CORS policy, CSRF protection

**Important behavior:**
- Give each endpoint a `Traceability ID` (`API-*`)
- Agreed request and response formats are a **contract** verified by `spec-compliance` (SC-04) during coding

</details>

---

<details>
<summary><strong>brainstorm-styleguide</strong> — Create StyleGuide.md (UI/UX Design Guide)</summary>

**Persona:** @Akram — UI/UX Designer

**Called when:** After `PRD.md` and `architecture.md` are clear. **Optional** — skip if the project has no UI.

**Read before starting:** `project-context/PRD.md`, `project-context/architecture.md`

**Output:** `project-context/StyleGuide.md`

**Topic count:** 7 topics

**Topics covered:**
1. CSS Framework — Tailwind CSS (v3/v4), Bootstrap, CSS Modules, or custom
2. Color Palette — primary, secondary, accent, status colors (error/success/warning/info), dark mode
3. Typography — font family, heading and body sizes, line height, font weight
4. Spacing System — spacing scale used (4px, 8px, 16px, 24px, etc.)
5. Component Styles — button, card, form input, modal, table — styling and states
6. Responsive & Breakpoints — sm/md/lg/xl breakpoints and layout changes
7. Icons & Assets — icon library, image formats, asset naming conventions

**Important behavior:**
- Agreed colors and spacing are a **contract** — `spec-compliance` (SC-06) flags arbitrary values outside this list

</details>

---

<details>
<summary><strong>brainstorm-rules</strong> — Create rules.md (Code Standards / Code Constitution)</summary>

**Persona:** @Fachri — Tech Lead

**Called when:** Any time, but ideally before coding starts.

**Read before starting:** `project-context/architecture.md`, `project-context/PRD.md`, `project-context/schema.md`, `project-context/api.md`

**Output:** `project-context/rules.md`

**Topic count:** 7 topics

**Topics covered:**
1. AI Persona & Tech Stack — main technologies, preferred libraries, favored and avoided patterns
2. Naming Conventions — variables, functions, components, files, folders, constants
3. Code Style — formatting (Prettier/ESLint), max function length, `console.log` rules, early return
4. Testing Strategy — minimum coverage, testing tools, TDD approach
5. Security Rules — token storage, input validation, secret management
6. Git Workflow — commit message convention, branching strategy
7. `[FORBIDDEN]` Section — list of technical prohibitions that AI **must scan** before writing code

**Important behavior:**
- The `[FORBIDDEN]` section is the first thing `developer` reads before coding
- If the `[FORBIDDEN]` section is missing, `spec-compliance` records it as a MINOR finding

</details>

---

<details>
<summary><strong>brainstorm-task</strong> — Create Task.md (Phased Work Plan)</summary>

**Persona:** @Galbi — Project Manager

**Called when:** After all spec documents are complete. Also called automatically by `add-feature` to add a new phase.

**Read before starting:** All documents in `project-context/` (PRD, architecture, schema, api, rules, StyleGuide)

**Output:** `project-context/Task.md`

**Clarification topic count:** 4 topics

**Clarification topics:**
1. Phase Priority Order — implementation order, which features must finish first
2. Task Granularity — how small should tasks be? One file, one endpoint, or one full feature?
3. Execution Rules — stop for confirmation after each task, or continue automatically by phase?
4. Verify Available Documents — AI checks spec completeness itself before creating `Task.md`

**Two operation modes:**
- **Generate New** — create `Task.md` from scratch based on all available specs
- **Add Phase Mode** — append a new phase below existing `Task.md` content (called by `add-feature`, does not overwrite old content)

**Important behavior:**
- Tasks are **not created from guesses** — all tasks are derived from the spec documents
- Every task has concrete, verifiable `Acceptance Criteria`
- Test tasks always appear *before* implementation tasks (TDD order)
- Every task has a `Traceability ID` that links it to requirements in the specs

</details>

---

## 4. Execution Skills

---

<details>
<summary><strong>developer</strong> — Execute tasks from Task.md phase by phase</summary>

**Persona:** @Firdaus — Expert Developer

**Called when:** After `Task.md` exists and is ready to execute.

**Full workflow:**

**Step 0 — Identify name & project**
Read `.agents/developer-config.json`. If `name` or `project` is missing, AI asks once and saves the answer.

**Step 0b — Setup additional skills & MCP**

*Additional Skills:*
- If `additionalSkills` already exists in config → use it directly
- If not → AI asks once: *"Are there any additional skills for this project?"*
- For every named skill, AI **first searches the workspace itself** (`.agents/skills/`, `.github/skills/`, `.opencode/skill/`). It only asks you for the path if the skill is not found.
- When working on a relevant task, AI **must read** `SKILL.md` from that skill before writing code.

*MCP (Model Context Protocol):*
- If `availableMCPs` already exists in config → use it directly
- If not → AI asks once: *"Which MCPs are available in your workspace?"*
- Only listed MCPs will be used.

**Step 0c — Set developer scope**
- If `developerPreferences.scope` already exists → use it directly
- If not → AI asks once:
  ```
  What is your work scope in this project?
  A) Frontend only — do not touch backend/API/database
  B) Backend only  — do not touch UI/frontend
  C) Fullstack     — work across the whole stack
  ```
- This scope is enforced in every phase: AI will not create/change files outside the scope.

**Step 1b — Choose work mode**
- If `developerPreferences.workMode` already exists → use it directly
- If not → AI asks once:
  ```
  A) Code now   — start immediately
  B) Plan first — write a plan first for your review
  ```
- **Plan-first mode:** AI creates a plan file in `project-context/plans/phase-[N]-[slug].md` with a status header at the top. Plan status changes through this lifecycle:
  ```
  status: review      ← when the plan is first created (you review it first)
  status: in-progress ← when you type "start"
  status: code-review ← when all tasks in the phase are complete
  status: done        ← when code-review is complete
  ```

**Step 2 — Select relevant specs + enforce scope**

| Condition | Read |
|---------|--------|
| All tasks (always) | `rules.md`, `architecture.md` |
| Task touches database/model | + `schema.md` |
| Task touches API/endpoint | + `api.md` |
| Task touches UI/component | + `StyleGuide.md` |
| Requirement is unclear | + `PRD.md` |

Scope enforcement: if `scope=frontend`, AI does not touch backend files. If `scope=backend`, AI does not touch frontend files.

**Step 3 — Execute tasks one by one**

For each task:
1. Understand the task and acceptance criteria
2. Check the ladder: does it need to be built? Does it already exist in the codebase? Is it in the standard library? (YAGNI)
3. Write an I/O contract for non-trivial functions
4. Write tests first, then implementation (TDD)
5. After finishing, write `[SELF-REVIEW]`:
   ```
   1. Security risk: [1 potential issue — or "none identified"]
   2. Performance bottleneck: [1 area — or "none identified"]
   3. Spec assumption: [1 assumption — or "none"]
   ```
6. Run validation, update `Task.md` (`[ ]` → `[x]`)

**Step 4 — After all tasks in the phase are complete**
1. Show a phase summary
2. If there is a plan file for this phase → update plan status: `in-progress` → `code-review`
3. Run `spec-compliance` automatically
4. If clean, run `code-review` automatically
5. Offer the next phase

**MCPs used (if listed in `availableMCPs`):**
- `context7` — fetch installed-version library documentation before coding
- `sequential-thinking` — for complex problems/architecture
- `grep-app` — search for real implementation examples in public repos
- `exa` — changelog, breaking changes, verify active maintenance

</details>

---

<details>
<summary><strong>spec-compliance</strong> — Verify code against all spec documents</summary>

**Persona:** @Fachri — Tech Lead

**Called when:** Automatically after each completed phase by `developer`. Runs **before** `code-review`.

**Checklist (8 items):**

| ID | Aspect | Documents Read |
|----|-------|---------------------|
| SC-01 | PRD Compliance | `PRD.md` — features, business rules, acceptance criteria, non-goals |
| SC-02 | Architecture Compliance | `architecture.md` — tech stack, folder structure, design patterns, auth method |
| SC-03 | Schema Compliance | `schema.md` — exact table/column names, relationships, soft delete, audit fields, PII |
| SC-04 | API Compliance | `api.md` — endpoint path, HTTP method, request/response format, error codes |
| SC-05 | Rules Compliance | `rules.md` — `[FORBIDDEN]` section, naming convention, TypeScript rules |
| SC-06 | StyleGuide Compliance | `StyleGuide.md` — CSS framework, color tokens, spacing system |
| SC-07 | Task Completion | `Task.md` — all acceptance criteria met, no half-finished tasks |
| SC-08 | Scope Compliance | `developer-config.json` — frontend/backend scope respected, no files outside scope |

**Severity:** `💥 BLOCKER` → fix now, re-run | `🔴 MAJOR` → fix before the next phase | `⚠️ MINOR` → discuss | `✅ PASS` → continue to `code-review`

**Note:** SC-07 is N/A when run from `bug-fix`.

</details>

---

<details>
<summary><strong>code-review</strong> — Code quality and security review</summary>

**Persona:** @Fachri — Tech Lead

**Called when:** Automatically after `spec-compliance` is clean. Can also be called manually any time.

**Fix mode (runtime default + can be set in config):**
```
A) Report first — show all findings, wait for confirmation before fixing
B) Fix now      — automatically fix BLOCKER/MAJOR, full report at the end
```
If this field is missing, the default is `report-first`. To change it, the user or config workflow can set `codeReviewPreferences.fixMode` in `developer-config.json`.

**Phase 1 — 27-Item Code Quality:**

| Tier | Item |
|------|------|
| 💥 BLOCKER | CR-01 Wrong imports · CR-02 Runtime errors · CR-03 Null/undefined · CR-04 SQL injection · CR-05 Deprecated methods |
| 🔴 MAJOR | CR-06 Duplicate function · CR-07 Unused code · CR-08 Duplicate logic · CR-09 Obsolete code · CR-10 Inconsistent naming · CR-11 Ignoring existing code · CR-12 Missing dependency · CR-13 Dependency conflict · CR-14 Memory leaks · CR-15 Security ignored · CR-16 No rate limit handling · CR-17 No tests |
| ⚠️ MINOR | CR-18 Edge cases · CR-19 Happy path only · CR-20 Performance · CR-21 Outdated pattern · CR-22 Under-engineering · CR-23 Over-engineering · CR-24 Environment assumptions |
| ℹ️ INFO | CR-25 Missing comments · CR-26 Jargon · CR-27 Comment quality |

**Phase 2 — 10 Security Essentials:**

| ID | Aspect |
|----|-------|
| SEC-01 | Injection Prevention — SQL, shell, eval |
| SEC-02 | Authentication — password hashing, cookie attributes |
| SEC-03 | Authorization — deny-by-default, ownership checks, mass assignment |
| SEC-04 | XSS Prevention — innerHTML, dangerouslySetInnerHTML |
| SEC-05 | API Security — rate limiting, CORS, JWT verification |
| SEC-06 | Data Protection & Logging — no sensitive logs, no hardcoded secrets |
| SEC-07 | Error Handling Security — fail-closed, no swallowed exceptions |
| SEC-08 | Input Validation — body/params/query/headers/cookies |
| SEC-09 | Framework-Specific Security — AI reads `architecture.md` to detect the framework: **Next.js** (`NEXT_PUBLIC_*`, Server Actions, middleware, wildcard image domains), **Laravel** (CSRF, Eloquent, `.env`), **Django** (`ALLOWED_HOSTS`, `DEBUG`, `SECRET_KEY`), **Express/NestJS** (`helmet`, CORS, body limits), **Rails** (strong params) |
| SEC-10 | Dependency Vulnerabilities — packages with critical/high CVEs (`npm audit`, `pip audit`, `composer audit`, etc.) |

**Format for each finding:** Where? → If not fixed? → If fixed? → Recommended fix

**Update plan after review completes** (if a plan file exists for this phase):
- **Plan-level deviation exists** (wrong library, pattern not followed, scope changed, approach differs from the plan) → add a note to the plan + change status: `code-review` → `done`
- **No plan deviation** (only code quality issues: naming, formatting, security hardening) → change status only: `code-review` → `done`, with no note

</details>

---

## 5. Utility Skills

---

<details>
<summary><strong>help</strong> — Project status dashboard and next-step guidance</summary>

**Persona:** @Galbi — Project Manager

**Called when:** Any time, especially if you are unsure where to start.

**What it checks:**

- Spec documents in `project-context/` — `PRD.md`, `StyleGuide.md`, `architecture.md`, `schema.md`, `api.md`, `rules.md`, `Task.md` (count `[ ]` vs `[x]`)
- Developer config in `.agents/developer-config.json` — `name`, `project`, `scope`, `workMode`, `additionalSkills`, `availableMCPs`
- Plans in `project-context/plans/` — list all plan files and their statuses (`review` / `in-progress` / `code-review` / `done`)

**Output format:**
```
Checking your project now...

Spec Documents
  [✓] PRD.md           — Product requirements
  [✓] architecture.md  — System architecture
  [ ] schema.md        — Not created yet
  ...

Developer Config
  [✓] name: Firdaus
  [✓] scope: fullstack
  [✓] workMode: plan-first
  [✓] additionalSkills: 2 skills
  [ ] availableMCPs: not configured

Plans
  [✓] phase-1-setup.md       (status: done)
  [✓] phase-2-auth.md        (status: in-progress)

Status: [project status summary]
Recommended next steps: ...
```

</details>

---

<details>
<summary><strong>bug-fix</strong> — Diagnose, fix, and document bugs</summary>

**Persona:** @Ikhsan — Debugger

**Called when:** A bug needs to be fixed.

**Workflow:**
1. You describe the bug (symptoms, location, reproduction steps, error message)
2. AI checks `bug-log.md` — has it happened before?
   - **Identical** → apply the same fix (ask for confirmation first)
   - **Similar but different** → diagnose again
   - **New** → continue to diagnosis
3. AI reads the broken file + all callers of shared code — one root-cause fix is better than many guards in each caller
4. AI formulates and explains the root cause → wait for confirmation before fixing
5. Apply the fix → run `spec-compliance` + `code-review`
6. You confirm the bug is resolved
7. AI adds regression prevention (test, rule/spec update)
8. AI records it in `project-context/bug-log.md` ← **only after your confirmation, never automatically**

</details>

---

<details>
<summary><strong>add-feature</strong> — Add a new feature to an existing project</summary>

**Persona:** @Galbi — Project Manager

**Called when:** A new feature needs to be added to an existing project.

**Workflow:**
1. You describe the new feature (name, function, users, reason)
2. AI reads all specs in `project-context/`
3. AI shows an impact analysis — which documents are affected (including `plans/`)
4. You confirm the analysis
5. AI updates **all** affected documents:
   - `PRD.md` → `architecture.md` → `schema.md` → `api.md` → `StyleGuide.md` → `rules.md`
   - `project-context/plans/` — if a plan file exists for an affected phase, add a `## Feature Addition: [name]` section without overwriting old content
6. AI calls `brainstorm-task` (Add Phase Mode) to add new phases and tasks to `Task.md`
7. Continue with `developer`

**Absolute rule:** every affected document must be updated — none may be skipped.

</details>

---

<details>
<summary><strong>spec-audit</strong> — Check consistency across documents</summary>

**Persona:** @Fachri — Tech Lead

**Two modes:**

**Project Mode** — audit `project-context/`
Checks consistency *between* documents: tables in `schema` with no endpoint in `api`? Features in `PRD` with no task in `Task.md`? `architecture` tech stack conflicting with `rules`? `Traceability ID`s referenced but missing from the source?

**Framework Mode** — audit MACCA itself
Checks consistency *between* skill instructions: are README, skill docs, and workflow aligned, or do they conflict?

**What it checks:** direct conflicts → workflow drift → inconsistencies → ambiguities

**Finding format:** Where? → Why is it a problem? → Specific recommended fix + reasoning

</details>

---

<details>
<summary><strong>spec-init</strong> — Generate all specs from an existing codebase</summary>

**Persona:** @Fachri — Tech Lead

**Called when:** The project already exists but has no spec documents yet.

**Two modes:**
```
Mode A — Batch Generate: scan the full codebase, generate everything at once.
Mode B — Guided Generate: one document → you review → confirm → continue.
```

**Generation order:** `architecture.md` → `rules.md` → `schema.md` → `api.md` → `StyleGuide.md` → `PRD.md`

`PRD.md` is created last because it is inferred from existing code, not assumptions.

**Each generated document includes:**
- **Evidence Inputs** — files/sources used as the basis for each claim
- **Confidence Level** per claim: *High* (seen directly in code) / *Medium* (strong inference) / *Low* (guess, needs verification)
- **Confidence Summary** — summary of strong facts, inferences, and what still needs manual verification

</details>

---

<details>
<summary><strong>rapat</strong> — Multi-persona team discussion</summary>

**Persona:** @Galbi (facilitator)

**Called when:** Any time you need perspectives from several specialties at once.

**How it works:** @Galbi facilitates. You can call any persona by name to ask for their view. Each persona responds according to their expertise and role.

**Available personas:**
- `@Galbi` — Project Manager: scope, priorities, business impact
- `@Fachri` — Tech Lead: technical decisions, trade-offs, security
- `@Akram` — UI/UX Designer: usability, visual consistency, accessibility
- `@Firdaus` — Developer: feasibility, complexity estimates
- `@Ikhsan` — Debugger: risks, edge cases, potential bugs

</details>

---

## 6. The MACCA AI Team

| Persona | Role | Skills |
|---------|------|--------|
| **@Galbi** | Project Manager | `brainstorm-prd`, `brainstorm-task`, `add-feature`, `help`, `rapat` |
| **@Fachri** | Tech Lead | `brainstorm-architecture`, `brainstorm-api`, `brainstorm-schema`, `brainstorm-rules`, `spec-init`, `spec-audit`, `spec-compliance`, `code-review` |
| **@Akram** | UI/UX Designer | `brainstorm-styleguide` |
| **@Firdaus** | Expert Developer | `developer` |
| **@Ikhsan** | Debugger | `bug-fix` |

> **Persona Rule:** Do not swap the persona assigned to a skill. Its instructions, tone, and responsibilities are designed for that role.

---

## 7. Workflow

<details>
<summary><strong>New Project</strong> — Start from scratch</summary>

```
Step 1: Define product requirements
  → Call: brainstorm-prd
  → Output: project-context/PRD.md

Step 2: Define architecture
  → Call: brainstorm-architecture   ← REQUIRED before continuing
  → Output: project-context/architecture.md

Step 3a: Design the database (if any)
  → Call: brainstorm-schema
  → Output: project-context/schema.md

Step 3b: Define the API (if any)
  → Call: brainstorm-api
  → Output: project-context/api.md

Step 3c: Define the UI design (optional)
  → Call: brainstorm-styleguide
  → Output: project-context/StyleGuide.md

Step 4: Set code standards
  → Call: brainstorm-rules
  → Output: project-context/rules.md

Step 5: Check consistency (recommended)
  → Call: spec-audit (project mode)

Step 6: Create the work plan
  → Call: brainstorm-task
  → Output: project-context/Task.md

Step 7: Start coding
  → Call: developer
  → Per task: code → validate → [SELF-REVIEW]
  → Per phase: spec-compliance → code-review → next phase
  → If all tasks are complete but small technical changes, hardening, optimization, or maintenance remain: keep using `developer` (post-task / maintenance mode)
```

> Not sure where to start? Call `help`.

</details>

---

<details>
<summary><strong>Existing Project / Boilerplate</strong> — Codebase exists, specs do not</summary>

```
Step 1: Generate specs from the existing codebase
  → Call: spec-init
  → Mode A (Batch): create all documents at once
  → Mode B (Guided): one document → review → continue

  Generation order: architecture.md → rules.md → schema.md → api.md → StyleGuide.md → PRD.md

Step 2: Review & correct
  → Pay attention to items with Confidence: Low and any assumption sections

Step 3: Check consistency
  → Call: spec-audit (project mode)

Step 4: Create the work plan
  → Call: brainstorm-task

Step 5: Start coding
  → Call: developer
```

</details>

---

<details>
<summary><strong>Add a New Feature</strong></summary>

```
→ Call: add-feature

What happens:
  1. You describe the new feature
  2. AI reads all existing specs
  3. AI shows an impact analysis (affected documents + plans)
  4. You confirm the analysis
  5. AI updates ALL affected documents (none are skipped)
  6. AI calls brainstorm-task to add new phases & tasks
  7. Continue with developer
```

</details>

---

<details>
<summary><strong>Fix a Bug</strong></summary>

```
→ Call: bug-fix

What happens:
  1. You describe the bug
  2. AI checks bug-log.md — has it happened before?
  3. AI checks all callers of the broken code
  4. AI explains the root cause → wait for confirmation before fixing
  5. Apply the fix → spec-compliance + code-review
  6. You confirm the bug is resolved
  7. AI adds regression prevention
  8. AI records it in bug-log.md ← only after your confirmation
```

</details>

---

## 8. Installation & Usage

**Prerequisite:** GitHub Copilot enabled in VS Code (or another supported AI tool).

### Installation

**Linux / Mac**
```bash
curl -fsSL https://raw.githubusercontent.com/firdaus12p/MACCA-METHOD/main/install.sh | bash
```

**Windows (PowerShell)**
```powershell
irm https://raw.githubusercontent.com/firdaus12p/MACCA-METHOD/main/install.ps1 | iex
```

The installer shows an interactive selector to choose the AI tool, then asks for the developer name, project name, and language preference.

### Update to the Latest Version

**Linux / Mac**
```bash
curl -fsSL https://raw.githubusercontent.com/firdaus12p/MACCA-METHOD/main/upgrade.sh | bash
```

**Windows (PowerShell)**
```powershell
irm https://raw.githubusercontent.com/firdaus12p/MACCA-METHOD/main/upgrade.ps1 | iex
```

> `project-context/` and `developer-config.json` are **not touched** during upgrade.

### How to Call a Skill

```
Use the skill brainstorm-prd
Use the skill developer
Use the skill help
```

### Folder Structure

```
your-project/
├── .agents/
│   ├── developer-config.json    ← shared config across skills
│   └── macca-tools.txt          ← tools selected during install
│
├── .github/skills/              ← if GitHub Copilot is selected
│   ├── add-feature/
│   ├── brainstorm-api/
│   ├── brainstorm-architecture/
│   ├── brainstorm-prd/
│   ├── brainstorm-rules/
│   ├── brainstorm-schema/
│   ├── brainstorm-styleguide/
│   ├── brainstorm-task/
│   ├── bug-fix/
│   ├── code-review/
│   ├── developer/
│   ├── help/
│   ├── rapat/
│   ├── spec-audit/
│   ├── spec-compliance/
│   └── spec-init/
│
├── project-context/
│   ├── PRD.md
│   ├── architecture.md
│   ├── schema.md
│   ├── api.md
│   ├── rules.md
│   ├── StyleGuide.md
│   ├── Task.md
│   ├── bug-log.md               ← created when the first bug appears
│   └── plans/                   ← per-phase plans (plan-first mode)
│       └── phase-1-setup.md
│
└── ... (your project code)
```

| AI Tool | Skills Folder |
|---------|---------------|
| GitHub Copilot | `.github/skills/` |
| Cursor | `.cursor/skills/` |
| Claude Code | `.claude/skills/` |
| Windsurf | `.windsurf/skills/` |
| Gemini CLI | `.gemini/skills/` |
| OpenCode | `.opencode/skill/` |
| Kilo Code | `.kilo/skills/` |
| Codex (OpenAI) | `.agents/skills/` |
| Kimi CLI | `~/.config/agents/skills/` (global) |

---

## 9. Configuration

<details>
<summary><strong>developer-config.json — Full Schema</strong></summary>

The `.agents/developer-config.json` file is shared config across skills. All skills read and update this file by **merge**, never by overwriting the whole file.

```json
{
  "name": "User name",
  "project": "Project name",
  "languagePreferences": {
    "communication": {
      "raw": "English",
      "normalized": "english"
    },
    "documents": {
      "raw": "English",
      "normalized": "english"
    }
  },
  "developerPreferences": {
    "workMode": "direct",
    "scope": "fullstack"
  },
  "brainstormPreferences": {
    "discussionMode": "one-by-one",
    "recommendations": true
  },
  "codeReviewPreferences": {
    "fixMode": "report-first"
  },
  "additionalSkills": [
    {
      "name": "laravel-best-practices",
      "purpose": "Use when writing Laravel code",
      "paths": {
        "copilot": ".github/skills/laravel-best-practices/SKILL.md",
        "opencode": ".opencode/skill/laravel-best-practices/SKILL.md",
        "codex": ".agents/skills/laravel-best-practices/SKILL.md"
      }
    }
  ],
  "availableMCPs": ["context7", "supabase"]
}
```

| Field | Filled by | Description |
|-------|--------------------|------------|
| `name` | `developer` (Step 0) | Asked once |
| `project` | `developer` (Step 0) | Asked once |
| `languagePreferences` | installer / first skill | Communication language and document language |
| `developerPreferences.workMode` | `developer` (Step 1b) | `"direct"` or `"plan-first"` |
| `developerPreferences.scope` | `developer` (Step 0c) | `"frontend"`, `"backend"`, or `"fullstack"` |
| `brainstormPreferences.discussionMode` | brainstorm-* skills | `"one-by-one"`, `"three-at-a-time"`, or `"all-at-once"` |
| `brainstormPreferences.recommendations` | brainstorm-* skills | `true` = AI gives suggested answers for each question |
| `codeReviewPreferences.fixMode` | user / config runtime | `"report-first"` or `"fix-then-report"` |
| `additionalSkills` | `developer` (Step 0b) | AI searches for the path in the workspace first, then asks only if it is not found |
| `availableMCPs` | `developer` (Step 0b) | Available MCPs; only listed MCPs are used |

**Rule:** all skills must **merge**, not overwrite the file. Unknown fields must be preserved.

</details>

---

<details>
<summary><strong>Glossary & Traceability ID</strong></summary>

| Term | Explanation |
|---------|------------|
| **Skill** | Full instructions for AI — like an SOP for AI |
| **Spec** | Planning document containing all decisions before coding |
| **Subagent** | Helper agent for focused exploration/analysis |
| **project-context/** | Folder where all spec documents are stored |
| **[FORBIDDEN]** | Section in `rules.md` — technical prohibitions scanned by AI before coding |
| **[SELF-REVIEW]** | Short developer reflection after each task: security risk, performance, spec assumption |
| **Traceability ID** | Stable label (`FEAT-01`, `API-03`) for tracing requirements from PRD to implementation |
| **Acceptance Criteria** | Concrete conditions for a task to be considered done |
| **scope** | Developer work boundary: frontend-only, backend-only, or fullstack |
| **fixMode** | `code-review` preference: report first or fix immediately |
| **availableMCPs** | MCPs listed and available for use in this project |
| **Confidence Level** | In `spec-init`: High/Medium/Low for claims derived from codebase analysis |
| **Evidence Inputs** | In `spec-init`: files/sources used as evidence for a claim |
| **Plan status** | Plan file lifecycle status: `review` → `in-progress` → `code-review` → `done` |
| **Plan deviation** | Implementation drift from decisions in the plan (library, pattern, scope) — recorded by `code-review` if found |

**Traceability ID Scheme:**

| Prefix | Used for |
|--------|----------------|
| `FEAT-01` | Main feature in `PRD.md` |
| `BR-01` | Business rule in `PRD.md` |
| `NFR-01` | Non-functional requirement in `PRD.md` |
| `AC-01` | Acceptance Criteria in `PRD.md` |
| `US-01` | User story in `PRD.md` |
| `DATA-01` | Table or data entity in `schema.md` |
| `API-01` | Endpoint in `api.md` |
| `RULE-01` | Rule in `rules.md` referenced across documents |

</details>

---

## 10. Frequently Asked Questions

<details>
<summary>Do all spec documents need to be complete before coding?</summary>

They do not need to be perfect. The minimum required before `developer` can run is `PRD.md` and `architecture.md`. The more complete the specs are, the more accurately AI can work.

</details>

<details>
<summary>Can this be used for an existing project?</summary>

Yes. Use `spec-init` — AI reads the codebase and generates all spec documents. Every claim gets a confidence level (High/Medium/Low) and its evidence source.

</details>

<details>
<summary>Can AI make mistakes?</summary>

Yes. That is why `spec-compliance` and `code-review` run automatically after every phase. If something is wrong, AI fixes it before continuing.

</details>

<details>
<summary>What is [SELF-REVIEW]?</summary>

After each task is complete, the developer writes a short reflection: 1 potential security risk, 1 performance bottleneck, and 1 spec assumption. The goal is to expose hidden guesses before formal verification.

</details>

<details>
<summary>Why does developer write tests before implementation?</summary>

This is the TDD approach. By writing tests first, AI defines function behavior precisely before implementation — preventing structural changes midway through. Test tasks always appear before implementation tasks in `Task.md`.

</details>

<details>
<summary>Is bug-log updated automatically?</summary>

No. A bug is recorded only after **you confirm** that it is resolved. AI does not write to `bug-log` without permission.

</details>

<details>
<summary>Do I need to choose developer preferences in every session?</summary>

No. All preferences (scope, work mode, additional skills, MCPs, code review mode) are asked once and saved. Future sessions use them directly.

</details>

<details>
<summary>What is plan-first mode and where is the plan stored?</summary>

When you choose `plan-first`, AI creates a plan file in `project-context/plans/phase-[N]-[slug].md` before coding starts. The plan has a status header that is updated automatically through this lifecycle:

| Status | Meaning |
|--------|---------|
| `review` | The plan was just created — you read and review it first. Type `start` if you agree. |
| `in-progress` | Coding starts after you type `start`. |
| `code-review` | All tasks in the phase are complete and are being reviewed by `code-review`. |
| `done` | Code review is complete. If implementation deviated from the plan (wrong library, different pattern), AI adds a note to the plan. If there is no deviation, status changes to `done` with no note. |

Plans are also recognized by `help` (displayed with status) and `add-feature` (updated if the phase is affected).

</details>

<details>
<summary>What is scope in developer?</summary>

Scope sets the AI work boundary: **Frontend only** (does not touch `routes/`, `controllers/`, `migrations/`), **Backend only** (does not touch `components/`, `pages/`, `styles/`), or **Fullstack** (no restriction). It is enforced in `developer` before coding and in `spec-compliance` (SC-08) after coding.

</details>

<details>
<summary>How do additional skills work?</summary>

These are project-specific skills (for example `laravel-best-practices`). `developer` asks once. AI searches the workspace first, then asks you only if the skill is not found. When working on a relevant task, AI must read that skill's `SKILL.md` before writing code.

</details>

<details>
<summary>How is spec-audit different from spec-compliance?</summary>

- `spec-compliance` — code vs spec. Runs after coding.
- `spec-audit` — spec document vs spec document. Runs before coding or any time you suspect inconsistencies.

Analogy: `spec-compliance` is inspection of the built result against the blueprint. `spec-audit` is cross-checking the blueprints against each other.

</details>

<details>
<summary>Why is security review in code-review, not only in developer?</summary>

Developer has baseline security responsibility: `[FORBIDDEN]` in `rules.md` and `[SELF-REVIEW]`, which records a possible security risk. But `code-review` is the formal checkpoint with 10 deeper security items (SEC-01–SEC-10), including framework-specific checks and dependency CVEs. These two layers complement each other.

</details>

---

## 11. License

MIT License — free to use, modify, and distribute.
