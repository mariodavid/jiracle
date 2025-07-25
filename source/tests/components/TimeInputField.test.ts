import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import TimeInputField from '../../components/TimeInputField.js';

const defaultProps = {
	value: '08:00',
	onChange() {},
	onSubmit() {},
};

test('TimeInputField renders with initial value', t => {
	// 1. EXPLICIT TEST DATA
	const expectedValue = '09:15';
	const expectedProps = {
		...defaultProps,
		value: expectedValue,
	};

	// 2. OPERATIONS
	const {lastFrame} = render(
		React.createElement(TimeInputField, expectedProps),
	);
	const output = lastFrame() ?? '';

	// 3. SPECIFIC VALUE COMPARISONS
	t.true(
		output.includes(expectedValue),
		`Should display time value ${expectedValue}`,
	);
	// Component renders the time value with newlines (starts selected, no cursor)
	t.is(
		output.trim(),
		expectedValue,
		'Should render exactly the time value when selected',
	);
});

test('TimeInputField renders in compact mode', t => {
	const {lastFrame} = render(
		React.createElement(TimeInputField, {
			...defaultProps,
			value: '10:30',
			compact: true,
		}),
	);

	const output = lastFrame() ?? '';
	t.true(output.includes('10:30'));
	// Should not include help text in compact mode
	t.false(output.includes('Type time'));
});

test('TimeInputField calls onChange when typing', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(TimeInputField, {
			...defaultProps,
			value: '08:00',
			onChange,
			compact: true,
		}),
	);

	// Type "9" to replace selected text
	stdin.write('9');

	t.is(changedValue, '9');
});

test('TimeInputField handles arrow key navigation with default increment', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(TimeInputField, {
			...defaultProps,
			value: '08:00',
			onChange,
			compact: true,
		}),
	);

	// Press up arrow - should increment by 15 minutes (default)
	stdin.write('\u001B[A'); // Up arrow

	t.is(changedValue, '08:15');
});

test('TimeInputField handles configurable increment', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(TimeInputField, {
			...defaultProps,
			value: '08:00',
			onChange,
			compact: true,
			incrementMinutes: 30,
		}),
	);

	// Press up arrow - should increment by 30 minutes
	stdin.write('\u001B[A'); // Up arrow

	t.is(changedValue, '08:30');
});

test('TimeInputField normalizes single digit hour input', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = render(
		React.createElement(TimeInputField, {
			...defaultProps,
			value: '08:00',
			onSubmit,
			compact: true,
		}),
	);

	// Type "8:30" and press Enter - should normalize to "08:30"
	stdin.write('8');
	stdin.write(':');
	stdin.write('3');
	stdin.write('0');
	stdin.write('\r');

	t.is(submittedValue, '08:30');
});

test('TimeInputField validates time input', t => {
	const changedValues: string[] = [];
	const onChange = (value: string) => {
		changedValues.push(value);
	};

	const {stdin} = render(
		React.createElement(TimeInputField, {
			...defaultProps,
			value: '08:00',
			onChange,
			compact: true,
		}),
	);

	// Type "25:70" - should reject invalid hours/minutes
	stdin.write('2');
	stdin.write('5'); // Invalid hour > 23
	stdin.write(':');
	stdin.write('7');
	stdin.write('0'); // Invalid minutes > 59

	// Should only accept valid parts
	const finalValue = changedValues[changedValues.length - 1] ?? '';
	t.false(finalValue.includes('25'));
	t.false(finalValue.includes('70'));
});

test('TimeInputField accepts valid time formats', t => {
	const validInputs = ['8:30', '08:30', '15:45', '23:59'];

	for (const input of validInputs) {
		let submittedValue = '';
		const onSubmit = (value: string) => {
			submittedValue = value;
		};

		const {stdin} = render(
			React.createElement(TimeInputField, {
				...defaultProps,
				value: '08:00',
				onSubmit,
				compact: true,
			}),
		);

		// Type each character and submit
		for (const char of input) {
			stdin.write(char);
		}

		stdin.write('\r');

		// Should normalize to HH:MM format
		const expected = input.padStart(5, '0').replace(/^(\d):/, '0$1:');
		t.is(submittedValue, expected, `Should accept and normalize: ${input}`);
	}
});
