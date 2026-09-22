# Workflows

[README and 19-skill catalog](../README.md) · [Configuration](configuration.md) · [Troubleshooting](troubleshooting.md)

Start with the state of your project and the outcome you want. MACCA's planning skills write decisions into `project-context/`; execution skills implement authorized work and check it against those decisions. Installing MACCA does not generate these project documents.

## Choose a starting point

| Your situation | Useful request |
| --- | --- |
| New idea, no usable specs | “Use brainstorm-prd to plan an appointment-booking app for a small clinic.” |
| Existing code, missing or placeholder-only specs | “Use spec-init in guided mode to document this codebase. Preserve existing documents unless I approve their replacement.” |
| Existing spec needs one decision completed | “Complete only the retention-policy Missing Decision in schema.md; preserve the baseline evidence and other unknowns.” |
| Approved work is ready | “Implement Phase 2 from Task.md, following its execution rules.” |
| Unsure what is next | “Use help to recommend the next step from the current project evidence.” |

Natural-language intent is enough; `Use the skill <name>` is also explicit. You do not need to address a persona. Roles are assigned by each skill, not selected as a prerequisite to ordinary work. See the README catalog for all 19 skills rather than treating every skill as a required step.

## New project: plan only applicable domains

Follow this order for new planning:

```text
PRD → architecture → applicable schema → applicable API → applicable StyleGuide
    → rules → spec-audit (recommended) → Task → authorized implementation
```

| Decision | Owner and output | When it applies |
| --- | --- | --- |
| Product scope and outcomes | `brainstorm-prd` → `PRD.md` | Establish approved requirements first. |
| Technical boundaries and operations | `brainstorm-architecture` → `architecture.md` | Required before domain design and implementation. |
| Persistence | `brainstorm-schema` → `schema.md` | Only for persisted data within scope. |
| Exposed or consumed contracts | `brainstorm-api` → `api.md` | REST, GraphQL, RPC, events, or integrations actually needed. |
| UI/UX | `brainstorm-styleguide` → `StyleGuide.md` | Only for in-scope UI; branches from architecture and feeds rules. |
| Coding and testing conventions | `brainstorm-rules` → `rules.md` | After architecture and all applicable domain inputs. |
| Verifiable tasks and phases | `brainstorm-task` → `Task.md` | Derive work from applicable approved specs. |

**A backend does not automatically need persistence.** A stateless provider API needs architecture and an API contract; schema can be `N/A — no in-scope persistence`. A frontend consuming an external API can document its consumer contract without designing backend storage. StyleGuide does not replace data/API decisions or rules. See the [API planning contract](../.agents/skills/brainstorm-api/SKILL.md).

Use `N/A` with a reason only for genuinely inapplicable inputs. An applicable but missing decision is unresolved, not `N/A`. Plan the smallest sufficient solution while retaining necessary security, accessibility, integrity, validation, and recovery controls; template examples are not automatic features or infrastructure.

Planning reuses saved pacing and recommendations, including `recommendations: false`. Discussion depth is independent: brief (`quick`) only for explicitly disposable prototypes, normal (`standard`) for production by default, and very thorough (`critical`) for material risk such as payments or sensitive data. Greater depth means better risk questions, not automatically more components. See [planning modes and discussion policy](../.agents/skills/_shared/references/brainstorm-session.md).

## Existing project: establish an evidence-backed baseline

[spec-init](../.agents/skills/spec-init/SKILL.md) documents what exists. An empty `project-context/` directory or template placeholders do not count as usable specs.

1. Choose **batch** (all applicable documents together) or **guided** (one document, review, then continue).
2. Generate in evidence order: `architecture.md` → applicable `schema.md` → applicable `api.md` → applicable `StyleGuide.md` → `rules.md` → `PRD.md`. PRD comes last because it is synthesized from observed behavior.
3. Review `Input Evidence`, `Confidence Summary`, assumptions, and `Missing Decisions`.
4. Complete selected or blocking Missing Decisions through their owning brainstorm skill, then check consistency with `spec-audit`.
5. Ask `brainstorm-task` to plan approved remaining work. Start `developer` only with implementation authorization.

Confidence means **High** for direct source evidence, **Medium** for a stated strong inference, and **Low** for a weak inference requiring verification. It is not proof that acceptance tests passed or that product policy was approved.

Task planning distinguishes:

- **Existing verified:** retain completion and its evidence.
- **Existing unverified:** plan verification or decision work, not replacement by default.
- **Gaps:** plan implementation only for demonstrated, approved differences from requirements.

Baseline approval does not authorize rebuilding existing features or implementing every observed gap. `spec-init` does not author `Task.md`; that belongs to [brainstorm-task](../.agents/skills/brainstorm-task/SKILL.md).

### Complete or update an existing spec without regenerating it

Name the document and the selected decision or section:

> Use brainstorm-prd to complete only the rollout Missing Decision. Keep Input Evidence, Confidence Summary, stable IDs, unrelated text, and all other unresolved decisions.

