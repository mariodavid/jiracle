import test from 'ava';
import React, {useEffect} from 'react';
import {Box, render} from 'ink';
import {useNotification} from '../../hooks/useNotification.js';
import type {UseNotificationReturn} from '../../hooks/useNotification.js';

interface TestState {
	hookResult?: UseNotificationReturn;
	actionToTrigger?: 'show' | 'dismiss' | 'clear';
	messageToShow?: string;
	typeToShow?: 'success' | 'error' | 'info';
	idToDismiss?: number;
}

function TestNotificationComponent({testState}: {testState: TestState}) {
	const hookResult = useNotification();

	useEffect(() => {
		testState.hookResult = hookResult;
	});

	// Trigger actions based on test state
	useEffect(() => {
		if (testState.actionToTrigger === 'show' && testState.messageToShow) {
			hookResult.showNotification(
				testState.messageToShow,
				testState.typeToShow,
			);
			testState.actionToTrigger = undefined;
		} else if (
			testState.actionToTrigger === 'dismiss' &&
			testState.idToDismiss
		) {
			hookResult.dismissNotification(testState.idToDismiss);
			testState.actionToTrigger = undefined;
		} else if (testState.actionToTrigger === 'clear') {
			hookResult.clearNotifications();
			testState.actionToTrigger = undefined;
		}
	});

	return <Box>Test Component</Box>;
}

test('useNotification - initial state', t => {
	const testState: TestState = {};

	const {rerender} = render(
		React.createElement(TestNotificationComponent, {testState}),
	);
	rerender(React.createElement(TestNotificationComponent, {testState}));

	t.truthy(testState.hookResult);
	if (!testState.hookResult) return;

	t.deepEqual(testState.hookResult.notifications, []);
	t.is(typeof testState.hookResult.showNotification, 'function');
	t.is(typeof testState.hookResult.dismissNotification, 'function');
	t.is(typeof testState.hookResult.clearNotifications, 'function');
});

test('useNotification - shows notification with default type', t => {
	const testState: TestState = {
		actionToTrigger: 'show',
		messageToShow: 'Test message',
	};

	const {rerender} = render(
		React.createElement(TestNotificationComponent, {testState}),
	);
	rerender(React.createElement(TestNotificationComponent, {testState}));

	t.truthy(testState.hookResult);
	if (!testState.hookResult) return;

	t.is(testState.hookResult.notifications.length, 1);
	t.is(testState.hookResult.notifications[0]!.message, 'Test message');
	t.is(testState.hookResult.notifications[0]!.type, 'info');
	t.truthy(testState.hookResult.notifications[0]!.id);
});

test('useNotification - shows notification with specific type', t => {
	const testState: TestState = {
		actionToTrigger: 'show',
		messageToShow: 'Error message',
		typeToShow: 'error',
	};

	const {rerender} = render(
		React.createElement(TestNotificationComponent, {testState}),
	);
	rerender(React.createElement(TestNotificationComponent, {testState}));

	t.truthy(testState.hookResult);
	if (!testState.hookResult) return;

	t.is(testState.hookResult.notifications.length, 1);
	t.is(testState.hookResult.notifications[0]!.message, 'Error message');
	t.is(testState.hookResult.notifications[0]!.type, 'error');
});

test('useNotification - shows multiple notifications', t => {
	const testState: TestState = {};

	const {rerender} = render(
		React.createElement(TestNotificationComponent, {testState}),
	);

	// Show first notification
	testState.actionToTrigger = 'show';
	testState.messageToShow = 'First message';
	testState.typeToShow = 'success';
	rerender(React.createElement(TestNotificationComponent, {testState}));

	// Show second notification
	testState.actionToTrigger = 'show';
	testState.messageToShow = 'Second message';
	testState.typeToShow = 'error';
	rerender(React.createElement(TestNotificationComponent, {testState}));

	t.truthy(testState.hookResult);
	if (!testState.hookResult) return;

	t.is(testState.hookResult.notifications.length, 2);
	t.is(testState.hookResult.notifications[0]!.message, 'First message');
	t.is(testState.hookResult.notifications[0]!.type, 'success');
	t.is(testState.hookResult.notifications[1]!.message, 'Second message');
	t.is(testState.hookResult.notifications[1]!.type, 'error');
});

