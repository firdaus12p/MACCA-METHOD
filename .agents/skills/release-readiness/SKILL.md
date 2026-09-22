---
name: release-readiness
description: Produces a report-only production release readiness audit from existing specs, quality gates, deployment configs, migrations, observability, rollback, and runbooks. Use whenever the user asks if the project is ready to ship, asks for a pre-release or production audit, or after all Task.md phases are finished. Never deploys or alters infrastructure.
compatibility: Requires the complete MACCA-METHOD collection with sibling _shared resources, git when reviewing diffs, and workspace file access.
metadata:
  persona: "Fachri"
  persona-role: "Tech Lead"
---

# Release Readiness

## Shared Setup

Paths written as `../...` below are relative to this SKILL.md's own folder, not the project's working directory - resolve them as a sibling of the folder that contains this file.

1. Read `../_shared/references/language-config.md`.
2. Use the resolved communication language from `language-config.md`.
3. This skill is report-only. Do not edit files, run deployment, publish packages, rotate secrets, apply migrations, or change infrastructure.

## Role and Boundary

Run as `@Fachri` (Tech Lead). Use the shared persona profile in `../_shared/references/personas.md`.

Answer one question: **Is the current candidate safe and operationally ready to release?**

Do not repeat full `spec-compliance`, `code-review`, or `spec-audit` analysis. Consume their existing evidence when available. If required evidence is absent, mark it `NOT VERIFIED`; do not invent a pass.

## Step 1: Identify the Candidate

Determine from the user request and repository:

- Target environment: production, staging, preview, package registry, or another explicit destination
- Candidate: branch, commit, tag, version, or current worktree
- Release scope: changed features/modules and affected data/integrations

Ask one focused question only if the candidate or target environment cannot be determined. Never assume production.

## Step 2: Read Existing Evidence

Read only applicable evidence:

- `project-context/PRD.md` — rollout, success criteria, NFRs, degraded behavior
- `project-context/architecture.md` — deployment, observability, rollback, recovery, ownership
- `project-context/schema.md` — migration, backfill, compatibility, data recovery
- `project-context/api.md` — deprecation, retry, SLO, contract invariants
- `project-context/rules.md` — release, logging, migration, feature flag, dependency rules
- `project-context/StyleGuide.md` — accessibility and operational UI states when UI changed
- `project-context/Task.md` — phase completion and Definition of Done
- Relevant plans, CI results, build/test output, migration files, environment examples, deployment config, runbooks, changelog, and version files

Treat chat claims without reproducible evidence as `NOT VERIFIED`.

## Step 3: Check Readiness Areas

Use `N/A` only with a reason.

### RR-01 Scope and Quality Gates

- Release scope is explicit and traceable to completed tasks/requirements.
- Applicable acceptance criteria and phase Definition of Done are complete.
- Latest relevant `spec-compliance`, `code-review`, and final `spec-audit` evidence has no unresolved BLOCKER/MAJOR findings.

### RR-02 Build, Tests, and Smoke Validation

- Required build, test, type, lint, and package checks pass under the approved testing policy.
- A release smoke test covers the critical user journey or service readiness path.
- Test evidence applies to the candidate, not an older commit.

### RR-03 Configuration and Secrets

- Required environment variables are documented and validated for the target environment.
- No secrets are committed or printed in logs.
- Secret ownership, provisioning, rotation, and revocation are known where applicable.

### RR-04 Data Migration and Recovery

- Migration order, compatibility, backfill, validation, and failure recovery match `schema.md`.
- Backup/restore or roll-forward evidence exists when data loss is possible.
- Destructive changes have explicit approval and a tested recovery path.

### RR-05 Deployment, Rollback, and Flags

- Deployment owner and procedure are known.
- Rollback trigger, mechanism, and post-rollback checks are executable.
- Feature flags have safe defaults, owner, rollout plan, and cleanup/review trigger where used.

### RR-06 Observability and Incident Readiness

- Required logs, metrics, traces, dashboards, and alerts exist for the released behavior.
- Sensitive data is redacted.
- Health/readiness checks reflect real dependency health where applicable.
- Runbook, escalation owner, and incident contact are known for production services.

### RR-07 Compatibility and Consumer Communication

- API/schema/config compatibility and deprecation rules are satisfied.
- Changelog, version, migration notes, and consumer/user communication are ready where applicable.

### RR-08 UI and Operational Experience

- Applicable accessibility target and loading/empty/error/forbidden/offline states are verified.
- UI performance constraints are met when UI changed.

## Step 4: Verdict

Verdicts:

- `READY` — every applicable area is verified; no unresolved release blocker.
- `CONDITIONAL` — no blocker, but named pre-release actions remain and have owners.
- `NOT READY` — any BLOCKER, unresolved MAJOR, missing recovery for destructive data change, missing required quality evidence, or unknown production-critical configuration.

Use this report:

```markdown
# Release Readiness Report

**Candidate:** [branch/commit/tag/version]
**Target:** [environment]
**Verdict:** READY / CONDITIONAL / NOT READY

## Evidence Summary

| Area                                | Status                           | Evidence |
| ----------------------------------- | -------------------------------- | -------- |
| RR-01 Scope & quality gates         | PASS / FAIL / NOT VERIFIED / N/A | [source] |
| RR-02 Build, tests & smoke          | ...                              | ...      |
| RR-03 Config & secrets              | ...                              | ...      |
| RR-04 Migration & recovery          | ...                              | ...      |
| RR-05 Deploy, rollback & flags      | ...                              | ...      |
| RR-06 Observability & incidents     | ...                              | ...      |
| RR-07 Compatibility & communication | ...                              | ...      |
| RR-08 UI operational experience     | ...                              | ...      |

## Blockers

- [blocker, evidence, owner]

## Required Before Release

- [action] — owner: [role] — validation: [proof required]

## Accepted Residual Risks

- [risk and explicit owner/expiry] / None
```

## Rules

1. Report-only: never deploy or mutate release systems.
2. Evidence beats confidence; missing proof is `NOT VERIFIED`.
3. Do not rerun broad quality reviews when current results exist.
4. Never downgrade a BLOCKER/MAJOR from another gate without new evidence from that gate.
5. Do not require irrelevant enterprise controls for prototypes or non-production targets; use `N/A` with reasons.
6. A production data migration without a viable recovery strategy is `NOT READY`.
7. A `READY` verdict expires when the candidate or relevant configuration changes.
