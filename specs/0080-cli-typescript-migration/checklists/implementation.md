# Implementation Checklist: CLI TypeScript Migration

**Purpose**: Verify all implementation requirements are met before proceeding to verification
**Created**: 2025-01-18
**Feature**: [spec.md](../spec.md)

---

## Code Quality

- [x] CHK001 All TypeScript files pass strict mode typecheck (`pnpm typecheck`)
- [x] CHK002 No linting errors (`pnpm lint`)
- [x] CHK003 Code follows Simplicity Over Cleverness per constitution
- [x] CHK004 All public functions have JSDoc comments
- [x] CHK005 Error handling uses typed error classes with context and next steps (NFR-006)
- [x] CHK005a Human-readable output follows Three-Line Output Rule (NFR-005)
- [x] CHK005b Edge cases EC-001 through EC-004 implemented per spec

## Commands Implementation

### status command (US1)

- [x] CHK006 Returns phase info from state file
- [x] CHK007 Computes progress from tasks.md (not stored in state)
- [x] CHK008 Returns health status with issues array
- [x] CHK009 Returns next_action suggestion
- [x] CHK010 --json flag outputs valid JSON matching cli-design.md schema

### next command (US2)

- [x] CHK011 Returns next unblocked task with dependencies
- [x] CHK012 Includes file hints extracted from task description
- [x] CHK013 Shows queue info (remaining tasks, next up)
- [x] CHK014 --type verify returns checklist items
- [x] CHK015 Returns action: "none" when all tasks complete

### mark command (US3)

- [x] CHK016 Updates checkbox in tasks.md file
- [x] CHK017 Supports multiple task IDs (T001 T002)
- [x] CHK018 Supports range syntax (T001..T005)
- [x] CHK019 Returns updated progress after marking
- [x] CHK020 Returns next task suggestion

### check command (US4)

- [x] CHK021 Validates all gates (design, implement, verify)
- [x] CHK022 Returns issues with severity and fix suggestions
- [x] CHK023 --fix auto-fixes applicable issues
- [x] CHK024 --gate flag validates specific gate
- [x] CHK025 Returns auto_fixable_count

### state command (US5)

- [x] CHK026 get returns value at dot-path
- [x] CHK027 set updates value with key=value syntax
- [x] CHK028 show displays human-readable summary
- [x] CHK029 init creates new state file with v2.0 schema

## Library Modules

- [x] CHK030 tasks.ts parses all task formats including [P] and dependencies
- [x] CHK031 roadmap.ts parses ROADMAP.md table format
- [x] CHK032 checklist.ts parses checklist markdown with CHK IDs
- [x] CHK033 context.ts resolves feature directory from phase
- [x] CHK034 health.ts detects common issues (missing files, state drift)

## Integration

- [x] CHK035 bin/specflow routes to TypeScript for new commands
- [x] CHK036 bin/specflow falls back to bash for unmigrated commands
- [x] CHK037 All commands work when invoked via bin/specflow
- [x] CHK038 Slash commands work with new CLI syntax

## Tests

- [x] CHK039 Unit tests exist for all lib modules
- [x] CHK040 Integration tests exist for all commands
- [x] CHK041 Parity tests verify TypeScript matches bash output
- [x] CHK042 Test coverage exceeds 80% (core lib modules)
- [x] CHK043 All tests pass (`pnpm test`)

---

## Notes

- Check items off as completed: `[x]`
- Items marked [x] in US5 section were completed in prior work
- Gate: All CHK items must pass before proceeding to verification
