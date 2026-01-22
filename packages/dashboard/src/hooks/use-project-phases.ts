'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface ProjectPhaseInfo {
  nextPhase: {
    number: string;
    name: string;
  } | null;
  activePhase: {
    number: string;
    name: string;
  } | null;
}

interface UseProjectPhasesResult {
  phases: Map<string, ProjectPhaseInfo>;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch phase info for multiple projects at once
 * Optimizes by batching requests and caching results
 */
export function useProjectPhases(
  projects: Array<{ id: string; path: string }> | null
): UseProjectPhasesResult {
  const [phases, setPhases] = useState<Map<string, ProjectPhaseInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Stable project paths for comparison
  const projectPaths = useMemo(
    () => projects?.map((p) => ({ id: p.id, path: p.path })) ?? [],
    [projects]
  );

  const fetchAllPhases = useCallback(async () => {
    if (projectPaths.length === 0) {
      setPhases(new Map());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const newPhases = new Map<string, ProjectPhaseInfo>();

    // Fetch in parallel but with a limit to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < projectPaths.length; i += batchSize) {
      const batch = projectPaths.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async ({ id, path }) => {
          try {
            const res = await fetch(
              `/api/phases?projectPath=${encodeURIComponent(path)}`
            );

            if (!res.ok) {
              // Silently skip projects that fail
              newPhases.set(id, { nextPhase: null, activePhase: null });
              return;
            }

            const data = await res.json();
            const phasesList = data.phases || [];

            // Find active phase (in_progress)
            const active = phasesList.find(
              (p: { status: string }) => p.status === 'in_progress'
            );

            // Find next phase (first not_started after any completed phases)
            const nextPending = phasesList.find(
              (p: { status: string }) => p.status === 'not_started'
            );

            newPhases.set(id, {
              activePhase: active
                ? { number: active.number, name: active.name }
                : null,
              nextPhase: nextPending
                ? { number: nextPending.number, name: nextPending.name }
                : null,
            });
          } catch {
            // Silently skip projects that fail
            newPhases.set(id, { nextPhase: null, activePhase: null });
          }
        })
      );
    }

    setPhases(newPhases);
    setIsLoading(false);
  }, [projectPaths]);

  useEffect(() => {
    fetchAllPhases();
  }, [fetchAllPhases]);

  return {
    phases,
    isLoading,
    error,
    refresh: fetchAllPhases,
  };
}
