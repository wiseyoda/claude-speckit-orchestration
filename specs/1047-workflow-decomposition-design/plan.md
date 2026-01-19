# Implementation Plan: Workflow Decomposition - Design Phase

**Branch**: `1047-workflow-decomposition-design` | **Date**: 2026-01-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/1047-workflow-decomposition-design/spec.md`

## Summary

Create `specflow workflow` CLI command group that spawns Claude CLI to execute `/flow.design` skill with streaming JSON output. Questions are queued to a file for async answering, enabling dashboard automation of the design workflow.

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode)
**Primary Dependencies**: Commander.js 12.x, child_process, Zod 3.x
**Storage**: File-based (`.specify/questions.json`, `.specify/orchestration-state.json`)
**Testing**: Vitest 2.x with memfs for filesystem mocking
**Target Platform**: Node.js 18+ (macOS, Linux)
**Project Type**: Monorepo CLI package
**Performance Goals**: Real-time streaming with <100ms event latency
**Constraints**: Must not exceed 200k context per Claude session
**Scale/Scope**: Single project execution at a time (multi-project in phase 1050)

## Constitution Check

_GATE: Must pass before implementation._

| Principle | Status | Notes |
|-----------|--------|-------|
| IIa. TypeScript for CLI | PASS | Commands in packages/cli/src/commands/workflow/ |
| III. CLI Over Direct Edits | PASS | State changes via `specflow state set` |
| IV. Simplicity Over Cleverness | PASS | Single-session design, file-based queue |
| V. Helpful Error Messages | PASS | Missing Claude CLI error specified |
| VII. Three-Line Output Rule | PASS | Human output planned accordingly |

## Project Structure

### Documentation (this feature)

```text
specs/1047-workflow-decomposition-design/
├── discovery.md         # Codebase findings
├── spec.md              # Feature specification
├── requirements.md      # Requirements checklist
├── plan.md              # This file
├── tasks.md             # Task breakdown
└── checklists/
    ├── implementation.md
    └── verification.md
```

### Source Code (packages/cli/)

```text
packages/cli/
├── src/
│   ├── index.ts                    # Add workflowCommand import
│   ├── commands/
│   │   └── workflow/
│   │       ├── index.ts            # workflow command group
│   │       ├── design.ts           # specflow workflow design
│   │       ├── answer.ts           # specflow workflow answer
│   │       └── status.ts           # specflow workflow status
│   └── lib/
│       ├── claude-runner.ts        # Claude CLI spawning
│       ├── event-parser.ts         # NDJSON stream parser
│       ├── question-queue.ts       # Question file management
│       └── workflow-events.ts      # Event type definitions
├── tests/
│   └── commands/
│       └── workflow/
│           ├── design.test.ts
│           ├── answer.test.ts
│           └── status.test.ts
└── dist/
```

### Shared Types (packages/shared/)

```text
packages/shared/
└── src/
    └── schemas/
        └── workflow.ts             # Zod schemas for events, questions
```

**Structure Decision**: Extend existing packages/cli/ with new workflow/ command directory. Event types and question schemas in @specflow/shared for dashboard reuse.

## Implementation Approach

### Phase 1: Core Infrastructure

1. **Claude Runner** (`lib/claude-runner.ts`)
   - Spawn `claude -p --output-format stream-json`
   - Handle process lifecycle (start, monitor, kill)
   - Validate Claude CLI exists before spawning

2. **Event Parser** (`lib/event-parser.ts`)
   - Parse NDJSON stream from Claude stdout
   - Map Claude events to WorkflowEvent types
   - Detect AskUserQuestion tool calls

3. **Question Queue** (`lib/question-queue.ts`)
   - Write questions to `.specify/questions.json`
   - Read and update question status
   - File locking for concurrent access

### Phase 2: Commands

1. **workflow design** (`commands/workflow/design.ts`)
   - Parse `--json`, `--phase` options
   - Construct Claude prompt with skill invocation
   - Stream events, queue questions
   - Update orchestration state

2. **workflow answer** (`commands/workflow/answer.ts`)
   - Read question by ID
   - Validate answer format
   - Write to queue file
   - Resume Claude if waiting

3. **workflow status** (`commands/workflow/status.ts`)
   - Check orchestration state
   - Read question queue
   - Return current workflow status

### Phase 3: Integration

1. Register commands in `index.ts`
2. Add Zod schemas to @specflow/shared
3. End-to-end testing with mock Claude CLI

## Claude CLI Integration

### Invocation Pattern

```typescript
const proc = spawn('claude', [
  '-p',
  '--output-format', 'stream-json',
  `Run /flow.design${phaseFlag ? ` --${phase}` : ''}`
], {
  cwd: projectPath,
  stdio: ['pipe', 'pipe', 'pipe']
});
```

### Event Mapping

| Claude Event | WorkflowEvent Type |
|--------------|-------------------|
| Session start | phase_started |
| Tool call | tool_invoked |
| File write | artifact_created |
| AskUserQuestion | question_queued |
| Error | error |
| Session end | complete |

### Question Injection

When user answers via `specflow workflow answer`, inject response:

```typescript
// Write to Claude's stdin using stream-json format
proc.stdin.write(JSON.stringify({
  type: 'user',
  message: { content: answerText }
}) + '\n');
```

## Complexity Tracking

No constitution violations requiring justification.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Claude CLI not installed | Validate with `which claude` before spawn |
| NDJSON parsing errors | Wrap in try/catch, emit error event |
| Stale question queue | Include workflow ID in queue file |
| Long-running sessions | No timeout initially; add in future if needed |

## Dependencies

### External

- `claude` CLI must be installed and configured
- Node.js 18+ for child_process features

### Internal (other phases)

- Phase 1048 depends on patterns established here
- Phase 1050 will build on workflow runner infrastructure
