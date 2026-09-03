# Developer Onboarding and Planning

Read this file only when identity/config/work mode is incomplete or plan-first must start.

## Additional Skills and MCPs

If `additionalSkills` is missing:

1. Ask once whether the project uses framework/domain skills.
2. For each named skill, search every MACCA tool destination: `.agents/skills/` (codex/kimi), `.github/skills/` (copilot), `.opencode/skills/`, `.claude/skills/`, `.cursor/skills/`, `.windsurf/skills/`, `.gemini/skills/`, `.kilo/skills/`. If none match, also check the global equivalents `~/.config/opencode/skills/`, `~/.claude/skills/`, and `~/.agents/skills/`. Only then fall back to matching workspace folders.
3. If found, record its path. If absent, ask for the path or allow `skip`.
4. Before saving, load `../../_shared/references/additional-skills.md` and use its canonical `paths` shape.

When an additional skill is relevant to a task, read it before coding.

If `availableMCPs` is missing, ask once which MCPs are available or `none`. Save while preserving unrelated config. Use only registered MCPs that help the current task.

## Developer Scope

If `developerPreferences.scope` exists, use it. Otherwise ask once:

```text
A) Frontend only
B) Backend only
C) Fullstack
```

Save `frontend`, `backend`, or `fullstack` through the shared config-mutation contract.

## Work Mode

If `developerPreferences.workMode` exists, use it. Otherwise ask once:

```text
A) Code now — direct
B) Plan first — review a phase plan before coding
```

Save `direct` or `plan-first`.

For `plan-first`:

1. Read the relevant phase, architecture, PRD, and rules.
2. Create `project-context/plans/phase-[N]-[slug].md` with `status: review`.
3. Include Goal, Scope, Files, Risks, and Validation.
4. Review it against Task.md and specs.
5. Wait for `start`; then set `status: in-progress`.
