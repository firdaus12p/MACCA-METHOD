# Language Config Contract

Read `interaction-contract.md` once for this workflow; reuse it while current. It governs fresh-context reuse and concise communication, not permission to skip checks.

Read `config-mutation.md` once for this workflow and reuse it while current. It defines central ownership, validation, safe reads, and consent for all skills. `setup-macca-method` is the default owner; an absent optional config does not trigger setup or block normal work.

For every skill, the default config-reading path is the installed `../scripts/read-preferences.js`, resolved relative to this reference:

```text
node <resolved-shared-scripts>/read-preferences.js <workspace>/.agents/developer-config.json
```

Use its validated, allowlisted JSON summary; never read/dump the raw file into tool output or chat. Exit 0 with `absent: true` means missing config; it creates nothing. Exit 1 reports a redacted error. If the helper, sibling validator, runtime, or permitted execution is unavailable, stop the affected config read and disclose that preferences could not be checked; do not pretend config is absent or fall back to a direct read. The same stop rule applies to a missing sibling `config-file.js` loader. Config remains optional. Do not create it or save defaults while resolving language. A show-settings request routes to setup's read-only mode without an interview.

Use only the exact authorized local path. The shared loader rejects symlinks/junctions throughout its ancestor chain, including dangling links; these are errors, not absent preferences. See `config-mutation.md` for the 1 MiB bound, Windows local-path support, and best-effort race-check limitations. Do not bypass a rejected path by resolving it to an external target or dumping it directly.

Use:

- Summary `languagePreferences.communication.effective` for chat, reports, prompts, confirmations, and gate/approval text.
- Summary `languagePreferences.documents.effective` for generated project documents.

Each channel includes `configured` and `source` (`normalized`, `raw`, or `default`); raw saved strings are withheld. Known developer, brainstorm, and review fields each expose `{configured, value}` (missing values are `null`, not invented defaults). Preserve `false`. Identity exposes only `nameSet`/`projectSet`; skills/tools expose only configured/count indicators and MCP `denied`. For necessary targeted path resolution or permission checks, follow `config-mutation.md`'s local-only exception; the summary intentionally exposes no names or paths.

Consumer instructions naming a saved preference refer to its semantic value, not the raw saved JSON shape. Read a finite preference only through its summary `configured` and `value` fields: for example, `developerPreferences.scope.configured` with `developerPreferences.scope.value`, or `codeReviewPreferences.fixMode.value`. Do not compare the wrapper object itself to an enum or use its truthiness for booleans. Apply a workflow's missing-value default only after a successful summary read confirms it is unconfigured; a failed read is not absence. Language consumers use the resolved communication/document languages above, never saved `.normalized` fields directly.

Never print saved identity labels, skill names/paths, or MCP names. Identity status comes only from `identity.nameSet` and `identity.projectSet`; optional personal address may use a user name supplied in the conversation, not recovered from config. Summary counts do not authorize use. A positive count does not identify a permitted tool or skill; resolve necessary membership/path checks locally under `config-mutation.md`, keeping raw values out of tool output.

When the resolved language is Indonesian, all chat output - including report-first gates and their reply options - MUST be Indonesian. Do not mix in English sentences or fall back to English-only reply tokens.

Resolve each channel independently: trim and match its string `normalized` first; if missing or unrecognized, try string `raw`, then the Indonesian fallback. Match case-insensitively against these equivalents (same mapping the installer's `normalizeLanguage()` uses):

- Indonesian: `indonesian`, `id`, `indo`, `indonesia`, `bahasa indonesia`
- English: `english`, `en`, `eng`, `inggris`, `bahasa inggris`

If missing or unrecognized, use Indonesian. Never translate file names, traceability IDs, config keys, or code literals.

Aliases, empty strings, and unrecognized language strings are reader-normalization concerns, not a reason to rewrite the file. Report a fallback as **effective default (not saved)**. Do not copy the communication language into documents or vice versa. When the user explicitly changes one channel, store its chosen `raw` string and canonical `normalized` (`indonesian` / `english`) through `config-mutation.md`, preserving the other channel and nested extensions. Ask a focused clarification if the requested new language cannot be mapped; existing unknown input still resolves by the fallback rule.
