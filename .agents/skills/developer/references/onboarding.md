# Developer Onboarding and Planning

Read this file only for a material missing setup decision, requested setup, or starting plan-first. Follow `../../_shared/references/interaction-contract.md` for source reuse, handoff, and compact output. Optional identity/config gaps do not block an explicit request.

## Optional Configuration Owner

Read `../../_shared/references/config-mutation.md` before config use or persistence. `setup-macca-method` (`@Galbi`) owns optional setup, read-only settings display, and targeted saved-setting changes. Route an explicit configuration request there; use `help` for workflow guidance. Do not repeat a whole configuration interview inside developer or require setup just because `.agents/developer-config.json` is absent.

Continue ordinary work with applicable saved choices and task-local intent. Ask only about a material unresolved decision for this work. A single answer explicitly chosen as a persistent preference may be saved here under the shared contract without a setup detour or repeated approval: validate the existing file and merged candidate with the shared validator before writing, preserve unrelated/unknown fields, and show only redacted known values. Missing validator blocks that mutation; invalid config is preserved and reported by field, not overwritten. Missing optional config does not block implementation. Never save defaults, inferred identity/project names, or task-local choices as consent.

Use the safe preference summary from `../../_shared/references/language-config.md`; saved finite preferences are `configured`/`value` fields, not raw scalar fields. Identity has only configured indicators. Do not extract or display saved identity labels. A user name supplied in the conversation may be used optionally. Failed/unavailable reads are not absent preferences; stop the affected lookup instead of falling back to raw config.

## Additional Skills and MCPs

1. Inspect host-provided tool/skill descriptions, applicable permission instructions, and safe configured/count/denied summary indicators for `additionalSkills` / `availableMCPs`. Summary counts do not authorize use. For a requested tool's membership or a named skill's path, follow the local-only exception in `config-mutation.md`; keep raw saved names, paths, entries, and config out of tool output and return only safe status. Distinguish **installed**, **available**, and **user-authorized/allowed**. A visible tool or installed skill is not permission to use it. Discovery itself never executes a discovered skill or grants access.
2. Respect saved allowlists, including an empty list or `none`, and explicit denials. Do not silently add a discovered tool or override a denial. A user can explicitly revise a saved choice; preserve unrelated config when saving the revision.
3. If configuration is missing, use host context only where it establishes both availability and authorization for the current task. Do not convert discovery into a saved allowlist. Ask one focused question only if a needed tool/skill has unresolved authorization or another material decision is missing. No mandatory MCP questionnaire for simple work needing no MCP.
4. Read a relevant authorized skill before coding, reusing current unchanged source already in context. For a user-named skill whose path is unresolved, follow the permitted-location discovery and host-path fallback in `../../_shared/references/additional-skills.md`. Do not scan denied paths or execute a skill just to identify it. Ask for its path or allow `skip` only if it remains needed and unresolved.
5. Before saving user-authorized skill paths, load `../../_shared/references/additional-skills.md` and use its canonical `paths` shape. Never persist credentials or secrets.

## Developer Scope

Use an explicit user scope statement or the configured scope value from the safe preference summary (`developerPreferences.scope.configured` / `.value`). An explicit revision may change the saved boundary; a task that merely seems to need extra files does not. Never silently widen scope or treat a missing field as full-project authorization.

For an unambiguous bounded request, infer its authorized files/behavior and proceed without a generic scope question. Ask only if an unresolved boundary materially changes the work. Use plain language, for example: "Should this cover only the screens, only server-side behavior, or both?" Map a supplied project preference to `frontend`, `backend`, or `fullstack` through the shared config-mutation contract; do not save an inferred task-local boundary as a global preference.

## Work Mode

Reuse the configured work-mode value from the safe preference summary (`developerPreferences.workMode.configured` / `.value`) unless the user explicitly changes it. If missing, an explicit "implement/code now" or "plan first" request resolves the mode for this work. Ask only when the choice remains material and unresolved:

```text
A) Code now — direct
B) Plan first — review a phase plan before coding
```

Save an explicitly chosen persistent preference as `direct` or `plan-first`; do not reopen a resolved choice on a handoff or approval resume.

For `plan-first`:

1. Read the relevant phase, architecture, PRD, and rules.
2. Create `project-context/plans/phase-[N]-[slug].md` with `status: review`.
3. Include Goal, Scope, Files, Risks, and Validation.
4. Review it against Task.md and specs.
5. Wait for `start`; then set `status: in-progress`.
