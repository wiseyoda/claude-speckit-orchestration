# Coding Standards

> TypeScript conventions, patterns, and anti-patterns for SpecFlow v3.0.

**Last Updated**: 2026-01-18
**Constitution Alignment**: Principles IIa (TypeScript for CLI), IV (Simplicity)

---

## File Organization

### Directory Structure
```
bin/specflow                    CLI dispatcher (bash wrapper for Node.js)
packages/cli/
├── src/
│   ├── index.ts               CLI entry point (Commander.js)
│   ├── commands/              Command implementations
│   │   ├── status.ts
│   │   ├── next.ts
│   │   ├── mark.ts
│   │   ├── check.ts
│   │   ├── state/             State subcommands
│   │   └── phase/             Phase subcommands (open, close, archive, scan)
│   └── lib/                   Shared libraries
│       ├── tasks.ts           Parse tasks.md
│       ├── roadmap.ts         Parse ROADMAP.md
│       ├── checklist.ts       Parse checklists
│       ├── context.ts         Project context
│       ├── health.ts          Health checks
│       ├── state.ts           State file operations
│       ├── specs.ts           Spec archiving
│       └── paths.ts           Path resolution
├── tests/                     Vitest tests
└── dist/                      Compiled output
commands/                      Claude Code slash commands
└── flow.*.md                  /flow.orchestrate, /flow.design, etc.
templates/                     Project templates
└── *.md                       Spec, plan, tasks templates
```

### Naming Conventions

#### TypeScript
| Type | Convention | Example |
|------|------------|---------|
| Command files | `<command>.ts` | `status.ts` |
| Library files | `<name>.ts` | `tasks.ts` |
| Functions | `camelCase` | `parseTasksFile()` |
| Types/Interfaces | `PascalCase` | `TaskOutput` |
| Constants | `UPPER_SNAKE_CASE` | `EXIT_SUCCESS` |
| Variables | `camelCase` | `const filePath` |
| Boolean checks | `is` or `has` prefix | `isGitRepo()` |

---

## Exit Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 0 | Success | `process.exit(0)` |
| 1 | Error | `process.exit(1)` for fatal errors |
| 2 | Warning | `process.exit(2)` for non-critical issues |
| 64 | Usage error | Invalid command/arguments |

---

## TypeScript Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| `strict` | `true` | Type safety |
| `module` | `ESNext` | Modern ESM |
| `target` | `ES2022` | Node 18+ features |
| `moduleResolution` | `bundler` | tsup compatibility |

---

## Command Structure Pattern

```typescript
// src/commands/<command>.ts
import { Command } from 'commander';
import chalk from 'chalk';
import { output } from '../lib/output.js';

export interface CommandOutput {
  // Typed output schema
}

export function registerCommand(program: Command): void {
  program
    .command('name')
    .description('Brief description')
    .option('--json', 'JSON output')
    .action(async (options) => {
      const result = await execute(options);
      output(result, options.json);
    });
}

async function execute(options: Options): Promise<CommandOutput> {
  // Implementation
}
```

---

## Output Patterns

### Three-Line Rule Compliance

```typescript
// Human-readable output must prioritize critical info
function formatHuman(result: StatusOutput): string {
  const lines = [
    `${result.health.status === 'healthy' ? 'OK' : 'WARN'}: Phase ${result.phase.number}`,
    `Progress: ${result.progress.percentage}% (${result.progress.tasksCompleted}/${result.progress.tasksTotal})`,
    `Next: ${result.nextAction}`,
  ];
  // Additional details after line 3
  return lines.join('\n');
}
```

### JSON Output

```typescript
// All commands support --json flag
import { output } from '../lib/output.js';

// output() handles both JSON and human-readable
output(result, options.json);
```

---

## Library Patterns

### File Parsing

```typescript
// src/lib/<parser>.ts
export interface ParsedItem {
  // Strongly typed result
}

export async function parseFile(filePath: string): Promise<ParsedItem[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  // Parse and return typed result
}
```

### Error Handling

```typescript
// Use custom error classes with context
export class SpecflowError extends Error {
  constructor(
    message: string,
    public code: string,
    public suggestion?: string,
  ) {
    super(message);
    this.name = 'SpecflowError';
  }
}

// Always include actionable guidance (Principle V)
throw new SpecflowError(
  'No tasks.md found',
  'TASKS_NOT_FOUND',
  'Run /flow.design to create design artifacts',
);
```

---

## Validation with Zod

```typescript
import { z } from 'zod';

// Define schemas in @specflow/shared
export const StateSchema = z.object({
  orchestration: z.object({
    phase: z.object({
      number: z.string(),
      name: z.string(),
      status: z.enum(['pending', 'in_progress', 'complete']),
    }),
    step: z.object({
      current: z.string(),
      index: z.number(),
    }),
  }),
});

export type State = z.infer<typeof StateSchema>;
```

---

## Testing Patterns

```typescript
// tests/commands/<command>.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { vol } from 'memfs';

describe('command', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('should return expected output', async () => {
    // Setup fixtures with memfs
    vol.fromJSON({
      '/project/tasks.md': '- [ ] T001 Task one',
    });

    const result = await execute({ json: true });

    expect(result.tasks).toHaveLength(1);
  });
});
```

---

## TypeScript Code Review Checklist

- [ ] All functions have explicit return types
- [ ] No `any` types (use `unknown` if needed)
- [ ] Errors include context and suggestions
- [ ] JSON output matches documented schema
- [ ] Human output follows Three-Line Rule
- [ ] Tests use memfs for file system isolation
- [ ] Zod schemas validate external data

---

## UI Design Documentation

> Pattern for phases involving visual UI changes. Adopted from Phase 0050 (UX Simplification).

### Detection Keywords

Phases containing these keywords trigger automatic UI design artifact creation:

`dashboard`, `form`, `button`, `screen`, `page`, `view`, `component`, `modal`, `dialog`, `panel`, `widget`, `layout`, `navigation`, `menu`, `sidebar`, `header`, `footer`, `table`, `list`, `tab`

### Artifact Location

- **File**: `specs/NNNN-name/ui-design.md`
- **Created by**: `/flow.design` (step 2.5)
- **Verified by**: `specflow check --gate implement`

### Required Sections

| Section | Purpose |
|---------|---------|
| Current State (Before) | Existing UI or "New feature - no existing UI" |
| Proposed Design (After) | Description of proposed changes |
| Visual Mockup | ASCII or Mermaid diagram |
| Rationale | Why these design decisions were made |
| Component Inventory | Table of UI elements (name, type, notes) |

### Inline References

When `spec.md` mentions UI elements, add cross-references:
```markdown
The dashboard shows project status (see [ui-design.md](ui-design.md#dashboard)).
```
