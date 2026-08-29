# PRD: [Project Name]

> **Version:** 1.0 | **Date:** [date] | **Status:** Draft

## Document Role
- **Source of Truth:** Product scope, user intent, business rules, and success criteria
- **Primary Owner:** `brainstorm-prd`
- **Out of Scope:** API payload details, schema column definitions, code patterns, and implementation order

## Canonical Terminology
| Term | Meaning |
|------|---------|
| [Term] | [Exact meaning in this project] |

---

## 1. Project Goal
[Goal and vision — 1-2 paragraphs]

## 2. Target Users
| Persona | Description | Role |
|---------|-------------|------|
| [Persona 1] | [Description] | End User / Admin / etc |

## 3. Problem Statement
[Problem being solved]

### Current Workaround
- **How users handle it now:** [workaround]
- **Cost / limitation:** [time, money, risk, or reliability impact]

## 4. Core Features
### MVP (Release 1)
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| FEAT-01 | [Feature] | [Description] | High |

### Future Enhancements
- **FEAT-02:** [Feature] — [Description]

## 5. Business Rules
- **BR-01:** [Rule]
- **BR-02:** [Rule]

## 6. User Flow
### [Persona 1]
1. [Step 1]
2. [Step 2]

### Failure and Degraded Behavior
| Situation | Expected User Experience | Recovery |
|-----------|--------------------------|----------|
| [Dependency/data unavailable] | [behavior] | [retry/fallback/support] |

## 7. Design & Technical Requirements
- **Platform:** Web / Mobile / Desktop
- **UI Reference:** [Link or name]
- **Tech Stack (preferred):** [If any]
- **Integrations:** [Third-party services]

## 8. Non-Functional Requirements
| ID | Category | Requirement | Target |
|----|----------|-------------|--------|
| NFR-01 | Performance | Page load time | < 3 seconds |
| NFR-02 | Security | [Requirement] | [Target] |
| NFR-03 | Scalability | Concurrent users | [Count] |
| NFR-04 | Accessibility | [Requirement] | [Target] |

## 9. Success Metrics and Rollout
| Metric | Baseline | Target | Timeframe | Measurement Source | Owner |
|--------|----------|--------|-----------|--------------------|-------|
| [Metric] | [current/unknown] | [target] | [period] | [analytics/report] | [owner] |

**Rollout:** [pilot / beta / phased / full]
**Target Audience:** [initial cohort]
**Readiness Criteria:** [conditions before expansion]
**Analytics Events:** [only events required to measure the metrics]

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
|-----------|----------------|
| [Name] | [Role] |

## 15. Open Questions
| Question | Status | Owner |
|----------|--------|-------|
| [Question] | Pending | [Who] |

## Reading Guide for AI
- If this PRD conflicts with detailed implementation documents, the PRD wins on business intent and scope.
- If a term is ambiguous, prioritize the definition in `Canonical Terminology`.
- Use `Non-Goals / Out of Scope`, `Assumptions`, and `Open Questions` to avoid building more than necessary.
