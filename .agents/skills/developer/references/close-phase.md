# Developer Phase Close

Read this file only after every task in the active phase is complete.

## Close the Phase

1. Show the phase summary.
2. Read the phase Definition of Done. Complete every applicable implementation-side item; mark inapplicable items `N/A` with a reason.
3. If a phase plan exists, set `status: code-review`.
4. Run `spec-compliance` using configured fix mode.
5. Only after compliance passes, run `code-review` using configured fix mode.
6. Mark quality-gate Definition of Done items complete only after both pass.
7. Offer the next phase and wait according to Task.md execution rules.

In report-first mode, stop at the active gate. Do not invoke the next gate in the same response.

## Project Complete

When all phases are complete:

1. Show the project summary.
2. Recommend final project-mode `spec-audit`.
3. Before a production release, recommend `release-readiness`.
4. For later small technical maintenance, create a traceable delta task/phase and remain in developer.
5. Route significant business scope expansion to `add-feature`.
