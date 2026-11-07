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
│   │   │   ├── voice.py
│   │   │   ├── checkin.py
│   │   │   └── family.py
│   │   ├── services/
│   │   │   ├── gnani_service.py
│   │   │   └── memory_service.py
│   │   ├── models/
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

The initial backend scaffold provides:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Backend health information |
| GET | `/health` | Health check |

Planned application endpoints:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/voice/transcribe` | Transcribe voice using Prisma |
| POST | `/checkin/analyze` | Analyze check-in using Evon |
| POST | `/voice/respond` | Generate speech using Timbre |
| GET | `/family/summary` | Retrieve family updates |
| GET | `/checkin/history` | Retrieve previous check-ins |

*Note: Planned endpoints will become available as their implementations are added.*

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

---

## 🌱 Future Enhancements

- Emergency contact escalation.
- Long-term conversational memory.
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