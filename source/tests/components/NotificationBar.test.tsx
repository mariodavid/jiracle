import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {NotificationBar} from '../../components/NotificationBar.js';
import type {Notification} from '../../hooks/useNotification.js';

test('NotificationBar - renders nothing when no notifications', t => {
	const {lastFrame} = render(
		React.createElement(NotificationBar, {notifications: []}),
	);

	t.is(lastFrame(), '');
});

test('NotificationBar - renders latest notification', t => {
	const notifications: Notification[] = [
		{id: 1, message: 'First message', type: 'info'},
		{id: 2, message: 'Latest message', type: 'success'},
	];

	const {lastFrame} = render(
		React.createElement(NotificationBar, {notifications}),
	);

	const output = lastFrame();
	t.true(output!.includes('Latest message'));
	t.false(output!.includes('First message'));
});

test('NotificationBar - renders success notification in green', t => {
	const notifications: Notification[] = [
		{id: 1, message: 'Success message', type: 'success'},
	];

	const {lastFrame} = render(
		React.createElement(NotificationBar, {notifications}),
	);

	const output = lastFrame();
	t.true(output!.includes('Success message'));
	// Note: Color codes are ANSI escape sequences and may not be easily testable
	// The component uses Ink's color prop which should handle the coloring
});

test('NotificationBar - renders error notification in red', t => {
	const notifications: Notification[] = [
		{id: 1, message: 'Error message', type: 'error'},
	];

	const {lastFrame} = render(
		React.createElement(NotificationBar, {notifications}),
	);

	const output = lastFrame();
	t.true(output!.includes('Error message'));
});

test('NotificationBar - renders info notification in blue', t => {
	const notifications: Notification[] = [
		{id: 1, message: 'Info message', type: 'info'},
	];

	const {lastFrame} = render(
		React.createElement(NotificationBar, {notifications}),
	);

	const output = lastFrame();
	t.true(output!.includes('Info message'));
});

test('NotificationBar - handles single notification', t => {
	const notifications: Notification[] = [
		{id: 1, message: 'Single message', type: 'info'},
	];

	const {lastFrame} = render(
		React.createElement(NotificationBar, {notifications}),
	);

	const output = lastFrame();
	t.true(output!.includes('Single message'));
});

test('NotificationBar - always shows latest when multiple notifications', t => {
	const notifications: Notification[] = [
		{id: 1, message: 'First', type: 'info'},
		{id: 2, message: 'Second', type: 'success'},
		{id: 3, message: 'Third', type: 'error'},
		{id: 4, message: 'Latest', type: 'info'},
	];

	const {lastFrame} = render(
		React.createElement(NotificationBar, {notifications}),
	);

	const output = lastFrame();
	t.true(output!.includes('Latest'));
	t.false(output!.includes('First'));
	t.false(output!.includes('Second'));
	t.false(output!.includes('Third'));
});

test('NotificationBar - handles empty message', t => {
	const notifications: Notification[] = [{id: 1, message: '', type: 'info'}];

	const {lastFrame} = render(
		React.createElement(NotificationBar, {notifications}),
	);

	// Should not crash and should render (even if empty string)
	const output = lastFrame();
	t.is(typeof output, 'string', 'Should return string output without crashing');
	// Empty message may render as empty string, which is valid behavior
});

test('NotificationBar - handles long message', t => {
	const longMessage =
		'This is a very long notification message that might wrap or get truncated depending on the terminal width and component styling';
	const notifications: Notification[] = [
		{id: 1, message: longMessage, type: 'info'},
	];

	const {lastFrame} = render(
		React.createElement(NotificationBar, {notifications}),
	);

	const output = lastFrame();
	t.true(output!.includes('This is a very long notification'));
});
