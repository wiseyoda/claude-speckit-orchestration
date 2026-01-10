# SpecKit Command Audit

> Generated during v2.0 refactoring - Phase 0

## CLI Commands (bin/speckit)

| Command | Script | Status | Notes |
|---------|--------|--------|-------|
| `state` | speckit-state.sh | Implemented | Full CRUD operations |
| `scaffold` | speckit-scaffold.sh | Implemented | Project structure creation |
| `git` | speckit-git.sh | Implemented | Branch, commit, merge, push |
| `roadmap` | speckit-roadmap.sh | Partial | `update` needs work |
| `claude-md` | speckit-claude-md.sh | Implemented | Update and sync |
| `checklist` | speckit-checklist.sh | Implemented | Status, list, incomplete |
| `tasks` | speckit-tasks.sh | Partial | `mark` needs verification |
| `templates` | speckit-templates.sh | Implemented | Check, update, diff |
| `doctor` | speckit-doctor.sh | Implemented | Diagnostics, auto-fix |
| `detect` | speckit-detect.sh | Implemented | Content detection |
| `reconcile` | speckit-reconcile.sh | Implemented | State/file sync |

## Missing CLI Commands (P0)

| Command | Purpose | Priority |
|---------|---------|----------|
| `context` | Get current feature context (replace check-prerequisites.sh) | P0 |
| `feature create` | Create new feature structure | P0 |

## Broken Scripts

| Script | Issue |
|--------|-------|
| `check-prerequisites.sh` | References undefined functions: `get_feature_paths`, `check_feature_branch`, `check_file`, `check_dir`. Sources `common.sh` from wrong path. |

## Claude Commands (commands/*.md)

### Core Workflow (Keep)
- `speckit.start.md` - Smart entry point
- `speckit.init.md` - Project initialization
- `speckit.constitution.md` - Constitution editing
- `speckit.roadmap.md` - ROADMAP management
- `speckit.orchestrate.md` - Workflow runner
- `speckit.specify.md` - Create specification
- `speckit.plan.md` - Create plan
- `speckit.tasks.md` - Generate tasks
- `speckit.implement.md` - Execute tasks
- `speckit.verify.md` - Verify completion
- `speckit.memory.md` - Memory management
- `speckit.analyze.md` - Cross-artifact analysis

### Init Sub-commands (Merge into speckit.init.md)
- `speckit.init-status.md` - Show progress
- `speckit.init-skip.md` - Skip phase
- `speckit.init-pause.md` - Pause interview
- `speckit.init-validate.md` - Validate interview
- `speckit.init-export.md` - Export to memory
- `speckit.init-compare.md` - Compare options
- `speckit.init-deeper.md` - Go deeper
- `speckit.init-faster.md` - Go faster
- `speckit.init-focus.md` - Focus on topic
- `speckit.init-research.md` - Research topic
- `speckit.init-revisit.md` - Revisit phase

### To Merge/Remove
- `speckit.clarify.md` - Merge into specify
- `speckit.checklist.md` - Merge into verify
- `speckit.taskstoissues.md` - Move to utilities

## Scripts Library

### lib/common.sh
Provides:
- Logging: `log_info`, `log_error`, `log_warn`, `log_success`, `log_debug`, `log_step`
- Paths: `get_repo_root`, `get_specify_dir`, `get_state_file`, `get_speckit_system_dir`
- Validation: `is_git_repo`, `is_speckit_project`, `validate_context`, `validate_speckit_project`
- Utils: `command_exists`, `require_jq`, `ensure_dir`, `file_exists`
- Output: `print_header`, `print_section`, `print_status`, `is_json_output`

### lib/json.sh
Provides:
- JSON operations via jq wrappers

## Action Items for Phase 1

1. **Create `speckit context`** - Replace check-prerequisites.sh
   - Detect current branch pattern (NNN-feature-name)
   - Find feature directory in specs/
   - Return available docs
   - JSON output support

2. **Create `speckit feature create`** - New feature scaffolding
   - Create specs/NNN-feature-name/
   - Initialize empty spec.md from template
   - Update state file

3. **Fix/verify `speckit roadmap update`**
   - Ensure phase status updates work
   - JSON output

4. **Fix/verify `speckit tasks mark`**
   - Ensure task completion works
   - State file updates

5. **Delete check-prerequisites.sh** after context command works
