import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const execAsync = promisify(exec);

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'context' | 'addition' | 'deletion' | 'header';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface FileDiff {
  path: string;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
  isBinary: boolean;
  isNew: boolean;
  isDeleted: boolean;
}

/**
 * Parse a unified diff into structured hunks
 */
function parseDiff(diffOutput: string, filePath: string): FileDiff {
  const lines = diffOutput.split('\n');
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffHunk | null = null;
  let additions = 0;
  let deletions = 0;
  let oldLineNum = 0;
  let newLineNum = 0;
  let isBinary = false;
  let isNew = false;
  let isDeleted = false;

  for (const line of lines) {
    // Check for binary file
    if (line.startsWith('Binary files')) {
      isBinary = true;
      continue;
    }

    // Check for new file
    if (line.startsWith('new file mode')) {
      isNew = true;
      continue;
    }

    // Check for deleted file
    if (line.startsWith('deleted file mode')) {
      isDeleted = true;
      continue;
    }

    // Hunk header: @@ -oldStart,oldLines +newStart,newLines @@
    const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (hunkMatch) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }
      oldLineNum = parseInt(hunkMatch[1], 10);
      newLineNum = parseInt(hunkMatch[3], 10);
      currentHunk = {
        oldStart: oldLineNum,
        oldLines: parseInt(hunkMatch[2] || '1', 10),
        newStart: newLineNum,
        newLines: parseInt(hunkMatch[4] || '1', 10),
        lines: [{
          type: 'header',
          content: line,
        }],
      };
      continue;
    }

    if (!currentHunk) continue;

    if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++;
      currentHunk.lines.push({
        type: 'addition',
        content: line.slice(1),
        newLineNumber: newLineNum++,
      });
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
      currentHunk.lines.push({
        type: 'deletion',
        content: line.slice(1),
        oldLineNumber: oldLineNum++,
      });
    } else if (line.startsWith(' ')) {
      currentHunk.lines.push({
        type: 'context',
        content: line.slice(1),
        oldLineNumber: oldLineNum++,
        newLineNumber: newLineNum++,
      });
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return {
    path: filePath,
    hunks,
    additions,
    deletions,
    isBinary,
    isNew,
    isDeleted,
  };
}

/**
 * GET /api/git/diff?projectPath=<path>&file=<relativePath>
 * Returns parsed diff for a specific file
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectPath = searchParams.get('projectPath');
  const filePath = searchParams.get('file');

  if (!projectPath) {
    return NextResponse.json({ error: 'Missing projectPath parameter' }, { status: 400 });
  }

  if (!filePath) {
    return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
  }

  // Verify it's a git repo
  const gitDir = join(projectPath, '.git');
  if (!existsSync(gitDir)) {
    return NextResponse.json({ error: 'Not a git repository' }, { status: 400 });
  }

  try {
    // Get diff for the specific file (both staged and unstaged)
    // Use -U3 for 3 lines of context
    let diffOutput = '';

    // Try unstaged first
    try {
      const { stdout } = await execAsync(
        `git diff -U3 -- "${filePath}" 2>/dev/null`,
        { cwd: projectPath, maxBuffer: 10 * 1024 * 1024 }
      );
      diffOutput = stdout;
    } catch {
      // Ignore errors
    }

    // If no unstaged diff, try staged
    if (!diffOutput.trim()) {
      try {
        const { stdout } = await execAsync(
          `git diff --staged -U3 -- "${filePath}" 2>/dev/null`,
          { cwd: projectPath, maxBuffer: 10 * 1024 * 1024 }
        );
        diffOutput = stdout;
      } catch {
        // Ignore errors
      }
    }

    // If still no diff, check if it's a new untracked file
    if (!diffOutput.trim()) {
      try {
        const { stdout: untrackedOut } = await execAsync(
          `git ls-files --others --exclude-standard -- "${filePath}" 2>/dev/null`,
          { cwd: projectPath }
        );
        if (untrackedOut.trim()) {
          // It's a new file - show full content as additions
          const { stdout: fileContent } = await execAsync(
            `cat "${filePath}" 2>/dev/null`,
            { cwd: projectPath, maxBuffer: 10 * 1024 * 1024 }
          );
          const lines = fileContent.split('\n');
          const diff: FileDiff = {
            path: filePath,
            hunks: [{
              oldStart: 0,
              oldLines: 0,
              newStart: 1,
              newLines: lines.length,
              lines: [
                { type: 'header', content: '@@ -0,0 +1,' + lines.length + ' @@' },
                ...lines.map((line, i) => ({
                  type: 'addition' as const,
                  content: line,
                  newLineNumber: i + 1,
                })),
              ],
            }],
            additions: lines.length,
            deletions: 0,
            isBinary: false,
            isNew: true,
            isDeleted: false,
          };
          return NextResponse.json(diff);
        }
      } catch {
        // Ignore errors
      }
    }

    if (!diffOutput.trim()) {
      return NextResponse.json({
        path: filePath,
        hunks: [],
        additions: 0,
        deletions: 0,
        isBinary: false,
        isNew: false,
        isDeleted: false,
      });
    }

    const diff = parseDiff(diffOutput, filePath);
    return NextResponse.json(diff);
  } catch (error) {
    console.error('Error getting git diff:', error);
    return NextResponse.json({ error: 'Failed to get git diff' }, { status: 500 });
  }
}
