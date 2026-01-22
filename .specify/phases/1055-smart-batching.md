---
phase: 1055
name: smart-batching-orchestration
status: not_started
created: 2026-01-18
updated: 2026-01-21
pdr: workflow-dashboard-orchestration.md
---

> **Architecture Context**: See [PDR: Workflow Dashboard Orchestration](../../memory/pdrs/workflow-dashboard-orchestration.md) for holistic architecture, design decisions, and how this phase fits into the larger vision.

### 1055 - Smart Batching & Orchestration

**Goal**: Autonomous workflow execution with smart batching, configurable behavior, and auto-healing.

**Context**: Large task lists (50+) exceed context windows. This phase adds intelligent batching using existing tasks.md sections, a state machine for orchestration, user configuration modal, and auto-healing when batches fail.

**Key Principles:**
- **Programmatic batching** - No UI for selecting individual tasks, automatic batch detection
- **Configurable autonomy** - User sets preferences before starting, then minimal interaction
- **Auto-healing** - Spawn fixer Claude on failure, configurable retry before stopping
- **Clear flow** - design → analyze → implement → verify → (pause for merge OR auto-merge)

---

**Scope:**

### 0. Orchestration Configuration Modal

When user clicks "Start Orchestrate", display a configuration modal before execution begins.

**Purpose**: Collect user preferences once upfront to enable truly autonomous execution.

#### Core Options (always visible)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| Auto-merge on completion | toggle | off | Automatically run /flow.merge after verify succeeds |
| Additional context | textarea | empty | Free-form text injected into all skill prompts |
| Skip design | toggle | off | Skip /flow.design if specs already exist |
| Skip analyze | toggle | off | Skip /flow.analyze step |

#### Advanced Options (collapsed section)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| Auto-heal enabled | toggle | on | Attempt automatic recovery on batch failure |
| Max heal attempts | number | 1 | Retry limit per batch (prevents infinite loops) |
| Batch size fallback | number | 15 | Task count per batch if no `##` sections found |
| Pause between batches | toggle | off | Require user confirmation between implement batches |

#### Future Considerations (not in scope for this phase)
- Branch strategy selection (create new, use current, auto-name)
- Test/dry-run mode
- Notification level customization
- Time-based constraints (stop after N hours)

**Modal UI Notes:**
- "Start Orchestration" button at bottom
- Show detected batch count before starting: "Detected 4 batches from tasks.md"
- Warning if no sections found: "No sections detected, will use 15-task batches"
- Pre-flight check: Show current phase status (hasSpecs, taskCount, etc.)

---

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

**Corrected Flow**: design → analyze → implement → verify → merge

```
[Start with Config]
       │
       ▼
┌──────────────────┐
│  Check Status    │◄─────────────────────────────────────┐
│  specflow status │                                      │
└────────┬─────────┘                                      │
         │                                                │
         ▼                                                │
   ┌─────────────┐     ┌───────────────────┐              │
   │Need Design? │─Yes─►│ /flow.design     │──────────────┤
   │(skip if set)│     └───────────────────┘              │
   └──────┬──────┘                                        │
          │No                                             │
          ▼                                               │
   ┌─────────────┐     ┌───────────────────┐              │
   │Need Analyze?│─Yes─►│ /flow.analyze    │──────────────┤
   │(skip if set)│     └───────────────────┘              │
   └──────┬──────┘                                        │
          │No                                             │
          ▼                                               │
   ┌─────────────┐     ┌───────────────────┐              │
   │Tasks Left?  │─Yes─►│ /flow.implement  │──┬───────────┤
   └──────┬──────┘     │ (batch N of M)    │  │           │
          │No          └─────────┬─────────┘  │           │
          │                      │            │           │
          │               ┌──────▼──────┐     │           │
          │               │Batch Failed?│─No──┘           │
          │               └──────┬──────┘                 │
          │                      │Yes                     │
          │               ┌──────▼──────┐                 │
          │               │Auto-Heal?   │─No─►[Stop+Notify]
          │               └──────┬──────┘                 │
          │                      │Yes                     │
          │               ┌──────▼──────┐                 │
          │               │Spawn Healer │─────────────────┘
          │               └─────────────┘
          ▼
   ┌─────────────┐     ┌───────────────────┐
   │Need Verify? │─Yes─►│ /flow.verify     │──────────────┘
   └──────┬──────┘     └───────────────────┘
          │No
          ▼
   ┌─────────────┐     ┌───────────────────┐
   │Auto-merge?  │─Yes─►│ /flow.merge      │──►[Complete]
   └──────┬──────┘     └───────────────────┘
          │No
          ▼
   ┌─────────────┐
   │Pause: Merge │  ← User must manually trigger merge
   │Ready        │
   └─────────────┘
```

