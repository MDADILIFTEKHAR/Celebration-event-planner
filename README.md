# Celebration Event Planner AI 🎈

> **An intelligent, context-aware celebration orchestrator and budget assistant built for the AI Code Submission Challenge.**  
> Transforms event ideas into actionable, budget-conscious, chronologically validated plans that dynamically adapt to real-time changes without losing host preferences.

---

## 1. Project Summary

**Celebration Event Planner AI** is a production-quality full-stack application that solves the complexity of celebration and party planning. Rather than a static checklist or generic chatbot, it implements a **dual-mode intelligent architecture**:
1. **Deterministic Local Planning Engine**: Provides instant, mathematically sound budget allocations, chronological scheduling, and context-tailored recommendations without requiring any API keys or paid external services.
2. **Optional LLM Integration**: Secure server-side enhancement via Google Gemini or OpenAI with graceful fallback to local intelligence if keys are unavailable or network requests fail.

---

## 2. Problem Statement

Planning celebrations (birthdays, weddings, anniversaries, graduations, baby showers, dinner parties) involves interdependent variables:
- Limited and volatile budgets.
- Shifting guest counts and unpredictable RSVPs.
- Stringent dietary constraints and accessibility requirements.
- Venue logistics, setup buffers, and weather risks.
- Complex schedule coordination between hosts and vendors.

Generic checklists do not understand context, and standard chatbots frequently hallucinate costs or overwrite earlier planning decisions when a single parameter changes. **Celebration Event Planner AI** bridges this gap with deterministic constraints, transparent budget models, and an intelligent change-adaptation engine.

---

## 3. Chosen Challenge Vertical

- **Vertical**: Celebration Event Planner
- **Target Persona**: Individuals, families, and community hosts planning special occasions who:
  - Operate with tight or fixed budgets and need transparent expense prioritization.
  - Lack professional event-planning experience and require structured guidance.
  - Must accommodate dietary, accessibility, child safety, or weather contingencies.
  - Frequently experience requirement changes (e.g., budget cuts, headcount shifts) and need an engine that recalculates affected areas while preserving their decisions.

---

## 4. Key Features

- **Intelligent Planning Wizard**: Step-by-step or demo-assisted onboarding collecting celebration type, date, time, duration, location, guests, budget, currency, venue setting, atmosphere, dietary constraints, accessibility needs, and DIY preferences.
- **Context-Aware Decision Engine**: Identifies mandatory constraints vs optional enhancements, evaluates budget realism against per-guest benchmarks, and offers strategic alternatives.
- **Dynamic Budget Planner**:
  - Live calculations of Total Budget, Allocated Expenses, Remaining Funds, Utilization %, and Configurable Contingency Reserve.
  - Visual charts (Category Donut Breakdown & Category Comparison Bar Chart via Recharts).
  - Itemized cost table with inline editing, custom items, and **Mandatory Lock Toggles**.
  - **Safe Reallocation**: Scales optional expenses down proportionally when budgets decrease while strictly protecting locked mandatory items.
  - Automatic Overrun Detection with proactive rebalance alerts.
- **Chronological Timeline Generator**:
  - Generates run-of-show milestones with prep buffers (-90m setup, arrival, welcome, dining, cake cutting, entertainment, cleanup).
  - Validates chronological sequencing and flags overlapping milestones.
- **Guest & Attendance Management**:
  - Tracks RSVPs (Attending, Tentative, Declined, Invited) and +1 companions.
  - Real-time **Expected Attendance Calculator** (Confirmed + 50% weighted tentative).
  - Dynamic **Catering & Seating Guidance** calculating table counts (8 guests/table) and dietary portions.
- **Dynamic Change Handler (Conversational Adaptation)**:
  - Natural language adaptation ("My budget has decreased by 20%", "Increase guest count from 30 to 50", "Move indoors", "Make it suitable for children", "I need vegetarian food", "Remove photography and add more entertainment").
  - Clear **"What Changed & Why"** explanation diff banner.
- **Actionable Planning Checklist**:
  - Task prioritization (High, Medium, Low) mapped to celebration date countdowns.
  - Interactive progress tracking, status toggling, and custom task creation.
- **Clean Plan Export**:
  - Print/PDF-ready styling (`@media print`) generating an executive summary document.
  - Downloadable JSON export and instant JSON import to restore saved celebration plans.

---

## 5. System Architecture

