"use client"

/**
 * Hook for subscribing to session content.
 *
 * Automatically subscribes to session polling when mounted with valid session,
 * and unsubscribes when unmounted or session changes.
 *
 * Usage:
 *   const content = useSessionContent(sessionId, projectPath);
 *
 *   if (content) {
 *     console.log(content.messages);
 *   }
 */

import { useEffect, useMemo } from 'react';
import { useUnifiedData } from '@/contexts/unified-data-context';
import type { SessionContent } from '@/lib/session-polling-manager';

/**
 * Hook for auto-subscribing to session content
 *
 * @param sessionId - Claude session ID (or null)
 * @param projectPath - Absolute path to the project (or null)
 * @returns Session content or null if not available
 */
export function useSessionContent(
  sessionId: string | null,
  projectPath: string | null
): SessionContent | null {
  const { sessionContent, subscribeToSession, unsubscribeFromSession } =
    useUnifiedData();

  // Subscribe/unsubscribe based on sessionId and projectPath
  useEffect(() => {
    if (sessionId && projectPath) {
      subscribeToSession(sessionId, projectPath);

      return () => {
        unsubscribeFromSession(sessionId);
      };
    }
  }, [sessionId, projectPath, subscribeToSession, unsubscribeFromSession]);

  // Return content from context
  const content = useMemo(() => {
    if (!sessionId) return null;
    return sessionContent.get(sessionId) ?? null;
  }, [sessionId, sessionContent]);

  return content;
}

/**
 * Extended result for components that need more metadata
 */
interface UseSessionContentExtendedResult {
  /** Session content or null */
  content: SessionContent | null;
  /** Messages from the session */
  messages: SessionContent['messages'];
  /** Number of files modified */
  filesModified: number;
  /** Elapsed time in milliseconds */
  elapsed: number;
  /** Current todo items */
  currentTodos: SessionContent['currentTodos'];
  /** Tool calls from the session */
  toolCalls: SessionContent['toolCalls'];
  /** Whether the session has ended */
  hasEnded: boolean;
  /** True if content is loading (first fetch) */
  isLoading: boolean;
}

/**
 * Extended hook with more metadata for session content
 */
export function useSessionContentExtended(
  sessionId: string | null,
  projectPath: string | null
): UseSessionContentExtendedResult {
  const content = useSessionContent(sessionId, projectPath);

  return useMemo(
    () => ({
      content,
      messages: content?.messages ?? [],
      filesModified: content?.filesModified ?? 0,
      elapsed: content?.elapsed ?? 0,
      currentTodos: content?.currentTodos,
      toolCalls: content?.toolCalls,
      hasEnded: content?.hasEnded ?? false,
      isLoading: sessionId !== null && content === null,
    }),
    [content, sessionId]
  );
}
