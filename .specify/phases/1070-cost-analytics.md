---
phase: 1070
name: cost-analytics
status: not_started
created: 2026-01-14
updated: 2026-01-18
pdr: workflow-dashboard-orchestration.md
---

> **Architecture Context**: See [PDR: Workflow Dashboard Orchestration](../../memory/pdrs/workflow-dashboard-orchestration.md) for holistic architecture, design decisions, and how this phase fits into the larger vision.

### 1070 - Cost Analytics

**Goal**: Advanced cost visualization, projections, and data export for expense tracking.

**Context**: Phase 1060 adds basic cost display (stats on cards, simple line chart). This phase adds advanced analytics features for power users who need to track spending across projects, generate reports, and forecast costs.

---

**Scope:**

### 1. Analytics Page (`/analytics`)

Dedicated analytics page with:
- **Date range selector** (last 7 days, 30 days, 90 days, custom)
- **Project filter** (all projects, specific project)
- **Skill filter** (all skills, specific skill)

### 2. Advanced Charts

Multiple visualization types:
- **Line chart**: Cost over time (daily/weekly/monthly)
- **Bar chart**: Cost by project comparison
- **Stacked bar**: Cost by skill type within project
- **Pie chart**: Cost distribution across projects

Interactive features:
- Hover tooltips with session details
- Click to drill down into project/session
- Zoom and pan on time series

### 3. Projections & Burn Rate

Cost forecasting:
- **Current burn rate**: $ per day/week based on recent history
- **Projection**: Estimated monthly cost at current rate
- **Budget alerts**: Optional threshold with visual warning
- **Trend indicator**: Up/down arrow with percentage change

### 4. Token Breakdown

Detailed token analysis:
- Input vs output token split
- Cost per token type (different pricing)
- Token efficiency metrics (output/input ratio)
- Model breakdown (if multiple models used)

### 5. Export Functionality

Data export options:
- **CSV export**: All sessions with full details
- **JSON export**: Structured data for programmatic use
- **PDF report**: Summary with charts (stretch goal)
- **Date range filter** for exports

### 6. Historical Data Storage

Migrate from file-based to structured storage:
- **SQLite database**: `~/.specflow/analytics.db`
- Schema for sessions, costs, tokens
- Migration utility for existing file-based data
- Retention policy (configurable, default 90 days)

---

**UI Components:**
- `AnalyticsPage.tsx` - `/app/analytics/page.tsx`
- `DateRangePicker.tsx` - Date selection component
- `AdvancedCostChart.tsx` - Multi-chart visualization
- `BurnRateCard.tsx` - Current burn rate display
- `ProjectionCard.tsx` - Forecasting display
- `TokenBreakdown.tsx` - Token analysis component
- `ExportMenu.tsx` - Export options dropdown

**API Routes:**
- GET `/api/analytics/costs?range=<days>&project=<id>` - Cost data with filters
- GET `/api/analytics/projection` - Burn rate and projections
- GET `/api/analytics/tokens?project=<id>` - Token breakdown
- GET `/api/analytics/export?format=<csv|json>&range=<days>` - Export data

**Database Schema:**
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_cost_usd REAL,
  model TEXT
);

CREATE INDEX idx_sessions_project ON sessions(project_id);
CREATE INDEX idx_sessions_started ON sessions(started_at);
```

---

**What's Different from 1060:**
- 1060: Basic stats (cost on cards, simple line chart, session history)
- 1070: Advanced analytics (projections, comparisons, exports, SQLite)

**Dependencies:**
- Phase 1060 (builds on cost tracking infrastructure)

**Verification Gate: USER**
- [ ] Analytics page shows multi-project cost comparison
- [ ] Burn rate and projection displays current spending trend
- [ ] Token breakdown shows input/output split
- [ ] CSV export produces valid, importable file
- [ ] JSON export produces structured data
- [ ] Date range filter works across all views

**Estimated Complexity**: Medium-High
