# Saanidhya AI 💙
### An AI-Powered Voice Companion for Elderly Care

Saanidhya AI is an intelligent, multilingual voice companion designed to support elderly people, especially those living alone. Built for Gnani AI's Great Indian AI Internship Challenge, it enables natural conversations, daily wellness check-ins, conversational memory, and family notifications using Gnani AI's speech and language models.

The goal is to make every elderly person feel heard, supported, and connected, even when their loved ones are miles away.

---

## ✨ Key Features

- **Voice-Based Check-ins:** Conduct natural daily conversations with elderly users.
- **Multilingual Support:** Enable conversations in regional Indian languages.
- **AI-Powered Understanding:** Extract meaningful information and wellness indicators from conversations.
- **Conversational Memory:** Remember previous interactions and follow up on important details.
- **Medicine Reminders:** Track medication reminders and confirmations.
- **Family Updates:** Keep family members informed through meaningful summaries and alerts.
- **Wellness Monitoring:** Identify potential concerns such as missed medication or recurring discomfort.

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Framer Motion
- Lucide React

### Backend
- Python
- FastAPI
- Uvicorn
- PyMongo
- MongoDB

### AI Integration – Gnani AI
- **Prisma:** Speech-to-Text
- **Evon:** Reasoning and conversation analysis
- **Timbre:** Text-to-Speech

---

## 📁 Project Structure

```text
Saanidhya-AI/
│
├── client/                     # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # FastAPI backend
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── checkin.py
│   │   │   ├── family.py
│   │   │   ├── memory.py
│   │   │   └── voice.py
│   │   ├── repositories/
│   │   │   └── memory_repository.py
│   │   ├── services/
│   │   │   ├── gnani_service.py
│   │   │   ├── memory_extraction_service.py
│   │   │   ├── memory_retrieval_service.py
│   │   │   └── memory_service.py
│   │   ├── schemas/
│   │   └── main.py
│   ├── .env
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

Follow these instructions to run the project locally.

### Prerequisites

Make sure you have the following installed:

- Node.js (v18 or later)
- npm
- Python 3.10+
- pip
- MongoDB Atlas account or local MongoDB instance
- Git

Verify your installations:

```bash
node -v
npm -v
python --version
pip --version
```

---

## 💻 Frontend Setup

### 1. Navigate to the frontend directory

```bash
cd client
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `client` directory:

```env
VITE_API_URL=http://localhost:8000
```

### 4. Start the development server

```bash
npm run dev
```

Frontend will be available at:

**http://localhost:5173**

### Available Frontend Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build production application |
| `npm run preview` | Preview production build |

---

## ⚙️ Backend Setup

### 1. Navigate to the backend directory

Open another terminal from the project root:

```bash
cd server
```

### 2. Create a virtual environment

**Windows (PowerShell):**

```powershell
python -m venv venv
```

Activate it:

```powershell
.\venv\Scripts\Activate.ps1
```

**Linux / macOS:**

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

If installing for the first time, use:

```bash
pip install fastapi "uvicorn[standard]" python-dotenv python-multipart httpx pydantic pymongo
```

### 4. Configure environment variables

Create a `.env` file inside the `server` directory:

```env
# Gnani AI
GNANI_API_KEY=your_gnani_api_key

# MongoDB
MONGODB_URI=your_mongodb_connection_string
DATABASE_NAME=saanidhya

# Application
FRONTEND_URL=http://localhost:5173
```

Replace the placeholder values with your actual credentials.

### 5. Run the FastAPI server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at:

**http://localhost:8000**

### API Documentation

FastAPI automatically generates interactive API documentation.

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 🔌 API Endpoints

The complete route inventory, section purposes, authentication requirements,
and current limitations are documented in
[server/ROUTES.md](<server/ROUTES.md>).

### Public routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Backend health information and documentation links |
| GET | `/health` | Lightweight health check |
| POST | `/api/auth/register` | Register an elderly or family account |
| POST | `/api/auth/login` | Authenticate and receive a JWT |

### Authenticated route groups

