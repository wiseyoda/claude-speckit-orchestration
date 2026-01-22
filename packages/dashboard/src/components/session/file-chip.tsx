'use client';

import { cn } from '@/lib/utils';
import { FileText, FileCode, Edit3, Eye, Search, FilePlus } from 'lucide-react';
import { useMemo } from 'react';

export interface FileChipProps {
  /** Full file path */
  path: string;
  /** Operation type that was performed on the file */
  operation: 'read' | 'write' | 'edit' | 'search';
  /** Click handler to open file viewer */
  onClick: () => void;
  /** Optional additional class names */
  className?: string;
}

/**
 * Get file icon based on file extension
 */
function getFileIcon(filename: string): typeof FileText {
  const ext = filename.split('.').pop()?.toLowerCase();
  const codeExts = ['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'rb', 'php', 'swift', 'kt'];

  if (ext && codeExts.includes(ext)) {
    return FileCode;
  }
  return FileText;
}

/**
 * Get operation icon
 */
function getOperationIcon(operation: FileChipProps['operation']): typeof Eye {
  switch (operation) {
    case 'read':
      return Eye;
    case 'write':
      return FilePlus;
    case 'edit':
      return Edit3;
    case 'search':
      return Search;
  }
}

/**
 * Get operation color classes
 */
function getOperationColors(operation: FileChipProps['operation']): {
  bg: string;
  text: string;
  border: string;
  hoverBg: string;
} {
  switch (operation) {
    case 'read':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/20',
        hoverBg: 'hover:bg-blue-500/20',
      };
    case 'write':
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/20',
        hoverBg: 'hover:bg-green-500/20',
      };
    case 'edit':
      return {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        border: 'border-yellow-500/20',
        hoverBg: 'hover:bg-yellow-500/20',
      };
    case 'search':
      return {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/20',
        hoverBg: 'hover:bg-purple-500/20',
      };
  }
}

/**
 * FileChip component
 *
 * Displays a clickable chip representing a file operation.
 * Shows filename with operation-based coloring and icons.
 */
export function FileChip({ path, operation, onClick, className }: FileChipProps) {
  // Extract filename from path
  const filename = useMemo(() => {
    return path.split('/').pop() || path;
  }, [path]);

  // Get directory for tooltip
  const directory = useMemo(() => {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/');
  }, [path]);

  const FileIcon = getFileIcon(filename);
  const OpIcon = getOperationIcon(operation);
  const colors = getOperationColors(operation);

  return (
    <button
      onClick={onClick}
      title={`${operation}: ${path}`}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono',
        'border transition-colors cursor-pointer',
        colors.bg,
        colors.text,
        colors.border,
        colors.hoverBg,
        className
      )}
    >
      <OpIcon className="w-3 h-3 flex-shrink-0 opacity-60" />
      <FileIcon className="w-3 h-3 flex-shrink-0" />
      <span className="truncate max-w-[120px]">{filename}</span>
    </button>
  );
}

/**
 * FileChipGroup component
 *
 * Displays a group of file chips with wrapping.
 */
export interface FileChipGroupProps {
  files: Array<{
    path: string;
    operation: 'read' | 'write' | 'edit' | 'search';
  }>;
  onFileClick: (path: string) => void;
  className?: string;
}

export function FileChipGroup({ files, onFileClick, className }: FileChipGroupProps) {
  if (files.length === 0) {
    return null;
  }

  // Deduplicate files by path, keeping the most significant operation
  const operationPriority = { write: 3, edit: 2, read: 1, search: 0 };
  const uniqueFiles = new Map<string, { path: string; operation: 'read' | 'write' | 'edit' | 'search' }>();

  for (const file of files) {
    const existing = uniqueFiles.get(file.path);
    if (!existing || operationPriority[file.operation] > operationPriority[existing.operation]) {
      uniqueFiles.set(file.path, file);
    }
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {Array.from(uniqueFiles.values()).map((file) => (
        <FileChip
          key={file.path}
          path={file.path}
          operation={file.operation}
          onClick={() => onFileClick(file.path)}
        />
      ))}
    </div>
  );
}
