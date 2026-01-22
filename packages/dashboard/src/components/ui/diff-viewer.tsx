'use client';

import { cn } from '@/lib/utils';

export interface DiffLine {
  type: 'context' | 'addition' | 'deletion' | 'header';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
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

interface DiffViewerProps {
  diff: FileDiff;
  className?: string;
}

/**
 * Renders a unified diff view with line numbers and syntax highlighting
 */
export function DiffViewer({ diff, className }: DiffViewerProps) {
  if (diff.isBinary) {
    return (
      <div className={cn('p-4 text-center text-zinc-500', className)}>
        Binary file cannot be displayed
      </div>
    );
  }

  if (diff.hunks.length === 0) {
    return (
      <div className={cn('p-4 text-center text-zinc-500', className)}>
        No changes detected
      </div>
    );
  }

  return (
    <div className={cn('font-mono text-xs', className)}>
      {/* Summary header */}
      <div className="flex items-center gap-4 px-4 py-2 bg-surface-200 border-b border-surface-300 sticky top-0">
        <span className="text-zinc-400">
          {diff.isNew && <span className="text-success mr-2">New file</span>}
          {diff.isDeleted && <span className="text-danger mr-2">Deleted file</span>}
        </span>
        <span className="text-success">+{diff.additions}</span>
        <span className="text-danger">-{diff.deletions}</span>
      </div>

      {/* Diff content */}
      <div className="overflow-x-auto">
        {diff.hunks.map((hunk, hunkIndex) => (
          <div key={hunkIndex} className="border-b border-surface-300 last:border-0">
            {hunk.lines.map((line, lineIndex) => (
              <DiffLineRow key={`${hunkIndex}-${lineIndex}`} line={line} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface DiffLineRowProps {
  line: DiffLine;
}

function DiffLineRow({ line }: DiffLineRowProps) {
  if (line.type === 'header') {
    return (
      <div className="flex bg-accent/10 text-accent py-1">
        <div className="w-10 flex-shrink-0" />
        <div className="w-10 flex-shrink-0" />
        <div className="px-2 select-none opacity-60">@@</div>
        <div className="flex-1 px-2">{line.content.replace(/^@@ .* @@/, '').trim()}</div>
      </div>
    );
  }

  const bgColor = {
    context: '',
    addition: 'bg-success/10',
    deletion: 'bg-danger/10',
  }[line.type];

  const textColor = {
    context: 'text-zinc-400',
    addition: 'text-success',
    deletion: 'text-danger',
  }[line.type];

  const lineNumBg = {
    context: 'bg-surface-200',
    addition: 'bg-success/20',
    deletion: 'bg-danger/20',
  }[line.type];

  const prefix = {
    context: ' ',
    addition: '+',
    deletion: '-',
  }[line.type];

  return (
    <div className={cn('flex hover:brightness-110', bgColor)}>
      {/* Old line number */}
      <div
        className={cn(
          'w-10 flex-shrink-0 text-right pr-2 select-none border-r border-surface-300',
          lineNumBg,
          line.type === 'addition' ? 'text-transparent' : 'text-zinc-600'
        )}
      >
        {line.oldLineNumber ?? ''}
      </div>
      {/* New line number */}
      <div
        className={cn(
          'w-10 flex-shrink-0 text-right pr-2 select-none border-r border-surface-300',
          lineNumBg,
          line.type === 'deletion' ? 'text-transparent' : 'text-zinc-600'
        )}
      >
        {line.newLineNumber ?? ''}
      </div>
      {/* Prefix (+/-/space) */}
      <div className={cn('w-5 flex-shrink-0 text-center select-none', textColor)}>
        {prefix}
      </div>
      {/* Content */}
      <div className={cn('flex-1 whitespace-pre pr-4', textColor)}>
        {line.content || ' '}
      </div>
    </div>
  );
}
