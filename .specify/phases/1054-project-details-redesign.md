---
phase: 1054
name: project-details-redesign
status: not_started
created: 2026-01-19
mockup: mockups/project-details-redesign/index-v3.html
---

### 1054 - Project Details Redesign

**Goal**: Transform the project details page to match the polished v3 mockup design.

**Context**: Phase 1053 created interactive HTML mockups for a major UI redesign. The v3 mockup (`mockups/project-details-redesign/index-v3.html`) represents the final design combining best practices from multiple iterations. This phase implements that design in the actual React dashboard.

**Reference**: Open `mockups/project-details-redesign/index-v3.html` in browser to see the target design.

---

**Scope:**

### 1. Icon-Only Sidebar Navigation

Replace the current tab-based navigation with an icon-only vertical sidebar:

- Icons: Dashboard, Session, Tasks, History (with hotkey hints in tooltips)
- Active state: left pip indicator + background highlight
- Live indicator: pulsing dot on Session icon when workflow running
- Warning indicator: pulsing dot when waiting for user input
- Bottom section: Notifications bell, Settings gear, User avatar
- Tooltips with keyboard shortcuts (⌘1-4)

### 2. Header Redesign

- **Left**: Breadcrumb path + branch indicator pill
- **Center**: Status pill with state-specific styling
  - Idle: gray, "Ready"
  - Running: green glow, "Running" + timer
  - Waiting: amber glow, "Input Needed" + timer
  - Failed: red glow, "Failed"
- **Right**: Context drawer toggle button

### 3. Dashboard View (Idle State)

Welcome/landing view when no workflow is active:

- Large greeting: "Ready to build?"
- Phase context: current phase, completion percentage
- Primary action card: "Resume Implementation" with context
- Secondary action grid: Orchestrate, Design, Verify buttons
- Stats row: Done / Pending / Progress percentage

### 4. Session View (Console)

Replace the drawer-based session viewer with inline console:

- Full-height console with message stream
- Agent attribution: `@Implementer`, `@Designer` with role badges
- Reasoning vs Action badges on messages
- Tool call blocks with syntax highlighting
- Typing indicator when Claude is processing
- Empty state with "Start Workflow" CTA when idle

### 5. Omni-Box Input

Unified input at bottom of session view:

- State badge (Live/Waiting/Ready/Error)
- Gradient glow effect on focus
- Placeholder changes based on state
- Paperclip attachment button
- Send button with arrow icon
- ⌘K hint below

### 6. Decision Toast (Questions)

Replace question modal with floating toast:

- Appears at bottom-center when waiting for input
- Animated beam progress indicator
- Question icon + "Decision Required" header
- Question counter (1 of N)
- 2-column option buttons
- "Provide custom instructions" expand option
- Auto-resolves when user types in omni-box

### 7. Failed State Toast

Error notification for failed workflows:

- Red-themed toast at bottom-center
- Error icon + "Workflow Failed" header
- Error message with code block for stack trace
- Dismiss and Retry buttons

### 8. Tasks View

2-column Kanban (no In Progress column):

- **To Do**: Task cards with ID, priority badge, description
- **Done**: Completed tasks with strikethrough, check icon
- Progress bar in header
- Click task for detail (future: side panel)

### 9. History View

Master-detail layout:

- **Left**: Timeline with phase cards
  - Phase number, name, status badge
  - Click to select
  - Active pip indicator
- **Right**: Phase detail panel
  - Summary text
  - Sessions list with date, skill, cost
  - Artifacts links (spec.md, plan.md, etc.)

### 10. Context Drawer

Right-side collapsible panel:

- Tabs: Context | Activity
- **Context tab**:
  - Current task card with progress
  - Touched files list with +/- line counts
  - Phase progress stepper (Discovery → Design → Implement → Verify)
- **Activity tab**:
  - Recent activity feed with colored dots

### 11. Visual Polish

- Glass morphism effects (backdrop-blur)
- Grid background pattern
- Floating animated orbs (subtle)
- Smooth view transitions
- Custom scrollbar styling
- Dark theme throughout

### 12. Keyboard Shortcuts

- ⌘K: Focus omni-box
- ⌘1: Dashboard
- ⌘2: Session
- ⌘3: Tasks
- ⌘4: History

---

**Deliverables:**

| Component | Type | Notes |
|-----------|------|-------|
| `IconSidebar.tsx` | New | Vertical nav with tooltips |
| `StatusPill.tsx` | New | Centered header status |
| `OmniBox.tsx` | New | Unified input component |
| `DecisionToast.tsx` | New | Question toast (replaces modal) |
| `FailedToast.tsx` | New | Error toast |
| `SessionConsole.tsx` | Refactor | Inline console (was drawer) |
| `DashboardWelcome.tsx` | New | Idle state landing |
| `TasksKanban.tsx` | Refactor | 2-column layout |
| `HistoryTimeline.tsx` | Refactor | Master-detail layout |
| `ContextDrawer.tsx` | New | Right-side panel |
| `page.tsx` | Refactor | New layout structure |

**Migration Notes:**
- Keep existing data hooks (`use-workflow-execution`, `use-session-messages`, etc.)
- Reuse shadcn/ui primitives where possible
- May need to add Tailwind animations for orbs, glow effects
- Remove old tab navigation and drawer components

**Dependencies:**
- Phase 1053 (mockups created)
- Existing workflow/session infrastructure

**Verification Gate: USER**
- [ ] Icon sidebar navigation works with all 4 views
- [ ] Status pill reflects workflow state correctly (idle/running/waiting/failed)
- [ ] Can start workflow from Dashboard welcome view
- [ ] Session console shows messages with agent attribution
- [ ] Decision toast appears when workflow needs input
- [ ] Failed toast appears with retry option on error
- [ ] Omni-box input works for follow-ups and question responses
- [ ] Tasks view shows 2-column Kanban
- [ ] History view shows timeline with detail panel
- [ ] Context drawer toggles and shows current task info
- [ ] Keyboard shortcuts work (⌘K, ⌘1-4)
- [ ] Visual polish matches mockup (glass effects, animations)

**Estimated Complexity**: High (significant UI refactor)
