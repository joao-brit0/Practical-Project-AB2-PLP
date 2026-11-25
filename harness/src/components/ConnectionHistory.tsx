import type { ConnectionEvent } from '../connectivity/types';

type Props = Readonly<{
  events: readonly ConnectionEvent[];
}>;

export function ConnectionHistory({ events }: Props) {
  return (
    <section className="history" aria-labelledby="history-heading">
      <div className="history__heading">
        <h2 id="history-heading">Recent activity</h2>
        <span>{events.length} events</span>
      </div>
      {events.length === 0 ? (
        <p className="history__empty">No connection changes yet.</p>
      ) : (
        <ol className="history__list">
          {events.map((event, index) => (
            <li
              className="history__item"
              key={`${event.timestamp}-${event.status}-${index}`}
            >
              <span
                className={`history__marker history__marker--${event.status}`}
                aria-hidden="true"
              />
              <span>
                {event.status === 'online'
                  ? 'Connection restored'
                  : 'Connection lost'}
              </span>
              <time dateTime={new Date(event.timestamp).toISOString()}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
