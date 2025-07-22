import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {Confirmation} from '../../components/confirmation.js';

test('Confirmation renders with message only', t => {
	const {lastFrame} = render(
		React.createElement(Confirmation, {
			message: 'Are you sure you want to proceed?',
			onConfirm() {},
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('Are you sure you want to proceed?'));
});

test('Confirmation renders with title and message', t => {
	const {lastFrame} = render(
		React.createElement(Confirmation, {
			title: 'Confirmation Required',
			message: 'Are you sure you want to proceed?',
			onConfirm() {},
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('Confirmation Required'));
	t.true(output.includes('Are you sure you want to proceed?'));
});

test('Confirmation calls onConfirm with true when confirmed', t => {
	let confirmedValue: boolean | undefined;
	const onConfirm = (confirmed: boolean) => {
		confirmedValue = confirmed;
	};

	const {stdin} = render(
		React.createElement(Confirmation, {
			message: 'Are you sure?',
			onConfirm,
		}),
	);

	// Simulate 'y' key press to confirm
	stdin.write('y');

	t.is(confirmedValue, true);
});

test('Confirmation calls onConfirm with false when cancelled', t => {
	let confirmedValue: boolean | undefined;
	const onConfirm = (confirmed: boolean) => {
		confirmedValue = confirmed;
	};

	const {stdin} = render(
		React.createElement(Confirmation, {
			message: 'Are you sure?',
			onConfirm,
		}),
	);

	// Simulate 'n' key press to cancel
	stdin.write('n');

	t.is(confirmedValue, false);
});

test('Confirmation displays proper structure without title', t => {
	const {lastFrame} = render(
		React.createElement(Confirmation, {
			message: 'Delete this item?',
			onConfirm() {},
		}),
	);

	const output = lastFrame() || '';

	// Should contain the message
	t.true(output.includes('Delete this item?'));

	// Should contain confirmation UI elements
	t.true(output.length > 0);
});

test('Confirmation displays proper structure with title', t => {
	const {lastFrame} = render(
		React.createElement(Confirmation, {
			title: 'Warning',
			message: 'This action cannot be undone.',
			onConfirm() {},
		}),
	);

	const output = lastFrame() || '';

	// Should contain both title and message
	t.true(output.includes('Warning'));
	t.true(output.includes('This action cannot be undone.'));
	t.true(output.length > 0);
});
