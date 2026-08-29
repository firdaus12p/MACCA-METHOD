# Skill Invocation Policy

This catalog documents intent; it does not replace host routing or safety gates.

Portable Agent Skills rely on `name` and `description`. OpenCode ignores Copilot-specific invocation fields. Therefore canonical skills keep standard frontmatter and express routing through descriptions and workflow boundaries.

| Skill | Policy | Rationale |
|---|---|---|
| `add-feature` | explicit-intent | Broad source-of-truth mutation |
| `brainstorm-prd` | explicit-intent | Long interview and PRD creation |
| `brainstorm-architecture` | explicit-intent | Strategic technical decisions |
| `brainstorm-schema` | explicit-intent | Consequential data contract |
| `brainstorm-api` | explicit-intent | External contract creation |
| `brainstorm-styleguide` | explicit-intent | UI contract interview |
| `brainstorm-rules` | explicit-intent | Repository-wide rules |
| `brainstorm-task` | both | Direct use and `add-feature` orchestration |
| `spec-init` | explicit-intent | Whole-codebase scan and multi-document generation |
| `developer` | explicit-implementation-intent | Broad implementation mutation |
| `quick-dev` | model-auto | Bounded router for small implementation tasks |
| `bug-fix` | both | Automatic bug/error routing and direct use; the first code change still requires explicit implementation approval from the diagnosis gate |
| `spec-compliance` | orchestrated | Called by execution/remediation workflows; ad hoc requests remain valid |
| `code-review` | both | Direct review and post-phase orchestration |
| `spec-audit` | both | Direct audit and final workflow check |
| `release-readiness` | both | Direct pre-release request and project-complete handoff |
| `help` | both | Cheap read-only routing |
| `meet` | both | Non-mutating meeting intent |

Definitions:

- `explicit-intent`: activate only when the request clearly asks for that workflow; the user need not type the skill name.
- `explicit-implementation-intent`: implementation wording such as "implement Phase 2" is sufficient.
- `model-auto`: choose automatically from context.
- `orchestrated`: primarily loaded by another skill.
- `both`: direct and automatic/orchestrated use are valid.

Host adapters may improve discoverability but must not carry essential behavior:

- Copilot VS Code: `disable-model-invocation: true` for explicit-only; `user-invocable: false` for model/orchestrated-only.
- OpenCode: use descriptions, skill permissions, and optional custom commands; it has no equivalent portable frontmatter fields.
