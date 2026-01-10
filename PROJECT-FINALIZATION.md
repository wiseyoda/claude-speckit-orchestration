# SpecKit Project Finalization

> Comprehensive inventory of all deferred, incomplete, and future work items.
> Prioritized for MVP-first development.

**Created**: 2026-01-10
**Source Files**: REFACTORING-PLAN.md, HANDOFF.md, EDGE-CASE-ANALYSIS.md, IMPROVEMENT-PLAN.md

---

## Priority Legend

| Priority | Meaning | Criteria |
|----------|---------|----------|
| **P0** | Blocking | Core functionality broken, prevents basic usage |
| **P1** | Core | Essential for reliable operation, should be done soon |
| **P2** | Enhancement | Nice-to-have improvements, quality of life |
| **P3** | Future | Long-term vision, can wait indefinitely |
| **DONE** | Completed | Finished during v2.0 refactoring session |

---

## Session Completions (2026-01-10)

Items originally deferred that were **completed during the v2.0 refactoring**:

- [x] ~~Create feature branch `refactor/v2-simplification`~~ **DONE**
- [x] ~~Add `speckit context` command~~ **DONE** - replaces check-prerequisites.sh
- [x] ~~Add `speckit feature create` command~~ **DONE** - replaces create-new-feature.sh
- [x] ~~Add `speckit state migrate` command~~ **DONE** - v1.x to v2.0 migration
- [x] ~~Add backup before migration~~ **DONE** - creates .specify/backup/
- [x] ~~Add `speckit state registry` commands~~ **DONE** - list/sync/clean/path
- [x] ~~Generate project UUID~~ **DONE** - in state init and migrate
- [x] ~~Add central registry (~/.speckit/registry.json)~~ **DONE** - web UI ready
- [x] ~~Consolidate 12 init-*.md files to 1~~ **DONE** - unified speckit.init.md
- [x] ~~Make memory docs optional (only constitution required)~~ **DONE**
- [x] ~~Add `speckit state archive` command~~ **DONE** - phase cleanup
- [x] ~~Add state cleanup detection in orchestrate~~ **DONE** - Section 0d
- [x] ~~Update README.md for v2.0~~ **DONE**
- [x] ~~Update CLAUDE.md for v2.0~~ **DONE**

---

## P0: Blocking Issues

> Items that prevent core functionality from working correctly.

### CLI Scripts Not Implemented

From `HANDOFF.md` - Commands are referenced but scripts don't exist:

- [ ] **speckit-git.sh** - Git operations (branch, commit, merge, push, sync)
  - Called by: orchestrate.md, verify.md
  - Impact: Manual git operations required

- [ ] **speckit-roadmap.sh** - ROADMAP.md operations (status, update, next, validate)
  - Called by: orchestrate.md, verify.md, start.md
  - Impact: Phase tracking doesn't work programmatically

- [ ] **speckit-tasks.sh** - Task operations (status, mark, incomplete, list)
  - Called by: orchestrate.md, implement.md, verify.md
  - Impact: Task completion tracking manual only

- [ ] **speckit-checklist.sh** - Checklist operations (status, list, incomplete, show)
  - Called by: verify.md
  - Impact: Checklist verification manual only

### State/Reality Mismatch Detection

From `EDGE-CASE-ANALYSIS.md`:

- [ ] **State vs files comparison** - Detect when state says "pending" but files exist
  - Example: spec.md exists but state says "specify: pending"
  - Impact: Orchestration can get confused, repeat work

---

## P1: Core Functionality

> Essential for reliable operation. Should be implemented soon.

### CLI Scripts (Continued)

- [ ] **speckit-claude-md.sh** - CLAUDE.md operations (update, sync, show)
  - Called by: verify.md, roadmap.md
  - Impact: CLAUDE.md not auto-updated with recent changes

- [ ] **speckit-doctor.sh** - Diagnostics and auto-fix
  - Called by: orchestrate.md (doctor --fix)
  - Impact: No automated healing of project issues

- [ ] **speckit-templates.sh** - Template versioning (check, update, diff)
  - Impact: Template updates require manual copy

### Refactoring Deferred Items

From `REFACTORING-PLAN.md`:

- [ ] **File existence as truth** - Use file presence to infer step completion
  - spec.md exists → specify complete
  - plan.md exists → plan complete
  - tasks.md exists → tasks complete
  - All tasks `[X]` → implement complete
  - Impact: More robust state recovery

- [ ] **Simplify `speckit doctor` recovery logic**
  - Current: Complex state-based recovery
  - Target: File-existence-based recovery
  - Impact: Simpler, more reliable healing

- [ ] **Auto-detect v1 interview state, continue seamlessly**
  - Scenario: User has partial v1.x interview in .specify/discovery/
  - Impact: Interview could be lost on migration

### Edge Case Handling

From `EDGE-CASE-ANALYSIS.md`:

- [ ] **Add VERSION file to installation**
  - Path: ~/.claude/speckit-system/VERSION
  - Content: Semantic version (e.g., "2.0.0")

