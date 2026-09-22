# Proportionate Planning

Apply before recommending features, technology, data structures, integration contracts, operational controls, UI systems, rules, or tasks. Use the smallest sufficient design that meets approved requirements and real risks, not the largest design the template can describe.

## Decide From Needs

1. Establish the current outcome, users, actual workflows, data sensitivity, expected load when material, team capability, budget, and operational owner. Reuse known answers. Unknown scale is an open question or explicit assumption, not evidence for distributed infrastructure.
2. Prefer no new component when the need is already met, then existing project behavior and native platform/framework capabilities, then a bounded addition. In an existing project, preserve sound approved choices; simplification does not authorize a rewrite or migration.
3. Recommend one adequate option in plain language. Present alternatives only for a meaningful trade-off. If the user says "choose for me", explain the recommendation and material cost/risk; do not invent business scope or treat the request as unlimited implementation authority.
4. Before adding a service, datastore, queue, cache, dependency, abstraction layer, protocol, or operational platform, identify the requirement/risk it addresses, why the simpler option is insufficient, and its maintenance/operational cost. Use concise rationale, not a mandatory new document for each ordinary choice.
5. Separate **needed now** from **deferred / not approved**. For a plausible future enhancement, give a concrete revisit trigger only when useful, such as measured latency missing an agreed target or an approved requirement for independent deployment. Do not implement or schedule deferred work "just in case".

## Depth Is Not Complexity

`critical` means deeper verification of relevant threats, failure modes, and recovery, not automatic microservices, Kubernetes, multiple databases, event sourcing, CQRS, multi-region deployment, or a custom design system. These are valid only when evidence justifies them. Production use alone is not evidence for every enterprise mechanism.

Simplicity never removes required authorization, input validation, secret protection, data integrity, applicable concurrency/idempotency controls, accessibility, or recovery. A small payment flow still needs its applicable payment safeguards. Meet reliability obligations with the least complex adequate mechanism; don't confuse "few users" with "no risk".

## Best Practice Is the Quality Floor

Recommend the simplest option that meets applicable best practices, not merely the quickest workaround or fewest lines. Assess correctness, secure defaults, data integrity, understandable boundaries, maintainability, relevant automated/manual verification, and recoverability in the actual deployment context. These are quality criteria, not reasons to add a tool for every criterion.

- For technology-specific advice, verify official guidance for the installed or proposed supported version using relevant authorized documentation tools when needed. Reuse current evidence; disclose unavailable verification rather than inventing an API, compatibility claim, or "best practice" label. General design advice does not require browsing for every sentence.
- Prefer mature, supported, idiomatic capabilities when they fit the need. Native/standard-library code is a preference, not a rule to replace a maintained library with custom cryptography, authentication, parsers, or other high-risk machinery.
- Explain the relevant practice and why it fits this project's constraints. Popularity, novelty, enterprise adoption, and "industry standard" alone are not evidence that a component is needed. More abstraction or fewer lines alone do not establish quality.
- If the simplest proposal cannot safely meet a current requirement, recommend the necessary additional mechanism and explain its cost. Do not hide unmet requirements as future work, remove safeguards to fit the budget, or silently rewrite approved decisions; surface the conflict and seek the appropriate decision.
- Recommend focused validation of required behavior and meaningful failure cases. Do not invent universal coverage targets or test frameworks, but do not label required tests, input checks, or recovery controls as over-engineering.

## Specs Are Agreements, Not Shopping Lists

- Examples and template headings are menus, not mandatory features or technologies. Keep applicable contracts; omit optional inapplicable sections or mark them N/A with a reason. Required but unresolved decisions remain open, not N/A or fabricated defaults.
- Add no login, admin dashboard, roles, analytics, subscriptions, integrations, or generic CRUD operations merely because similar products have them. Trace proposed scope to a stated need and obtain approval for additions.
- Do not introduce tenancy, soft deletion, audit history, partitioning, versioning, realtime delivery, or caching without the matching use case/risk. Preserve these when already required; names in this list are not prohibitions.
- Tasks come from approved requirements and verified gaps, not speculative scalability, example phases, or deferred suggestions. If an approved requirement appears excessive or conflicts with constraints, explain the trade-off and route a decision to its owner; never silently weaken it.
- In a compact recommendation, state the proposed solution, why it is enough now, and a material limitation/revisit trigger if one exists. Do not invent a limitation or risk just to fill a template.
