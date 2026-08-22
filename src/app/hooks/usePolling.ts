import { useEffect, useRef } from 'react';

/**
 * Custom hook for efficient polling with cleanup
 * Uses refs to avoid recreating functions on every render
 */
export function usePolling(
  callback: () => void | Promise<void>,
  interval: number,
  enabled: boolean = true
) {
  const savedCallback = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Update ref when callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    // Execute immediately
    savedCallback.current();

    // Set up polling
    intervalRef.current = setInterval(() => {
      savedCallback.current();
    }, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, enabled]);
}
