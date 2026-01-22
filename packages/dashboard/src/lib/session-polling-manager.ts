/**
 * SINGLE SOURCE OF TRUTH for session content polling.
 *
 * Why polling? Session JSONL files live in ~/.claude/projects/{hash}/
 * which is outside project directories and cannot be file-watched.
 *
 * Key behaviors:
 * - Single 3-second poll loop (not per-subscription)
 * - Auto-detects session end from JSONL content
 * - Stops polling when no active subscriptions
 * - Emits updates via listener pattern (like watcher.ts)
 *
 * Usage:
 *   import { sessionPollingManager } from '@/lib/session-polling-manager';
 *
 *   // Subscribe to session updates
 *   sessionPollingManager.subscribe(sessionId, projectPath);
 *
 *   // Listen for updates
 *   const unsubscribe = sessionPollingManager.addListener((event) => {
 *     if (event.sessionId === mySessionId) {
 *       setContent(event.content);
 *     }
 *   });
 *
 *   // Cleanup
 *   sessionPollingManager.unsubscribe(sessionId);
 *   unsubscribe();
 */

import type { SessionMessage, ToolCallInfo, TodoItem } from './session-parser';

const POLL_INTERVAL_MS = 5000; // 5 seconds - balanced between responsiveness and efficiency
const DEFAULT_TAIL_LIMIT = 100;

/**
 * Session content returned from polling
 */
export interface SessionContent {
  messages: SessionMessage[];
  filesModified: number;
  elapsed: number;
  sessionId: string;
  toolCalls?: ToolCallInfo[];
  currentTodos?: TodoItem[];
  /** True if session has ended (detected from JSONL) */
  hasEnded?: boolean;
}

/**
 * Update event emitted when session content changes
 */
export interface SessionUpdateEvent {
  sessionId: string;
  projectPath: string;
  content: SessionContent;
  error?: string;
}

/**
 * Internal subscription tracking
 */
interface SessionSubscription {
  sessionId: string;
  projectPath: string;
  /** Last known content hash to detect changes */
  lastHash: string;
  /** Whether this subscription is still active */
  active: boolean;
}

/**
 * Fetch session content from API
 */
async function fetchSessionContent(
  projectPath: string,
  sessionId: string,
  tail: number = DEFAULT_TAIL_LIMIT
): Promise<SessionContent> {
  const params = new URLSearchParams({
    projectPath,
    sessionId,
    tail: String(tail),
  });

  const res = await fetch(`/api/session/content?${params}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch session: ${res.status}`);
  }

  return data as SessionContent;
}

/**
 * Simple hash function for content comparison
 */
function hashContent(content: SessionContent): string {
  return `${content.messages.length}:${content.elapsed}:${content.hasEnded}`;
}

/**
 * Session Polling Manager - Singleton
 *
 * Centralizes all session content polling into a single coordinated loop.
 */
class SessionPollingManager {
  private subscriptions = new Map<string, SessionSubscription>();
  private pollInterval: NodeJS.Timeout | null = null;
  private listeners = new Set<(event: SessionUpdateEvent) => void>();
  private cache = new Map<string, SessionContent>();
  private isPolling = false;

  /**
   * Subscribe to session updates
   * Starts polling if this is the first subscription
   */
  subscribe(sessionId: string, projectPath: string): void {
    const existing = this.subscriptions.get(sessionId);
    if (existing) {
      // Reactivate if was inactive
      existing.active = true;
      existing.projectPath = projectPath;
      return;
    }

    this.subscriptions.set(sessionId, {
      sessionId,
      projectPath,
      lastHash: '',
      active: true,
    });

    console.log(`[SessionPolling] Subscribed: ${sessionId}`);

    // Start polling if not already running
    if (!this.isPolling) {
      this.startPolling();
    }

    // Immediately poll this session for initial data
    this.pollSession(sessionId, projectPath).catch(console.error);
  }

