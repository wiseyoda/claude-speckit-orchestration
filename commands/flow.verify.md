---
description: Verify feature completion, compliance with memory documents, checklist status, and readiness for merge.
handoffs:
  - label: Start Next Feature
    agent: specflow.specify
    prompt: Create a specification for the next feature. I want to build...
  - label: Continue Orchestration
    agent: specflow.orchestrate
    prompt: Continue to the next phase
    send: true
  - label: Continue Later
    agent: specflow.orchestrate
    prompt: Resume development workflow
---

## User Input

```text
$ARGUMENTS
```

Arguments:

- Empty: Run full verification (tasks, checklists, memory, user gate)
- `--dry-run`: Preview verification without updating state
- `--skip-memory`: Skip memory document compliance check

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Verify a completed feature phase is ready for merge:

1. All tasks complete (or explicitly deferred)
2. All checklists pass
3. Implementation complies with memory documents
4. User gate satisfied (if applicable)

**Note**: This command verifies readiness but does NOT close the phase. Use `/flow.merge` to close, push, and merge.

---

## Step 0: Create Todo List

**Create todo list immediately (use TodoWrite):**

1. [VERIFY] CONTEXT - Get project status
2. [VERIFY] IMPL_GATE - Verify all tasks complete
3. [VERIFY] VERIFY_GATE - Complete all checklists
4. [VERIFY] MEMORY - Check against memory docs
5. [VERIFY] REPORT - Mark verified and report

Set [VERIFY] CONTEXT to in_progress.

## Step 1: Get Project Context

```bash
specflow status --json
```

Parse the JSON to understand:

- Current phase number and name
- Active feature directory
- Task completion status
- Checklist status
- Whether phase has USER GATE marker

If no active phase, stop: "No active phase. Use `specflow phase open` first."

Use TodoWrite: mark [VERIFY] CONTEXT complete, mark [VERIFY] IMPL_GATE in_progress.

---

## Step 2: Check Implementation Gate

```bash
specflow check --gate implement --json
```

This verifies all tasks are complete.

**If gate fails** (incomplete tasks exist):

Run `specflow next --json` to see what's remaining.

For each incomplete task, offer choices:

1. **Complete it now** - If feasible, finish the task
2. **Defer to backlog** - `specflow phase defer "T###: Description - reason"`
3. **Block verification** - Cannot proceed until resolved

After resolving, re-run `specflow check --gate implement` until it passes.

Use TodoWrite: mark [VERIFY] IMPL_GATE complete, mark [VERIFY] VERIFY_GATE in_progress.

---

## Step 3: Check Verification Gate

```bash
specflow check --gate verify --json
```

This verifies all checklists are complete.

**If gate fails** (incomplete checklist items):

For each incomplete item, you MUST **actively verify** it:

1. **Read the verification criteria** from the checklist
2. **Execute the verification** - Run commands, check code, verify behavior
3. **Mark complete if it passes**:
   ```bash
   specflow mark V-001   # Verification checklist item
   specflow mark I-001   # Implementation checklist item
   ```
4. **Document failures** - If item cannot pass, note why and ask user

**Checklist ID Prefixes:**

- `V-###` - Verification checklist items
- `I-###` - Implementation checklist items
- `C-###` - Custom/other checklist items
- `D-###` - Deferred items

After resolving, re-run `specflow check --gate verify` until it passes.

Use TodoWrite: mark [VERIFY] VERIFY_GATE complete, mark [VERIFY] MEMORY in_progress.

---

## Step 4: Memory Document Compliance

Check implementation against memory documents in `.specify/memory/`:

### 4a. Constitution Compliance (constitution.md)

**CRITICAL** - Constitution violations block verification.

| Check                 | How to Verify                                          |
| --------------------- | ------------------------------------------------------ |
| MUST requirements     | Search code for each MUST item, confirm implementation |
| Core principles       | Review changes don't violate stated principles         |
| Documented deviations | Any deviation from constitution should be in plan.md   |

### 4b. Tech Stack Compliance (tech-stack.md)

