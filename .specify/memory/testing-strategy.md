# Testing Strategy

> Vitest testing framework, patterns, and coverage approach for SpecFlow TypeScript CLI.

**Last Updated**: 2026-01-18
**Constitution Alignment**: Principles IIa (TypeScript for CLI), V (Helpful Errors)

---

# TypeScript Test Framework

> Vitest testing for `packages/cli/` TypeScript commands.

---

## Framework Overview

| Property | Value |
|----------|-------|
| Framework | Vitest |
| Runner | `pnpm --filter @specflow/cli test` |
| Discovery | `*.test.ts` files in `packages/cli/tests/` |
| Isolation | memfs for file system mocking |
| Coverage | `pnpm --filter @specflow/cli test:coverage` |

---

## Directory Structure

```
packages/cli/tests/
├── commands/              # Command tests
│   ├── status.test.ts
│   ├── next.test.ts
│   ├── mark.test.ts
│   ├── check.test.ts
│   └── phase/
│       ├── open.test.ts
│       └── close.test.ts
├── lib/                   # Library tests
│   ├── tasks.test.ts
│   ├── roadmap.test.ts
│   ├── checklist.test.ts
│   └── context.test.ts
└── fixtures/              # Test data
    ├── tasks.md
    └── ROADMAP.md
```

---

## Running Tests

```bash
# All tests
pnpm --filter @specflow/cli test

# Watch mode
pnpm --filter @specflow/cli test:watch

# Specific file
pnpm --filter @specflow/cli test status

# With coverage
pnpm --filter @specflow/cli test:coverage
```

---

## Test Structure Pattern

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { vol } from 'memfs';

// Mock fs with memfs
vi.mock('fs', async () => {
  const memfs = await import('memfs');
  return memfs.fs;
});

describe('command', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('should handle happy path', async () => {
    // Setup
    vol.fromJSON({
      '/project/tasks.md': '- [ ] T001 Task one',
    });

    // Execute
    const result = await execute({ json: true });

    // Assert
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].id).toBe('T001');
  });

  it('should handle error case', async () => {
    vol.fromJSON({}); // No tasks file

    await expect(execute({})).rejects.toThrow('No tasks.md found');
  });
});
```

---

## Assertion Patterns

```typescript
// Structure assertions
expect(result).toMatchObject({
  phase: { number: '0080' },
  progress: { percentage: expect.any(Number) },
});

// Array assertions
expect(result.tasks).toHaveLength(5);
expect(result.tasks).toContainEqual(
  expect.objectContaining({ id: 'T001' }),
);

// Error assertions
await expect(execute()).rejects.toThrow('Expected error');
await expect(execute()).rejects.toMatchObject({
  code: 'TASKS_NOT_FOUND',
});
```

---

## Fixture Patterns

### Inline Fixtures (memfs)

```typescript
vol.fromJSON({
  '/project/tasks.md': `
- [ ] T001 First task
- [x] T002 Completed task
- [ ] T003 Blocked task [BLOCKED: waiting on T001]
  `.trim(),
  '/project/ROADMAP.md': `
| Phase | Name | Status |
|-------|------|--------|
| 0080 | test | 🔄 |
  `.trim(),
});
```

### External Fixtures

```typescript
import { readFixture } from './helpers.js';

const tasksContent = readFixture('tasks-with-dependencies.md');
vol.fromJSON({ '/project/tasks.md': tasksContent });
```

---

## Coverage Approach

### Tested (High Coverage)

- Command execution (status, next, mark, check, phase)
- JSON output schemas
- File parsing (tasks.md, ROADMAP.md, checklists)
- Error handling with context

### Medium Coverage

- Edge cases (empty files, malformed markdown)
- State transitions
- Multi-file operations

### Not Tested

- Actual file system operations (mocked with memfs)
- Git operations (mocked)
- External process calls

---

## Adding New TypeScript Tests

1. Create `packages/cli/tests/<area>/<name>.test.ts`
2. Import test utilities and memfs
3. Mock file system with `vol.fromJSON()`
4. Write describe/it blocks with clear names
5. Run with `pnpm --filter @specflow/cli test <name>`
6. Verify coverage with `test:coverage`

---

# Integration & E2E Testing

> Strategy for testing CLI commands against real file systems and the full workflow.

---

## Integration Test Approach

Integration tests verify that CLI commands work correctly with actual file operations and real project structures.

### When to Use Integration Tests

| Scenario | Unit Test | Integration Test |
|----------|-----------|------------------|
| Parsing logic (tasks.md, ROADMAP.md) | ✅ | - |
| JSON output format | ✅ | - |
| Command execution flow | ✅ | - |
| Full `specflow status` with real project | - | ✅ |
| Git operations (branch, commit) | - | ✅ |
| Multi-command workflows | - | ✅ |

### Integration Test Structure

```
packages/cli/tests/
├── integration/           # Integration tests
│   ├── status.int.test.ts
│   ├── phase-lifecycle.int.test.ts
│   └── fixtures/
│       └── sample-project/
│           ├── .specify/
│           ├── ROADMAP.md
│           └── specs/
```

### Running Integration Tests

```bash
# Run only integration tests
pnpm --filter @specflow/cli test:integration

# Full test suite (unit + integration)
pnpm --filter @specflow/cli test:all
```

---

## E2E Testing Strategy

End-to-end tests verify the complete SpecFlow workflow from project initialization through phase completion.

### E2E Test Scenarios

| Scenario | Commands Tested | Verification |
|----------|-----------------|--------------|
| Fresh project setup | `specflow status`, `specflow phase open` | State file created, phase active |
| Complete phase cycle | `mark`, `check`, `phase close` | ROADMAP updated, phase archived |
| Error recovery | Invalid state, missing files | Helpful error messages, graceful handling |

### E2E Test Pattern

```typescript
// tests/e2e/phase-lifecycle.e2e.test.ts
import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('Phase Lifecycle E2E', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'specflow-e2e-'));
    // Create minimal project structure
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true });
  });

  it('should complete full phase lifecycle', () => {
    // 1. Initialize
    execSync('specflow phase open 0010 test-phase', { cwd: testDir });

    // 2. Verify state
    const status = execSync('specflow status --json', { cwd: testDir });
    expect(JSON.parse(status.toString())).toMatchObject({
      phase: { number: '0010', status: 'in_progress' },
    });

    // 3. Complete phase
    execSync('specflow phase close', { cwd: testDir });

    // 4. Verify archived
    const finalStatus = execSync('specflow status --json', { cwd: testDir });
    expect(JSON.parse(finalStatus.toString()).phase.status).toBe('complete');
  });
});
```

---

## CI Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm install
      - run: pnpm build:cli
      - run: pnpm test:cli        # Unit tests
      # - run: pnpm test:integration  # Integration tests (future)
```

### Test Matrix

| Test Type | macOS | Linux | Windows |
|-----------|-------|-------|---------|
| Unit (Vitest + memfs) | ✅ | ✅ | ⬜ |
| Integration | ✅ | ✅ | ⬜ |
| E2E | ✅ | ✅ | ⬜ |

Windows support is not prioritized (Constitution: macOS + Linux focus).