**State Machine Logic:**

- Between each step: `specflow status --json` to determine next action
- Configuration stored in orchestration execution record
- State persisted in `{project}/.specflow/workflows/orchestration-{id}.json`

**Transition Rules:**

| Condition | Action |
|-----------|--------|
| `hasSpec: false` AND `!config.skipDesign` | Run /flow.design |
| Post-design AND `!config.skipAnalyze` | Run /flow.analyze |
| `tasksComplete < tasksTotal` | Run /flow.implement (next incomplete batch) |
| `tasksComplete == tasksTotal` | Run /flow.verify |
| Verify complete AND `config.autoMerge` | Run /flow.merge |
| Verify complete AND `!config.autoMerge` | Pause, notify user "Ready to merge" |

**Fallback Behavior:**
- If state unclear after 3 status checks → spawn Claude to analyze and decide
- Log decision rationale for debugging

**Critical: Decision Timing**

The state machine must wait for BOTH conditions before making decisions:

1. **Orchestration state update** - `step.current` changes (e.g., implement → verify)
2. **Process completion** - Workflow execution status is terminal (completed/failed)

Why: The skill may update orchestration state BEFORE it finishes all cleanup work. Making decisions based only on state changes can cause race conditions.

**Decision Algorithm:**
```
On state change detected:
  1. Check workflow execution status
  2. If status == 'running' or 'waiting_for_input':
     → Wait, don't make decision yet
  3. If status == 'completed' or 'failed':
     → Read final orchestration state
     → Parse tasks.md for completion status
     → Make state machine decision
  4. Poll every 3s until process exits
```

**Data Sources for Decisions:**

| Source | What It Tells Us | How to Check |
|--------|-----------------|--------------|
| Orchestration state | Current step, status | `specflow status --json` |
| Workflow execution | Process status, exit code | `/api/workflow/status` |
| Session JSONL | Detailed execution log | Parse `~/.claude/projects/{hash}/{session}.jsonl` |
| tasks.md | Task completion status | `specflow status --json` (includes progress) |

**Completion Detection (implements Q1: A+C):**
- **Primary**: Check `step.current == "verify"` in orchestration state (set by implement skill on completion)
- **Secondary**: Parse tasks.md to verify all batch tasks are marked complete
- **Fallback**: If process exited but state unclear, spawn Claude to assess

### 3. Sequential Batch Execution

**Mechanism**: Use existing context injection (no skill modifications needed).

The workflow service already supports appending user context to skill prompts. For batched implement:

```typescript
// Orchestrator builds skill input with batch context
const skillInput = `/flow.implement Execute only the "${batch.section}" section (${batch.taskIds.join(', ')}). Do NOT work on tasks from other sections.`;

// Plus additional user context from config
if (config.additionalContext) {
  skillInput += `\n\n${config.additionalContext}`;
}
```

This becomes the "# User Context" section in the final prompt:

```markdown
# Skill Instructions
[/flow.implement content]

# User Context
Execute only the "Core Components" section (T008, T009, T010, T011).
Do NOT work on tasks from other sections.

Focus on performance, avoid N+1 queries.  [← from config.additionalContext]
```

