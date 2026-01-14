---
phase: 1070
name: cost-analytics
status: not_started
created: 2026-01-14
---

### 1070 - Cost Analytics

**Goal**: Track and visualize Claude API costs across sessions and projects.

**Scope**:
- Token usage tracking per agent session
- Cost calculation based on model pricing
- **Per-session costs**: Input/output tokens, total cost
- **Project totals**: Aggregate costs over time
- **Trends/projections**: Cost charts, burn rate
- SQLite storage for historical data
- Export functionality (CSV/JSON)

**User Stories**:
1. As a developer, I see how much each agent session cost
2. As a developer, I see total spending per project this month
3. As a developer, I see cost trends over time
4. As a developer, I can export cost data for expense reports

**Deliverables**:
- Analytics page `/app/analytics/page.tsx`
- Token tracking in agent service
- Cost calculation utilities
- Chart components (line, bar, pie)
- SQLite schema for cost history
- Export API routes

**Verification Gate**: **USER VERIFICATION REQUIRED**
- Session details show token counts and cost
- Project page shows total costs
- Analytics page shows cost trends over time
- Export produces valid CSV/JSON

**Estimated Complexity**: Medium
