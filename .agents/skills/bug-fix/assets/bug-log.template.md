# Bug Log Template

Load only in bug-fix Step 7, after the user confirms the current validated fix. Preserve every field below; use the configured document language for generated prose. Fill in actual evidence, not planned changes.

## Header (new log only)

```markdown
# Bug Log

Record of bugs found and fixed in this project.
Use it as a reference before diagnosing a new bug.

---
```

## Entry (append without altering existing entries)

```markdown
## BUG-[N]: [Short title describing the bug]

**Date:** YYYY-MM-DD
**Status:** Resolved
**Severity:** Critical / High / Medium / Low
**Affected files:** `path/to/file`

### Symptom

[Incorrect behavior seen by the user]

### Root Cause

[Technical explanation - one paragraph]

### Applied Fix

[What changed and why it fixes the bug]

### Modified Files

- `path/file` - [change description]

### Regression Prevention

- **Test:** `path/test` - [protected scenario] / `N/A - [why]`
- **Spec/Rule:** `project-context/[file].md` - [rule added] / `N/A - [why]`
- **Manual check:** [step] / `N/A`

### Prevention Reminder

[Pattern/habit to prevent recurrence]

### Pattern Tags

Choose from: `#null-check` `#async-await` `#type-mismatch` `#missing-validation` `#wrong-query`
`#race-condition` `#auth` `#scope-error` `#missing-import` `#env-config`
`#wrong-logic` `#off-by-one` `#memory-leak` `#unhandled-error` `#cors`

---
```

Choose the next unused BUG-N from existing entries. Include actual regression results and any fail-before evidence limitation in the relevant prevention field. Confirmation applies to the checked result described here; do not add implementation work while appending the entry.
