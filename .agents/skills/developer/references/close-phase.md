# Developer Phase Close

Read this file only after every task in the active phase is complete.

Follow `../../_shared/references/interaction-contract.md`. Reuse current unchanged sections already in context and refresh changed/unknown sources. A delegate reads the reference relevant to its work; send the review unit, origin/return step, approved scope/files and IDs, criteria, checked sources/freshness, pending issues, validation evidence, and next action. Keep this context in the session without secrets or a new state file.

## Close the Phase

1. Assemble the phase summary for the combined closing result; do not print a separate clean report before each gate.
2. Read the phase Definition of Done. Complete every applicable implementation-side item; mark inapplicable items `N/A` with a reason.
3. Read `../../_shared/references/scope-delta.md`. Collect approved deltas from Task.md and the phase plan, complete each named formal spec sync through its owning skill, and validate affected document pairs. Record sync evidence; unresolved sync blocks phase closure. Reuse approved technical decisions without reopening discovery.
4. If a phase plan exists, set `status: code-review`.
5. Run `spec-compliance` with review unit `phase`, all phase tasks, delta/sync evidence, and implementation-side DoD using configured fix mode. Its own result and downstream code-review remain pending, not circular prerequisites.
6. Only after compliance passes, run `code-review` for that same phase using configured fix mode. Retain developer's phase-close return step across approval pauses.
7. Only after both pass and all applicable DoD and sync evidence exist, developer marks quality-gate items complete and sets the phase plan to `status: done`. Record any relevant review deviation notes here. A task-only review or standalone report never authorizes phase completion.
8. Show one combined phase result with changed files, actual validation/gate results, and remaining issues or limitations. Offer the next phase and wait according to Task.md execution rules and the user's ongoing authorization.

In report-first mode, stop at the active gate. Do not invoke the next gate in the same response.

All applicable compliance, code-quality, and security checks remain mandatory internally. Keep evidence available; show detailed findings and the actionable manifest with one shared gate when eligible. Missing evidence stays visible as `NOT VERIFIED`; `N/A` requires genuine inapplicability and a reason. Clean gate results return to developer for the combined summary, not separate user-facing tables. Announce fix mode only once for the authorized workflow.

## Project Complete

When all phases are complete:

1. Show the project summary.
2. Recommend final project-mode `spec-audit`.
3. Before a production release, recommend `release-readiness`.
4. For later small technical maintenance, create a traceable delta task/phase and remain in developer.
5. Route significant business scope expansion to `add-feature`.
