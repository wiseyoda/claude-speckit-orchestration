import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseChecklistContent,
  findNextChecklistItem,
  getChecklistItemById,
  areAllChecklistsComplete,
  type FeatureChecklists,
} from '../../src/lib/checklist.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, '../fixtures');

describe('checklist.ts', () => {
  describe('parseChecklistContent - sample-checklist.md', () => {
    it('should parse checklist from markdown content', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'sample-checklist.md'), 'utf-8');
      const result = parseChecklistContent(content, 'test/verification.md');

      expect(result.title).toBe('Verification Checklist: Sample Feature');
      // Sample checklist has many items across sections
      expect(result.items.length).toBeGreaterThanOrEqual(30);
      // Multiple sections: Acceptance Criteria, End-to-End, Performance, etc.
      expect(result.sections.length).toBeGreaterThanOrEqual(6);
    });

    it('should detect checklist type from filename', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'sample-checklist.md'), 'utf-8');

      const verification = parseChecklistContent(content, 'verification.md');
      expect(verification.type).toBe('verification');

      const implementation = parseChecklistContent(content, 'implementation.md');
      expect(implementation.type).toBe('implementation');

      const deferred = parseChecklistContent(content, 'deferred.md');
      expect(deferred.type).toBe('deferred');
    });

    it('should calculate progress correctly', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'sample-checklist.md'), 'utf-8');
      const result = parseChecklistContent(content, 'test/verification.md');

      expect(result.progress.total).toBeGreaterThan(0);
      expect(result.progress.completed).toBeGreaterThan(0);
      expect(result.progress.skipped).toBeGreaterThan(0); // Has [~] items
    });

    it('should extract existing V-XXX IDs from content', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'sample-checklist.md'), 'utf-8');
      const result = parseChecklistContent(content, 'verification.md');

      // The sample-checklist.md has items like V-001, V-002, etc.
      expect(result.items.some(i => i.id === 'V-001')).toBe(true);
      expect(result.items.some(i => i.id === 'V-002')).toBe(true);
      expect(result.items.some(i => i.id === 'V-010')).toBe(true);
    });

    it('should parse item status correctly', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'sample-checklist.md'), 'utf-8');
      const result = parseChecklistContent(content, 'test/checklist.md');

      const statuses = result.items.map(i => i.status);
      expect(statuses).toContain('done');
      expect(statuses).toContain('todo');
      expect(statuses).toContain('skipped');
    });

    it('should identify sections', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'sample-checklist.md'), 'utf-8');
      const result = parseChecklistContent(content, 'test/checklist.md');

      const sectionNames = result.sections.map(s => s.name);
      expect(sectionNames).toContain('Acceptance Criteria');
      expect(sectionNames).toContain('Performance');
      expect(sectionNames).toContain('Security');
    });

    it('should handle items with backticks', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'sample-checklist.md'), 'utf-8');
      const result = parseChecklistContent(content, 'test/checklist.md');

      // V-001 has backticks: `specflow auth --json`
      const v001 = result.items.find(i => i.id === 'V-001');
      expect(v001?.description).toContain('`specflow auth --json`');
    });

    it('should handle items with bold USER GATE markers', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'sample-checklist.md'), 'utf-8');
      const result = parseChecklistContent(content, 'test/checklist.md');

      // V-014 has **USER GATE**: marker
      const v014 = result.items.find(i => i.id === 'V-014');
      expect(v014?.description).toContain('**USER GATE**');
    });
  });

  describe('parseChecklistContent - checklist-flat.md', () => {
    it('should parse flat checklist without sections', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'checklist-flat.md'), 'utf-8');
      const result = parseChecklistContent(content, 'implementation.md');

      expect(result.title).toBe('Implementation Checklist');
      expect(result.items.length).toBe(7);
      expect(result.sections.length).toBe(0); // No ## headers
    });

    it('should auto-generate IDs for items without existing IDs', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'checklist-flat.md'), 'utf-8');
      const result = parseChecklistContent(content, 'implementation.md');

      // Items don't have existing IDs, should auto-generate I-001, I-002, etc.
      expect(result.items[0].id).toBe('I-001');
      expect(result.items[1].id).toBe('I-002');
    });

    it('should handle bold CRITICAL markers', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'checklist-flat.md'), 'utf-8');
      const result = parseChecklistContent(content, 'implementation.md');

      const criticalItem = result.items.find(i => i.description.includes('**CRITICAL**'));
      expect(criticalItem).toBeDefined();
    });

    it('should handle performance metrics in items', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'checklist-flat.md'), 'utf-8');
      const result = parseChecklistContent(content, 'implementation.md');

      const perfItem = result.items.find(i => i.description.includes('<500ms'));
      expect(perfItem).toBeDefined();
    });
  });

  describe('parseChecklistContent - checklist-nested.md', () => {
    it('should parse checklist with nested sections', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'checklist-nested.md'), 'utf-8');
      const result = parseChecklistContent(content, 'verification.md');

      expect(result.title).toBe('Verification Checklist: Nested Structure');
      // Only ## headers create sections, ### and #### are nested within
      expect(result.sections.length).toBeGreaterThanOrEqual(2);
    });

    it('should extract existing V-XXX IDs from nested items', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'checklist-nested.md'), 'utf-8');
      const result = parseChecklistContent(content, 'verification.md');

      expect(result.items.some(i => i.id === 'V-001')).toBe(true);
      expect(result.items.some(i => i.id === 'V-007')).toBe(true);
    });

    it('should handle items with links', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'checklist-nested.md'), 'utf-8');
      const result = parseChecklistContent(content, 'verification.md');

      const linkItem = result.items.find(i => i.description.includes('[link]'));
      expect(linkItem?.description).toContain('[link](../spec.md)');
    });

    it('should auto-generate IDs for items without existing IDs', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'checklist-nested.md'), 'utf-8');
      const result = parseChecklistContent(content, 'verification.md');

      // Items in "Items Without IDs" section don't have V-XXX in their description
      // Auto-index starts at 1, so items without IDs get V-001, V-002, etc.
      // (The existing V-001 etc. don't consume the auto-index counter)
      const itemsWithoutSection = result.items.filter(i => i.section === 'Items Without IDs');
      expect(itemsWithoutSection.length).toBe(4);
      // These have auto-generated IDs starting from V-001
      expect(itemsWithoutSection[0].id).toBe('V-001');
      expect(itemsWithoutSection[1].id).toBe('V-002');
    });
  });

  describe('findNextChecklistItem', () => {
    it('should find first incomplete item', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'sample-checklist.md'), 'utf-8');
      const checklist = parseChecklistContent(content, 'test/checklist.md');

      const next = findNextChecklistItem(checklist);
      expect(next).not.toBeNull();
      expect(next?.status).toBe('todo');
    });

    it('should return null when all items complete', () => {
      const checklist = {
        name: 'test',
        filePath: 'test.md',
        type: 'verification' as const,
        sections: [],
        items: [
          { id: 'V-001', description: 'Done item', status: 'done' as const, line: 1 },
        ],
        progress: { total: 1, completed: 1, skipped: 0, percentage: 100 },
      };

      const next = findNextChecklistItem(checklist);
      expect(next).toBeNull();
    });

    it('should skip skipped items when finding next', () => {
      const checklist = {
        name: 'test',
        filePath: 'test.md',
        type: 'verification' as const,
        sections: [],
        items: [
          { id: 'V-001', description: 'Skipped', status: 'skipped' as const, line: 1 },
          { id: 'V-002', description: 'Todo', status: 'todo' as const, line: 2 },
        ],
        progress: { total: 2, completed: 0, skipped: 1, percentage: 0 },
      };

      const next = findNextChecklistItem(checklist);
      expect(next?.id).toBe('V-002');
    });
  });

  describe('getChecklistItemById', () => {
    it('should find item by ID', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'sample-checklist.md'), 'utf-8');
      const checklist = parseChecklistContent(content, 'verification.md');

      const item = getChecklistItemById(checklist, 'V-003');
      expect(item).not.toBeNull();
      expect(item?.id).toBe('V-003');
    });

    it('should return null for unknown ID', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'sample-checklist.md'), 'utf-8');
      const checklist = parseChecklistContent(content, 'test/checklist.md');

      const item = getChecklistItemById(checklist, 'V-999');
      expect(item).toBeNull();
    });
  });

  describe('areAllChecklistsComplete', () => {
    it('should return false when items incomplete', () => {
      const checklists: FeatureChecklists = {
        featureDir: 'test',
        verification: {
          name: 'verification',
          filePath: 'test.md',
          type: 'verification',
          sections: [],
          items: [
            { id: 'V-001', description: 'Incomplete', status: 'todo', line: 1 },
          ],
          progress: { total: 1, completed: 0, skipped: 0, percentage: 0 },
        },
        other: [],
      };

      expect(areAllChecklistsComplete(checklists)).toBe(false);
    });

    it('should return true when all items complete or skipped', () => {
      const checklists: FeatureChecklists = {
        featureDir: 'test',
        verification: {
          name: 'verification',
          filePath: 'test.md',
          type: 'verification',
          sections: [],
          items: [
            { id: 'V-001', description: 'Done', status: 'done', line: 1 },
            { id: 'V-002', description: 'Skipped', status: 'skipped', line: 2 },
          ],
          progress: { total: 2, completed: 1, skipped: 1, percentage: 50 },
        },
        other: [],
      };

      expect(areAllChecklistsComplete(checklists)).toBe(true);
    });

    it('should return true when no checklists exist', () => {
      const checklists: FeatureChecklists = {
        featureDir: 'test',
        other: [],
      };

      expect(areAllChecklistsComplete(checklists)).toBe(true);
    });
  });
});
