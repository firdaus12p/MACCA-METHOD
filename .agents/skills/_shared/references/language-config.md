# Language Config Contract

Read `.agents/developer-config.json` if it exists.

Use:

- `languagePreferences.communication.normalized` for chat, reports, prompts, and confirmations.
- `languagePreferences.documents.normalized` for generated project documents.

Accepted reader values:

- Indonesian: `indonesian`, `id`
- English: `english`, `en`

If missing, use Indonesian. Never translate file names, traceability IDs, config keys, or code literals.
