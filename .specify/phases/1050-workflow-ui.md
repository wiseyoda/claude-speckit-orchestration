---
phase: 1050
name: workflow-ui
status: not_started
created: 2026-01-17
updated: 2026-01-18
pdr: workflow-dashboard-orchestration.md
---

> **Architecture Context**: See [PDR: Workflow Dashboard Orchestration](../../memory/pdrs/workflow-dashboard-orchestration.md) for holistic architecture, design decisions, and how this phase fits into the larger vision.

### 1050 - Workflow UI Integration

**Goal**: Surface workflow execution in the main dashboard UI.

**Context**: With the foundation in place (1048), this phase adds UI components to start and monitor workflows from the dashboard.

**Scope:**

1. **Start Workflow Entry Points**
   - "Start Workflow" in project card actions dropdown
   - "Start Workflow" button in project detail header
   - Both locations (per user preference)

2. **Skill Picker**
   - Dropdown component with available skills:
     - /flow.design
     - /flow.analyze
     - /flow.implement
     - /flow.verify
     - /flow.orchestrate
     - /flow.merge
   - Optional: skill description on hover

3. **Status Indicators on Project Cards**
   - Running: spinner icon
   - Waiting for input: yellow badge with "?"
   - Completed: green check (fades after 30s)
   - Failed: red x icon

4. **Project Detail Sidebar**
   - Current workflow status
   - Skill being executed
   - Time elapsed
   - Quick link to answer questions (if waiting)

**UI Components:**
- `WorkflowSkillPicker.tsx` - Dropdown to select skill
- `StartWorkflowDialog.tsx` - Confirmation dialog before starting
- `WorkflowStatusBadge.tsx` - Status indicator for cards
- Integration with existing ProjectCard actions
- Integration with ProjectDetail header

**What Was Removed (from original 1050):**
- Stream-json mode - Polling works fine
- SSE streaming - Can add later if needed
- SQLite storage - Files work fine
- Complex multi-project queue management - Simplified

**Dependencies:**
- Phase 1048 (API routes)

**Verification Gate: USER**
- [ ] Start workflow from project card actions menu
- [ ] Start workflow from project detail header
- [ ] See skill picker with all /flow.* options
- [ ] See status badge update as workflow progresses

**Estimated Complexity**: Medium
