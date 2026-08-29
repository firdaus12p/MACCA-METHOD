# Additional Skills Compatibility

Readers of `.agents/developer-config.json` must tolerate all supported `additionalSkills` forms.

Canonical writer form:

```json
{
  "name": "frontend-react-best-practices",
  "purpose": "Use when working on React UI code.",
  "paths": {
    "copilot": ".github/skills/frontend-react-best-practices/SKILL.md",
    "opencode": ".opencode/skills/frontend-react-best-practices/SKILL.md",
    "codex": ".agents/skills/frontend-react-best-practices/SKILL.md"
  }
}
```

Readers must also accept:

- `path`
- `githubPath`, `opencodePath`, `claudePath`, `cursorPath`, `windsurfPath`, `geminiPath`, `kiloPath`, `kimiPath`, `codexPath`

Path fallback order:

1. `paths[currentHost]`
2. `path`
3. matching legacy host-specific field

Do not remove legacy fields during unrelated config updates.
