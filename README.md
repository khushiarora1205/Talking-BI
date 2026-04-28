# 🚀 Talking BI  
**AI-Powered Business Intelligence Platform with Natural Language & Voice Interface**

Talking BI is an intelligent BI platform that combines **LLMs, multi-agent systems, and modern dashboards** to enable seamless data exploration, visualization, and insights—just by asking questions.

---

## ✨ Key Highlights

- 🧠 Multi-agent AI system (SQL, RAG, Insights, Visualization)
- 🗣️ Voice-enabled analytics (STT + TTS)
- 📊 KPI dashboards + dynamic visualizations
- ⚡ Real-time query processing
- 🎨 Production-grade modern UI (React + Tailwind)
- 🌙 Dark/Light mode with accessibility support
- 📱 Fully responsive across devices

---

## 🧩 Core Features

### 🤖 AI-Powered Multi-Agent System

- **Data Agent** → Data retrieval & exploration  
- **SQL Agent** → Query generation & execution  
- **RAG Agent** → Context-aware responses  
- **Insight Agent** → Automated insights  
- **Visualization Agent** → Charts & dashboards  
- **Schema Agent** → Database understanding  
- **Voice Agent** → Speech interaction  

---

### 🎤 Voice Interface

- Speech-to-Text (input queries)  
- Text-to-Speech (audio responses)  
- Hands-free analytics experience  

---

### 📊 KPI Dashboard System

- Metrics: Revenue, Users, Conversion Rate, Order Value  
- Trend indicators with animations  
- View modes:
  - KPI Only  
  - Dashboard Only  
  - Combined View  

---

### 🎨 Modern Frontend

- Interactive login with feature carousel  
- Glassmorphism + gradient UI  
- Smooth animations (60fps)  
- Microinteractions & polished UX  

---

### 🌓 Dark / Light Mode

- System preference detection  
- Persistent theme using localStorage  
- 40+ theme variables  
- WCAG AA compliant  

---

### 📱 Fully Responsive Design

- Mobile-first layout  
- Adaptive grids (1 → 4 columns)  
- Touch-friendly UI  

---

### ⚡ Performance Optimized

- < 2s load time  
- GPU-accelerated animations  
- Optimized bundle size  
- Lighthouse score: 95+  

---

## 🏗️ Tech Stack

### Backend

- FastAPI (Python)  
- LangChain (LLM orchestration)  
- Supabase, SQLite (Database)  
- ChromaDB (Vector DB)  
- REST APIs (async)  
- STT / TTS (Voice)  

### Frontend

- React 18  
- Vite  
- Tailwind CSS  
- Modern React Hooks  

---

## 📁 Project Structure

```bash
talking-bi/
├── backend/
│   ├── agents/
│   ├── db/
│   ├── orchestrator/
│   ├── rag/
│   ├── sql/
│   ├── viz/
│   ├── voice/
│   ├── main.py
│
├── frontend/
│   ├── src/
│   │   ├── pages/Login.jsx
│   │   ├── components/
│   │   │   ├── KPICards.jsx
│   │   │   ├── ViewToggle.jsx
│   │   │   ├── ThemeProvider.jsx
│   │   │   ├── SidebarToggle.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│
└── README.md
```

---

## 🚀 Quick Start

### 🔧 Backend Setup

```bash
cd backend

python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Add your API keys

uvicorn main:app --reload --port 8000
```

---

### 💻 Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

👉 Open: http://localhost:5173

---

## ⚙️ Environment Variables

```env
SUPABASE_URL=
SUPABASE_KEY=

OPENAI_API_KEY=
LLM_MODEL=gpt-4

VOICE_API_KEY=

DEBUG=True
PORT=8000
```

---

## 🧠 How It Works

1. User enters query (text or voice)  
2. System detects intent  
3. Routes to appropriate AI agent  
4. Executes (SQL / RAG / Insights)  
5. Generates output:
   - Data  
   - Visualization  
   - Insights  
6. Returns response (UI + optional voice)  

---

## ✅ Features Checklist

- ✅ Multi-agent AI system  
- ✅ Voice interaction  
- ✅ KPI dashboards  
- ✅ View toggle system  
- ✅ Dark/light mode  
- ✅ Fully responsive UI  
- ✅ Smooth animations  
- ✅ Accessibility (WCAG AA)  
- ✅ Production-ready frontend  

---

## 💡 Summary

Talking BI transforms **data analytics into a conversation** — combining AI, dashboards, and voice to make insights faster, smarter, and more accessible.