- [ ] **Add `speckit version` command**
  - Show installed version
  - Compare to latest available

- [ ] **Add `speckit doctor --check version`**
  - Validate version file exists
  - Warn if outdated

- [ ] **Add `speckit doctor --check reality`**
  - Compare state to actual files
  - Report mismatches

- [ ] **Add rollback capability for state migration**
  - Store backup path in state
  - Add `speckit state rollback` command

---

## P2: Enhancements

> Nice-to-have improvements. Quality of life features.

### Refactoring Deferred Items

From `REFACTORING-PLAN.md`:

- [ ] **Add `--json` flag to all commands consistently**
  - Some commands have it, others don't
  - Needed for scripting and web UI

- [ ] **Add tests for each new command**
  - Unit tests for CLI scripts
  - Integration tests for workflows

- [ ] **Add `speckit memory init` command**
  - Generate optional memory docs on demand
  - Only constitution.md is required now

- [ ] **Simplify orchestrate.md (remove redundant sections)**
  - Current: 1000+ lines
  - Target: ~500 lines
  - Remove duplicated instructions

- [ ] **Add `--tdd` flag to implement.md**
  - Write tests before implementation
  - Run tests after each task

### Edge Case Handling

From `EDGE-CASE-ANALYSIS.md`:

- [ ] **Add `speckit detect` command**
  - Scan for existing CLAUDE.md
  - Detect docs/ directory patterns
  - Find ADR/RFC patterns
  - Identify API documentation
  - Return structured results

- [ ] **Update `speckit.start` to run detection before routing**
  - Pre-flight checks (CLI, version, permissions)
  - Detection step before routing
  - Graceful fallback messages

- [ ] **Add `speckit reconcile` command**
  - Compare state to file system
  - Interactive mode for conflict resolution
  - `--dry-run` flag to preview changes

- [ ] **Update `speckit scaffold` to detect existing content**
  - Check for existing CLAUDE.md
  - Offer merge/preserve options
  - Add `--safe` flag for non-destructive mode

- [ ] **Add CLAUDE.md merge logic**
  - Detect existing CLAUDE.md
  - Merge SpecKit sections with user content
  - Preserve user customizations

- [ ] **Add integration options for existing docs**
  - Import ADRs to .specify/memory/adrs/
  - Reference existing architecture docs
  - Link to existing API documentation

---

## P3: Future Vision

> Long-term improvements. Can wait indefinitely.

### Refactoring Deferred Items

From `REFACTORING-PLAN.md`:

- [ ] **Update orchestrate to support story-based flow**
  - Execute stories independently
  - MVP checkpoints between stories
  - Parallel story execution

- [ ] **Add `speckit tasks next-story` command**
  - Get next incomplete story
  - Show story dependencies
  - Support story-based workflow

- [ ] **Add integration tests for full workflow**
  - End-to-end orchestration test
  - Multi-phase workflow test
  - State recovery test

### Web UI Dashboard

From `REFACTORING-PLAN.md` (Web UI Considerations section):

- [ ] **Dashboard UI** (React/Next.js)
  - Multi-project overview
  - Real-time status updates
  - Action buttons (continue, skip, heal, abort)

- [ ] **API Server** (Node/Python)
  - REST endpoints for project management
  - WebSocket for real-time updates

- [ ] **File Watcher** (chokidar)
  - Monitor state file changes
  - Emit events to subscribers

- [ ] **Real-time events** (WebSocket)
  - step_started, step_completed
  - task_completed, error
  - user_input_required, phase_completed

### Edge Case Handling (Advanced)

From `EDGE-CASE-ANALYSIS.md`:

- [ ] **Graceful degradation without CLI**
  - Commands work via Claude reading files directly
  - Manual instructions as fallback

- [ ] **Multi-framework coexistence**
  - Detect other documentation frameworks
  - Offer integration paths
  - Work alongside existing tools

---

## Summary Statistics

| Priority | Count | Status |
|----------|-------|--------|
| DONE | 14 | Completed this session |
| P0 | 5 | Blocking - fix first |
| P1 | 12 | Core - do soon |
| P2 | 13 | Enhancement - when time allows |
| P3 | 10+ | Future - long-term vision |
| **Total Remaining** | **40+** | |

---

## Recommended Next Steps

1. **Immediate**: Implement P0 CLI scripts (speckit-git.sh, speckit-roadmap.sh, speckit-tasks.sh, speckit-checklist.sh)
2. **Soon**: Add VERSION file and version checking
3. **When stable**: Add file-existence-as-truth for state recovery
4. **Polish**: Add --json consistency, tests, and documentation
5. **Future**: Web UI dashboard and story-based orchestration

---

## Related Documents

- [REFACTORING-PLAN.md](REFACTORING-PLAN.md) - v2.0 refactoring details
- [EDGE-CASE-ANALYSIS.md](EDGE-CASE-ANALYSIS.md) - Comprehensive edge case handling
- [HANDOFF.md](HANDOFF.md) - Development context and architecture
- [IMPROVEMENT-PLAN.md](IMPROVEMENT-PLAN.md) - Original improvement plan
