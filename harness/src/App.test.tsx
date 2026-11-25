import { StrictMode } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

function setOnline(value: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  setOnline(true);
});

describe('Reactive Connection Monitor UI', () => {
  it('renders the silent initial state, accessible status, and explicit empty history', () => {
    setOnline(false);
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Disconnected');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('No connection changes yet.')).toBeInTheDocument();
  });

  it('updates status, notification, and reverse-chronological history and cleans up on unmount', () => {
    vi.useFakeTimers();
    setOnline(true);
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByRole('status')).toHaveTextContent('Disconnected');
    expect(screen.getByRole('alert')).toHaveTextContent('Connection lost.');
    expect(screen.getByText('Connection lost', { selector: 'li span:not([aria-hidden])' })).toBeInTheDocument();

    act(() => {
      unmount();
    });
    expect(removeSpy.mock.calls.some(([type]) => type === 'online')).toBe(true);
    expect(removeSpy.mock.calls.some(([type]) => type === 'offline')).toBe(true);

    act(() => {
      vi.advanceTimersByTime(4000);
      window.dispatchEvent(new Event('online'));
    });
    expect(addSpy.mock.calls.some(([type]) => type === 'online')).toBe(true);
  });
});
