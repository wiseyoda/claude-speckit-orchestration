# Tasks: Sample Feature Implementation

## Progress Dashboard

> Last updated: 2026-01-18 | Run `specflow tasks sync` to refresh

| Phase | Status | Progress |
|-------|--------|----------|
| 1. Setup | COMPLETE | 6/6 |
| 2. Core Implementation | IN PROGRESS | 2/5 |
| 3. User Story 1 - Auth (Priority: P1) | PENDING | 0/4 |
| 4. User Story 2 - API (Priority: P2) | PENDING | 0/3 |
| Polish & Documentation | DONE | 3/3 |

**Overall**: 11/21 (52%) | **Current**: Phase 2 (Core Implementation)

### Quick Status

- ✅ T001 Create project directory structure
- ✅ T002 [P] Configure package.json
- ⬜ T007 Create main entry point
- ⏸️ T099 Mobile support (deferred to next phase)

---

**Input**: Design documents from `/specs/0080-sample-feature/`
**Prerequisites**: plan.md (required), spec.md (required)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

**Purpose**: Project initialization and basic structure

- [x] T001 Create project directory structure
- [x] T002 [P] Configure package.json with commander, chalk, zod dependencies
- [x] T003 [P] Configure tsconfig.json for ESM output
- [x] T004 [P] Configure tsup.config.ts for CLI build
- [x] T005 [P] Configure vitest.config.ts for testing
- [x] T006 Create src/index.ts CLI entry point with Commander.js

---

## Phase 2: Core Implementation

**Purpose**: Main feature implementation

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create src/lib/parser.ts - parse markdown into structured data
- [x] T008 [P] Create src/lib/utils.ts - utility functions
- [ ] T009 Create src/lib/context.ts - resolve current feature directory (After T007)
- [ ] T010 [P] Create src/lib/health.ts - health check logic (issues detection)
- [ ] T011 Add tests/lib/parser.test.ts with fixture files

### Sub-tasks for Parser

- [ ] T011a [P] Add tests/lib/utils.test.ts with fixture files
- [ ] T011b [P] Add tests/lib/context.test.ts with fixture files
- [ ] T011c [P] Add tests/lib/health.test.ts with fixture files

**Checkpoint**: Foundation ready - all parsers working with tests

---

## Phase 3: User Story 1 - Auth Command (Priority: P1)

**Goal**: Complete authentication in single call
**Independent Test**: `specflow auth --json` returns valid token

- [ ] T012 [US1] Create src/commands/auth.ts command skeleton
- [ ] T013 [US1] Implement token storage in `~/.specflow/credentials.json`
- [ ] T014 [US1] Add --json flag for structured output per cli-design.md schema
- [ ] T015 [US1] Add tests/commands/auth.test.ts with fixtures (Requires T012, T013)

**Checkpoint**: `specflow auth --json` returns complete state

---

## Phase 4: User Story 2 - API Integration (Priority: P2)

**Goal**: External API calls with retry logic
**Independent Test**: `specflow api call endpoint` returns response

- [ ] T016 [P1] [US2] [FR-002] Create src/lib/api-client.ts with retry logic
- [ ] T017 [P2] [US2] [FR-003] Implement rate limiting in api-client.ts
- [ ] T018 [US2] Add tests/lib/api-client.test.ts (Depends on T016)

**Checkpoint**: API calls work with automatic retries

---

## Phase 5: Polish & Documentation ✅ DONE

**Purpose**: Final touches and documentation

- [x] T019 [P] Add JSDoc comments to public APIs
- [x] T020 Update CLAUDE.md with new CLI architecture notes
- [x] T021 [P] Run full test suite, verify >80% coverage
- [~] T022 Mobile app documentation (deferred to next release)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ✅ Complete
- **Core (Phase 2)**: BLOCKS all user stories - must complete first
- **User Stories (Phases 3-4)**: All depend on Core
- **Polish (Phase 5)**: Depends on all user stories

### User Story Dependencies

- **US1 (auth)**: Needs parser.ts, context.ts
- **US2 (api)**: Needs utils.ts, health.ts

### Parallel Opportunities

- T002, T003, T004, T005 - setup tasks can run in parallel
- After Core: US1 and US2 can proceed in parallel if desired

---

## Implementation Strategy

### Recommended Order

1. Complete Phase 2 (Core) - unblocks everything
2. Implement US1 (auth) - most used command
3. Implement US2 (api) - integration
4. Polish - tests, docs

### MVP Definition

After completing through Phase 4 (US2):
- Core workflow functional, can be tested end-to-end

---

## Files Modified by Task

| File | Tasks |
|------|-------|
| src/lib/parser.ts | T007 |
| src/lib/utils.ts | T008 |
| src/lib/context.ts | T009 |
| tests/lib/parser.test.ts | T011, T011a |
| src/commands/auth.ts | T012, T013, T014 |

---

## Notes

- All tasks modify TypeScript files
- Focus on constitution compliance: Three-Line Output Rule
- Use [~] for deferred items
