# MACCA Skill Contract Catalog

Compact framework-audit index. This is not a replacement for each `SKILL.md`; it identifies which full files need inspection when a conflict is suspected.

| Skill                     | Invocation                     | Reads                                                | Writes / Output                             | Primary Handoff           |
| ------------------------- | ------------------------------ | ---------------------------------------------------- | ------------------------------------------- | ------------------------- |
| `brainstorm-prd`          | explicit-intent                | scope/config, user discovery                         | `PRD.md`                                    | `brainstorm-architecture` |
| `brainstorm-architecture` | explicit-intent                | PRD                                                  | `architecture.md`                           | schema/API/style/rules    |
| `brainstorm-schema`       | explicit-intent                | PRD, architecture                                    | `schema.md`                                 | `brainstorm-api`          |
| `brainstorm-api`          | explicit-intent                | PRD, architecture, schema when applicable            | `api.md`                                    | style/rules/task          |
| `brainstorm-styleguide`   | explicit-intent                | PRD, architecture                                    | `StyleGuide.md`                             | rules/task                |
| `brainstorm-rules`        | explicit-intent                | architecture and applicable domain specs             | `rules.md`                                  | `brainstorm-task`         |
| `brainstorm-task`         | both                           | applicable specs                                     | `Task.md`                                   | `developer`               |
| `add-feature`             | explicit-intent                | all existing specs                                   | approved spec deltas; delegates Task        | `developer`               |
| `spec-init`               | explicit-intent                | existing code/config/evidence                        | bootstrap specs, not Task                   | audit/task                |
| `developer`               | explicit-implementation-intent | Task and relevant specs                              | code, Task progress, plans                  | compliance/review         |
| `quick-dev`               | model-auto                     | relevant specs                                       | bounded code and Task entry                 | compliance/review         |
| `bug-fix`                 | both                           | bug log, relevant code/specs                         | approved fix, prevention, confirmed bug log | compliance/review         |
| `spec-compliance`         | orchestrated                   | code and applicable specs                            | report; approved fixes                      | code-review               |
| `code-review`             | both                           | diff/code, rules, architecture, applicable contracts | report; approved fixes                      | phase completion          |
| `spec-audit`              | both                           | spec pairs or framework catalog                      | report; explicitly requested corrections    | owning skills             |
| `release-readiness`       | both                           | existing quality/release evidence                    | report only                                 | release owner             |
| `help`                    | both                           | project status/config/catalog                        | routing report                              | selected skill            |
| `meet`                    | both                           | agenda-relevant evidence                             | one-round discussion report                 | owning skills             |

Framework invariants:

- Persistent artifact ownership comes from `output-ownership.md`.
- Scope comes from `scope-rules.md`.
- Review gates come from `fix-mode.md`.
- Invocation intent comes from `invocation-policy.md`.
- Brainstorm pacing/depth comes from `brainstorm-session.md`.
- `release-readiness`, `help`, and `meet` are report-only.
- Execution order is `developer/quick-dev/bug-fix` → `spec-compliance` → `code-review`.
