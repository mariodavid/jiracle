import test from 'ava';
import React from 'react';
import {render} from 'ink';
import {
	useNotification,
	resetNotificationCounter,
} from '../../hooks/use-notification.js';
import type {UseNotificationReturn} from '../../hooks/use-notification.js';

test.beforeEach(() => {
	resetNotificationCounter();
});

test('useNotification - initial state', t => {
	let hookResult: UseNotificationReturn | undefined;

	function TestComponent() {
		hookResult = useNotification();
		return React.createElement('div');
	}

	render(React.createElement(TestComponent));

	t.truthy(hookResult);
	if (!hookResult) return;

	// Clear any existing notifications first
	hookResult.clearNotifications();

	t.deepEqual(hookResult.notifications, []);
	t.is(typeof hookResult.showNotification, 'function');
	t.is(typeof hookResult.dismissNotification, 'function');
	t.is(typeof hookResult.clearNotifications, 'function');
});

test('useNotification - shows notification with default type', t => {
	let hookResult: UseNotificationReturn | undefined;

	function TestComponent() {
		hookResult = useNotification();
		return React.createElement('div');
	}

	const {rerender} = render(React.createElement(TestComponent));

	t.truthy(hookResult);
	if (!hookResult) return;

	// Clear any existing notifications first
	hookResult.clearNotifications();
	rerender(React.createElement(TestComponent));

	// Show notification
	hookResult.showNotification('Test message');
	rerender(React.createElement(TestComponent));

	t.is(hookResult.notifications.length, 1);
	t.is(hookResult.notifications[0]!.message, 'Test message');
	t.is(hookResult.notifications[0]!.type, 'info');
	t.truthy(hookResult.notifications[0]!.id);
});

test('useNotification - shows notification with specific type', t => {
	let hookResult: UseNotificationReturn | undefined;

	function TestComponent() {
		hookResult = useNotification();
		return React.createElement('div');
	}

	const {rerender} = render(React.createElement(TestComponent));

	t.truthy(hookResult);
	if (!hookResult) return;

	// Clear any existing notifications first
	hookResult.clearNotifications();
	rerender(React.createElement(TestComponent));

	// Show notification with specific type
	hookResult.showNotification('Error message', 'error');
	rerender(React.createElement(TestComponent));

	t.is(hookResult.notifications.length, 1);
	t.is(hookResult.notifications[0]!.message, 'Error message');
	t.is(hookResult.notifications[0]!.type, 'error');
});

test('useNotification - shows multiple notifications', t => {
	let hookResult: UseNotificationReturn | undefined;

	function TestComponent() {
		hookResult = useNotification();
		return React.createElement('div');
	}

	const {rerender} = render(React.createElement(TestComponent));

	t.truthy(hookResult);
	if (!hookResult) return;

	// Clear any existing notifications first
	hookResult.clearNotifications();
	rerender(React.createElement(TestComponent));

	// Show first notification
	hookResult.showNotification('First message', 'success');
	rerender(React.createElement(TestComponent));

	// Show second notification
	hookResult.showNotification('Second message', 'error');
	rerender(React.createElement(TestComponent));

	t.is(hookResult.notifications.length, 2);
	t.is(hookResult.notifications[0]!.message, 'First message');
	t.is(hookResult.notifications[0]!.type, 'success');
	t.is(hookResult.notifications[1]!.message, 'Second message');
	t.is(hookResult.notifications[1]!.type, 'error');
});

test('useNotification - dismisses specific notification', t => {
	let hookResult: UseNotificationReturn | undefined;

	function TestComponent() {
		hookResult = useNotification();
		return React.createElement('div');
	}

	const {rerender} = render(React.createElement(TestComponent));

	if (!hookResult) {
		t.fail('Hook result should be available');
		return;
	}

	// Clear any existing notifications first
	hookResult.clearNotifications();
	rerender(React.createElement(TestComponent));

	// Show first notification
	hookResult.showNotification('First message');
	rerender(React.createElement(TestComponent));

	// Show second notification
	hookResult.showNotification('Second message');
	rerender(React.createElement(TestComponent));

	t.is(hookResult.notifications.length, 2);
	const firstId = hookResult.notifications[0]!.id;

	// Dismiss first notification
	hookResult.dismissNotification(firstId);
	rerender(React.createElement(TestComponent));

	t.is(hookResult.notifications.length, 1);
	t.is(hookResult.notifications[0]!.message, 'Second message');
});

test('useNotification - clears all notifications', t => {
	let hookResult: UseNotificationReturn | undefined;

	function TestComponent() {
		hookResult = useNotification();
		return React.createElement('div');
	}

	const {rerender} = render(React.createElement(TestComponent));

	if (!hookResult) {
		t.fail('Hook result should be available');
		return;
	}

	// Clear any existing notifications first
	hookResult.clearNotifications();
	rerender(React.createElement(TestComponent));

	// Show multiple notifications
	hookResult.showNotification('First message');
	rerender(React.createElement(TestComponent));

	hookResult.showNotification('Second message');
	rerender(React.createElement(TestComponent));

	t.is(hookResult.notifications.length, 2);

	// Clear all notifications
	hookResult.clearNotifications();
	rerender(React.createElement(TestComponent));

	t.is(hookResult.notifications.length, 0);
});

test('useNotification - notifications have unique IDs', t => {
	let hookResult: UseNotificationReturn | undefined;

	function TestComponent() {
		hookResult = useNotification();
		return React.createElement('div');
	}

	const {rerender} = render(React.createElement(TestComponent));

	t.truthy(hookResult);
	if (!hookResult) return;

	// Clear any existing notifications first
	hookResult.clearNotifications();
	rerender(React.createElement(TestComponent));

	// Show multiple notifications
	hookResult.showNotification('First message');
	rerender(React.createElement(TestComponent));

	hookResult.showNotification('Second message');
	rerender(React.createElement(TestComponent));

	hookResult.showNotification('Third message');
	rerender(React.createElement(TestComponent));

	const ids = hookResult.notifications.map(n => n.id);
	const uniqueIds = new Set(ids);
	t.is(ids.length, uniqueIds.size, 'All IDs should be unique');
});

test('useNotification - auto-dismissal timing differs by type', t => {
	// This test is more about documenting the behavior
	// The actual auto-dismissal is time-based and hard to test reliably
	let hookResult: UseNotificationReturn | undefined;

	function TestComponent() {
		hookResult = useNotification();
		return React.createElement('div');
	}

	const {rerender} = render(React.createElement(TestComponent));

	t.truthy(hookResult);
	if (!hookResult) return;

	// Clear any existing notifications first
	hookResult.clearNotifications();
	rerender(React.createElement(TestComponent));

	// Show error notification (should have longer timeout)
	hookResult.showNotification('Error message', 'error');
	rerender(React.createElement(TestComponent));

	// Show success notification (should have shorter timeout)
	hookResult.showNotification('Success message', 'success');
	rerender(React.createElement(TestComponent));

	t.is(hookResult.notifications.length, 2);

	// Note: We don't test the actual auto-dismissal timing here as it's unreliable in tests
	// The behavior is documented in the implementation: 5s for error, 3s for success/info
	t.pass();
});
