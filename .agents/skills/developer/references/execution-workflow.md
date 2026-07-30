# Developer Execution Workflow

## Table of Contents

1. Step 0b - Check Additional Skills & MCP
2. Step 0c - Set Developer Scope
3. Step 1b - Choose Work Mode
4. Step 2 - Choose Relevant Specs
5. Step 3 - Execute Tasks One by One
6. Step 4 - After All Phase Tasks Are Complete
7. Step 5 - Project Complete

## Step 0b - Check Additional Skills & MCP

### Additional Skills

Check `additionalSkills` in `developer-config.json` first. If it exists, skip the question.

If it does not exist, ask once:
> "Do you use additional skills for this project? For example, framework-specific skills such as Laravel, Django, or Rails?"

**If no:** continue to the MCP section below.

**If yes:** ask:
> "How many? Name each one and briefly explain its purpose."

For each skill named by the user:

1. **Search the workspace first** in this order:
   - `.agents/skills/{name}/SKILL.md`
   - `.github/skills/{name}/SKILL.md`
   - `.opencode/skill/{name}/SKILL.md`
   - Any file named `{name}.md` or `SKILL.md` inside a folder matching the skill name
2. **If found:** fill the path automatically and tell the user: `"Found {path}. Using it."`
3. **If not found:** ask once per skill: `"I could not find SKILL.md for **{name}**. Where is it? (for example .agents/skills/name/SKILL.md) - or type 'skip' to register it without a path for now."`
4. Save it to `.agents/developer-config.json` using the canonical `paths` format from `../_shared/references/runtime-config.md`. Still read legacy fields such as `path`, `githubPath`, and `opencodePath`.
5. **Coding rule:** When writing code relevant to a listed skill, read that skill's `SKILL.md` first. This is mandatory. If a relevant skill has no path, note that it cannot be auto-loaded.

### Available MCPs

Check `availableMCPs` in `developer-config.json` first. If it exists, skip the question.

If it does not exist, ask once:
> "Which MCPs are available in your workspace? (for example context7, supabase, github - or type 'none')"

Save the answer to `.agents/developer-config.json`:

```json
{ "availableMCPs": ["context7", "supabase"] }
```

If it is already configured, show: `[MCPs: context7, supabase] - tell me now if you want to change it.`

**Usage rule:** Use only MCPs listed in `availableMCPs`. Skip silently if none of them help the current task.

---

## Step 0c - Set Developer Scope

Check `developerPreferences.scope` in `developer-config.json` first. If it exists, skip the question. Show: `[Scope: frontend / backend / fullstack] - tell me now if you want to change it.`

If it is missing, ask once:

```text
What is your scope on this project?

A) Frontend only - I do not touch backend/API/database code
B) Backend only  - I do not touch UI/frontend code
C) Fullstack     - I work across the whole stack
```

Save to `.agents/developer-config.json`:
- A -> `developerPreferences.scope = "frontend"`
- B -> `developerPreferences.scope = "backend"`
- C -> `developerPreferences.scope = "fullstack"`

## Step 1b - Choose Work Mode

Check `.agents/developer-config.json` for `developerPreferences.workMode`:
- If it exists, skip the question. Show: `[A/B] [mode name]. Using this for this session. Tell me now if you want to change it.`
- If it is missing, offer both options and save the choice while preserving other fields:

```text
Before I start, what do you prefer?

A) Code now - start immediately
   Best for: small phases, clear tasks, or no pre-review needed

B) Plan first, then code - write a plan for your review first
   Best for: larger phases, high risk of going in the wrong direction, or when you want a scope review

Choose A or B.
```

### A or workMode="direct"

Save `workMode = "direct"` to the config, then go to **Step 2**.

### B or workMode="plan-first"

Save `workMode = "plan-first"`, then:

1. Read the relevant specs (especially `project-context/architecture.md` and `project-context/PRD.md`).
2. Create a plan file at `project-context/plans/phase-[N]-[slug].md` with this header:
   ```
   ---
   status: review
   phase: [N]
   created: [YYYY-MM-DD]
   ---
   ```
