# Coding Standards (Rules)

## Document Role
- **Source of Truth:** Coding standards, AI behavior constraints, and implementation security rules
- **Primary Owner:** `brainstorm-rules`
- **Out of Scope:** Product scope decisions, schema design, endpoint payload contracts, and task sequencing

---

## 1. AI Persona & Tech Stack
> You are an expert developer in: [stack confirmed by architecture and user].

**Prioritize:**
- [Preferred patterns]

**Avoid:**
- [Patterns to avoid]

---

## 2. Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| [Project symbol type] | [confirmed convention] | [stack-native example] |
| Files & Folders | [confirmed convention] | [example] |
| Persisted entities/fields | [datastore-native convention] | [example] |

---

## 3. Code Style & Quality
- **Language-specific rules:** [rules confirmed for the selected language; omit inapplicable TypeScript examples]
- **Production diagnostics:** [confirmed logging/telemetry rule]
- **Error Handling:** [stack-native strategy confirmed by the project]
- **Control flow:** [confirmed readability rule]
- **Import/dependency order:** [confirmed convention if applicable]
- **Max function length:** [X lines]
- **Comments:** [JSDoc required / minimal]
- **Dependency ladder:** Reuse existing code first, then standard library, native platform, installed dependencies, and only then add new dependencies.
- **Intentional simplification:** Mark with a `tradeoff:` comment that states the ceiling and upgrade trigger.
- **Never simplify:** trust-boundary validation, data-loss protection, accessibility basics, or explicitly requested behavior.

Add a language-specific example only when it communicates a confirmed rule better than prose.

---

## 4. Security Rules
> **MANDATORY:** Before writing code involving user input, auth, file upload, or database access — check at least these 4 items and explain them briefly: input validation, secret/token protection, safe queries, and access control.

- **Token/Session Storage:** [project-specific decision; do not assume JWT or browser cookies]
- **Input Validation:** Validate untrusted input with [existing project mechanism].
- **Secret/Configuration Storage:** [project/platform-specific mechanism]
- **Injection Prevention:** [safe query, shell, template, and parser rules relevant to this stack]
- **Client Rendering Security:** [XSS/content rule only if the project renders untrusted content]
- **Cross-Origin/Network Policy:** [only if the project exposes a network surface]
- **Dependencies:** Run the project's available dependency audit before release when network policy permits. Block [agreed threshold].

### Conditional Operational Rules
- **Structured Logging:** [only when architecture defines observability]
- **Migration Conventions:** [only when schema evolution applies]
- **Feature Flag Lifecycle:** [only when architecture selects flags]
- **Generated Code:** [editable/regenerate policy when applicable]
- **Secret Rotation:** [when runtime credentials apply]

---

## 5. AI Behavior Rules
- **Comment Language:** [Indonesian / English]
- **Error Messages (user-facing):** [Indonesian / English]
- **When Ambiguous:** Ask the user first; do not assume.
- **When Errors Happen:** Analyze error logs first. Do not guess.
- **New Package Installation:** Ask permission first; state the reason.
- **Out-of-Scope Modifications:** Forbidden without confirmation.
- **Complex Implementations:** Show a plan/rationale before implementing.

## Rule Priority
- **Priority Order:** Security → correctness → data protection → consistency → maintainability → convenience
- If two rules seem to conflict, choose the higher-priority rule and note the trade-off.
- If a local exception is needed, mark it clearly with a `tradeoff:` comment and explain the upgrade trigger.

---

## 6. Git Workflow
**Commit format:** [confirmed workflow; omit this table if Conventional Commits was not selected].

| Type | When |
|------|------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Maintenance (update deps, config) |
| `docs:` | Documentation changes |
| `refactor:` | Code restructuring without feature/bug change |
| `style:` | Formatting (no logic changes) |
| `test:` | Add or fix tests |
| `perf:` | Performance improvement |
| `ci:` | CI/CD config changes |

**Example:** `feat(auth): add Google OAuth login`

**Branch naming:**
- `feature/[feature-name]`
- `fix/[bug-name]`
- `chore/[task-name]`

---

## 7. Linter, Formatter & Testing
- **Linter:** [existing tool/version/config; omit if none].
- **Formatter:** [existing tool/options; omit if none].
- **Editor settings:** [existing settings; omit if none].
- **Test Framework:** [existing project framework]
- **Minimum Coverage:** [X%]
- **Test Requirement:** [project policy: test-first, test-with-change, or another explicit workflow].

---

## [FORBIDDEN]

> Check this list before writing any code. Violating even one item = code rejected.

| # | Forbidden | Why |
|---|-----------|-----|
| F-01 | Never hardcode or expose secrets | Security |
| F-02+ | [Confirmed stack/project-specific prohibition] | [Reason] |

## Assumptions & Exceptions
- [Assumption about team workflow or tooling]
- [Temporary exception with owner / review trigger]