```
                               ┌────────────────────────────────────────┐
                               │           Web Client (Browser)          │
                               │   React 19 + TypeScript + Vite + CSS   │
                               └───────────────────┬────────────────────┘
                                                   │ HTTP / REST
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FastAPI Backend Server                                         │
│                                                                                                  │
│  ┌───────────────────────────────┐                  ┌─────────────────────────────────────────┐  │
│  │         API Routers           │                  │         Planning Core Engine            │  │
│  │  - /api/events                │                  │  - Rules & Benchmark Analyzer           │  │
│  │  - /api/planner (Adjust/Diff) │ ◄──────────────► │  - Budget Allocator (Preserve Lock)     │  │
│  │  - /api/events/.../budget     │                  │  - Chronological Timeline Generator     │  │
│  │  - /api/events/.../timeline   │                  │  - Actionable Checklist Generator       │  │
│  │  - /api/events/.../guests     │                  │  - Recommendation Engine                │  │
│  │  - /api/events/.../export     │                  │  - Dynamic Change & Diff Handler        │  │
│  └──────────────┬────────────────┘                  └────────────────────┬────────────────────┘  │
│                 │                                                        │                       │
│                 ▼                                                        ▼                       │
│  ┌───────────────────────────────┐                  ┌─────────────────────────────────────────┐  │
│  │    SQLite Persistence Layer   │                  │     Optional Server-Side LLM Gateway    │  │
│  │   (Lightweight, zero-config)  │                  │  - Gemini / OpenAI (Environment vars)   │  │
│  │  celebration_planner.db       │                  │  - Deterministic Fallback on failure    │  │
│  └───────────────────────────────┘                  └─────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Technology Stack

### Frontend
- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Vanilla CSS design system
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Pie/Donut & Bar Charts)
- **Testing**: Vitest, React Testing Library, JSDOM

### Backend
- **Framework**: Python 3.13, FastAPI, Uvicorn
- **Data Validation & Schemas**: Pydantic v2
- **Persistence**: SQLite 3 (native, lightweight, persistent)
- **HTTP Client**: HTTPX (for optional AI endpoints)
- **Testing**: Pytest, Starlette TestClient

---

## 7. Decision-Making & Recommendation Logic

1. **Mandatory Constraint Identification**:
   - Analyzes celebration type, dietary restrictions, accessibility requirements, children attendance, and venue settings.
   - Converts requirements into explicit non-negotiable safeguards (e.g., cross-contamination prevention for gluten-free guests, 36-inch pathways for wheelchair access, weather canopy for outdoor venues).
2. **Realism & Feasibility Checks**:
   - Calculates per-guest budget ($/person). If below celebration benchmarks ($15/guest for birthdays, $25 for anniversaries, $50 for weddings), triggers **Advisory Flags** and suggests concrete alternatives (park pavilion, grazing table, potluck model).
3. **Budget Allocation Methodology**:
   - Standard category weighting adjusted dynamically based on celebration type and preferences.
   - Automatically provisions an 8%–10% **Contingency Reserve**.
   - Transparent cost assumptions attached to every item (e.g., `$35/guest x 35 guests + $150 beverage service`).
4. **Mandatory Lock Preservation Algorithm**:
   - When a budget reduction occurs, locked items retain their full allocation.
   - Non-mandatory items are scaled down proportionally to absorb the adjustment.

---

## 8. AI Integration & Graceful Fallback

The application operates in dual mode:
- **Mode 1 (Deterministic Local Engine - Default)**: Runs 100% locally with zero external network dependencies and no API key required.
- **Mode 2 (Optional LLM Integration)**: If `AI_PROVIDER=gemini` or `AI_PROVIDER=openai` and an API key is set in `.env`, the server attempts creative suggestions.
- **Graceful Fallback**: If an API key is invalid, missing, or rate-limited, the system falls back to local intelligence without crashing, reporting `Local Intelligence Engine (Active)`. Keys are never exposed to the frontend or committed to git.

---

## 9. Installation & Setup

### Prerequisites
- Node.js (v18+ recommended) & npm
- Python (v3.10+ recommended) & pip
- Git

### 1. Clone & Setup Environment
```bash
git clone https://github.com/your-username/celebration-event-planner.git
cd "celebration-event-planner"

# Copy example environment configuration
cp .env.example .env
```

### 2. Backend Setup
```bash
# Install backend dependencies
pip install -r backend/requirements.txt
```

### 3. Frontend Setup
```bash
# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## 10. Development & Run Commands

### Start Backend Server
From the project root:
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API documentation available at: `http://127.0.0.1:8000/docs`