3. Review the plan internally against `Task.md`, `architecture.md`, and `rules.md`.
4. Show the draft to the user and wait for `start` before coding.
5. When the user types `start`, update the plan header: `status: review` -> `status: in-progress`.

Use this minimum plan template:

```markdown
---
status: review
phase: [N]
created: [YYYY-MM-DD]
---

# Phase [N] Plan - [Name]

## Goal
- [phase goal]

## Scope
- [main scope]

## Files
- `[path/file]` - [why it is touched]

## Risks
- [risk 1]

## Validation
- [main test/check]
```

## Step 2 - Choose Relevant Specs

**Preflight:** Before coding, verify that `project-context/` contains:
- `architecture.md` -> **required**. If it is missing, **stop** and ask the user to run `brainstorm-architecture` first.
- `rules.md` -> optional. If it is missing, note that code standards cannot be verified in this phase.
- Others (`schema.md`, `api.md`, `StyleGuide.md`, `PRD.md`) -> optional. If the task needs them and they are missing, warn and note the verification gap.

**After confirming the specs exist**, read only what the task needs:

| Condition | Read |
|-----------|------|
| All tasks (always) | `project-context/rules.md`, `project-context/architecture.md` |
| Task touches database/models | + `project-context/schema.md` |
| Task touches API/service endpoints | + `project-context/api.md` |
| Task touches UI/pages/components | + `project-context/StyleGuide.md` |
| Feature/requirement is unclear | + `project-context/PRD.md` |

**Scope enforcement:** After choosing specs, read `developerPreferences.scope` from `developer-config.json` and use `architecture.md` as the primary boundary. The folder list below is only a fallback when `architecture.md` is not specific enough:

| Scope | Restriction |
|-------|-------------|
| `frontend` | Do not write or modify backend files per `architecture.md`; fallback: avoid `routes/`, `controllers/`, `services/`, `repositories/`, `migrations/`, `database/`. If the task requires backend changes, stop and tell the user. |
| `backend` | Do not write or modify frontend files per `architecture.md`; fallback: avoid `components/`, `pages/`, `views/`, `styles/`, `public/`. If the task requires frontend changes, stop and tell the user. |
| `fullstack` | No restriction. |
| *(missing)* | Treat it as `fullstack`. |

**When reading `rules.md`:** scan `[FORBIDDEN]` first before any coding. If the section does not exist, continue without blocking.

## Step 3 - Execute Tasks One by One

### 3a. Understand the Task
- Read the task and acceptance criteria carefully
- Understand what is requested and what “done” means
- Climb the ladder from the main skill file after reading the task
- If it is complex or unclear, ask one focused clarification question

**MUST:** check whether this task touches something NOT recorded in `project-context/`.

If it does:
- DO NOT leave the `developer` flow
- DO NOT ask the user to restart in another skill
- DO NOT code without recording it first
- MUST record it as an **approved scope delta** in the active phase plan so `spec-compliance` and `spec-audit` can treat it as temporary official scope for the active phase

```text
---
I need confirmation before continuing.

This request touches [feature/data/endpoint/component] that is not yet recorded in project-context/.
If I continue without recording it, spec-compliance will mark it as a violation.

I will record it first as an approved scope delta in the active phase plan, then continue in the same developer session.

Options:
1) Record the approved scope delta, then continue coding (recommended)
2) Cancel
---
```

Wait for the answer. If the user chooses 1:
1. Make sure an active phase plan file exists. If `workMode = "plan-first"`, use the active `project-context/plans/phase-[N]-*.md` file.
2. If `workMode = "direct"` and no plan file exists yet, MUST create a lightweight plan file for the active phase.
3. Add this section to the plan file:

```markdown
## Approved Scope Delta

**Approved:** [YYYY-MM-DD]
**Source:** User request in the active developer session
**Affected files/docs:** `[path/file]`, `project-context/[doc].md`
**Traceability:** `DELTA-[N]`
**Acceptance Criteria:**
- [ ] [testable condition 1]
- [ ] [testable condition 2]
**Sync requirement:** Update the relevant formal spec documents before phase close, or when the user requests formal spec sync.
```