The owner asks targeted questions and obtains approval for the bounded update, reusing approval already covering that exact change. A newly approved policy does not turn into a claim that existing code implements it. Full regeneration requires an explicit request and approval naming the files to replace, including placeholders. See [bounded completion](../.agents/skills/_shared/references/brainstorm-session.md) and [output ownership](../.agents/skills/_shared/references/output-ownership.md).

## Implement a task or phase

[developer](../.agents/skills/developer/SKILL.md) needs clear implementation intent. Existing tasks alone do not start execution. Before code changes, `architecture.md` and `rules.md` are required; read schema, API, and UI contracts when relevant, and PRD when product behavior needs clarification. Scan applicable `[FORBIDDEN]` rules and respect the authorized file/scope boundary.

### Direct, plan-first, and execution cadence

- **Direct:** implement the authorized task using the applicable specs and validation policy.
- **Plan-first:** write `project-context/plans/phase-[N]-[slug].md` with goal, scope, files, risks, and validation. It starts at `status: review`; after the user's `start`, it becomes `in-progress`.
- **Execution cadence:** `Task.md` separately determines whether to stop after each task or after a phase. Work mode does not erase those stops or authorize the next phase.

Plan status follows `review → in-progress → code-review → done`. The developer owns the final transition after all phase tasks, applicable Definition of Done, formal spec synchronization, and both quality gates have evidence. A passing task or standalone review does not close a phase.

Practical requests:

> Implement Task 2.1 only, then stop. Use the testing workflow in rules.md.

> Plan Phase 3 first. I want to review the files, risks, and validation before coding.

Per task: understand acceptance criteria → reuse existing capabilities → implement under the testing policy → internal self-review → validate → record progress. Test-first is required when `rules.md` selects it; it is not imposed on every project. Source details: [task execution](../.agents/skills/developer/references/execute-task.md), [planning](../.agents/skills/developer/references/onboarding.md), and [phase closure](../.agents/skills/developer/references/close-phase.md).

### Small changes and approved technical deltas

Use [quick-dev](../.agents/skills/quick-dev/SKILL.md) for a small, clearly anchored layout, copy, styling, or minor logic change. It records the task and runs the same two gates at task scope. New features, migrations, new API endpoints, changes exceeding five files, or work without a current task/phase anchor route to developer. Broader post-task maintenance stays with developer and receives a traceable delta task/phase.

An approved technical change not yet in formal specs needs one `## Approved Scope Delta` record **before coding**:

- Plan-first: use the active phase plan.
- Quick-dev: use a lightweight entry under the related task in `Task.md`.
- Direct: use `Task.md` or a minimal active phase plan.

Record approval, task/phase anchor, `DELTA-*` ID, bounded change, affected files/specs, acceptance criteria, validation, and owning-skill sync checklist. The explicit bounded request can supply approval; new business decisions still need their owner.

Quick-dev can finish a verified task with **pending formal spec sync** visible. Before phase closure, developer collects deltas from both locations, completes the named updates through the owning skills, and validates the affected document pairs. Unresolved sync blocks phase closure. See the [scope-delta contract](../.agents/skills/_shared/references/scope-delta.md).

## Understand the two quality gates

```text
Implementation and validation → spec-compliance → code-review → origin's result
```

1. [spec-compliance](../.agents/skills/spec-compliance/SKILL.md) checks implementation against applicable requirements, contracts, rules, acceptance criteria, and scope (SC-01–SC-08).
2. [code-review](../.agents/skills/code-review/SKILL.md) checks code quality and security. Its [canonical checklist](../.agents/skills/code-review/references/review-checklist.md) contains the 27 CR checks and 10 SEC checks.

Both use the same review unit: task, phase, or bug. Unfinished sibling tasks do not block an otherwise complete task review. `spec-audit` serves a different purpose: consistency between documents, rather than implementation against documents.

**Read the result accurately:** `N/A` means a check does not apply, with a reason. `NOT VERIFIED` means required evidence is missing. Zero findings is not a verified pass when evidence is absent. Clean child reviews feed one combined result at the originating workflow; concise output does not remove checks.

`codeReviewPreferences.fixMode` controls remediation:

| Mode | Behavior |
| --- | --- |
| `report-first` (default) | Report evidenced fixes, then wait before applying them. A correction gate requires a **non-empty actionable fix manifest** with IDs, targets, bounded changes, and validation. |
| `fix-then-report` | Apply authorized actionable BLOCKER/MAJOR fixes, validate, then report. MINOR findings are discussed; INFO is report-only. |

Clean and INFO-only reports do not ask for repair approval. Missing evidence alone does not justify invented fixes or a correction gate. A reply such as `yes`, `fix`, or `continue` approves the active manifest; named IDs approve only those fixes. The workflow resumes at its recorded return step rather than restarting setup. Bug implementation approval and other scope/destructive-change gates still apply. Exact gate text and resume rules live in [fix-mode.md](../.agents/skills/_shared/references/fix-mode.md).

