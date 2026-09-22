# API Documentation

> **Authoring note:** This is a placeholder menu, not a checklist to build. Keep only contracts required by approved current flows and security/recovery obligations; prune inapplicable sections or mark `N/A` with a reason. Unknown mandatory decisions remain open, not `N/A`. Reuse the approved architecture and one adequate existing protocol. No automatic CRUD, versioning, webhooks, pagination, queues, or future-consumer endpoints. New components need a current requirement, why native/existing options are insufficient, cost within scale/team/budget/operations constraints, and a concrete escalation trigger. Critical depth deepens questions; native limits, retries, and idempotency apply where actual risk demands them.

## Document Role

- **Source of Truth:** External API or integration contract for this project
- **Primary Owner:** `brainstorm-api`
- **Out of Scope:** Internal service architecture, DB migration details, and UI copy

## Scope Summary

| Area                | Status                       | Notes        |
| ------------------- | ---------------------------- | ------------ |
| [resource / module] | Covered / Planned / Deferred | [short note] |

## Canonical Terminology

| Term   | Meaning                                   |
| ------ | ----------------------------------------- |
| [term] | [exact meaning used in this API contract] |

## Protocol Profile

- **Style:** REST / GraphQL / RPC-tRPC / Event-driven / Mixed
- **Entry Point:** [base URL / endpoint / router / broker/topic namespace]
- **Compatibility / Versioning:** [actual consumer commitments; explicit versions only if needed]
- **Deprecation:** [notice/support/replacement/sunset only when consumer commitments require them]

## Authentication and Security Controls

- **Authentication:** [method and transport]
- **Authorization:** [role/ownership summary]
- **Sensitive Operations:** [actual approved operations requiring protection]
- **CSRF / Replay / Signature / Idempotency:** [applicable controls]
- **Rate / Concurrency Limits:** [limit and client-visible signals]

## Error Catalog

| Protocol Code                                | Internal Code | Meaning   | Retryable | Client Action |
| -------------------------------------------- | ------------- | --------- | --------- | ------------- |
| [400 / UNAUTHENTICATED / EVENT_RETRY / etc.] | `[CODE]`      | [meaning] | Yes / No  | [action]      |

## Reliability and SLO

- **Latency Target:** [approved relevant NFR; unknown required target remains an open decision]
- **Availability/Error Target:** [target or inherited NFR]
- **Timeout Ownership:** [client/server/gateway/consumer]
- **Retry Policy:** [which failures, backoff, max attempts]
- **Contract Test Invariants:** [critical examples/compatibility rules]

## Operation Inventory

| ID     | Operation Type                                             | Name / Path / Topic | Auth              | Trace to  |
| ------ | ---------------------------------------------------------- | ------------------- | ----------------- | --------- |
| API-01 | [REST GET / GraphQL query / RPC procedure / Event publish] | [identifier]        | Required / Public | `FEAT-01` |

---

## REST Section (include only for REST or Mixed)

### Environments

| Environment | Base URL                            |
| ----------- | ----------------------------------- |
| [Actual environment] | [Existing/approved base URL; no presumed /v1] |

### Standard Response Format

[Actual existing/protocol-native response example. Add an envelope or pagination metadata only when the approved contract requires it.]

### Pagination and Filtering (Only When Required by Access Patterns)

- **Type:** Offset-based / Cursor-based
- **Defaults:** [limit/page or cursor rules]
- **Sorting/Filtering:** [query parameters]

### Resource: [Resource Name]

**Trace to:** [FEAT-01 / AC-01]

#### API-01 — [METHOD] /[path]

- **Description:** [what it does]
- **Auth:** [Required / Public]
- **Authorization:** [rule]
- **Input:** [body/path/query/header fields]
- **Success Response:** [example]
- **Possible Errors:** [codes]
- **Security Notes:** [CSRF / idempotency / upload / ownership]

---

## GraphQL Section (include only for GraphQL or Mixed)

### Endpoint and Transport

- **Endpoint:** [existing/approved endpoint]
- **Realtime:** Subscriptions / polling / none

### Operation: [Query / Mutation / Subscription Name]

**Trace to:** [FEAT-01 / AC-01]

- **Type:** Query / Mutation / Subscription
- **Arguments:** [typed input]
- **Selection/Result Shape:** [expected result]
- **Auth & Authorization:** [rules]
- **Errors:** [codes/unions/extensions]
- **Complexity / Depth / Pagination:** [rules]

---

## RPC / tRPC Section (include only for RPC or Mixed)

### Router / Namespace

- **Entry Point:** [router/namespace]

### Procedure: [Name]

**Trace to:** [FEAT-01 / AC-01]

- **Type:** Query / Mutation / Subscription / Procedure
- **Input Schema:** [typed input]
- **Output Schema:** [typed output]
- **Auth & Authorization:** [rules]
- **Typed Errors:** [codes/types]
- **Retry / Idempotency:** [rules]

---

## Event-Driven Section (include only for Event-driven or Mixed)

### Channel Topology

- **Broker / Bus:** [service]
- **Topics / Streams / Queues:** [list]

### Event Contract: [Topic / Event Name]

**Trace to:** [FEAT-01 / AC-01]

- **Producer:** [service/component]
- **Consumer:** [service/component]
- **Payload Schema:** [fields/example]
- **Ordering / Partition Key:** [rules]
- **Delivery Guarantee:** [at-least-once / exactly-once / best effort]
- **Retry / Dead-letter / Deduplication:** [rules]
- **Security / Signature / Replay:** [controls]

## Assumptions & Open Questions

- [Unresolved API assumption or question]
- [Decision still pending confirmation]
