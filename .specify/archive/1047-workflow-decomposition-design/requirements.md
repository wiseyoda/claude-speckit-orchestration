# Requirements Checklist: Workflow Decomposition - Design Phase

**Phase**: `1047-workflow-decomposition-design`
**Created**: 2026-01-18
**Source**: spec.md

---

## Functional Requirements

| ID | Requirement | Clarity | Testable | Notes |
|----|-------------|---------|----------|-------|
| FR-001 | `specflow workflow design` spawns Claude CLI with `/flow.design` | Clear | Yes | Core command |
| FR-002 | `--json` flag enables streaming NDJSON output | Clear | Yes | Standard pattern |
| FR-003 | Emit 8 event types during execution | Clear | Yes | Events defined in spec |
| FR-004 | Queue AskUserQuestion to `.specify/questions.json` | Clear | Yes | File location specified |
| FR-005 | `specflow workflow answer` responds to queued questions | Clear | Yes | Command signature defined |
| FR-006 | `--phase <name>` limits to specific sub-phase | Clear | Yes | Valid names enumerated |
| FR-007 | `specflow workflow status` shows workflow state | Clear | Yes | Output schema needed |
| FR-008 | Validate Claude CLI before spawning | Clear | Yes | Error message specified |
| FR-009 | Update state via CLI, not direct edits | Clear | Yes | Constitution compliance |
| FR-010 | Human output follows Three-Line Rule | Clear | Yes | Constitution compliance |

---

## User Stories Coverage

| Story | Priority | Requirements Covered | Gap Analysis |
|-------|----------|---------------------|--------------|
| US1 - Dashboard runs design | P1 | FR-001, FR-002, FR-003 | Complete |
| US2 - Async questions | P2 | FR-004, FR-005 | Complete |
| US3 - Specific phase | P3 | FR-006 | Complete |
| US4 - Check status | P4 | FR-007 | Complete |

---

## Edge Cases Coverage

| Edge Case | Requirement | Status |
|-----------|-------------|--------|
| Claude CLI not installed | FR-008 | Covered |
| Claude CLI crashes | Not covered | Add FR-011? |
| Duplicate answer attempt | FR-005 | Implicit - needs explicit handling |
| Context window exceeded | Not covered | Add FR-012? |

---

## Suggested Additions

- **FR-011**: System MUST set workflow status to "failed" when Claude CLI process exits with non-zero code
- **FR-012**: System SHOULD emit error event with context limit suggestion when Claude reports token overflow

---

## Schema Completeness

| Entity | Fields Defined | Validation | Notes |
|--------|----------------|------------|-------|
| WorkflowEvent | type, timestamp, data | Zod schema needed | 8 event types |
| Question | id, content, options, status, times, answer | Zod schema needed | Queue file format |
| QuestionQueue | workflowId, questions | Zod schema needed | Top-level structure |

---

## Acceptance Criteria Mapping

| Success Criteria | Test Method | Automation |
|------------------|-------------|------------|
| SC-001: Same artifacts as /flow.design | Compare file outputs | Vitest |
| SC-002: All event types emitted | Parse JSON stream | Vitest |
| SC-003: Async question answering | Full workflow test | Vitest |
| SC-004: --phase flag works | Targeted test | Vitest |
| SC-005: Missing CLI error | Mock test | Vitest |