## Fix a bug, including prevention

> Use bug-fix: submitting an empty quantity crashes the order form. It should show a validation error. Reproduce with these steps: …

[bug-fix](../.agents/skills/bug-fix/SKILL.md) follows this sequence:

```text
Bug-log check → diagnosis and related-pattern/caller checks
→ root cause + fix/prevention manifest → explicit implementation approval
→ fix and prevention → regression validation → spec-compliance → code-review
→ user confirms checked result → append bug-log
```

The first implementation approval is required regardless of fix mode. Prevention is disclosed with the fix: a focused test, a justified spec/rule guard, or repeatable manual steps. Validate affected behavior and preserve safe fail-before/pass-after evidence where feasible; disclose any limitation.

After regression validation and both gates pass, the user confirms whether the checked result works. Only then is `project-context/bug-log.md` created/appended. New code, tests, or guards discovered after confirmation require new bounded approval, validation, both gates, and confirmation of the revised result before logging.

## Expand product scope

> Use add-feature to add customer CSV export. Show the impact on existing specs and plans before updating them.

[add-feature](../.agents/skills/add-feature/SKILL.md) analyzes every document's applicability and impact, obtains approval, then updates every affected spec and existing phase plan while preserving unrelated content and IDs. It delegates **all `Task.md` authoring to `brainstorm-task`**, whether the file exists or is missing. The task-planning handoff prepares work; implementation starts with separate authorization to developer.

## Discuss a decision with the team

> Use meet. Agenda: choose a rollout approach. Outcome: one recommendation and unresolved risks. Participants: Fachri, Firdaus, Ikhsan. Constraints: one maintainer and no extra infrastructure. Evidence: the rollout section of PRD.md.

[meet](../.agents/skills/meet/SKILL.md) is one structured, discussion-only round. It reuses the agenda, desired outcome, and constraints supplied or clearly inferable from context, asking only material gaps rather than repeating a form; evidence is optional. Available participants are Galbi (product), Fachri (technical design), Akram (UI/UX), Firdaus (implementation), and Ikhsan (failure analysis).

Name participants, explicitly choose `all`, or delegate selection to Galbi, who chooses relevant roles and briefly explains why. Without selection or delegation, Galbi recommends a bounded set of roles and asks one participant choice; it never defaults to all. Only selected participants contribute, each exactly once, in the fixed order above, with explicit evidence/assumption labels. Contributions stay complete and concise; five subheadings per persona are not required. Galbi always facilitates and summarizes in the same response, contributing as a participant only when selected. There are no rebuttals or fabricated consensus.

The summary separates recommendations from **user-approved decisions**, each tied to its exact user approval source and scope. Team agreement is not authorization. Open questions and next steps appear only when useful; omit empty fields and status gates. No-change conclusions and general discussion need no artifact, task, or next skill. Artifact handoffs are conditional on a concrete in-scope persistent change and report the target, owning skill, bounded change, and approval or pending choice. MACCA preferences belong to `setup-macca-method`, not `rules.md`.

The meeting is report-only: it makes no file writes or status changes and executes no follow-up skills. Later authorized writes go to the appropriate owner. It closes automatically; a clear natural-language request such as “continue discussing the rollout risks” can start one new round with a new or refined agenda, reusing still-applicable context and participant choices. The literal skill name is not required. It does not automatically reopen indefinitely; a vague continuation needs only the material clarification.

## Check release readiness

> Use release-readiness for commit `<candidate>` targeting staging. Report the evidence and blockers.

After completed phases, check final document consistency with `spec-audit`; before release, use [release-readiness](../.agents/skills/release-readiness/SKILL.md). It consumes existing quality evidence and checks candidate-specific build/smoke results, configuration, applicable migration/recovery, rollback, observability, compatibility, and UI evidence.

The verdict is `READY`, `CONDITIONAL`, or `NOT READY`; missing required evidence remains `NOT VERIFIED`. This is a report-only audit: it does not deploy, publish, apply migrations, rotate secrets, or change infrastructure. A verdict applies to the checked candidate and relevant configuration.

## Follow the trace without duplicating it

Stable IDs connect requirements to contracts, tasks, and evidence: `FEAT-*`, `BR-*`, `AC-*`, `NFR-*`, and `US-*` for product requirements; `DATA-*` for persisted entities; `API-*` for operations; `RULE-*` for rules; `DELTA-*` for approved technical changes. Preserve existing IDs rather than renumbering during updates.

Use the [ownership matrix](../.agents/skills/_shared/references/output-ownership.md), [task-authoring rules](../.agents/skills/brainstorm-task/SKILL.md), and [interaction contract](../.agents/skills/_shared/references/interaction-contract.md) for exact handoffs. These guides summarize the workflow; the linked skill instructions and checklists carry its detailed requirements.
