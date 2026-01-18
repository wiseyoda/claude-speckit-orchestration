# Implementation Checklist: Code Review 20260118

**Phase**: 0082-code-review-20260118
**Created**: 2026-01-18
**Purpose**: Guide implementation quality for each category

---

## Pre-Implementation

- [ ] I-001 Read full review document (.specify/reviews/review-20260118-115354.md)
- [ ] I-002 Understand effort (E), impact (I), severity (S) scoring
- [ ] I-003 Verify no uncommitted changes in working directory
- [ ] I-004 Ensure test suite passes before starting

---

## Dead Code Removal (OC)

- [ ] I-010 Grep codebase for scripts/bash/ references before deletion
- [ ] I-011 Check install.sh for bash script dependencies
- [ ] I-012 Verify each function to delete is truly unused (grep for callers)
- [ ] I-013 Remove exports atomically (one file per commit)
- [ ] I-014 Run build after each deletion to catch immediate breakage

---

## Error Handling (BP)

- [ ] I-020 Review existing SpecflowError subclasses for reuse
- [ ] I-021 Use consistent error code format (e.g., SF_PHASE_001)
- [ ] I-022 Ensure error messages include file/line context
- [ ] I-023 Document catch block intentions with "Intentional: <reason>"
- [ ] I-024 Verify type guard functions properly narrow types

---

## Refactoring (RF)

- [ ] I-030 Write tests for existing behavior BEFORE refactoring
- [ ] I-031 Keep function signatures unchanged when extracting helpers
- [ ] I-032 Apply single responsibility: one function, one purpose
- [ ] I-033 Target <50 lines per function, <100 preferred
- [ ] I-034 Use early returns to reduce nesting
- [ ] I-035 Document extracted helpers with JSDoc
- [ ] I-036 Run tests after each extraction to catch regressions

---

## Security Hardening (HD)

- [ ] I-040 Use Zod schemas matching existing patterns in codebase
- [ ] I-041 Atomic file ops: write to .tmp, rename on success
- [ ] I-042 Handle atomic op failure (disk full, permissions)
- [ ] I-043 Sanitize to allowlist chars, not blocklist
- [ ] I-044 Add length limits before any regex or JSON.parse
- [ ] I-045 Wrap file reads in try/catch at call site, not deep in lib

---

## Missing Features (MF)

- [ ] I-050 Match existing API patterns when completing features
- [ ] I-051 Update help text to match implementation
- [ ] I-052 Add tests for newly completed features
- [ ] I-053 Consider backward compatibility for interface changes

---

## Documentation (OD)

- [ ] I-060 Use relative links for internal docs
- [ ] I-061 Test all links before committing
- [ ] I-062 Match actual command output in examples
- [ ] I-063 Keep examples concise and runnable
- [ ] I-064 Update version/date headers where applicable

---

## General Quality

- [ ] I-070 Run `pnpm lint` before committing
- [ ] I-071 Run `pnpm typecheck` before committing
- [ ] I-072 Commit one finding at a time with `fix(category): ID description`
- [ ] I-073 Reference finding ID in commit message (e.g., "RF003: split collectIssues")
- [ ] I-074 Keep changes focused - don't add unrelated improvements
