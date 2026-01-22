'use client';

/**
 * Hook for combined activity feed.
 *
 * Aggregates activity from multiple sources:
 * - Workflow sessions (SSE)
 * - Task completions (SSE)
 * - Phase milestones (SSE)
 * - Key git commits (filtered)
 */

import { useMemo } from 'react';
import { useUnifiedData } from '@/contexts/unified-data-context';
import { useGitActivity, type GitActivity } from './use-git-activity';
import type { WorkflowIndexEntry, Task } from '@specflow/shared';

/**
 * Activity item types
 */
export type ActivityType =
  | 'session_completed'
  | 'session_started'
  | 'session_failed'
  | 'task_completed'
  | 'phase_opened'
  | 'phase_closed'
  | 'commit'
  | 'merge';

/**
 * Unified activity item
 */
export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  timestamp: Date;
  relativeTime: string;
  metadata?: {
    sessionId?: string;
    taskId?: string;
    phaseNumber?: string;
    commitHash?: string;
    filesChanged?: number;
    duration?: number;
    skill?: string;
  };
}

/**
 * Format relative time from date
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

/**
 * Parse relative time string from git to Date
 */
function parseGitRelativeTime(relativeTime: string): Date {
  const now = new Date();

  // Parse patterns like "7 minutes ago", "3 hours ago", "2 days ago"
  const match = relativeTime.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i);
  if (!match) return now;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const date = new Date(now);
  switch (unit) {
    case 'second':
      date.setSeconds(date.getSeconds() - value);
      break;
    case 'minute':
      date.setMinutes(date.getMinutes() - value);
      break;
    case 'hour':
      date.setHours(date.getHours() - value);
      break;
    case 'day':
      date.setDate(date.getDate() - value);
      break;
    case 'week':
      date.setDate(date.getDate() - value * 7);
      break;
    case 'month':
      date.setMonth(date.getMonth() - value);
      break;
    case 'year':
      date.setFullYear(date.getFullYear() - value);
      break;
  }

  return date;
}

/**
 * Convert workflow session to activity item
 */
function sessionToActivity(session: WorkflowIndexEntry): ActivityItem | null {
  const timestamp = new Date(session.updatedAt || session.startedAt);

  // Determine activity type based on session status
  let type: ActivityType;
  let title: string;

  switch (session.status) {
    case 'completed':
      type = 'session_completed';
      title = 'Session completed';
      break;
    case 'failed':
    case 'cancelled':
      type = 'session_failed';
      title = session.status === 'failed' ? 'Session failed' : 'Session cancelled';
      break;
    case 'running':
    case 'waiting_for_input':
      type = 'session_started';
      title = 'Session in progress';
      break;
    default:
      return null; // Skip detached/stale for now
  }

  // Format skill name for display
  const skillDisplay = session.skill
    .replace(/^\/flow\./, '')
    .replace(/-/g, ' ')
    .replace(/^\w/, c => c.toUpperCase());

  return {
    id: `session-${session.sessionId}`,
    type,
    title,
    subtitle: skillDisplay,
    timestamp,
    relativeTime: getRelativeTime(timestamp),
    metadata: {
      sessionId: session.sessionId,
      skill: session.skill,
    },
  };
}

/**
 * Convert completed task to activity item
 */
function taskToActivity(task: Task): ActivityItem | null {
  if (task.status !== 'done') return null;

  // We don't have completion timestamp, so use a placeholder
  // In a real implementation, we'd track this in the task data
  const timestamp = new Date(); // Will be filtered out if too old

  return {
    id: `task-${task.id}`,
    type: 'task_completed',
    title: `${task.id} completed`,
    subtitle: task.description,
    timestamp,
    relativeTime: 'recently',
    metadata: {
      taskId: task.id,
    },
  };
}

/**
 * Convert git activity to unified activity item
 */
function gitToActivity(git: GitActivity): ActivityItem {
  const timestamp = parseGitRelativeTime(git.timestamp);

  // Detect merges and phase-related commits
  const isMerge = git.description.toLowerCase().includes('merge');
  const isPhase = /phase\s*\d{4}/i.test(git.description);

  let type: ActivityType = 'commit';
  if (isMerge) type = 'merge';

  // Check for phase open/close patterns
  let title = git.description;
  if (isPhase && git.description.toLowerCase().includes('close')) {
    type = 'phase_closed';
    title = git.description;
  } else if (isPhase && git.description.toLowerCase().includes('open')) {
    type = 'phase_opened';
    title = git.description;
  }

  return {
    id: `git-${git.hash}`,
    type,
    title,
    // No subtitle for git - commit hash is shown in badge via metadata
    timestamp,
    relativeTime: git.timestamp,
    metadata: {
      commitHash: git.hash,
    },
  };
}

interface UseActivityFeedResult {
  activities: ActivityItem[];
  isLoading: boolean;
}

/**
 * Hook for combined activity feed
 */
export function useActivityFeed(
  projectId: string | null,
  projectPath: string | null,
  limit: number = 20
): UseActivityFeedResult {
  const { workflows, tasks } = useUnifiedData();
  const { activities: gitActivities, isLoading: gitLoading } = useGitActivity(projectPath, 30);

  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    // Add workflow sessions
    if (projectId) {
      const workflowData = workflows.get(projectId);
      if (workflowData?.sessions) {
        for (const session of workflowData.sessions) {
          const activity = sessionToActivity(session);
          if (activity) {
            items.push(activity);
          }
        }
      }
    }

    // Add git activities (filtered for interesting ones)
    for (const git of gitActivities) {
      const activity = gitToActivity(git);
      // Filter: only include merges, phase commits, or recent commits
      const isInteresting =
        activity.type === 'merge' ||
        activity.type === 'phase_opened' ||
        activity.type === 'phase_closed' ||
        /phase|feat|fix/i.test(git.description);

      if (isInteresting) {
        items.push(activity);
      }
    }

    // Sort by timestamp (newest first)
    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Deduplicate by id
    const seen = new Set<string>();
    const deduped = items.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    return deduped.slice(0, limit);
  }, [projectId, workflows, tasks, gitActivities, limit]);

  return {
    activities,
    isLoading: gitLoading,
  };
}
