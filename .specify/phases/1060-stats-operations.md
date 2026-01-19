---
phase: 1060
name: stats-operations
status: not_started
created: 2026-01-14
updated: 2026-01-18
pdr: workflow-dashboard-orchestration.md
---

> **Architecture Context**: See [PDR: Workflow Dashboard Orchestration](../../memory/pdrs/workflow-dashboard-orchestration.md) for holistic architecture, design decisions, and how this phase fits into the larger vision.

### 1060 - Stats & Operations

**Goal**: Operational visibility with stats, queue view, and basic cost visualization.

**Context**: Users need to see costs, runtime, and status across all projects at a glance. This phase adds stats to project cards and a dedicated operations page.

---

**Scope:**

### 1. Stats on Project List Cards

Each project card displays:
- **Last workflow status** (icon: spinner/check/x/warning)
- **Last run time** (e.g., "2h ago", "yesterday")
- **Total cost** (cumulative across all sessions, e.g., "$1.23")
- **Active indicator** (green dot if workflow currently running)

### 2. Project Detail Stats Section

New section in project detail showing:
- **Session history list** (last 10-20 sessions)
- **Per-session breakdown**:
  - Skill executed
  - Duration
  - Cost (input/output tokens → dollars)
  - Status (completed/failed/cancelled)
- **Total tokens used** (aggregate)
- **Total runtime** (aggregate)
- **Basic line chart**: Cost over time (last 30 days or last N sessions)

### 3. Operations Page (`/operations`)

New top-level page showing cross-project view:
- **Active workflows** across all projects
- **Pending questions** across all projects (with quick-answer links)
- **Recent completions/failures** (last 24h)
- **Aggregate cost** across all projects

### 4. Basic Cost Chart Component

Simple visualization (not full analytics - that's 1070):
- Line chart using lightweight library (recharts recommended)
- X-axis: time or session number
- Y-axis: cumulative cost
- Hover tooltip: session details (skill, duration, cost)
- One chart per project (in detail view)

---

**Technical Notes:**

Cost calculation:
- Track `total_cost_usd` from Claude CLI output (already captured in POC)
- Store in workflow execution record
- Aggregate across all executions for a project

Session history:
- Query `~/.specflow/workflows/*.json` for all executions
- Filter by projectId
- Sort by startedAt descending

---

**UI Components:**
- `ProjectCardStats.tsx` - Stats overlay for project cards
- `SessionHistoryList.tsx` - List of past sessions
- `CostChart.tsx` - Simple line chart component
- `OperationsPage.tsx` - `/app/operations/page.tsx`
- `ActiveWorkflowsList.tsx` - Cross-project active workflows
- `PendingQuestionsList.tsx` - Cross-project pending questions

**API Routes:**
- GET `/api/stats/project/:id` - Stats for single project
- GET `/api/stats/aggregate` - Cross-project stats

**What Was Removed (from original 1060):**
- CPU/memory resource monitor - Complex, low value for MVP

**What Was Added:**
- Basic cost chart (from user request)
- Per-session cost breakdown
- Total runtime tracking

**Deferred to 1070+ (Cost Analytics):**
- Cost projections and burn rate
- Advanced trend analysis
- CSV/JSON export
- Multi-project comparison charts

**Dependencies:**
- All previous phases (aggregates data from workflows)

**Verification Gate: USER**
- [ ] See cost and status on project list cards
- [ ] See session history in project detail
- [ ] See basic cost chart in project detail
- [ ] Operations page shows all active workflows
- [ ] Quick access to pending questions across projects

**Estimated Complexity**: Medium
