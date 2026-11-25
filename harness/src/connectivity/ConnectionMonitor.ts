import type {
  ConnectionEvent,
  ConnectionNotification,
  ConnectionSnapshot,
  ConnectionStatus,
  SnapshotListener,
} from './types';

const NOTIFICATION_DURATION_MS = 4000;
const MAX_HISTORY_LENGTH = 10;

function createSnapshot(
  status: ConnectionStatus,
  notification: ConnectionNotification | null,
  history: readonly ConnectionEvent[],
): ConnectionSnapshot {
  return Object.freeze({ status, notification, history });
}

export class ConnectionMonitor {
  private readonly listeners = new Set<SnapshotListener>();
  private snapshot: ConnectionSnapshot;
  private notificationTimer: ReturnType<typeof setTimeout> | null = null;
  private isListening = false;

  private readonly handleOnline = (): void => this.transitionTo('online');
  private readonly handleOffline = (): void => this.transitionTo('offline');

  constructor(private readonly target: Window = window) {
    this.snapshot = createSnapshot(
      target.navigator.onLine ? 'online' : 'offline',
      null,
      Object.freeze([]),
    );
  }

  readonly getSnapshot = (): ConnectionSnapshot => this.snapshot;

  readonly subscribe = (listener: SnapshotListener): (() => void) => {
    this.listeners.add(listener);

    if (this.listeners.size === 1) {
      this.refreshStatusSilently();
      this.attachWindowListeners();
    }

    let active = true;
    return () => {
      if (!active) {
        return;
      }
      active = false;
      this.listeners.delete(listener);

      if (this.listeners.size === 0) {
        this.detachWindowListeners();
        this.clearNotificationTimer();
        if (this.snapshot.notification !== null) {
          this.snapshot = createSnapshot(
            this.snapshot.status,
            null,
            this.snapshot.history,
          );
        }
      }
    };
  };

  private refreshStatusSilently(): void {
    const status: ConnectionStatus = this.target.navigator.onLine
      ? 'online'
      : 'offline';
    if (status !== this.snapshot.status) {
      this.snapshot = createSnapshot(status, null, this.snapshot.history);
    }
  }

  private attachWindowListeners(): void {
    if (this.isListening) {
      return;
    }
    this.target.addEventListener('online', this.handleOnline);
    this.target.addEventListener('offline', this.handleOffline);
    this.isListening = true;
  }

  private detachWindowListeners(): void {
    if (!this.isListening) {
      return;
    }
    this.target.removeEventListener('online', this.handleOnline);
    this.target.removeEventListener('offline', this.handleOffline);
    this.isListening = false;
  }

  private transitionTo(status: ConnectionStatus): void {
    if (status === this.snapshot.status) {
      return;
    }

    this.clearNotificationTimer();
    const event: ConnectionEvent = Object.freeze({
      status,
      timestamp: Date.now(),
    });
    const history = Object.freeze(
      [event, ...this.snapshot.history].slice(0, MAX_HISTORY_LENGTH),
    );
    const notification: ConnectionNotification = Object.freeze({
      status,
      message:
        status === 'online'
          ? 'Connection restored.'
          : 'Connection lost.',
    });

    this.snapshot = createSnapshot(status, notification, history);
    this.notifyListeners();
    this.notificationTimer = setTimeout(() => {
      this.notificationTimer = null;
      this.snapshot = createSnapshot(
        this.snapshot.status,
        null,
        this.snapshot.history,
      );
      this.notifyListeners();
    }, NOTIFICATION_DURATION_MS);
  }

  private clearNotificationTimer(): void {
    if (this.notificationTimer !== null) {
      clearTimeout(this.notificationTimer);
      this.notificationTimer = null;
    }
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

let connectionMonitor: ConnectionMonitor | null = null;

export function getConnectionMonitor(): ConnectionMonitor {
  connectionMonitor ??= new ConnectionMonitor();
  return connectionMonitor;
}
