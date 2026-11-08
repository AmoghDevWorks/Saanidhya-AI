# Saanidhya AI Backend Routes

The backend is a FastAPI application mounted from `app.main`. Protected routes
require an `Authorization: Bearer <JWT>` header unless noted otherwise.

## 1. Health and Application Status

Implemented in `app/main.py`.

| Method | Route | Auth | Serves |
|---|---|---|---|
| GET | `/` | Public | Application name, version, status, and documentation links. |
| GET | `/health` | Public | Lightweight server health check. |

These routes support startup checks, deployment probes, monitoring, and quick
confirmation that the API is available.

## 2. Authentication

Base prefix: `/api/auth`

Implemented in `app/routes/auth.py`.

| Method | Route | Auth | Serves |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Creates an elderly or family account and returns a JWT. |
| POST | `/api/auth/login` | Public | Validates credentials and issues a JWT. |
| GET | `/api/auth/me` | Required | Returns the current authenticated user's safe profile. |
| POST | `/api/auth/logout` | Optional | Returns logout confirmation; the client removes the stateless JWT. |

This section establishes identity and access control for all user-specific
features. Authentication verifies the token, user ID, account existence, and
active status.

## 3. Daily Check-ins

Base prefix: `/api/checkin`

Implemented in `app/routes/checkin.py`.

| Method | Route | Auth | Serves |
|---|---|---|---|
| GET | `/api/checkin/today` | Required | Today's check-in status and wellness summary. |
| POST | `/api/checkin/save` | Required | Legacy save endpoint for a completed dialogue and wellness markers. |
| GET | `/api/checkin/history` | Required | Previous check-ins for the authenticated user. |
| POST | `/api/checkin/start` | Required | Creates an active check-in session and loads relevant memories when consent is enabled. |
| POST | `/api/checkin/{session_id}/message` | Required | Processes a message in an active session through Evon. |
| POST | `/api/checkin/{session_id}/end` | Required | Completes the session and schedules memory extraction. |

The section serves the elderly user's daily wellness workflow: session
lifecycle, dialogue persistence, wellness summaries, and connection to voice
reasoning and conversational memory.

### Session lifecycle

```text
POST /api/checkin/start
    ↓
POST /api/checkin/{session_id}/message
    ↓
POST /api/checkin/{session_id}/message
    ↓
POST /api/checkin/{session_id}/end
```

Sessions are scoped by both `session_id` and authenticated `user_id`.
Post-check-in memory extraction is background work; extraction failure does not
invalidate a completed check-in.

## 4. Voice and Gnani AI

Base prefix: `/api/voice`

Implemented in `app/routes/voice.py` and
`app/services/gnani_service.py`.

| Method | Route | Auth | Intended provider | Serves |
|---|---|---|---|---|
| POST | `/api/voice/transcribe` | Required | Prisma | Accepts an uploaded audio file and returns a transcript. |
| POST | `/api/voice/respond` | Required | Evon | Accepts transcript and conversation context and returns structured response data. |
| POST | `/api/voice/synthesize` | Required | Timbre | Accepts response text and returns playable audio data. |

This section keeps provider calls on the backend and separates speech
recognition, reasoning, and speech synthesis.

Official Gnani API documentation is not currently present in the repository.
The adapters therefore return an explicit `503` integration-unavailable error
instead of inventing provider URLs, headers, payloads, media formats, or
response schemas.

## 5. Conversational Memory

Base prefix: `/api/memory`

Implemented in `app/routes/memory.py`, with persistence in
`app/repositories/memory_repository.py`.

| Method | Route | Auth | Serves |
|---|---|---|---|
| GET | `/api/memory` | Required | Lists the current user's memories and consent status. |
| GET | `/api/memory/{memory_id}` | Required | Retrieves one memory belonging to the current user. |
| PATCH | `/api/memory/{memory_id}` | Required | Edits one memory. |
| DELETE | `/api/memory/{memory_id}` | Required | Deletes one memory. |
| DELETE | `/api/memory` | Required | Deletes all memories and disables memory consent. |
| GET | `/api/memory/follow-ups` | Required | Lists memories categorized as unresolved follow-ups. |
| PATCH | `/api/memory/preferences` | Required | Enables or disables persistent memory. Disabling deletes existing memories. |

This section lets Saanidhya remember meaningful explicit user statements,
retrieve relevant context for future check-ins, and give the user review,
editing, consent, and deletion controls.

Memory is opt-in for new accounts. Repository operations always include the
authenticated user's ID, preventing cross-user memory access.

## 6. Family and Caregiver Dashboard

Base prefix: `/api/family`

Implemented in `app/routes/family.py`.

| Method | Route | Auth | Serves |
|---|---|---|---|
| GET | `/api/family/dashboard` | Required | Caregiver dashboard data: senior overview, recent check-ins, alerts, and reminders. |
| POST | `/api/family/alerts/{alert_id}/acknowledge` | Required | Marks a caregiver alert as acknowledged. |
| POST | `/api/family/reminders` | Required | Accepts reminder details for a senior. |

This section is intended to keep caregivers informed about meaningful wellness
updates without exposing private memories by default.

Current limitations:

- The routes authenticate users but do not yet enforce a family-only role.
- Family-to-senior relationships and granular sharing permissions are not yet modeled.
- Alert acknowledgement is not yet scoped to a verified family relationship.
- Reminder creation currently returns a response but does not fully persist the reminder.
- Dashboard fallback/demo data remains in the service and should be removed before production.

## 7. Family Relationships, Consent, Alerts, and Notifications

Implemented in `app/routes/notifications.py` and supporting family-link and
alert services.