  /**
   * Unsubscribe from session updates
   * Stops polling if this was the last subscription
   */
  unsubscribe(sessionId: string): void {
    const subscription = this.subscriptions.get(sessionId);
    if (subscription) {
      subscription.active = false;
      console.log(`[SessionPolling] Unsubscribed: ${sessionId}`);

      // Check if any active subscriptions remain
      const hasActive = Array.from(this.subscriptions.values()).some(s => s.active);
      if (!hasActive) {
        this.stopPolling();
      }
    }
  }

  /**
   * Add listener for session updates
   * Returns cleanup function
   */
  addListener(fn: (event: SessionUpdateEvent) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /**
   * Get cached content for a session (for initial render)
   */
  getCache(sessionId: string): SessionContent | null {
    return this.cache.get(sessionId) ?? null;
  }

  /**
   * Clear all subscriptions and stop polling
   */
  clear(): void {
    this.stopPolling();
    this.subscriptions.clear();
    this.cache.clear();
    this.listeners.clear();
  }

  /**
   * Start the polling loop
   */
  private startPolling(): void {
    if (this.isPolling) return;

    this.isPolling = true;
    console.log('[SessionPolling] Starting poll loop');

    this.pollInterval = setInterval(() => {
      this.pollAll();
    }, POLL_INTERVAL_MS);
  }

  /**
   * Stop the polling loop
   */
  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
    console.log('[SessionPolling] Stopped poll loop');
  }

  /**
   * Poll all active subscriptions
   */
  private async pollAll(): Promise<void> {
    const activeSubscriptions = Array.from(this.subscriptions.values()).filter(
      s => s.active
    );

    // Poll in parallel but don't fail on individual errors
    await Promise.allSettled(
      activeSubscriptions.map(sub =>
        this.pollSession(sub.sessionId, sub.projectPath)
      )
    );
  }

  /**
   * Poll a single session and emit update if changed
   */
  private async pollSession(
    sessionId: string,
    projectPath: string
  ): Promise<void> {
    const subscription = this.subscriptions.get(sessionId);
    if (!subscription || !subscription.active) return;

    try {
      const content = await fetchSessionContent(projectPath, sessionId);

      // Check if content changed
      const hash = hashContent(content);
      if (hash === subscription.lastHash) {
        return; // No change
      }

      subscription.lastHash = hash;
      this.cache.set(sessionId, content);

      // Emit update to listeners
      const event: SessionUpdateEvent = {
        sessionId,
        projectPath,
        content,
      };

      this.listeners.forEach(listener => {
        try {
          listener(event);
        } catch (err) {
          console.error('[SessionPolling] Listener error:', err);
        }
      });

      // If session has ended, mark subscription inactive
      if (content.hasEnded) {
        subscription.active = false;
        console.log(`[SessionPolling] Session ended: ${sessionId}`);

        // Check if any active subscriptions remain
        const hasActive = Array.from(this.subscriptions.values()).some(s => s.active);
        if (!hasActive) {
          this.stopPolling();
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[SessionPolling] Error polling ${sessionId}:`, errorMessage);

      // Emit error event
      const event: SessionUpdateEvent = {
        sessionId,
        projectPath,
        content: this.cache.get(sessionId) ?? {
          messages: [],
          filesModified: 0,
          elapsed: 0,
          sessionId,
        },
        error: errorMessage,
      };

      this.listeners.forEach(listener => {
        try {
          listener(event);
        } catch (listenerErr) {
          console.error('[SessionPolling] Listener error:', listenerErr);
        }
      });
    }
  }

  /**
   * Force an immediate poll for a session
   */
  async forcePoll(sessionId: string): Promise<SessionContent | null> {
    const subscription = this.subscriptions.get(sessionId);
    if (!subscription) return null;

    await this.pollSession(sessionId, subscription.projectPath);
    return this.cache.get(sessionId) ?? null;
  }

  /**
   * Get subscription count (for debugging)
   */
  getSubscriptionCount(): { total: number; active: number } {
    const all = Array.from(this.subscriptions.values());
    return {
      total: all.length,
      active: all.filter(s => s.active).length,
    };
  }
}

// Export singleton instance
export const sessionPollingManager = new SessionPollingManager();