| Group | Prefix | Serves |
|---|---|---|
| Authentication | `/api/auth` | Current profile and logout |
| Check-ins | `/api/checkin` | Daily conversations, sessions, summaries, and history |
| Voice | `/api/voice` | Prisma transcription, Evon responses, and Timbre synthesis |
| Memory | `/api/memory` | Private memory review, consent, editing, and deletion |
| Family | `/api/family` | Caregiver dashboard, alerts, and reminders |
| Notifications | `/api/notifications` | Family in-app notification feed and read state |
| Alerts | `/api/alerts` | Relationship-scoped alert viewing and lifecycle |
| Reminders | `/api/reminders` | User-owned routine, medication, event, and follow-up reminders |
| Check-in schedules | `/api/schedules/checkins` | Recurring scheduled check-in configuration and history |

All authenticated routes require `Authorization: Bearer <JWT>`. FastAPI's
interactive documentation is available at `http://localhost:8000/docs`.

Memory persistence is opt-in. New accounts start with memory disabled, and
disabling it deletes stored memories. Memory extraction stores only explicit
user statements from completed check-ins; raw audio is not stored as memory.

---

## 🧠 Gnani AI Integration

Saanidhya AI integrates Gnani AI's models to create a conversational voice experience.

### Prisma – Speech-to-Text
Converts voice recordings into text while handling natural speech and regional language interactions.

### Evon – Reasoning
Processes conversations, extracts relevant information, and generates contextual responses.

### Timbre – Text-to-Speech
Converts generated responses into natural-sounding speech for elderly users.

Refer to the official Gnani AI developer documentation for API endpoints, authentication, request formats, and model configurations.

---

## 🔄 Running the Complete Application

You need two separate terminals.

**Terminal 1 – Frontend**

```bash
cd client
npm install
npm run dev
```

**Terminal 2 – Backend**

```bash
cd server
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

For Linux/macOS, activate the virtual environment using:

```bash
source venv/bin/activate
```

Once both servers are running:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| API Documentation | http://localhost:8000/docs |

---

## 🔐 Security Notes

- Never commit `.env` files.
- Never expose Gnani AI API keys in frontend code.
- Configure CORS to allow only trusted frontend origins in production.
- Use appropriate authentication and authorization for family access.
- Obtain consent before storing voice recordings or conversation history.
- Treat wellness alerts as indicators, not medical diagnoses.
- Family relationship changes, notification reads, and alert actions are
  reauthorized against current relationship permissions and elderly consent.
- Check-in alerts use centralized active-alert and per-recipient notification
  deduplication; resolving an alert permits a later independent event.

---

## ⚠️ Current Limitations

- Official Gnani API contracts are not present, so Prisma, Evon, and Timbre
  adapters currently return explicit `503` integration-unavailable responses.
- Family dashboard access requires an accepted relationship, elderly sharing
  consent, and the relevant relationship permission.
- Reminder and occurrence state is persisted in MongoDB; production deployments
  should still use a worker process or distributed scheduler for high availability.
- Live dashboard and history workflows no longer return fabricated sample records.
- External notification delivery channels such as SMS, WhatsApp, email, and
  push notifications are not configured.
- Invitation tokens are shown only at creation time and must be transferred
  to the invited family member through a trusted channel.
- The scheduler creates in-app notifications only; it cannot place calls or
  start microphone recording without user interaction and browser permission.

See [server/ROUTES.md](<server/ROUTES.md>) for route-level details.

## 🌱 Future Enhancements

- Emergency contact escalation.
- Advanced long-term conversational memory and consolidation.
- Mood and wellness trends.
- Voice-based reading of messages and documents.
- Additional regional language and dialect support.
- Scheduled voice check-ins.

---

## 💙 Project Vision

Saanidhya AI aims to bridge the distance between elderly parents and their loved ones through accessible, natural, and meaningful voice interactions.

**Because being cared for should never depend on how close someone lives.**

---

### Built for Gnani AI's Great Indian AI Internship Challenge

**Project:** Saanidhya AI  
**Category:** Open Innovation  
**Focus:** Voice AI | Elderly Care | Indian Languages | Conversational AI