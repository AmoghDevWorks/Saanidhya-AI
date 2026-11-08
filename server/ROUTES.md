# Backend Route Analysis

The FastAPI application is registered in `main.py`. It exposes health,
authentication, check-in, voice, memory, family, notification, alert, reminder,
and scheduled check-in routes.

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
| POST | `/api/checkin/save` | Required | Legacy save endpoint for a completed dialogue and wellness markers; retained for compatibility. |
| GET | `/api/checkin/history` | Required | Previous check-ins for the authenticated user, including Gemini summaries and persisted conversation messages. |
| POST | `/api/checkin/start` | Required | Atomically creates or reuses the authenticated user's active daily session and loads relevant memories when consent is enabled. |
| POST | `/api/checkin/{session_id}/message` | Required | Processes a message in an active session through the configured LLM provider. |
| POST | `/api/checkin/{session_id}/end` | Required | Generates a short Gemini summary, stores the completed conversation and summary, and schedules memory extraction. |

The section serves the elderly user's daily wellness workflow: session
lifecycle, dialogue persistence, wellness summaries, and the intended connection
to voice reasoning and conversational memory.

The legacy save route also applies defaults when optional wellness
fields are omitted, so those values must not be interpreted as verified
observations.

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

Sessions are scoped by both `session_id` and authenticated `user_id`. Active
sessions are unique per user and session type through a MongoDB partial unique
index, so concurrent workers cannot create duplicate active sessions. Reusing an
active session returns its existing messages and memory context.
Post-check-in memory extraction is background work; extraction failure does not
invalidate a completed check-in.

## 4. Voice and Gnani AI

Base prefix: `/api/voice`

Implemented in `app/routes/voice.py` and
`app/services/gnani_service.py`.

| Method | Route | Auth | Intended provider | Serves |
|---|---|---|---|---|
| POST | `/api/voice/transcribe` | Required | Prisma | Accepts an uploaded audio file and returns a transcript. |
| POST | `/api/voice/respond` | Required | Configured LLM | Accepts transcript, recent conversation, and consent-scoped memory context and returns structured response data. |
| POST | `/api/voice/synthesize` | Required | Timbre | Accepts response text and returns base64-encoded playable audio data. |
| GET | `/api/voice/llm/status` | Required | Gemini | Reports Gemini configuration and availability status. |

This section keeps provider calls on the backend and separates speech
recognition, reasoning, and speech synthesis. Prisma uses the documented
`https://api.vachana.ai/stt/v3` multipart contract and Timbre uses the documented
`https://api.vachana.ai/api/v1/tts/inference` JSON contract. API keys remain
backend-only. Provider timeouts, authentication failures, invalid audio, and
invalid provider responses are surfaced as explicit errors.

Gemini is the only provider through the official `google-genai` SDK and uses
`gemini-2.5-flash` by default. It receives the shared Saanidhya prompt, recent
conversation, and consent-scoped memory context. The service limits concurrency,
applies inference timeouts, logs duration without prompt content, and returns
explicit errors without silently falling back.

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

This section lets Saanidhya store selected explicit user statements, retrieve
recent context for future check-ins, and give the user review, editing, consent,
and deletion controls.

Memory is opt-in for new accounts. Repository operations always include the
authenticated user's ID, preventing cross-user memory access. Extraction is
currently conservative regex matching and retrieval is recency/confidence
ranking; semantic similarity, conflict resolution, and memory supersession are
not implemented.

## 6. Family and Caregiver Dashboard

Base prefix: `/api/family`

Implemented in `app/routes/family.py`.

| Method | Route | Auth | Serves |
|---|---|---|---|
| GET | `/api/family/dashboard` | Required | Caregiver dashboard data: senior overview, recent check-ins, alerts, and reminders. |
| POST | `/api/family/alerts/{alert_id}/acknowledge` | Required | Marks a caregiver alert as acknowledged. |
| POST | `/api/family/reminders` | Family user | Legacy endpoint; validates family access and returns `410`. Use `/api/reminders` for persistent reminders. |

This section is intended to keep caregivers informed about meaningful wellness
updates without exposing private memories by default.

The dashboard requires an accepted family relationship, active elderly
family-sharing consent, and the `wellness_summaries` permission. Alert
acknowledgement additionally requires `notifications_enabled`. The legacy
`POST /api/family/reminders` endpoint no longer fabricates a reminder; callers
must use the persistent reminder API.

## 7. Family Relationships, Consent, Alerts, and Notifications

Implemented in `app/routes/notifications.py` and supporting family-link and
alert services.

### Family relationships