**Execution Flow:**

1. Parse tasks.md to identify batches (sections with incomplete tasks)
2. For each batch:
   - Build skill input with batch constraint
   - Call workflow service `start()` with skill input
   - Wait for completion (dual confirmation: state + process)
   - Verify batch tasks are complete in tasks.md
   - If incomplete + failure detected → trigger auto-heal
3. After all batches: proceed to verify step

**Tracking per batch:**
- Batch index (1 of N)
- Section name
- Task IDs in batch
- Started at
- Completed at
- Status (pending, running, completed, failed, healed)
- Tasks completed count (pre/post)

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

UI components showing current orchestration state:

**Phase Progress Bar:**
```
Design ──●── Analyze ──●── Implement ──○── Verify ──○── Merge
                         ▲ current
```

**Batch Progress (during implement):**
- "Implementing batch 2 of 4: Core Components"
- "Tasks: 12/35 complete"
- Visual progress bar within current batch

**Status Indicators:**
- 🔄 Running - Active execution
- ⏸️ Paused - Waiting between batches (if configured)
- 🔧 Healing - Auto-heal in progress
- ❓ Waiting - Needs user input (question)
- ✅ Phase complete - Ready for next phase
- ⏹️ Merge ready - Paused waiting for merge approval

**Timing Information:**
- Time elapsed for current phase/batch
- Estimated remaining (based on batch completion rate)

**Orchestration Log Panel:**
- Collapsible log showing state machine decisions
- "Checked status: hasSpec=true, tasksComplete=12/35"
- "Starting batch 2: Core Components (T008-T015)"
- "Batch 1 completed in 4m 32s"

---

### 6. Additional Context Injection

The "Additional context" from the configuration modal gets injected into skill prompts:

```
[Standard skill prompt for /flow.implement]

---
ADDITIONAL CONTEXT FROM USER:
{config.additionalContext}
---

[Rest of prompt]
```

**Use Cases:**
- "Focus on performance, avoid N+1 queries"
- "Use the existing AuthService for all auth operations"
- "The API should follow REST conventions strictly"
- "Skip writing tests for now, I'll add them later"

---

**Deliverables:**

| Deliverable | Location | Description |
|-------------|----------|-------------|
| **Claude Helper Utility** | `claude-helper.ts` | Core utility for decisions + continuation |
| Configuration Modal | `StartOrchestrationModal.tsx` | Pre-flight config UI |
| Orchestration Config Schema | `packages/shared/src/schemas/` | Zod schema for config |
| Batch Parser | `orchestration-service.ts` | Extract batches (or use Claude Helper) |
| State Machine | `orchestration-state-machine.ts` | Decision logic, uses Claude Helper for fallback |
| Auto-Healing Service | `auto-healing-service.ts` | Uses Claude Helper for healing |
| Progress Component | `OrchestrationProgress.tsx` | Phase/batch/task progress UI |
| Orchestration API | `POST /api/workflow/orchestrate` | Start orchestration with config |
| Orchestration Status API | `GET /api/workflow/orchestrate/status` | Get orchestration-specific status |
| Tests | `__tests__/orchestration/` | State machine, Claude Helper mocks, healing |

**Dependencies:**
- Phase 1054 complete (project details redesign)
- Uses existing: workflow-service.ts, tasks.ts parser, process management

