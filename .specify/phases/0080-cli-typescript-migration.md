---
phase: 0080
name: cli-typescript-migration
status: in_progress
created: 2026-01-18
pdr: null
---

### 0080 - CLI TypeScript Migration

**Goal**: Migrate 24 bash scripts (~18k lines) to 5 smart TypeScript commands, reducing CLI calls from 50-100 per phase to 10-15.

**Scope**:
- Create 5 smart TypeScript CLI commands: status, next, mark, check, state
- Build parsing libraries for tasks.md, ROADMAP.md, checklists
- Implement hybrid dispatcher for TypeScript + bash fallback
- Return rich, contextual JSON data per call
- Maintain backward compatibility during migration

**User Stories**:
1. As Claude, I get complete project status in a single `specflow status --json` call
2. As Claude, I get next actionable item with full context via `specflow next --json`
3. As Claude, I mark items complete and get updated state via `specflow mark T001`
4. As Claude, I run deep validation with auto-fix via `specflow check --fix`
5. As Claude, I access low-level state via `specflow state get/set` (escape hatch)

**Deliverables**:
- TypeScript CLI in packages/cli with Commander.js
- Parsing libraries: tasks.ts, roadmap.ts, checklist.ts, context.ts, health.ts
- 5 commands: status, next, mark, check, state (state complete)
- Hybrid bin/specflow dispatcher
- >80% test coverage

**Verification Gate**: Technical
- `specflow status --json` returns phase, step, progress, health, next_action
- `specflow next --json` returns next unblocked task with dependencies
- `specflow mark T001` modifies tasks.md and returns updated progress
- `specflow check --json` validates project with actionable output
- Hybrid dispatcher routes correctly to TypeScript or bash

**Estimated Complexity**: High