4. After recording the delta, continue to Step 3b in the same session.

MUST NOT code something that is outside the specs without explicit user confirmation and an approved scope delta record.

### 3b. Clarify (if ambiguous)

Stop. Do not code yet. Ask one concrete question using the shared confirmation style from `../_shared/references/human-loop.md`.

### 3b.5 - I/O Contract (for non-trivial functions)

For functions with business logic, data transformation, calculations, or validation, write the I/O contract first:

```text
Function: [function_name(param1, param2)]

| Input | Expected Output |
|-------|------------------|
| [real example 1] | [output 1] |
| [real example 2] | [output 2] |
| [edge case] | [edge output] |
```

Skip this for simple getters, setters, or one-liners without real logic.

### 3c. Code

**MUST do this BEFORE writing a single line of code:**

1. **Additional Skills** - open `developer-config.json`, check `additionalSkills`. If any skill is relevant to this task, MUST read its `SKILL.md` now. The correct best practice lives there, not in memory.
2. **MCP** - open `developer-config.json`, check `availableMCPs`, then use every MCP relevant to the task. Examples: `context7` for external library docs, `codebase-memory-mcp` for codebase discovery. MUST NOT rely on memory for external library APIs when a relevant docs MCP exists.
3. **YAGNI Ladder** - run the ladder from the main `developer` skill. Confirm you are at the lowest valid step before writing code.

MUST NOT skip step 1 or 2 if they are available and relevant.

Detect the task type:
- **Test task**: write the test, then jump to validation
- **Implementation with existing test dependency**: use the existing test first
- **Standalone implementation**: follow TDD order

For standalone implementation:
1. Write the test first
2. Write the implementation
3. Verify logically that the test should pass

### 3c.5 - [SELF-REVIEW]

After the code is done, write:

```text
[SELF-REVIEW] Task: [name]

1. Security risk: [1 potential hole - or "none identified"]
2. Performance bottleneck: [1 area that may be slow at scale - or "none identified"]
3. Spec assumption: [1 assumption that was not stated - or "none"]
```

### 3c.6 - Validate the Task

Run the narrowest validation that proves the task is correct:
- test task -> run the test
- implementation with related test -> rerun that test
- config/wiring/refactor -> run the narrowest relevant check
- no executable validation -> document manual verification

If validation fails because of a local defect, fix it and rerun the same validation before continuing.

### 3d. Update `Task.md`

After validation passes:
1. Change `[ ]` -> `[x]` for the completed task
2. Change `[ ]` -> `[x]` for any satisfied acceptance criteria
3. Add `> Implementation:` only if a short note is important

### 3e. Brief Report to the User

Report:
- task completed
- files changed
- validation command/check and result

Then follow `Task.md § Execution Rules` to decide whether to continue automatically or pause.

## Step 4 - After All Phase Tasks Are Complete

1. Show the phase summary.
2. If a plan file exists for this phase (`project-context/plans/phase-[N]-*.md`), update its status: `in-progress` -> `code-review`.
3. Run `spec-compliance`. It follows `fixMode` from Shared Runtime Setup.
   - **`fix-then-report`**: if clean -> continue to step 4. If issues were fixed -> rerun `spec-compliance` before continuing.
   - **`report-first`**: if issues exist -> `spec-compliance` shows the gate prompt and ends its response. **DO NOT** run `code-review` in the same response. Wait for user confirmation.
4. Run `code-review`. It follows `fixMode` from Shared Runtime Setup.
   - **`report-first`**: if issues exist -> `code-review` shows the gate prompt and ends its response. Do not offer the next phase in the same response.
5. If both pass, offer the next phase and wait for confirmation.

## Step 5 - Project Complete

When all phases are done and `Task.md` is complete:
1. Show the project summary.
2. Suggest a final `spec-audit` if needed.
3. If the user requests new changes that are still small and do not need `add-feature`, enter **Post-Task / Maintenance Mode**:
   - create a small delta phase or delta task in `Task.md`
   - if needed, create/update a lightweight plan file
   - continue within the `developer` skill
4. If the change expands business scope significantly or adds a new primary artifact, route to `add-feature`.
