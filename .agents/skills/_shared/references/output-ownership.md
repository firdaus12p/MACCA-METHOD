# Output Ownership Matrix

## Purpose

This file defines which skill primarily owns each persistent output, so skills do not quietly compete to create the same artifact.

Read and follow `workspace-safety.md` before any persistent output mutation.

## Primary Owners

| Output                            | Primary Owner             | Secondary / Limited Authors                                                                                                                                                                      |
| --------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.agents/developer-config.json`  | `setup-macca-method` (`@Galbi`) | Other skills may save a specific explicitly chosen preference under `config-mutation.md`; `help` only routes. No duplicate per-host config or mandatory setup handoff |
| `project-context/PRD.md`          | `brainstorm-prd`          | `add-feature`, `spec-init`                                                                                                                                                                       |
| `project-context/architecture.md` | `brainstorm-architecture` | `add-feature`, `spec-init`                                                                                                                                                                       |
| `project-context/schema.md`       | `brainstorm-schema`       | `add-feature`, `spec-init`                                                                                                                                                                       |
| `project-context/api.md`          | `brainstorm-api`          | `add-feature`, `spec-init`                                                                                                                                                                       |
| `project-context/StyleGuide.md`   | `brainstorm-styleguide`   | `add-feature`, `spec-init`                                                                                                                                                                       |
| `project-context/rules.md`        | `brainstorm-rules`        | `add-feature`, `spec-init`                                                                                                                                                                       |
| `project-context/Task.md`         | `brainstorm-task`         | `developer` updates progress and approved phase deltas; `quick-dev` adds one approved lightweight entry; `add-feature` delegates all Task.md authoring to `brainstorm-task`, whether existing or missing |
| `project-context/bug-log.md`      | `bug-fix`                 | none                                                                                                                                                                                             |
| `project-context/plans/*.md`      | `developer`               | `add-feature` approved additions; `code-review` only explicitly requested bounded corrections, never automatic status completion |

## Ownership Rules

- `setup-macca-method` is the default configuration owner. Its show mode is strictly read-only; its setup/update modes persist only user-chosen fields after existing and candidate validation through the shared validator. Defaults and inferred identity/project labels are never saved as consent. Other skills read the shared contract and may persist one explicit answer without a whole setup interview.
- `help` explains and routes. It does not create project spec files or mutate config; explicit settings intent routes to `setup-macca-method` before project-status discovery. Optional absent config does not block ordinary work.
- `meet` facilitates one structured persona round and maps decisions to target artifacts. It does not replace the primary owner of spec files.
- `spec-audit` and `spec-compliance` report findings. They do not rewrite spec artifacts unless the user explicitly asks for follow-up fix work.
- `code-review` reports code issues. It does not own spec documents or automatically mutate task/plan status. Developer owns phase closure; quick-dev/bug-fix receive only their selected unit's evidence.
- `spec-init` is the bootstrap exception for existing codebases without specs.
- `spec-init` routes selected `Missing Decisions` to the primary owner in **baseline-completion mode** under `brainstorm-session.md`. The owner asks targeted questions, approves a bounded update, and retains evidence, confidence, IDs, unrelated unknowns, and unrelated text. This is distinct from approved technical sync; it does not authorize overwrite or regeneration.
- Owner handoffs carry approved scope, IDs, changed sections, evidence freshness, unresolved decisions, and authorization boundaries. Reuse unchanged current evidence and refresh affected sections before writing.
- `bug-fix` may add one narrowly scoped regression guard to a spec or rule after explicit implementation approval of its manifest, before final bug confirmation. Validate that guard with the fix; larger document changes return to the primary owner. Final bug confirmation authorizes logging the checked result, not new implementation changes.
- `release-readiness` is report-only and owns no persistent project artifact unless the user explicitly requests a saved copy of its report.
- Approved technical deltas in Task.md or a phase plan allow only the named bounded formal sync through the owning spec skill under `scope-delta.md`. Complete that sync before phase closure; broad rewrites and new product decisions need separate approval.

## Drift Rule

If two skills appear to write the same artifact for the same purpose, prefer the primary owner and change the other skill to handoff or delta-update language only.
