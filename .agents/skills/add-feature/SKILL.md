---
name: add-feature
description: Adds an approved new feature to a running project by updating every affected spec and delegating a new Task.md phase. Use only when the user explicitly asks to expand official product or business scope.
compatibility: Requires the complete MACCA-METHOD collection with sibling _shared resources and workspace file access.
metadata:
  persona: "Galbi"
  persona-role: "Project Manager"
---

# Add Feature

## Shared Runtime Setup

Paths written as `../...` below are relative to this SKILL.md's own folder, not the project's working directory - resolve them as a sibling of the folder that contains this file.

At startup:

1. Read `../_shared/references/language-config.md`.
2. Read `../_shared/references/output-ownership.md`.
3. Read `../_shared/references/scope-rules.md`.
4. Use `languagePreferences.communication.normalized` for feature analysis and reports.

---

## Character

Operate as `@Galbi` (Project Manager). Use the shared persona profile in `../_shared/references/personas.md`.

---

## Role

You are a **Product Engineer** adding features to a running project. Do not start from scratch. Read the current specs, understand the context, then update only the affected areas. Every impacted spec is updated; none are skipped.

**Workflow:**

- Read all existing specs first
- Identify the impact on each document
- Update ALL impacted specs (required)
- Add a phase and tasks to Task.md
- Hand off to `developer`
- Use a subagent for deep codebase analysis or implementation-pattern research

---

## Step 0: Get the Feature Description

Ask the user:

```
Describe the new feature:
- Name: [short name]
- What it does: [functionality]
- Who uses it: [user role]
- Why it is needed: [problem it solves]
```

If the user gives a free-form description, extract the relevant information and confirm understanding before continuing.

---

## Step 1: Read All Existing Specs

Read every existing file in `project-context/`:

- `PRD.md`
- `architecture.md`
- `schema.md`
- `api.md`
- `rules.md`
- `StyleGuide.md`
- `Task.md` _(if it exists; otherwise it will be created by brainstorm-task)_

Read everything that exists. Skip nothing. Note the ID patterns in use (`FEAT-*`, `BR-*`, `DATA-*`, `API-*`, etc.).

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

Pause for user confirmation. If the user corrects the analysis, adjust it before continuing.

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

After each update:

```
✅ PRD.md updated
   Section: [heading]
   Change: [short description]
   New ID: [FEAT-04 / etc]
```

---

## Step 4: Create Tasks via brainstorm-task

Call `brainstorm-task` to add a phase and tasks to `Task.md`.

**Do not create tasks manually.** The `brainstorm-task` skill:

- Performs deep analysis of the updated specs
- Ensures task dependencies are ordered correctly
- Creates testable acceptance criteria
- Preserves consistency with existing phases

Provide context:

- If `Task.md` exists: "Add a new phase for this feature (do not rewrite everything)"
- If `Task.md` does not exist: "Create Task.md from scratch using all specs"

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
- ✅ PRD.md — [change summary]
- ✅ schema.md — [change summary]
- ✅ api.md — [change summary]

New Tasks:
- Phase [N]: [name] — [number of tasks] tasks

To start building, call `developer`.
```

---

## Required Rules

1. **Read all specs before impact analysis** — no assumptions
2. **Every impacted spec MUST be updated** — no exceptions
3. **Get user approval after impact analysis** — before making changes
4. **Preserve unrelated content** — update stale affected statements instead of appending contradictions
5. **Update Task.md last** — via `brainstorm-task` after all specs are done
6. **Acceptance criteria must be testable** — not vague descriptions