### Start Frontend Dev Server
In a separate terminal:
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
Open application at: `http://127.0.0.1:5173`

---

## 11. Automated Testing

### Run Backend Pytest Suite (25 Tests)
```bash
python -m pytest backend/tests -v
```
Verified test coverage across:
- Budget totals & balance calculations
- Zero, negative, and invalid budget handling
- Budget overrun detection
- Contingency reserve calculations
- Budget reallocation preserving mandatory items
- Guest attendance & table seating calculations
- Timeline ordering and duration clash checks
- Dietary and accessibility constraint enforcement
- Recommendation relevance
- Dynamic plan adaptation without overwriting decisions
- API request validation & error codes
- SQLite persistence lifecycle
- Export and import integrity
- AI provider fallback

### Run Frontend Vitest Suite
```bash
cd frontend
npx vitest run
```

### Build Production Bundle
```bash
cd frontend
npm run build
```

---

## 12. Example User Workflow

1. **Launch App**: Open `http://127.0.0.1:5173/`. The app preloads a curated scenario ("Sarah's 30th Birthday Bash").
2. **Review Recommendations**: Inspect color palettes, grazing table catering strategy, and Polaroid guestbook concepts.
3. **Simulate Budget Change**: In the Assistant panel, click `+ "My budget has decreased by 20%"`.
   - The engine reduces budget from $1,600 to $1,280.
   - It preserves locked items (Venue) and scales optional items (Decor, Favors).
   - The **"What Changed & Why"** banner displays exact adjustments.
4. **Manage Guests**: Switch to **Guests & Seating**. Change an RSVP to "Attending" with +1. Observe table seating recalculate automatically.
5. **Update Checklist**: Switch to **Action Checklist**. Check off completed tasks to advance the readiness bar.
6. **Export**: Click **Print / Export** to view the clean printable summary, copy Markdown, or download the full plan as a JSON file.

---

## 13. Security and Privacy Considerations

- **Server-Side API Protection**: LLM API keys are strictly read server-side from environment variables and never bundled in client assets.
- **Payload & Input Limits**: Middleware enforces a 5MB maximum request payload limit and validates all string inputs with Pydantic.
- **Safe Persistence**: SQLite queries use parameterized SQL to prevent SQL injection.
- **Narrow CORS**: Configured to restrict origin requests to designated frontend hosts.
- **Privacy by Default**: Demonstration records use fictional names; no sensitive personal info is collected.
- **Security Headers**: Includes `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and strict transport settings.

---

## 14. Known Limitations

- **Live Vendor Availability**: The MVP uses realistic pricing benchmarks and structured templates rather than querying real-time live venue booking APIs.
- **Local SQLite Persistence**: Persistence is local to the machine running the backend server.
- **Single-User Workspace**: Designed as an MVP planner for individual and family hosts; multi-tenant enterprise user accounts are out of MVP scope.

---

## 15. Feature to Evaluation Criteria Mapping

| Challenge Evaluation Criterion | Implemented Feature & Evidence |
|:---|:---|
| **Problem Statement Alignment** | Solves real party planning with context-aware decision engine, feasibility flags, budget models, and dynamic change handling. |
| **Code Quality & Architecture** | Strict separation of UI components, Pydantic schemas, planning engine modules, SQLite persistence, and API routers. |
| **Testing Thoroughness** | 25 backend tests (`pytest`) + 4 frontend component tests (`vitest`) with 100% pass rate. |
| **Dual Mode AI Strategy** | 100% functional deterministic engine + optional LLM integration with automatic graceful fallback. |
| **Budget Mathematical Integrity** | Dynamic calculation from real state, overrun warning banners, mandatory lock protection during reallocation. |
| **Schedule Validity** | Timeline generation with wall-clock time mapping, setup buffers, and overlap conflict detection. |
| **Data Portability** | Full JSON download and upload/import capability, plus print-ready document preview. |
| **Accessibility (WCAG 2.2)** | High-contrast text, visible focus rings, keyboard accessible controls, icons alongside text indicators. |

---

## 16. Repository Hygiene & Size Verification

- **Branch**: Single `main` branch.
- **Clean Repository**: `.gitignore` strictly excludes `node_modules/`, `dist/`, `.venv/`, `__pycache__/`, `.pytest_cache/`, and `.db` files.
- **Size Limit**: Total tracked git repository size is strictly under 10 MB.
- **No Secrets**: Contains zero embedded API credentials.

---

## 17. License

Distributed under the [MIT License](LICENSE).
