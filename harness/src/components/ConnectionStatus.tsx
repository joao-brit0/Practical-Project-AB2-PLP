import type { ConnectionStatus as ConnectionStatusValue } from '../connectivity/types';

type Props = Readonly<{
  status: ConnectionStatusValue;
}>;

export function ConnectionStatus({ status }: Props) {
  const label = status === 'online' ? 'Connected' : 'Disconnected';

  return (
    <p className={`connection-status connection-status--${status}`} role="status">
      <span className="connection-status__indicator" aria-hidden="true" />
      {label}
    </p>
  );
}
