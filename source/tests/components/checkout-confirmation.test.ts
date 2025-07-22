import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {CheckoutConfirmation} from '../../components/checkout-confirmation.js';

test('CheckoutConfirmation renders with correct title', t => {
	const onConfirm = () => {};
	const {lastFrame} = render(
		React.createElement(CheckoutConfirmation, {onConfirm}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('End Work'));
	t.true(output.includes('Do you want to check out and end work for today?'));
});

test('CheckoutConfirmation displays correct structure', t => {
	const onConfirm = () => {};
	const {lastFrame} = render(
		React.createElement(CheckoutConfirmation, {onConfirm}),
	);

	const output = lastFrame() || '';
	// Should show Y/n confirmation input
	t.true(output.includes('Y/n'));
});

test('CheckoutConfirmation calls onConfirm with true when confirmed', t => {
	let confirmedValue: boolean | undefined;
	const onConfirm = (confirmed: boolean) => {
		confirmedValue = confirmed;
	};

	const {stdin} = render(
		React.createElement(CheckoutConfirmation, {onConfirm}),
	);

	// Simulate Enter key (should confirm due to submitOnEnter=true)
	stdin.write('\r');

	t.is(confirmedValue, true);
});

test('CheckoutConfirmation calls onConfirm with false when cancelled', t => {
	let confirmedValue: boolean | undefined;
	const onConfirm = (confirmed: boolean) => {
		confirmedValue = confirmed;
	};

	const {stdin} = render(
		React.createElement(CheckoutConfirmation, {onConfirm}),
	);

	// Simulate 'n' key (should cancel)
	stdin.write('n');

	t.is(confirmedValue, false);
});

test('CheckoutConfirmation has proper title styling', t => {
	const onConfirm = () => {};
	const {lastFrame} = render(
		React.createElement(CheckoutConfirmation, {onConfirm}),
	);

	const output = lastFrame() || '';
	// The title "End Work" should be present (styling can't be easily tested in unit tests)
	t.true(output.includes('End Work'));
});
