import { Command } from 'commander';
import { readdir, copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { output } from '../lib/output.js';
import { findProjectRoot, pathExists, getTemplatesDir, getSystemTemplatesDir } from '../lib/paths.js';
import { handleError } from '../lib/errors.js';

interface SyncResult {
  success: boolean;
  copied: number;
  updated: number;
  skipped: number;
  files: string[];
  error?: string;
}

/**
 * Sync templates from system location to project
 */
async function syncTemplates(options: { force?: boolean }): Promise<SyncResult> {
  const projectRoot = findProjectRoot();

  if (!projectRoot) {
    return {
      success: false,
      copied: 0,
      updated: 0,
      skipped: 0,
      files: [],
      error: 'Not in a SpecFlow project directory',
    };
  }

  const systemTemplates = getSystemTemplatesDir();
  const projectTemplates = getTemplatesDir(projectRoot);

  if (!pathExists(systemTemplates)) {
    return {
      success: false,
      copied: 0,
      updated: 0,
      skipped: 0,
      files: [],
      error: `System templates not found at ${systemTemplates}. Run install.sh first.`,
    };
  }

  // Ensure target directory exists
  await mkdir(projectTemplates, { recursive: true });

  const files = await readdir(systemTemplates);
  let copied = 0;
  let updated = 0;
  let skipped = 0;
  const copiedFiles: string[] = [];

  for (const file of files) {
    const src = join(systemTemplates, file);
    const dest = join(projectTemplates, file);

    if (pathExists(dest) && !options.force) {
      skipped++;
      continue;
    }

    const wasExisting = pathExists(dest);
    await copyFile(src, dest);
    copiedFiles.push(file);

    if (wasExisting) {
      updated++;
    } else {
      copied++;
    }
  }

  return {
    success: true,
    copied,
    updated,
    skipped,
    files: copiedFiles,
  };
}

/**
 * Format human-readable output
 */
function formatHumanReadable(result: SyncResult): string {
  if (!result.success) {
    return `Error: ${result.error}`;
  }

  const lines: string[] = [];

  if (result.copied > 0) {
    lines.push(`Added: ${result.copied} templates`);
  }
  if (result.updated > 0) {
    lines.push(`Updated: ${result.updated} templates`);
  }
  if (result.skipped > 0) {
    lines.push(`Skipped: ${result.skipped} (already exist, use --force to overwrite)`);
  }

  if (result.files.length > 0) {
    lines.push('');
    lines.push('Files:');
    for (const file of result.files) {
      lines.push(`  ${file}`);
    }
  }

  if (result.copied === 0 && result.updated === 0) {
    lines.push('All templates already present. Use --force to overwrite.');
  }

  return lines.join('\n');
}

/**
 * Templates command
 */
export const templatesCommand = new Command('templates')
  .description('Manage project templates')
  .addCommand(
    new Command('sync')
      .description('Copy templates from ~/.specflow/templates to .specify/templates/')
      .option('--force', 'Overwrite existing templates')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          const result = await syncTemplates({ force: options.force });

          if (options.json) {
            output(result);
          } else {
            output(result, formatHumanReadable(result));
          }

          if (!result.success) {
            process.exit(1);
          }
        } catch (err) {
          handleError(err);
        }
      }),
  );
