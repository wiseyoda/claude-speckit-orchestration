# Sample Edge Cases Roadmap

> Edge cases for roadmap parsing

**Project**: Edge Case Testing
**Schema Version**: 2.1

---

## Phase Overview

| Phase | Name | Status | Verification Gate |
|-------|------|--------|-------------------|
| 0010 | Initial Setup | ✅ Complete | All tests pass |
| 0011 | Hotfix: Critical Bug | ✅ Complete | Bug fixed |
| 0020 | Core Feature with Long Name That Spans | 🔄 In Progress | Works end-to-end |
| 0030 | API: v2 Endpoints | ⬜ Not Started | **USER GATE**: API works |
| 0040 | Performance (Critical) | ⬜ Not Started | <100ms response |
| 1010 | Dashboard | ⬜ Not Started | **USER GATE**: Loads |

**Legend**: ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## Alternative Status Formats

Some projects use different status text:

| Phase | Name | Status |
|-------|------|--------|
| 2010 | Alpha Phase | COMPLETE |
| 2020 | Beta Phase | IN_PROGRESS |
| 2030 | Gamma Phase | PENDING |
| 2040 | Delta Phase | BLOCKED |
| 2050 | Epsilon Phase | DONE |

---

## Phases with Special Characters

| Phase | Name | Status |
|-------|------|--------|
| 0050 | Setup: Node.js & npm | ✅ Complete |
| 0060 | API (REST/GraphQL) | ⬜ Not Started |
| 0070 | Auth - OAuth 2.0 | ⬜ Not Started |
| 0080 | i18n/l10n Support | ⬜ Not Started |

---

## Backlog Section

### High Priority

- Real-time notifications via WebSocket
- Multi-tenant support with row-level security

### Medium Priority

- Dark mode toggle with system preference detection
- Keyboard shortcuts (Cmd+K command palette)

### Low Priority

- Plugin architecture for extensions
- GraphQL subscriptions

---

## Notes

- Phase names can contain colons, parentheses, and other special characters
- Status can be emoji or text-based
- Hotfix phases use trailing digit (0011, 0021, etc.)
- Verification gates may include **bold** USER GATE markers
