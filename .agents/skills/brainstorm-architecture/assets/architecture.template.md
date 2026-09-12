# Architecture

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

**Users:** [End Users, Admins, etc.]

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

### Strategic Dependency Evaluation

| Dependency/Vendor | Why Needed | Native/Existing Alternative | License & Health | Lock-in / Exit Path | Decision            |
| ----------------- | ---------- | --------------------------- | ---------------- | ------------------- | ------------------- |
| [name]            | [reason]   | [alternative]               | [evidence]       | [migration/removal] | Accepted / Proposed |

## 3. State Management

- **Client State:** [Zustand / Redux / Context API]
- **Server State:** [TanStack Query / SWR]
- **Forms:** [React Hook Form / Formik]
- **Persistence:** [localStorage / sessionStorage / none]

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

- **Main Pattern:** MVC / Feature-based / Clean Architecture
- **Layers:** routes → controller → service → repository
- **Notes:** [Special rules]

## 7. Authentication & Authorization

- **Method:** JWT / Session / OAuth
- **Provider:** Google / GitHub / Custom
- **Token Storage:** httpOnly cookie
- **RBAC:** Yes / No
- **Roles:** [List with access levels]

## 8. Security & Abuse Cases

- **Sensitive Data:** [PII, tokens, payment data, etc.]
- **Critical Actions:** [Login, password reset, admin actions, upload, payment, etc.]
- **Abuse Cases:**
  - [Brute force, spam, IDOR, CSRF, privilege escalation, replay, upload abuse, etc.]
- **Required Controls:**
  - [Rate limiting, ownership checks, CSRF protection, audit logs, signed webhooks, secure session expiry]
- **Audit Logs:** [Which events must be recorded]

## 9. Deployment & Infrastructure

- **Platform:** Vercel / Railway / Docker+VPS / etc.
- **Environments:** development → staging → production
- **CI/CD:** GitHub Actions / etc.
- **CDN/Storage:** Cloudflare / S3 / etc.
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

---

## 12. Assumptions & Open Questions

### Assumptions

- [Assumption the architecture depends on]

### Open Questions

- [Question that is still unresolved]
