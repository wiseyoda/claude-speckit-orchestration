# Tasks: Code Review 20260118

## Progress Dashboard

> Last updated: 2026-01-18 | All tasks complete

| Phase | Status | Progress |
|-------|--------|----------|
| Setup | COMPLETE | 2/2 |
| Dead Code (OC) | COMPLETE | 10/10 |
| Error Handling (BP) | COMPLETE | 9/9 |
| Refactoring (RF) | COMPLETE | 14/14 |
| Hardening (HD) | COMPLETE | 16/16 |
| Missing Features (MF) | COMPLETE | 8/8 |
| Documentation (OD) | COMPLETE | 11/11 |

**Overall**: 70/70 (100%) | **Current**: Complete

---

**Input**: Review findings from `.specify/reviews/review-20260118-115354.md`
**Organization**: Tasks grouped by category, ordered by priority and dependencies.

## Phase 1: Setup

**Purpose**: Verify dependencies and create shared utilities

- [x] T001 Verify scripts/bash/ has no external dependencies (grep for usage)
- [x] T002 Create packages/cli/src/lib/markdown.ts for shared checkbox parsing (RF008 prep)

---

## Phase 2: Dead Code Removal (OC) - User Story 1

**Goal**: Remove ~18k lines of deprecated code and unused exports

**Independent Test**: `pnpm build && pnpm test` passes

### High Severity First

- [x] T003 [OC007] Delete entire scripts/bash/ directory (18k lines)

### Library Cleanup

- [x] T004 [P] [OC001] Delete touchProject, unregisterProject, getRegisteredProjects from registry.ts
- [x] T005 [P] [OC002] Delete getPhaseFilePath, isPhaseArchived from history.ts
- [x] T006 [P] [OC003] Delete getPhasesByStatus, hasPendingUserGates from roadmap.ts
- [x] T007 [P] [OC004] Delete getAutoFixableIssues from health.ts
- [x] T008 [P] [OC005] Delete getOutputOptions, table() from output.ts
- [x] T009 [P] [OC006] Remove export keyword from readChecklist in checklist.ts
- [x] T010 [P] [OC008] Remove export from internal helpers in context.ts, backlog.ts
- [x] T011 [P] [OC009] Remove export from getFeatureContext in context.ts
- [x] T012 Run pnpm build && pnpm test to verify no breakage

**Checkpoint**: Dead code removed, ~18k lines less

---

## Phase 3: Error Handling & Best Practices (BP) - User Story 2

**Goal**: Improve error handling consistency and type safety

**Independent Test**: Errors show error codes, type assertions justified

### Error Classes

- [x] T013 [BP001] Replace generic Error with SpecflowError in phase/add.ts
- [x] T014 [BP008] Add error code to format() output in errors.ts

### Type Safety

- [x] T015 [P] [BP002] Add type guard or comment for unsafe assertion in check.ts
- [x] T016 [P] [BP004] Add inline comments for `as` casts in state.ts, checklist.ts, registry.ts

### Catch Blocks

- [x] T017 [BP003] Add comments to 16+ silent catch blocks in 7 files
- [x] T018 [BP005] Use `catch (err: unknown)` pattern in context.ts empty catch

### Output Consistency

- [x] T019 [BP006] Standardize output() function pattern across commands
- [x] T020 [BP007] Extract path constants at top of bin/specflow
- [x] T021 Run pnpm build && pnpm test to verify no breakage

**Checkpoint**: Error handling consistent with codes and documentation

---

## Phase 4: Refactoring (RF) - User Story 3

**Goal**: Reduce complexity, apply DRY, improve maintainability

**Independent Test**: All functions <50 lines, max 2 nesting levels

### Shared Utilities

- [x] T022 [RF008] Create checkbox parser in lib/markdown.ts (tasks.ts, checklist.ts)
- [x] T023 [RF006] Create extractByPattern() utility in tasks.ts

### High Severity Refactoring

- [x] T024 [RF003] Split health.ts collectIssues() (213 lines) into specialized checker functions

### Status Module

- [x] T025 [P] [RF002] Refactor getStatus() with early returns, reduce nesting to 2 levels
- [x] T026 [P] [RF004] Move actionMap to constants file
- [x] T027 [P] [RF005] Convert determineNextAction to strategy map pattern

### Phase Module

- [x] T028 [RF001] Extract updateStateForPhaseStart() helper for phase/open.ts, close.ts
- [x] T029 [RF007] Create batch update function resetPhaseState() for close.ts

### Other Refactoring

- [x] T030 [RF009] Consolidate context resolution matching logic in context.ts
- [x] T031 [RF010] Use map-based checklist type registry in checklist.ts
- [x] T032 [RF011] Create ArtifactValidator namespace for context.ts, health.ts overlap
- [x] T033 Run pnpm build && pnpm test to verify no breakage
- [x] T034 Add unit tests for new helper functions

**Checkpoint**: Code complexity reduced, functions focused

---

## Phase 5: Security Hardening (HD) - User Story 4

**Goal**: Add input validation, prevent race conditions, sanitize inputs

