import { useEffect, useSyncExternalStore } from 'react'
import { ConnectionMonitor, type ConnectionEventSource } from './ConnectionMonitor'

const browserEventSource: ConnectionEventSource = {
  get onLine() {
    return navigator.onLine
  },
  addEventListener(type, listener) {
    window.addEventListener(type, listener)
  },
  removeEventListener(type, listener) {
    window.removeEventListener(type, listener)
  },
}

export const connectionMonitor = new ConnectionMonitor(browserEventSource)

export function useConnectionMonitor() {
  useEffect(() => {
    connectionMonitor.start()
    return () => connectionMonitor.stop()
  }, [])

  return useSyncExternalStore(
    connectionMonitor.subscribe,
    connectionMonitor.getSnapshot,
  )
}
