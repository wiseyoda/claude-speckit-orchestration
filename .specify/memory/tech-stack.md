# Tech Stack

> Approved technologies and versions for SpecFlow.

**Last Updated**: 2026-01-18
**Constitution Alignment**: Principles IIa (TypeScript for CLI), III (CLI Over Direct Edits)

---

## Core Technologies

### Runtime Dependencies
| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| Node.js | 18+ | JavaScript runtime | Required for CLI |
| git | 2.x | Version control | Required dependency |

---

## TypeScript CLI (packages/cli/)

### Core Libraries
| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| TypeScript | 5.7+ | Type safety | Strict mode enabled |
| Commander.js | 12.x | CLI framework | Subcommands, options parsing |
| chalk | 5.x | Terminal colors | ESM-native |
| glob | 11.x | File pattern matching | Modern glob implementation |

### Build & Test
| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| tsup | 8.x | Bundler | ESM output, fast builds |
| Vitest | 2.x | Test framework | Fast, ESM-native, watch mode |
| memfs | Latest | FS mocking | In-memory filesystem for tests |

### Validation
| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| Zod | 3.x | Runtime validation | Via @specflow/shared |

---

## Web Dashboard Technologies (Milestone 1)

### Frontend
| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| Next.js | 16.x | React framework | App router, API routes |
| React | 19.x | UI library | Server components supported |
| Tailwind CSS | 3.x | Styling | Utility-first CSS |
| shadcn/ui | Latest | Components | Copy-paste, accessible |
| TypeScript | 5.x | Type safety | Strict mode enabled |

### Backend
| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| Next.js API Routes | - | REST API | Same project, simpler deployment |
| SQLite | 3.x | Persistence | better-sqlite3, local storage |
| chokidar | 3.x | File watching | Cross-platform fs events |

### Agent Integration
| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| Claude Agent SDK | Latest | Agentic workflows | Headless task execution |
| WebSocket | - | Real-time updates | Agent status streaming |

### Package Management
| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| pnpm | 8+ | Package manager | Fast, disk-efficient |

### Design Decisions
- **Aesthetic**: Linear-inspired (clean, fast, keyboard-driven)
- **Dark mode**: System-aware theme switching
- **Keyboard shortcuts**: Vim-style navigation, command palette
- **Desktop notifications**: Agent completion/errors
- **Responsive**: Desktop-only (no mobile optimization)

---

## File Conventions

### CLI (TypeScript)
- **Source**: `packages/cli/src/`
- **Commands**: `packages/cli/src/commands/`
- **Libraries**: `packages/cli/src/lib/`
- **Tests**: `packages/cli/tests/`
- **Entry point**: `bin/specflow` (bash wrapper for Node.js)

### Slash Commands
- **Commands**: `commands/flow.*.md`
- **Templates**: `templates/*.md`

### Web Dashboard (Milestone 1)
- **Dashboard app**: `packages/dashboard/` (Next.js app)
- **Shared types**: `packages/shared/` (TypeScript types)
- **Database**: `~/.specflow/specflow.db` (SQLite)
- **Agent logs**: `~/.specflow/agent-logs/` (session history)

---

## External Dependencies

### CLI Dependencies
| Dependency | Required | Check Command | Install |
|------------|----------|---------------|---------|
| Node.js | Yes | `node --version` | 18+ via nvm or brew |
| git | Yes | `git --version` | System package manager |

### Dashboard Dependencies (Milestone 1)
| Dependency | Required | Check Command | Install |
|------------|----------|---------------|---------|
| Node.js | Yes | `node --version` | 18+ via nvm or brew |
| pnpm | Yes | `pnpm --version` | `npm install -g pnpm` |

---

## Banned Patterns

| Pattern | Reason | Alternative |
|---------|--------|-------------|
| Direct JSON file edits | Consistency | Use `specflow state set` CLI |
| `any` type in TypeScript | Type safety | Use `unknown` or specific types |
| Silent failures | Debuggability | Always log errors with context |
| Untyped external data | Validation | Use Zod schemas |

---

## Adding New Technologies

Before adding a new dependency:
1. Check constitution alignment (TypeScript CLI patterns)
2. Verify it works on both macOS and Linux
3. Add fallback if dependency is optional
4. Document in this file with rationale
