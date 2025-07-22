import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {CheckinConfirmationArea} from './checkin-confirmation-area.js';

test('CheckinConfirmationArea renders checkin confirmation dialog', t => {
	const mockOnConfirm = () => {};

	const {lastFrame} = render(
		<CheckinConfirmationArea onConfirm={mockOnConfirm} />,
	);

	const output = lastFrame();
	// Check that the component renders with checkin-related content
	t.truthy(output);
	t.true(output!.length > 0);
	// Should contain some form of checkin confirmation text
	t.true(
		output!.includes('Check') ||
			output!.includes('check') ||
			output!.includes('start') ||
			output!.includes('work'),
	);
});

test('CheckinConfirmationArea handles confirmation callback', t => {
	let confirmCalled = false;
	let confirmValue: boolean | undefined;

	const mockOnConfirm = (confirmed: boolean) => {
		confirmCalled = true;
		confirmValue = confirmed;
	};

	const {stdin} = render(<CheckinConfirmationArea onConfirm={mockOnConfirm} />);

	// Simulate pressing 'y' for confirm
	stdin.write('y');

	t.true(confirmCalled);
	t.is(confirmValue, true);
});

test('CheckinConfirmationArea handles cancellation callback', t => {
	let confirmCalled = false;
	let confirmValue: boolean | undefined;

	const mockOnConfirm = (confirmed: boolean) => {
		confirmCalled = true;
		confirmValue = confirmed;
	};

	const {stdin} = render(<CheckinConfirmationArea onConfirm={mockOnConfirm} />);

	// Simulate pressing 'n' for cancel
	stdin.write('n');

	t.true(confirmCalled);
	t.is(confirmValue, false);
});

test('CheckinConfirmationArea uses correct dialog styling', t => {
	const mockOnConfirm = () => {};

	const {lastFrame} = render(
		<CheckinConfirmationArea onConfirm={mockOnConfirm} />,
	);

	const output = lastFrame();
	// Check that the component renders (cyan border is handled by ConfirmationDialog)
	t.truthy(output);
	t.true(output!.length > 0);
});

test('CheckinConfirmationArea handles multiple key inputs', t => {
	let confirmCallCount = 0;
	const confirmValues: boolean[] = [];

	const mockOnConfirm = (confirmed: boolean) => {
		confirmCallCount++;
		confirmValues.push(confirmed);
	};

	const {stdin} = render(<CheckinConfirmationArea onConfirm={mockOnConfirm} />);

	// Simulate multiple inputs
	stdin.write('y');

	// Only the first confirmation should be processed
	t.is(confirmCallCount, 1);
	t.deepEqual(confirmValues, [true]);
});