**Verification Gate: USER**
- [ ] Project detail: "Complete Phase" button is prominent, styled differently
- [ ] Project detail: Secondary buttons (Orchestrate, Merge, Review, Memory) still work
- [ ] Project card: "Complete Phase" is first menu item (highlighted)
- [ ] Project card: "Run Workflow" flyout contains Orchestrate, Merge, Review, Memory
- [ ] Configuration modal appears when clicking "Complete Phase" (both locations)
- [ ] Modal shows detected batch count and current phase status
- [ ] Start orchestration, see batches auto-detected from tasks.md sections
- [ ] State machine transitions: design → analyze → implement → verify
- [ ] Batches execute sequentially without user input
- [ ] Skip options work (skipDesign, skipAnalyze)
- [ ] Introduce a failure, see auto-heal attempt (uses Claude Helper)
- [ ] If heal succeeds, execution continues
- [ ] Progress UI replaces action buttons during orchestration
- [ ] Auto-merge works when enabled
- [ ] Pauses at merge-ready when auto-merge disabled
- [ ] Additional context appears in Claude's output
- [ ] Budget limits respected (orchestration stops if exceeded)
- [ ] Decision log shows Claude Helper calls and reasoning

**Estimated Complexity**: High

---

### 7. Orchestration State Structure

**File location**: `{project}/.specflow/workflows/orchestration-{id}.json`

Separate from individual workflow executions - this tracks the overall orchestration.

```typescript
interface OrchestrationExecution {
  id: string;                    // UUID
  projectId: string;             // Registry key
  status: 'running' | 'paused' | 'waiting_merge' | 'completed' | 'failed' | 'cancelled';

  // User configuration (from modal)
  config: {
    autoMerge: boolean;
    additionalContext: string;
    skipDesign: boolean;
    skipAnalyze: boolean;
    autoHealEnabled: boolean;
    maxHealAttempts: number;
    batchSizeFallback: number;
    pauseBetweenBatches: boolean;
  };

  // Current position in flow
  currentPhase: 'design' | 'analyze' | 'implement' | 'verify' | 'merge' | 'complete';

  // Batch tracking (during implement phase)
  batches: {
    total: number;
    current: number;              // 0-indexed
    items: Array<{
      index: number;
      section: string;
      taskIds: string[];
      status: 'pending' | 'running' | 'completed' | 'failed' | 'healed';
      startedAt?: string;
      completedAt?: string;
      healAttempts: number;
      workflowExecutionId?: string;  // Link to workflow execution for this batch
    }>;
  };

  // Linked workflow executions
  executions: {
    design?: string;              // Workflow execution IDs
    analyze?: string;
    implement: string[];          // One per batch
    verify?: string;
    merge?: string;
    healers: string[];            // Auto-heal execution IDs
  };

  // Timing
  startedAt: string;
  updatedAt: string;
  completedAt?: string;

  // Decision log for debugging
  decisionLog: Array<{
    timestamp: string;
    decision: string;
    reason: string;
    data?: unknown;
  }>;
}
```

---

### 8. UI Integration Points

**Workflow Actions Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  ◈ Complete Phase                                    →  │  ← PRIMARY (highlighted)
│  Automatically execute all steps to complete phase      │
└─────────────────────────────────────────────────────────┘

   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
   │Orchestrate│  │  Merge   │  │  Review  │  │  Memory  │   ← SECONDARY (existing)
   └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

**Button Hierarchy:**

| Button | Action | Description |
|--------|--------|-------------|
| **Complete Phase** | Opens config modal → smart orchestration | NEW - autonomous batching, auto-healing |
| Orchestrate | Runs `/flow.orchestrate` directly | Existing skill (for manual control/testing) |
| Merge | Runs `/flow.merge` directly | Existing skill |
| Review | Runs `/flow.review` directly | Existing skill |
| Memory | Runs `/flow.memory` directly | Existing skill |

**"Complete Phase" Button Styling:**
- Larger, more prominent than secondary buttons
- Gradient or accent color background (purple/blue as in mockup)
- Icon: stacked layers (◈) suggesting multiple phases
- Subtitle: "Automatically execute all steps to complete phase"
- Arrow indicator (→) suggesting it opens modal

**Secondary Buttons Styling:**
- Uniform size, row layout
- Subtle background, icon + label
- Direct action (no modal, just skill picker confirmation)

**Project Card Actions Menu:**