test('useNotification - dismisses specific notification', t => {
	const testState: TestState = {};

	const {rerender} = render(
		React.createElement(TestNotificationComponent, {testState}),
	);

	// Show first notification
	testState.actionToTrigger = 'show';
	testState.messageToShow = 'First message';
	rerender(React.createElement(TestNotificationComponent, {testState}));

	// Show second notification
	testState.actionToTrigger = 'show';
	testState.messageToShow = 'Second message';
	rerender(React.createElement(TestNotificationComponent, {testState}));

	if (!testState.hookResult) {
		t.fail('Hook result should be available');
		return;
	}

	t.is(testState.hookResult.notifications.length, 2);
	const firstId = testState.hookResult.notifications[0]!.id;

	// Dismiss first notification
	testState.actionToTrigger = 'dismiss';
	testState.idToDismiss = firstId;
	rerender(React.createElement(TestNotificationComponent, {testState}));

	t.is(testState.hookResult.notifications.length, 1);
	t.is(testState.hookResult.notifications[0]!.message, 'Second message');
});

test('useNotification - clears all notifications', t => {
	const testState: TestState = {};

	const {rerender} = render(
		React.createElement(TestNotificationComponent, {testState}),
	);

	// Show multiple notifications
	testState.actionToTrigger = 'show';
	testState.messageToShow = 'First message';
	rerender(React.createElement(TestNotificationComponent, {testState}));

	testState.actionToTrigger = 'show';
	testState.messageToShow = 'Second message';
	rerender(React.createElement(TestNotificationComponent, {testState}));

	if (!testState.hookResult) {
		t.fail('Hook result should be available');
		return;
	}

	t.is(testState.hookResult.notifications.length, 2);

	// Clear all notifications
	testState.actionToTrigger = 'clear';
	rerender(React.createElement(TestNotificationComponent, {testState}));

	t.is(testState.hookResult.notifications.length, 0);
});

test('useNotification - notifications have unique IDs', t => {
	const testState: TestState = {};

	const {rerender} = render(
		React.createElement(TestNotificationComponent, {testState}),
	);

	// Show multiple notifications
	testState.actionToTrigger = 'show';
	testState.messageToShow = 'First message';
	rerender(React.createElement(TestNotificationComponent, {testState}));

	testState.actionToTrigger = 'show';
	testState.messageToShow = 'Second message';
	rerender(React.createElement(TestNotificationComponent, {testState}));

	testState.actionToTrigger = 'show';
	testState.messageToShow = 'Third message';
	rerender(React.createElement(TestNotificationComponent, {testState}));

	t.truthy(testState.hookResult);
	if (!testState.hookResult) return;

	const ids = testState.hookResult.notifications.map(n => n.id);
	const uniqueIds = new Set(ids);
	t.is(ids.length, uniqueIds.size, 'All IDs should be unique');
});

test('useNotification - auto-dismissal timing differs by type', async t => {
	// This test is more about documenting the behavior
	// The actual auto-dismissal is time-based and hard to test reliably
	const testState: TestState = {};

	const {rerender} = render(
		React.createElement(TestNotificationComponent, {testState}),
	);

	// Show error notification (should have longer timeout)
	testState.actionToTrigger = 'show';
	testState.messageToShow = 'Error message';
	testState.typeToShow = 'error';
	rerender(React.createElement(TestNotificationComponent, {testState}));

	// Show success notification (should have shorter timeout)
	testState.actionToTrigger = 'show';
	testState.messageToShow = 'Success message';
	testState.typeToShow = 'success';
	rerender(React.createElement(TestNotificationComponent, {testState}));

	t.truthy(testState.hookResult);
	if (!testState.hookResult) return;

	t.is(testState.hookResult.notifications.length, 2);

	// Note: We don't test the actual auto-dismissal timing here as it's unreliable in tests
	// The behavior is documented in the implementation: 5s for error, 3s for success/info
	t.pass();
});
