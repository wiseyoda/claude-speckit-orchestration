import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../src/lib/paths.js', () => ({
  getSpecsDir: vi.fn(),
  getArchiveDir: vi.fn(),
  pathExists: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readdir: vi.fn(),
  mkdir: vi.fn(),
  rm: vi.fn(),
  cp: vi.fn(),
  stat: vi.fn(),
}));

import { getSpecsDir, getArchiveDir, pathExists } from '../../src/lib/paths.js';
import { readdir, mkdir, rm, cp } from 'node:fs/promises';
import {
  findPhaseSpecsDir,
  getSpecsCleanupPreview,
  cleanupPhaseSpecs,
} from '../../src/lib/specs.js';

describe('specs.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findPhaseSpecsDir', () => {
    it('should find specs directory for a phase', async () => {
      vi.mocked(getSpecsDir).mockReturnValue('/project/specs');
      vi.mocked(pathExists).mockReturnValue(true);
      vi.mocked(readdir).mockResolvedValue([
        { name: '0080-cli-migration', isDirectory: () => true, isFile: () => false },
        { name: '0081-next-phase', isDirectory: () => true, isFile: () => false },
      ] as unknown as Awaited<ReturnType<typeof readdir>>);

      const result = await findPhaseSpecsDir('0080', '/project');

      expect(result).toBe('/project/specs/0080-cli-migration');
    });

    it('should return null when no specs directory exists', async () => {
      vi.mocked(getSpecsDir).mockReturnValue('/project/specs');
      vi.mocked(pathExists).mockReturnValue(false);

      const result = await findPhaseSpecsDir('0082', '/project');

      expect(result).toBeNull();
    });

    it('should return null when phase not found in specs', async () => {
      vi.mocked(getSpecsDir).mockReturnValue('/project/specs');
      vi.mocked(pathExists).mockReturnValue(true);
      vi.mocked(readdir).mockResolvedValue([
        { name: '0080-cli-migration', isDirectory: () => true, isFile: () => false },
      ] as unknown as Awaited<ReturnType<typeof readdir>>);

      const result = await findPhaseSpecsDir('0082', '/project');

      expect(result).toBeNull();
    });
  });

  describe('getSpecsCleanupPreview', () => {
    it('should return preview with file count for existing specs', async () => {
      vi.mocked(getSpecsDir).mockReturnValue('/project/specs');
      vi.mocked(pathExists).mockReturnValue(true);
      vi.mocked(readdir)
        .mockResolvedValueOnce([
          { name: '0080-cli-migration', isDirectory: () => true, isFile: () => false },
        ] as unknown as Awaited<ReturnType<typeof readdir>>)
        // Count files in specs directory
        .mockResolvedValueOnce([
          { name: 'spec.md', isFile: () => true, isDirectory: () => false },
          { name: 'plan.md', isFile: () => true, isDirectory: () => false },
          { name: 'checklists', isFile: () => false, isDirectory: () => true },
        ] as unknown as Awaited<ReturnType<typeof readdir>>)
        // Count files in checklists subdirectory
        .mockResolvedValueOnce([
          { name: 'verification.md', isFile: () => true, isDirectory: () => false },
        ] as unknown as Awaited<ReturnType<typeof readdir>>);

      const result = await getSpecsCleanupPreview('0080', '/project');

      expect(result.hasSpecs).toBe(true);
      expect(result.specsDir).toBe('/project/specs/0080-cli-migration');
      expect(result.fileCount).toBe(3); // 2 files + 1 in subdirectory
    });

    it('should return empty preview when no specs exist', async () => {
      vi.mocked(getSpecsDir).mockReturnValue('/project/specs');
      vi.mocked(pathExists).mockReturnValue(false);

      const result = await getSpecsCleanupPreview('0082', '/project');

      expect(result.hasSpecs).toBe(false);
      expect(result.specsDir).toBeNull();
      expect(result.fileCount).toBe(0);
    });
  });

  describe('cleanupPhaseSpecs', () => {
    it('should archive specs and delete original', async () => {
      vi.mocked(getSpecsDir).mockReturnValue('/project/specs');
      vi.mocked(getArchiveDir).mockReturnValue('/project/.specify/archive');
      vi.mocked(pathExists)
        .mockReturnValueOnce(true) // specs dir exists
        .mockReturnValueOnce(false); // archive doesn't exist yet
      vi.mocked(readdir)
        .mockResolvedValueOnce([
          { name: '0080-cli-migration', isDirectory: () => true, isFile: () => false },
        ] as unknown as Awaited<ReturnType<typeof readdir>>)
        // Count files
        .mockResolvedValueOnce([
          { name: 'spec.md', isFile: () => true, isDirectory: () => false },
          { name: 'plan.md', isFile: () => true, isDirectory: () => false },
        ] as unknown as Awaited<ReturnType<typeof readdir>>);
      vi.mocked(mkdir).mockResolvedValue(undefined);
      vi.mocked(cp).mockResolvedValue(undefined);
      vi.mocked(rm).mockResolvedValue(undefined);

      const result = await cleanupPhaseSpecs('0080', '/project');

      expect(result.cleaned).toBe(true);
      expect(result.filesArchived).toBe(2);
      expect(result.archivePath).toBe('/project/.specify/archive/0080-cli-migration');

      // Verify archive directory was created
      expect(mkdir).toHaveBeenCalledWith('/project/.specify/archive', { recursive: true });

      // Verify copy was called
      expect(cp).toHaveBeenCalledWith(
        '/project/specs/0080-cli-migration',
        '/project/.specify/archive/0080-cli-migration',
        { recursive: true },
      );

      // Verify original was deleted
      expect(rm).toHaveBeenCalledWith('/project/specs/0080-cli-migration', {
        recursive: true,
        force: true,
      });
    });

    it('should return error when no specs directory exists', async () => {
      vi.mocked(getSpecsDir).mockReturnValue('/project/specs');
      vi.mocked(pathExists).mockReturnValue(false);

      const result = await cleanupPhaseSpecs('0082', '/project');

      expect(result.cleaned).toBe(false);
      expect(result.error).toBe('No specs directory found for phase');
    });

    it('should skip archiving if already archived but still delete original', async () => {
      vi.mocked(getSpecsDir).mockReturnValue('/project/specs');
      vi.mocked(getArchiveDir).mockReturnValue('/project/.specify/archive');
      vi.mocked(pathExists)
        .mockReturnValueOnce(true) // specs dir exists
        .mockReturnValueOnce(true); // archive already exists
      vi.mocked(readdir)
        .mockResolvedValueOnce([
          { name: '0080-cli-migration', isDirectory: () => true, isFile: () => false },
        ] as unknown as Awaited<ReturnType<typeof readdir>>)
        .mockResolvedValueOnce([
          { name: 'spec.md', isFile: () => true, isDirectory: () => false },
        ] as unknown as Awaited<ReturnType<typeof readdir>>);
      vi.mocked(mkdir).mockResolvedValue(undefined);
      vi.mocked(rm).mockResolvedValue(undefined);

      const result = await cleanupPhaseSpecs('0080', '/project');

      expect(result.cleaned).toBe(true);
      // cp should NOT have been called since archive exists
      expect(cp).not.toHaveBeenCalled();
      // rm should still be called to delete original
      expect(rm).toHaveBeenCalled();
    });
  });
});
