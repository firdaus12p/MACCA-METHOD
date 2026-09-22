# Database Schema

> **Authoring note:** This is a placeholder menu, not a checklist to build. Keep entities, fields, indexes, and projections only for approved current requirements, integrity obligations, and actual access patterns. Prune inapplicable sections or mark `N/A` with a reason; unknown mandatory decisions remain open, not `N/A`. Reuse the approved datastore and native guarantees; no automatic soft delete, version/history, tenant columns, or future event store. New components need a current requirement, why simpler options fail, cost within scale/team/budget/operations constraints, and an escalation trigger. Critical depth deepens questions; preserve necessary integrity, concurrency, security, retention, and recovery protection.

## Document Role

- **Source of Truth:** Data model and persistence contract
- **Primary Owner:** `brainstorm-schema`
- **Out of Scope:** Endpoint behavior, UI rules, and code-level implementation details

## Persistence Profile

- **Model:** Relational / Document / Key-value / Graph / Event store / Mixed
- **Identity Strategy:** [selected datastore-native identity justified by current needs]
- **Naming:** [datastore-native naming rules]
- **Audit / Version Metadata:** [only metadata required by current behavior, integrity, or audit obligations]
- **Deletion / Retention:** [required deletion and retention behavior; no automatic soft delete/history]
- **Timezone:** [UTC/local/N/A]

## Entity / Storage Map

| Data ID | Structure | Type                                                       | Purpose   | Trace to          |
| ------- | --------- | ---------------------------------------------------------- | --------- | ----------------- |
| DATA-01 | `[name]`  | Table / Collection / Key Space / Node / Stream / Aggregate | [purpose] | `FEAT-01 / BR-01` |

## Global Data Protection

| Structure/Field | Category | Protection           | Retention        | Notes   |
| --------------- | -------- | -------------------- | ---------------- | ------- |
| [actual field] | [sensitivity] | [required protection] | [retention rule] | [notes] |

## Scale, Tenancy & Concurrency

- **Expected Scale/Growth:** [records, payload, growth]
- **Tenant Isolation:** [N/A or enforcement model]
- **Concurrency Strategy:** [actual conflicting-write/duplicate-effect risk and native guarantee; extra mechanisms only if needed]

## Schema Evolution & Migration

- **Compatibility:** [backward/forward policy]
- **Migration Order:** [steps required for actual data and compatibility constraints]
- **Backfill & Validation:** [strategy]
- **Failure Recovery:** [rollback or roll-forward]
- **Zero-Downtime Constraint:** [if applicable]

---

## Relational Section (include only for relational or mixed)

### Table DATA-01: `[table_name]`

> **Trace to:** [FEAT-01 / BR-01]
> **PII:** Yes / No
> **Retention:** [policy]

| Column   | Type   | Nullable | Default           | Constraint   | Notes   |
| -------- | ------ | -------- | ----------------- | ------------ | ------- |
| [column] | [type] | [Yes/No] | [default]         | [constraint] | [notes] |

**Relationships:**

- [One-to-many / many-to-many / delete rule]

**Indexes:**

- [column/index, actual access pattern or integrity requirement, expected scale]

---

## Document Section (include only for document or mixed)

### Collection DATA-01: `[collection_name]`

> **Trace to:** [FEAT-01 / BR-01]

- **Root Document Shape:** [summary]
- **Embedded vs Referenced Data:** [rule]
- **Validation:** [required/optional fields]
- **Indexes:** [fields and reason]

---

## Key-Value Section (include only for key-value or mixed)

### Key Space DATA-01: `[keyspace_name]`

> **Trace to:** [FEAT-01 / BR-01]

- **Key Format:** [pattern]
- **Value Shape:** [summary]
- **Secondary Lookup / Cache Rule:** [if any]

---

## Graph Section (include only for graph or mixed)

### Node / Edge DATA-01: `[node_or_edge_name]`

> **Trace to:** [FEAT-01 / BR-01]

- **Node/Edge Type:** [type]
- **Properties:** [summary]
- **Traversal / Cardinality Rules:** [rules]

---

## Event Store Section (include only for event-store or mixed)

### Aggregate / Stream DATA-01: `[stream_name]`

> **Trace to:** [FEAT-01 / BR-01]

- **Aggregate Boundary:** [summary]
- **Event Types:** [list]
- **Projection / Read Model:** [summary]
- **Ordering / Versioning:** [rules]

## Not Yet Modeled / Deferred

- [Data area intentionally not yet modeled]

## Assumptions & Open Questions

- [Assumption about structures, relationships, or data rules]
- [Question that needs user confirmation]
