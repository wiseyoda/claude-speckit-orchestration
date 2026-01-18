---
phase: 1047
name: workflow-decomposition-design
status: not_started
created: 2026-01-17
updated: 2026-01-18
pdr: pdr-orchestration-engine.md
---

### 1047 - Workflow Decomposition: Design Phase

**Goal**: Create CLI commands that wrap Claude Code skill execution for dashboard automation of the design workflow.

**Current State (3.0)**:
- `/flow.design` skill exists with phases: DISCOVER → SPECIFY → UI DESIGN → PLAN → TASKS → CHECKLISTS
- `specflow check --gate design` validates design artifacts
- `specflow status --json` provides project context
- Skills are designed for interactive Claude Code sessions, not programmatic invocation

**Scope**:
- Create `specflow workflow design` CLI command that:
  - Spawns Claude Code with `/flow.design` skill
  - Streams progress events via JSON
  - Queues questions for async answering
  - Returns structured completion status
- Create `specflow workflow discover` for just the DISCOVER phase (optional entry point)
- Add `--phase` flag to run specific design phases: `--phase specify`, `--phase plan`, etc.
- Ensure each phase stays under 200k context window

**User Stories**:
1. As a dashboard, I run `specflow workflow design --json` and receive streaming progress
2. As a dashboard, I see questions queued in JSON output and can respond via `specflow workflow answer`
3. As a dashboard, I can run just `specflow workflow design --phase plan` to regenerate the plan
4. As a developer, the CLI works the same as running `/flow.design` directly

**Deliverables**:
- `specflow workflow design` command with:
  - `--json` streaming output (events: started, phase_complete, question, error, complete)
  - `--phase <name>` to run specific phase only
  - Returns: artifacts_created, questions_pending, errors
- `specflow workflow answer <question-id> <answer>` for async question handling
- `specflow workflow status` to check running workflows
- Documentation for dashboard integration

**Dependencies**:
- Claude Code CLI `--stream-json` or equivalent for programmatic control
- Process management for background execution (see phase 1050)

**Verification Gate**: Technical
- `specflow workflow design` produces same artifacts as `/flow.design`
- JSON output includes all progress events
- Questions can be answered asynchronously
- Context stays under 200k per phase

**Estimated Complexity**: High
