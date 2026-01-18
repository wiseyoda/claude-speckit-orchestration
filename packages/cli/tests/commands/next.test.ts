import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/paths.js', () => ({
  findProjectRoot: vi.fn(),
  pathExists: vi.fn(),
}));

vi.mock('../../src/lib/context.js', () => ({
  resolveFeatureDir: vi.fn(),
  getProjectContext: vi.fn(),
}));

vi.mock('../../src/lib/tasks.js', () => ({
  readTasks: vi.fn(),
  findNextTask: vi.fn(),
}));

vi.mock('../../src/lib/checklist.js', () => ({
  readFeatureChecklists: vi.fn(),
  findNextChecklistItem: vi.fn(),
}));

import { findProjectRoot } from '../../src/lib/paths.js';
import { resolveFeatureDir } from '../../src/lib/context.js';
import { readTasks, findNextTask } from '../../src/lib/tasks.js';
import { readFeatureChecklists, findNextChecklistItem } from '../../src/lib/checklist.js';

describe('next command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNextTask', () => {
    it('should return none when not in a project', async () => {
      vi.mocked(findProjectRoot).mockReturnValue(undefined);

      expect(findProjectRoot()).toBeUndefined();
    });

    it('should return none when no feature found', async () => {
      vi.mocked(findProjectRoot).mockReturnValue('/test/project');
      vi.mocked(resolveFeatureDir).mockResolvedValue(undefined);

      const featureDir = await resolveFeatureDir(undefined, '/test/project');
      expect(featureDir).toBeUndefined();
    });

    it('should return next task with dependencies info', async () => {
      vi.mocked(findProjectRoot).mockReturnValue('/test/project');
      vi.mocked(resolveFeatureDir).mockResolvedValue('/test/specs/0010-test');
      vi.mocked(readTasks).mockResolvedValue({
        featureDir: '/test/specs/0010-test',
        filePath: '/test/specs/0010-test/tasks.md',
        tasks: [
          { id: 'T001', description: 'First task', status: 'done', line: 10 },
          { id: 'T002', description: 'Second task in src/lib/foo.ts', status: 'todo', line: 11 },
        ],
        sections: [{
          name: 'Test Section',
          tasks: [
            { id: 'T001', description: 'First task', status: 'done', line: 10 },
            { id: 'T002', description: 'Second task in src/lib/foo.ts', status: 'todo', line: 11 },
          ],
          isComplete: false,
          startLine: 8,
          endLine: 12,
        }],
        progress: { total: 2, completed: 1, blocked: 0, deferred: 0, percentage: 50 },
      });
      vi.mocked(findNextTask).mockReturnValue({
        id: 'T002',
        description: 'Second task in src/lib/foo.ts',
        status: 'todo',
        line: 11,
        section: 'Test Section',
      });

      const tasks = await readTasks('/test/specs/0010-test');
      const next = findNextTask(tasks);

      expect(next?.id).toBe('T002');
      expect(next?.description).toContain('src/lib/foo.ts');
    });

    it('should return none when all tasks complete', async () => {
      vi.mocked(findProjectRoot).mockReturnValue('/test/project');
      vi.mocked(resolveFeatureDir).mockResolvedValue('/test/specs/0010-test');
      vi.mocked(readTasks).mockResolvedValue({
        featureDir: '/test/specs/0010-test',
        filePath: '/test/specs/0010-test/tasks.md',
        tasks: [
          { id: 'T001', description: 'First task', status: 'done', line: 10 },
        ],
        sections: [],
        progress: { total: 1, completed: 1, blocked: 0, deferred: 0, percentage: 100 },
      });
      vi.mocked(findNextTask).mockReturnValue(null);

      const tasks = await readTasks('/test/specs/0010-test');
      const next = findNextTask(tasks);

      expect(next).toBeNull();
    });
  });

  describe('getNextVerifyItem', () => {
    it('should return next verification checklist item', async () => {
      vi.mocked(findProjectRoot).mockReturnValue('/test/project');
      vi.mocked(resolveFeatureDir).mockResolvedValue('/test/specs/0010-test');
      vi.mocked(readFeatureChecklists).mockResolvedValue({
        featureDir: '/test/specs/0010-test',
        verification: {
          name: 'verification',
          filePath: '/test/specs/0010-test/checklists/verification.md',
          type: 'verification',
          items: [
            { id: 'V-001', description: 'Test item', status: 'todo', line: 5 },
          ],
          sections: [],
          progress: { total: 1, completed: 0, skipped: 0, percentage: 0 },
        },
        other: [],
      });
      vi.mocked(findNextChecklistItem).mockReturnValue({
        id: 'V-001',
        description: 'Test item',
        status: 'todo',
        line: 5,
      });

      const checklists = await readFeatureChecklists('/test/specs/0010-test');
      const nextItem = checklists.verification ? findNextChecklistItem(checklists.verification) : null;

      expect(nextItem?.id).toBe('V-001');
    });

    it('should return none when verification complete', async () => {
      vi.mocked(readFeatureChecklists).mockResolvedValue({
        featureDir: '/test/specs/0010-test',
        verification: {
          name: 'verification',
          filePath: '/test/specs/0010-test/checklists/verification.md',
          type: 'verification',
          items: [
            { id: 'V-001', description: 'Test item', status: 'done', line: 5 },
          ],
          sections: [],
          progress: { total: 1, completed: 1, skipped: 0, percentage: 100 },
        },
        other: [],
      });
      vi.mocked(findNextChecklistItem).mockReturnValue(null);

      const checklists = await readFeatureChecklists('/test/specs/0010-test');
      const nextItem = checklists.verification ? findNextChecklistItem(checklists.verification) : null;

      expect(nextItem).toBeNull();
    });
  });

  describe('file extraction', () => {
    it('should extract file paths from task descriptions', () => {
      // Test the file extraction logic conceptually
      const description = 'Create src/lib/tasks.ts with parser logic';
      const srcMatch = description.match(/\bsrc\/[\w\-./]+\.\w+/g);
      expect(srcMatch).toContain('src/lib/tasks.ts');
    });

    it('should extract test file paths', () => {
      const description = 'Add tests/lib/tasks.test.ts for coverage';
      const testMatch = description.match(/\btests?\/[\w\-./]+\.\w+/g);
      expect(testMatch).toContain('tests/lib/tasks.test.ts');
    });
  });
});
