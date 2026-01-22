'use client'

import { cn } from '@/lib/utils'
import { FileText, GitBranch, Gauge, ChevronRight, Loader2 } from 'lucide-react'
import type { PhaseDetail } from '@/hooks/use-phase-detail'

interface PhaseCardProps {
  phase: PhaseDetail | null
  isLoading?: boolean
  isActive?: boolean
  onViewHistory?: () => void
  className?: string
}

/**
 * Get complexity color based on level
 */
function getComplexityColor(complexity: string): string {
  const level = complexity.toLowerCase()
  if (level.includes('low') || level.includes('small')) return 'text-success'
  if (level.includes('high') || level.includes('large')) return 'text-danger'
  return 'text-warning' // medium
}

export function PhaseCard({
  phase,
  isLoading = false,
  isActive = false,
  onViewHistory,
  className,
}: PhaseCardProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'px-4 py-3 rounded-xl bg-surface-100/50 border border-surface-300/30',
          className
        )}
      >
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 text-surface-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (!phase) {
    return null
  }

  return (
    <button
      onClick={onViewHistory}
      className={cn(
        'group flex items-center gap-3 px-4 py-3 rounded-xl',
        'bg-surface-100/50 border border-surface-300/30',
        'hover:bg-surface-200/50 hover:border-surface-300/50',
        'transition-all duration-200 text-left w-full',
        className
      )}
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-lg bg-surface-200 flex items-center justify-center text-surface-500 flex-shrink-0">
        <FileText className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500 font-mono">{phase.number}</span>
          <span className="text-sm font-medium text-zinc-300 truncate">{phase.name}</span>
          <span
            className={cn(
              'px-1.5 py-0.5 text-[10px] font-medium rounded',
              isActive
                ? 'bg-accent/15 text-accent'
                : 'bg-surface-300/50 text-zinc-500'
            )}
          >
            {isActive ? 'Active' : 'Next'}
          </span>
        </div>

        {/* Subtitle - truncated goal */}
        {phase.goal && (
          <p className="text-xs text-zinc-500 truncate mt-0.5">{phase.goal}</p>
        )}

        {/* Chips row */}
        {(phase.dependencies || phase.complexity) && (
          <div className="flex items-center gap-2 mt-1.5">
            {phase.dependencies && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-[10px] text-purple-400">
                <GitBranch className="w-2.5 h-2.5" />
                {phase.dependencies.replace(/Phase \d+ complete/, 'Dep').replace(/Phase /, '').replace(' complete', '')}
              </span>
            )}
            {phase.complexity && (
              <span className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-300/50 text-[10px]',
                getComplexityColor(phase.complexity)
              )}>
                <Gauge className="w-2.5 h-2.5" />
                {phase.complexity}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-surface-500 group-hover:text-zinc-400 flex-shrink-0" />
    </button>
  )
}
