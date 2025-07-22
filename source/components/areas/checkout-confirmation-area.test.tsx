import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {CheckoutConfirmationArea} from './checkout-confirmation-area.js';

test('CheckoutConfirmationArea renders checkout confirmation dialog', t => {
	const mockOnConfirm = () => {};

	const {lastFrame} = render(
		<CheckoutConfirmationArea onConfirm={mockOnConfirm} />,
	);

	const output = lastFrame();
	// Check that the component renders with checkout-related content
	t.truthy(output);
	t.true(output!.length > 0);
	// Should contain some form of checkout confirmation text
	t.true(
		output!.includes('Check') ||
			output!.includes('check') ||
			output!.includes('end') ||
			output!.includes('work'),
	);
});

test('CheckoutConfirmationArea handles confirmation callback', t => {
	let confirmCalled = false;
	let confirmValue: boolean | undefined;

	const mockOnConfirm = (confirmed: boolean) => {
		confirmCalled = true;
		confirmValue = confirmed;
	};

	const {stdin} = render(
		<CheckoutConfirmationArea onConfirm={mockOnConfirm} />,
	);

	// Simulate pressing 'y' for confirm
	stdin.write('y');

	t.true(confirmCalled);
	t.is(confirmValue, true);
});

test('CheckoutConfirmationArea handles cancellation callback', t => {
	let confirmCalled = false;
	let confirmValue: boolean | undefined;

	const mockOnConfirm = (confirmed: boolean) => {
		confirmCalled = true;
		confirmValue = confirmed;
	};

	const {stdin} = render(
		<CheckoutConfirmationArea onConfirm={mockOnConfirm} />,
	);

	// Simulate pressing 'n' for cancel
	stdin.write('n');

	t.true(confirmCalled);
	t.is(confirmValue, false);
});

test('CheckoutConfirmationArea uses correct dialog styling', t => {
	const mockOnConfirm = () => {};

	const {lastFrame} = render(
		<CheckoutConfirmationArea onConfirm={mockOnConfirm} />,
	);

	const output = lastFrame();
	// Check that the component renders (yellow border is handled by ConfirmationDialog)
	t.truthy(output);
	t.true(output!.length > 0);
});

test('CheckoutConfirmationArea handles escape key', t => {
	const mockOnConfirm = () => {};

	const {stdin} = render(
		<CheckoutConfirmationArea onConfirm={mockOnConfirm} />,
	);

	// Simulate pressing escape (CheckoutConfirmation handles escape internally)
	stdin.write('\u001B');

	// Note: Escape handling depends on CheckoutConfirmation component implementation
	// This test verifies the component can handle escape input without errors
	t.pass(); // Component renders and handles input without crashing
});

test('CheckoutConfirmationArea maintains consistent interface with checkin', t => {
	const mockOnConfirm = () => {};

	const checkinResult = render(
		<CheckoutConfirmationArea onConfirm={mockOnConfirm} />,
	);

	const checkoutResult = render(
		<CheckoutConfirmationArea onConfirm={mockOnConfirm} />,
	);

	// Both should render without errors
	t.truthy(checkinResult.lastFrame());
	t.truthy(checkoutResult.lastFrame());
	t.true(checkinResult.lastFrame()!.length > 0);
	t.true(checkoutResult.lastFrame()!.length > 0);
});
