# Implementation Tasks: Constitution Compliance

**Phase**: 0060
**Created**: 2026-01-11
**Status**: In Progress

---

## Task Summary

| Category | Tasks | Status |
|----------|-------|--------|
| Setup | 1 | Pending |
| Critical Fixes | 2 | Pending |
| Foundation | 3 | Pending |
| Hardcoded Paths | 5 | Pending |
| Three-Line Rule | 26 | Pending |
| POSIX Compliance | 2 | Pending |
| Library Fixes | 4 | Pending |
| Slash Commands | 7 | Pending |
| Templates | 6 | Pending |
| Documentation | 2 | Pending |
| **Total** | **58** | **0% Complete** |

---

## Setup Tasks

- [x] T001 [P1] [Setup] Create feature branch and initialize phase state

---

## US3: Working CLI Commands (Critical Fixes)

- [x] T002 [P1] [US3] Fix LIB008: Remove 'phase' from slash-command warning in `bin/speckit:337`
- [x] T003 [P1] [US4] Delete duplicate templates directory `.specify/templates/`

---

## Foundation Tasks (common.sh)

- [x] T004 [P1] [Foundation] Add `get_speckit_registry()` helper to `scripts/bash/lib/common.sh`
- [x] T005 [P1] [Foundation] Add `print_summary()` helper for three-line output to `scripts/bash/lib/common.sh`
- [x] T006 [P2] [Foundation] Add `sed_in_place()` helper for POSIX sed to `scripts/bash/lib/common.sh`

---

## Hardcoded Path Remediation

- [x] T007 [P2] [US4] Update `scripts/bash/speckit-doctor.sh` to use `get_speckit_system_dir()`
- [x] T008 [P2] [US4] Update `scripts/bash/speckit-detect.sh` to use `get_speckit_system_dir()`
- [x] T009 [P2] [US4] Update `scripts/bash/speckit-state.sh` to use `get_speckit_registry()`
- [x] T010 [P2] [US4] Update `scripts/bash/speckit-templates.sh` to use `get_speckit_system_dir()`
- [x] T011 [P2] [US4] Update `scripts/bash/speckit-scaffold.sh` to use `get_speckit_system_dir()`

---

## US1: CLI Output Clarity (Three-Line Rule)

### speckit-detect.sh
- [ ] T012 [P2] [US1] Refactor `main()` in `scripts/bash/speckit-detect.sh` for three-line output

### speckit-gate.sh
- [ ] T013 [P2] [US1] Refactor `main()` in `scripts/bash/speckit-gate.sh` for three-line output

### speckit-lessons.sh
- [ ] T014 [P2] [US1] Refactor `search()` in `scripts/bash/speckit-lessons.sh` for three-line output
- [ ] T015 [P2] [US1] Refactor `list()` in `scripts/bash/speckit-lessons.sh` for three-line output

### speckit-import.sh
- [ ] T016 [P2] [US1] Refactor `import()` in `scripts/bash/speckit-import.sh` for three-line output

### speckit-context.sh
- [ ] T017 [P2] [US1] Refactor `context()` in `scripts/bash/speckit-context.sh` for three-line output

### speckit-git.sh
- [ ] T018 [P2] [US1] Refactor `branches()` in `scripts/bash/speckit-git.sh` for three-line output

### speckit-manifest.sh
- [ ] T019 [P2] [US1] Refactor `status()` in `scripts/bash/speckit-manifest.sh` for three-line output

### speckit-reconcile.sh
- [ ] T020 [P2] [US1] Refactor `main()` in `scripts/bash/speckit-reconcile.sh` for three-line output
- [ ] T021 [P2] [US1] Refactor `apply_fixes()` in `scripts/bash/speckit-reconcile.sh` for three-line output
- [ ] T022 [P2] [US1] Refactor `show_summary()` in `scripts/bash/speckit-reconcile.sh` for three-line output

### speckit-templates.sh
- [ ] T023 [P2] [US1] Refactor `cmd_check()` in `scripts/bash/speckit-templates.sh` for three-line output
- [ ] T024 [P2] [US1] Refactor `cmd_diff()` in `scripts/bash/speckit-templates.sh` for three-line output
- [ ] T025 [P2] [US1] Refactor `cmd_list()` in `scripts/bash/speckit-templates.sh` for three-line output

### speckit-phase.sh
- [ ] T026 [P2] [US1] Refactor `cmd_migrate()` in `scripts/bash/speckit-phase.sh` for three-line output

### speckit-roadmap.sh
- [ ] T027 [P2] [US1] Refactor `cmd_validate()` in `scripts/bash/speckit-roadmap.sh` for three-line output
- [ ] T028 [P2] [US1] Refactor `cmd_renumber()` in `scripts/bash/speckit-roadmap.sh` for three-line output

