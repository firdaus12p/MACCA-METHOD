# Output Ownership Matrix

## Purpose

This file defines which skill primarily owns each persistent output, so skills do not quietly compete to create the same artifact.

## Primary Owners

| Output | Primary Owner | Secondary / Limited Authors |
|---|---|---|
| `project-context/PRD.md` | `brainstorm-prd` | `add-feature`, `spec-init` |
| `project-context/architecture.md` | `brainstorm-architecture` | `add-feature`, `spec-init` |
| `project-context/schema.md` | `brainstorm-schema` | `add-feature`, `spec-init` |
| `project-context/api.md` | `brainstorm-api` | `add-feature`, `spec-init` |
| `project-context/StyleGuide.md` | `brainstorm-styleguide` | `add-feature`, `spec-init` |
| `project-context/rules.md` | `brainstorm-rules` | `add-feature`, `spec-init` |
| `project-context/Task.md` | `brainstorm-task` | `developer` only updates progress; `add-feature` must hand off to `brainstorm-task` |
| `project-context/bug-log.md` | `bug-fix` | none |
| `project-context/plans/*.md` | `developer` | `add-feature`, `code-review` limited updates per workflow |

## Ownership Rules

- `help` explains and routes. It does not create project spec files.
- `rapat` facilitates decisions and maps them to target artifacts. It does not replace the primary owner of spec files.
- `spec-audit` and `spec-compliance` report findings. They do not rewrite spec artifacts unless the user explicitly asks for follow-up fix work.
- `code-review` reports code issues. It does not own spec documents.
- `spec-init` is the bootstrap exception for existing codebases without specs.

## Drift Rule

If two skills appear to write the same artifact for the same purpose, prefer the primary owner and change the other skill to handoff or delta-update language only.
