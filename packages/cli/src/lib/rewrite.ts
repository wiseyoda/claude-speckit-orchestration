import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { pathExists } from './paths.js';

/**
 * Find and replace operations for SpecFlow upgrade
 */

export interface RewriteRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

export interface FileRewriteResult {
  file: string;
  replacements: number;
  rules: string[];
}

export interface RewriteResult {
  files: FileRewriteResult[];
  totalReplacements: number;
  errors: string[];
}

/**
 * Standard rewrite rules for v2.0 → v3.0 migration
 */
export const V2_TO_V3_RULES: RewriteRule[] = [
  // Slash commands
  {
    pattern: /\/speckit\.orchestrate/g,
    replacement: '/flow.orchestrate',
    description: 'orchestrate command',
  },
  {
    pattern: /\/speckit\.specify/g,
    replacement: '/flow.design',
    description: 'specify → design command',
  },
  {
    pattern: /\/speckit\.verify/g,
    replacement: '/flow.verify',
    description: 'verify command',
  },
  {
    pattern: /\/speckit\.tasks/g,
    replacement: '/flow.implement',
    description: 'tasks command',
  },
  {
    pattern: /\/speckit\.init/g,
    replacement: '/flow.init',
    description: 'init command',
  },
  {
    pattern: /\/speckit\.clarify/g,
    replacement: '/flow.design',
    description: 'clarify → design command',
  },
  {
    pattern: /\/speckit\.plan/g,
    replacement: '/flow.design',
    description: 'plan → design command',
  },
  {
    pattern: /\/speckit\.backlog/g,
    replacement: '/flow.roadmap',
    description: 'backlog command',
  },
  {
    pattern: /\/speckit\.constitution/g,
    replacement: '/flow.memory',
    description: 'constitution command',
  },
  {
    pattern: /\/speckit\.merge/g,
    replacement: '/flow.merge',
    description: 'merge command',
  },
  {
    pattern: /\/speckit\./g,
    replacement: '/flow.',
    description: 'generic speckit → flow',
  },

  // CLI commands (with backticks)
  {
    pattern: /`speckit\s+phase\s+show/g,
    replacement: '`specflow phase',
    description: 'phase show command (backtick)',
  },
  {
    pattern: /`speckit\s+phase\s+list/g,
    replacement: '`specflow phase',
    description: 'phase list command (backtick)',
  },
  {
    pattern: /`speckit\s+phase\s+archive/g,
    replacement: '`specflow phase close',
    description: 'phase archive command (backtick)',
  },
  {
    pattern: /`speckit\s+phase\s+create/g,
    replacement: '`specflow phase open',
    description: 'phase create command (backtick)',
  },
  {
    pattern: /`speckit\s+tasks\s+sync/g,
    replacement: '`specflow status',
    description: 'tasks sync command (backtick)',
  },
  {
    pattern: /`speckit\s+issue/g,
    replacement: '`specflow',
    description: 'issue command (backtick)',
  },
  {
    pattern: /`speckit\s+roadmap/g,
    replacement: '`specflow phase',
    description: 'roadmap command (backtick)',
  },
  {
    pattern: /`speckit\s/g,
    replacement: '`specflow ',
    description: 'generic CLI command (backtick)',
  },
  {
    pattern: /Run `speckit/g,
    replacement: 'Run `specflow',
    description: 'Run speckit instruction',
  },
  {
    pattern: /run `speckit/g,
    replacement: 'run `specflow',
    description: 'run speckit instruction',
  },

  // CLI commands (without backticks - plain text in docs)
  {
    pattern: /speckit phase show/g,
    replacement: 'specflow phase',
    description: 'phase show command',
  },
  {
    pattern: /speckit phase list/g,
    replacement: 'specflow phase',
    description: 'phase list command',
  },
  {
    pattern: /speckit phase archive/g,
    replacement: 'specflow phase close',
    description: 'phase archive command',
  },
  {
    pattern: /speckit phase create/g,
    replacement: 'specflow phase open',
    description: 'phase create command',
  },
  {
    pattern: /speckit issue/g,
    replacement: 'specflow',
    description: 'issue command',
  },
  {
    pattern: /speckit roadmap/g,
    replacement: 'specflow phase',
    description: 'roadmap command',
  },

  // References in prose
  {
    pattern: /SpecKit\s+v?2\.\d/gi,
    replacement: 'SpecFlow v3.0',
    description: 'version reference',
  },
  {
    pattern: /speckit_version/g,
    replacement: 'specflow_version',
    description: 'version field name',
  },
];

/**
 * Files/directories to skip during rewrite
 */
