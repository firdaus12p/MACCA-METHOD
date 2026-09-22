# Installation and troubleshooting

[README](../README.md) · [Workflows](workflows.md) · [Configuration](configuration.md)

Use a local project directory, Node.js **22+** with `npx`, and a supported AI host. Start diagnosis with the target path and the reported error, rather than adding `--force` to every retry.

## Install into the intended project

From the target project's working directory:

```bash
npx macca-method@latest --list-tools
npx macca-method@latest install
```

Or specify the path explicitly; quote paths containing spaces:

```bash
npx macca-method@latest install --directory "/path/to/my project" --tool copilot --tool codex --communication-language English --document-language English --yes
```

On a fresh interactive install, the CLI asks for hosts, communication language (Enter: Indonesian), and document language (Enter: chosen communication language). Saved channels and supplied flags are reused. Name and project are optional flags, not an identity interview.

Installation places skills, shared preferences, and installer metadata in the selected host folders and `.agents/`. **It does not generate `project-context/` specs, `Task.md`, phase plans, or a bug log.** Those come from the [project workflows](workflows.md). Restart the AI host after installation/upgrade to discover the files.

Use the MACCA installer for the complete collection. Individual skill folders depend on sibling `_shared` resources and shared preferences; generic single-skill installation is not supported for this release.

## Commands and accepted options

| Command | Purpose |
| --- | --- |
| `install` | Install/reinstall the collection, select hosts, and bootstrap or explicitly update installer-supported preferences. |
| `upgrade` | Refresh an existing installation using its recorded hosts and managed-skill metadata. |
| `doctor` | Read-only local installation diagnosis. |
| `help`, `--help`, `-h` | Show command help. |
| `--list-tools` | List supported host keys and aliases. |
| `--version`, `-v` | Show the invoked package version. |

With no command, help is shown. The current parser accepts the following option spellings; “Used by” identifies where they have an effect. Install-only flags are not preference updates when passed to `upgrade` or `doctor`.

