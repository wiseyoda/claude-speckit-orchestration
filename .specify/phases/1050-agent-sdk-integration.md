---
phase: 1050
name: agent-sdk-integration
status: not_started
created: 2026-01-14
---

### 1050 - Agent SDK Integration

**Goal**: Spawn Claude Agent SDK sessions from the dashboard for headless task execution.

**Scope**:
- Claude Agent SDK integration for agentic workflows
- Hybrid control: user chooses supervision level per task
  - **Supervised**: Agent proposes, user approves
  - **Autonomous**: Agent executes, user monitors
- Agent spawn with task context injection
- Real-time log streaming via WebSocket
- Agent queue with unlimited concurrent sessions (queue-based)
- Interactive mode: agent can ask questions, user responds via dashboard
- Session management: cancel, pause, resume (if supported)

**User Stories**:
1. As a developer, I click "Implement" on a task and choose supervision level
2. As a developer, I see agent progress in real-time (tool calls, outputs)
3. As a developer, I can answer agent questions from the dashboard
4. As a developer, I can queue multiple tasks for sequential execution
5. As a developer, I can cancel a running agent session

**Deliverables**:
- Agent SDK wrapper service in `packages/dashboard/src/lib/agent.ts`
- Agent spawn API route with context injection
- Real-time log streaming component
- Agent queue manager with SQLite persistence
- Interactive prompt/response UI
- Session controls (cancel, view history)

**Verification Gate**: **USER VERIFICATION REQUIRED**
- Click "Implement" on task, agent starts working
- See real-time tool calls in log viewer
- Answer agent question via dashboard, agent continues
- Queue 3 tasks, they execute in order
- Cancel button stops running agent

**Estimated Complexity**: High
