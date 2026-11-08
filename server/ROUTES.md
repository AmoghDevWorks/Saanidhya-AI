I’ll map the FastAPI registration points and every route module, then summarize each section’s purpose, authentication, and current behavior.

Read , lines 1 to 220
Completed with input: {
  "path": "E:\\Gnani AI\\server\\app\\main.py",
  "view_range": [
    1,
    220
  ]
}

Read , lines 1 to 280
Completed with input: {
  "path": "E:\\Gnani AI\\server\\app\\routes\\auth.py",
  "view_range": [
    1,
    280
  ]
}

Read , lines 1 to 360
Completed with input: {
  "path": "E:\\Gnani AI\\server\\app\\routes\\checkin.py",
  "view_range": [
    1,
    360
  ]
}

Read , lines 1 to 360
Completed with input: {
  "path": "E:\\Gnani AI\\server\\app\\routes\\family.py",
  "view_range": [
    1,
    360
  ]
}

Read , lines 1 to 280
Completed with input: {
  "path": "E:\\Gnani AI\\server\\app\\routes\\voice.py",
  "view_range": [
    1,
    280
  ]
}

Read , lines 1 to 320
Completed with input: {
  "path": "E:\\Gnani AI\\server\\app\\routes\\memory.py",
  "view_range": [
    1,
    320
  ]
}

Read , lines 1 to 180
Completed with input: {
  "path": "E:\\Gnani AI\\server\\app\\config.py",
  "view_range": [
    1,
    180
  ]
}

Read , lines 1 to 240
Completed with input: {
  "path": "E:\\Gnani AI\\server\\app\\database.py",
  "view_range": [
    1,
    240
  ]
}

# Backend Route Analysis

The FastAPI application is registered in `main.py`. It exposes health endpoints plus five functional API sections.

## 1. Health and Application Status

Implemented in `main.py`.

| Method | Route | Authentication | Purpose |
|---|---|---|---|
| `GET` | `/` | Public | Returns application name, version, status, and documentation links. |
| `GET` | `/health` | Public | Lightweight health check used to confirm that the backend is running. |

### Why this section exists

This section supports:

- Server availability checks.
- Deployment and monitoring probes.
- Quick confirmation that FastAPI has started successfully.
- Discovering Swagger documentation at `/docs`.

---

## 2. Authentication

Implemented in `auth.py`.

Base prefix: `/api/auth`

| Method | Route | Authentication | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Creates an elderly or family account and returns a JWT token. |
| `POST` | `/api/auth/login` | Public | Verifies credentials and issues a JWT access token. |
| `GET` | `/api/auth/me` | Required | Returns the authenticated user's profile. |
| `POST` | `/api/auth/logout` | Optional bearer token | Returns a logout confirmation. The frontend removes the stateless JWT. |

### Why this section exists

This section provides:

- Account creation.
- Login and session establishment.
- Role identification through `elderly` or `family`.
- JWT-based access control for protected APIs.
- User identity resolution through `get_current_user`.

Authentication validates:

1. Bearer token presence.
2. JWT signature and expiry.
3. User ID in the token.
4. User existence in MongoDB.
5. Active account status.

### Important implementation note

`/api/auth/logout` does not revoke tokens server-side because the application uses stateless JWTs. Logout depends on the client deleting its stored token.

---

## 3. Daily Check-ins

Implemented in `checkin.py`.

Base prefix: `/api/checkin`

| Method | Route | Authentication | Purpose |
|---|---|---|---|
| `GET` | `/api/checkin/today` | Required | Retrieves the user's current-day check-in status and wellness summary. |
| `POST` | `/api/checkin/save` | Required | Saves a completed conversation and wellness information. |
| `GET` | `/api/checkin/history` | Required | Retrieves previous check-in records for the authenticated user. |
| `POST` | `/api/checkin/start` | Required | Starts a new active check-in session. |
| `POST` | `/api/checkin/{session_id}/message` | Required | Processes a conversational message within an active session. |
| `POST` | `/api/checkin/{session_id}/end` | Required | Completes the session and triggers background memory extraction. |

### Why this section exists

This is the main wellness workflow for elderly users. It serves:

- Daily morning or wellness check-ins.
- Conversation session lifecycle management.
- Storage of dialogue and wellness observations.
- Retrieval of previous check-ins.
- Connection between voice processing, Evon reasoning, and memory.

### Check-in lifecycle

```text
POST /start
    ↓
POST /{session_id}/message
    ↓
POST /{session_id}/message
    ↓
POST /{session_id}/end
```

### Memory integration

When `/api/checkin/start` is called:

- The user's memory consent is checked.
- Relevant memories are retrieved.
- A limited memory context is stored with the session.

When `/api/checkin/{session_id}/end` is called:

- The session is marked completed.
- Conversation messages are persisted.
- Memory extraction runs as a background task.
- Memory extraction failure does not fail the completed check-in.

### Current limitations

The legacy `/api/checkin/save` path still uses the existing check-in schema and summary logic. The newer session-based flow stores active session messages separately and should eventually be consolidated with the legacy save path.

---

## 4. Voice and Gnani AI Integration

Implemented in `voice.py` and `gnani_service.py`.

Base prefix: `/api/voice`

