# Feature Specification: Code Review 20260118

**Feature Branch**: `0082-code-review-20260118`
**Created**: 2026-01-18
**Status**: Ready
**Input**: Code review from `.specify/reviews/review-20260118-115354.md`

---

## User Scenarios & Testing

### User Story 1 - Remove Dead Code (Priority: P1)

Remove 18k+ lines of deprecated bash scripts and unused exports to reduce maintenance burden and codebase complexity.

**Why this priority**: Largest single impact. Reduces codebase by ~40%. Eliminates confusion about which code is active.

**Independent Test**: Run `pnpm build && pnpm test` - should pass. Verify `specflow` commands still work.

**Acceptance Scenarios**:

1. **Given** scripts/bash/ directory exists, **When** OC007 is complete, **Then** directory is deleted and all specflow commands still work
2. **Given** unused exports exist, **When** OC001-OC006/OC008-OC009 complete, **Then** exports are removed and build succeeds

---

### User Story 2 - Best Practices & Error Handling (Priority: P2)

Improve error handling consistency by using SpecflowError classes, adding type guards, and documenting intentional catch blocks.

**Why this priority**: Improves debugging and maintainability. Foundation for other improvements.

**Independent Test**: Run `specflow check --gate implement` with invalid inputs - errors should be informative with error codes.

**Acceptance Scenarios**:

1. **Given** generic Error throw in phase/add.ts, **When** BP001 complete, **Then** SpecflowError with code is used
2. **Given** silent catch blocks, **When** BP003 complete, **Then** all have explanatory comments

---

### User Story 3 - Code Refactoring (Priority: P3)

Reduce code complexity by extracting helper functions, reducing nesting, and applying DRY principles.

**Why this priority**: Makes code easier to maintain and test. High impact on health.ts (213-line function).

**Independent Test**: Functions should be shorter, more focused. Test coverage should remain same or improve.

**Acceptance Scenarios**:

1. **Given** collectIssues() is 213 lines, **When** RF003 complete, **Then** split into specialized checker functions <50 lines each
2. **Given** status.ts has 4+ level nesting, **When** RF002 complete, **Then** max 2 levels with early returns

---

### User Story 4 - Security Hardening (Priority: P4)

Add input validation, prevent race conditions, and sanitize user input to improve security posture.

**Why this priority**: Security improvements should be done early. Some findings (HD004) are complex.

**Independent Test**: Inject malicious input (special characters in branch names) - should be sanitized or rejected.

**Acceptance Scenarios**:

1. **Given** branch name with command injection chars, **When** HD009 complete, **Then** only safe characters allowed
2. **Given** concurrent file writes, **When** HD004 complete, **Then** atomic operations prevent corruption

---

### User Story 5 - Missing Features (Priority: P5)

Complete incomplete implementations like --blocked option and auto-fix capabilities.

**Why this priority**: Completes advertised functionality. Lower priority as features work partially.

**Independent Test**: `specflow mark T001 --blocked "reason"` should work and store reason.

**Acceptance Scenarios**:

1. **Given** --blocked option declared in help, **When** MF001/MF002 complete, **Then** blocking works and reason is stored
2. **Given** STATE_ROADMAP_DRIFT marked autoFixable, **When** MF003 complete, **Then** auto-fix actually works

---

### User Story 6 - Documentation Updates (Priority: P6)

Update outdated documentation to match current CLI behavior.

**Why this priority**: Lowest code risk. Can be done last or in parallel.

**Independent Test**: README links work. CLAUDE.md commands match actual CLI.

**Acceptance Scenarios**:

1. **Given** README.md has broken links, **When** OD001 complete, **Then** all links resolve
2. **Given** CLAUDE.md missing state/ subcommands, **When** OD002/OD003 complete, **Then** command structure documented

---

### Edge Cases

- What happens if RF003 split creates test coverage gaps? Add tests for new functions.
- What happens if OC007 bash deletion breaks install.sh? Verify dependencies first.
- How does HD004 atomic ops handle disk full? Document failure modes.

---

## Requirements

### Functional Requirements

#### Best Practices (BP)

- **FR-BP001**: System MUST use SpecflowError subclasses instead of generic Error
- **FR-BP002**: Type assertions MUST have guard or justification comment
- **FR-BP003**: Silent catch blocks MUST have explanatory comments
- **FR-BP004**: All `as` casts MUST have inline justification comments
- **FR-BP005**: Empty catch blocks MUST use `catch (err: unknown)` pattern
- **FR-BP006**: Output function pattern MUST be consistent across commands
- **FR-BP007**: Path constants MUST be extracted at top of bin/specflow
- **FR-BP008**: Error format() MUST include error code