```
┌─────────────────────────────┐
│ ◈ Complete Phase         →  │  ← PRIMARY (highlighted, opens modal)
├─────────────────────────────┤
│ ▷ Run Workflow           →  │──┬─ Orchestrate
├─────────────────────────────┤  ├─ Merge
│ 🔧 Maintenance              │  ├─ Review
│   Status                    │  └─ Memory
│   Validate                  │
├─────────────────────────────┤
│ ⚙ Advanced                  │
│   Sync State                │
└─────────────────────────────┘
```

**Menu Changes:**
- "Start Workflow" renamed to "Run Workflow" (secondary action)
- "Complete Phase" added as first item (primary, highlighted)
- "Run Workflow" flyout contains: Orchestrate, Merge, Review, Memory
- Removes individual workflow steps (Design, Analyze, etc.) from flyout - those are now part of "Complete Phase"

**Entry Points for Complete Phase:**

| Location | Trigger | Notes |
|----------|---------|-------|
| Project detail | Click "Complete Phase" button | Primary entry |
| Project card | Actions menu → "Complete Phase" | Opens same config modal |
| Command palette | Cmd+K → "Complete Phase for [project]" | Keyboard users |

**Progress Display Location**:
- When "Complete Phase" is active, the entire workflow actions area transforms:
  - Hide the action buttons
  - Show orchestration progress (Section 5)
  - Show "Cancel" and "Pause" controls
- When complete/cancelled, buttons reappear

**Status in Project List**:
- Card shows orchestration status badge when active
- "Completing phase (batch 2/4)" or "Phase: Waiting for merge"
- Different badge color than regular workflow runs

**Coexistence with Existing Workflows:**
- "Complete Phase" is the new smart orchestration (this phase)
- Secondary buttons remain for manual skill execution
- Allows testing new orchestration while keeping manual fallback
- Eventually, secondary buttons could be collapsed/hidden once orchestration is stable

---

### 9. API Design

**New Routes:**

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/workflow/orchestrate` | POST | Start orchestration with config |
| `/api/workflow/orchestrate/status` | GET | Get orchestration status by ID |
| `/api/workflow/orchestrate/list` | GET | List orchestrations for project |
| `/api/workflow/orchestrate/cancel` | POST | Cancel active orchestration |
| `/api/workflow/orchestrate/resume` | POST | Resume paused orchestration |
| `/api/workflow/orchestrate/merge` | POST | Trigger merge (when paused at merge-ready) |

**POST /api/workflow/orchestrate Request:**
```typescript
{
  projectId: string;
  config: OrchestrationConfig;
}
```

**Response:**
```typescript
{
  orchestrationId: string;
  status: string;
  batches: { total: number; detected: string[] };  // Show user what was detected
}
```

---

### 10. Claude Helper Utility

A foundational utility for intelligent decision-making and session continuation.

**Purpose**: Provide typed, structured interactions with Claude for orchestration decisions, verification, and healing - without hardcoding every edge case.

#### Dual-Mode Operation

| Mode | When to Use | Session Behavior |
|------|-------------|------------------|
| **Decision** | Quick questions, verification, batch planning | New session (optionally not persisted) |
| **Continuation** | Healing, resuming after questions | Resume existing session |

#### TypeScript Interface

```typescript
interface ClaudeHelperOptions<T> {
  // Session handling (one of these patterns)
  sessionId?: string;              // Resume existing session
  forkSession?: boolean;           // Branch session (don't pollute original)
  noSessionPersistence?: boolean;  // Don't save session (quick decisions)

  // Core (required)
  message: string;                 // What to send to Claude
  schema: z.ZodSchema<T>;          // Expected response structure (Zod)
  projectPath: string;             // Working directory for Claude

  // Model selection
  model?: 'sonnet' | 'haiku' | 'opus';  // Default: sonnet
  fallbackModel?: 'sonnet' | 'haiku';   // Auto-fallback if primary overloaded

