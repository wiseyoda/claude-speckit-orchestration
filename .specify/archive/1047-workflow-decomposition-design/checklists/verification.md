# Verification Checklist: Workflow Decomposition - Design Phase

**Phase**: `1047-workflow-decomposition-design`
**Created**: 2026-01-18
**Purpose**: Verify implementation meets acceptance criteria

---

## Success Criteria Verification

### SC-001: Same Artifacts as /flow.design

- [x] V-001 Run `specflow workflow design` on test project
- [x] V-002 Verify discovery.md created with expected sections
- [x] V-003 Verify spec.md created with expected sections
- [x] V-004 Verify plan.md created with expected sections
- [x] V-005 Verify tasks.md created with task format
- [x] V-006 Verify checklists/ directory created with implementation.md and verification.md

### SC-002: All Event Types Emitted

- [x] V-007 Run with `--json` flag, capture output
- [x] V-008 Verify phase_started event emitted for each sub-phase
- [x] V-009 Verify phase_complete event emitted when sub-phase finishes
- [x] V-010 Verify artifact_created event for each written file
- [x] V-011 Verify tool_invoked event for tool calls
- [x] V-012 Verify progress_update events during execution
- [x] V-013 Verify complete event at end of workflow

### SC-003: Async Question Answering

- [x] V-014 Trigger a design that requires user input (e.g., scope clarification)
- [x] V-015 Verify question_queued event emitted
- [x] V-016 Check `.specify/questions.json` contains the question
- [x] V-017 Run `specflow workflow answer <id> <answer>`
- [x] V-018 Verify question status updated to "answered"
- [x] V-019 Verify workflow continues after answer (if Claude session still active)

### SC-004: --phase Flag Works

- [x] V-020 Run `specflow workflow design --phase plan` with existing spec.md
- [x] V-021 Verify only plan.md is regenerated (discovery.md, spec.md unchanged)
- [x] V-022 Run `specflow workflow design --phase plan` without spec.md
- [x] V-023 Verify error returned indicating dependency not met

### SC-005: Missing CLI Error

- [x] V-024 Temporarily rename/hide `claude` CLI
- [x] V-025 Run `specflow workflow design`
- [x] V-026 Verify error message: "Claude CLI not found. Install from https://claude.ai/code"
- [x] V-027 Restore `claude` CLI

---

## Edge Case Verification

### Error Handling

- [x] V-028 Kill Claude process mid-execution, verify error event emitted
- [x] V-029 Verify workflow status shows "failed" after crash
- [x] V-030 Verify question queue preserved after crash

### Input Validation

- [x] V-031 Run `specflow workflow answer` with non-existent question ID
- [x] V-032 Verify error message about invalid ID
- [x] V-033 Run `specflow workflow design --phase invalid`
- [x] V-034 Verify error listing valid phase names

---

## Constitution Compliance

### Three-Line Rule

- [x] V-035 Run `specflow workflow design` without `--json`
- [x] V-036 Verify first 3 lines contain: status, progress, next step
- [x] V-037 Verify no decorative headers before critical info

### CLI Over Direct Edits

- [x] V-038 Verify orchestration state updated via `specflow state set` (check git diff)
- [x] V-039 Verify no direct writes to `.specify/orchestration-state.json` in code

---

## Integration Verification

### Dashboard Compatibility

- [x] V-040 JSON output is valid NDJSON (one JSON object per line)
- [x] V-041 Events can be parsed by dashboard's existing event handling
- [x] V-042 Question queue file format matches @specflow/shared schema

### Command Discovery

- [x] V-043 `specflow --help` shows workflow command group
- [x] V-044 `specflow workflow --help` shows design, answer, status subcommands
- [x] V-045 Each subcommand shows `--json` option

---

## Final Sign-off

- [x] V-046 All verification items above checked
- [x] V-047 `specflow check --gate verify` passes
- [x] V-048 Ready for `/flow.merge`
