'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { DiffViewer, type FileDiff } from '@/components/ui/diff-viewer';
import { Loader2, FileCode, ExternalLink, AlertCircle, Copy, Check, GitCompare, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FileContent {
  path: string;
  filename: string;
  content: string;
  language: string;
  isMarkdown: boolean;
  size: number;
}

interface FileViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string | null;
  /** Project path for diff view */
  projectPath?: string;
  /** Whether to show diff view by default (ignored for new files) */
  showDiff?: boolean;
  /** Whether the file is newly created (defaults to File view instead of Diff) */
  isNewFile?: boolean;
}

/**
 * Map common file extensions to Prism language identifiers
 */
function mapLanguage(lang: string): string {
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    rb: 'ruby',
    rs: 'rust',
    go: 'go',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
    md: 'markdown',
    json: 'json',
    css: 'css',
    scss: 'scss',
    html: 'markup',
    xml: 'markup',
    sql: 'sql',
    graphql: 'graphql',
    dockerfile: 'docker',
  };
  return langMap[lang.toLowerCase()] || lang.toLowerCase();
}

/**
 * Code display component with syntax highlighting
 */
function CodeDisplay({ content, language }: { content: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const prismLanguage = mapLanguage(language);

  return (
    <div className="relative">
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-md bg-surface-300 hover:bg-surface-400 text-surface-500 hover:text-white transition-colors z-10"
        title="Copy to clipboard"
      >
        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
      </button>

      {/* Language badge */}
      <div className="absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-mono uppercase bg-surface-300 text-surface-500">
        {language}
      </div>

      {/* Code content with syntax highlighting */}
      <div className="pt-10">
        <SyntaxHighlighter
          language={prismLanguage}
          style={vscDarkPlus}
          showLineNumbers
          lineNumberStyle={{
            minWidth: '3em',
            paddingRight: '1em',
            textAlign: 'right',
            userSelect: 'none',
            color: '#6b7280',
          }}
          customStyle={{
            margin: 0,
            padding: '0.5rem 0',
            background: 'transparent',
            fontSize: '0.875rem',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            },
          }}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

/**
 * File viewer modal component
 *
 * Displays file content with syntax highlighting for code files
 * and markdown rendering for .md files.
 * Supports diff view when projectPath is provided.
 */
export function FileViewerModal({
  open,
  onOpenChange,
  filePath,
  projectPath,
  showDiff: initialShowDiff = false,
  isNewFile = false,
}: FileViewerModalProps) {
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [diffContent, setDiffContent] = useState<FileDiff | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'file' | 'diff'>(initialShowDiff ? 'diff' : 'file');

  // Derive relative path from absolute path and project path
  const relativePath = filePath && projectPath && filePath.startsWith(projectPath)
    ? filePath.slice(projectPath.length + 1)
    : null;

  // Check if diff view is available
  const canShowDiff = !!projectPath && !!relativePath;

  // Fetch file content
  const fetchFileContent = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ path });
      const res = await fetch(`/api/file/content?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to fetch file: ${res.status}`);
      }

      setFileContent(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load file');
      setFileContent(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch diff content
  const fetchDiffContent = useCallback(async (projPath: string, relPath: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ projectPath: projPath, file: relPath });
      const res = await fetch(`/api/git/diff?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to fetch diff: ${res.status}`);
      }

      setDiffContent(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load diff');
      setDiffContent(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear content on close
  const clearContent = useCallback(() => {
    setFileContent(null);
    setDiffContent(null);
    setError(null);
  }, []);

  // Fetch content based on view mode
  useEffect(() => {
    if (!open) {
      clearContent();
      return;
    }

    if (viewMode === 'diff' && canShowDiff && projectPath && relativePath) {
      fetchDiffContent(projectPath, relativePath);
    } else if (filePath) {
      fetchFileContent(filePath);
    }
  }, [open, filePath, projectPath, relativePath, viewMode, canShowDiff, fetchFileContent, fetchDiffContent, clearContent]);

  // Reset view mode when props change
  // New files default to File view (diff would just be all green additions)
  useEffect(() => {
    if (isNewFile) {
      setViewMode('file');
    } else {
      setViewMode(initialShowDiff && canShowDiff ? 'diff' : 'file');
    }
  }, [initialShowDiff, canShowDiff, isNewFile]);

  const handleOpenInEditor = () => {
    if (filePath) {
      window.open(`vscode://file${filePath}`, '_blank');
    }
  };

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col bg-surface-100 border-surface-300">
        <DialogHeader className="flex-shrink-0 border-b border-surface-300 pb-4">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-3">
              <FileCode className="w-5 h-5 text-accent" />
              <DialogTitle className="text-white">
                {fileContent?.filename || filePath?.split('/').pop() || 'File'}
              </DialogTitle>
              {viewMode === 'file' && fileContent && (
                <span className="text-xs text-surface-500">
                  {formatSize(fileContent.size)}
                </span>
              )}
              {viewMode === 'diff' && diffContent && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-success">+{diffContent.additions}</span>
                  <span className="text-danger">-{diffContent.deletions}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              {canShowDiff && (
                <div className="flex items-center rounded-md bg-surface-200 p-0.5">
                  <button
                    onClick={() => setViewMode('file')}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors',
                      viewMode === 'file'
                        ? 'bg-surface-300 text-white'
                        : 'text-surface-500 hover:text-white'
                    )}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    File
                  </button>
                  <button
                    onClick={() => setViewMode('diff')}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors',
                      viewMode === 'diff'
                        ? 'bg-surface-300 text-white'
                        : 'text-surface-500 hover:text-white'
                    )}
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    Diff
                  </button>
                </div>
              )}
              {filePath && (
                <button
                  onClick={handleOpenInEditor}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-surface-500 hover:text-white hover:bg-surface-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  VS Code
                </button>
              )}
            </div>
          </div>
          {filePath && (
            <p className="text-xs text-surface-500 font-mono mt-1 truncate">
              {filePath}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-8 h-8 text-danger mb-3" />
              <p className="text-sm text-danger font-medium">
                Failed to load {viewMode === 'diff' ? 'diff' : 'file'}
              </p>
              <p className="text-xs text-surface-500 mt-1">{error}</p>
            </div>
          ) : viewMode === 'diff' && diffContent ? (
            <DiffViewer diff={diffContent} />
          ) : fileContent?.content ? (
            fileContent.isMarkdown ? (
              <div className="py-4 px-4">
                <MarkdownContent content={fileContent.content} />
              </div>
            ) : (
              <CodeDisplay
                content={fileContent.content}
                language={fileContent.language}
              />
            )
          ) : (
            <div className="flex items-center justify-center py-12 text-surface-500">
              No content available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
