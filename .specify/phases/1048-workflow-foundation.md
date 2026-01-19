---
phase: 1048
name: workflow-foundation
status: not_started
created: 2026-01-17
updated: 2026-01-18
pdr: workflow-dashboard-orchestration.md
---

> **Architecture Context**: See [PDR: Workflow Dashboard Orchestration](../../memory/pdrs/workflow-dashboard-orchestration.md) for holistic architecture, design decisions, and how this phase fits into the larger vision.

### 1048 - Workflow Foundation

**Goal**: Productionize the POC executor and integrate with the project system.

**Context**: The POC at `/debug/workflow` (commit 5dc79dd) proves the core approach works. This phase refactors it into production-grade code.

**Scope:**

1. **Refactor Executor to Service**
   - Move `/lib/workflow-executor.ts` to `/lib/services/workflow-service.ts`
   - Add proper TypeScript types and error handling
   - Keep file-based persistence (proven in POC)
   - Keep polling approach (proven reliable)

2. **Project Integration**
   - Add `projectId` to `WorkflowExecution` interface
   - Link executions to registered dashboard projects
   - Store state in `~/.specflow/workflows/` (not workflow-debug)

3. **Production API Routes**
   - POST `/api/workflow/start` - Start workflow (projectId, skill)
   - GET `/api/workflow/status?id=<id>` - Get execution status
   - GET `/api/workflow/list?projectId=<id>` - List executions for project
   - POST `/api/workflow/answer` - Submit answers and resume
   - POST `/api/workflow/cancel?id=<id>` - Cancel running workflow

4. **Error Handling**
   - Timeout handling (configurable, default 10 minutes)
   - Process cleanup on failure
   - Structured error responses

**Technical Details:**
- Keep exact CLI invocation pattern from POC:
  ```
  claude -p --output-format json \
    --dangerously-skip-permissions \
    --disallowedTools "AskUserQuestion" \
    --json-schema "<schema>" \
    < prompt.txt > output.json
  ```
- Resume pattern: `claude -p --resume "<session_id>" ...`
- State file format: JSON with WorkflowExecution interface

**Deliverables:**
- `packages/dashboard/src/lib/services/workflow-service.ts`
- `packages/dashboard/src/app/api/workflow/start/route.ts`
- `packages/dashboard/src/app/api/workflow/status/route.ts`
- `packages/dashboard/src/app/api/workflow/list/route.ts`
- `packages/dashboard/src/app/api/workflow/answer/route.ts`
- `packages/dashboard/src/app/api/workflow/cancel/route.ts`
- Tests for workflow service

**What Was Removed (from original 1048):**
- CLI commands (`specflow workflow implement --group`) - Dashboard handles this
- Task group format changes to tasks.md - Use existing ## headers
- JSON streaming events - Polling sufficient

**Verification Gate: USER**
- [ ] Start workflow for a registered project via API
- [ ] See execution linked to correct project
- [ ] Cancel running workflow
- [ ] List all executions for a project

**Estimated Complexity**: Medium
