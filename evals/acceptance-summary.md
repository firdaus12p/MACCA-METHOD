# Candidate acceptance evidence

Candidate: local `3.0.0` worktree, 2026-09-22. This is a bounded development record, not a stable-release certificate or proof of zero defects. No commit, publication, or remote CI execution is recorded here.

## Automated verification

`TMPDIR=/tmp/opencode npm run validate` completed on Linux with Node.js 22.23.1 after the final preference-consumer and version-preflight corrections. One attempt exceeded the 120-second tool timeout; the subsequent 300-second invocation completed successfully.

| Suite | Passing test groups |
| --- | ---: |
| npm command resolution | 10 |
| Package safety | 26 |
| Configuration validation | 14 |
| Safe preference reading | 17 |
| CLI setup, diagnosis, and version protection | 57 |
| Installer transaction safety | 31 |
| Total | 155 |

Additional checks passed: 19 skill static contracts, skill structure, README/guide links and package membership, 79-file publication contract, local install smoke, published-1.1.0-to-local upgrade fixture, and whitespace validation. Static checks do not execute conversations. Windows path cases include mocks; this record does not establish native Windows/macOS success.

## Agent-driven fixture observations

Fresh isolated agents loaded fixture-local skills and received separate prompts for each actual approval/confirmation turn. Evaluator snapshots and local behavior checks were taken at stage boundaries. Run IDs below refer to disposable temporary roots, not published artifacts.

| Episode in `macca-acceptance-tFqt2A` | Observed result |
| --- | --- |
| Meeting, named then delegated participants | Recommendations remained separate from user approval; no project changes. |
| Developer, one two-task phase | Both helper changes passed local checks; Phase 1 completed while Phase 2 remained pending. |
| Bug, diagnosis → approval → confirmation | No edit at diagnosis; approved fix passed existing regression checks; log appended only after the separate confirmation turn. |
| Feature, impact → document approval | No edits before approval; approved specs/task plan updated, existing function and tests preserved; no implementation started. |
| Release audit with missing gate evidence | Returned NOT READY/NOT VERIFIED rather than inventing completed reviews; project remained unchanged. |
| Planning, schema → API → rules → Task | Only the authorized document changed per stage; verified listing was retained, pending work was planned rather than implemented. |

All 13 captured stage artifacts passed the evaluator's allowed-path/preservation checks after correcting an evaluator checkbox-pattern bug. The failed evaluator result was retained; the agent output was not rewritten to satisfy it.

After introducing the shared guarded loader and aligning all consumers with its summary shape, meeting and developer were rerun using fresh current-skill fixtures in `macca-acceptance-108Eqq`. Both artifact checks passed. The developer rerun recorded failing checks before edits, passing checks afterward, and preservation of the unrequested phase. Current helper tests separately exercise synthetic-secret redaction and bounded reads.

## Evidence limits and remaining release gates

- The saved `trace.jsonl` files are agent-reported action summaries, not complete raw host exports. Strict trace validation did not accept them. Artifact-only checks explicitly retain **behavioral/workflow NOT VERIFIED**; observations above are supporting evidence, not full acceptance certification.
- The first fixture set pins the earlier skill/helper snapshot. Only the two named episodes were rerun on the final consumer/loader snapshot; do not attribute every episode to the final candidate.
- Available responses/action summaries were scanned for literal synthetic secret sentinels. This does not prove absence of transient disclosures outside retained evidence or provide a general secret-scanning guarantee.
- Native Windows/macOS CI, repeated model/host scenarios, complete ordered tool traces, and nontechnical-user feedback remain required before claiming broad stable-release readiness.
- Follow [the evaluation protocol](README.md) to reproduce cases and retain complete evidence. Generated fixtures/results stay outside the source tree or in ignored result directories; this summary contains no raw configuration or private transcripts.
