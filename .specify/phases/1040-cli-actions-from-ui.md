---
phase: 1040
name: cli-actions-from-ui
status: not_started
created: 2026-01-14
---

### 1040 - CLI Actions from UI

**Goal**: Trigger SpecKit CLI commands from the dashboard.

**Scope**:
- API routes that shell out to `speckit` CLI commands
- Mark task complete/incomplete
- Update phase status
- Add backlog items
- Run `speckit` commands with output streaming
- Error handling and user feedback
- Keyboard shortcuts for common actions

**User Stories**:
1. As a developer, I can mark a task complete from the dashboard
2. As a developer, I can add an item to backlog without switching to terminal
3. As a developer, I see command output in a modal/drawer
4. As a developer, I can use keyboard shortcuts (e.g., `t` to toggle task)

**Deliverables**:
- API routes for task/phase/backlog operations
- Action buttons in project detail views
- Command output modal with streaming
- Keyboard shortcut bindings
- Toast notifications for action results

**Verification Gate**: **USER VERIFICATION REQUIRED**
- Click task checkbox, task status updates in UI and on disk
- Add backlog item, appears in ROADMAP.md
- Keyboard shortcut `t` toggles selected task
- Errors show helpful messages

**Estimated Complexity**: Medium
