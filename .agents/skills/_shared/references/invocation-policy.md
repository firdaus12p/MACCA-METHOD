# Skill Invocation Policy

This catalog documents intent; it does not replace host routing or safety gates.

Portable Agent Skills rely on `name` and `description`. OpenCode ignores Copilot-specific invocation fields. Therefore canonical skills keep standard frontmatter and express routing through descriptions and workflow boundaries.

| Skill                     | Policy                         | Rationale                                                                                                                                 |
| ------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `setup-macca-method`      | explicit-intent                | Explicit MACCA setup, targeted saved-setting change, or read-only show; absent optional config does not trigger setup                      |
| `add-feature`             | explicit-intent                | Broad source-of-truth mutation                                                                                                            |
| `brainstorm-prd`          | explicit-intent                | Product/PRD planning, bounded completion/update, or authorized owner handoff                                                                |
| `brainstorm-architecture` | explicit-intent                | Strategic technical decisions                                                                                                             |
| `brainstorm-schema`       | explicit-intent                | Consequential data contract                                                                                                               |
| `brainstorm-api`          | explicit-intent                | External contract creation                                                                                                                |
| `brainstorm-styleguide`   | explicit-intent                | UI contract interview                                                                                                                     |
| `brainstorm-rules`        | both                           | Rules creation or bounded owner update; missing rules route here only after applicable upstream inputs are ready                           |
| `brainstorm-task`         | both                           | Direct use and `add-feature` orchestration                                                                                                |
| `spec-init`               | explicit-intent                | Whole-codebase scan and multi-document generation                                                                                         |
| `developer`               | explicit-implementation-intent | Broad implementation mutation                                                                                                             |
| `quick-dev`               | model-auto                     | Bounded router for small implementation tasks                                                                                             |
| `bug-fix`                 | both                           | Automatic bug/error routing and direct use; the first code change still requires explicit implementation approval from the diagnosis gate |
| `spec-compliance`         | orchestrated                   | Called by execution/remediation workflows; ad hoc requests remain valid                                                                   |
| `code-review`             | both                           | Direct review and post-phase orchestration                                                                                                |
| `spec-audit`              | both                           | Direct audit and final workflow check                                                                                                     |
| `release-readiness`       | both                           | Direct pre-release request and project-complete handoff                                                                                   |
| `help`                    | both                           | Cheap read-only routing                                                                                                                   |
| `meet`                    | both                           | Non-mutating meeting intent                                                                                                               |

Definitions:

- `explicit-intent`: activate only when the request clearly asks for that workflow or an authorized owner handoff covers the bounded update; the user need not type the skill name. This is not blanket permission to regenerate an existing document.
- `explicit-implementation-intent`: implementation wording such as "implement Phase 2" is sufficient.
- `model-auto`: choose automatically from context.
- `orchestrated`: primarily loaded by another skill.
- `both`: direct and automatic/orchestrated use are valid.

An active approval resume retains the origin and review unit under `fix-mode.md`; it takes precedence over onboarding and routing. A completed bug or review does not authorize backlog execution. Approved technical spec sync invokes only the owning skill's bounded delta-update path under `scope-delta.md`, not a fresh product interview.

For a spec-init baseline, selected `Missing Decisions` invoke the primary owner in baseline-completion mode. Preserve evidence, confidence, IDs, and unrelated content; ask only unresolved decisions and material dependencies, then approve the bounded write. Planning mode selection precedes setup, and saved preferences are reused without another full form.

Help checks MACCA settings intent before inspecting project status: explicit setup, “show settings”, and specific saved-preference changes route to `setup-macca-method` (`@Galbi`). Show is read-only with no file creation, defaults write, or interview. An exact field update is already consent for that field, not a whole setup interview. Missing config alone does not trigger setup, and ordinary work or active approval resumes never detour through it. Other skills may save a specific explicit answer through `config-mutation.md` without invoking setup. Tool discovery distinguishes installed/available/allowed and grants no execution or persistence authority.

Help routes from usable specs and actual code, not folder existence: existing code plus empty/missing/placeholder specs → `spec-init`; new project without usable specs → `brainstorm-prd`. Otherwise choose the first unmet applicable input in PRD → architecture → schema → API → StyleGuide → rules → Task order. A stateless provider API does not require schema. Creating rules must not jump ahead of applicable domain decisions. `brainstorm-task` owns task authoring; reviews do not own task/phase completion.

`interaction-contract.md` governs all official skills through `language-config.md` or a direct reference. Reuse only current unchanged source and refresh changed, uncertain, or lost context. Carry scope, review unit, origin/return step, IDs, and evidence across handoffs. Announce fix mode once per authorized workflow unless changed or unavailable; concise clean reports still require every applicable check. These interaction rules do not change mutation approval, saved tool restrictions, host permissions, bug confirmation, or report-first gate requirements.

Host adapters may improve discoverability but must not carry essential behavior:

- Copilot VS Code: `disable-model-invocation: true` for explicit-only; `user-invocable: false` for model/orchestrated-only.
- OpenCode: use descriptions, skill permissions, and optional custom commands; it has no equivalent portable frontmatter fields.
