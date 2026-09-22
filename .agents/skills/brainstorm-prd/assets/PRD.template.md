# PRD: [Project Name]

> **Authoring note:** This is a placeholder menu, not a checklist to build. Use the smallest scope that fulfills approved current requirements and security/recovery obligations within evidenced scale, team, budget, and operational constraints. Prune inapplicable sections or mark `N/A` with a reason; unknown mandatory decisions remain open, not `N/A`. Do not infer login, admin, roles, subscriptions, analytics, or integrations from examples. Critical depth adds questions, not features. Use small measurable acceptance criteria and confirmed targets, not invented SLOs; future possibilities do not authorize requirements or tasks.

> **Version:** 1.0 | **Date:** [date] | **Status:** Draft

## Document Role

- **Source of Truth:** Product scope, user intent, business rules, and success criteria
- **Primary Owner:** `brainstorm-prd`
- **Out of Scope:** API payload details, schema column definitions, code patterns, and implementation order

## Canonical Terminology

| Term   | Meaning                         |
| ------ | ------------------------------- |
| [Term] | [Exact meaning in this project] |

---

## 1. Project Goal

[Goal and vision — 1-2 paragraphs]

## 2. Target Users

| Persona     | Description   | Role                   |
| ----------- | ------------- | ---------------------- |
| [Persona 1] | [Description] | [Actual role, if needed] |

## 3. Problem Statement

[Problem being solved]

### Current Workaround

- **How users handle it now:** [workaround]
- **Cost / limitation:** [time, money, risk, or reliability impact]

## 4. Core Features

### MVP (Release 1)

| ID      | Feature   | Description   | Priority |
| ------- | --------- | ------------- | -------- |
| FEAT-01 | [Feature] | [Description] | High     |

### User-Mentioned Future Possibilities (Not Approved Scope)

- [Possibility explicitly raised by the user; exclude from current requirements and tasks until approved]

## 5. Business Rules

- **BR-01:** [Rule]
- **BR-02:** [Rule]

## 6. User Flow

### [Persona 1]

1. [Step 1]
2. [Step 2]

### Failure and Degraded Behavior

| Situation                     | Expected User Experience | Recovery                 |
| ----------------------------- | ------------------------ | ------------------------ |
| [Dependency/data unavailable] | [behavior]               | [retry/fallback/support] |

## 7. Design & Technical Requirements

- **Platform:** Web / Mobile / Desktop
- **UI Reference:** [Link or name]
- **Tech Stack (preferred):** [If any]
- **Integrations:** [Third-party services]

## 8. Non-Functional Requirements

| ID     | Category      | Requirement      | Target      |
| ------ | ------------- | ---------------- | ----------- |
| NFR-01 | [Applicable category] | [Approved requirement] | [Evidence-backed agreed target] |

Record unresolved required targets as open decisions; retain applicable security, recovery, and accessibility obligations.

## 9. Success Metrics and Rollout

| Metric   | Baseline          | Target   | Timeframe | Measurement Source | Owner   |
| -------- | ----------------- | -------- | --------- | ------------------ | ------- |
| [Metric] | [current/unknown] | [target] | [period]  | [existing/manual source if sufficient] | [owner] |

**Rollout:** [pilot / beta / phased / full]
**Target Audience:** [initial cohort]
**Readiness Criteria:** [conditions before expansion]
**Analytics Events:** [only if approved measurement cannot be met sufficiently with existing/manual sources]

## 10. Acceptance Criteria

### FEAT-01: [Feature Name]

- **AC-01:** **Given** [starting condition], **When** [user action], **Then** [expected result]

## 11. Non-Goals / Out of Scope

- [What will NOT be done]

## 12. Assumptions

- [Assumption 1]
- [Assumption 2]

## 13. User Stories

- **US-01:** As a **[role]**, I want **[feature]** so that **[benefit]**

## 14. Stakeholders

| Name/Role | Responsibility |
| --------- | -------------- |
| [Name]    | [Role]         |

## 15. Open Questions

| Question   | Status  | Owner |
| ---------- | ------- | ----- |
| [Question] | Pending | [Who] |

## Reading Guide for AI

- If this PRD conflicts with detailed implementation documents, the PRD wins on business intent and scope.
- If a term is ambiguous, prioritize the definition in `Canonical Terminology`.
- Use `Non-Goals / Out of Scope`, `Assumptions`, and `Open Questions` to avoid building more than necessary.
