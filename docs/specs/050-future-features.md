# 050 - Future Features

This document tracks feature requests and enhancements planned for future iterations.

## Status: 🔲 Not Yet Implemented

---

## Company Autofill (AI-Enhanced Data Entry)

### Overview

Add an "Autofill with AI" button to the Company detail/edit page that uses an LLM to automatically research and populate company information fields.

### User Flow

1. User opens a Company page (new or existing)
2. User clicks "Autofill with AI" button
3. System makes an LLM API call (OpenAI/Anthropic via Langchain) with a research prompt
4. AI gathers information about the company:
   - LinkedIn company page URL
   - Glassdoor page URL
   - Careers/Jobs page URL
   - Google Maps link (if local/physical location)
   - Company description/summary
   - Industry/sector
   - Employee count estimate
   - Founded year
   - Any other relevant data points
5. Results are presented in a dialog/modal with a table of key-value pairs
6. User reviews the table and selects which fields to apply (checkboxes)
7. User clicks "Apply Selected" or "Cancel"
8. Selected fields are populated into the company form

### Technical Requirements

#### Backend

- New endpoint: `POST /api/companies/:id/autofill` or `POST /api/companies/autofill-research`
- Request body: `{ companyName: string, website?: string }`
- Integration with Langchain
- LLM API key configured in `.env`:
  ```
  LLM_API_KEY=sk-...
  LLM_PROVIDER=openai  # or anthropic
  LLM_MODEL=gpt-4o     # or claude-3-5-sonnet-latest
  ```
- Response format:
  ```json
  {
    "suggestions": [
      { "field": "linkedin", "value": "https://linkedin.com/company/...", "confidence": "high" },
      { "field": "glassdoor", "value": "https://glassdoor.com/...", "confidence": "medium" },
      { "field": "careers", "value": "https://company.com/careers", "confidence": "high" },
      { "field": "googleMaps", "value": "https://maps.google.com/...", "confidence": "low" },
      { "field": "description", "value": "...", "confidence": "high" },
      { "field": "industry", "value": "Technology", "confidence": "high" }
    ]
  }
  ```

#### Schema Changes

Extend `Company` model with new optional fields:
- `linkedin: String?`
- `glassdoor: String?`
- `careersPage: String?`
- `googleMaps: String?`
- `description: String?`  (or `descriptionMd: String?`)
- `industry: String?`
- `employeeCount: Int?`
- `foundedYear: Int?`

#### Frontend

- Add "Autofill with AI" button to Company page (visible when editing/creating)
- Loading state while AI processes request
- Modal/dialog component to display results:
  - Table with columns: Field | Value | Confidence | [Checkbox]
  - "Select All" / "Deselect All" helpers
  - "Apply Selected" and "Cancel" buttons
- Populate selected fields into the form
- Toast notification on success/error

#### LLM Prompt Design

```
You are a research assistant. Given a company name and optional website, 
research and return as much factual information as possible about the company.

Company Name: {companyName}
Website: {website}

Please find and return the following information in JSON format:
- linkedin: LinkedIn company page URL
- glassdoor: Glassdoor review page URL  
- careers: Careers/jobs page URL
- googleMaps: Google Maps link (if physical location)
- description: Brief company description (2-3 sentences)
- industry: Primary industry/sector
- employeeCount: Estimated employee count
- foundedYear: Year founded

Return ONLY valid JSON. If a field cannot be found, omit it or set to null.
Include a "confidence" field for each item: "high", "medium", or "low".
```

### Design Considerations

- **Rate limiting**: Consider rate-limiting the autofill API to prevent abuse
- **Caching**: Cache results by company name for 24-48 hours to reduce API costs
- **Error handling**: Gracefully handle LLM API failures (show user-friendly message)
- **Privacy**: Ensure no sensitive user data is sent to external LLM APIs
- **Cost control**: Monitor LLM API usage and implement spending limits
- **Validation**: Validate URLs returned by LLM before saving

### Related Specs

- [010-domain-model.md](./010-domain-model.md) - Company entity
- [020-api-contract.md](./020-api-contract.md) - API endpoints
- [030-ui-spec.md](./030-ui-spec.md) - Company page UI

---

## Other Future Features (Backlog)

### Events/Notes on Applications
- Timestamped notes/events attached to applications
- Track phone screens, interviews, follow-ups

### State Transition History
- Show full history of state changes in application detail view
- Display who made the transition and when

### Inline Company Creation
- "Add new company" option in application creation modal
- Avoid context switching to Companies page

### Column Sorting
- Sort applications within board columns by date, company name, etc.

### Bulk Actions
- Multi-select applications in list view
- Bulk move to state, bulk trash

### CSV Import/Export
- Export applications to CSV
- Import applications from CSV (with validation)

### Mobile Optimization
- Improve mobile responsiveness for board view
- Touch-friendly drag-and-drop

---

## Status: ✅ Implemented

### User Administration (Admin Panel)

**Implemented in v0.1**

Admin users can manage all users in the system.

#### Roles

| Role | Description |
|------|-------------|
| `admin` | Full access: all user features + admin panel (user CRUD) |
| `aiuser` | All user features + AI-powered features (autofill, etc.) |
| `user` | Standard access: companies, applications, job boards |

#### API Endpoints

```
GET    /api/admin/users           # List all users
GET    /api/admin/users/:id       # Get user details
POST   /api/admin/users           # Create user { email, password, role? }
PATCH  /api/admin/users/:id       # Update user { email?, role? }
POST   /api/admin/users/:id/set-password  # Set password { password }
DELETE /api/admin/users/:id       # Delete user and all their data
POST   /api/admin/users/:id/clear-data    # Clear user's data (keep account)
```

All endpoints require `admin` role. Returns 403 Forbidden for non-admins.

#### Response Format

```json
{
  "id": "cuid...",
  "email": "user@example.com",
  "role": "user",
  "createdAt": "2026-01-29T...",
  "updatedAt": "2026-01-29T...",
  "companiesCount": 5,
  "applicationsCount": 12,
  "jobBoardsCount": 3
}
```

#### Admin UI (Implemented)

- Admin Users page at `/admin/users`
- Table with all users: email, role, created, data counts
- Actions: Edit, Set Password, Clear Data, Delete
- Confirmation dialogs for destructive actions
- Password requirements: minimum 6 characters
- Admin-only nav link (red accent color)
