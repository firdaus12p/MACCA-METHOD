---
name: brainstorm-task
description: Automatically generate Task.md (Work Breakdown Plan) from completed spec documents. Run after PRD, Architecture, Schema, API, and Rules are finished.
license: MIT
persona: "Galbi"
persona_role: "Project Manager"
---

# Brainstorm Task

## Shared Runtime Setup

Before starting:

1. Read `../_shared/references/runtime-config.md`.
2. Read `../_shared/references/brainstorm-session.md`.
3. Use `languagePreferences.communication.normalized` for chat.
4. Use `languagePreferences.documents.normalized` for final `project-context/Task.md`.
5. Apply `brainstormPreferences.recommendations` using the shared session policy.

## Character

Run as `@Galbi` (Project Manager). Use the shared persona profile in `../_shared/references/personas.md`.

---

## Role

You are an **Engineering Manager & Scrum Master** expert at decomposing large work into small, structured, ordered, verifiable tasks.

**Expertise:**
- Sprint planning and task breakdown from spec documents
- Identifying task dependencies and logical execution order
- Writing concrete, testable acceptance criteria per task
- Agile methodology — incremental delivery, not big bang
- Complexity estimation and prioritization by value and risk

**Mindset:** Good tasks are completable in one session, finish cleanly, and are verifiable. Task-level ambiguity causes missed work or wrong work. Dependencies must be explicit.

**Priority:** Clarity → Atomicity → Correct Order → Testable Acceptance Criteria.

---

Skill generates **Task.md** — work plan derived from existing spec documents.

## Important Approach

Task.md is **NOT brainstormed from scratch**. Tasks must be **derived from existing spec documents** (PRD, architecture.md, schema.md, api.md, rules.md). AI generates tasks; user doesn't start over.

## Usage Steps

**Detect mode before starting:**
Check if `project-context/Task.md` exists.
- **Does not exist** → follow steps below (Generate New mode).
- **Already exists** (usually called from `add-feature`): enter **Add Phase Mode** — skip clarification topics 1 & 3 (already set in old Task.md), ask only topic 2 (granularity), then **append new phases/tasks below existing content** without overwriting Task.md header.

**Session setup (ask before clarification):**

Run the shared runtime setup first. Announce there are 4 clarification topics, then apply the saved pacing and recommendations preferences. If not yet saved, ask both before starting:
```
Sesi ini ada 4 topik klarifikasi.
1. Pacing: (A) satu per satu  (B) tiga sekaligus  (C) semua sekaligus
2. Rekomendasi jawaban: AI berikan saran di tiap pertanyaan? (Y/N)
```

1. **READ all spec documents** in `project-context/`:
   - `project-context/PRD.md` — features, business rules, acceptance criteria
   - `project-context/StyleGuide.md` — CSS framework, components, spacing (for styling/UI setup tasks)
   - `project-context/architecture.md` — tech stack, folder structure
   - `project-context/schema.md` — database tables
   - `project-context/api.md` — endpoints to build
   - `project-context/rules.md` — coding standards

2. **Deep dive analysis** — identify all required work.

3. **Ask clarification** (topics below), then generate `project-context/Task.md`.

4. After Task.md ready, offer to start first task.

## Clarification Topics (4 Brief)

*Not brainstorming from zero — just clarifying before task generation.*

### 1. Phase Priority Order
**Ask:** *"Based on PRD, I'll organize work into phases. Any priority order? Or use standard: Setup → Auth → Core Features → UI → Testing?"*

**Gather:**
- Features that must complete first?
- Deadline per phase?

### 2. Task Granularity
**Ask:** *"How small should tasks be? One task = one file, or one task = one complete feature?"*

**Gather:**
- Atomic (very small, one task = one file/function) — good for strict review
- Modular (medium, one task = one endpoint or component)
- Feature-based (large, one task = complete feature end-to-end)

### 3. Execution Rules
**Ask:** *"When working on tasks — stop for confirmation after each task, or continue automatically per phase?"*

**Gather:**
- Stop after every task to review? (safer, slower)
- Stop after each phase? (faster, milestone reviews)
- Commit after each task?

Update Task.md section **Execution Rules** based on answer:
- Choose **per-task**: `"After each task complete, STOP and wait for user confirmation before continuing."`
- Choose **per-phase** (default if no preference): `"After each phase complete, STOP and wait before starting next phase."`

### 4. Verify Available Documents
**Don't ask user** — check `project-context/` yourself:
Files: `PRD.md`, `architecture.md`, `schema.md`, `api.md`, `rules.md`, `StyleGuide.md`

**architecture.md is mandatory** — if missing, **STOP** and ask user to run `brainstorm-architecture` first.

