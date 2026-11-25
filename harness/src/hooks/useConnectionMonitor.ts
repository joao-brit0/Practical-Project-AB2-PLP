import { useSyncExternalStore } from 'react';
import { getConnectionMonitor } from '../connectivity/ConnectionMonitor';

export function useConnectionMonitor() {
  const monitor = getConnectionMonitor();
  return useSyncExternalStore(
    monitor.subscribe,
    monitor.getSnapshot,
    monitor.getSnapshot,
  );
}
