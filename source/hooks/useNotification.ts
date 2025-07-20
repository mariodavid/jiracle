import {useState, useCallback} from 'react';

export type Notification = {
	message: string;
	type: 'success' | 'error' | 'info';
	id: number;
};

export type UseNotificationReturn = {
	notifications: Notification[];
	showNotification: (
		message: string,
		type?: 'success' | 'error' | 'info',
	) => void;
	dismissNotification: (id: number) => void;
	clearNotifications: () => void;
};

let notificationIdCounter = 0;

export function useNotification(): UseNotificationReturn {
	const [notifications, setNotifications] = useState<Notification[]>([]);

	const showNotification = useCallback(
		(message: string, type: 'success' | 'error' | 'info' = 'info') => {
			const id = ++notificationIdCounter;
			const notification: Notification = {message, type, id};

			setNotifications(prev => [...prev, notification]);

			// Auto-dismiss after 3 seconds for success/info, 5 seconds for error
			const timeout = type === 'error' ? 5000 : 3000;
			setTimeout(() => {
				setNotifications(prev => prev.filter(n => n.id !== id));
			}, timeout);
		},
		[],
	);

	const dismissNotification = useCallback((id: number) => {
		setNotifications(prev => prev.filter(n => n.id !== id));
	}, []);

	const clearNotifications = useCallback(() => {
		setNotifications([]);
	}, []);

	return {
		notifications,
		showNotification,
		dismissNotification,
		clearNotifications,
	};
}

// Test helper function to reset the counter between tests
export function resetNotificationCounter() {
	notificationIdCounter = 0;
}
