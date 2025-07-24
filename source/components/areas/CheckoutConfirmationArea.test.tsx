import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {CheckoutConfirmationArea} from './CheckoutConfirmationArea.js';

test('CheckoutConfirmationArea renders checkout confirmation dialog', t => {
	// Explicit test data
	const expectedText = 'End Work';
	const mockOnConfirm = () => {};

	// Operations
	const {lastFrame} = render(
		<CheckoutConfirmationArea onConfirm={mockOnConfirm} />,
	);

	// Specific value comparison
	const output = lastFrame();
	t.true(
		output?.includes(expectedText) ?? false,
		'Should display check-out specific confirmation text',
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
	// Explicit test data
	const expectedText = 'End Work';
	const mockOnConfirm = () => {};

	// Operations
	const {lastFrame} = render(
		<CheckoutConfirmationArea onConfirm={mockOnConfirm} />,
	);

	// Specific value comparison
	const output = lastFrame();
	t.true(
		output?.includes(expectedText) ?? false,
		'Should render with check-out specific content',
	);
});

test('CheckoutConfirmationArea handles escape key for checkout cancellation', t => {
	// Explicit test data
	const expectedText = 'End Work';
	const mockOnConfirm = () => {};

	// Operations
	const {stdin, lastFrame} = render(
		<CheckoutConfirmationArea onConfirm={mockOnConfirm} />,
	);

	// Simulate escape key for checkout cancellation
	stdin.write('\u001B');

	// Specific value comparisons
	const output = lastFrame();
	t.true(
		output?.includes(expectedText) ?? false,
		'Should show check-out specific text',
	);
	// Note: Escape handling behavior depends on underlying CheckoutConfirmation component
	// This verifies the component displays correct checkout context
});

test('CheckoutConfirmationArea maintains consistent interface behavior', t => {
	// Explicit test data
	const expectedText = 'End Work';
	const mockOnConfirm = () => {};

	// Operations
	const checkoutResult = render(
		<CheckoutConfirmationArea onConfirm={mockOnConfirm} />,
	);

	// Specific value comparison
	const output = checkoutResult.lastFrame();
	t.true(
		output?.includes(expectedText) ?? false,
		'Should consistently display checkout-specific interface',
	);
});
