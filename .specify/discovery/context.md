# Project Context

## Project Identity
| Field | Value |
|-------|-------|
| **Project Name** | SpecFlow |
| **One-line Description** | Spec-driven development framework for Claude Code that guides AI-assisted development through structured workflows |
| **Project Type** | CLI tool + Web dashboard (monorepo) |
| **Target Users** | Developers using Claude Code for software development |
| **Stage** | Active development (v3.0.0, ~12 phases complete) |
| **Criticality** | Internal/Production - used for real development projects |

## Relevance Filters

| Phase | Relevance | Notes |
|-------|-----------|-------|
| 1: Problem & Vision | High | Core value proposition well-established |
| 2: Users & Stakeholders | High | Single-user focus (individual developers) |
| 3: Functional | High | Core feature set defined |
| 4: Non-Functional | Medium | Local-first, performance via CLI optimization |
| 5: Architecture | High | Monorepo with TypeScript CLI + Next.js dashboard |
| 6: Errors & Recovery | Medium | Graceful degradation principle in constitution |
| 7: UX | High | Three-line output rule, Linear-inspired dashboard |
| 8: Operations | Medium | Local-first, no cloud infrastructure |
| 9: Testing | High | Vitest framework, memfs mocking |
| 10: Evolution | High | Active roadmap through Milestone 1 |

## Constraints & Givens

### Technical Constraints
- **macOS + Linux support**: POSIX-compliant bash for shell scripts
- **Node.js 20+**: Required for TypeScript CLI and dashboard
- **Claude Code integration**: Slash commands in `commands/flow.*.md`
- **Local-first**: No cloud dependencies, all data in project directory

### Established Decisions
- **Monorepo structure**: `packages/cli`, `packages/shared`, `packages/dashboard`
- **TypeScript CLI**: Commander.js, Zod validation, Vitest testing
- **Dashboard**: Next.js 16, React 19, Tailwind CSS, shadcn/ui
- **State management**: JSON file at `.specify/orchestration-state.json`
- **Artifact structure**: Specs in `specs/NNNN-name/`, memory in `.specify/memory/`

### Design Principles (from Constitution)
1. Developer Experience First
2. POSIX-Compliant Bash for Scripts
3. TypeScript for CLI Packages (strict mode)
4. CLI Over Direct Edits
5. Simplicity Over Cleverness
6. Helpful Error Messages
7. Graceful Degradation
8. Three-Line Output Rule

## Reference Materials

### Key Files
| File | Purpose |
|------|---------|
| `ROADMAP.md` | Phase definitions and status |
| `.specify/memory/constitution.md` | Core principles and governance |
| `packages/cli/src/index.ts` | CLI entry point |
| `commands/flow.orchestrate.md` | Main workflow command |
| `bin/specflow` | Hybrid CLI dispatcher |

### Decision Records
| PDR | Topic |
|-----|-------|
| `pdr-command-rebrand.md` | Renaming from SpecKit to SpecFlow |
| `pdr-workflow-consolidation.md` | Reducing commands from 11 to 6 |
| `pdr-preworkflow-consolidation.md` | Consolidating pre-workflow commands |
| `pdr-orchestration-engine.md` | Orchestration Engine design |

## Team & Environment

| Aspect | Details |
|--------|---------|
| **Team Size** | Solo developer with AI assistance |
| **Development Style** | Agentic sessions (~200k tokens per phase) |
| **Branching** | Feature branches with squash merge |
| **CI** | GitHub Actions (build, test, shellcheck) |
