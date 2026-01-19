# Implementation Checklist: Workflow Decomposition - Design Phase

**Phase**: `1047-workflow-decomposition-design`
**Created**: 2026-01-18
**Purpose**: Guide implementation quality during development

---

## Requirements Quality

### Requirement Completeness

- [x] I-001 All 10 functional requirements (FR-001 to FR-010) have corresponding tasks
- [x] I-002 Each user story has at least one task implementing its core functionality
- [x] I-003 Edge cases from spec.md have handling in tasks (Claude CLI missing, crashes, duplicates)

### Requirement Clarity

- [x] I-004 Event types are explicitly defined in code (8 types enumerated)
- [x] I-005 Question queue JSON schema matches spec.md definition
- [x] I-006 `--phase` flag accepts only valid values: discover, specify, plan, tasks, checklists

### Scenario Coverage

- [x] I-007 Happy path: design workflow runs, artifacts created, events streamed
- [x] I-008 Question path: question queued, answered, workflow continues
- [x] I-009 Error path: Claude CLI missing shows helpful error
- [x] I-010 Partial path: `--phase plan` regenerates only plan.md

---

## Technical Quality

### Code Standards

- [x] I-011 All functions have explicit return types (TypeScript strict)
- [x] I-012 No `any` types - use `unknown` with type guards if needed
- [x] I-013 Zod schemas validate all external data (Claude events, question file)
- [x] I-014 Commands follow existing patterns in packages/cli/src/commands/

### Testing

- [x] I-015 Unit tests exist for each command (design, answer, status)
- [x] I-016 Tests use memfs for filesystem isolation
- [x] I-017 Mock Claude CLI process for spawn tests

### Constitution Compliance

- [x] I-018 Three-Line Rule: human output puts critical info in first 3 lines
- [x] I-019 CLI Over Direct Edits: state changes use `specflow state set`
- [x] I-020 Helpful Errors: all error messages include actionable guidance

---

## Integration Quality

### Command Registration

- [x] I-021 `workflowCommand` exported from index.ts
- [x] I-022 Commands show in `specflow --help` output
- [x] I-023 `--json` flag works on all workflow subcommands

### Package Dependencies

- [x] I-024 @specflow/shared exports workflow schemas
- [x] I-025 @specflow/cli depends on @specflow/shared
- [x] I-026 No circular dependencies introduced

---

## Before Moving to Verify

- [x] I-027 All tasks in tasks.md marked complete
- [x] I-028 `pnpm --filter @specflow/cli build` succeeds
- [x] I-029 `pnpm --filter @specflow/cli test` passes
- [x] I-030 `specflow check --gate implement` passes
