"use client"

/**
 * Hook for getting derived project data from unified context.
 *
 * Provides easy access to state, tasks, and workflow data for a single project.
 * All data is SSE-pushed (real-time via file watching).
 *
 * Usage:
 *   const { state, tasks, workflow, isLoading } = useProjectData(projectId);
 */

import { useMemo } from 'react';
import { useUnifiedData } from '@/contexts/unified-data-context';
import type {
  OrchestrationState,
  TasksData,
  WorkflowData,
  WorkflowIndexEntry,
} from '@specflow/shared';

interface UseProjectDataResult {
  /** Orchestration state for the project */
  state: OrchestrationState | null;
  /** Tasks data for the current phase */
  tasks: TasksData | null;
  /** Workflow data (current execution + session history) */
  workflow: WorkflowData | null;
  /** Current active workflow execution (if any) */
  currentExecution: WorkflowIndexEntry | null;
  /** List of all workflow sessions */
  sessions: WorkflowIndexEntry[];
  /** True while initial data is loading */
  isLoading: boolean;
  /** True if workflow is currently active (running or waiting) */
  isWorkflowActive: boolean;
  /** True if workflow is waiting for user input */
  isWaitingForInput: boolean;
}

/**
 * Hook for getting all project data from unified context
 */
export function useProjectData(projectId: string | null): UseProjectDataResult {
  const { states, tasks, workflows, connectionStatus } = useUnifiedData();

  const result = useMemo(() => {
    if (!projectId) {
      return {
        state: null,
        tasks: null,
        workflow: null,
        currentExecution: null,
        sessions: [],
        isLoading: connectionStatus === 'connecting',
        isWorkflowActive: false,
        isWaitingForInput: false,
      };
    }

    const state = states.get(projectId) ?? null;
    const projectTasks = tasks.get(projectId) ?? null;
    const workflow = workflows.get(projectId) ?? null;
    const currentExecution = workflow?.currentExecution ?? null;
    const sessions = workflow?.sessions ?? [];

    const activeStates = ['running', 'waiting_for_input', 'detached', 'stale'];
    const isWorkflowActive = currentExecution
      ? activeStates.includes(currentExecution.status)
      : false;
    const isWaitingForInput = currentExecution?.status === 'waiting_for_input';

    return {
      state,
      tasks: projectTasks,
      workflow,
      currentExecution,
      sessions,
      isLoading: connectionStatus === 'connecting',
      isWorkflowActive,
      isWaitingForInput,
    };
  }, [projectId, states, tasks, workflows, connectionStatus]);

  return result;
}
