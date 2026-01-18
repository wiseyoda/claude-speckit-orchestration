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
