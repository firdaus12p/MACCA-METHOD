# Fix Mode and Approval Resume Contract

`codeReviewPreferences.fixMode` is binding for review and remediation workflows.

## Values

- Missing or `report-first`: analyze and report all findings, then stop at the gate before editing.
- `fix-then-report`: apply actionable BLOCKER/MAJOR fixes, validate them, then report. Document-audit skills edit only when corrections were explicitly requested.

Announce `[Fix mode: report-first]` or `[Fix mode: fix-then-report]` at the start of a new review. Do not repeat the announcement when resuming an active gate.

## Required Report-First Gate

After the full report and fix manifest, print this block verbatim and end the response:

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
2. Exact `yes`, `fix`, or `continue` approves every actionable finding in the immediately preceding report, including actionable MINOR findings.
3. Named IDs approve only those findings.
4. Resume directly at edits. Do not repeat analysis, the report, startup, preflight, or the same gate.
5. Ask again only if the worktree changed materially, a target disappeared, findings conflict, or the implementation becomes destructive or exceeds disclosed scope.
6. Run the narrowest relevant validation and one bounded verdict pass: `resolved`, `partial`, or `unresolved`.
7. If validation still fails after one repair pass, stop and report evidence.

`quick-dev` and other routers must not intercept a reply to an active gate.
