# Config Mutation Contract

`.agents/developer-config.json` is a stable public runtime contract.

Before writing it:

1. Read the existing object if present.
2. Merge only the intended fields.
3. Preserve every unknown and unrelated field.
4. Never replace the whole object unless the file does not exist.
5. Prefer additive schema changes. Do not silently rename or repurpose keys.

Stable fields include:

- `name`
- `project`
- `languagePreferences`
- `developerPreferences.workMode`
- `developerPreferences.scope`
- `brainstormPreferences`
- `additionalSkills`
- `availableMCPs`
- `codeReviewPreferences.fixMode`

If migration becomes unavoidable, readers must remain backward compatible until the installer can migrate old values automatically.
