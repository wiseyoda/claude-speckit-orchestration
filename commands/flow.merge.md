---
description: Complete a phase by closing it, pushing, and merging to main.
handoffs:
  - label: Start Next Phase
    agent: specflow.orchestrate
    prompt: Start the next phase
    send: true
  - label: View Roadmap
    agent: specflow.roadmap
    prompt: Show the roadmap
---

## User Input

```text
$ARGUMENTS
```

Arguments:
- Empty: Close phase, push, create PR, merge, cleanup (default)
- `--pr-only`: Create PR but don't merge (for review workflow)

## Goal

Complete the current phase:
1. Close the phase (update ROADMAP, archive, reset state)
2. Commit the phase closure changes
3. Push and merge to main
4. Switch to main with clean state

## Execution

### 0. Create Todo List

**Create todo list immediately (use TodoWrite):**

1. [MERGE] PREFLIGHT - Verify branch and uncommitted changes
2. [MERGE] CLOSE - Close phase via CLI
3. [MERGE] COMMIT - Commit phase closure
4. [MERGE] PUSH - Push and create PR
5. [MERGE] MERGE - Merge PR to main
6. [MERGE] MEMORY - Integrate archive into memory
7. [MERGE] DONE - Report completion

Set [MERGE] PREFLIGHT to in_progress.

### 1. Pre-flight Checks

**Verify on feature branch:**

```bash
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
  echo "ERROR: Cannot merge from main branch"
  echo "Switch to a feature branch first"
  exit 1
fi
```

**Check for uncommitted changes:**

```bash
git status --short
git diff --stat
```

If there are uncommitted changes (staged or unstaged), **include them in the phase commit by default**. Users running `/flow.merge` want to complete their phase - uncommitted changes are almost always related work.

**Only ask if changes look unusual:**

Detect unusual changes by checking if ANY of these apply:
- Changes to sensitive files: `.env*`, `*credentials*`, `*secret*`
- Changes to `package.json`/`pnpm-lock.yaml` when phase tasks didn't involve dependency changes
- Large deletions (>500 lines removed) not documented in phase tasks
- Changes to files completely outside the project scope

**For unusual changes only**, use `AskUserQuestion`:

```json
{
  "questions": [{
    "question": "Uncommitted changes include files outside typical phase work. Include in commit?",
    "header": "Changes",
    "options": [
      {"label": "Yes, commit all", "description": "Include everything in the phase commit"},
      {"label": "Review first", "description": "Show me the changes before proceeding"},
      {"label": "Abort", "description": "Stop and let me handle manually"}
    ],
    "multiSelect": false
  }]
}
```

**For normal changes**: Proceed without asking - include all changes in the phase commit.

Use TodoWrite: mark [MERGE] PREFLIGHT complete, mark [MERGE] CLOSE in_progress.

### 2. Close Phase via CLI

Use the `specflow phase close` command to handle all phase closure operations:

```bash
specflow phase close --json
```

This command:
- Updates ROADMAP.md status to "Complete"
- Archives phase details to `.specify/history/HISTORY.md`
- Handles deferred items (adds to BACKLOG.md if needed)
- Resets orchestration state for next phase

**Parse output for phase info:**

```bash
PHASE_INFO=$(specflow phase close --json)
PHASE_NUMBER=$(echo "$PHASE_INFO" | jq -r '.phase.number')
PHASE_NAME=$(echo "$PHASE_INFO" | jq -r '.phase.name')
```

Use TodoWrite: mark [MERGE] CLOSE complete, mark [MERGE] COMMIT in_progress.

### 3. Commit Phase Closure

```bash
git add ROADMAP.md .specify/
git commit -m "chore: complete phase $PHASE_NUMBER"
```

Use TodoWrite: mark [MERGE] COMMIT complete, mark [MERGE] PUSH in_progress.

### 4. Push Branch

```bash
git push -u origin "$CURRENT_BRANCH"
```

### 5. Create Pull Request

**Check for existing PR:**

```bash
EXISTING_PR=$(gh pr view --json url -q '.url' 2>/dev/null)
if [[ -n "$EXISTING_PR" ]]; then
  PR_URL="$EXISTING_PR"
fi
```

**Create PR if needed:**

```bash
if [[ -z "$PR_URL" ]]; then
  PR_URL=$(gh pr create \
    --title "Phase $PHASE_NUMBER: $PHASE_NAME" \
    --body "Completes phase $PHASE_NUMBER." \
    --base main)
fi
```

### 6. Handle --pr-only

```bash
if [[ "$ARGUMENTS" == *"--pr-only"* ]]; then
  echo "✓ PR created (--pr-only mode)"
  echo "Review at: $PR_URL"
  echo ""
  echo "After review, run /flow.merge to complete"
  exit 0
fi
```

Use TodoWrite: mark [MERGE] PUSH complete, mark [MERGE] MERGE in_progress.

### 7. Merge PR

```bash
gh pr merge --squash --delete-branch
```

### 8. Switch to Main

```bash
git checkout main
git pull origin main
git branch -d "$CURRENT_BRANCH" 2>/dev/null || true
```

Working directory is now clean on main.

Use TodoWrite: mark [MERGE] MERGE complete, mark [MERGE] MEMORY in_progress.

### 9. Archive Memory Integration

Now that we're on main with a clean state, run memory archive review for the just-closed phase:

**Check if archive exists:**
```bash
ARCHIVE_DIR=$(ls -d .specify/archive/${PHASE_NUMBER}-* 2>/dev/null | head -1)
if [[ -n "$ARCHIVE_DIR" ]]; then
  echo "Processing archive for phase $PHASE_NUMBER..."
fi
```

**Run memory archive review:**
If archive exists, execute `/flow.memory --archive $PHASE_NUMBER` inline. This will:
- Scan the archived phase for promotable content
- Present findings for user approval
- Promote approved content to memory docs
- Delete the archive after successful review

If no promotable content is found, ask user whether to delete the archive or keep for manual review.

After memory integration completes, commit any changes:
```bash
if ! git diff --quiet .specify/memory/ || ! git diff --quiet .specify/; then
  git add .specify/memory/ .specify/
  git commit -m "docs: integrate phase $PHASE_NUMBER learnings into memory"
  git push origin main
fi
```

Use TodoWrite: mark [MERGE] MEMORY complete, mark [MERGE] DONE in_progress.

### 10. Done

```text
✓ Closed phase $PHASE_NUMBER
✓ Committed changes
✓ Pushed and merged PR
✓ Switched to main (clean)
✓ Integrated archive into memory

Run /flow.orchestrate to start the next phase
```

Use TodoWrite: mark [MERGE] DONE complete.

## Error Handling

| Error | Response |
|-------|----------|
| Not on feature branch | "Switch to a feature branch first" |
| Uncommitted changes | **Ask user** - show changes, offer: commit with phase, stash, review, or abort |
| Phase close fails | Show CLI error message |
| Merge fails | "Check for merge conflicts or required reviews" |
| gh not installed | Provide manual PR URL |
| Memory integration fails | Log error but don't fail merge; user can run `/flow.memory --archive` manually |

## Context

$ARGUMENTS
