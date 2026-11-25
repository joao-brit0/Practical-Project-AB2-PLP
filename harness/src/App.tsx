import { ConnectionHistory } from './components/ConnectionHistory';
import { ConnectionNotification } from './components/ConnectionNotification';
import { ConnectionStatus } from './components/ConnectionStatus';
import { useConnectionMonitor } from './hooks/useConnectionMonitor';

export default function App() {
  const { status, notification, history } = useConnectionMonitor();

  return (
    <main className="app-shell">
      <section className="monitor-card" aria-labelledby="page-title">
        <header className="monitor-card__header">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="eyebrow">Live network status</p>
          <h1 id="page-title">Connection monitor</h1>
          <p className="intro">
            A clear view of your connection, updated as your network changes.
          </p>
        </header>

        <div className="current-state">
          <span className="current-state__label">Current status</span>
          <ConnectionStatus status={status} />
        </div>

        <ConnectionNotification notification={notification} />
        <ConnectionHistory events={history} />
      </section>
      <footer className="page-footer">Watching your connection in real time</footer>
    </main>
  );
}
