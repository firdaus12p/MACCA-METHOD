# Shared Implementation Principles

Read and follow `workspace-safety.md` before any mutation or validation command.

Before writing code, stop at the first sufficient option:

"Sufficient" includes applicable best practices: correctness, secure defaults, data integrity, maintainability, and meaningful validation. The ladder is a preference order, not permission to choose unsafe shortcuts or replace a maintained specialist library with risky custom code. Verify version-specific behavior with current authorized evidence; disclose what could not be verified. Fewer lines or dependencies alone do not establish quality.

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
