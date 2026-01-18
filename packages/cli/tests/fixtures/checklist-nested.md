# Verification Checklist: Nested Structure

**Phase**: 0042
**Purpose**: Test deeply nested checklist parsing

---

## Level 1: Main Category

### Level 2: Subcategory A

#### Level 3: Specific Items

- [x] V-001 Deeply nested checked item
- [ ] V-002 Deeply nested unchecked item
- [~] V-003 Deeply nested deferred item

#### Level 3: Another Group

- [ ] V-004 Item with `backticks`
- [ ] V-005 Item with **bold** text
- [ ] V-006 Item with [link](../spec.md)

### Level 2: Subcategory B

- [x] V-007 Item at level 2
- [ ] V-008 `specflow status --json` returns valid output
- [ ] V-009 **USER GATE**: Manual verification required

---

## Level 1: Performance Section

- [ ] V-010 Response time <500ms
- [ ] V-011 Memory usage <100MB
- [ ] V-012 CPU usage <50% during idle

---

## Items Without IDs

Some checklists don't use V-XXX format:

- [x] Basic feature works
- [ ] Edge cases handled
- [ ] Error messages are helpful
- [~] i18n support (deferred)