### speckit-memory.sh
- [ ] T029 [P2] [US1] Refactor `cmd_init()` in `scripts/bash/speckit-memory.sh` for three-line output
- [ ] T030 [P2] [US1] Refactor `cmd_list()` in `scripts/bash/speckit-memory.sh` for three-line output
- [ ] T031 [P2] [US1] Refactor `cmd_check()` in `scripts/bash/speckit-memory.sh` for three-line output

### speckit-migrate.sh
- [ ] T032 [P2] [US1] Refactor `cmd_roadmap()` in `scripts/bash/speckit-migrate.sh` for three-line output

### speckit-pdr.sh
- [ ] T033 [P2] [US1] Refactor `cmd_validate()` in `scripts/bash/speckit-pdr.sh` for three-line output

### speckit-scaffold.sh
- [ ] T034 [P2] [US1] Refactor `cmd_scaffold()` in `scripts/bash/speckit-scaffold.sh` for three-line output

### speckit-state.sh
- [ ] T035 [P2] [US1] Refactor `cmd_reconcile()` in `scripts/bash/speckit-state.sh` for three-line output
- [ ] T036 [P2] [US1] Refactor `cmd_migrate()` in `scripts/bash/speckit-state.sh` for three-line output
- [ ] T037 [P2] [US1] Refactor `cmd_infer()` in `scripts/bash/speckit-state.sh` for three-line output

---

## POSIX Compliance Fixes

- [ ] T038 [P2] [US4] Fix sed -i usage in `scripts/bash/speckit-lessons.sh:302` to use `sed_in_place()`
- [ ] T039 [P3] [US4] Add `shopt -s extglob` to `scripts/bash/speckit-feature.sh` where needed

---

## Library Fixes

- [ ] T040 [P2] [US4] Add double-source guard to `scripts/bash/lib/json.sh`
- [ ] T041 [P2] [US4] Fix unquoted variable in jq interpolation at `scripts/bash/lib/json.sh:84`
- [ ] T042 [P2] [US4] Fix json_array_append unquoted interpolation at `scripts/bash/lib/json.sh:217`
- [ ] T043 [P3] [US4] Fix arithmetic in `scripts/bash/speckit-issue.sh` to avoid set -e exit

---

## US2: Consistent Command Behavior (Slash Commands)

- [ ] T044 [P2] [US2] Update `commands/speckit.specify.md` to remove setup-plan.sh reference
- [ ] T045 [P2] [US2] Update `commands/speckit.plan.md` to remove deprecated script references
- [ ] T046 [P2] [US2] Remove update-agent-context.sh references from slash commands
- [ ] T047 [P2] [US2] Update `commands/speckit.verify.md` to use `speckit tasks mark`
- [ ] T048 [P2] [US2] Update `commands/speckit.backlog.md` to use proper CLI commands
- [ ] T049 [P2] [US2] Verify `commands/speckit.phase.md` uses speckit pdr commands (already updated)
- [ ] T050 [P2] [US2] Update `commands/speckit.init.md` to use `speckit state set`

---

## US4: Single Template Source (Templates)

- [ ] T051 [P2] [US4] Update `templates/backlog-template.md` to 4-digit ABBC format
- [ ] T052 [P2] [US4] Update `templates/deferred-template.md` to 4-digit ABBC format
- [ ] T053 [P2] [US4] Update `templates/plan-template.md` to 4-digit ABBC format
- [ ] T054 [P2] [US4] Update `templates/spec-template.md` to 4-digit ABBC format
- [ ] T055 [P2] [US4] Update `templates/tasks-template.md` to 4-digit ABBC format
- [ ] T056 [P3] [US4] Clean `templates/openapi-template.yaml` of project-specific references

---

## Documentation

- [ ] T057 [P2] [US4] Fix README.md --check description (verify installation, not run tests)
- [ ] T058 [P3] [US4] Verify all README.md doc links exist and update if needed

---

## Dependency Graph

```
T001 (Setup)
  ↓
T002, T003 (Critical - can be parallel)
  ↓
T004, T005, T006 (Foundation - common.sh, sequential)
  ↓
T007-T011 (Paths) ← requires T004
  ↓
T012-T037 (Three-Line) ← requires T005
  ↓
T038-T039 (POSIX) ← requires T006
  ↓
T040-T043 (Libraries)
  ↓
T044-T050 (Slash Commands)
  ↓
T051-T056 (Templates)
  ↓
T057-T058 (Documentation)
```

---

## Notes

- Tasks T012-T037 (Three-Line Rule) can be done in any order after T005
- Template tasks (T049-T054) are independent of each other
- T001 is already complete (branch created during orchestration init)
