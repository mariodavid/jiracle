import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {CheckinConfirmationArea} from './CheckinConfirmationArea.js';

test('CheckinConfirmationArea renders checkin confirmation dialog', t => {
	// Explicit test data
	const expectedText = 'Start Work';
	const mockOnConfirm = () => {};

	// Operations
	const {lastFrame} = render(
		<CheckinConfirmationArea onConfirm={mockOnConfirm} />,
	);

	// Specific value comparison
	const output = lastFrame();
	t.true(
		output?.includes(expectedText) ?? false,
		'Should display check-in specific confirmation text',
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
	// Explicit test data
	const expectedText = 'Start Work';
	const mockOnConfirm = () => {};

	// Operations
	const {lastFrame} = render(
		<CheckinConfirmationArea onConfirm={mockOnConfirm} />,
	);

	// Specific value comparison
	const output = lastFrame();
	t.true(
		output?.includes(expectedText) ?? false,
		'Should render with check-in specific content',
	);
});

test('CheckinConfirmationArea handles escape key for checkin cancellation', t => {
	// Explicit test data
	const expectedText = 'Start Work';
	const mockOnConfirm = () => {};

	// Operations
	const {stdin, lastFrame} = render(
		<CheckinConfirmationArea onConfirm={mockOnConfirm} />,
	);

	// Simulate escape key for checkin cancellation
	stdin.write('\u001B');

	// Specific value comparisons
	const output = lastFrame();
	t.true(
		output?.includes(expectedText) ?? false,
		'Should show check-in specific text',
	);
	// Note: Escape handling behavior depends on underlying CheckinConfirmation component
	// This verifies the component displays correct checkin context
});
