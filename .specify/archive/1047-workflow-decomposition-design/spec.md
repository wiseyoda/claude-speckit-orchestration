# Feature Specification: Workflow Decomposition - Design Phase

**Feature Branch**: `1047-workflow-decomposition-design`
**Created**: 2026-01-18
**Status**: Draft
**Input**: Create CLI commands for dashboard automation of `/flow.design` workflow

---

## User Scenarios & Testing

### User Story 1 - Dashboard Runs Design Workflow (Priority: P1)

As a dashboard application, I run `specflow workflow design --json` and receive streaming progress events so I can display real-time status to the user.

**Why this priority**: Core functionality - without this, dashboard cannot automate design workflows.

**Independent Test**: Can be tested by running command and verifying JSON events are emitted for each design phase.

**Acceptance Scenarios**:

1. **Given** a valid phase is open, **When** I run `specflow workflow design --json`, **Then** I receive streaming JSON events including phase_started, artifact_created, and complete
2. **Given** the command is running, **When** Claude completes a design sub-phase, **Then** I receive a phase_complete event with the sub-phase name
3. **Given** a design error occurs, **When** Claude cannot proceed, **Then** I receive an error event with descriptive message

---

### User Story 2 - Async Question Handling (Priority: P2)

As a dashboard, I see questions queued in JSON output and can respond via `specflow workflow answer` so users can answer design questions asynchronously.

**Why this priority**: Essential for non-blocking dashboard UX - users shouldn't wait on CLI.

**Independent Test**: Can be tested by triggering a question, checking queue file, and answering via CLI.

**Acceptance Scenarios**:

1. **Given** Claude invokes AskUserQuestion during design, **When** the tool call is detected, **Then** a question_queued event is emitted and the question is written to `.specify/questions.json`
2. **Given** a question exists in the queue, **When** I run `specflow workflow answer <id> <answer>`, **Then** the answer is recorded and Claude continues execution
3. **Given** a question is answered, **When** checking the queue, **Then** the question status shows "answered"

---

### User Story 3 - Run Specific Design Phase (Priority: P3)

As a dashboard, I can run `specflow workflow design --phase plan` to regenerate just the plan without rerunning discovery and spec.

**Why this priority**: Useful for iteration but not critical for MVP.

**Independent Test**: Can be tested by running with `--phase plan` and verifying only plan.md is regenerated.

**Acceptance Scenarios**:

1. **Given** spec.md exists, **When** I run `specflow workflow design --phase plan --json`, **Then** only the PLAN phase executes and plan.md is created/updated
2. **Given** no spec.md exists, **When** I run `specflow workflow design --phase plan`, **Then** an error is returned indicating dependency not met

---

### User Story 4 - Check Workflow Status (Priority: P4)

As a dashboard, I run `specflow workflow status` to check if a workflow is running and its current progress.

**Why this priority**: Nice to have for dashboard state management.

**Independent Test**: Can be tested by starting workflow, then checking status.

**Acceptance Scenarios**:

1. **Given** a workflow is running, **When** I run `specflow workflow status --json`, **Then** I receive the current phase, progress percentage, and active sub-phase
2. **Given** no workflow is running, **When** I run `specflow workflow status --json`, **Then** I receive status "idle"

---

### Edge Cases

- What happens when Claude CLI is not installed?
  - Error with helpful message: "Claude CLI not found. Install from https://claude.ai/code"
- What happens when Claude CLI crashes mid-execution?
  - Workflow status set to "failed", error event emitted, question queue preserved
- What happens when user answers a question that was already answered?
  - Return error: "Question <id> already answered"
- What happens when context window is exceeded?
  - Error event with suggestion to use `--phase` flag for incremental execution

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide `specflow workflow design` command that spawns Claude CLI with `/flow.design` skill
- **FR-002**: System MUST support `--json` flag for streaming NDJSON output
- **FR-003**: System MUST emit events: phase_started, phase_complete, artifact_created, tool_invoked, progress_update, question_queued, error, complete
- **FR-004**: System MUST queue AskUserQuestion tool calls to `.specify/questions.json`
- **FR-005**: System MUST provide `specflow workflow answer <id> <answer>` command to respond to queued questions
- **FR-006**: System MUST support `--phase <name>` flag to run specific design sub-phases (discover, specify, plan, tasks, checklists)
- **FR-007**: System MUST provide `specflow workflow status` command showing current workflow state
- **FR-008**: System MUST validate Claude CLI is available before spawning
- **FR-009**: System MUST update orchestration state via `specflow state set` (not direct file edits)
- **FR-010**: Human output MUST follow Three-Line Rule per constitution

### Key Entities

- **WorkflowExecution**: Represents a running or completed workflow (id, skill, status, startedAt, completedAt, events)
- **Question**: Represents a queued question (id, content, options, status, answeredAt, answer)
- **WorkflowEvent**: Represents a streaming event (type, timestamp, data)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: `specflow workflow design --json` produces same artifacts as running `/flow.design` directly
- **SC-002**: JSON output includes all progress events matching FR-003 event types
- **SC-003**: Questions can be answered asynchronously via `specflow workflow answer`
- **SC-004**: `--phase` flag correctly limits execution to specified sub-phase
- **SC-005**: CLI detects missing Claude CLI and shows helpful error message

---

## Non-Goals

- **NG-001**: Database storage for question queue (file-based for this phase)
- **NG-002**: Multi-project parallel workflow execution (phase 1050)
- **NG-003**: Session resume after Claude CLI crash (would require complex state recovery)
- **NG-004**: Real-time browser notifications (dashboard responsibility)

---

## Technical Context

### Dependencies

- Claude CLI (`claude` command) with `-p` and `--output-format stream-json` support
- Node.js child_process for spawning
- @specflow/shared for Zod schemas

### Event Schema

```typescript
interface WorkflowEvent {
  type: 'phase_started' | 'phase_complete' | 'artifact_created' |
        'tool_invoked' | 'progress_update' | 'question_queued' |
        'error' | 'complete';
  timestamp: string;  // ISO 8601
  data: Record<string, unknown>;
}

// Example events:
// { type: 'phase_started', timestamp: '...', data: { phase: 'discover' } }
// { type: 'artifact_created', timestamp: '...', data: { artifact: 'discovery.md', path: 'specs/1047/discovery.md' } }
// { type: 'question_queued', timestamp: '...', data: { id: 'q-001', content: '...', options: [...] } }
```

### Question Queue Schema

```typescript
interface QuestionQueue {
  workflowId: string;
  questions: Question[];
}

interface Question {
  id: string;
  content: string;
  options: { label: string; description: string }[];
  status: 'pending' | 'answered';
  createdAt: string;
  answeredAt?: string;
  answer?: string;
}
```