### Family relationships

| Method | Route | Auth | Serves |
|---|---|---|---|
| POST | `/api/family/invitations` | Elderly user | Creates a seven-day invitation for an existing family account. |
| POST | `/api/family/invitations/accept` | Family user | Accepts a valid invitation token and creates an accepted relationship. |
| GET | `/api/family/relationships` | Required | Lists accepted relationships involving the current user. |
| DELETE | `/api/family/relationships/{relationship_id}` | Related user | Revokes an accepted relationship. |

### Family sharing preferences

| Method | Route | Auth | Serves |
|---|---|---|---|
| GET | `/api/family/consent` | Elderly user | Returns family-sharing consent and category preferences. |
| PATCH | `/api/family/consent` | Elderly user | Updates family-sharing consent and preferences. |
| GET | `/api/family/preferences` | Elderly user | Alias for family-sharing preferences. |
| PATCH | `/api/family/preferences` | Elderly user | Alias for updating family-sharing preferences. |

### In-app notifications

| Method | Route | Auth | Serves |
|---|---|---|---|
| GET | `/api/notifications` | Family user | Lists the user's notifications and unread count. |
| GET | `/api/notifications/unread-count` | Family user | Returns the unread notification count. |
| PATCH | `/api/notifications/{notification_id}/read` | Family user | Marks one owned notification as read. |
| PATCH | `/api/notifications/read-all` | Family user | Marks all owned notifications as read. |

### Alerts

| Method | Route | Auth | Serves |
|---|---|---|---|
| GET | `/api/alerts` | Family user | Lists alerts for explicitly linked elderly users. |
| GET | `/api/alerts/{alert_id}` | Family user | Retrieves one alert only when the family relationship is authorized. |
| PATCH | `/api/alerts/{alert_id}/status` | Family user | Moves an alert through `new`, `acknowledged`, `in_progress`, `resolved`, or `dismissed`. |

Alert generation is centralized in `alert_service.py`. Open alerts are
deduplicated by elderly user, category, and deduplication key. Notifications
are created only for accepted family relationships. External email, SMS,
WhatsApp, and push delivery are not configured.

## 8. Data Collections Used by Routes

Configured in `app/database.py`.

| Collection | Purpose |
|---|---|
| `users` | Accounts, roles, credentials, and memory consent. |
| `checkins` | Check-in sessions, dialogue, summaries, and wellness observations. |
| `alerts` | Caregiver-facing wellness alerts. |
| `reminders` | Intended storage for caregiver reminders. |
| `memories` | Private, user-scoped conversational memories. |
| `reminders` | User-created medication, routine, event, and follow-up reminders. |
| `reminder_occurrences` | Idempotent scheduled reminder executions and completion state. |
| `checkin_schedules` | User-configured recurring voice check-in schedules. |
| `checkin_executions` | Scheduled check-in execution history. |

MongoDB indexes are initialized during application startup when a real
`MONGODB_URI` is configured.

## 9. Reminders and Scheduled Check-ins

Implemented in `app/routes/reminders.py`, with scheduling logic in
`app/services/reminder_service.py` and the lightweight background poller in
`app/services/scheduler_service.py`.

### Reminder management

| Method | Route | Auth | Serves |
|---|---|---|---|
| POST | `/api/reminders` | Required | Creates a user-owned reminder. |
| GET | `/api/reminders` | Required | Lists the current user's reminders. |
| GET | `/api/reminders/upcoming` | Required | Lists active future reminders. |
| GET | `/api/reminders/{reminder_id}` | Required | Retrieves one owned reminder. |
| PATCH | `/api/reminders/{reminder_id}` | Required | Updates an owned reminder. |
| DELETE | `/api/reminders/{reminder_id}` | Required | Cancels an owned reminder. |
| POST | `/api/reminders/{reminder_id}/acknowledge` | Required | Records that the current occurrence was seen. |
| POST | `/api/reminders/{reminder_id}/complete` | Required | Records user completion separately from acknowledgement. |
| POST | `/api/reminders/{reminder_id}/skip` | Required | Records that the current occurrence was skipped. |

Supported categories are `medication`, `routine`, `event`, and `follow_up`.
Supported frequencies are `once`, `daily`, and `weekly`. Reminder times are
calculated using the configured IANA timezone and stored timestamps are UTC.
Medication reminders never prove that medication was taken.

### Check-in schedules

| Method | Route | Auth | Serves |
|---|---|---|---|
| POST | `/api/schedules/checkins` | Required | Creates a recurring check-in schedule. |
| GET | `/api/schedules/checkins` | Required | Lists the user's schedules. |
| PATCH | `/api/schedules/checkins/{schedule_id}` | Required | Updates a schedule. |
| DELETE | `/api/schedules/checkins/{schedule_id}` | Required | Disables a schedule. |
| GET | `/api/schedules/checkins/history` | Required | Lists scheduled check-in execution history. |

The backend scheduler polls due reminders every 60 seconds after application
startup. It creates in-app notifications and idempotent occurrence records.
It does not place phone calls or start microphone recording without user
interaction and browser permission.

## 10. Route Error Conventions

| Status | Meaning |
|---|---|
| `400` | Invalid or empty request data. |
| `401` | Missing, expired, or invalid JWT. |
| `403` | Authenticated account is inactive or access is forbidden. |
| `404` | Requested session or memory does not exist for the authenticated user. |
| `502` | Upstream provider request failed unexpectedly. |
| `503` | Required provider integration or external service is unavailable. |

See the automatically generated API documentation at `/docs` for request and
response schemas.
