# Developer Task Execution

Read this file only when executing the current task.

## Select Relevant Specs

`architecture.md` is required. Read `rules.md` and architecture for every task, then conditionally:

| Condition                | Additional source |
| ------------------------ | ----------------- |
| Database/data            | `schema.md`       |
| API/integration          | `api.md`          |
| UI                       | `StyleGuide.md`   |
| Product behavior unclear | `PRD.md`          |

Scan `[FORBIDDEN]` in rules before coding. Enforce `developerPreferences.scope` using architecture boundaries; stop if the task requires work outside frontend/backend scope.

## Understand and Protect Scope

Read the task, acceptance criteria, traceability, and Definition of Done. Follow the shared implementation principles loaded by the parent skill.

If requested behavior is not recorded in `project-context/`, obtain one approval and record an `## Approved Scope Delta` in the active phase plan before coding:

```markdown
## Approved Scope Delta

**Approved:** [YYYY-MM-DD]
**Source:** User request
**Affected files/docs:** [paths]
**Traceability:** DELTA-[N]
**Acceptance Criteria:**

- [ ] [testable condition]
      **Sync requirement:** Update the formal owning spec before phase close or when requested.
```

Do not code an unapproved delta.

## Clarify and Define Behavior

Ask one focused question only for unresolved material ambiguity. For non-trivial business logic, transformation, calculation, or validation, define representative input/output and one edge case before implementation.

## Implement

Before coding:

1. Read relevant registered additional skills.
2. Use relevant registered MCPs; use current documentation for external APIs.
3. Apply the shared implementation-principles ladder.
4. Follow the testing workflow selected in `rules.md`.

After coding, self-review:

```text
[SELF-REVIEW] Task: [name]
1. Security risk: [risk or none identified]
2. Performance bottleneck: [risk or none identified]
3. Spec assumption: [assumption or none]
```

## Validate and Record

Run the narrowest relevant test/build/type/lint/manual check. Repair local defects and rerun before continuing.

**Anti-Loop Safeguard:**

- Attempt a maximum of 2 consecutive automated repair cycles for local validation failures.
- If validation still fails after 2 attempts, STOP immediately and report the failure evidence, root cause, and blocker to the user rather than looping endlessly.

After validation:

1. Mark the task and satisfied acceptance criteria complete.
2. Add a short implementation note only when useful.
3. Do not mark phase Definition of Done items complete until evidence exists.
4. Report files and validation evidence, then follow Task.md execution cadence.
