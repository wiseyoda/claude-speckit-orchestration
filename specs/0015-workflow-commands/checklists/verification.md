# Verification Checklist: Workflow Commands

**Phase**: 0015-workflow-commands
**Created**: 2026-01-10
**Purpose**: Post-implementation verification for /speckit.verify

## Requirements Verification

### FR-001: Push Before Merge
- [ ] `/speckit.merge` pushes current branch to remote
- [ ] Unpushed commits are detected and pushed
- [ ] Push failure is handled with retry instructions

### FR-002: Task Completion Check
- [ ] Incomplete tasks trigger warning with list
- [ ] User can abort or continue with `--force`
- [ ] Complete tasks allow merge to proceed

### FR-003: State Archive
- [ ] `speckit state archive` is called after merge
- [ ] Phase is moved to history in state file
- [ ] Orchestration is reset for next phase

### FR-004: ROADMAP Update
- [ ] Phase status changes to "✅ Complete"
- [ ] Update is verified with `speckit roadmap status`

### FR-005: Backlog Summary
- [ ] Backlog items are displayed after merge
- [ ] Empty backlog shows "No items in backlog"

### FR-006-008: Backlog Triage
- [ ] `/speckit.backlog` parses backlog items
- [ ] Items are matched to phases by keyword
- [ ] Unassignable items create new phases
- [ ] ROADMAP is updated with assignments

### FR-009-010: CLI Backlog Add
- [ ] `speckit roadmap backlog add "item"` works
- [ ] Backlog section is created if missing
- [ ] Items are appended with timestamp

### FR-011: Constitution Compliance
- [ ] All scripts pass shellcheck
- [ ] `--help` flag works for new commands
- [ ] `--json` output works where applicable
- [ ] Error messages include context and next steps

## User Story Verification

### US1 - Complete Phase with Single Command
- [ ] Single `/speckit.merge` completes full workflow
- [ ] `--pr-only` creates PR without merging
- [ ] `--dry-run` shows what would happen
- [ ] Feature branch is deleted after merge
- [ ] Main branch is checked out

### US2 - Triage Backlog into Phases
- [ ] `/speckit.backlog` shows item analysis
- [ ] High-confidence matches are auto-assigned
- [ ] Low-confidence matches prompt user
- [ ] New phases are created for unassignable items

### US3 - Quick Add to Backlog
- [ ] `speckit roadmap backlog add` executes in <2 seconds
- [ ] `speckit roadmap backlog list` shows items
- [ ] `speckit roadmap backlog clear` removes items
- [ ] Special characters are properly escaped

## Edge Cases

- [ ] Merge handles network failure gracefully
- [ ] Merge conflict shows resolution instructions
- [ ] Empty backlog triage exits cleanly
- [ ] Missing gh CLI shows manual instructions

## Success Criteria Verification

- [ ] SC-001: Phase completes with single command
- [ ] SC-002: 80%+ items assigned when phases cover domain
- [ ] SC-003: New phases include Goal, Scope, User Stories
- [ ] SC-004: Backlog add executes in <2 seconds

## Files Created/Modified

- [ ] `commands/speckit.merge.md` exists and is valid
- [ ] `commands/speckit.backlog.md` exists and is valid
- [ ] `scripts/bash/speckit-roadmap.sh` updated with backlog command
- [ ] All files pass linting/validation
