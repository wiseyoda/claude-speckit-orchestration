'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getStatusMessage, type StatusMessage } from '@/lib/status-messages';

interface UseStatusMessageOptions {
  /** Minimum time to show a message before cycling (ms) */
  minDisplayTime?: number;
  /** Time between message cycles (ms) - will be randomized +/- 1 second */
  cycleInterval?: number;
  /** Whether the message cycling is active */
  isActive?: boolean;
  /** Current tool being used (for contextual messages) */
  currentTool?: string;
}

interface UseStatusMessageResult {
  message: StatusMessage;
  /** Force a new message selection */
  refreshMessage: () => void;
}

/**
 * Hook for cycling through status messages with timing constraints.
 *
 * - Shows each message for at least `minDisplayTime` (default 5s)
 * - Cycles to a new message every `cycleInterval` (default 9-11s, randomized)
 * - Messages are contextual based on the current tool being used
 */
export function useStatusMessage(options: UseStatusMessageOptions = {}): UseStatusMessageResult {
  const {
    minDisplayTime = 10000,
    cycleInterval = 25000,
    isActive = true,
    currentTool,
  } = options;

  // Track the current message
  const [message, setMessage] = useState<StatusMessage>(() => getStatusMessage(currentTool));

  // Track when the current message was set
  const messageSetTimeRef = useRef<number>(Date.now());

  // Track the current tool to detect changes
  const prevToolRef = useRef<string | undefined>(currentTool);

  // Get a new message
  const refreshMessage = useCallback(() => {
    const newMessage = getStatusMessage(currentTool);
    setMessage(newMessage);
    messageSetTimeRef.current = Date.now();
  }, [currentTool]);

  // Handle tool changes - only update if minimum display time has passed
  useEffect(() => {
    if (currentTool !== prevToolRef.current) {
      const elapsed = Date.now() - messageSetTimeRef.current;

      if (elapsed >= minDisplayTime) {
        // Enough time has passed, update immediately
        refreshMessage();
      }
      // If not enough time has passed, the timer will update it later

      prevToolRef.current = currentTool;
    }
  }, [currentTool, minDisplayTime, refreshMessage]);

  // Cycle messages on an interval
  useEffect(() => {
    if (!isActive) return;

    // Randomize interval by +/- 5 seconds for less programmatic feel
    const getRandomInterval = () => {
      const variance = 5000; // +/- 5 seconds
      return cycleInterval + (Math.random() * variance * 2 - variance);
    };

    let timeoutId: NodeJS.Timeout;

    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        // Check if minimum display time has passed
        const elapsed = Date.now() - messageSetTimeRef.current;
        if (elapsed >= minDisplayTime) {
          refreshMessage();
        }
        // Schedule next cycle
        scheduleNext();
      }, getRandomInterval());
    };

    scheduleNext();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isActive, cycleInterval, minDisplayTime, refreshMessage]);

  return { message, refreshMessage };
}
