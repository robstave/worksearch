# 030 - UI Spec (v0)

Defines tabs, views, and interactions.

Frontend: Vite + React + TypeScript + Tailwind
API: REST (/api), session-cookie auth

## 1) Global UI

### Layout

- Top nav with tabs:
  - Dashboard
  - Applications (Board)
  - Applications (List)
  - Companies
- Right side user menu:
  - user email
  - logout

### Common UI elements

- Toast notifications for success/error
- Loading skeletons for lists/board columns
- Empty state components
- Confirm dialogs for destructive actions (delete, trash)

### Navigation / Routing (suggested)

- /login
- /dashboard
- /applications/board
- /applications/list
- /applications/:id
- /companies
- /companies/:id

Default route after login: `/applications/board`

## 2) Authentication UX

### Login page

Fields:

- email
- password

Behavior:

- POST /auth/login
- On success: route to `/applications/board`
- On failure: show inline error message

Session:

- Frontend relies on cookie session.
- On app boot, call GET /auth/me:
  - 200 => user authenticated
  - 401 => redirect to /login

## 3) Applications – Board (Primary workflow)

### Columns

Columns represent `State`:

- Interested
- Applied
- Screening
- Interview
- Rejected
- Ghosted
- Trash

Each column shows:

- Column name
- Count of cards
- Sort indicator (optional)

### Card content (minimum)

Each application card displays:

- Company name (bold)
- Job title
- Application tags (chips)
- Last moved date (e.g. “Moved 3d ago”)
- Optional: small icons for job link / notes

Card actions (v0)

- Click card => navigate to Application Detail
- Drag card => move to another column

### Drag & Drop behavior

- Drag from one column to another updates state:
  - Optimistic UI update: card moves immediately
  - POST /applications/:id/move with `toState`
  - If request fails:
    - revert card to original column
    - show toast error

Transition note:

- v0: no prompt for note on drag-drop
- v0.1: optionally allow “Move w/ note” from card menu

### Sorting within a column

Sort modes (user selectable):

- Updated recently (default): uses application.updatedAt or lastTransitionAt
- Company name (A→Z)
- Age in state (oldest first)

Implementation note:

- Can be client-side sort for v0 if each column payload is small
- For scale: add sort params to GET /applications

### Board data fetch strategy

Option A (simple v0):

- Load board by fetching all applications and grouping client-side:
  - GET /applications?view=board
Option B (more efficient later):
- Fetch each column:
  - GET /applications?state=INTERESTED, etc

### Column empty states

- “No applications in this state.”
- Provide quick action button: “Add application” (opens modal)

### Add application (modal)

Triggered from:

- Board header button
- Empty column CTA

Fields:

- Company (select existing OR create new inline)
- Job title (required)
- Job req URL (optional)
- Job description (markdown textarea)
- Initial state: Interested/Applied (default Interested)
- Application tags (multi-select; optional)

Behavior:

- POST /companies if inline create used
- POST /applications
- On success:
  - card appears in initial column
  - toast success

## 4) Applications – List (Filtering + sorting)

### Table columns

- Company
- Job title
- State
- Last moved (from transitions)
- Tags
- Updated

Row click => Application Detail

### Filters

- Search box (company name + job title)
- State dropdown (All + each state)
- Tags multi-select
- Company dropdown (optional v0.1)
- “Stale” toggle (optional v0.1):
  - e.g., Applied > 7 days, Screening > 10 days

### Sorting

- Updated
- Company
- State
- Age in state

Behavior:

- Prefer server-side filtering (query params on GET /applications)
- Client-side acceptable v0 if dataset is small

### Bulk actions (later)

- bulk tag
- bulk move to Trash

## 5) Application Detail

### Sections

Header:

- Company name (link to company detail)
- Job title
- Current state badge
- External link button (job req URL)

Tabs or sections below:

1) Description (Markdown render)
2) Timeline (State transitions)
3) Events (Important dates)
4) Tags

### Description (Markdown)

- Render jobDescriptionMd using markdown renderer
- v0: read-only (edit via “Edit” button)
- v0.1: inline edit allowed

### Timeline

Displays StateTransition list:

- transitionedAt
- fromState → toState
- note (if present)
- actor (if present)

### Events (Important Dates)

List of ApplicationEvent items:

- type + date/time
- note
Actions:
- Add event (modal)
- Delete event

### State movement from detail page

- Dropdown “Move to state…”
- Optional note input (v0.1)
- Calls POST /applications/:id/move

## 6) Companies

### Companies list

Columns:

- Name
- Tags
- Number Applications
- Updated

Search:

- by company name

Actions:

- Add company
- Edit company
- Delete company (confirm)

### Company detail

Header:

- Name + website link
- Tags (chips + edit)

Applications section:

- list of associated applications (mini table)
- click through to application detail

## 7) Dashboard

Dashboard contains:

1) State snapshot counts
2) Sankey chart (flow)
3) Important dates list

### Snapshot counts

- Cards displaying counts by state
- Data from GET /dashboard/snapshot

### Sankey

- v0 decision: Sankey is computed for **all time** (no date range selector).
- Data from GET /dashboard/sankey
- Chart displays flows between states using link values
- Clicking a link (optional v0.1) filters applications list by those states

Future:

- Add a boolean to exclude items from Sankey/analytics.

### Important dates

- Default range: next 14 days (configurable)
- Data from GET /dashboard/important-dates
- Displays chronological list:
  - date/time, type, company + job title, note

## 8) Accessibility / UX constraints

- Keyboard navigable tabs
- Focus states visible (Tailwind default focus ring or similar)
- Drag/drop has non-DnD fallback:
  - Card menu “Move to…” for keyboard-only users (v0.1)

## 9) Error handling

- 401 => redirect to /login
- 403 => “Not allowed”
- 409 move conflict => toast “Transition not allowed”
- Network errors => toast + retry suggestion

## 10) Non-goals (v0)

- Job Boards tab (planned)
- Tag suggestions (planned)
- Advanced reporting / export
- Calendar integration
<!-- stray text removed -->
