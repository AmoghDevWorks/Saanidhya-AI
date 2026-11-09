# Saanidhya AI — Solution Pitch

## Project

**GitHub:** [AmoghDevWorks/Saanidhya-AI](https://github.com/AmoghDevWorks/Saanidhya-AI)

## The Problem

Many elderly people live alone or have limited access to consistent companionship and care. Family members may be unable to monitor daily well-being, medication routines, or changes in mood and comfort. Existing care solutions can be difficult to use, especially for seniors who prefer speaking in their regional language rather than typing.

## Our Solution

Saanidhya AI is a multilingual, voice-first companion for elderly care. It conducts gentle daily check-ins, listens to the elder’s responses, remembers meaningful information with consent, and keeps approved family members informed through summaries, reminders, and alerts.

The experience is designed to be simple: the elder speaks naturally, while Saanidhya AI handles transcription, contextual understanding, conversation, persistence, and spoken responses.

## Core Experience

- **Voice check-ins:** Daily conversations in supported Indian languages.
- **AI conversation:** Gemini provides contextual, memory-aware responses without diagnosing or fabricating medical advice.
- **Wellness awareness:** Conversations can record mood, medication confirmations, discomfort, and follow-up observations.
- **Consent-based memory:** Elders control whether personal memories are stored, edited, or deleted.
- **Family connection:** Elders invite trusted family members and control what they can access.
- **Shared reminders:** Approved family members can create reminders that appear in the elder’s reminder list and notifications.
- **Conversation history:** Elders and permitted family members can review persisted summaries and full check-in conversations.

## Architecture

```text
Elder speaks
  → Gnani Prisma STT
  → FastAPI conversation pipeline
  → MongoDB memory and check-in retrieval
  → Google Gemini
  → Gnani Timbre TTS
  → Elder hears the response
```

Text conversations use the same memory, authorization, Gemini, and persistence pipeline. JWT authentication, relationship permissions, consent checks, and user-scoped MongoDB queries protect personal information.

## Expected Impact

Saanidhya AI helps elders feel heard and supported while giving families timely, permission-based visibility into daily well-being. It reduces the friction of care coordination without replacing human relationships or professional medical care.
