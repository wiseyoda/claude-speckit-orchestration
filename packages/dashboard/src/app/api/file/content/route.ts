import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, normalize, extname, basename } from 'node:path';

/**
 * GET /api/file/content?path=<absolute-path>
 * Returns the content of a file for viewing in the file viewer modal.
 *
 * Supports code files with syntax highlighting metadata.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  // Normalize and resolve the path to prevent traversal attacks
  const normalizedPath = normalize(resolve(filePath));

  // Security: Prevent accessing system files
  const deniedPatterns = [
    '/etc/',
    '/var/',
    '/usr/',
    '/bin/',
    '/sbin/',
    '/private/etc/',
    '/.ssh/',
    '/.gnupg/',
    '/.aws/',
    '/node_modules/',
    '.env',
    'credentials',
    'secrets',
  ];

  const hasDeniedPattern = deniedPatterns.some((pattern) =>
    normalizedPath.toLowerCase().includes(pattern.toLowerCase())
  );

  if (hasDeniedPattern) {
    return NextResponse.json(
      { error: 'Access denied: path not allowed' },
      { status: 403 }
    );
  }

  if (!existsSync(normalizedPath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    // Check file size - limit to 1MB for safety
    const stats = await stat(normalizedPath);
    if (stats.size > 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 1MB)' },
        { status: 413 }
      );
    }

    // Ensure it's a file, not a directory
    if (!stats.isFile()) {
      return NextResponse.json(
        { error: 'Path is not a file' },
        { status: 400 }
      );
    }

    const content = await readFile(normalizedPath, 'utf-8');
    const ext = extname(normalizedPath).toLowerCase();
    const filename = basename(normalizedPath);

    // Determine language for syntax highlighting
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'tsx',
      '.js': 'javascript',
      '.jsx': 'jsx',
      '.json': 'json',
      '.md': 'markdown',
      '.mdx': 'markdown',
      '.css': 'css',
      '.scss': 'scss',
      '.less': 'less',
      '.html': 'html',
      '.xml': 'xml',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.toml': 'toml',
      '.py': 'python',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.sh': 'bash',
      '.bash': 'bash',
      '.zsh': 'bash',
      '.fish': 'bash',
      '.sql': 'sql',
      '.graphql': 'graphql',
      '.gql': 'graphql',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.java': 'java',
      '.c': 'c',
      '.cpp': 'cpp',
      '.h': 'c',
      '.hpp': 'cpp',
      '.cs': 'csharp',
      '.php': 'php',
      '.vue': 'vue',
      '.svelte': 'svelte',
      '.astro': 'astro',
    };

    const language = languageMap[ext] || 'text';
    const isMarkdown = language === 'markdown';

    return NextResponse.json({
      path: normalizedPath,
      filename,
      content,
      language,
      isMarkdown,
      size: stats.size,
    });
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}