#### Refactoring (RF)

- **FR-RF001**: Phase state updates MUST use extracted helper functions
- **FR-RF002**: getStatus() MUST use early returns, max 2 levels nesting
- **FR-RF003**: collectIssues() MUST be split into functions <50 lines
- **FR-RF004**: Status mapping MUST be in constants file
- **FR-RF005**: determineNextAction MUST use strategy map pattern
- **FR-RF006**: Pattern extraction MUST use extractByPattern() utility
- **FR-RF007**: State update chains MUST use batch update function
- **FR-RF008**: Checkbox parsing MUST use shared lib/markdown.ts
- **FR-RF009**: Context resolution MUST consolidate matching logic
- **FR-RF010**: Checklist type switch MUST use map-based registry
- **FR-RF011**: Artifact checking MUST use ArtifactValidator namespace

#### Hardening (HD)

- **FR-HD001**: File reads MUST wrap in try/catch with specific error types
- **FR-HD002**: Bash jq calls MUST use --arg for user input
- **FR-HD003**: CLI args MUST be validated with Zod schemas
- **FR-HD004**: File writes MUST use atomic operations (temp + rename)
- **FR-HD005**: JSON parsing MUST use Zod schema validation
- **FR-HD006**: State structure MUST be validated early
- **FR-HD007**: Mark file operations MUST have try/catch with context
- **FR-HD008**: Bash scripts MUST document set -euo pipefail requirement
- **FR-HD009**: Branch names MUST be sanitized to safe characters only
- **FR-HD010**: Regex MUST have length bounds
- **FR-HD011**: parseRoadmapContent MUST have Zod validation for Phase
- **FR-HD013**: Bash temp files MUST have cleanup trap for EXIT/INT/TERM
- **FR-HD014**: parseValue() MUST check string length before JSON.parse
- **FR-HD015**: Task dependencies MUST be validated post-parse

#### Missing Features (MF)

- **FR-MF001**: mark.ts MUST implement --blocked option fully
- **FR-MF002**: Task interface MUST include blockedReason field
- **FR-MF003**: STATE_ROADMAP_DRIFT MUST have working auto-fix
- **FR-MF004**: STATE_INVALID MUST have working auto-fix or remove flag
- **FR-MF005**: HistoryEntry type SHOULD be in @specflow/shared
- **FR-MF006**: Phase template MAY be context-aware (low priority)
- **FR-MF007**: Backlog table parsing MUST be strengthened

#### Orphaned Code (OC)

- **FR-OC001**: MUST delete touchProject, unregisterProject, getRegisteredProjects
- **FR-OC002**: MUST delete getPhaseFilePath, isPhaseArchived
- **FR-OC003**: MUST delete getPhasesByStatus, hasPendingUserGates
- **FR-OC004**: MUST delete getAutoFixableIssues
- **FR-OC005**: MUST delete getOutputOptions, table()
- **FR-OC006**: MUST remove export from readChecklist
- **FR-OC007**: MUST delete entire scripts/bash/ directory
- **FR-OC008**: MUST remove export from internal helpers in context.ts, backlog.ts
- **FR-OC009**: MUST remove export from getFeatureContext

#### Outdated Docs (OD)

- **FR-OD001**: README.md links MUST resolve to existing files
- **FR-OD002**: CLAUDE.md MUST document state/ and phase/ subcommands
- **FR-OD003**: CLAUDE.md commands table MUST be complete
- **FR-OD004**: flow.orchestrate.md MUST have correct command flags
- **FR-OD005**: mark.ts --blocked MUST be implemented or removed from help
- **FR-OD006**: memory/*.md MUST clarify TypeScript vs bash patterns
- **FR-OD007**: bin/specflow help MUST show subcommands
- **FR-OD008**: testing-strategy.md MUST have correct pnpm test commands
- **FR-OD009**: flow.orchestrate.md MUST document exit codes
- **FR-OD010**: tech-stack.md MUST use phase-based terminology

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: All 59 approved findings implemented and verified
- **SC-002**: Test suite passes after changes (`pnpm test`)
- **SC-003**: Build succeeds without new errors (`pnpm build`)
- **SC-004**: No new linting warnings introduced
- **SC-005**: All documentation links resolve correctly
- **SC-006**: Codebase reduced by ~18k lines (scripts/bash/ deletion)
