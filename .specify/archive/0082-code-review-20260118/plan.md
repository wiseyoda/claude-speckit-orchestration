# Implementation Plan: Code Review 20260118

**Branch**: `0082-code-review-20260118` | **Date**: 2026-01-18 | **Spec**: [spec.md](spec.md)

## Summary

Implement 59 approved findings from full codebase review. Organized by priority: dead code removal first (largest impact), then error handling, refactoring, security hardening, missing features, and documentation.

## Technical Context

**Language/Version**: TypeScript 5.x with ESM modules
**Primary Dependencies**: Commander.js, Zod, Vitest
**Storage**: JSON state files, Markdown artifacts
**Testing**: Vitest unit tests (`pnpm test`)
**Target Platform**: macOS/Linux CLI
**Project Type**: Monorepo (packages/cli, packages/shared)
**Constraints**: Must maintain backward compatibility for existing specflow commands

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Developer Experience First | Pass | Improvements enhance DX |
| IIa. TypeScript for CLI | Pass | All changes in TypeScript |
| III. CLI Over Direct Edits | Pass | Not changing CLI patterns |
| IV. Simplicity Over Cleverness | Pass | Refactoring reduces complexity |
| V. Helpful Error Messages | Pass | BP001, BP008 improve errors |
| VI. Graceful Degradation | Pass | No changes to degradation |
| VII. Three-Line Output Rule | Pass | BP006 aligns output |

## Project Structure

### Documentation (this feature)

```text
specs/0082-code-review-20260118/
├── discovery.md
├── spec.md
├── requirements.md
├── plan.md                    # This file
├── tasks.md
└── checklists/
    ├── implementation.md
    └── verification.md
```

### Source Code (affected files)

```text
packages/cli/src/
├── commands/
│   ├── check.ts              # BP002, HD006
│   ├── mark.ts               # MF001, MF002, HD007
│   ├── next.ts               # HD010
│   ├── status.ts             # RF002, RF004, RF005, OE008, OE012
│   ├── phase/
│   │   ├── add.ts            # BP001
│   │   ├── open.ts           # RF001, HD003, HD009
│   │   └── close.ts          # RF001, RF007
│   └── state/
│       └── set.ts            # HD003
├── lib/
│   ├── backlog.ts            # MF007, OC008
│   ├── checklist.ts          # BP004, RF010, OC006
│   ├── context.ts            # BP005, RF009, OC008, OC009
│   ├── errors.ts             # BP008
│   ├── health.ts             # RF003, HD005, OC004
│   ├── history.ts            # OC002
│   ├── markdown.ts           # RF008 (NEW)
│   ├── output.ts             # BP006, OC005
│   ├── paths.ts              # OE003
│   ├── registry.ts           # BP004, OC001
│   ├── roadmap.ts            # HD001, HD011, OC003
│   ├── specs.ts              # (minor)
│   ├── state.ts              # BP004, HD001, HD004, HD014
│   └── tasks.ts              # RF006, HD010, HD015

bin/
└── specflow                  # BP007, OD007

scripts/
└── bash/                     # OC007 (DELETE ALL)

.specify/memory/
├── testing-strategy.md       # OD008
└── tech-stack.md             # OD010

CLAUDE.md                     # OD002, OD003
README.md                     # OD001
commands/
└── flow.orchestrate.md       # OD004, OD009
```

## Implementation Strategy

### Phase 1: Dead Code Removal (OC)

Start with largest impact, lowest risk:
1. Verify no dependencies on scripts/bash/
2. Delete scripts/bash/ directory (18k lines)
3. Remove unused exports from lib files
4. Run tests to confirm nothing breaks

### Phase 2: Error Handling (BP)

Foundation for other improvements:
1. Replace generic Error with SpecflowError
2. Add justification comments to type assertions
3. Document silent catch blocks
4. Standardize output patterns

### Phase 3: Refactoring (RF)

Reduce complexity:
1. Split health.ts collectIssues() (RF003 - highest impact)
2. Extract helpers for repeated patterns
3. Create lib/markdown.ts for shared parsing
4. Apply early returns to reduce nesting

### Phase 4: Security Hardening (HD)

Add protection:
1. Implement atomic file operations (HD004)
2. Add Zod validation to CLI inputs (HD003)
3. Sanitize branch names (HD009)
4. Add try/catch with context to file operations

### Phase 5: Missing Features (MF)

Complete implementations:
1. Implement --blocked option in mark.ts
2. Add blockedReason to Task interface
3. Fix autoFixable flags

### Phase 6: Documentation (OD)

Update docs:
1. Fix README links
2. Update CLAUDE.md command table
3. Update flow.orchestrate.md flags
4. Update memory documents

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| RF003 breaks health checks | Add unit tests before splitting |
| OC007 breaks install.sh | Grep for dependencies first |
| HD004 causes data loss | Test atomic ops thoroughly |
| Refactoring creates regressions | Run full test suite after each phase |

## Dependencies

```
OC007 (bash deletion) → verify no dependencies first
RF008 (lib/markdown.ts) → before RF003, RF010
BP001, BP008 (errors) → before HD* (hardening uses errors)
MF002 (Task interface) → before MF001 (--blocked implementation)
```
