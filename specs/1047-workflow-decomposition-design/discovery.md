# Discovery: Workflow Decomposition - Design Phase

**Phase**: `1047-workflow-decomposition-design`
**Created**: 2026-01-18
**Status**: Complete

## Phase Context

**Source**: ROADMAP phase 1047 / PDR Orchestration Engine
**Goal**: Create CLI commands that wrap Claude Code skill execution for dashboard automation of the design workflow.

---

## Codebase Examination

### Related Implementations

| Location | Description | Relevance |
|----------|-------------|-----------|
| `packages/cli/src/index.ts` | CLI entry point with Commander.js | Pattern for adding new commands |
| `packages/cli/src/commands/status.ts` | Status command implementation | Example of JSON output pattern |
| `packages/cli/src/commands/phase/open.ts` | Phase management | Spawns processes, manages state |
| `packages/dashboard/src/lib/cli-executor.ts` | CLI executor for dashboard | Existing spawn pattern with streaming |
| `commands/flow.design.md` | Flow design skill | Target skill to wrap |
| `commands/flow.orchestrate.md` | Orchestration skill | Shows phase flow pattern |

### Existing Patterns & Conventions

- **Command Structure**: Commander.js with `registerCommand()` pattern, options defined via `.option()`, action handlers as async functions
- **JSON Output**: All commands support `--json` flag via `setOutputOptions()` from `lib/output.js`
- **Three-Line Rule**: Human output puts critical info in first 3 lines per constitution
- **State Management**: `specflow state set/get` commands, never direct JSON edits
- **Process Spawning**: `child_process.spawn()` with stdio pipes, event handlers for stdout/stderr/close

### Integration Points

- **Claude CLI**: Invoked via `claude -p "prompt" --output-format stream-json`
- **State File**: `.specify/orchestration-state.json` for workflow state persistence
- **Question Queue**: New `.specify/questions.json` for async question handling
- **Skills**: Invoke `/flow.design` skill via Claude CLI prompt

### Constraints Discovered

- **Claude CLI Dependency**: Requires `claude` CLI installed and configured with API key
- **Context Window**: 200k token limit per session - single session per skill recommended
- **Streaming Format**: Claude emits NDJSON (newline-delimited JSON), must parse line-by-line
- **Interactive Questions**: Claude's `AskUserQuestion` tool needs interception for async mode

---

## Requirements Sources

### From ROADMAP/Phase File

- Create `specflow workflow design` CLI command
- Support `--json` streaming output
- Queue questions for async answering via `specflow workflow answer`
- Support `--phase` flag for specific design phases
- Ensure context stays under 200k per phase

### From Related Issues

No related issues found.

### From Previous Phase Handoffs

No handoff files exist for this phase.

### From Memory Documents

- **Constitution**: Principle IIa (TypeScript for CLI), Principle VII (Three-Line Output)
- **Tech Stack**: Commander.js 12.x, TypeScript 5.7+, Vitest for tests
- **Coding Standards**: ESM modules, Zod validation, explicit return types

---

## Scope Clarification

### Questions Asked

#### Question 1: Question Flow Strategy

**Context**: Phase description mentions `specflow workflow answer` for async question handling. The existing CLI executor in dashboard spawns processes but doesn't handle interactive questions.

**Question**: Should questions be queued to file or database, or focus on blocking mode first?

**Options Presented**:
- A (Recommended): Queue to file `.specify/questions.json`
- B: Interactive blocking only
- C: Database queue (SQLite)

**User Answer**: Queue to file (Recommended)

**Research Done**: File-based queue works offline, simpler implementation, can be upgraded to SQLite later.

---

#### Question 2: Session Scope

**Context**: `/flow.design` runs multiple sub-phases (discover, specify, plan, tasks, checklists). Each could be a separate Claude session or one continuous session.

**Question**: Should we run entire skill in one session or split by sub-phase?

**Options Presented**:
- A (Recommended): One session per skill
- B: Separate session per sub-phase
- C: Hybrid - auto-split on limits

**User Answer**: One session per skill (Recommended)

**Research Done**: Single session matches current behavior, simpler orchestration, acceptable for typical design phases.

---

#### Question 3: Package Location

**Context**: CLI executor exists in packages/dashboard. Need to decide where workflow commands live.

**Question**: Should workflow commands live in CLI package or dashboard package?

**Options Presented**:
- A (Recommended): CLI package
- B: Dashboard package
- C: New shared package

**User Answer**: CLI package (Recommended)

---

#### Question 4: Event Types

**Context**: Need to define streaming JSON event types for progress tracking.

**Question**: What event types should be emitted during execution?

**Options Presented**:
- A (Recommended): Minimal events
- B: Verbose events (phase_started, artifact_created, tool_invoked, progress_update)
- C: Pass through Claude SDK events

**User Answer**: Verbose events

---

### Confirmed Understanding

**What the user wants to achieve**:
Create CLI commands (`specflow workflow design`) that spawn Claude CLI to run `/flow.design` skill, streaming progress events as JSON, with questions queued to a file for async answering via `specflow workflow answer`.

**How it relates to existing code**:
- Extends packages/cli/ with new `workflow` command group
- Uses Claude CLI `-p --output-format stream-json` for programmatic control
- Question queue stored in `.specify/questions.json`
- Dashboard can consume via existing patterns in cli-executor.ts

**Key constraints and requirements**:
- Claude CLI must be installed and configured
- Single Claude session per `/flow.design` invocation
- Verbose streaming events (phase_started, artifact_created, tool_invoked, progress_update)
- Questions queued to file, answered via `specflow workflow answer`
- All commands support `--json` flag

**Technical approach (if discussed)**:
- `specflow workflow design` spawns `claude -p --output-format stream-json`
- Parse NDJSON stream, emit normalized events
- Intercept AskUserQuestion tool calls, queue to file
- `specflow workflow answer <id> <response>` writes response
- Claude SDK pattern: inject response via `--input-format stream-json`

**User confirmed**: Yes - 2026-01-18

---

## Recommendations for SPECIFY

### Should Include in Spec

- `specflow workflow design` command with streaming JSON
- `specflow workflow answer` command for async responses
- `specflow workflow status` for checking running workflows
- Question queue file format and location
- Event type definitions (phase_started, artifact_created, tool_invoked, progress_update, question_queued, error, complete)
- `--phase` flag for running specific design sub-phases

### Should Exclude from Spec (Non-Goals)

- Database storage for questions (file-based for now)
- Multi-project parallel execution (phase 1050 scope)
- Browser notification integration (dashboard scope)
- Session resume across Claude CLI restarts

### Potential Risks

- Claude CLI output format changes could break parsing
- Context window limits may require sub-phase splitting in future
- Interactive tool calls besides AskUserQuestion may need handling

### Questions to Address in CLARIFY

- Exact question queue JSON schema
- Error recovery when Claude CLI crashes mid-execution
- Timeout handling for long-running design phases
