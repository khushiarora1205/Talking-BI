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

- **Python**: 3.9 or higher
- **Node.js**: 16 or higher
- **npm** or **yarn**
- **Git** (for version control)
- **Supabase account** (optional, for production database)

## Quick Start

### Backend Setup

1. Navigate to the backend directory and create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. Start the development server:
```bash
uvicorn main:app --reload --port 8000
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```


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

## Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory with the following configuration:

```env
# ===== Supabase =====
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# ===== LLM Configuration =====
OPENAI_API_KEY=your_openai_api_key
LLM_MODEL=gpt-4

# ===== Voice Services =====
VOICE_API_KEY=your_voice_api_key

# ===== Application Settings =====
DEBUG=True
PORT=8000
LOG_LEVEL=INFO
```

## Usage Example

### Starting a Conversation

1. Open the web interface at `http://localhost:5173`
2. Enter a natural language question
3. The system will:
   - Route your query to the appropriate agent
   - Generate SQL queries if needed
   - Retrieve relevant context from the vector database
   - Create visualizations if applicable
   - Provide voice responses (if enabled)

### Voice Interaction

- Click the **microphone icon** in the UI to activate speech-to-text
- Speak your question clearly
- Wait for processing
- Receive an audio response with results

### Example Queries

- "Show me the top 10 customers by revenue"
- "What are the sales trends for Q1?"
- "Generate a pie chart of product categories"
- "Compare last month's performance with this month"

## Architecture

The system uses a **multi-agent architecture** orchestrated through a state machine for intelligent request routing:

1. **Input Processing**: Accept voice or text input from the user
2. **Query Analysis**: Understand intent and extract parameters
3. **Agent Routing**: Select the appropriate agent(s) based on query type
4. **Execution**: Agent processes the request (SQL generation, data retrieval, etc.)
5. **Context Retrieval**: Query Chromadb vector database for relevant context
6. **Response Generation**: Format results (text, visualization, or data)
7. **Output Delivery**: Return response via voice, text, or interactive UI

### Agent Responsibilities

- **Data Agent**: Explores and retrieves data from various sources
- **SQL Agent**: Generates and executes optimized SQL queries
- **Schema Agent**: Manages database schema understanding and metadata
- **RAG Agent**: Provides context-aware responses using retrieval-augmented generation
- **Insight Agent**: Detects patterns and generates automated business insights
- **Visualization Agent**: Creates dynamic charts and dashboard specifications
- **Voice Agent**: Orchestrates voice interactions (STT/TTS)