| Check                   | How to Verify                                      |
| ----------------------- | -------------------------------------------------- |
| Approved technologies   | Any new dependencies match approved list           |
| Version constraints     | Check package.json/lockfile for version compliance |
| Undeclared dependencies | Search for imports not in approved stack           |

### 4c. Coding Standards (coding-standards.md)

| Check                  | How to Verify                                      |
| ---------------------- | -------------------------------------------------- |
| Naming conventions     | Spot-check new files/functions for naming patterns |
| Code organization      | Verify files are in correct directories            |
| TypeScript conventions | Check for any type violations (run `tsc --noEmit`) |

### 4d. Testing Strategy (testing-strategy.md)

| Check         | How to Verify                            |
| ------------- | ---------------------------------------- |
| Test coverage | Run tests, verify critical paths covered |
| Test patterns | Check tests follow project patterns      |
| Missing tests | Any new functionality without tests      |

### 4e. Security Checklist (security-checklist.md)

| Check            | How to Verify                       |
| ---------------- | ----------------------------------- |
| Input validation | User inputs validated at boundaries |
| Error handling   | No sensitive info in error messages |
| Authentication   | Auth checks on sensitive operations |

**Produce compliance summary:**

```text
| Memory Document | Status | Issues |
|-----------------|--------|--------|
| constitution.md | PASS | - |
| tech-stack.md | PASS | - |
| coding-standards.md | WARN | 2 minor naming deviations |
| testing-strategy.md | PASS | - |
| security-checklist.md | N/A | No security changes |
```

If any FAIL status, address issues before proceeding.

Use TodoWrite: mark [VERIFY] MEMORY complete, mark [VERIFY] REPORT in_progress.

---

## Step 5: User Gate Check

From status output, check if phase has USER GATE marker.

**If USER GATE exists:**

Use `AskUserQuestion` to confirm with user:

```
Phase {number} requires user verification before closing.

Verification Criteria:
- [List criteria from ROADMAP.md or phase detail]

Verification Artifacts:
- [List paths to POC pages, test pages, etc.]

Has the user verified this phase works correctly?
```

Options:

- **Yes, verified** - Proceed to close
- **No, needs work** - Stop verification, list what needs fixing
- **Skip gate** - Mark verified without user verification (document why)

**If no USER GATE**: Proceed directly to mark verified.

---

## Step 6: Mark Verification Complete

**IMPORTANT**: Do NOT close the phase here. Only `/flow.merge` should close phases.

Update the orchestration state to indicate verification passed:

```bash
specflow state set orchestration.step.current=verified
```

Use TodoWrite: mark [VERIFY] REPORT complete.

---

## Step 7: Verification Report

Display summary:

```markdown
# Verification Complete

**Phase**: {number} - {name}
**Status**: VERIFIED (Ready for Merge)

## Summary

| Check             | Status              |
| ----------------- | ------------------- |
| Tasks             | {completed}/{total} |
| Checklists        | PASS                |
| Memory Compliance | PASS                |
| User Gate         | PASS / N/A          |

## How to Verify & Test

Detailed instructions on how to verify this feature as a user. Include:
- How to start the dev server
- Any required environment variables
- Step-by-step testing instructions
- Expected behavior

## Deferred Items

{count} items will be added to BACKLOG.md on merge.

## Next Step

Run `/flow.merge` to close the phase, push changes, and merge to main.
```

---

## Handle Failures

If verification cannot complete:

1. Do NOT close the phase
2. List all failing items with remediation steps
3. Ask: "Would you like me to attempt fixes?"

If user approves:

- Complete incomplete tasks
- Mark checklist items after verification
- Re-run verification after fixes

---

## Operating Principles

### Verification Standards

- **Be thorough**: Check everything, assume nothing
- **Be specific**: Cite exact files, line numbers, task IDs
- **Be actionable**: Every issue should have clear remediation
- **Be honest**: Don't mark things complete that aren't

### ROADMAP Integrity

- Only mark verified if ALL verification checks pass
- USER GATE phases require explicit user confirmation
- **Do NOT close phase** - only `/flow.merge` closes phases

### Context Efficiency

- Use CLI commands for status checks (faster than reading files)
- Load only necessary sections of large files
- Aggregate similar issues rather than listing each individually

## Context

$ARGUMENTS
