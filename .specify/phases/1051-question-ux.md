---
phase: 1051
name: question-ux
status: not_started
created: 2026-01-17
pdr: pdr-orchestration-engine.md
---

### 1051 - Question UX

**Goal**: User interface for viewing and answering Claude's questions during workflow execution.

**Scope**:
- Question queue persistence (questions survive page refresh)
- Toast notifications when questions arrive (if dashboard open)
- Visual indicator on project cards when questions pending
- Visual indicator on project detail header
- Dedicated drawer/panel for answering questions
- Support for all AskUserQuestion formats (single/multi-select, free text)
- Workflow resume after questions answered

**User Stories**:
1. As a user, I see a toast when Claude has a question
2. As a user, I see a badge/icon on project card indicating pending questions
3. As a user, I click the indicator and a drawer opens with the questions
4. As a user, I answer questions and the workflow continues
5. As a user, I can add context/notes with my answers

**Deliverables**:
- Question persistence in workflow state
- Toast notification component for new questions
- Question indicator badge for project cards
- Question indicator for project detail header
- Question drawer/panel component:
  - Shows question text and options
  - Single-select and multi-select support
  - Optional context/notes field
  - Submit button to send answers
- API routes:
  - GET `/api/workflow/questions/:projectId` - Get pending questions
  - POST `/api/workflow/answer/:projectId` - Submit answers
- Integration with workflow runner to resume on answer

**Verification Gate**: **USER VERIFICATION REQUIRED**
- Toast appears when question arrives
- Project card shows pending question indicator
- Click indicator, drawer opens with questions
- Answer question, workflow resumes

**Estimated Complexity**: Medium
