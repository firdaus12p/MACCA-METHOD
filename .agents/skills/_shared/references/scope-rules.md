# Work Scope Rules

## Purpose

This file defines how skills must adjust documents, recommendations, and work bounds based on `developerPreferences.scope` in `.agents/developer-config.json`.

## Scope Values

- `frontend`
- `backend`
- `fullstack`
- *(missing)* → treat as `fullstack`

## General Rules

Skills that affect planning, workflow recommendations, or implementation MUST read `developerPreferences.scope` if the config file exists.

- `frontend` → focus on UI, pages, components, state, styling, client-side validation, and API contracts from the consumer perspective.
- `backend` → focus on API implementation, business rules, auth, services/repositories, database, and API contracts from the provider perspective.
- `fullstack` → cover all areas.

## Frontend Scope

If scope = `frontend`:

- MUST NOT generate `schema.md`
- MUST NOT define controllers, services, DB queries, migrations, or backend internals
- `api.md` may be created, but only as a **consumer contract**
- `StyleGuide.md` remains relevant
- `Task.md` contains frontend tasks only
- If the backend is not ready, mark dependencies as `proposed`, `backend-owned`, `mock-only`, or `pending backend confirmation`

## Backend Scope

If scope = `backend`:

- MUST NOT generate `StyleGuide.md`
- MUST NOT define components, styling, or detailed UI behavior
- `api.md` is created as a **provider contract**
- `schema.md` remains relevant
- `Task.md` contains backend tasks only

## Fullstack Scope

If scope = `fullstack`:

- All documents and work areas may be covered

## If a Skill Is Called Outside Scope

If a skill is fully outside the user's scope:

- Explain that the area is outside the current work scope
- Do not generate documents or tasks in that area
- If needed, point only to dependency contracts, not implementation details
