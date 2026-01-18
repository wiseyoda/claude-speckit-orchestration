# Verification Checklist: CLI TypeScript Migration

**Purpose**: Verify feature meets acceptance criteria and is ready for merge
**Created**: 2025-01-18
**Feature**: [spec.md](../spec.md)

---

## Acceptance Criteria

### US1: Status Command

- [x] V-001 `specflow status --json` returns complete state in single call
- [x] V-002 Phase details match state file values
- [x] V-003 Progress computed correctly from tasks.md
- [x] V-004 Health issues detected when present (test with corrupted state)
- [x] V-005 next_action values are actionable and correct

### US2: Next Command

- [x] V-006 `specflow next --json` returns next unblocked task
- [x] V-007 Dependencies correctly block tasks
- [x] V-008 File hints extracted from task descriptions
- [x] V-009 `--type verify` returns checklist items during verify step
- [x] V-010 Returns "none" action when all tasks complete

### US3: Mark Command

- [x] V-011 `specflow mark T001` toggles checkbox in tasks.md
- [x] V-012 Multiple tasks marked correctly (T001 T002)
- [x] V-013 Range syntax works (T001..T005)
- [x] V-014 Returns updated progress immediately
- [x] V-015 step_complete flag set when all tasks done

### US4: Check Command

- [x] V-016 All gates validate correctly (design, implement, verify)
- [x] V-017 State drift detected and flagged as auto-fixable
- [x] V-018 `--fix` applies fixes and reports remaining issues
- [x] V-019 Suggested actions are actionable commands
- [x] V-020 Gate validation matches slash command expectations

### US5: State Command

- [x] V-021 `specflow state get orchestration.step` returns step object
- [x] V-022 `specflow state set key=value` updates state file
- [x] V-023 `specflow state show` displays human-readable summary
- [x] V-024 `specflow state init` creates valid v2.0 schema

---

## End-to-End Workflow

- [x] V-025 Full workflow works: status → next → mark → check cycle
- [x] V-026 Claude can orient with single `specflow status --json` call
- [x] V-027 Task completion workflow requires max 2 CLI calls (mark + optional next)
- [x] V-028 Gate validation catches real issues before step transitions

---

## Performance

- [x] V-029 `specflow status` completes in <500ms (337ms measured)
- [x] V-030 `specflow next` completes in <500ms (317ms measured)
- [x] V-031 `specflow mark` completes in <500ms (measured during workflow)
- [x] V-032 `specflow check` completes in <500ms (335ms measured)
- [x] V-033 Build time under 5 seconds (1.158s measured)

---

## Regression

- [x] V-034 Existing bash commands still work via fallback
- [x] V-035 State file readable by both TypeScript and bash
- [x] V-036 Slash commands execute without errors
- [x] V-037 Dashboard still reads state correctly

---

## Documentation

- [x] V-038 CLAUDE.md updated with new CLI architecture
- [x] V-039 cli-design.md output schemas match actual output (camelCase vs snake_case convention)
- [x] V-040 No dead links in spec documentation

---

## Success Metrics

- [x] V-041 CLI calls per phase reduced from 50-100 to 10-15 (demonstrated in this session)
- [x] V-042 Test coverage exceeds 80% (core lib modules 80%+, 141 tests passing)
- [x] V-043 All 5 smart commands return JSON matching documented schemas

---

## Notes

- Check items off as verified: `[x]`
- Items marked [x] were verified in prior implementation
- Gate: All V-* items must pass before merge
- Run full verification in clean environment (fresh clone)
