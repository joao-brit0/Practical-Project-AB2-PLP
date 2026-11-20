export type ConnectionStatus = 'ONLINE' | 'OFFLINE'

export interface ConnectionEvent {
  id: number
  status: ConnectionStatus
  timestamp: string
}

export interface ConnectionNotification {
  id: number
  status: ConnectionStatus
  message: string
}

export interface ConnectionState {
  status: ConnectionStatus
  history: ConnectionEvent[]
  notification: ConnectionNotification | null
}

export interface ConnectionEventSource {
  readonly onLine: boolean
  addEventListener(type: 'online' | 'offline', listener: () => void): void
  removeEventListener(type: 'online' | 'offline', listener: () => void): void
}

type Listener = () => void

export class ConnectionMonitor {
  private state: ConnectionState
  private readonly listeners = new Set<Listener>()
  private eventId = 0
  private started = false
  private readonly eventSource: ConnectionEventSource

  constructor(eventSource: ConnectionEventSource) {
    this.eventSource = eventSource
    this.state = {
      status: eventSource.onLine ? 'ONLINE' : 'OFFLINE',
      history: [],
      notification: null,
    }
  }

  getSnapshot = (): ConnectionState => this.state

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  start = (): void => {
    if (this.started) return
    this.started = true
    this.eventSource.addEventListener('online', this.handleOnline)
    this.eventSource.addEventListener('offline', this.handleOffline)
  }

  stop = (): void => {
    if (!this.started) return
    this.started = false
    this.eventSource.removeEventListener('online', this.handleOnline)
    this.eventSource.removeEventListener('offline', this.handleOffline)
  }

  private handleOnline = (): void => this.transitionTo('ONLINE')
  private handleOffline = (): void => this.transitionTo('OFFLINE')

  private transitionTo(status: ConnectionStatus): void {
    if (this.state.status === status) return

    this.eventId += 1
    const event: ConnectionEvent = {
      id: this.eventId,
      status,
      timestamp: new Date().toISOString(),
    }

    this.state = {
      status,
      history: [event, ...this.state.history],
      notification: {
        id: event.id,
        status,
        message: status === 'ONLINE' ? 'Conexão restaurada' : 'Conexão perdida',
      },
    }
    this.listeners.forEach((listener) => listener())
  }
}
