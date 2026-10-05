# STRANDED
### An Adaptive AI-Driven Survival & Strategic Planning Simulation

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![React Flow](https://img.shields.io/badge/React_Flow-12+-FF0072?style=flat)](https://reactflow.dev)

STRANDED is a web-based artificial intelligence survival strategy game. The player is marooned on an uncharted island and must navigate hazards, scavenge resources, fortify shelters, construct a seaworthy catamaran, and launch an escape.

Behind the conceptual simplicity lies an academic AI implementation demonstrating real algorithms working together inside one coherent architecture:
- **Search & Optimization:** Breadth-First Search (BFS), Depth-First Search (DFS), Iterative Deepening (IDS), Uniform Cost Search (UCS), Greedy Best-First Search, A* Search ($f(n) = g(n) + h(n)$), and Hill Climbing local search.
- **Adversarial Game Trees:** Minimax and Alpha-Beta Pruning in Rival Survivor Mode.
- **Propositional Reasoning:** Forward Chaining rule propagation and Backward Chaining goal decomposition.
- **Uncertainty & Probability:** Bayesian belief updating ($P(H \mid E) = \frac{P(E \mid H) P(H)}{P(E)}$) for storm forecasting and shipwreck salvage.
- **Strategic Planning & Replanning:** Autonomous multi-step trajectory generator that diagnoses precondition failures and replans on the fly.
- **Behavioral Profiling & Adaptive Difficulty:** Dynamic 4-vector difficulty modulation based on player playstyle (Explorer, Risk Taker, Conservative, Balanced).
- **AI Survival Advisor:** 3 free hints with turn cooldowns, positive supporting rationales, and negative risk trade-offs.

---

## Architecture Overview

```text
                         STRANDED
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
       FRONTEND          BACKEND            DATABASE
          │                 │                  │
    React/TS/Tailwind    FastAPI            SQLite / Postgres
          │                 │
          │          ┌──────┴─────────┐
          │          │                │
          │      GAME ENGINE       AI ENGINE
          │          │                │
          │          │       ┌────────┼────────────┐
          │          │       │        │            │
          │          │    SEARCH   REASONING   PLANNING
          │          │
          │          └──────────────┐
          │                         │
          └──────── REST API ───────┘
```

The backend is authoritative: it validates actions, computes transitions, updates belief models, executes search, and evaluates hint availability. The frontend renders the HUD, visualizes state graphs in React Flow, and plots telemetry in Recharts.

---

## Directory Structure

```text
stranded-game/
├── AGENTS.md                  # Complete academic specification & single source of truth
├── render.yaml                # Render deployment blueprint for FastAPI backend
├── vercel.json                # Vercel configuration for React SPA frontend
├── .env.example               # Root environment variable template
├── backend/
│   ├── .env.example           # Backend environment configuration
│   ├── requirements.txt       # Python dependencies
│   ├── app/
│   │   ├── main.py            # FastAPI entry point, CORS, routers, lifespan
│   │   ├── core/              # Settings & static JSON configuration loader
│   │   ├── config/            # actions.json, events.json, resources.json, etc.
│   │   ├── database/          # SQLAlchemy session, ORM models, repository
│   │   ├── game/              # State, actions, transitions, adaptive events, engine
│   │   ├── algorithms/        # BFS, DFS, IDS, UCS, Best-First, A*, Hill Climbing, Minimax, Alpha-Beta
│   │   ├── reasoning/         # Propositional facts, rules, forward & backward chaining
│   │   ├── probability/       # Bayesian belief networks
│   │   ├── planning/          # Multi-step strategic escape planner & replanner
│   │   ├── adaptation/        # Player behavioral profiler & adaptive difficulty
│   │   ├── advisor/           # AI Survival Assistant & transparent explanation engine
│   │   ├── schemas/           # Pydantic request/response models
│   │   └── api/               # API routers (/api/game, /api/ai, /api/analytics, /api/knowledge)
│   └── tests/                 # Unit & integration tests for game, search, and API
└── frontend/
    ├── .env.example           # Frontend environment configuration (VITE_API_URL)
    ├── package.json           # Dependencies (React, TypeScript, Tailwind, React Flow, Recharts)
    ├── vite.config.ts         # Vite bundler configuration with Tailwind CSS v4
    └── src/
        ├── App.tsx            # Main application coordinator
        ├── components/
        │   ├── common/        # Glassmorphic NavigationHeader
        │   ├── game/          # ResourceBar, SituationCard, ActionGrid, HintPanel
        │   ├── ai/            # AILabView (React Flow), AlgorithmComparisonView
        │   ├── planning/      # PlanningView with crisis simulation & replanning
        │   ├── knowledge/     # KnowledgeView (Forward & Backward Chaining)
        │   ├── probability/   # ProbabilityView (Interactive Bayesian belief updates)
        │   ├── rival/         # RivalModeView (Minimax & Alpha-Beta duel)
        │   ├── analytics/     # AnalyticsView (Recharts timelines & behavioral radar)
        │   └── help/          # HelpView & course manual
        ├── services/          # Typed API client
        └── types/             # Canonical TypeScript interfaces
```

---

## Local Development Setup

### 1. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verify backend health:
```bash
curl http://localhost:8000/health
# {"status":"healthy","database":"connected"}
```

Run test suite:
```bash
PYTHONPATH=. pytest tests/ -v
# 18 passed
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Production Deployment

### Backend (Render)
1. Push this repository to GitHub.
2. In Render, select **New Blueprint Instance** and link your repository (or deploy as a Web Service using `render.yaml`).
3. Set environment variables:
   - `ENVIRONMENT=production`
   - `DEBUG=false`
   - `DATABASE_URL=sqlite:///./stranded.db` (or a managed PostgreSQL connection string)
   - `CORS_ORIGINS=https://your-frontend-domain.vercel.app`
4. Render will run `pip install -r requirements.txt` and start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

### Frontend (Vercel)
1. Import repository in Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Vite**.
4. Configure Environment Variable:
   - `VITE_API_URL=https://your-backend-service.onrender.com`
5. Deploy. `vercel.json` ensures client-side routing rewrites all routes to `/index.html`.