  // Tool control
  tools?: string[];                // Restrict to specific tools only
  disallowedTools?: string[];      // Block specific tools (default: ['AskUserQuestion'])

  // Guardrails
  maxTurns?: number;               // Limit agentic turns (default: 10)
  maxBudgetUsd?: number;           // Cost cap for this call
  timeout?: number;                // Process timeout in ms (default: 120000)

  // Prompt customization
  appendSystemPrompt?: string;     // Add to default system prompt
}

interface ClaudeHelperResult<T> {
  result: T;                       // Parsed, validated response
  sessionId: string;               // For potential follow-up
  cost: number;                    // USD spent
  turns: number;                   // Agentic turns used
  duration: number;                // Time in ms
}

async function claudeHelper<T>(
  options: ClaudeHelperOptions<T>
): Promise<ClaudeHelperResult<T>>;
```

#### CLI Flag Mapping

| Option | CLI Flag | Notes |
|--------|----------|-------|
| `sessionId` | `--resume {id}` | Resume existing session |
| `forkSession` | `--fork-session` | Branch without polluting original |
| `noSessionPersistence` | `--no-session-persistence` | Don't save to disk |
| `schema` | `--json-schema "{...}"` | Zod schema converted to JSON Schema |
| `model` | `--model sonnet` | Model alias |
| `fallbackModel` | `--fallback-model sonnet` | Auto-fallback |
| `tools` | `--tools "Read,Grep,Glob"` | Restrict available tools |
| `disallowedTools` | `--disallowedTools "AskUserQuestion"` | Block tools |
| `maxTurns` | `--max-turns 10` | Limit iterations |
| `maxBudgetUsd` | `--max-budget-usd 2.00` | Cost cap |
| `appendSystemPrompt` | `--append-system-prompt "..."` | Add context |

Always includes: `-p --output-format json --dangerously-skip-permissions`

#### Use Case Examples

**1. Quick Decision (stateless)**
```typescript
const NextStepSchema = z.object({
  action: z.enum(['run_design', 'run_analyze', 'run_implement', 'run_verify', 'wait', 'stop']),
  reason: z.string(),
  context: z.record(z.unknown()).optional(),
});

const { result } = await claudeHelper({
  message: `Given this orchestration state, what should happen next?
            State: ${JSON.stringify(state)}`,
  schema: NextStepSchema,
  model: 'haiku',  // Fast for simple decisions
  noSessionPersistence: true,
  maxTurns: 1,
  projectPath,
});
```

**2. Smart Batch Detection**
```typescript
const BatchPlanSchema = z.object({
  batches: z.array(z.object({
    name: z.string(),
    taskIds: z.array(z.string()),
    rationale: z.string(),
    estimatedComplexity: z.enum(['low', 'medium', 'high']),
    dependencies: z.array(z.string()).optional(),
  })),
  warnings: z.array(z.string()).optional(),
});

const { result } = await claudeHelper({
  message: `Group these tasks into logical implementation batches.
            Consider dependencies, logical groupings, and ~10-15 tasks per batch.

            Tasks:
            ${tasksContent}`,
  schema: BatchPlanSchema,
  model: 'sonnet',
  tools: ['Read', 'Grep'],  // Can read files to understand dependencies
  maxTurns: 3,
  maxBudgetUsd: 0.50,
  projectPath,
});
```

**3. Verification (read-only)**
```typescript
const VerificationSchema = z.object({
  completed: z.boolean(),
  tasksVerified: z.array(z.string()),
  failures: z.array(z.object({
    taskId: z.string(),
    reason: z.string(),
    evidence: z.string(),
  })).optional(),
  confidence: z.enum(['high', 'medium', 'low']),
});

