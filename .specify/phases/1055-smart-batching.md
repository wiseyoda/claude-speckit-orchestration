---
phase: 1055
name: smart-batching-orchestration
status: not_started
created: 2026-01-18
pdr: workflow-dashboard-orchestration.md
---

> **Architecture Context**: See [PDR: Workflow Dashboard Orchestration](../../memory/pdrs/workflow-dashboard-orchestration.md) for holistic architecture, design decisions, and how this phase fits into the larger vision.

### 1055 - Smart Batching & Orchestration

**Goal**: Autonomous implement execution with smart batching and auto-healing.

**Context**: Large task lists (50+) exceed context windows. This phase adds intelligent batching using existing tasks.md sections, a state machine for orchestration, and auto-healing when batches fail.

**Key Principles:**
- **Programmatic batching** - No UI for selecting tasks, fully automatic
- **Minimal user interaction** - User only intervenes for questions and true blockers
- **Auto-healing** - Spawn fixer Claude on failure, retry once before stopping

---

**Scope:**

### 1. Programmatic Batch Detection

Parse existing task sections from tasks.md:
- Use markdown headers (`## Section Name`) as batch boundaries
- Each `##` section becomes one batch
- Fall back to fixed-size batches (~15 tasks) if no sections
- Respect task dependencies within sections

Example tasks.md structure recognized:
```markdown
## Progress Dashboard
Total: 0/25 | Blocked: 0

## Setup
- [ ] T001 Create project structure
- [ ] T002 Configure build system

## Core Components
- [ ] T003 Implement base service
- [ ] T004 Add API routes

## Integration
- [ ] T005 Wire up endpoints
```

### 2. Dashboard Orchestration State Machine

```
[Start] → Check Status → Design needed? → /flow.design
                      → Tasks incomplete? → /flow.implement (batch N)
                      → All tasks done? → /flow.verify
                      → Verified? → /flow.merge (approval required)
                      → [Complete]
```

- Between each step: `specflow status --json` to determine next action
- State persisted in workflow execution record
- Transitions based on simple rules:
  - `hasSpecs: false` → run design
  - `tasksComplete < tasksTotal` → run implement (next batch)
  - `tasksComplete == tasksTotal` → run verify
  - `verificationComplete: true` → offer merge
- Fallback: Spawn Claude to analyze when state unclear

### 3. Sequential Batch Execution

- Run each task section as a separate /flow.implement invocation
- Modified prompt tells Claude which tasks to work on:
  ```
  Execute the following tasks from the "Core Components" section:
  T003, T004, T005

  Do NOT work on tasks from other sections.
  ```
- Wait for completion before starting next batch
- Track: current batch index, batch status, tasks completed per batch

### 4. Auto-Healing on Failure

When a batch fails:

1. **Capture error details**:
   - stderr output
   - Session transcript (last N messages)
   - Tasks attempted vs completed
   - Specific error messages

2. **Spawn healer Claude**:
   ```
   The following implement batch failed:
   - Batch: "## Core Components"
   - Error: [error details]
   - Tasks attempted: T005-T012
   - Tasks completed: T005-T008
   - Tasks failed: T009 (file not found)

   Analyze the failure and fix the issue, then continue
   with remaining tasks in this batch.
   ```

3. **Healer outcome**:
   - If healer succeeds → mark batch complete, continue to next batch
   - If healer fails → stop execution, notify user with full context
   - Only one heal attempt per batch (prevent infinite loops)

### 5. Orchestration Progress Display

UI components showing:
- Current phase indicator: `Design → Implement → Verify → Merge`
- Current batch: "Implementing batch 2 of 4: Core Components"
- Tasks completed: "12/35 tasks complete"
- Healing status: "Auto-healing batch 2..." (when active)
- Time elapsed per batch

---

**Deliverables:**
- Batch parser in `workflow-service.ts` (uses existing tasks.ts)
- `OrchestrationStateMachine.ts` - State machine logic
- `AutoHealingService.ts` - Failure detection and healing prompts
- `OrchestrationProgress.tsx` - Progress display component
- API route: POST `/api/workflow/orchestrate` - Start full orchestration
- Tests for batch parsing and state machine transitions

**Dependencies:**
- Phase 1050 (workflow execution infrastructure)
- Can run in parallel with 1051 (Questions)

**Verification Gate: USER**
- [ ] Start orchestrate, see batches auto-detected from tasks.md sections
- [ ] Batches execute sequentially without user input
- [ ] Introduce a failure (e.g., missing file), see auto-heal attempt
- [ ] If heal succeeds, execution continues
- [ ] Progress shows batch status clearly
- [ ] State machine transitions correctly (design→implement→verify)

**Estimated Complexity**: High
