"use client"

/**
 * @deprecated Use UnifiedDataProvider and useUnifiedData from
 * '@/contexts/unified-data-context' instead.
 *
 * This module is kept for backward compatibility. All new code should
 * use the unified data context which provides the same data plus
 * centralized session polling.
 */

import { useUnifiedData } from './unified-data-context';
import type { Registry, OrchestrationState, TasksData, WorkflowData, Project } from '@specflow/shared';
import type { ConnectionStatus } from '@/hooks/use-sse';

/**
 * @deprecated Use UnifiedDataContextValue from unified-data-context instead
 */
interface ConnectionContextValue {
  registry: Registry | null;
  states: Map<string, OrchestrationState>;
  tasks: Map<string, TasksData>;
  workflows: Map<string, WorkflowData>;
  connectionStatus: ConnectionStatus;
  refetch: () => void;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
}

/**
 * @deprecated Use UnifiedDataProvider instead
 *
 * This component is no longer needed - UnifiedDataProvider is used in layout.tsx.
 * Kept for backward compatibility with components that import it directly.
 */
export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  // No-op wrapper - UnifiedDataProvider is already in the tree
  return <>{children}</>;
}

/**
 * @deprecated Use useUnifiedData() instead
 *
 * This hook wraps useUnifiedData for backward compatibility.
 * New code should use useUnifiedData directly.
 */
export function useConnection(): ConnectionContextValue {
  const unified = useUnifiedData();

  return {
    registry: unified.registry,
    states: unified.states,
    tasks: unified.tasks,
    workflows: unified.workflows,
    connectionStatus: unified.connectionStatus,
    refetch: unified.refetch,
    selectedProject: unified.selectedProject,
    setSelectedProject: unified.setSelectedProject,
  };
}
