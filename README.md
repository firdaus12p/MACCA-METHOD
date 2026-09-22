# MACCA — Method

**Plan, build, and check software with AI using written requirements.** MACCA is a collection of skills that helps your coding assistant turn an idea into a plan, implement approved work, and check the result against your decisions. It supports new projects and existing codebases.

You describe the goal and make important decisions. Your AI assistant guides the technical work, records the relevant agreements, and explains what was checked and what remains uncertain. You can ask for plain-language explanations or technical detail.

> **Macca** means *smart, intelligent, capable* in Bugis—a name inspired by intelligence paired with good character.

![MACCA Method](image-macca-method.webp)

[Quick start](#quick-start) · [How it works](#how-it-works) · [Skills](#choose-a-skill) · [Settings](#settings) · [Support](#support-and-limits) · [Documentation](#documentation)

## Quick start

**Requirements:** Node.js **22+** with `npx`, and a supported AI coding host. The configured test matrix covers Node.js 22 and 24 on Linux, Windows, and macOS; see [support and limits](#support-and-limits).

Run this from your project directory:

```bash
npx macca-method@latest install
```

1. Choose your AI host, such as OpenCode, GitHub Copilot, Claude Code, Cursor, Windsurf, Gemini CLI, Kilo Code, Codex, or Kimi CLI.
2. Choose your communication language. Document language defaults to the same language; name and project labels are optional.
3. Restart your AI host so it discovers the installed skills.
4. Describe what you need. If unsure, ask: **“Use the help skill to recommend my next step.”**

The installer adds the skill collection and shared configuration. Planning skills create `project-context/` documents later, when requested; installation does not generate your project specifications or application code.

Use the MACCA installer for the complete collection. Individual skill-folder installation is not supported because the skills depend on shared resources. For flags, host folder locations, and unattended installation, see [installation help](docs/troubleshooting.md).

## Start with a request

You normally do not need to memorize skill names. Tell your assistant what you want; naming a skill explicitly also works.

| Your situation | Example request |
| --- | --- |
| A new idea | “I want an expense tracker for my shop. Help me define what it needs. Explain technical choices simply.” |
| Existing code without specs | “Use spec-init to document what this project already does and identify missing decisions.” |
| Ready to build | “Implement the approved first phase and run its required checks.” |
| A small change | “Change the submit label to Save. Keep the existing behavior and verify the change.” |
| A bug | “Saving twice creates duplicate records. Diagnose the cause and propose a fix.” |
| Several perspectives | “Use meet with Fachri and Firdaus to recommend how to prevent duplicate saves. Keep the current stack; discussion only.” |
| Preferences | “Use setup-macca-method to change only the document language to English.” |

Clear requests authorize their stated scope—not unrelated features, destructive operations, or deployment. The assistant asks when an important decision or required approval is missing.

## How it works

**Understand → record decisions → plan tasks → implement → verify.**

- **For a new project:** define the product and architecture, add only applicable data/API/UI contracts, establish rules, and plan tasks.
- **For existing code:** draft evidence-backed baseline specs first. Review missing decisions and preserve completed work; plan implementation only for approved gaps.
- **During implementation:** work from the relevant specs, validate changes, then check specification compliance and code quality at the required task, bug, or phase boundary.
- **When requirements change:** record the approved change and synchronize the affected specs before closing the phase.

Documents live in `project-context/`, including `PRD.md`, `architecture.md`, `rules.md`, and `Task.md`. Data, API, and UI documents are included when relevant. A stateless API does not need an invented database schema.

**Simple, but not careless.** MACCA favors the smallest solution that meets approved needs and applicable best practices. Extra infrastructure needs a concrete reason. Security, data integrity, accessibility, meaningful testing, and necessary recovery are not optional shortcuts.

**Checks, not empty ceremony.** Clean results get a concise summary. In the default `report-first` mode, actionable review fixes need approval; a clean review does not ask you to approve nonexistent fixes. Missing evidence is reported as **not verified**, not a pass.

See [the workflow guide](docs/workflows.md) for prerequisites, approvals, and what happens when work is blocked.

## Choose a skill

These **19 skills** work together with defined responsibilities and boundaries for shared files. Open the linked instruction only when you need its detailed contract.

| Need | Skill |
| --- | --- |
| Set up, inspect, or change preferences | [`setup-macca-method`](.agents/skills/setup-macca-method/SKILL.md) |
| Find the next step or see project status | [`help`](.agents/skills/help/SKILL.md) |
| Discuss a decision from selected perspectives | [`meet`](.agents/skills/meet/SKILL.md) |
| Define product needs and success criteria | [`brainstorm-prd`](.agents/skills/brainstorm-prd/SKILL.md) |
| Choose the system structure and technical approach | [`brainstorm-architecture`](.agents/skills/brainstorm-architecture/SKILL.md) |
| Plan persistent data | [`brainstorm-schema`](.agents/skills/brainstorm-schema/SKILL.md) |
| Define API or integration contracts | [`brainstorm-api`](.agents/skills/brainstorm-api/SKILL.md) |
| Define relevant UI and accessibility conventions | [`brainstorm-styleguide`](.agents/skills/brainstorm-styleguide/SKILL.md) |
| Establish project coding and testing rules | [`brainstorm-rules`](.agents/skills/brainstorm-rules/SKILL.md) |
| Turn approved requirements into verifiable tasks | [`brainstorm-task`](.agents/skills/brainstorm-task/SKILL.md) |
| Document an existing codebase | [`spec-init`](.agents/skills/spec-init/SKILL.md) |
| Implement phases or broader maintenance | [`developer`](.agents/skills/developer/SKILL.md) |
| Make one small change anchored to existing tasks | [`quick-dev`](.agents/skills/quick-dev/SKILL.md) |
| Diagnose, fix, and verify a bug | [`bug-fix`](.agents/skills/bug-fix/SKILL.md) |
| Plan an approved new feature across affected specs | [`add-feature`](.agents/skills/add-feature/SKILL.md) |
| Check code against applicable specs | [`spec-compliance`](.agents/skills/spec-compliance/SKILL.md) |
| Review code quality and security | [`code-review`](.agents/skills/code-review/SKILL.md) |
| Check consistency between documents | [`spec-audit`](.agents/skills/spec-audit/SKILL.md) |
| Assess release evidence without deploying | [`release-readiness`](.agents/skills/release-readiness/SKILL.md) |

The AI personas organize responsibilities: **Galbi** handles planning and coordination, **Fachri** technical design and reviews, **Akram** UI/UX, **Firdaus** implementation, and **Ikhsan** debugging. They are AI roles, not a guarantee of independent human review.

## Settings

Preferences are shared through `.agents/developer-config.json`. You do not need to edit JSON yourself:

```text
Show my MACCA settings.
Use setup-macca-method to change only the document language to English.
Save my preference to review a plan before coding.
```

Setup is optional for ordinary work. Showing settings does not create a missing configuration file. A targeted change preserves unrelated preferences; it does not translate existing documents or grant extra tool permissions.

See [configuration](docs/configuration.md) for all supported preferences, skill/MCP restrictions, and validation.

## Update and diagnose

From the project directory:

```bash
npx macca-method@latest upgrade
npx macca-method@latest doctor
```

`upgrade` refreshes managed skills with modification and recovery checks. Review or back up local modifications before choosing to overwrite them. `doctor` inspects installation health without changing files or performing recovery.

Restart your AI host after installing or upgrading skills. Preference-only changes apply on the next configuration read.

### Version selection

| Selector | Purpose |
| --- | --- |
| `@latest` | Install or upgrade to the current stable release |
| `@3.0.0` | Pin this exact release version |

`@latest` resolves the latest published npm package. To test repository changes locally before publication, invoke the source CLI (for example `node bin/macca-method.js --help` from the source checkout).

See [troubleshooting](docs/troubleshooting.md) for error messages, safe recovery, migration from 2.x, and platform-specific paths.

## Support and limits

- The installer targets **local project directories** on Linux, Windows, and macOS. Windows UNC/network and device paths are unsupported; symlinked project ancestors are rejected with guidance.
- CI is configured for **three operating systems × Node.js 22/24**. That configuration is not proof of a successful run on every combination. Local validation so far is Linux-based; other platform claims need corresponding run evidence.
- Skill instructions guide the assistant; they are not a sandbox or a guarantee of correct code. Results depend on the host, model, permissions, context, and verification actually performed.
- Passing structural checks does not prove every conversation works correctly. Required missing evidence must remain visible, and important outcomes should be checked before release.
- Commit, push, publication, deployment, and destructive operations require their own appropriate authorization. A successful review is not permission to perform them.

## Documentation

- [Workflows](docs/workflows.md) — new/existing projects, implementation, features, bugs, meetings, and release checks.
- [Configuration](docs/configuration.md) — saved preferences, examples, authorization, and validator usage.
- [Troubleshooting](docs/troubleshooting.md) — installation flags, upgrades, errors, recovery, and platform limits.
- [Behavioral evaluation scenarios](https://github.com/firdaus12p/MACCA-METHOD/blob/main/evals/README.md) — repository-only test scenarios and evidence requirements; definitions are not passing results.

For contributors, repository validation requires Node.js 22+ and Python 3. See [maintainer checks](docs/troubleshooting.md#maintainer-checks-from-a-source-checkout).

## License

[MIT](LICENSE) — free to use, modify, and distribute.
