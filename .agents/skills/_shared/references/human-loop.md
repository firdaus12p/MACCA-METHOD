# Human-in-the-Loop Policy

## Purpose

This file defines shared pause-and-confirm behavior across MACCA skills.

## Two Distinct Interaction Types

### 1. Interview Pace

Used by `brainstorm-*` skills to control how many discovery questions are asked per turn.

### 2. Confirmation Gates

Used by execution, audit, and bug-fix skills when a decision is risky, destructive, ambiguous, or materially changes scope.

Do not mix these two patterns.

## When Confirmation Is Required

Pause and ask before continuing when:

- there are multiple materially different paths and the spec does not resolve the choice
- the change is destructive or hard to undo
- the user's instruction is ambiguous in a way that changes scope or business behavior
- documents conflict and the conflict changes the next action

## When Confirmation Is Not Required

Continue without pausing when:

- the answer is already explicit in the spec or config
- the decision is a low-risk technical implementation detail
- the change is reversible and does not change business scope

## Shared Prompt Shape

Use this structure when a skill needs confirmation:

```text
I need confirmation before continuing.

[one brief summary of the issue]

Options:
1. [recommended default]
2. [alternative]
3. [other / explain]
```

Keep one decision topic per pause.

## Resume Rule

After the user answers, continue from the exact paused step. Do not restart the workflow or ask for the same confirmation again unless the situation changes.
