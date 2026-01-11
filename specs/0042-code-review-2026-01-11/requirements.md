# Requirements Checklist: Code Review 2026-01-11

## Functional Requirements

### Best Practices (BP)
- [ ] **FR-BP001**: Remove `declare -a` from speckit-doctor.sh
- [ ] **FR-BP002**: Remove `declare -a`/`declare -A` from speckit-reconcile.sh
- [ ] **FR-BP003**: Standardize error messages to use log_error/log_warn
- [ ] **FR-BP004**: Update speckit-feature.sh to use 4-digit phases
- [ ] **FR-BP005**: Update bin/speckit help to show 4-digit phases

### Refactoring (RF)
- [ ] **FR-RF003**: Create check abstraction in speckit-doctor.sh
- [ ] **FR-RF004**: Audit and cleanup unused functions in common.sh

### Hardening (HD)
- [ ] **FR-HD001**: Add error handling to gate test runner execution
- [ ] **FR-HD002**: Add EXIT traps for temp file cleanup where missing
- [ ] **FR-HD003**: Add ADR format validation before import

### Missing Features (MF)
- [ ] **FR-MF001**: Add gate and lessons subcommands to dispatcher
- [ ] **FR-MF002**: Add cargo test and go test detection to gate
- [ ] **FR-MF003**: Add memory document status to context output

### Orphaned Code (OC)
- [ ] **FR-OC001**: Remove unused include_tasks variable from context.sh
- [ ] **FR-OC002**: Document .specify/scripts structure

### Outdated Docs (OD)
- [ ] **FR-OD001**: Update README.md CLI Reference
- [ ] **FR-OD002**: Update CLAUDE.md Key Files section
- [ ] **FR-OD003**: Add /speckit.review to README commands

## Non-Functional Requirements

- [ ] All modified scripts pass shellcheck
- [ ] No regressions in existing tests
- [ ] Consistent code style maintained
