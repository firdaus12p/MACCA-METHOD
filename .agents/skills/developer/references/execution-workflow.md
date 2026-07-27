# Developer Execution Workflow

## Table of Contents

1. Step 0b — Check Additional Skills
2. Step 1b — Choose Work Mode
3. Step 2 — Select Relevant Specs
4. Step 3 — Execute Tasks One by One
5. Step 4 — After All Phase Tasks Done
6. Step 5 — Project Complete

## Step 0b — Check Additional Skills

Check `developer-config.json` field `additionalSkills` first; if exists, skip question.

If not, ask once:
> "Do you use **additional skills** for this project? E.g., skills specific to frameworks (Laravel, Django, Rails, etc.)?"

**If no:** Continue to Step 1.

**If yes:** Ask:
> "How many? Name each and their purpose briefly."

After answer:
1. Save to `.agents/developer-config.json` using the stable contract from `../_shared/references/runtime-config.md`. Prefer the canonical `paths` object, but keep reading legacy shapes such as `path`, `githubPath`, and `opencodePath`.
2. **Coding rule:** When writing code relevant to a listed skill, read its SKILL.md first. Mandatory.

## Step 1b — Choose Work Mode

Check `.agents/developer-config.json` for `developerPreferences.workMode`:
- If exists, skip question. Show: `[A/B] [mode name]. Using this for this session. Tell me now if you want to change.`
- If missing, offer both options and save choice while keeping other fields:

```text
Before I start, what's your preference?

A) Code now — I start immediately
   Best for: small phases, clear tasks, or no pre-review needed

B) Plan first, then code — I write plan for your review first
   Best for: larger phases, risk of wrong direction, or you want scope review

Pick A or B?
```

### A or workMode="direct"

Save `workMode = "direct"` to config, skip to **Step 2**.

### B or workMode="plan-first"

Save `workMode = "plan-first"`, then:

1. Read relevant specs (especially `project-context/architecture.md`, `project-context/PRD.md`).
2. Create plan file at: `project-context/plans/phase-[N]-[slug].md`
3. Review the plan internally against `Task.md`, `architecture.md`, and `rules.md`.
4. Show the draft to the user and wait for `start` before coding.

Use the existing plan template from the main skill file.

## Step 2 — Select Relevant Specs

**Preflight:** Before coding, verify `project-context/` has:
- `architecture.md` → **required**. If missing, **stop** and ask user to run `brainstorm-architecture` first.
- `rules.md` → optional. If missing, note that code standards can't be verified this phase.
- Others (schema.md, api.md, StyleGuide.md, PRD.md) → optional. If task needs but file missing, warn and note verification gap.

**After spec confirmed present**, select only needed specs per this matrix:

| Condition | Read |
|-----------|------|
| All tasks (always) | `project-context/rules.md`, `project-context/architecture.md` |
| Task touches database/models | + `project-context/schema.md` |
| Task touches API/service endpoint | + `project-context/api.md` |
| Task touches UI/page/component | + `project-context/StyleGuide.md` |
| Feature/requirement unclear | + `project-context/PRD.md` |

**When reading `rules.md`:** Scan `[FORBIDDEN]` section first before any coding. If section doesn't exist, continue without blocking.

## Step 3 — Execute Tasks One by One

### 3a. Understand task
- Read task and acceptance criteria carefully
- Understand what's asked and the done condition
- Climb the ladder from the main skill file after reading the task
- If complex or unclear, ask a focused clarification question

### 3b. Clarify (if ambiguous)

Stop. Don't code yet. Ask one concrete question using the shared confirmation style from `../_shared/references/human-loop.md`.

### 3b.5 — I/O Contract (for non-trivial functions)

For functions with business logic, data transformation, calculation, or validation — write I/O contract first:

```text
Function: [name_function(param1, param2)]

| Input | Expected Output |
|-------|-----------------|
| [real example 1] | [output 1] |
| [real example 2] | [output 2] |
| [edge case] | [edge output] |
```

Skip for simple getters, setters, or one-liners without real logic.

### 3c. Code

Detect task type first:
- **Test task**: write test, then jump to validation
- **Implementation with test dependency**: use the existing test first
- **Standalone implementation**: follow TDD order

For standalone implementation:
1. Write the test first
2. Write the implementation
3. Verify logically whether the test should pass

### 3c.5 — [SELF-REVIEW]

After code done, write:

```text
[SELF-REVIEW] Task: [name]

1. Security risk: [1 potential hole — or "none identified"]
2. Performance bottleneck: [1 area slow at scale — or "none identified"]
3. Spec assumption: [1 thing assumed but not stated — or "none"]
```

### 3c.6 — Validate Task

Run the narrowest validation that proves the task is correct:
- test task → run the test
- implementation with related test → rerun that test
- config/wiring/refactor → run the narrowest relevant check
- no executable validation → document a manual verification

If validation fails from a local defect, fix it and rerun the same validation before continuing.

### 3d. Update Task.md

After validation passes:
1. Change `[ ]` → `[x]` for the completed task
2. Change `[ ]` → `[x]` for acceptance criteria that are now satisfied
3. Add `> Implementation:` only if a brief note is important

### 3e. Brief report to user

Report:
- task completed
- files changed
- validation command/check and result

Then follow `Task.md § Execution Rules` to decide whether to continue automatically or pause.

## Step 4 — After All Phase Tasks Done

1. Show phase summary.
2. Run `spec-compliance`.
3. If clean, run `code-review`.
4. If both pass, offer the next phase and wait for confirmation.

## Step 5 — Project Complete

When all phases are done and Task.md is complete:
1. Show project summary.
2. Suggest final `spec-audit` if needed.
3. Ask whether any final changes are needed before closing.