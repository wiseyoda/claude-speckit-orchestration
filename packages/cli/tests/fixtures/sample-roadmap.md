# Sample Project Roadmap

> **Source of Truth**: This document defines all feature phases, their order, and completion status.
> Work proceeds through phases sequentially. Each phase produces a deployable increment.

**Project**: Sample Test Project
**Created**: 2026-01-01
**Schema Version**: 2.1 (ABBC numbering)
**Status**: Active Development

---

## Phase Numbering (v2.1)

Phases use **ABBC** format:
- **A** = Milestone (0-9) - Major version or project stage
- **BB** = Phase (01-99) - Sequential work within milestone
- **C** = Hotfix (0-9) - Insert slot (0 = main phase, 1-9 = hotfixes/inserts)

**Examples**:
- `0010` = Milestone 0, Phase 01, no hotfix
- `0021` = Hotfix 1 inserted after Phase 02
- `1010` = Milestone 1, Phase 01, no hotfix

This allows inserting urgent work without renumbering existing phases.

---

## Phase Overview

| Phase | Name | Status | Verification Gate |
|-------|------|--------|-------------------|
| 0010 | Initial Setup | ✅ Complete | All tests pass |
| 0020 | Core Feature | 🔄 In Progress | Feature works end-to-end |
| 0021 | Hotfix: Auth Bug | ✅ Complete | Auth flow works |
| 0030 | User Authentication | ⬜ Not Started | **USER GATE**: Login works |
| 0040 | API Integration | ⬜ Not Started | API calls succeed |
| 0050 | Performance Tuning | ⬜ Not Started | <500ms response time |
| 1010 | Dashboard UI | ⬜ Not Started | **USER GATE**: Dashboard loads |
| 1020 | Real-Time Updates | ⬜ Not Started | **USER GATE**: Changes reflect in 2s |

**Legend**: ⬜ Not Started | 🔄 In Progress | ✅ Complete | **USER GATE** = Requires user verification

---

## Phase Details

Phase details are stored in modular files:

| Location | Content |
|----------|---------|
| `.specify/phases/*.md` | Active/pending phase details |
| `.specify/history/HISTORY.md` | Archived completed phases |

To view a specific phase:
```bash
specflow phase show 0010
```

To list all phases:
```bash
specflow phase list
specflow phase list --active
specflow phase list --complete
```

---

## Verification Gates Summary

| Gate | Phase | What User Verifies |
|------|-------|-------------------|
| **Gate 1** | 0030 | Login flow works, error messages clear |
| **Gate 2** | 1010 | Dashboard starts, shows projects, dark mode works |
| **Gate 3** | 1020 | CLI state changes appear in UI within 2 seconds |

---

## Phase Sizing Guidelines

Each phase is designed to be:
- **Completable** in a single agentic coding session (~200k tokens)
- **Independently deployable** (no half-finished features)
- **Verifiable** with clear success criteria
- **Building** on previous phases

If a phase is running long:
1. Cut scope to MVP for that phase
2. Document deferred items in `specs/[phase]/checklists/deferred.md`
3. Prioritize verification gate requirements

---

## Backlog

### Deferred from Phase 0020

- Mobile responsive layout
- Dark mode toggle animation
- Keyboard shortcuts help modal

### Future Considerations

- WebSocket support for real-time updates
- Multi-tenant architecture
- Plugin system for extensions

---

## How to Use This Document

### Starting a Phase
```
/flow.orchestrate
```
Or manually:
```
/flow.design "Phase NNNN - [Phase Name]"
```

### After Completing a Phase
1. Update status in table above: ⬜ → ✅
2. Archive phase: `specflow phase archive NNNN`
3. If USER GATE: get explicit user verification before proceeding

### Adding New Phases
Use SpecFlow commands:
```bash
specflow roadmap insert --after 0020 "New Phase Name"
specflow phase create 0025 "new-phase"
```

---

## Notes

- Phases with **USER GATE** require explicit sign-off
- Hotfix phases (ending in 1-9) are for urgent insertions
- Use `specflow roadmap renumber` if phases get out of order
