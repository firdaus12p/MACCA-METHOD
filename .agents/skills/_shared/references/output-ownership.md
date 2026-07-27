# Output Ownership Matrix

## Purpose

This file defines which skill is the primary owner of each persistent output so
multiple skills do not silently compete to author the same artifact.

## Primary Owners

| Output | Primary Owner | Secondary / Limited Writers |
|---|---|---|
| `project-context/PRD.md` | `brainstorm-prd` | `add-feature`, `spec-init` |
| `project-context/architecture.md` | `brainstorm-architecture` | `add-feature`, `spec-init` |
| `project-context/schema.md` | `brainstorm-schema` | `add-feature`, `spec-init` |
| `project-context/api.md` | `brainstorm-api` | `add-feature`, `spec-init` |
| `project-context/StyleGuide.md` | `brainstorm-styleguide` | `add-feature`, `spec-init` |
| `project-context/rules.md` | `brainstorm-rules` | `add-feature`, `spec-init` |
| `project-context/Task.md` | `brainstorm-task` | `developer` updates progress only; `add-feature` must hand off to `brainstorm-task` |
| `project-context/bug-log.md` | `bug-fix` | none |
| `project-context/plans/*.md` | `developer` | none |

## Ownership Rules

- `help` explains and routes. It does not author project spec files.
- `rapat` facilitates decisions and maps them to target artifacts. It does not
  replace the primary owner of a spec file.
- `spec-audit` and `spec-compliance` report findings. They do not rewrite spec
  artifacts unless the user explicitly asks for a repair task.
- `code-review` reports issues in code. It does not become the owner of spec
  documents.
- `spec-init` is the bootstrap exception for existing codebases without specs.

## Drift Rule

If two skills appear to write the same artifact for the same purpose, prefer the
primary owner and convert the other skill to handoff language or delta-only
updates.