| Method | Route | Auth | Serves |
|---|---|---|---|
| POST | `/api/family/invitations` | Elderly user | Creates a seven-day invitation for an existing family account; only a SHA-256 token hash is persisted. |
| POST | `/api/family/invitations/accept` | Family user | Accepts a valid invitation token and creates an accepted relationship. |
| POST | `/api/family/invitations/reject` | Family user | Rejects a pending invitation without exposing or storing the raw token. |
| GET | `/api/family/invitations` | Authenticated user | Lists the current user's pending outgoing or incoming invitations; expired entries are labelled. |
| GET | `/api/family/relationships` | Required | Lists accepted relationships involving the current user. |
| PATCH | `/api/family/relationships/{relationship_id}/permissions` | Elderly user | Updates the linked family member's allow-list permissions. |
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
| GET | `/api/notifications` | Family user | Lists the user's notifications and unread count after revalidating each linked senior's active relationship, notification permission, and current consent. |
| GET | `/api/notifications/unread-count` | Family user | Returns the consent- and relationship-filtered unread count. |
| PATCH | `/api/notifications/{notification_id}/read` | Family user | Marks one currently authorized notification as read. |
| PATCH | `/api/notifications/read-all` | Family user | Marks all currently authorized notifications as read. |

### Alerts

| Method | Route | Auth | Serves |
|---|---|---|---|
| GET | `/api/alerts` | Family user | Lists alerts for explicitly linked elderly users. |
| GET | `/api/alerts/{alert_id}` | Family user | Retrieves one alert only when the family relationship is authorized. |
| PATCH | `/api/alerts/{alert_id}/status` | Family user | Moves an alert through `new`, `acknowledged`, `in_progress`, `resolved`, or `dismissed`. |

All check-in alert-producing paths use the centralized alert service. Active alerts
are deduplicated with a unique `active_key`, and alert notifications use a unique
recipient/alert key. Notifications are generated only for currently accepted
relationships with notification permission and senior consent. Alert status changes
record the actor and clear the active deduplication key when resolved or dismissed.
External email, SMS, WhatsApp, and push delivery are not configured.

## 8. Data Collections Used by Routes

Configured in `app/database.py`.

| Collection | Purpose |
|---|---|
| `users` | Accounts, roles, credentials, and memory consent. |
| `checkins` | Check-in sessions, dialogue, summaries, and wellness observations. |
| `alerts` | Caregiver-facing wellness alerts. |
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
| POST | `/api/reminders/{reminder_id}/pause` | Required | Pauses an active reminder without deleting it. |
| POST | `/api/reminders/{reminder_id}/resume` | Required | Resumes a paused reminder and recalculates its next occurrence. |

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
startup. It atomically claims due reminders with a short processing lease,
creates in-app notifications and idempotent occurrence records, and can reclaim
an expired lease after a worker interruption. It is still an in-process
scheduler and is not a distributed production worker.
It does not place phone calls or start microphone recording without user
interaction and browser permission.

Scheduled check-ins create a due execution and an in-app prompt. They do not
automatically start a voice session, and missed, skipped, completed, and failed
execution transitions are not fully implemented.

## 10. Route Error Conventions

| Status | Meaning |
|---|---|
| Health endpoints | Implemented |
| JWT authentication | Implemented; logout is client-side because tokens are stateless |
| Elderly check-ins | Partially implemented; provider calls and interrupted-session cleanup remain |
| Voice route contracts | Implemented |
| Prisma/Timbre provider calls | Implemented when their backend API keys are configured |
| LLM inference | Gemini-only implementation; provider failures never silently fall back |
| Memory storage | Implemented with user-scoped MongoDB access |
| Memory intelligence | Partial; regex extraction and recency ranking only |
| Memory consent | Implemented |
| Memory user isolation | Implemented in repository operations |
| Memory dashboard | Implemented for review, edit, delete, and consent |
| Family role enforcement | Implemented on family dashboard and family-only routes |
| Family-to-senior authorization | Implemented for the Phase 1 relationship, permission, consent, alert, and notification paths; broader senior history/reminder delegation remains intentionally limited |
| Alert generation | Implemented through the centralized service with active-alert and notification deduplication |
| Notification access | Implemented with recipient ownership plus read-time relationship, permission, and consent revalidation |
| Reminder persistence | Implemented for user-owned reminders and occurrences |
| Reminder execution | Partial; in-process scheduler with in-app notifications only |
| Scheduled check-ins | Partial; due prompts are created, but no automatic voice launch or complete missed lifecycle |
| Wellness insights | Partial; keyword discomfort detection only |
| Demo fallback data removal | Removed from the main live dashboard/history workflows; legacy/default values remain in some compatibility paths |
