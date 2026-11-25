import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConnectionMonitor } from './ConnectionMonitor';

function setOnline(value: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  setOnline(true);
});

describe('ConnectionMonitor', () => {
  it('starts from the browser state without creating a transition', () => {
    setOnline(false);
    const monitor = new ConnectionMonitor();

    expect(monitor.getSnapshot()).toEqual({
      status: 'offline',
      notification: null,
      history: [],
    });
  });

  it('deduplicates global listeners and supports immediate resubscription', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const monitor = new ConnectionMonitor();
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = monitor.subscribe(first);
    const unsubscribeSecond = monitor.subscribe(second);

    expect(addSpy.mock.calls.filter(([type]) => type === 'online')).toHaveLength(1);
    expect(addSpy.mock.calls.filter(([type]) => type === 'offline')).toHaveLength(1);

    unsubscribeFirst();
    expect(removeSpy).not.toHaveBeenCalled();

    unsubscribeSecond();
    expect(removeSpy.mock.calls.filter(([type]) => type === 'online')).toHaveLength(1);
    expect(removeSpy.mock.calls.filter(([type]) => type === 'offline')).toHaveLength(1);

    const unsubscribeAgain = monitor.subscribe(first);
    window.dispatchEvent(new Event('offline'));
    expect(monitor.getSnapshot().status).toBe('offline');
    unsubscribeAgain();
  });

  it('ignores repeated events that do not change the status', () => {
    const monitor = new ConnectionMonitor();
    const listener = vi.fn();
    const unsubscribe = monitor.subscribe(listener);

    window.dispatchEvent(new Event('online'));
    expect(monitor.getSnapshot().history).toHaveLength(0);
    expect(monitor.getSnapshot().notification).toBeNull();
    expect(listener).not.toHaveBeenCalled();

    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('offline'));
    expect(monitor.getSnapshot().history).toHaveLength(1);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('emits transition state atomically and hides notifications after four seconds', () => {
    vi.useFakeTimers();
    const monitor = new ConnectionMonitor();
    const listener = vi.fn();
    const unsubscribe = monitor.subscribe(listener);

    window.dispatchEvent(new Event('offline'));
    expect(monitor.getSnapshot()).toMatchObject({
      status: 'offline',
      notification: { status: 'offline', message: 'Connection lost.' },
      history: [{ status: 'offline' }],
    });

    vi.advanceTimersByTime(3999);
    expect(monitor.getSnapshot().notification).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(monitor.getSnapshot().notification).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it('preempts the previous notification timer on a new transition', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const monitor = new ConnectionMonitor();
    const unsubscribe = monitor.subscribe(vi.fn());

    window.dispatchEvent(new Event('offline'));
    vi.advanceTimersByTime(2000);
    window.dispatchEvent(new Event('online'));

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(monitor.getSnapshot().notification?.status).toBe('online');
    vi.advanceTimersByTime(2000);
    expect(monitor.getSnapshot().notification?.status).toBe('online');
    vi.advanceTimersByTime(2000);
    expect(monitor.getSnapshot().notification).toBeNull();
    unsubscribe();
  });

  it('keeps a frozen, newest-first history capped at ten events', () => {
    const monitor = new ConnectionMonitor();
    const unsubscribe = monitor.subscribe(vi.fn());
    const initialHistory = monitor.getSnapshot().history;

    for (let index = 0; index < 12; index += 1) {
      window.dispatchEvent(new Event(index % 2 === 0 ? 'offline' : 'online'));
    }

    const history = monitor.getSnapshot().history;
    expect(history).toHaveLength(10);
    expect(history).not.toBe(initialHistory);
    expect(Object.isFrozen(history)).toBe(true);
    expect(history[0]?.status).toBe('online');
    expect(history[9]?.status).toBe('offline');
    unsubscribe();
  });
});
