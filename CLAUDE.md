# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SpecFlow v3.0 is a spec-driven development framework for Claude Code. This repository contains the development source - changes are deployed to users via `./install.sh` which copies files to `~/.claude/`.

## Commands

```bash
# Smart Commands (TypeScript CLI)
specflow status              # Complete project status
specflow next                # Next actionable task with context
specflow mark T007           # Mark task complete
specflow check --fix         # Validation with auto-fix
specflow state get <key>     # State operations

# All commands support --json for machine-readable output
specflow status --json
specflow next --json
```

## Architecture

The CLI uses a TypeScript architecture with a bash dispatcher:

```
bin/specflow                 → Bash dispatcher, routes to TypeScript CLI
packages/cli/                → TypeScript CLI implementation
├── src/
│   ├── index.ts            → Main entry, Commander.js setup
│   ├── commands/           → Command implementations
│   │   ├── status.ts       → Project status command
│   │   ├── next.ts         → Next task command
│   │   ├── mark.ts         → Mark task command
│   │   ├── check.ts        → Validation command
│   │   └── state/          → State subcommands
│   └── lib/                → Shared libraries
│       ├── tasks.ts        → Parse tasks.md
│       ├── roadmap.ts      → Parse ROADMAP.md
│       ├── checklist.ts    → Parse checklists
│       ├── context.ts      → Project context resolution
│       ├── health.ts       → Health check logic
│       ├── state.ts        → State file operations
│       └── paths.ts        → Path resolution
├── tests/                  → Vitest tests
└── dist/                   → Compiled output

commands/flow.*.md          → Claude Code slash commands (/flow.*)
```

**State file**: `.specify/orchestration-state.json` in target projects.

## CLI Syntax Notes

```bash
# State operations
specflow state get orchestration.phase.number
specflow state set orchestration.step.current=verify

# Mark tasks
specflow mark T007              # Single task
specflow mark T007 T008 T009    # Multiple tasks
specflow mark T007..T010        # Range

# Validation
specflow check --gate design    # Check specific gate
specflow check --fix            # Auto-fix issues
```

## Code Style

- TypeScript with strict mode
- ESM modules
- 2-space indentation
- Vitest for testing
- Commander.js for CLI
- Zod for validation (via @specflow/shared)

## Development Workflow

1. Make changes in `packages/cli/src/`
2. Build: `pnpm --filter @specflow/cli build`
3. Test: `pnpm --filter @specflow/cli test`
4. Run: `specflow <command>`

## Key Files

- `ROADMAP.md` - Development phases and backlog
- `.specify/phases/` - Individual phase detail files
- `.specify/memory/constitution.md` - Project principles
- `packages/cli/` - TypeScript CLI source
- `commands/flow.orchestrate.md` - Main workflow command (`/flow.orchestrate`)
- `commands/flow.design.md` - Design artifacts command (`/flow.design`)

## Important Notes

- **JSON output**: All commands support `--json` for machine-readable output
- **Monorepo**: `packages/cli`, `packages/shared`, `packages/dashboard`
- **Deprecated commands**: Old bash commands (context, doctor, tasks, etc.) show migration guidance