| Method | Route | Authentication | Intended provider | Purpose |
|---|---|---|---|---|
| `POST` | `/api/voice/transcribe` | Required | Prisma | Upload audio and convert speech to text. |
| `POST` | `/api/voice/respond` | Required | Evon | Generate a conversational response from a transcript. |
| `POST` | `/api/voice/synthesize` | Required | Timbre | Convert response text into playable audio. |

### Why this section exists

This section isolates provider responsibilities:

- Prisma handles speech recognition.
- Evon handles reasoning and conversational response generation.
- Timbre handles text-to-speech.
- Credentials remain on the backend.
- Provider failures are translated into explicit API errors.

### Current implementation status

The adapters are modular, but official Gnani API documentation is not present in the repository. Therefore:

- Empty audio returns `400`.
- Missing or invalid input returns `400`.
- Missing official provider contracts return `503`.
- Unexpected provider failures return `502`.

The application does not invent provider URLs, headers, payloads, media formats, or response schemas.

---

## 5. Conversational Memory

Implemented in `memory.py`, `memory_repository.py`, and the memory services.

| Method | Route | Authentication | Purpose |
|---|---|---|---|
| `GET` | `/api/memory` | Required | Lists the authenticated user's stored memories and consent status. |
| `GET` | `/api/memory/{memory_id}` | Required | Retrieves one memory belonging to the authenticated user. |
| `PATCH` | `/api/memory/{memory_id}` | Required | Updates a user's memory. |
| `DELETE` | `/api/memory/{memory_id}` | Required | Deletes one user's memory. |
| `DELETE` | `/api/memory` | Required | Deletes all memories and disables memory consent. |
| `GET` | `/api/memory/follow-ups` | Required | Lists memories categorized as unresolved follow-ups. |
| `PATCH` | `/api/memory/preferences` | Required | Enables or disables persistent memory. |

### Why this section exists

This section allows Saanidhya to:

- Remember meaningful user-provided information.
- Personalize future check-ins.
- Track unresolved concerns.
- Give users control over stored memories.
- Edit incorrect memories.
- Delete individual or all memories.

### Privacy behavior

- Memory consent defaults to disabled for new accounts.
- Disabling memory deletes the user's stored memories.
- Every repository query includes `user_id`.
- Memory IDs cannot be used to access another user's records.
- Raw audio is not stored as memory.
- Only explicit user statements are extracted.
- AI-generated medical diagnoses are not stored.

### Memory categories

- `personal_information`
- `wellness_context`
- `interests`
- `important_context`

---

## 6. Family and Caregiver Dashboard

Implemented in `family.py`.

Base prefix: `/api/family`

| Method | Route | Authentication | Purpose |
|---|---|---|---|
| `GET` | `/api/family/dashboard` | Required | Returns caregiver dashboard information, wellness data, alerts, reminders, and recent check-ins. |
| `POST` | `/api/family/alerts/{alert_id}/acknowledge` | Required | Marks an alert as acknowledged. |
| `POST` | `/api/family/reminders` | Required | Creates a reminder response for the senior. |

### Why this section exists

This section serves family members and caregivers by providing:

- Senior wellness overview.
- Recent check-in information.
- Wellness alerts.
- Medication and routine reminders.
- Alert acknowledgement.

### Current limitations

There are important implementation gaps:

1. The routes require authentication but do not currently enforce `account_type == family`.
2. Alert acknowledgement does not scope the update by the authenticated family user or connected senior.
3. Reminder creation currently returns a simulated reminder and does not persist it to MongoDB.
4. The dashboard service contains fallback/demo data when collections are empty.
5. Family access relationships are not yet modeled explicitly.

These should be addressed before production use.

---

## 7. Backend Data Collections

The database helpers are in `database.py`.

| Collection | Served by | Purpose |
|---|---|---|
| `users` | Authentication and user lookup | Stores account identity, role, credentials, and memory consent. |
| `checkins` | Check-in routes and memory service | Stores check-in sessions, dialogue, summaries, and wellness observations. |
| `alerts` | Check-in and family routes | Stores caregiver-facing wellness alerts. |
| `reminders` | Family routes | Intended for caregiver-created reminders. |
| `memories` | Memory routes and services | Stores private, user-scoped conversational memories. |

Indexes are initialized during application startup.

---

## Overall Backend Flow

```text
Client
  ↓
JWT authentication
  ↓
Check-in session starts
  ↓
Relevant memories are retrieved
  ↓
Audio is sent to Prisma
  ↓
Transcript is sent to Evon
  ↓
Response is sent to Timbre
  ↓
Conversation message is persisted
  ↓
Check-in ends
  ↓
Explicit user facts are extracted as memories
  ↓
User can review, edit, or delete memories
```

## Current Production Readiness Summary

| Area | Status |
|---|---|
| Health endpoints | Implemented |
| JWT authentication | Implemented |
| Elderly check-ins | Implemented |
| Voice route contracts | Implemented |
| Actual Gnani provider calls | Pending official API documentation |
| Memory storage | Implemented |
| Memory consent | Implemented |
| Memory user isolation | Implemented |
| Memory dashboard | Implemented |
| Family role enforcement | Needs strengthening |
| Reminder persistence | Not fully implemented |
| Family-to-senior authorization model | Not yet implemented |
| Demo fallback data removal | Recommended before production |