# 010 - Domain Model

## 1) Tenancy / Ownership
This system supports multiple users. Data is isolated by ownership.

- Company.ownerUserId
- Application.ownerUserId
- Tags are also owned (CompanyTag.ownerUserId, ApplicationTag.ownerUserId)

**Rule:** Non-admin users can only read/write rows where `ownerUserId == currentUser.id`.

Admins:
- Can manage users
- Can optionally view all data (v0 decision: admin can view all; enforcement happens in API)

## 2) Application Pipeline (State Machine)

### States
- INTERESTED
- APPLIED
- SCREENING
- INTERVIEW
- REJECTED (terminal)
- GHOSTED (terminal)
- TRASH (terminal)

### Allowed transitions (default)
The API should generally enforce these transitions.

- INTERESTED → APPLIED | TRASH
- APPLIED → SCREENING | REJECTED | GHOSTED | TRASH
- SCREENING → INTERVIEW | REJECTED | GHOSTED | TRASH
- INTERVIEW → REJECTED | GHOSTED | TRASH

### Notes
- v0 may allow “admin override” to move to any state.
- Terminal states should not transition out by default (unless admin override).

## 3) Entities

### User
Represents a person who can log in.

Key fields:
- id
- email (unique)
- passwordHash (bcrypt)
- role: admin | user
- createdAt/updatedAt

### Company
Represents an organization.

Key fields:
- id
- ownerUserId
- name (unique per owner)
- website (optional)
- createdAt/updatedAt

Relationships:
- has many Applications
- has many CompanyTags (via mapping)

### Application
Represents one attempt to apply to a role at a company.
A company may have multiple applications over time.

Key fields:
- id
- ownerUserId
- companyId
- jobTitle
- jobReqUrl (optional)
- jobDescriptionMd (markdown string)
- currentState (enum)
- createdAt/updatedAt

Relationships:
- belongs to Company
- has many StateTransitions (audit trail)
- has many ApplicationTags (via mapping)
- has many ApplicationEvents

### StateTransition (append-only audit log)
Every state change creates a transition row.

Key fields:
- id
- applicationId
- fromState (nullable only for initial creation if desired)
- toState
- transitionedAt
- note (optional)
- actorUserId (nullable for system actions)

Rules:
- Append-only (no updates/deletes in normal operation)
- Source of truth for Sankey + flow analytics

### Tags
Two independent tag namespaces.

#### CompanyTag
Tags that describe the company (e.g., ".net shop", "fintech").

- id
- ownerUserId
- name (unique per owner)

#### ApplicationTag
Tags that describe the role/application (e.g., "golang", "staff", "hybrid").

- id
- ownerUserId
- name (unique per owner)

#### Mapping tables
- CompanyTagMap(companyId, tagId)
- ApplicationTagMap(applicationId, tagId)

Rules:
- Mapping is unique per pair
- Tag application/removal is idempotent

### ApplicationEvent (important dates)
Represents an upcoming or past date tied to an application. Used by Dashboard.

Fields:
- id
- applicationId
- type: INTERVIEW | FOLLOWUP | CALL | DEADLINE | OTHER
- at (timestamp)
- note (optional)

Rules:
- Events are editable/deletable (unlike transitions)

## 4) Derived/Computed Concepts

### Age in state
`now - lastTransitionAt` where lastTransitionAt is the most recent StateTransition for the Application.
If no transitions exist, use Application.createdAt.

### Applied date (derived)
The first transition into APPLIED, or the timestamp of creation if created with initialState=APPLIED.

### Sankey flow data
Computed by grouping StateTransition rows within a time range by (fromState, toState).
