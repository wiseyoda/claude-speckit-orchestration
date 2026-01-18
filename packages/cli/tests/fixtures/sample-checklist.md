# Verification Checklist: Sample Feature

**Purpose**: Verify feature meets acceptance criteria and is ready for merge
**Created**: 2026-01-18
**Feature**: [spec.md](../spec.md)

---

## Acceptance Criteria

### US1: Authentication Command

- [x] V-001 `specflow auth --json` returns valid token in single call
- [x] V-002 Token stored securely in `~/.specflow/credentials.json`
- [ ] V-003 Expired tokens trigger re-authentication automatically
- [ ] V-004 Invalid credentials show actionable error message
- [ ] V-005 `--refresh` flag forces token refresh

### US2: API Integration

- [ ] V-006 `specflow api call /endpoint` returns structured JSON
- [ ] V-007 Retry logic handles 429 (rate limit) responses correctly
- [ ] V-008 `--timeout` flag accepts milliseconds (default: 30000)
- [ ] V-009 Network errors include context and next steps
- [~] V-010 WebSocket support (deferred to next phase)

### US3: Health Monitoring

- [ ] V-011 `specflow health --json` returns complete health status
- [ ] V-012 Issues detected with severity levels (error, warning, info)
- [ ] V-013 Auto-fix suggestions include exact commands to run
- [ ] V-014 **USER GATE**: Health dashboard displays correctly

---

## End-to-End Workflow

- [ ] V-015 Full workflow works: auth → api → health cycle
- [ ] V-016 Claude can orient with single `specflow status --json` call
- [ ] V-017 Task completion workflow requires max 2 CLI calls (mark + optional next)
- [ ] V-018 Gate validation catches real issues before step transitions

---

## Performance

- [ ] V-019 `specflow status` completes in <500ms
- [ ] V-020 `specflow auth` completes in <1000ms (excluding network)
- [ ] V-021 `specflow health` completes in <500ms
- [x] V-022 Build time under 5 seconds
- [ ] V-023 Memory usage stays below 100MB for large projects

---

## Regression

- [ ] V-024 Existing bash commands still work via fallback
- [ ] V-025 State file readable by both TypeScript and bash
- [x] V-026 Slash commands execute without errors
- [ ] V-027 Dashboard still reads state correctly

---

## Security

- [ ] V-028 Credentials never logged to console
- [ ] V-029 API keys excluded from error messages
- [x] V-030 Input validation prevents injection attacks
- [ ] V-031 File permissions set to 600 for credential files

---

## Documentation

- [x] V-032 CLAUDE.md updated with new CLI architecture
- [ ] V-033 cli-design.md output schemas match actual output
- [ ] V-034 No dead links in spec documentation

---

## Success Metrics

- [ ] V-035 CLI calls per phase reduced from 50-100 to 10-15
- [ ] V-036 Test coverage exceeds 80%
- [ ] V-037 All 5 smart commands return JSON matching documented schemas

---

## Code Quality

### Linting & Types

- [x] No TypeScript errors (`pnpm typecheck`)
- [x] No ESLint warnings (`pnpm lint`)
- [ ] No console.log statements in production code

### Test Coverage

- [ ] Unit tests for all public functions
- [ ] Integration tests for command flows
- [ ] Edge case coverage for parsing logic

---

## Notes

- Check items off as verified: `[x]`
- Use `[~]` for deferred items
- Items marked [x] were verified in prior implementation
- Gate: All V-* items must pass before merge
- Run full verification in clean environment (fresh clone)
