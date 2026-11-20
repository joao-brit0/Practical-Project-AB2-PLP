import './App.css'
import { useConnectionMonitor } from './connectivity/useConnectionMonitor'

function App() {
  const { status, history, notification } = useConnectionMonitor()
  const isOnline = status === 'ONLINE'

  return (
    <main className="monitor-app">
      {notification && (
        <div
          className={`notification notification-${notification.status.toLowerCase()}`}
          role="status"
          aria-live="polite"
        >
          {notification.message}
        </div>
      )}

      <section className="status-card" aria-labelledby="connection-title">
        <p className="eyebrow">Reactive Connection Monitor</p>
        <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
          <span className="status-dot" aria-hidden="true" />
          <span id="connection-title">{status}</span>
        </div>
      </section>

      <section className="history-card" aria-labelledby="history-title">
        <h2 id="history-title">Historico de conexao</h2>
        {history.length === 0 ? (
          <p className="empty-history">Nenhuma mudança registrada.</p>
        ) : (
          <ul className="history-list">
            {history.map((event) => (
              <li key={event.id}>
                <span className={`history-status ${event.status.toLowerCase()}`}>
                  {event.status}
                </span>
                <time dateTime={event.timestamp}>
                  {new Date(event.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
