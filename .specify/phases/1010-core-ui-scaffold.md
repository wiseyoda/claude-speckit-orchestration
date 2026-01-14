---
phase: 1010
name: core-ui-scaffold
status: not_started
created: 2026-01-14
---

### 1010 - Core UI Scaffold

**Goal**: Establish the dashboard foundation with routing, layout, and project list view.

**Scope**:
- Next.js project setup with TypeScript, Tailwind, shadcn/ui
- Monorepo structure: `packages/dashboard/`, `packages/shared/`
- `speckit dashboard` CLI command to start server
- Basic layout: sidebar navigation, header, main content area
- Project list view reading from `~/.speckit/registry.json`
- Dark mode with system-aware theme switching
- Keyboard shortcut foundation (command palette shell)

**User Stories**:
1. As a developer, I run `speckit dashboard` and see my projects listed
2. As a developer, I can toggle dark/light mode
3. As a developer, I can open command palette with Cmd+K

**Deliverables**:
- `packages/dashboard/` - Next.js app with basic routing
- `packages/shared/` - Shared TypeScript types
- `scripts/bash/speckit-dashboard.sh` - CLI launcher
- `bin/speckit` dispatcher integration

**Verification Gate**: **USER VERIFICATION REQUIRED**
- `speckit dashboard` starts server on localhost
- Project list shows all registered projects
- Dark mode toggle works
- Command palette opens with Cmd+K

**Estimated Complexity**: Medium (new codebase, foundational)
