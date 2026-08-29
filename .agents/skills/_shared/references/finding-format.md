# Shared Finding Format

Use exactly these four points for every actionable finding. Do not add a fifth point and do not show code/diffs inside the four points.

```markdown
#### [Severity] [ID] [Short Title]

**Where?**
[Page or file name only]

**What happens if it is not fixed?**
[Real user/application consequence in clear language]

**What happens if it is fixed?**
[Practical benefit]

**Recommended fix**
[Required logic/flow change, not syntax]
```

Rules:

- Keep severity proportional to evidence and impact.
- Do not create empty findings for passing checks.
- Put exact technical targets and validation in the separate fix manifest.