| Option | Used by | Behavior |
| --- | --- | --- |
| `--directory`, `-d` | install, upgrade, doctor | Target path; defaults to the current working directory. |
| `--tool`, `--tools`, `-t` | install | Repeatable or comma-separated host selection; supported keys/aliases are in [Configuration](configuration.md#settings-versus-installed-host-files). Existing recorded hosts are retained. |
| `--communication-language` | install | Set communication language. |
| `--document-language`, `--documents-language` | install | Set document language separately. |
| `--name`, `--project` | install | Save optional labels when supplied. |
| `--yes`, `-y` | install | Skip prompts. Fresh defaults: Codex if no host selected, Indonesian communication, documents matching communication. Reinstall reuses existing settings unless explicitly overridden. |
| `--force`, `-f` | install, upgrade | Allow replacement of locally modified managed skills/metadata after review. Does not bypass config validation, unowned collisions, or path/recovery safety. |

Value-bearing long options also accept `--option=value`, including both tool and document-language aliases. Short value options use a separate argument. Boolean flags are standalone; combined short flags and invented options are not supported. Use `--directory` for the project path, not a second positional argument.

`doctor` takes `--directory` for its target and produces text output. There is **no `--json` option and no CLI `config` command**. For saved settings use the [setup skill or shared validator](configuration.md).

## Update a published installation

```bash
npx macca-method@latest upgrade --directory "/path/to/project"
```

`@latest` resolves the latest **published npm package**. A GitHub push or local source edit does not update npm. To test repository changes, invoke the source CLI (for example `node bin/macca-method.js --help` from the source checkout); that is different from testing a published package. Pin a published version for reproducible bootstrap/CI.

### Migrate from 2.x to the 3.x candidate

This source tree identifies **3.0.0-rc.1**, a **prerelease candidate** designated for the npm `next` channel, not a stable release. The `@latest` commands in this guide refer to the stable channel. Check availability with `npm view macca-method dist-tags`; when published, use `npx macca-method@3.0.0-rc.1 install` (or `upgrade`) to select this exact candidate, or `@next` for the current prerelease. See the [candidate changelog](../CHANGELOG.md).

1. Back up the target project before upgrading, including locally modified skills, `.agents/` preferences/metadata, and any pending transaction recovery files. Review local edits before deciding which managed copies to replace.
2. Move to **Node.js 22+** before invoking the candidate. Dropping runtimes below 22 is a breaking change from 2.x; the configured CI matrix uses **22 and 24**. Other accepted majors do not have that matrix coverage.
3. Use an inspected **physical local path** for the target. Symlinked ancestors, Windows UNC/network paths, and device paths are rejected; see [path restrictions](#path-restrictions). A lexical `/tmp` or `/var` path on macOS may resolve through a symlink.
4. From the source checkout, inspect with `node bin/macca-method.js doctor --directory "/physical/path/to/project"`, then run `node bin/macca-method.js upgrade --directory "/physical/path/to/project"` when ready. Do not add `--force` by default. It permits replacing reviewed managed edits, not invalid config, unowned folders, unsafe paths, or inconsistent recovery evidence.
5. Preserve valid existing preferences, unknown extensions, and accepted legacy fields. Invalid config now blocks writes instead of being replaced with defaults; correct only the reported fields locally. Install the complete collection so the safe preference reader and sibling validator are available to every host. Missing helpers block affected config-dependent work, with no raw-file fallback; see [safe preference reading](configuration.md#safe-preference-reader).
6. If setup created only a config file, follow [incomplete setup](#config-only-or-incomplete-setup). For older unmarked payloads, follow [legacy migration](#upgrade-from-110); modified or unknown copies require inspection, not automatic adoption. Restart the AI host after updating, then run doctor again.

**Version comparison:** downgrade protection follows SemVer precedence, including prereleases. Stable `3.0.0` is newer than `3.0.0-rc.1`; `rc.10` is newer than `rc.2`. Build metadata does not affect ordering. Invalid recorded versions stop the operation for inspection. Version ordering is not evidence of release readiness; inspect the candidate's validation results separately.

Upgrade uses `.agents/macca-tools.txt`, the managed manifest, and lock/ownership evidence. An older package is refused when the installed version is newer, including an unpublished local build. Check the invoked version before retrying with a different package.

Ordinary upgrade refreshes managed skills and metadata without generating project specs or rewriting developer preferences. **Recovery is a separate step:** a pending transaction from an interrupted install can restore config and metadata before upgrade proceeds. Read the reported change stage; do not assume config could never change during a recovery attempt.

### Config-only or incomplete setup

The setup skill may have created only `.agents/developer-config.json`. That is a valid preferences file, but not a complete installer-managed installation. If upgrade reports missing `macca-tools.txt`, run `install` with the desired host to establish installation metadata. Existing valid preferences are preserved unless explicitly overridden; invalid config must be corrected first.

### Upgrade from 1.1.0

The updater compares unmarked legacy skill payloads with fingerprints of the official published `1.1.0` collection. Byte-identical copies can be adopted automatically, including the previous OpenCode `.opencode/skill/` location and meeting-skill rename. Modified or unknown folders are refused: back them up, inspect them, and move conflicting copies aside when appropriate before retrying. `--force` does not turn an unowned folder into a verified official payload.

Legacy global Kimi copies are reported, not deleted automatically. Verify the new project-local `.agents/skills/` installation before manually removing obsolete global copies that your host still discovers.

## Run read-only diagnosis

```bash
npx macca-method@latest doctor --directory "/path/to/project"
```

Doctor inspects runtime compatibility, target/path safety, config validity with values hidden, selected hosts, manifest/lock consistency, payload/reference integrity, local drift, and pending transactions.

| Output | Interpretation |
| --- | --- |
| `OK` | The reported check succeeded. |
| `WARN` | A limitation or drift needs review; warnings alone return exit **0**. |
| `FAIL` | A failed check was found; doctor returns exit **1**. |

Doctor does not write files, repair installation state, or recover transactions. Missing state or older locks without payload fingerprints limit integrity verification; an exit 0 containing warnings is not proof of full integrity. A successful filesystem check also does not establish AI-host/model behavior.

## Match the symptom to a safe next step

Install/upgrade errors show a code, affected path, change stage, and next action. Preserve those details when seeking help, with private paths or values redacted as needed.

| Symptom | What to check first |
| --- | --- |
| Host cannot find MACCA skills | Confirm the CLI's target directory and selected host folder, then restart the host. Confirm the complete collection includes `_shared`; use doctor to check payloads. |
| `MACCA_NODE_UNSUPPORTED` | Switch to Node.js 22 or 24 and retry; versions below 22 are rejected. |
| Unverified-runtime notice | Another major at or above 22 is allowed but outside the configured 22/24 matrix. Use a matrix version for that coverage. |
| Unknown option / unexpected positional argument | Compare with the option table; use `--directory`, and do not pass `--json` or a `config` command. |
| `MACCA_CONFIG_INVALID` | Back up the file, correct the reported fields locally, and validate it. Do not share raw config or replace unrelated values with defaults. `--force` cannot bypass validation. |
| Preference reader/helper unavailable | Restore the complete `_shared` installation, Node.js runtime, and permitted safe execution. Stop affected config-dependent work; do not dump raw config or treat helper failure as absent config. |
| `EACCES`, `EPERM`, or `EBUSY` | Check ownership, permissions, and file locks; close the program holding the path or use the intended writable directory. |
| Read-only filesystem / `ENOSPC` | Use a writable volume or free space. Preserve transaction evidence before retrying. |
| `ENOENT` / missing packaged payload | Check the path and parent; restore a complete package or install into an uninitialized target. |
| Local managed-skill or metadata drift | Back up and inspect the changed content and ownership marker. Decide whether to retain it or explicitly replace managed edits; do not begin with `--force`. |
| Unowned skill-folder collision | Preserve and inspect the folder; move it aside if appropriate or choose a clean target. Force does not authorize its overwrite. |
| Newer installed version than invoked package | Check package versions and use an appropriate release/local build; upgrade refuses a silent downgrade. |
| `MACCA_INPUT_ERROR` | Use a working terminal, or an unattended install with `--yes` and explicit flags. |
| Pending transaction / recovery refusal | Follow the recovery steps below; retain the journal and backups. |

### Path restrictions

- Windows UNC/network and device paths are rejected (`MACCA_UNSUPPORTED_PATH`). Use a local drive path such as `"C:\projects\my app"`.
- Symlinked target ancestors are conservatively rejected. This includes macOS aliases such as `/tmp` and `/var`, and the same restriction applies on other systems.
- For an existing directory, resolve its physical path, inspect the result, and pass that path to `--directory`. For example on macOS/Linux:

```bash
node -p 'require("node:fs").realpathSync("/tmp/my-project")'
```

The command only prints a path. Use the returned physical path explicitly; keep quotes around paths with spaces.

### Cancellation and interrupted transactions

Ctrl+C or EOF **during interactive setup** returns exit **130** (`MACCA_CANCELLED`) before ordinary writes or transaction recovery. This prompt-stage guarantee does not promise rollback of a process interrupted after writes begin.

If `.agents/macca-transaction.json` remains:

1. Back up and inspect the project, journal, and associated recovery files.
2. Run doctor to inspect the state without changing it.
3. Resolve the reported cause, then rerun install/upgrade for validated recovery.
4. If recovery refuses modified or inconsistent evidence, preserve it and investigate the reported path rather than deleting the journal or forcing past the check.

Recovery verifies transaction entries and config candidates before rollback/cleanup. It may restore earlier files or finish cleanup of a committed transaction. A later error can therefore follow recovery changes; the CLI's change-stage report is important.

## Runtime and platform evidence limits

The configured CI matrix is **Ubuntu, Windows, and macOS × Node.js 22 and 24**. The release-triggered workflow is configured to smoke-test the exact published release version on that matrix. This is configuration, not evidence that every run or device has passed. Corresponding run logs are required for platform/version claims; local Linux validation alone does not verify Windows or macOS.

## Maintainer checks from a source checkout

Maintainer validation requires **Node.js 22+ and Python 3**. Run from the repository root:

```bash
npm run validate
```

The validation script combines syntax checks, skill structure/reference validation, static workflow checks, package checks, installer/config/safety tests, legacy upgrade tests, and an npm pack dry run. Useful focused commands are:

```bash
node scripts/run-skill-validator.js
node scripts/validate-skill-behavior.js
npm run test:config
npm run test:preferences
npm run test:cli
npm run test:safety
npm run test:upgrade:legacy
```

The Python-backed skill validator checks skill structure and references. `validate-skill-behavior.js` checks static Markdown contracts, including default preference loading through `language-config.md`; passing it does not execute AI conversations or prove agent behavior. `test:preferences` exercises closed-summary output, redaction, missing/invalid config, bounded reads, and read-only behavior without reading live user preferences. Package/installer tests establish their own bounded evidence, not universal host compatibility.

Root `.agents/developer-config.json`, generated `/evals/results/`, and `/evals/*-workspace/` directories are ignored as local artifacts. Evaluation definitions and preparation scripts remain repository resources. Ignore rules do not untrack existing files or stage tracked deletions; review those separately before any later commit.

Live-agent scenarios and their evidence protocol are **repository resources**, not part of the installed skill payload: [workflow evaluations](https://github.com/firdaus12p/MACCA-METHOD/blob/main/evals/README.md). Definitions and prepared fixtures remain `NOT RUN` until exercised; they are not passing results, measured token savings, or a release-stability claim.
