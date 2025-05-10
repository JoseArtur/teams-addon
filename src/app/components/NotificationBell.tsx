import React, { useState, useEffect } from 'react';
import { Button, Popover, PopoverTrigger, PopoverSurface, Text, makeStyles, tokens } from '@fluentui/react-components';
import { Bell24Regular, Bell24Filled } from '@fluentui/react-icons';
import { getNotifications, markNotificationAsRead } from '../services/api';

const useStyles = makeStyles({
  notificationBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorPaletteRedForeground1,
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
  },
  notificationList: {
    maxHeight: '400px',
    overflowY: 'auto',
    padding: '8px',
    width: '300px',
  },
  notificationItem: {
    padding: '8px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  unreadNotification: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  notificationTitle: {
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  notificationMessage: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground2,
  },
  notificationTime: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
  },
});

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: string;
}

interface NotificationBellProps {
  email: string;
}

export function NotificationBell({ email }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const styles = useStyles();

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications(email);
      setNotifications(response);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [email]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(_, data) => setIsOpen(data.open)}
    >
      <PopoverTrigger>
        <Button
          icon={unreadCount > 0 ? <Bell24Filled /> : <Bell24Regular />}
          appearance="transparent"
          style={{ position: 'relative' }}
        >
          {unreadCount > 0 && (
            <div className={styles.notificationBadge}>
              {unreadCount}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverSurface>
        <div className={styles.notificationList}>
          {notifications.length === 0 ? (
            <Text>Nenhuma notificação</Text>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`${styles.notificationItem} ${
                  !notification.isRead ? styles.unreadNotification : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={styles.notificationTitle}>
                  {notification.title}
                </div>
                <div className={styles.notificationMessage}>
                  {notification.message}
                </div>
                <div className={styles.notificationTime}>
                  {formatDate(notification.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverSurface>
    </Popover>
  );
} 