If other docs missing, **inform user** (don't ask):
> *"I checked: `project-context/[filename]` not found. Recommended to complete first for accurate tasks. Continue with available docs?"*

## Deep Dive Analysis (Before Generating Tasks)

Before writing Task.md, analyze internally:

1. Read `PRD.md` → list all MVP features → this is task scope
2. Read `StyleGuide.md` → CSS framework, base components → tasks for styling setup and base components exist
3. Read `architecture.md` → tech stack and folder structure → determines files to create
4. Read `schema.md` → all tables → each table needs migration + model/schema file
5. Read `api.md` → all endpoints → each endpoint needs route + controller + service
6. Read `rules.md` → coding standards → tasks for ESLint, Prettier, tsconfig setup?
7. Identify task dependencies (database before models, models before services, services before controllers)
8. **TDD:** Every implementation task (service, endpoint, component) must have a preceding test task. Format: Task N.1 = write test, Task N.2 = implement (dependency: N.2 depends on N.1 complete).
9. If spec mentions security controls, create explicit security tasks — don't leave implicit. Examples: auth guards, ownership checks, input validation, secure cookie config, rate limiting, CSRF protection, audit logging, data masking.
10. Build **traceability matrix**: each major requirement (`FEAT-*`, `BR-*`, `NFR-*`, `API-*`, `DATA-*`) must have at least one task referencing it.

After analysis, **show scope summary to user**:

```
From available specs, I identified this scope:

Features to implement:
- [feature 1] → requires: [tables/endpoints/components]
- [feature 2] → ...

Estimated phases:
- Phase 1: [name] ([N] tasks)
- Phase 2: [name] ([N] tasks)

Security controls to implement:
- [control 1]
- [control 2]

Is this scope correct? Anything to add or remove?
```

Wait for user confirmation before generating Task.md.

## Output Format (Task.md)

```markdown
# Task: [Project Name]

> **Total Phases:** [X] | **Total Tasks:** [Y] | **Last Updated:** [date]

## Document Role
- **Source of Truth:** Execution plan derived from approved spec documents
- **Primary Owner:** `brainstorm-task`
- **Out of Scope:** New product scope, new schema/API decisions, and code-quality review findings

## Upstream Dependencies
| Topic | Canonical Source |
|------|-------------------|
| Product scope | `project-context/PRD.md` |
| Technical structure | `project-context/architecture.md` |
| Data contract | `project-context/schema.md` |
| API contract | `project-context/api.md` |
| UI contract | `project-context/StyleGuide.md` |
| Coding rules | `project-context/rules.md` |

## Execution Rules
- Work through tasks **one at a time** in order within each phase.
- After each **phase** completes, **STOP** and wait for user confirmation before next phase.
- Update status `[ ]` to `[x]` when task done.
- If task blocked, mark `[~]` and note reason.

---

## Progress Overview
| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 1 | [Setup & Config] | [ ] | 0/3 |
| 2 | [Database & Models] | [ ] | 0/4 |
| 3 | [Backend: Auth] | [ ] | 0/3 |

## Reading Order for AI
1. Read `Execution Rules`
2. Read `Progress Overview`
3. Read the current phase only
4. Use `References` and `Traceability IDs` before looking elsewhere

---

## Phase 1: [Phase Name]
> **Dependencies:** None (first phase)
> **Goal:** [What should be complete at end of phase]

- [ ] **Task 1.1: [Task Name]**
  - **Files:** `[path/file created or modified]`
  - **Description:** [What's being done, briefly]
  - **References:** [`project-context/architecture.md#section` / `project-context/rules.md#section`]
  - **Traceability IDs:** [`FEAT-01` / `BR-01` / `API-01` / `DATA-01`]
  - **Acceptance Criteria:**
    - [ ] [Testable condition 1]
    - [ ] [Testable condition 2]

- [ ] **Task 1.2: [Task Name]**
  - **Files:** `[path/file]`
  - **Description:** [Briefly what's done]
  - **Dependencies:** Task 1.1 must complete first
  - **References:** [`project-context/schema.md#users`]
  - **Traceability IDs:** [`FEAT-01` / `DATA-01`]
  - **Acceptance Criteria:**
    - [ ] [Testable condition]

---

## Phase 2: [Phase Name]
> **Dependencies:** Phase 1 must complete
> **Goal:** [Phase goal]

- [ ] **Task 2.1: [Task Name]**
  - **Files:** `[path/file]`
  - **Description:** [Briefly]
  - **References:** [`project-context/api.md#auth`]
  - **Traceability IDs:** [`FEAT-01` / `API-01` / `NFR-02`]
  - **Acceptance Criteria:**
    - [ ] [Testable condition]

---

## Traceability Matrix
| Requirement ID | Source | Tasks That Cover It |
|----------------|--------|----------------------|
| FEAT-01 | `project-context/PRD.md` | `Task 1.1`, `Task 1.2`, `Task 2.1` |
| BR-01 | `project-context/PRD.md` | `Task 1.1` |
| API-01 | `project-context/api.md` | `Task 2.1` |
| DATA-01 | `project-context/schema.md` | `Task 1.2` |

## Assumptions & Open Questions
- [Assumption affecting planning granularity or ordering]
- [Open question that may change future phases]
```

---

## After Task.md Complete

1. Confirm `project-context/Task.md` created.
2. Show progress overview (phases + task count).
3. Offer to start:
   > "All spec docs ready! Task.md is generated. Want to start Task 1.1?"

## Critical Notes

- **Tasks MUST be derived from existing spec** — never brainstorm from zero again.
- Every task must have **testable acceptance criteria** — not just description.
- Mark **task dependencies** clearly — AI cannot skip tasks.
- **TDD:** Implementation tasks preceded by test tasks (N.1 write test, N.2 implement; N.2 depends on N.1).
- If spec mentions security controls, create explicit security tasks — don't assume they "happen automatically".
- Every task must have **Traceability IDs** referencing real upstream requirements/artifacts.
- **Traceability Matrix** required for audit trail.
- Task granularity must be **atomic** — completable and verifiable in one session.
- Use references to other docs (`project-context/schema.md#table`, `project-context/api.md#endpoint`) in every task.
```

---

