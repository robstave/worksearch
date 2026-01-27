# 020 - API Contract (v0)

Base path: /api
Auth: session cookie (httpOnly)

All timestamps are ISO-8601 strings.

## Shared Types

### State

INTERESTED | APPLIED | SCREENING | INTERVIEW | REJECTED | GHOSTED | TRASH

### Role

admin | user

Error format:
{
  "error": "string",
  "message": "string",
  "details": {}
}

## Auth

POST /auth/login
Request:
{
  "email": "string",
  "password": "string"
}

Response 200:
{
  "id": "string",
  "email": "string",
  "role": "admin|user"
}

POST /auth/logout
Response 204

GET /auth/me
Response 200:
{
  "id": "string",
  "email": "string",
  "role": "admin|user"
}

## Users (admin only)

POST /users

Creates a user (admin action).
Request:

{ "email": "string", "password": "string", "role": "admin|user" }

Response 201:

{ "id": "string", "email": "string", "role": "admin|user", "createdAt": "string" }

GET /users

Response 200:

{ "items": [ { "id": "string", "email": "string", "role": "admin|user" } ] }

## Companies

GET /companies
Query:

- search (optional)
- tag (optional, company tag name)

Response 200:
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "website": "string|null",
      "tags": ["string"],
      "applicationCount": 0,
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}

POST /companies
Request:
{
  "name": "string",
  "website": "string|null"
}

Response 201:
{
  "id": "string",
  "name": "string",
  "website": "string|null",
  "createdAt": "string"
}

GET /companies/:id
Response 200:
{
  "id": "string",
  "name": "string",
  "website": "string|null",
  "tags": ["string"],
  "applications": [
    {
      "id": "string",
      "jobTitle": "string",
      "currentState": "STATE",
      "lastTransitionAt": "string|null"
    }
  ],
  "createdAt": "string",
  "updatedAt": "string"
}

PATCH /companies/:id

Request (any subset):
{
  "name": "string",
  "website": "string|null"
}

Response 200: updated Company summary

DELETE /companies/:id

Response 204

## Applications

GET /applications

Query params (optional):

state: one of State

companyId: string

tag: application tag name

search: search company name + job title

sort: updatedAt|company|ageInState (default updatedAt)

order: asc|desc (default desc)

view: board|list (default list)

page, pageSize (optional v0.1; can ignore in strict v0)

Response 200:

{
  "items": [
    {
      "id": "string",
      "company": { "id": "string", "name": "string" },
      "jobTitle": "string",
      "jobReqUrl": "string|null",
      "currentState": "STATE",
      "tags": ["string"],
      "lastTransitionAt": "string|null",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}

POST /applications

Request:

{
  "companyId": "string",
  "jobTitle": "string",
  "jobReqUrl": "string|null",
  "jobDescriptionMd": "string",
  "initialState": "INTERESTED|APPLIED"
}

Response 201:

{
  "id": "string",
  "company": { "id": "string", "name": "string" },
  "jobTitle": "string",
  "jobReqUrl": "string|null",
  "jobDescriptionMd": "string",
  "currentState": "STATE",
  "tags": ["string"],
  "createdAt": "string",
  "updatedAt": "string"
}

GET /applications/:id

Response 200:

{
  "id": "string",
  "company": { "id": "string", "name": "string" },
  "jobTitle": "string",
  "jobReqUrl": "string|null",
  "jobDescriptionMd": "string",
  "currentState": "STATE",
  "tags": ["string"],
  "transitions": [
    {
      "id": "string",
      "fromState": "STATE|null",
      "toState": "STATE",
      "transitionedAt": "string",
      "note": "string|null"
    }
  ],
  "events": [
    {
      "id": "string",
      "type": "INTERVIEW|FOLLOWUP|CALL|DEADLINE|OTHER",
      "at": "string",
      "note": "string|null"
    }
  ],
  "createdAt": "string",
  "updatedAt": "string"
}

PATCH /applications/:id

Request (any subset):

{
  "jobTitle": "string",
  "jobReqUrl": "string|null",
  "jobDescriptionMd": "string"
}

Response 200: updated Application summary

POST /applications/:id/move

Creates a transition and updates currentState.

Request:

{ "toState": "STATE", "note": "string|null" }

Response 200:

{
  "applicationId": "string",
  "fromState": "STATE",
  "toState": "STATE",
  "transitionedAt": "string"
}

Error 409 if transition is not allowed.

## Application Tags

GET /application-tags
Response 200:
{ "items": [ { "id": "string", "name": "string" } ] }

POST /application-tags
Request:
{ "name": "string" }
Response 201:
{ "id": "string", "name": "string" }

PUT /applications/:id/tags

Replaces the full tag set for the application (idempotent).

Request:
{ "tagNames": ["string"] }

Response 200:
{ "applicationId": "string", "tagNames": ["string"] }

## Company Tags

GET /company-tags
Response 200:
{ "items": [ { "id": "string", "name": "string" } ] }

POST /company-tags
Request:
{ "name": "string" }
Response 201:
{ "id": "string", "name": "string" }

PUT /companies/:id/tags

Replaces the full tag set for the company (idempotent).

Request:
{ "tagNames": ["string"] }

Response 200:
{ "companyId": "string", "tagNames": ["string"] }

## Application Events (Important Dates)

POST /applications/:id/events

Request:

{ "type": "INTERVIEW|FOLLOWUP|CALL|DEADLINE|OTHER", "at": "string", "note": "string|null" }

Response 201:

{ "id": "string", "applicationId": "string", "type": "TYPE", "at": "string", "note": "string|null" }

DELETE /events/:id

Response 204

## Dashboard

GET /dashboard/snapshot
Response 200:
{
  "countsByState": {
    "INTERESTED": 0,
    "APPLIED": 0,
    "SCREENING": 0,
    "INTERVIEW": 0,
    "REJECTED": 0,
    "GHOSTED": 0,
    "TRASH": 0
  }
}

GET /dashboard/sankey
Notes:

- v0 decision: Sankey is computed for **all time** (no date range query params).
- Future: add a boolean to exclude items from Sankey/analytics (e.g. `Application.excludeFromAnalytics` or similar).

Response 200:
{
  "nodes": [],
  "links": []
}

GET /dashboard/important-dates

Notes:

- v0: returns upcoming events for the next 14 days.
- Future: add query params for date range (e.g. `from`, `to`).

Response 200:
{
  "items": [
    {
      "id": "string",
      "applicationId": "string",
      "type": "INTERVIEW|FOLLOWUP|CALL|DEADLINE|OTHER",
      "at": "string",
      "note": "string|null",
      "company": { "id": "string", "name": "string" },
      "jobTitle": "string"
    }
  ]
}

## Job Boards

GET /job-boards

Response 200:
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "link": "string|null",
      "notesMd": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}

GET /job-boards/:id

Response 200:
{
  "id": "string",
  "name": "string",
  "link": "string|null",
  "notesMd": "string",
  "createdAt": "string",
  "updatedAt": "string"
}

POST /job-boards

Request:
{
  "name": "string",
  "link": "string (optional)",
  "notesMd": "string (optional)"
}

Response 201: (same as GET /job-boards/:id)

PATCH /job-boards/:id

Request:
{
  "name": "string (optional)",
  "link": "string (optional)",
  "notesMd": "string (optional)"
}

Response 200: (same as GET /job-boards/:id)

DELETE /job-boards/:id

Response 204
