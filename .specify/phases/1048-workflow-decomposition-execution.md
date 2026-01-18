---
phase: 1048
name: workflow-decomposition-execution
status: not_started
created: 2026-01-17
updated: 2026-01-18
pdr: pdr-orchestration-engine.md
---

### 1048 - Workflow Decomposition: Execution Phase

**Goal**: Create CLI commands for execution workflow phases (implement, verify, merge) with task grouping for bounded context windows.

**Current State (3.0)**:
- `/flow.implement` skill exists, executes tasks via `specflow next --json` loop
- Tasks are executed one-by-one in dependency order
- No task grouping - entire implement runs in one Claude session
- `/flow.verify` and `/flow.merge` exist as skills
- `specflow check --gate implement` validates task completion
- `specflow mark T###` marks tasks complete

**Problem**:
- Large task lists (50+ tasks) exceed context window
- No way to batch/retry task groups
- Dashboard can't track granular progress

**Scope**:
- Add task group support to tasks.md format (already has sections, formalize as groups)
- Create `specflow workflow implement` CLI command with:
  - `--group <N>` to run specific task group
  - `--list-groups` to show available groups with status
  - Bounded context per group (~20 tasks max)
- Create `specflow workflow verify` CLI wrapper
- Create `specflow workflow merge` CLI wrapper
- All commands support `--json` streaming output

**User Stories**:
1. As a dashboard, I run `specflow workflow implement --list-groups --json` to see task groups
2. As a dashboard, I run `specflow workflow implement --group 1 --json` for first batch
3. As a dashboard, I retry failed groups with error context
4. As a dashboard, I run `specflow workflow verify --json` after all groups complete
5. As a developer, task groups map to logical sections in tasks.md

**Task Group Format** (tasks.md):
```markdown
## Progress Dashboard
Total: 0/25 | Blocked: 0

## Group 1: Setup (0/5)
- [ ] T001 Create project structure in `src/`
- [ ] T002 Configure build system in `package.json`
...

## Group 2: Core Components (0/10)
- [ ] T006 Implement base service in `src/services/base.ts`
...

## Group 3: Integration (0/7)
- [ ] T016 Wire up API endpoints in `src/routes/`
...

## Group 4: Polish (0/3)
- [ ] T023 Add error handling across all services
...
```

**Deliverables**:
- Update `flow.implement` to respect task groups
- `specflow workflow implement` command with:
  - `--group <N>` flag
  - `--list-groups` flag
  - `--json` streaming output (events: task_started, task_complete, task_failed, group_complete)
  - Returns: tasks_completed, tasks_failed, files_modified, next_group
- `specflow workflow verify --json` wrapper for `/flow.verify`
- `specflow workflow merge --json` wrapper for `/flow.merge`
- Update tasks.md template with group format
- Update `specflow next` to be group-aware

**Dependencies**:
- Phase 1047 patterns (workflow command structure, streaming JSON)
- Claude Code CLI programmatic control

**Verification Gate**: Technical
- Task groups execute independently
- Each group stays under 200k context
- Failed groups can be retried
- Full workflow still works via `/flow.orchestrate`
- Existing tasks.md files continue to work (groups optional)

**Estimated Complexity**: High
