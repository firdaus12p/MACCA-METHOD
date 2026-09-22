# Interaction and Context Reuse

Apply throughout the current authorized workflow. This contract reduces repetition, not required checks or permission boundaries.

## Read Once, Refresh When Needed

- A requirement to read a document means its relevant content must be available and current, not that an unchanged file must be fetched again at every skill transition.
- Reuse exact source and verified decisions already present in this conversation when the relevant files are unchanged. Check freshness using available diff/file metadata or another reliable source signal. Re-read changed sections, previously unread material, and any evidence whose freshness cannot be established.
- After context loss, compaction without sufficient evidence, a different project/revision, or external edits, recover the necessary sources before relying on them. A summary or previous PASS is not a substitute for missing evidence.
- Read applicable sections first; expand for dependencies, conflicts, security impact, or an explicit comprehensive audit. Load templates only when producing their artifact. Do not merge every shared reference into a startup bundle.
- Use the smallest sufficient set of relevant, authorized tools. Availability alone does not grant authorization; saved restrictions and host permissions still apply.

## Carry the Handoff, Not the Ceremony

Retain the originating workflow and return step, review unit/task/phase ID, approved scope and targets, requirement IDs, changed sections, sources and freshness, validation results, unresolved decisions, and next authorized action. Pass this context to the next skill; verify it rather than restarting discovery.

Keep this in conversation context unless the workflow already owns an appropriate task/plan artifact. Do not create a new state file or duplicate private source material just to cache context. Refresh affected evidence after edits; passing one gate does not skip the next required gate.

## Plain, Proportionate Communication

- Acknowledge the supplied request; do not ask what the user wants again. Optional identity and configuration details do not block a clear task.
- Reuse saved preferences. Ask only for missing decisions that affect scope, permissions, business behavior, or the next safe action. Do not invent consent, widen scope, or save inferred preferences as explicit user choices.
- Announce the fix mode once per authorized workflow, and again only if it changes or its prior value is unavailable. Child gates inherit it; approval resumes do not repeat it.
- Use everyday language for explanations: "perubahan yang disetujui", "pemeriksaan", "belum bisa dipastikan", and "syarat selesai". Preserve exact file names, IDs, config values, and contractual gate text.
- Offer one relevant next step when guidance is requested, with a brief reason. Do not append generic "ready to continue?" questions to completed work or start new work from a recommendation.

## Compact Output, Complete Verification

- Perform every applicable required check. Retain concrete evidence for verdicts; N/A needs a reason and missing evidence remains NOT VERIFIED.
- Clean task/bug child reviews return a concise verdict and evidence to the origin, which combines them into one final result: what changed, files, validation, and any real limitation. Do not print empty finding sections, zero-count tables, repeated self-review blocks, or full passing checklists by default.
- Standalone clean reviews report scope, verdict, verification evidence, and relevant limitations briefly. Provide full checklists when requested or when necessary to explain a disputed result.
- Expand actionable findings using the shared finding format and bounded fix manifest. Show the required approval gate only when eligible. Missing evidence, unresolved findings, failed checks, and pending formal spec sync must remain visible even in a compact report.
- Keep required user confirmations: plan approval, consequential decisions, report-first fixes, and confirmation that a bug works. Brevity never implies permission.
