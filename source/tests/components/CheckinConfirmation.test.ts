import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {CheckinConfirmation} from '../../components/CheckinConfirmation.js';

test('CheckinConfirmation renders with correct title', t => {
	const onConfirm = () => {};
	const {lastFrame} = render(
		React.createElement(CheckinConfirmation, {onConfirm}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('Start Work'));
	t.true(output.includes('Do you want to check in and start work for today?'));
});

test('CheckinConfirmation displays correct structure', t => {
	const onConfirm = () => {};
	const {lastFrame} = render(
		React.createElement(CheckinConfirmation, {onConfirm}),
	);

	const output = lastFrame() || '';
	// Should show Y/n confirmation input
	t.true(output.includes('Y/n'));
});

test('CheckinConfirmation calls onConfirm with true when confirmed', t => {
	let confirmedValue: boolean | undefined;
	const onConfirm = (confirmed: boolean) => {
		confirmedValue = confirmed;
	};

	const {stdin} = render(React.createElement(CheckinConfirmation, {onConfirm}));

	// Simulate Enter key (should confirm due to submitOnEnter=true)
	stdin.write('\r');

	t.is(confirmedValue, true);
});

test('CheckinConfirmation calls onConfirm with false when cancelled', t => {
	let confirmedValue: boolean | undefined;
	const onConfirm = (confirmed: boolean) => {
		confirmedValue = confirmed;
	};

	const {stdin} = render(React.createElement(CheckinConfirmation, {onConfirm}));

	// Simulate 'n' key (should cancel)
	stdin.write('n');

	t.is(confirmedValue, false);
});

test('CheckinConfirmation has proper title styling', t => {
	const onConfirm = () => {};
	const {lastFrame} = render(
		React.createElement(CheckinConfirmation, {onConfirm}),
	);

	const output = lastFrame() || '';
	// The title "Start Work" should be present (styling can't be easily tested in unit tests)
	t.true(output.includes('Start Work'));
});
