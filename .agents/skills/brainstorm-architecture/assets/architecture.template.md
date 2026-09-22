# Architecture

> **Authoring note:** This is a placeholder menu, not a checklist to build. Keep only sections justified by approved current requirements and security/recovery obligations; prune inapplicable sections or mark `N/A` with a reason. Unknown mandatory decisions remain open, not `N/A`. Reuse mature approved architecture and native/existing capabilities. Critical depth adds questions, not components. New components need a current requirement, why simpler options are insufficient, cost within scale/team/budget/operations constraints, and a concrete future escalation trigger; no topology or technology is mandatory by default.

> **Version:** 1.0 | **Date:** [date]

## Document Role

- **Source of Truth:** System design, technical constraints, and architecture decisions
- **Primary Owner:** `brainstorm-architecture`
- **Out of Scope:** Detailed API payload schemas, per-table database columns, UI design tokens, and task sequencing

## System Boundaries

| Topic                                   | Canonical Document              |
| --------------------------------------- | ------------------------------- |
| Product scope and business intent       | `project-context/PRD.md`        |
| Data model and field-level contracts    | `project-context/schema.md`     |
| Endpoint contracts and error payloads   | `project-context/api.md`        |
| UI language and component styling       | `project-context/StyleGuide.md` |
| Coding standards and AI behavior        | `project-context/rules.md`      |
| Execution order and implementation plan | `project-context/Task.md`       |

---

## 1. System Context

**Users:** [Actual users from approved requirements]

**External Services:**

| Service   | Purpose   | Protocol           |
| --------- | --------- | ------------------ |
| [Service] | [Purpose] | REST / SDK / OAuth |

## 2. Tech Stack

| Layer    | Technology  | Version   | Notes   |
| -------- | ----------- | --------- | ------- |
| Frontend | [Framework] | [Version] | [Notes] |
| Backend  | [Framework] | [Version] | [Notes] |
| Database | [Database]  | [Version] | [Notes] |
| ORM      | [ORM]       | [Version] | [Notes] |
| Language | [Language]  | [Version] | [Notes] |

Include only layers actually needed; an ORM or separate frontend/backend is not presumed.

**Constraints:** [expected workload, team capacity, budget, operational ownership]

### Strategic Dependency Evaluation

| Dependency/Vendor | Why Needed | Native/Existing Alternative | License & Health | Lock-in / Exit Path | Decision            |
| ----------------- | ---------- | --------------------------- | ---------------- | ------------------- | ------------------- |
| [name]            | [reason]   | [alternative]               | [evidence]       | [migration/removal] | Accepted / Proposed |

For each new component, record the approved requirement, evidence that native/existing options are insufficient, implementation/operating cost, and future escalation trigger.

## 3. State Management

- **Client State:** [needed state and native/existing mechanism]
- **Server State:** [needed synchronization and native/existing mechanism]
- **Forms:** [needed behavior and native/existing mechanism]
- **Persistence:** [required lifetime and safe storage, only if needed]

## 4. API Design

- **Type:** REST / GraphQL / tRPC / Event-driven / Mixed
- **Primary Entry Point:** [base path / endpoint / router / broker namespace]
- **Realtime / Delivery:** WebSocket / SSE / queue / stream / none

## 5. Folder Structure

```
[Project Root]
├── [folder 1]/         # [description]
│   ├── [subfolder]/    # [description]
│   └── [file]
├── [folder 2]/         # [description]
└── [folder 3]/         # [description]
```

## 6. Design Pattern

- **Main Pattern:** [existing approved pattern or justified minimal structure]
- **Boundaries:** [actual responsibilities; controller/service/repository layers and DI only if justified]
- **Notes:** [Special rules]

## 7. Authentication & Authorization

- **Access Requirement:** [approved restricted actions/data, or N/A with reason]
- **Method / Provider:** [existing/native mechanism if required]
- **Credential / Session Protection:** [platform-appropriate storage, transport, and lifecycle]
- **Authorization:** [required ownership/permission checks; roles only if needed]

## 8. Security & Abuse Cases

- **Sensitive Data:** [PII, tokens, payment data, etc.]
- **Critical Actions:** [Login, password reset, admin actions, upload, payment, etc.]
- **Abuse Cases:**
  - [Brute force, spam, IDOR, CSRF, privilege escalation, replay, upload abuse, etc.]
- **Required Controls:**
  - [Rate limiting, ownership checks, CSRF protection, audit logs, signed webhooks, secure session expiry]
- **Audit Logs:** [Which events must be recorded]

## 9. Deployment & Infrastructure

- **Platform:** [existing or justified runtime/hosting]
- **Environments:** [only those needed for approved delivery and recovery]
- **CI/CD:** [existing or justified delivery mechanism]
- **CDN/Storage:** [only if required, with justification]
- **Domain:** [Planned domain]

### Operations & Observability

- **Operational Owner:** [team/role]
- **Runbook / Support:** [location and escalation]
- **Logs:** [events, redaction, retention]
- **Metrics & Traces:** [signals tied to NFR/success metrics]
- **Alerts:** [threshold, owner, escalation]

### Rollback and Recovery

- **Rollback Trigger:** [condition]
- **Rollback Mechanism:** [deployment/data strategy]
- **Post-Rollback Validation:** [checks]
- **Backup / Restore:** [scope and test cadence]
- **RPO / RTO:** [critical systems only]

## 10. Canonical Terminology

| Term   | Definition                          |
| ------ | ----------------------------------- |
| [Term] | [Definition in the project context] |

## 11. Architecture Decision Records (ADR)

### ADR Index

| ADR ID  | Title   | Status              | Summary           |
| ------- | ------- | ------------------- | ----------------- |
| ADR-001 | [Title] | Accepted / Proposed | [One-line reason] |

### ADR-001: [Title]

- **Context:** [Situation that led to the decision]
- **Decision:** [What was decided]
- **Rationale:** [Why this option]
- **Trade-off:** [Accepted downside]
- **Rejected Alternatives:** [What else was considered and why it was rejected]
- **Cost / Escalation Trigger:** [implementation/operations burden and evidence threshold for a more complex design]

---

## 12. Assumptions & Open Questions

### Assumptions

- [Assumption the architecture depends on]

### Open Questions

- [Question that is still unresolved]
