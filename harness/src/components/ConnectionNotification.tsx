import type { ConnectionNotification as Notification } from '../connectivity/types';

type Props = Readonly<{
  notification: Notification | null;
}>;

export function ConnectionNotification({ notification }: Props) {
  if (notification === null) {
    return null;
  }

  return (
    <p
      className={`notification notification--${notification.status}`}
      role="alert"
    >
      {notification.message}
    </p>
  );
}
