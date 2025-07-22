import React from 'react';
import {Box, Text} from 'ink';
import type {Notification} from '../hooks/use-notification.js';

export type NotificationBarProps = {
	notifications: Notification[];
};

export function NotificationBar({notifications}: NotificationBarProps) {
	if (notifications.length === 0) {
		return null;
	}

	// Show only the latest notification
	const latestNotification = notifications[notifications.length - 1];
	if (!latestNotification) {
		return null;
	}

	const getNotificationColor = (type: Notification['type']) => {
		switch (type) {
			case 'success': {
				return 'green';
			}

			case 'error': {
				return 'red';
			}

			default: {
				return 'blue';
			}
		}
	};

	return (
		<Box paddingX={1} paddingY={0}>
			<Text color={getNotificationColor(latestNotification.type)}>
				{latestNotification.message}
			</Text>
		</Box>
	);
}
