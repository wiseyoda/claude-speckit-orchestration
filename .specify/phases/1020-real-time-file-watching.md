---
phase: 1020
name: real-time-file-watching
status: not_started
created: 2026-01-14
---

### 1020 - Real-Time File Watching

**Goal**: Live updates when SpecKit state files change on disk.

**Scope**:
- File watcher using chokidar (native fs events with polling fallback)
- WebSocket server for pushing updates to UI
- Watch `~/.speckit/registry.json` for project changes
- Watch `<project>/.specify/orchestration-state.json` for state changes
- Debounced updates to prevent flicker
- Connection status indicator in UI

**User Stories**:
1. As a developer, when I run `speckit state set` in terminal, the dashboard updates immediately
2. As a developer, I see connection status (connected/reconnecting)
3. As a developer, new projects appear automatically when registered

**Deliverables**:
- `packages/dashboard/src/lib/watcher.ts` - File watcher service
- WebSocket endpoint in API routes
- React hooks for real-time subscriptions
- Connection status component

**Verification Gate**: **USER VERIFICATION REQUIRED**
- Run `speckit state set orchestration.phase.status=complete` and see UI update within 2 seconds
- Disconnect/reconnect shows status indicator
- No duplicate updates or flickering

**Estimated Complexity**: Medium
