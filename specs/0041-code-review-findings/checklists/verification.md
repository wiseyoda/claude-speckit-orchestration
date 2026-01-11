# Verification Checklist: Code Review Findings

**Phase**: 0041 - Code Review Findings
**Purpose**: Post-completion verification for /speckit.verify
**Created**: 2026-01-11

---

## Critical Checks (Must Pass)

### SC-001: All Findings Addressed
- [ ] Review 36 findings in `.specify/reviews/review-20260111.md`
- [ ] Verify 33 findings implemented (36 - 3 deferred)
- [ ] Confirm 3 deferred items have documented rationale:
  - [ ] OE001: Migrate roadmap to JSON (deferred: architectural, v3.0)
  - [ ] OE002: Split speckit-state.sh (deferred: architectural, v3.0)
  - [ ] OD006: Split speckit.memory.md (deferred: low impact)

### SC-002: Shellcheck Compliance
- [ ] Run: `shellcheck scripts/bash/*.sh`
- [ ] No errors on modified files
- [ ] No new warnings introduced

### SC-003: Test Suite Passes
- [ ] Run: `./tests/test-runner.sh`
- [ ] All existing tests pass
- [ ] No test regressions

### SC-004: No Placeholder URLs
- [ ] Run: `grep -r "YOUR_USERNAME" README.md`
- [ ] Returns no matches
- [ ] All GitHub URLs use actual repo owner

### SC-005: No Deleted Script References
- [ ] Run: `grep -r "check-prerequisites.sh" . --include="*.md" --include="*.sh"`
- [ ] Returns no matches (except review doc)
- [ ] Run: `grep -r "create-new-feature.sh" . --include="*.md"`
- [ ] Returns no matches

### SC-006: Multi-Runner Gate
- [ ] `speckit gate` detects pytest (Python project)
- [ ] `speckit gate` detects go test (Go project)
- [ ] `speckit gate` detects bats (Bash project)
- [ ] `speckit gate` falls back to npm test (Node project)

---

## User Story Verification

### US1: Reliable Script Execution
- [ ] No eval() patterns in codebase
- [ ] All scripts have `set -euo pipefail`
- [ ] Temp files cleaned up on error (trap handlers)
- [ ] User input sanitized before jq/grep

### US2: Accurate Documentation
- [ ] README install commands work
- [ ] speckit.specify.md references current commands
- [ ] CLAUDE.md architecture diagram complete
- [ ] ROADMAP status icons match legend

### US3: Clean Codebase
- [ ] Legacy check-prerequisites.sh deleted (both locations)
- [ ] No function exceeds 150 lines
- [ ] Shared validation function exists in lib/common.sh
- [ ] Unused helpers removed

### US4: Extended CLI Features
- [ ] Gate supports multiple test runners
- [ ] Backlog parsing handles priority column

---

## File-Level Verification

### Scripts Modified
| File | Verification |
|------|-------------|
| lib/common.sh | sanitize_for_pattern() exists |
| lib/common.sh | validate_phase_number() exists |
| speckit-state.sh | No debug leftovers |
| speckit-state.sh | cmd_migrate split into functions |
| speckit-state.sh | cmd_infer split into functions |
| speckit-state.sh | Trap cleanup on temp files |
| speckit-roadmap.sh | Placeholder goal validation |
| speckit-roadmap.sh | grep -F for literals |
| speckit-roadmap.sh | Status stored as text |
| speckit-gate.sh | detect_test_runner() exists |
| speckit-gate.sh | Supports pytest, go test, bats |
| speckit-feature.sh | Input validation checks |
| speckit-context.sh | Quoted parameter expansions |
| speckit-import.sh | Error handling on external cmds |

### Documentation Modified
| File | Verification |
|------|-------------|
| README.md | No YOUR_USERNAME placeholders |
| README.md | Customizing Templates section exists |
| README.md | Memory subcommands match CLI |
| CLAUDE.md | Architecture includes lib/*.sh |
| CLAUDE.md | No init-*.md references |
| ROADMAP.md | Status icons match legend |
| speckit.specify.md | References speckit feature create |

### Files Deleted
| File | Verification |
|------|-------------|
| scripts/bash/check-prerequisites.sh | Does not exist |
| .specify/scripts/bash/check-prerequisites.sh | Does not exist |

---

## Final Sign-Off

- [ ] All 42 tasks marked complete in tasks.md
- [ ] `speckit doctor` shows no warnings
- [ ] Git working tree clean (all changes committed)
- [ ] Branch ready for merge to main

---

## Verification Commands

```bash
# Run all critical checks
shellcheck scripts/bash/*.sh
./tests/test-runner.sh
grep -r "YOUR_USERNAME" README.md
grep -r "check-prerequisites.sh" . --include="*.md" --include="*.sh"
grep -r "create-new-feature.sh" . --include="*.md"
speckit doctor

# Verify file deletions
ls scripts/bash/check-prerequisites.sh 2>&1  # Should fail
ls .specify/scripts/bash/check-prerequisites.sh 2>&1  # Should fail

# Verify new functions
grep -n "sanitize_for_pattern" scripts/bash/lib/common.sh
grep -n "validate_phase_number" scripts/bash/lib/common.sh
grep -n "detect_test_runner" scripts/bash/speckit-gate.sh
```
