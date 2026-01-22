'use client';

/**
 * Orchestration Controls
 *
 * Pause/Resume and Cancel buttons during active orchestration.
 */

import * as React from 'react';
import { Pause, Play, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// =============================================================================
// Types
// =============================================================================

export interface OrchestrationControlsProps {
  /** Whether orchestration is paused */
  isPaused: boolean;
  /** Callback for pause action */
  onPause?: () => void;
  /** Callback for resume action */
  onResume?: () => void;
  /** Callback for cancel action */
  onCancel?: () => void;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Whether an action is in progress */
  isLoading?: boolean;
}

// =============================================================================
// Main Component
// =============================================================================

export function OrchestrationControls({
  isPaused,
  onPause,
  onResume,
  onCancel,
  disabled = false,
  isLoading = false,
}: OrchestrationControlsProps) {
  const [confirmCancel, setConfirmCancel] = React.useState(false);

  const handleCancelClick = React.useCallback(() => {
    if (confirmCancel) {
      onCancel?.();
      setConfirmCancel(false);
    } else {
      setConfirmCancel(true);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setConfirmCancel(false), 3000);
    }
  }, [confirmCancel, onCancel]);

  return (
    <div className="flex items-center justify-center gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
      {/* Pause/Resume Button */}
      {isPaused ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onResume}
          disabled={disabled || isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Resume
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onPause}
          disabled={disabled || isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
          Pause
        </Button>
      )}

      {/* Cancel Button */}
      <Button
        variant={confirmCancel ? 'destructive' : 'outline'}
        size="sm"
        onClick={handleCancelClick}
        disabled={disabled || isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        {confirmCancel ? 'Confirm Cancel' : 'Cancel'}
      </Button>
    </div>
  );
}
