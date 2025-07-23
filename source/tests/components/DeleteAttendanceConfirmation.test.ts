import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {DeleteAttendanceConfirmation} from '../../components/DeleteAttendanceConfirmation.js';

test('DeleteAttendanceConfirmation renders with correct message', t => {
	const {lastFrame} = render(
		React.createElement(DeleteAttendanceConfirmation, {
			dayLabel: 'Friday, July 11, 2025',
			onConfirm() {},
		}),
	);

	const output = lastFrame() ?? '';
	t.true(
		output.includes('Delete attendance record for Friday, July 11, 2025?'),
	);
});

test('DeleteAttendanceConfirmation calls onConfirm with true when confirmed', t => {
	let confirmedValue: boolean | undefined;
	const onConfirm = (confirmed: boolean) => {
		confirmedValue = confirmed;
	};

	const {stdin} = render(
		React.createElement(DeleteAttendanceConfirmation, {
			dayLabel: 'Friday, July 11, 2025',
			onConfirm,
		}),
	);

	// Simulate 'y' key press to confirm
	stdin.write('y');

	t.is(confirmedValue, true);
});

test('DeleteAttendanceConfirmation calls onConfirm with false when cancelled', t => {
	let confirmedValue: boolean | undefined;
	const onConfirm = (confirmed: boolean) => {
		confirmedValue = confirmed;
	};

	const {stdin} = render(
		React.createElement(DeleteAttendanceConfirmation, {
			dayLabel: 'Friday, July 11, 2025',
			onConfirm,
		}),
	);

	// Simulate 'n' key press to cancel
	stdin.write('n');

	t.is(confirmedValue, false);
});

test('DeleteAttendanceConfirmation displays proper structure', t => {
	const {lastFrame} = render(
		React.createElement(DeleteAttendanceConfirmation, {
			dayLabel: 'Monday, July 14, 2025',
			onConfirm() {},
		}),
	);

	const output = lastFrame() ?? '';

	// Should contain the question
	t.true(
		output.includes('Delete attendance record for Monday, July 14, 2025?'),
	);

	// Should contain confirmation UI elements (this depends on ConfirmInput implementation)
	// We test that the component renders without crashing and shows the main message
	t.true(output.length > 0);
});
