---
description: Create, list, close, and manage local issues for tracking bugs, improvements, and technical debt.
handoffs:
  - label: View Open Issues
    agent: speckit.issue
    prompt: List all open issues
  - label: Run Orchestration
    agent: speckit.orchestrate
    prompt: Continue orchestrated development
---

## User Input

```text
$ARGUMENTS
```

## Goal

Manage local issues using the SpecKit CLI. Issues track bugs, improvements, and technical debt discovered during development.

**IMPORTANT**: Always use the CLI commands below. Never manually create or edit issue files.

## CLI Commands

### List Issues

```bash
# All issues
speckit issue list

# Filtered
speckit issue list --open
speckit issue list --closed
speckit issue list --phase 0042

# JSON output for programmatic use
speckit issue list --json
```

### Show Issue Details

```bash
speckit issue show ISSUE-001
speckit issue show ISSUE-001 --json
```

### Create Issue

```bash
# Basic
speckit issue create "Fix login timeout bug"

# With options
speckit issue create "Improve form validation UX" \
  --category improvement \
  --priority high \
  --phase 0042 \
  --description "Form shows errors too late, frustrating users"
```

**Categories**: `bug`, `feature`, `improvement`, `debt`, `docs`, `test`
**Priorities**: `critical`, `high`, `medium`, `low`

### Close Issue

```bash
speckit issue close ISSUE-001
speckit issue close ISSUE-001 --resolution "Fixed in commit abc123"
```

### Update Issue

```bash
speckit issue update ISSUE-001 --status in_progress
speckit issue update ISSUE-001 --phase 0050
speckit issue update ISSUE-001 --priority critical
```

### Migrate from ROADMAP

If issues exist in ROADMAP.md's Issues Backlog section:

```bash
# Preview migration
speckit issue migrate --dry-run

# Execute migration
speckit issue migrate
```

## Workflow Integration

### When to Create Issues

Create issues when you discover:

1. **Bugs** - Something broken that's not blocking current work
2. **Improvements** - Better approaches found during implementation
3. **Technical Debt** - Shortcuts taken that need revisiting
4. **Missing Tests** - Test coverage gaps
5. **Documentation Gaps** - Missing or outdated docs

### Issue Assignment

- Assign to **current phase** if it should be fixed now
- Assign to **future phase** if it can wait
- Leave unassigned for backlog triage

### During Orchestration

When `/speckit.orchestrate` runs:
1. Check for open issues in current phase: `speckit issue list --open --phase NNNN`
2. Address high-priority issues before completing phase
3. Move unresolved issues to backlog or future phase

## Interpreting User Requests

| User Says | Command |
|-----------|---------|
| "add an issue for X" | `speckit issue create "X"` |
| "log a bug about Y" | `speckit issue create "Y" --category bug` |
| "what issues are open?" | `speckit issue list --open` |
| "close issue 5" | `speckit issue close ISSUE-005` |
| "show me the issues" | `speckit issue list` |
| "mark issue 3 as in progress" | `speckit issue update ISSUE-003 --status in_progress` |
| "move issue to phase 50" | `speckit issue update ISSUE-XXX --phase 0050` |

## Example Session

User: "add an issue for the wizard PWA layout problems, it's high priority and should go in phase 0230"

```bash
speckit issue create "Story Creation Wizard PWA Layout Issues" \
  --category improvement \
  --priority high \
  --phase 0230 \
  --description "Viewport/safe area handling, card grid responsiveness, progress indicator positioning need fixes for PWA context"
```

Output:
```
Created issue: ISSUE-017
Edit with: $EDITOR .specify/issues/ISSUE-017.md
View: speckit issue show ISSUE-017
```

Then commit:
```bash
git add .specify/issues/
git commit -m "docs(issues): add ISSUE-017 for wizard PWA layout"
```

## File Structure

Issues are stored in `.specify/issues/`:

```
.specify/issues/
├── index.json          # Quick lookup index
├── ISSUE-001.md        # Individual issue files
├── ISSUE-002.md
└── ...
```

The CLI maintains both the markdown files and index.json automatically.

## Context

$ARGUMENTS
