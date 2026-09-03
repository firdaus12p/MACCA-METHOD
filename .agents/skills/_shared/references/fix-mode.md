# Fix Mode and Approval Resume Contract

`codeReviewPreferences.fixMode` is binding for review and remediation workflows.

## Values

- Missing or `report-first`: analyze and report all findings, then stop at the gate before editing.
- `fix-then-report`: apply actionable BLOCKER/MAJOR fixes, validate them, then report. Document-audit skills edit only when corrections were explicitly requested.

Announce `[Fix mode: report-first]` or `[Fix mode: fix-then-report]` at the start of a new review. Do not repeat the announcement when resuming an active gate.

## Required Report-First Gate

After the full report and fix manifest, print the block below matching `languagePreferences.communication.normalized` (see `language-config.md`) and end the response. Use only one language block - never mix English and Indonesian inside it.

Indonesian (`indonesian`, `id`, and any equivalent listed in `language-config.md` - also the default when the preference is missing or unrecognized):

```text
---
[GATE — Mode: report-first]
Semua temuan sudah dilaporkan. Belum ada file yang diubah.
Balas "ya" / "setuju" / "lanjut" / "perbaiki" untuk menerapkan semua perbaikan,
atau sebutkan temuan mana saja yang ingin diperbaiki.
---
```

English (`english`, `en`):

```text
---
[GATE — Fix mode: report-first]
All findings have been reported. No files were changed.
Reply "yes" / "fix" / "continue" to apply all fixes,
or name which findings you want to fix.
---
```

The fix manifest records each actionable finding ID, target, bounded change, and validation.

## Approval Resume

This takes precedence over normal routing, startup, identity, onboarding, preflight, and work-mode prompts.

1. Trim and case-fold the next response.
2. Any of these approves every actionable finding in the immediately preceding report, including actionable MINOR findings:
   - English: `yes`, `fix`, `continue`
   - Indonesian: `ya`, `iya`, `setuju`, `lanjut`, `perbaiki`
3. Named IDs approve only those findings, in either language.
4. Resume directly at edits. Do not repeat analysis, the report, startup, preflight, or the same gate.
5. Ask again only if the worktree changed materially, a target disappeared, findings conflict, or the implementation becomes destructive or exceeds disclosed scope.
6. Run the narrowest relevant validation and one bounded verdict pass: `resolved`, `partial`, or `unresolved`.
7. If validation still fails after one repair pass, stop and report evidence.

`quick-dev` and other routers must not intercept a reply to an active gate.
