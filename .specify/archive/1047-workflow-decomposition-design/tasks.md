# Tasks: Workflow Decomposition - Design Phase

## Progress Dashboard

> Last updated: 2026-01-18 | Run `specflow tasks sync` to refresh

| Phase | Status | Progress |
|-------|--------|----------|
| Setup | PENDING | 0/3 |
| Foundational | PENDING | 0/6 |
| US1: Dashboard Runs Design | PENDING | 0/6 |
| US2: Async Questions | PENDING | 0/5 |
| US3: Specific Phase | PENDING | 0/2 |
| US4: Workflow Status | PENDING | 0/2 |
| Polish | PENDING | 0/3 |

**Overall**: 0/27 (0%) | **Current**: None

---

**Input**: Design documents from `specs/1047-workflow-decomposition-design/`
**Prerequisites**: plan.md, spec.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project structure for workflow commands

- [x] T001 Create workflow command directory at `packages/cli/src/commands/workflow/`
- [x] T002 [P] Create workflow event types in `packages/shared/src/schemas/workflow.ts`
- [x] T003 [P] Create empty command group index at `packages/cli/src/commands/workflow/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

- [x] T004 Implement Claude CLI validator in `packages/cli/src/lib/claude-validator.ts`
- [x] T005 Implement NDJSON event parser in `packages/cli/src/lib/event-parser.ts`
- [x] T006 Implement Claude runner with process spawn in `packages/cli/src/lib/claude-runner.ts`
- [x] T007 [P] Implement question queue file operations in `packages/cli/src/lib/question-queue.ts`
- [x] T008 [P] Add WorkflowEvent Zod schema to `packages/shared/src/schemas/workflow.ts`
- [x] T009 [P] Add Question and QuestionQueue Zod schemas to `packages/shared/src/schemas/workflow.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Dashboard Runs Design (Priority: P1)

**Goal**: Dashboard runs `specflow workflow design --json` and receives streaming events

**Independent Test**: Run command and verify JSON events emitted for each phase

### Implementation

- [x] T010 [US1] Create `specflow workflow design` command in `packages/cli/src/commands/workflow/design.ts`
- [x] T011 [US1] Wire Claude runner to spawn `/flow.design` skill
- [x] T012 [US1] Implement streaming JSON output with event emission
- [x] T013 [US1] Add human-readable output following Three-Line Rule
- [x] T014 [US1] Register workflow command group in `packages/cli/src/index.ts`
- [x] T015 [US1] Add unit tests for design command in `packages/cli/tests/commands/workflow/design.test.ts`

**Checkpoint**: `specflow workflow design --json` works end-to-end

---

## Phase 4: User Story 2 - Async Question Handling (Priority: P2)

**Goal**: Questions queued to file, answered via `specflow workflow answer`

**Independent Test**: Trigger question, check queue file, answer via CLI

### Implementation

- [x] T016 [US2] Intercept AskUserQuestion tool calls in event parser
- [x] T017 [US2] Write questions to `.specify/questions.json` via question queue lib
- [x] T018 [US2] Create `specflow workflow answer` command in `packages/cli/src/commands/workflow/answer.ts`
- [x] T019 [US2] Implement answer validation and queue update
- [x] T020 [US2] Add unit tests for answer command in `packages/cli/tests/commands/workflow/answer.test.ts`

**Checkpoint**: Question flow works asynchronously

---

## Phase 5: User Story 3 - Run Specific Phase (Priority: P3)

**Goal**: `--phase` flag limits execution to specific design sub-phase

**Independent Test**: Run with `--phase plan` and verify only plan.md changes

### Implementation

- [x] T021 [US3] Add `--phase` option to design command with validation
- [x] T022 [US3] Modify Claude prompt to include phase flag when specified

**Checkpoint**: `--phase` flag works correctly

---

## Phase 6: User Story 4 - Workflow Status (Priority: P4)

**Goal**: `specflow workflow status` shows current workflow state

**Independent Test**: Start workflow, check status shows correct phase

### Implementation

- [x] T023 [US4] Create `specflow workflow status` command in `packages/cli/src/commands/workflow/status.ts`
- [x] T024 [US4] Read orchestration state and question queue for status output

**Checkpoint**: Status command shows workflow state

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Error handling, edge cases, final validation

- [x] T025 [P] Add error handling for Claude CLI crash/timeout in claude-runner.ts
- [x] T026 [P] Add edge case handling for duplicate answers in answer.ts
- [x] T027 Run `specflow check --gate implement` to validate all requirements met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup
- **US1-4 (Phases 3-6)**: All depend on Foundational
- **Polish (Phase 7)**: Depends on all user stories

### User Story Dependencies

- **US1**: Can start after Foundational - no story dependencies
- **US2**: Depends on US1 (needs event parser to intercept questions)
- **US3**: Depends on US1 (extends design command)
- **US4**: Can run parallel to US2-3 (reads state independently)

### Parallel Opportunities

- T002, T003 can run parallel in Setup
- T007, T008, T009 can run parallel in Foundational
- T025, T026 can run parallel in Polish

---

## Notes

- Commit after each logical group of tasks
- Run `pnpm --filter @specflow/cli build && pnpm --filter @specflow/cli test` after each phase
- Use memfs for filesystem isolation in tests
