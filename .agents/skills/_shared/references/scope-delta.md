# Approved Scope Delta Evidence

Use this contract when an approved technical change is not yet represented in the formal specs. It is temporary evidence for the named task/phase, not permanent cross-phase approval or permission to expand business scope.

## Record Before Coding

Use one canonical record and link to it rather than duplicating approval:

- **Plan-first:** `## Approved Scope Delta` in the active phase plan.
- **Quick-dev:** a lightweight `## Approved Scope Delta` entry under the related task in `Task.md`; no separate phase plan is required.
- **Direct developer mode:** the same Task.md entry, or a minimal active phase plan containing the delta with `status: in-progress`. Creating this evidence does not switch to plan-first or reopen an already approved decision.

Include the approval source/date, task/phase ID, `DELTA-*` ID, bounded behavior/change, affected files/specs, testable acceptance criteria, validation, and a sync checklist naming each owning skill/document. Preserve existing task IDs and completion evidence. Record only the actual delta; if everything is already specified, no delta is required.

The explicit request can supply approval for a bounded technical delta. Ask once only when scope or business behavior still needs a decision. Significant product expansion belongs to `add-feature`. Approval must precede coding; recording it afterward is not sufficient.

## Formal Spec Sync

Delta approval includes bounded sync permission: update only the named technical details through the owning spec skill using the recorded decision, without a new discovery interview. It does not authorize a broad rewrite, a new product decision, or replacement of unrelated user edits. Consult `output-ownership.md` for the owner. Ask only for a materially new decision or conflict.

Quick-dev may finish its task with a visible `pending formal spec sync` checklist and owner handoff. Developer must collect deltas from both Task.md and the phase plan, complete the owning-skill sync and affected validation, and record evidence before phase closure. An unresolved sync item blocks phase closure, not an otherwise verified individual task. Temporary approval cannot be carried into another phase as a substitute for sync.
