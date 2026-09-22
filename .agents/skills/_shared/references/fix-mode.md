# Fix Mode and Approval Resume Contract

`codeReviewPreferences.fixMode` is binding for review and remediation workflows.

Read its configured finite value through the safe preference summary in `language-config.md` (`codeReviewPreferences.fixMode.configured` / `.value`), not raw config. A failed or unavailable read is not a missing preference and does not justify silently choosing a mode.

Read and follow `workspace-safety.md` before edits or validation, including approval resumes.

## Values

- Missing or `report-first`: analyze and report; stop at the gate before editing only when the eligibility rules below are met.
- `fix-then-report`: apply actionable BLOCKER/MAJOR fixes, validate them, then report. Document-audit skills edit only when corrections were explicitly requested.

Announce `[Fix mode: report-first]` or `[Fix mode: fix-then-report]` once per authorized workflow under `interaction-contract.md`. Child reviews inherit the mode; announce again only if it changes or the previous value is unavailable. Do not repeat the announcement when resuming an active gate.

## Gate Eligibility

- Show a correction gate only for a non-empty actionable fix manifest: evidenced findings with IDs, authorized targets, bounded changes, and validation. Respect the caller's scope and mutation policy; `spec-audit` also requires an explicit correction request.
- INFO and non-actionable notes never enter the manifest and never trigger a gate. Do not invent phantom findings or status-only edits to make a manifest non-empty.
- Missing prerequisites or required evidence are `NOT VERIFIED`, not an assumed PASS or a fabricated implementation defect. Report the missing evidence and its owner; ask a focused evidence/decision question only if needed. Missing evidence alone does not justify a correction gate or invented specs.
- With zero actionable findings, report the actual result and continue the authorized workflow without a fix gate. Claim PASS only if every applicable required check is verified; otherwise keep `NOT VERIFIED`. Pending downstream quality gates are not missing evidence for the current gate.

## Required Report-First Gate

Only when Gate Eligibility is met, after the full report and fix manifest, print the block below matching the resolved communication language from `language-config.md` and end the response. Use only one language block - never mix English and Indonesian inside it.

Indonesian (`indonesian`, `id`, and any equivalent listed in `language-config.md` - also the default when the preference is missing or unrecognized):

```text
---
[GATE — Mode: report-first]
Semua temuan sudah dilaporkan. Belum ada perbaikan dari laporan ini yang diterapkan; perubahan implementasi sebelumnya tetap ada.
Balas "ya" / "setuju" / "lanjut" / "perbaiki" untuk menerapkan semua perbaikan,
atau sebutkan temuan mana saja yang ingin diperbaiki.
---
```

English (`english`, `en`):

```text
---
[GATE — Fix mode: report-first]
All findings have been reported. No fixes from this report have been applied; earlier implementation changes remain.
Reply "yes" / "fix" / "continue" to apply all fixes,
or name which findings you want to fix.
---
```

The fix manifest records each actionable finding ID, target, bounded change, and validation. Describe changes relative to this review; say "No files changed" only when that is true for the stated scope, not for a workspace already changed by implementation.

Retain the originating workflow, review unit (`task`, `phase`, `bug`, or standalone), task/phase ID, reviewed files, acceptance criteria, and exact return step alongside the manifest. Do not create a new artifact solely to retain this context.

## Approval Resume

This takes precedence over normal routing, startup, identity, onboarding, preflight, and work-mode prompts.

1. Trim and case-fold the next response.
2. Any of these approves every actionable finding in the immediately preceding fix manifest, including actionable MINOR findings:
   - English: `yes`, `fix`, `continue`
   - Indonesian: `ya`, `iya`, `setuju`, `lanjut`, `perbaiki`
3. Named IDs approve only those findings, in either language.
4. Resume directly at edits. Do not repeat analysis, the report, startup, preflight, or the same gate.
5. Ask again only if the worktree changed materially, a target disappeared, findings conflict, or the implementation becomes destructive or exceeds disclosed scope.
6. Run the narrowest relevant validation and one bounded verdict pass: `resolved`, `partial`, or `unresolved`.
7. If validation still fails after one repair pass, stop and report evidence.
8. Once the required checks pass, return to the originating workflow's next step with the same review unit and authorization. A compliance resume can continue to code-review, and a review resume can return to quick-dev's final report or bug-fix's user confirmation. A task pass never closes a phase. A standalone review ends with its report; it does not start backlog work.

`quick-dev` and other routers must not intercept a reply to an active gate.
