import type {
  ConnectionEvent,
  ConnectionNotification,
  ConnectionSnapshot,
  ConnectionStatus,
  SnapshotListener,
} from './types';

const NOTIFICATION_DURATION_MS = 4000;
const MAX_HISTORY_LENGTH = 10;
const DEFAULT_HEARTBEAT_INTERVAL_MS = 3000;
const DEFAULT_PROBE_TIMEOUT_MS = 1000;
const DEFAULT_PROBE_URL = 'https://www.google.com/generate_204';

export interface ConnectionMonitorOptions {
  readonly heartbeatIntervalMs?: number | null;
  readonly probeTimeoutMs?: number;
  readonly probeUrl?: string;
}

interface ActiveProbe {
  readonly controller: AbortController;
  readonly timeoutId: ReturnType<typeof setTimeout>;
  timedOut: boolean;
}

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
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private activeProbe: ActiveProbe | null = null;
  private isListening = false;
  private isDestroyed = false;

  private readonly handleOnline = (): void => this.transitionTo('online');
  private readonly handleOffline = (): void => this.transitionTo('offline');

  private readonly heartbeatIntervalMs: number | null;
  private readonly probeTimeoutMs: number;
  private readonly probeUrl: string;

  constructor(
    private readonly target: Window = window,
    options: ConnectionMonitorOptions = {},
  ) {
    this.heartbeatIntervalMs =
      options.heartbeatIntervalMs === undefined
        ? DEFAULT_HEARTBEAT_INTERVAL_MS
        : options.heartbeatIntervalMs;
    this.probeTimeoutMs = options.probeTimeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
    this.probeUrl = options.probeUrl ?? DEFAULT_PROBE_URL;
    this.snapshot = createSnapshot(
      target.navigator.onLine ? 'online' : 'offline',
      null,
      Object.freeze([]),
    );
  }

  readonly getSnapshot = (): ConnectionSnapshot => this.snapshot;

  readonly subscribe = (listener: SnapshotListener): (() => void) => {
    if (this.isDestroyed) {
      return () => undefined;
    }

    this.listeners.add(listener);

    if (this.listeners.size === 1) {
      this.refreshStatusSilently();
      this.attachWindowListeners();
      this.startHeartbeat();
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
        this.stopHeartbeat();
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

  readonly destroy = (): void => {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;
    this.listeners.clear();
    this.detachWindowListeners();
    this.stopHeartbeat();
    this.clearNotificationTimer();
    if (this.snapshot.notification !== null) {
      this.snapshot = createSnapshot(
        this.snapshot.status,
        null,
        this.snapshot.history,
      );
    }
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

  private startHeartbeat(): void {
    if (this.heartbeatIntervalMs === null || this.heartbeatTimer !== null) {
      return;
    }
    this.heartbeatTimer = setInterval(
      () => this.checkConnectivity(),
      this.heartbeatIntervalMs,
    );
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    const activeProbe = this.activeProbe;
    if (activeProbe !== null) {
      this.activeProbe = null;
      clearTimeout(activeProbe.timeoutId);
      activeProbe.controller.abort();
    }
  }

  private checkConnectivity(): void {
    if (
      this.isDestroyed ||
      this.listeners.size === 0 ||
      this.activeProbe !== null
    ) {
      return;
    }

    const controller = new AbortController();
    const request: ActiveProbe = {
      controller,
      timeoutId: setTimeout(() => {
        if (this.activeProbe !== request) {
          return;
        }
        request.timedOut = true;
        this.activeProbe = null;
        this.transitionTo('offline');
        controller.abort();
      }, this.probeTimeoutMs),
      timedOut: false,
    };
    this.activeProbe = request;

    void globalThis
      .fetch(this.probeUrl, {
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      })
      .then(
        () => this.finishProbe(request, 'online'),
        () => this.finishProbe(request, 'offline'),
      );
  }

  private finishProbe(
    request: ActiveProbe,
    status: ConnectionStatus,
  ): void {
    if (this.activeProbe !== request) {
      return;
    }
    this.activeProbe = null;
    clearTimeout(request.timeoutId);
    if (!request.timedOut) {
      this.transitionTo(status);
    }
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
