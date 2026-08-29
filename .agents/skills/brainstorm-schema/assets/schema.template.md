# Database Schema

## Document Role
- **Source of Truth:** Data model and persistence contract
- **Primary Owner:** `brainstorm-schema`
- **Out of Scope:** Endpoint behavior, UI rules, and code-level implementation details

## Persistence Profile
- **Model:** Relational / Document / Key-value / Graph / Event store / Mixed
- **Identity Strategy:** [UUID / key format / aggregate ID / stream ID]
- **Naming:** [datastore-native naming rules]
- **Audit / Version Metadata:** [timestamps/version/event metadata]
- **Deletion / Retention:** [soft delete / archival / tombstone / immutable event / retention policy]
- **Timezone:** [UTC/local/N/A]

## Entity / Storage Map
| Data ID | Structure | Type | Purpose | Trace to |
|---------|-----------|------|---------|----------|
| DATA-01 | `[name]` | Table / Collection / Key Space / Node / Stream / Aggregate | [purpose] | `FEAT-01 / BR-01` |

## Global Data Protection
| Structure/Field | Category | Protection | Retention | Notes |
|-----------------|----------|------------|-----------|-------|
| [users.email] | PII | [encrypt/mask/plain] | [retention rule] | [notes] |

## Scale, Tenancy & Concurrency
- **Expected Scale/Growth:** [records, payload, growth]
- **Tenant Isolation:** [N/A or enforcement model]
- **Concurrency Strategy:** [transaction/version/lock/idempotency]

## Schema Evolution & Migration
- **Compatibility:** [backward/forward policy]
- **Migration Order:** [expand/backfill/switch/contract or equivalent]
- **Backfill & Validation:** [strategy]
- **Failure Recovery:** [rollback or roll-forward]
- **Zero-Downtime Constraint:** [if applicable]

---

## Relational Section (include only for relational or mixed)

### Table DATA-01: `[table_name]`
> **Trace to:** [FEAT-01 / BR-01]
> **PII:** Yes / No
> **Retention:** [policy]

| Column | Type | Nullable | Default | Constraint | Notes |
|--------|------|----------|---------|------------|-------|
| id | UUID | No | gen_random_uuid() | PRIMARY KEY | |
| [column] | [type] | [Yes/No] | [default] | [constraint] | [notes] |

**Relationships:**
- [One-to-many / many-to-many / delete rule]

**Indexes:**
- [column/index purpose]

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
