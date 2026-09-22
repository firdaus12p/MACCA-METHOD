# Task: [Project Name]

> **Authoring note:** This is a placeholder menu, not a checklist to build. Derive tasks only from approved current gaps and required verification/security/recovery work in the actual architecture. Prune inapplicable sections or mark `N/A` with a reason; unknown mandatory decisions remain open, not `N/A`. Reuse verified existing work and preserve IDs/history. No presumed setup/auth/layers, empty phases, copied example tasks, or “maybe later” features. Critical depth deepens analysis, not the task count. Return unjustified new components to their spec owner for requirement, simpler-option evidence, cost, and escalation-trigger decisions within scale/team/budget/operations constraints.

> **Total Phases:** [X] | **Total Tasks:** [Y] | **Last Updated:** [date]

## Document Role

- **Source of Truth:** Execution plan derived from approved spec documents
- **Primary Owner:** `brainstorm-task`
- **Out of Scope:** New product scope, new schema/API decisions, and code quality review findings

## Upstream Dependencies

| Topic               | Canonical Source                  |
| ------------------- | --------------------------------- |
| Product scope       | `project-context/PRD.md`          |
| Technical structure | `project-context/architecture.md` |
| Data contract       | `project-context/schema.md`       |
| API contract        | `project-context/api.md`          |
| UI contract         | `project-context/StyleGuide.md`   |
| Coding rules        | `project-context/rules.md`        |

## Execution Rules

- Work on tasks **one by one** in order within each phase.
- After each **phase** is complete, **STOP** and wait for user confirmation before the next phase.
- Update status `[ ]` to `[x]` when a task is complete.
- If a task is blocked, mark it `[~]` and note the reason.

---

## Progress Overview

| Phase | Name                    | Status | Progress |
| ----- | ----------------------- | ------ | -------- |
| [ID]  | [Actual approved phase] | [status] | [verified/total] |

Generate only phases with real approved work. If none remains, report that outcome with no placeholder phase.

## AI Read Order

1. Read `Execution Rules`
2. Read `Progress Overview`
3. Read only the current phase
4. Use `References` and `Traceability IDs` before searching elsewhere

---

## Phase 1: [Phase Name]

> **Dependency:** None (first phase)
> **Goal:** [What must be complete at the end of this phase]

### Phase Definition of Done

- [ ] Applicable acceptance criteria pass
- [ ] Required tests/build/type/lint checks pass
- [ ] Required security controls are verified
- [ ] Migration/backfill and failure recovery are verified when applicable
- [ ] Required logs/metrics/alerts are present when applicable
- [ ] Documentation and rollout notes are updated when applicable
- [ ] `spec-compliance` passes
- [ ] `code-review` passes

- [ ] **Task 1.1: [Task Name]**
  - **Files:** `[path/file created or modified]`
  - **Description:** [What is done, briefly]
  - **References:** [`project-context/architecture.md#section` / `project-context/rules.md#section`]
  - **Traceability IDs:** [`FEAT-01` / `BR-01` / `API-01` / `DATA-01`]
  - **Acceptance Criteria:**
    - [ ] [Testable condition 1]
    - [ ] [Testable condition 2]

- [ ] **Task 1.2: [Task Name]**
  - **Files:** `[path/file]`
  - **Description:** [Briefly what is done]
  - **Dependencies:** Task 1.1 must be complete first
  - **References:** [`project-context/[applicable-document].md#actual-section`]
  - **Traceability IDs:** [`FEAT-01` / `DATA-01`]
  - **Acceptance Criteria:**
    - [ ] [Testable condition]

---

## Phase 2: [Phase Name]

> **Dependency:** Phase 1 must be complete
> **Goal:** [Phase goal]

### Phase Definition of Done

- [ ] Applicable acceptance criteria pass
- [ ] Required tests/build/type/lint checks pass
- [ ] Required security controls are verified
- [ ] Migration/backfill and failure recovery are verified when applicable
- [ ] Required logs/metrics/alerts are present when applicable
- [ ] Documentation and rollout notes are updated when applicable
- [ ] `spec-compliance` passes
- [ ] `code-review` passes

- [ ] **Task 2.1: [Task Name]**
  - **Files:** `[path/file]`
  - **Description:** [Brief]
  - **References:** [`project-context/[applicable-document].md#actual-section`]
  - **Traceability IDs:** [`FEAT-01` / `API-01` / `NFR-02`]
  - **Acceptance Criteria:**
    - [ ] [Testable condition]

---

## Traceability Matrix

| Requirement ID | Source | Classification | Covering Task or Verified Evidence |
| -------------- | ------ | -------------- | ---------------------------------- |
| [Existing ID] | [actual source/section] | Existing verified / Existing unverified / Gap | [evidence or approved task ID; unapproved gaps remain separate] |

## Assumptions & Open Questions

- [Assumption that affects planning granularity or order]
- [Open question that may change future phases]

Use the phase/task blocks only as formatting examples for actual approved work. Repeat `Phase Definition of Done` only for generated non-empty phases, adapting items to scope and preserving required safeguards.
