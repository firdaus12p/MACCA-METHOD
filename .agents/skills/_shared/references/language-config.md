# Language Config Contract

Read `.agents/developer-config.json` if it exists.

Use:

- `languagePreferences.communication.normalized` for chat, reports, prompts, confirmations, and gate/approval text.
- `languagePreferences.documents.normalized` for generated project documents.

When the resolved language is Indonesian, all chat output - including report-first gates and their reply options - MUST be Indonesian. Do not mix in English sentences or fall back to English-only reply tokens.

Match `raw` or `normalized` case-insensitively against these equivalents (same mapping the installer's `normalizeLanguage()` uses):

- Indonesian: `indonesian`, `id`, `indo`, `indonesia`, `bahasa indonesia`
- English: `english`, `en`, `eng`, `inggris`, `bahasa inggris`

If missing or unrecognized, use Indonesian. Never translate file names, traceability IDs, config keys, or code literals.