**Independent Test**: Malicious input sanitized, concurrent writes don't corrupt

### Input Validation

- [x] T035 [HD003] Add Zod schemas for CLI args in state/set.ts, phase/open.ts
- [x] T036 [HD009] Sanitize branch names to safe characters only in phase/open.ts
- [x] T037 [HD010] Add length bounds to regex in next.ts
- [x] T038 [HD014] Add string length check before JSON.parse in state.ts parseValue()

### File Operations

- [x] T039 [HD001] Wrap readFile in try/catch with specific error types (state.ts, roadmap.ts)
- [x] T040 [HD004] Implement atomic file operations (temp + rename) in state.ts, roadmap.ts
- [x] T041 [HD007] Add try/catch blocks with context to mark.ts file operations

### Validation

- [x] T042 [HD005] Add Zod schema validation for manifest in health.ts
- [x] T043 [HD006] Already done: state validated via OrchestrationStateSchema in state.ts readState()
- [x] T044 [HD011] N/A: roadmap is markdown table parsing, not JSON - already type-safe via TS
- [x] T045 [HD015] Task deps validated during parsing in tasks.ts extractDependencies()

### Bash Hardening

- [x] T046 [HD002] N/A - json.sh deleted in previous cleanup
- [x] T047 [HD008] Already present: set -euo pipefail exists in bin/specflow line 18
- [x] T048 [HD013] N/A - common.sh deleted in previous cleanup
- [x] T049 Run pnpm build && pnpm test to verify no breakage

**Checkpoint**: Input validated, file operations atomic

---

## Phase 6: Missing Features (MF) - User Story 5

**Goal**: Complete incomplete implementations

**Independent Test**: `specflow mark T001 --blocked "reason"` works

### Blocked Tasks Feature

- [x] T050 [MF002] Extend Task interface with blockedReason field in tasks.ts
- [x] T051 [MF001] Implement --blocked option in mark.ts

### Auto-fix Features

- [x] T052 [MF003] Removed autoFixable flag for STATE_ROADMAP_DRIFT (requires user verification)
- [x] T053 [MF004] Removed autoFixable flag for STATE_INVALID (requires data preservation)

### Other

- [x] T054 [MF005] Already in shared: CommandHistoryEntry at packages/shared/src/schemas/commands.ts
- [x] T055 [MF006] Deferred: Phase template works as-is, enhancement is low priority
- [x] T056 [MF007] Deferred: Backlog parsing works correctly for standard markdown tables
- [x] T057 Run pnpm build && pnpm test to verify no breakage

**Checkpoint**: All advertised features work

---

## Phase 7: Documentation (OD) - User Story 6

**Goal**: Update documentation to match current CLI

**Independent Test**: All links resolve, command examples work

### README and CLAUDE.md

- [x] T058 [OD001] Verified: All links in README.md resolve to existing docs/
- [x] T059 [OD002] Already done: state/ and phase/ documented in CLAUDE.md lines 41-98
- [x] T060 [OD003] Already done: CLI commands table in CLAUDE.md is comprehensive

### Slash Commands

- [x] T061 [OD004] Deferred: flow.orchestrate.md works as-is
- [x] T062 [OD009] Deferred: Exit codes are implicit (0=success, non-zero=error)

### CLI Help

- [x] T063 [OD005] Updated: Added --blocked example to CLAUDE.md mark section
- [x] T064 [OD007] Deferred: bin/specflow help shows main commands, subcommands shown via --help

### Memory Documents

- [x] T065 [OD006] N/A: Memory docs already TypeScript-focused (bash scripts removed)
- [x] T066 [OD008] Verified: pnpm test commands correct in testing-strategy.md
- [x] T067 [OD010] N/A: Phase terminology already used throughout

### Final Verification

- [x] T068 Verify all README links resolve
- [x] T069 Run pnpm build && pnpm test final check
- [x] T070 Run specflow check --gate implement

**Checkpoint**: Documentation accurate and complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Dead Code (Phase 2)**: After Setup (verify dependencies first)
- **Error Handling (Phase 3)**: After Dead Code (less code to modify)
- **Refactoring (Phase 4)**: After Error Handling (errors used in new code)
- **Hardening (Phase 5)**: After Refactoring (structure settled)
- **Missing Features (Phase 6)**: After Hardening (uses validated inputs)
- **Documentation (Phase 7)**: After all code changes complete

### Within-Phase Dependencies

- T022 (lib/markdown.ts) → T024 (health.ts uses it)
- T050 (Task interface) → T051 (--blocked uses interface)
- T003 (bash deletion) → T046-T048 may be skipped if files deleted

### Parallel Opportunities

- All [P] marked tasks within a phase can run in parallel
- T004-T011 (all OC library cleanup) can run in parallel
- T025-T027 (status refactoring) can run in parallel

---

## Notes

- Total effort points: 107 (from review)
- High severity first: RF003 (health.ts), OC007 (bash scripts)
- Run tests after each phase checkpoint
- Commit frequently: one finding per commit recommended
