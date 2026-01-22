'use client'

import { cn } from '@/lib/utils'
import { useStatusMessage } from '@/hooks/use-status-message'

interface TypingIndicatorProps {
  /** Current tool being used (for contextual messages) */
  currentTool?: string
  /** Override the automatic message with a static one */
  staticText?: string
  className?: string
}

export function TypingIndicator({ currentTool, staticText, className }: TypingIndicatorProps) {
  const { message } = useStatusMessage({
    isActive: !staticText,
    currentTool,
    minDisplayTime: 10000,
    cycleInterval: 25000,
  })

  const displayText = staticText || message.text
  const displayEmoji = staticText ? '🤖' : message.emoji

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md',
        'bg-surface-200/50 border border-surface-300/50',
        'transition-all duration-500 ease-out',
        className
      )}
    >
      {/* Emoji with subtle glow */}
      <span className="text-base leading-none animate-pulse">
        {displayEmoji}
      </span>

      {/* Monospace text */}
      <span className="font-mono text-xs text-zinc-400 tracking-wide">
        {displayText}
      </span>

      {/* Blinking cursor */}
      <span className="w-1.5 h-4 bg-accent/70 animate-pulse rounded-sm" />
    </div>
  )
}