const { result } = await claudeHelper({
  message: `Verify that batch "${batch.section}" completed successfully.
            Expected tasks: ${batch.taskIds.join(', ')}

            Check:
            1. tasks.md shows these tasks as complete
            2. Referenced files exist and contain expected code
            3. Tests pass (if applicable)`,
  schema: VerificationSchema,
  model: 'sonnet',
  tools: ['Read', 'Grep', 'Glob', 'Bash(npm test:*)', 'Bash(cat:*)'],  // Read-only + tests
  maxTurns: 5,
  maxBudgetUsd: 1.00,
  projectPath,
});
```

**4. Healing with Session Fork**
```typescript
const HealingSchema = z.object({
  status: z.enum(['fixed', 'partial', 'failed']),
  tasksCompleted: z.array(z.string()),
  tasksRemaining: z.array(z.string()),
  fixApplied: z.string().optional(),
  blockerReason: z.string().optional(),
});

const { result } = await claudeHelper({
  sessionId: failedExecution.sessionId,
  forkSession: true,  // Don't pollute original if this fails too
  message: `The batch failed with this error:
            ${stderr}

            Fix the issue and complete remaining tasks: ${remainingTasks.join(', ')}`,
  schema: HealingSchema,
  maxTurns: 15,
  maxBudgetUsd: 2.00,
  projectPath,
});
```

**5. Healing with Full Continuation**
```typescript
// When we're confident and want to continue the original session
const { result, sessionId } = await claudeHelper({
  sessionId: failedExecution.sessionId,
  // No fork - continue the actual session
  message: `You encountered an error. Here's stderr:
            ${stderr}

            The original session has full context of what you were doing.
            Fix the issue and complete the remaining tasks in this batch.`,
  schema: HealingSchema,
  maxTurns: 20,
  maxBudgetUsd: 3.00,
  projectPath,
});
// sessionId is same as input - session continues
```

#### Budget Configuration (Modal Additions)

Add to orchestration config modal (Advanced Options):

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| Max budget per batch | currency | $5.00 | Cost cap per implement batch |
| Max budget total | currency | $50.00 | Total orchestration cost cap |
| Healing budget | currency | $2.00 | Max spend per auto-heal attempt |
| Decision budget | currency | $0.50 | Max spend per decision call |

#### Implementation Notes

**File location**: `packages/dashboard/src/lib/services/claude-helper.ts`

**Error Handling**:
- Schema validation failure → return structured error, don't throw
- Budget exceeded → stop gracefully, return partial result
- Timeout → kill process, return timeout error
- Invalid session ID → fall back to new session with warning

**Logging**:
- Log all decisions to orchestration `decisionLog`
- Include: prompt summary, model used, cost, result summary

**Testing**:
- Mock utility for unit tests
- Integration tests with real Claude for critical paths

---

### Design Decisions (Resolved)

1. **Batch failure detection**: ✅ **Use A + C**
   - Parse task completion from tasks.md after each batch (source of truth)
   - AND require Claude to output structured completion status (belt-and-suspenders)
   - Check orchestration state `step.current` for skill-signaled completion

2. **Healing prompt scope**: ✅ **Current batch only**
   - Healer continues remaining tasks in the current batch
   - Once batch complete (or healer fails), proceed normally to next batch

3. **Cross-batch state**: ✅ **Out of scope**
   - If batch 2 breaks batch 1's work, healer tries once, then stops for user
   - User can manually fix and resume

4. **Concurrent orchestrations**: ✅ **No - one per project**
   - Single active orchestration per project
   - Attempting to start a second shows error: "Orchestration already in progress"
   - Can cancel existing to start new

5. **Resume after dashboard restart**: ✅ **Yes, auto-resume**
   - Orchestration state persisted to `{project}/.specflow/workflows/orchestration-{id}.json`
   - On startup, reconciler detects in-progress orchestrations
   - Resumes from last known state

6. **Decision timing**: ✅ **Wait for dual confirmation**
   - Don't make decisions on state change alone
   - Wait for BOTH: state update AND process completion
   - Prevents race conditions from state updates mid-execution
