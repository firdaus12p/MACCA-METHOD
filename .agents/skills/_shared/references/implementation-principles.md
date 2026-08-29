# Shared Implementation Principles

Before writing code, stop at the first sufficient option:

1. Do not build what is not needed.
2. Search for and reuse existing project behavior.
3. Prefer the standard library.
4. Prefer native platform/framework capability.
5. Reuse an installed dependency.
6. Use the smallest clear implementation.
7. Only then write new reusable code.

Additional rules:

- Comments explain why, not what.
- Fix root causes, not symptoms.
- Prefer deletion and direct code over speculative abstraction.
- Business behavior or scope changes require user/spec approval; low-risk technical implementation choices do not.
- A new dependency requires evidence that earlier steps are insufficient and follows the project's dependency policy.
