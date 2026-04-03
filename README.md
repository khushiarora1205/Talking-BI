# Talking BI

An intelligent business intelligence platform that combines AI-powered agents with natural language interfaces to provide seamless data exploration, visualization, and insights.

## Features

- **Voice Interface**: Convert speech to text (STT) and text to speech (TTS) for hands-free interaction
- **Multi-Agent System**: Specialized agents for different tasks:
  - Data Agent: Data exploration and retrieval
  - SQL Agent: SQL query generation and execution
  - RAG Agent: Retrieval-Augmented Generation for context-aware responses
  - Schema Agent: Database schema understanding and analysis
  - Insight Agent: Automated insights and pattern detection
  - Visualization Agent: Dynamic chart and dashboard generation
  - Voice Agent: Voice interaction orchestration
- **Vector Database**: Chromadb integration for semantic search and embedding storage
- **Real-time Updates**: Live data processing with WebSocket support
- **Modern UI**: React-based frontend with interactive visualizations

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: Supabase, SQLite, Chromadb
- **LLM Integration**: LangChain for agent orchestration
- **APIs**: REST with async support
- **Voice**: STT/TTS integration

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: CSS with modern design patterns
- **Package Manager**: npm

## Prerequisites

- Python 3.9+
- Node.js 16+
- npm or yarn
- Supabase account (optional, for production database)

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Start the development server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the URL shown in your terminal)

## Project Structure

```
talking-bi/
├── backend/
│   ├── agents/              # AI agents for different tasks
│   │   ├── data_agent.py
│   │   ├── insight_agent.py
│   │   ├── rag_agent.py
│   │   ├── schema_agent.py
│   │   ├── sql_agent.py
│   │   ├── viz_agent.py
│   │   └── voice_agent.py
│   ├── db/                  # Database utilities
│   │   ├── cache.py
│   │   └── supabase.py
│   ├── orchestrator/        # Multi-agent orchestration
│   │   ├── graph.py
│   │   └── state.py
│   ├── rag/                 # RAG implementation
│   │   ├── chroma.py
│   │   └── embedder.py
│   ├── sql/                 # SQL utilities
│   │   ├── explorer.py
│   │   └── validator.py
│   ├── viz/                 # Visualization
│   │   ├── spec_builder.py
│   │   └── themes.py
│   ├── voice/               # Voice capabilities
│   │   ├── stt.py
│   │   └── tts.py
│   ├── chroma_db/           # Vector database storage
│   ├── auth.py              # Authentication
│   ├── config.py            # Configuration
│   └── main.py              # Application entry point
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── ...
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## API Endpoints

The backend provides RESTful API endpoints for:

- **Data Operations**: Query and explore data
- **SQL Queries**: Execute and validate SQL queries
- **Visualizations**: Generate chart specifications
- **Insights**: Get automated insights and analytics
- **Voice**: Handle speech-to-text and text-to-speech

See API documentation at `http://localhost:8000/docs` for detailed endpoint information.

## Configuration

Create a `.env` file in the backend directory with the following variables:

```
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# LLM Configuration
OPENAI_API_KEY=your_openai_key
LLM_MODEL=gpt-4

# Voice
VOICE_API_KEY=your_voice_api_key

# App Settings
DEBUG=True
PORT=8000
```

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

### Code Quality

```bash
# Backend linting
cd backend
pylint agents/ db/ rag/ sql/ voice/

# Frontend linting
cd frontend
npm run lint
```

### Building for Production

```bash
# Backend
cd backend
# Use gunicorn or similar for production

# Frontend
cd frontend
npm run build
# Output in dist/ directory
```

## Usage Example

### Starting a Conversation

1. Open the web interface at `http://localhost:5173`
2. Ask a question in natural language
3. The system will:
   - Process your query through the appropriate agents
   - Generate SQL queries if needed
   - Retrieve relevant context from the vector database
   - Create visualizations
   - Provide voice responses (if enabled)

### Voice Interaction

- Click the microphone icon to speak
- Wait for processing
- Receive audio response

## Architecture

The system uses a multi-agent architecture orchestrated through a state machine:

1. **Input Processing**: Voice or text input
2. **Agent Selection**: Route to appropriate agent based on query
3. **Execution**: Agent processes the request
4. **Context Retrieval**: Query vector database for relevant context
5. **Response Generation**: Format and deliver response
6. **Output Delivery**: Voice, text, or visualization
