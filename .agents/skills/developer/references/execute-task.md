# Developer Task Execution

Read this file only when executing the current task.

Follow `../../_shared/references/interaction-contract.md`. A delegate reads this reference when executing; pass the review unit, origin/return step, approved scope/files and IDs, checked sources/freshness, pending issues, and next action. Reuse current unchanged source already read; refresh changed sources or unknown/compacted context. Keep handoff context in the session, without secrets or a new state file.

## Select Relevant Specs

`architecture.md` and `rules.md` are required. Before each task, ensure their fresh relevant sections are in context, including applicable boundaries and all relevant `[FORBIDDEN]` rules. Reuse sections already read from current unchanged sources; read again only for changes, missing sections, or unknown/compacted context. If `architecture.md` is missing, stop and route to `brainstorm-architecture`; if `rules.md` is missing, stop and route to `brainstorm-rules`. Do not write code until both documents exist.

| Condition                | Additional source |
| ------------------------ | ----------------- |
| Database/data            | `schema.md`       |
| API/integration          | `api.md`          |
| UI                       | `StyleGuide.md`   |
| Product behavior unclear | `PRD.md`          |

Scan `[FORBIDDEN]` in rules before coding. Enforce `developerPreferences.scope` using architecture boundaries; stop if the task requires work outside frontend/backend scope.

## Understand and Protect Scope

Read the task, acceptance criteria, traceability, and Definition of Done. Follow the shared implementation principles loaded by the parent skill.

If requested behavior is not recorded in `project-context/`, read `../../_shared/references/scope-delta.md`. An explicit request is sufficient approval for a bounded technical delta; do not ask again merely because the specs have not recorded it. Ask only for an unresolved material scope/business decision or separate destructive-change approval. Record an `## Approved Scope Delta` before coding: use the active phase plan in plan-first mode, a lightweight Task.md entry for quick-dev, or Task.md/a minimal phase plan in direct mode. These are equivalent evidence; do not require a phase plan for a valid Task.md delta.

Minimum example (also include the task/phase anchor, bounded change, validation, and owning-skill sync checklist):

```markdown
## Approved Scope Delta

**Approved:** [YYYY-MM-DD]
**Source:** User request
**Affected files/docs:** [paths]
**Traceability:** DELTA-[N]
**Acceptance Criteria:**

- [ ] [testable condition]

**Sync requirement:** Update the named formal spec through its owning skill before phase close or when requested.
```

Do not code an unapproved delta. Approved technical deltas grant bounded sync permission under `scope-delta.md`, not permission for broad spec rewrites or new product scope.

## Clarify and Define Behavior

Ask one focused question only for unresolved material ambiguity. For non-trivial business logic, transformation, calculation, or validation, define representative input/output and one edge case before implementation.

## Implement

Before coding:

1. Read relevant available and authorized additional skills, respecting saved allowlists and denials.
2. Use relevant available and authorized MCPs; use current documentation for external APIs. Availability alone is not authorization; resolve material missing permission using `onboarding.md` without a general setup interview.
3. Apply the shared implementation-principles ladder.
4. Follow the testing workflow selected in `rules.md`.

After coding, self-review internally and retain evidence for:

```text
[SELF-REVIEW] Task: [name]
1. Security risk: [risk or none identified]
2. Performance bottleneck: [risk or none identified]
3. Spec assumption: [assumption or none]
```

Show these details only for findings, material assumptions, missing evidence, or a user request; do not print a routine clean self-review banner.

## Validate and Record

Run the narrowest relevant test/build/type/lint/manual check. Repair local defects and rerun before continuing.

**Anti-Loop Safeguard:**

- Attempt a maximum of 2 consecutive automated repair cycles for local validation failures.
- If validation still fails after 2 attempts, STOP immediately and report the failure evidence, root cause, and blocker to the user rather than looping endlessly.

After validation:

1. Mark the task and satisfied acceptance criteria complete.
2. Add a short implementation note only when useful.
3. Do not mark phase Definition of Done items complete until evidence exists.
4. Retain files and validation evidence for the origin's combined summary, then follow Task.md execution cadence. Surface blockers immediately; do not print a separate clean report at each internal step.