const SKIP_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.vercel',
  'coverage',
  '.specify/archive',
  '.specify/history',
];

/**
 * Check if path should be skipped
 */
function shouldSkip(path: string): boolean {
  return SKIP_PATTERNS.some((pattern) => path.includes(pattern));
}

/**
 * Find all markdown files in a directory recursively
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  if (!pathExists(dir) || shouldSkip(dir)) {
    return files;
  }

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (shouldSkip(fullPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        const subFiles = await findMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && extname(entry.name) === '.md') {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory not readable
  }

  return files;
}

/**
 * Apply rewrite rules to a single file
 */
async function rewriteFile(
  filePath: string,
  rules: RewriteRule[],
  dryRun: boolean = false,
): Promise<FileRewriteResult | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    let newContent = content;
    let totalReplacements = 0;
    const appliedRules: string[] = [];

    for (const rule of rules) {
      const matches = content.match(rule.pattern);
      if (matches) {
        newContent = newContent.replace(rule.pattern, rule.replacement);
        totalReplacements += matches.length;
        appliedRules.push(rule.description);
      }
    }

    if (totalReplacements === 0) {
      return null;
    }

    if (!dryRun) {
      await writeFile(filePath, newContent);
    }

    return {
      file: filePath,
      replacements: totalReplacements,
      rules: [...new Set(appliedRules)],
    };
  } catch {
    return null;
  }
}

/**
 * Rewrite all markdown files in a project
 */
export async function rewriteProject(
  projectPath: string,
  options: {
    rules?: RewriteRule[];
    dryRun?: boolean;
    includeSpecs?: boolean;
    includeSpecify?: boolean;
  } = {},
): Promise<RewriteResult> {
  const rules = options.rules || V2_TO_V3_RULES;
  const dryRun = options.dryRun ?? false;

  const result: RewriteResult = {
    files: [],
    totalReplacements: 0,
    errors: [],
  };

  // Directories to search
  const searchDirs: string[] = [projectPath];

  // Find all markdown files
  const allFiles: string[] = [];
  for (const dir of searchDirs) {
    const files = await findMarkdownFiles(dir);
    allFiles.push(...files);
  }

  // Also include root-level markdown files
  try {
    const rootEntries = await readdir(projectPath, { withFileTypes: true });
    for (const entry of rootEntries) {
      if (entry.isFile() && extname(entry.name) === '.md') {
        const fullPath = join(projectPath, entry.name);
        if (!allFiles.includes(fullPath)) {
          allFiles.push(fullPath);
        }
      }
    }
  } catch {
    result.errors.push('Could not read project root directory');
  }

  // Process each file
  for (const file of allFiles) {
    try {
      const fileResult = await rewriteFile(file, rules, dryRun);
      if (fileResult) {
        result.files.push(fileResult);
        result.totalReplacements += fileResult.replacements;
      }
    } catch (err) {
      result.errors.push(`Error processing ${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}

/**
 * Preview rewrite (dry run)
 */
export async function previewRewrite(projectPath: string): Promise<RewriteResult> {
  return rewriteProject(projectPath, { dryRun: true });
}

/**
 * Count occurrences of a pattern in a file
 */
export async function countPattern(
  filePath: string,
  pattern: RegExp,
): Promise<number> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const matches = content.match(pattern);
    return matches?.length || 0;
  } catch {
    return 0;
  }
}

/**
 * Find all speckit references in a project
 */
export async function findSpeckitReferences(projectPath: string): Promise<{
  slashCommands: number;
  cliCommands: number;
  otherReferences: number;
  files: string[];
}> {
  const files = await findMarkdownFiles(projectPath);

  let slashCommands = 0;
  let cliCommands = 0;
  let otherReferences = 0;
  const filesWithRefs: string[] = [];

  for (const file of files) {
    try {
      const content = await readFile(file, 'utf-8');

      const slashMatches = content.match(/\/speckit\./g);
      const cliMatches = content.match(/`speckit\s/g);
      const otherMatches = content.match(/speckit/gi);

      if (slashMatches || cliMatches || otherMatches) {
        filesWithRefs.push(file);
        slashCommands += slashMatches?.length || 0;
        cliCommands += cliMatches?.length || 0;
        otherReferences +=
          (otherMatches?.length || 0) -
          (slashMatches?.length || 0) -
          (cliMatches?.length || 0);
      }
    } catch {
      // Skip unreadable files
    }
  }

  return {
    slashCommands,
    cliCommands,
    otherReferences: Math.max(0, otherReferences),
    files: filesWithRefs,
  };
}
