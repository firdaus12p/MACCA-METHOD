# Human-in-the-Loop Policy

## Purpose

This file defines shared pause-and-confirm behavior across MACCA skills.

## Two Different Interaction Types

### 1. Interview Pacing

Used by `brainstorm-*` skills to control how many discovery questions are asked
per turn.

### 2. Confirmation Gating

Used by execution, audit, and bug-fix skills when a decision is risky,
destructive, ambiguous, or materially changes scope.

Do not confuse these two patterns.

## When Confirmation Is Required

Pause and ask before proceeding when:

- there are multiple materially different paths and the specs do not resolve
  the choice
- the change is destructive or difficult to undo
- the user instruction is ambiguous in a way that changes scope or business
  behavior
- documents conflict and the conflict changes the next action

## When Confirmation Is Not Required

Proceed without pausing when:

- the answer is explicit in the specs or config
- the decision is a low-risk technical implementation detail
- the change is reversible and does not alter business scope

## Shared Prompt Shape

Use this structure when a skill needs confirmation:

```text
I need confirmation before continuing.

[one short issue summary]

Options:
1. [recommended default]
2. [alternative]
3. [other / explain]
```

Keep one decision topic per pause.

## Resume Rule

After the user answers, continue from the exact paused step. Do not restart the
workflow or ask for the same confirmation again unless the situation changed.