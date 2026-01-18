import { mkdir, readdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { join, basename, dirname } from 'node:path';
import { homedir } from 'node:os';
import {
  pathExists,
  getSpecifyDir,
  getMemoryDir,
  getTemplatesDir,
  getPhasesDir,
  getArchiveDir,
} from './paths.js';

/**
 * Scaffolding creation and verification for SpecFlow projects
 */

export interface ScaffoldResult {
  created: string[];
  existing: string[];
  errors: string[];
}

export interface TemplatesSyncResult {
  copied: string[];
  skipped: string[];
  errors: string[];
}

/**
 * Expected directories in a v3.0 project
 */
const EXPECTED_DIRS = [
  '.specify',
  '.specify/memory',
  '.specify/memory/pdrs',
  '.specify/templates',
  '.specify/phases',
  '.specify/archive',
  '.specify/history',
  '.specify/discovery',
];

/**
 * Get the specflow source templates directory
 */
function getSourceTemplatesDir(): string {
  // Look for specflow installation in standard locations
  const possibleLocations = [
    join(homedir(), '.specflow', 'templates'),
    join(homedir(), 'dev', 'specflow', 'templates'),
    join(dirname(dirname(dirname(dirname(__dirname)))), 'templates'),
  ];

  for (const loc of possibleLocations) {
    if (pathExists(loc)) {
      return loc;
    }
  }

  // Fallback to relative path from CLI
  return join(dirname(dirname(dirname(dirname(__dirname)))), 'templates');
}

/**
 * Create all expected directories
 */
export async function createScaffolding(projectPath: string): Promise<ScaffoldResult> {
  const result: ScaffoldResult = {
    created: [],
    existing: [],
    errors: [],
  };

  for (const dir of EXPECTED_DIRS) {
    const fullPath = join(projectPath, dir);
    try {
      if (pathExists(fullPath)) {
        result.existing.push(dir);
      } else {
        await mkdir(fullPath, { recursive: true });
        result.created.push(dir);
      }
    } catch (err) {
      result.errors.push(`Failed to create ${dir}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}

/**
 * Verify scaffolding exists
 */
export async function verifyScaffolding(projectPath: string): Promise<{
  complete: boolean;
  missing: string[];
  present: string[];
}> {
  const missing: string[] = [];
  const present: string[] = [];

  for (const dir of EXPECTED_DIRS) {
    const fullPath = join(projectPath, dir);
    if (pathExists(fullPath)) {
      present.push(dir);
    } else {
      missing.push(dir);
    }
  }

  return {
    complete: missing.length === 0,
    missing,
    present,
  };
}

/**
 * Get list of template files from source
 */
async function getSourceTemplates(): Promise<string[]> {
  const sourceDir = getSourceTemplatesDir();
  if (!pathExists(sourceDir)) {
    return [];
  }

  try {
    const entries = await readdir(sourceDir);
    return entries.filter(f => f.endsWith('.md') || f.endsWith('.yaml'));
  } catch {
    return [];
  }
}

/**
 * Sync templates from specflow source to target project
 */
export async function syncTemplates(
  projectPath: string,
  options: { force?: boolean } = {},
): Promise<TemplatesSyncResult> {
  const result: TemplatesSyncResult = {
    copied: [],
    skipped: [],
    errors: [],
  };

  const sourceDir = getSourceTemplatesDir();
  const targetDir = getTemplatesDir(projectPath);

  // Ensure target directory exists
  if (!pathExists(targetDir)) {
    try {
      await mkdir(targetDir, { recursive: true });
    } catch (err) {
      result.errors.push(`Failed to create templates directory: ${err instanceof Error ? err.message : String(err)}`);
      return result;
    }
  }

  // Get source templates
  const templates = await getSourceTemplates();
  if (templates.length === 0) {
    result.errors.push(`No templates found in ${sourceDir}`);
    return result;
  }

  // Copy each template
  for (const template of templates) {
    const sourcePath = join(sourceDir, template);
    const targetPath = join(targetDir, template);

    try {
      if (pathExists(targetPath) && !options.force) {
        result.skipped.push(template);
      } else {
        await copyFile(sourcePath, targetPath);
        result.copied.push(template);
      }
    } catch (err) {
      result.errors.push(`Failed to copy ${template}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}

/**
 * Check for legacy scripts that should be removed
 */
export async function findLegacyScripts(projectPath: string): Promise<string[]> {
  const legacy: string[] = [];
  const specifyDir = getSpecifyDir(projectPath);

  // v1.0 bash scripts
  const bashScriptsDir = join(specifyDir, 'scripts', 'bash');
  if (pathExists(bashScriptsDir)) {
    legacy.push('.specify/scripts/bash/');
  }

  // v1.0 scripts directory
  const scriptsDir = join(specifyDir, 'scripts');
  if (pathExists(scriptsDir)) {
    legacy.push('.specify/scripts/');
  }

  return legacy;
}

/**
 * Remove legacy scripts (returns what was removed)
 */
export async function removeLegacyScripts(projectPath: string): Promise<string[]> {
  const removed: string[] = [];
  const specifyDir = getSpecifyDir(projectPath);

  // For safety, we just rename rather than delete
  const scriptsDir = join(specifyDir, 'scripts');
  if (pathExists(scriptsDir)) {
    const backupPath = join(specifyDir, 'scripts.v1-backup');
    try {
      const { rename } = await import('node:fs/promises');
      await rename(scriptsDir, backupPath);
      removed.push('.specify/scripts/ → .specify/scripts.v1-backup/');
    } catch {
      // Couldn't rename, leave it
    }
  }

  return removed;
}

/**
 * Ensure HISTORY.md exists in history directory
 */
export async function ensureHistoryFile(projectPath: string): Promise<boolean> {
  const historyPath = join(getSpecifyDir(projectPath), 'history', 'HISTORY.md');

  if (pathExists(historyPath)) {
    return false;
  }

  const content = `# Phase History

This file contains summaries of completed phases, archived by \`specflow phase close\`.

---

`;

  try {
    await mkdir(dirname(historyPath), { recursive: true });
    await writeFile(historyPath, content);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure constitution.md exists in memory directory
 */
export async function ensureConstitution(projectPath: string): Promise<boolean> {
  const constitutionPath = join(getMemoryDir(projectPath), 'constitution.md');

  if (pathExists(constitutionPath)) {
    return false;
  }

  const content = `# Project Constitution

> **Agents**: This document defines the core principles and governance for this project.
> Review before making architectural decisions.

## Core Principles

1. **[Principle 1]** - Description
2. **[Principle 2]** - Description
3. **[Principle 3]** - Description

## Governance

- All architectural decisions require documentation
- Breaking changes require explicit approval
- Tests must pass before merging

---
*Version: 1.0.0 | Last Amended: ${new Date().toISOString().split('T')[0]}*
`;

  try {
    await mkdir(dirname(constitutionPath), { recursive: true });
    await writeFile(constitutionPath, content);
    return true;
  } catch {
    return false;
  }
}

/**
 * Full scaffolding setup (creates dirs, syncs templates, ensures core files)
 */
export async function setupFullScaffolding(
  projectPath: string,
  options: { forceTemplates?: boolean } = {},
): Promise<{
  scaffold: ScaffoldResult;
  templates: TemplatesSyncResult;
  historyCreated: boolean;
  constitutionCreated: boolean;
}> {
  const scaffold = await createScaffolding(projectPath);
  const templates = await syncTemplates(projectPath, { force: options.forceTemplates });
  const historyCreated = await ensureHistoryFile(projectPath);
  const constitutionCreated = await ensureConstitution(projectPath);

  return {
    scaffold,
    templates,
    historyCreated,
    constitutionCreated,
  };
}
