---
phase: 1052
name: session-viewer
status: not_started
created: 2026-01-17
updated: 2026-01-18
pdr: workflow-dashboard-orchestration.md
---

> **Architecture Context**: See [PDR: Workflow Dashboard Orchestration](../../memory/pdrs/workflow-dashboard-orchestration.md) for holistic architecture, design decisions, and how this phase fits into the larger vision.

### 1052 - Session Viewer

**Goal**: View agent progress in real-time via session JSONL parsing.

**Context**: Users want to see what Claude is doing during workflows. This phase adds a session viewer that parses Claude's JSONL transcripts.

**Scope:**

1. **Parse Claude Session JSONL Files**
   - Location: `~/.claude/projects/{hash}/{session}.jsonl`
   - Extract: messages, tool calls, results
   - Handle large files with streaming/pagination
   - Real-time tailing for active sessions

2. **Session Viewer Slide-out Panel**
   - Opens from project detail (per user preference)
   - Shows current/recent session
   - Formatted message display:
     - User messages
     - Assistant messages (summarized for readability)
     - Tool calls (name only, details collapsed)
   - Auto-scroll with "pause on scroll up" behavior

3. **Active Session Detection**
   - Link workflow sessionId to JSONL file
   - Hash calculation matches Claude Code's method
   - Highlight currently executing session in list

4. **Basic Progress Indicators**
   - Files modified count (from tool calls)
   - Tasks completed (if visible in output)
   - Time elapsed since session start

**Technical Notes:**
- Hash for project path: Same algorithm as Claude Code uses
- JSONL parsing: Stream line-by-line for large files
- Consider using `tail -f` equivalent for real-time updates
- Message formatting: Show key info, collapse verbose tool params

**UI Components:**
- `packages/dashboard/src/lib/session-parser.ts` - JSONL parser
- `SessionViewerPanel.tsx` - Slide-out panel container
- `SessionMessage.tsx` - Individual message formatter
- `SessionProgress.tsx` - Progress indicators

**API Routes:**
- GET `/api/session/content?path=<path>&tail=<lines>` - Stream session content
- GET `/api/session/list?projectPath=<path>` - List sessions for project

**What Was Removed (from original 1052):**
- Step-by-step progress visualization - Too complex for MVP
- Post-workflow summary view - Can add later
- Full retry/error display - Covered in 1055

**Dependencies:**
- Phase 1051 (question context for follow-up)

**Verification Gate: USER**
- [ ] Open session viewer from project detail
- [ ] See formatted messages from active session
- [ ] Content streams in real-time during workflow
- [ ] See files modified and time elapsed

**Estimated Complexity**: Medium
