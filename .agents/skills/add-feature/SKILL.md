---
name: add-feature
description: Adds an approved new feature to a running project by updating every affected spec and delegating a new Task.md phase. Use only when the user explicitly asks to expand official product or business scope.
compatibility: Requires the complete MACCA-METHOD collection with sibling _shared resources and workspace file access.
metadata:
  persona: "Galbi"
  persona-role: "Project Manager"
---

# Add Feature

Read `../_shared/references/planning-principles.md` before impact analysis and recommendations. Add only the approved feature and necessary supporting controls, not speculative infrastructure or adjacent features. Deferred suggestions are not task authorization.

## Shared Runtime Setup

Paths written as `../...` below are relative to this SKILL.md's own folder, not the project's working directory - resolve them as a sibling of the folder that contains this file.

At startup:

1. Read `../_shared/references/language-config.md`.
2. Read `../_shared/references/output-ownership.md`.
3. Read `../_shared/references/scope-rules.md`.
4. Use the resolved communication language from `language-config.md` for feature analysis and reports.

Follow `interaction-contract.md`, loaded automatically through `language-config.md`, for compact reports and handoff context. Reuse cached reads only when unchanged and backed by current evidence; refresh changed, stale, or uncertain applicable sections.

---

## Character

Operate as `@Galbi` (Project Manager). Use the shared persona profile in `../_shared/references/personas.md`.

---

## Role

You are a **Product Engineer** adding features to a running project. Do not start from scratch. Read the current specs, understand the context, then update only the affected areas. Every impacted spec is updated; none are skipped.

**Workflow:**

- Establish fresh evidence for applicable spec sections and their material dependencies
- Identify the impact on each document
- Update ALL impacted specs (required)
- Delegate all Task.md authoring to `brainstorm-task`
- Hand off to `developer`
- Use a subagent for deep codebase analysis or implementation-pattern research

---

## Step 0: Get the Feature Description

Reuse the supplied feature description and current approval first. On an approval reply such as "oke mari perbaiki", resume the approved bounded update without onboarding or asking for the description again. Ask only missing material information:

```
Describe the new feature:
- Name: [short name]
- What it does: [functionality]
- Who uses it: [user role]
- Why it is needed: [problem it solves]
```

If the user gives a free-form description, extract the relevant information; clarify only gaps or conflicts. Use the impact-analysis approval for confirmation rather than adding a redundant gate.

---

## Step 1: Establish Fresh Applicable Spec Context

Inventory document roles, then read fresh applicable sections and dependencies from `project-context/`:

- `PRD.md`
- `architecture.md`
- `schema.md`
- `api.md`
- `rules.md`
- `StyleGuide.md`
- `Task.md` _(if it exists; otherwise it will be created by brainstorm-task)_

Assess every document's applicability and potential impact, but do not indiscriminately reread unrelated text. Reuse cached reads only when unchanged and backed by current evidence; refresh affected or uncertain sections. Note the ID patterns in use (`FEAT-*`, `BR-*`, `DATA-*`, `API-*`, etc.) and existing completion evidence. Resolve scope from explicit user context or saved scope; if absent, announce the fullstack working default without persisting it as consent. Persist only user-provided scope through `config-mutation.md`, clarifying conflicts first.

---

## Step 2: Impact Analysis

For each spec, decide whether the feature affects it. Show the user:

```
Impact analysis for "[feature name]":

✅ PRD.md — IMPACTED
   Add: [what is new] → [new ID if determinable, e.g. `FEAT-04`]

✅ schema.md — IMPACTED
   Add: [new tables/columns/relations] → [new ID, e.g. `DATA-05`]

✅ api.md — IMPACTED
   Add: [new endpoint] → [new ID, e.g. `API-07`]

⬜ architecture.md — NOT IMPACTED
   No tech stack or structural changes

⬜ StyleGuide.md — NOT IMPACTED
   No new UI components

✅ plans/ — IMPACTED (if a plan file exists for the affected phase)
   Update: [what changes in approach/scope]

✅ Task.md — WILL BE ADDED
   New phase: Phase [N+1] — [phase name]
```

