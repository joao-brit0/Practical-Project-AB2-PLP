export type ConnectionStatus = 'online' | 'offline';

export type ConnectionEvent = Readonly<{
  status: ConnectionStatus;
  timestamp: number;
}>;

export type ConnectionNotification = Readonly<{
  status: ConnectionStatus;
  message: string;
}>;

export type ConnectionSnapshot = Readonly<{
  status: ConnectionStatus;
  notification: ConnectionNotification | null;
  history: readonly ConnectionEvent[];
}>;

export type SnapshotListener = () => void;
