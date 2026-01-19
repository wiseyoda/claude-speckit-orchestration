---
phase: 1051
name: questions-notifications
status: not_started
created: 2026-01-17
updated: 2026-01-18
pdr: workflow-dashboard-orchestration.md
---

> **Architecture Context**: See [PDR: Workflow Dashboard Orchestration](../../memory/pdrs/workflow-dashboard-orchestration.md) for holistic architecture, design decisions, and how this phase fits into the larger vision.

### 1051 - Questions & Notifications

**Goal**: Excellent question answering UX with browser notifications.

**Context**: When workflows need user input, users should be notified immediately and have a smooth experience answering questions.

**Scope:**

1. **Browser Notification API Integration**
   - Request permission on first workflow start
   - Show notification when questions pending
   - Notification content: "Project X needs your input"
   - Click notification focuses dashboard tab
   - Respect browser notification settings

2. **Question Badge on Project Cards**
   - Yellow dot with question count
   - Visible on project list view
   - Clickable to open project detail

3. **Question Badge in Project Detail Header**
   - Badge next to project name
   - Click opens question drawer

4. **Question Drawer Panel (Slide from Right)**
   - Reuse UI patterns from POC debug page
   - Support all question types:
     - Single-select (radio buttons)
     - Multi-select (checkboxes)
     - Free-form text input
   - Submit button with loading state
   - Clear visual hierarchy

5. **Free-form Follow-up Input**
   - Text area at bottom of drawer
   - "Send message" button
   - Continues session with custom text (not structured answer)
   - Useful for clarifications or additional context

**UI Components:**
- `packages/dashboard/src/lib/notifications.ts` - Browser API wrapper
- `QuestionDrawer.tsx` - Slide-out panel
- `QuestionBadge.tsx` - Badge component
- `QuestionList.tsx` - Question rendering (reuse POC patterns)
- `FollowUpInput.tsx` - Free-form text input

**Dependencies:**
- Phase 1050 (workflow status UI)

**Verification Gate: USER**
- [ ] Browser asks for notification permission
- [ ] Desktop notification appears when questions pending
- [ ] Question badge visible on project card
- [ ] Click badge opens drawer, answer question, workflow continues
- [ ] Send free-form follow-up text, session continues

**Estimated Complexity**: Medium
