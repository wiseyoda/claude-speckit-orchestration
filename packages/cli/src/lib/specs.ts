import { readdir, mkdir, rm, cp, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { getSpecsDir, getArchiveDir, pathExists } from './paths.js';

/**
 * Spec directory cleanup operations
 */

export interface SpecCleanupResult {
  cleaned: boolean;
  specsDir: string | null;
  archivePath: string | null;
  filesArchived: number;
  error?: string;
}

/**
 * Find the specs directory for a phase
 * Looks for specs/NNNN-* pattern
 */
export async function findPhaseSpecsDir(
  phaseNumber: string,
  projectPath: string = process.cwd(),
): Promise<string | null> {
  const specsDir = getSpecsDir(projectPath);

  if (!pathExists(specsDir)) {
    return null;
  }

  try {
    const entries = await readdir(specsDir, { withFileTypes: true });
    const phaseDir = entries.find(
      entry => entry.isDirectory() && entry.name.startsWith(`${phaseNumber}-`),
    );

    return phaseDir ? join(specsDir, phaseDir.name) : null;
  } catch {
    return null;
  }
}

/**
 * Count files in a directory recursively
 */
async function countFiles(dir: string): Promise<number> {
  let count = 0;

  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        count++;
      } else if (entry.isDirectory()) {
        count += await countFiles(join(dir, entry.name));
      }
    }
  } catch {
    // Ignore errors
  }

  return count;
}

/**
 * Archive and clean up specs directory for a completed phase
 *
 * Strategy:
 * 1. Find specs/NNNN-* directory
 * 2. Copy to .specify/archive/NNNN-*
 * 3. Delete original specs/NNNN-*
 *
 * If archive already exists, skip archiving but still delete.
 */
export async function cleanupPhaseSpecs(
  phaseNumber: string,
  projectPath: string = process.cwd(),
): Promise<SpecCleanupResult> {
  const phaseSpecsDir = await findPhaseSpecsDir(phaseNumber, projectPath);

  if (!phaseSpecsDir) {
    return {
      cleaned: false,
      specsDir: null,
      archivePath: null,
      filesArchived: 0,
      error: 'No specs directory found for phase',
    };
  }

  const dirName = basename(phaseSpecsDir);
  const archiveDir = getArchiveDir(projectPath);
  const archivePath = join(archiveDir, dirName);

  try {
    // Count files before archiving
    const fileCount = await countFiles(phaseSpecsDir);

    // Ensure archive directory exists
    await mkdir(archiveDir, { recursive: true });

    // Archive if not already archived
    if (!pathExists(archivePath)) {
      await cp(phaseSpecsDir, archivePath, { recursive: true });
    }

    // Delete original specs directory
    await rm(phaseSpecsDir, { recursive: true, force: true });

    return {
      cleaned: true,
      specsDir: phaseSpecsDir,
      archivePath,
      filesArchived: fileCount,
    };
  } catch (err) {
    return {
      cleaned: false,
      specsDir: phaseSpecsDir,
      archivePath,
      filesArchived: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Get summary of what would be cleaned up (for dry-run)
 */
export async function getSpecsCleanupPreview(
  phaseNumber: string,
  projectPath: string = process.cwd(),
): Promise<{ hasSpecs: boolean; specsDir: string | null; fileCount: number }> {
  const phaseSpecsDir = await findPhaseSpecsDir(phaseNumber, projectPath);

  if (!phaseSpecsDir) {
    return { hasSpecs: false, specsDir: null, fileCount: 0 };
  }

  const fileCount = await countFiles(phaseSpecsDir);

  return {
    hasSpecs: true,
    specsDir: phaseSpecsDir,
    fileCount,
  };
}
