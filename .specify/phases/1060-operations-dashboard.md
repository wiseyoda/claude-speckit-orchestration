---
phase: 1060
name: operations-dashboard
status: not_started
created: 2026-01-14
---

### 1060 - Operations Dashboard

**Goal**: Full visibility into agent queue, resource usage, and system health.

**Scope**:
- **Queue View**: All pending/running/completed agent sessions
- **Activity Feed**: Real-time stream of agent actions across all sessions
- **Resource Monitor**: CPU/memory for running agents, API rate limits
- Desktop notifications for agent completion/errors
- Filter and search across agent history

**User Stories**:
1. As a developer, I see all queued and running agent sessions at a glance
2. As a developer, I get notified when an agent completes or errors
3. As a developer, I can filter activity feed by project or status
4. As a developer, I see resource usage for running agents

**Deliverables**:
- Operations page `/app/operations/page.tsx`
- Agent queue list component
- Activity feed with real-time updates
- Resource usage indicators
- Desktop notification integration (Notification API)
- Filter/search controls

**Verification Gate**: **USER VERIFICATION REQUIRED**
- Operations view shows all agent sessions with status
- Desktop notification appears when agent completes
- Activity feed updates in real-time
- Resource indicators show CPU/memory usage

**Estimated Complexity**: Medium