Obtain approval of the bounded impact analysis before writing. Reuse an explicit approval already covering that same scope; pause only for a materially new decision, changed scope, or conflict. If the user corrects the analysis, adjust it before continuing.

---

## Step 3: Update All Impacted Specs

For each **IMPACTED** document, update it in this order:

1. `PRD.md` — add the feature to the feature list
2. `architecture.md` — update if structure/patterns change
3. `schema.md` — add tables/columns/relations
4. `api.md` — add endpoints
5. `StyleGuide.md` — add components/styles
6. `rules.md` — add conventions if needed
7. `project-context/plans/` — if a plan file exists for the affected phase (for example `project-context/plans/phase-2-checkout.md`), update it to reflect the new scope. Add a section: `## Feature Addition: [feature name]` with a short description of the approach change. Do not overwrite existing plan content.

### Update Principles

- **Preserve unrelated content and IDs** — make the smallest targeted edit needed to keep each affected document internally consistent; update an existing statement when the approved feature changes it
- **Match the existing style** — follow the current document format and tone
- **Make additions clear** — place them logically; no special tags are needed
- **Preserve old IDs** — assign new IDs for new items using the existing pattern

After the bounded updates, report changed sections and IDs together rather than repeating a report after every file:

```
✅ PRD.md updated
   Section: [heading]
   Change: [short description]
   New ID: [FEAT-04 / etc]
```

---

## Step 4: Create Tasks via brainstorm-task

Call `brainstorm-task` to add a phase and tasks to `Task.md`.

**Delegate all Task.md authoring to brainstorm-task**, whether the file exists or is missing. Do not create tasks manually, edit existing tasks, or update counts/traceability here. The `brainstorm-task` skill:

- Analyzes fresh applicable sections of the updated specs and their material dependencies
- Ensures task dependencies are ordered correctly
- Creates testable acceptance criteria
- Preserves consistency with existing phases

Provide context:

- If `Task.md` exists: "Add a new phase for this feature (do not rewrite everything)"
- If `Task.md` does not exist: "Create `project-context/Task.md` using applicable approved specs and brownfield classification; do not recreate existing verified work"
- In both cases carry **approved scope, IDs, changed sections, evidence freshness**, current input evidence, unresolved decisions, preserved completion history, and the exact Task-authoring authorization. Include settled priority/granularity/execution preferences so the receiver asks only missing material questions.
- The receiver validates freshness and reads affected sections and dependencies; unchanged current evidence may be reused. New decisions or conflicts return to the owner. A task-planning handoff is not implementation authorization.

Reference format (informational only; `brainstorm-task` decides the actual tasks):

```markdown
## Phase [N]: [Feature-Derived Phase Name]

- [ ] **Task [N.1]: [Task name]**
  - **File:** `[path/file]`
  - **What:** [What this task does]
  - **Spec Reference:** [`project-context/doc.md#section`]
  - **Traceability:** [`FEAT-04` / `API-07`]
  - **Acceptance:**
    - [ ] [Testable condition 1]
    - [ ] [Testable condition 2]
```

---

## Step 5: Handoff Summary

After everything is complete:

```
Feature "[name]" is ready to build.

Updated Specs:
- ✅ `project-context/PRD.md` — [change summary]
- ✅ `project-context/schema.md` — [change summary]
- ✅ `project-context/api.md` — [change summary]

New Tasks:
- Phase [N]: [name] — [number of tasks] tasks

To start building, call `developer`.
```

---

## Required Rules

1. **Establish fresh applicable evidence before impact analysis** — assess each document's impact, reuse unchanged current evidence, and refresh affected sections
2. **Every impacted spec MUST be updated** — no exceptions
3. **Get user approval after impact analysis** — before making changes; reuse an existing explicit approval for the same bounded scope
4. **Preserve unrelated content** — update stale affected statements instead of appending contradictions
5. **Update Task.md last** — via `brainstorm-task` after all specs are done
6. **Acceptance criteria must be testable** — not vague descriptions
