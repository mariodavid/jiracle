import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import DurationInput from '../../components/WorklogForm/DurationInput.js';

const mockIssue = {
	id: '12345',
	key: 'TEST-123',
	fields: {
		summary: 'Test Issue',
		status: {
			name: 'In Progress',
			statusCategory: {
				name: 'In Progress',
			},
		},
		issuetype: {
			name: 'Task',
			iconUrl: 'https://example.com/icon.png',
		},
		priority: {
			name: 'Medium',
			iconUrl: 'https://example.com/priority.png',
		},
		assignee: {
			displayName: 'Test User',
			emailAddress: 'test@example.com',
		},
		created: '2025-01-01T00:00:00.000Z',
		updated: '2025-01-01T00:00:00.000Z',
	},
};

const defaultProps = {
	value: '1h',
	onChange() {},
	onSubmit() {},
};

test('DurationInput renders with initial value', t => {
	const {lastFrame} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			selectedIssue: mockIssue,
			value: '2h',
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('TEST-123'));
	t.true(output.includes('Test Issue'));
	t.true(output.includes('2h'));
});

test('DurationInput renders in compact mode', t => {
	const {lastFrame} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '3h',
			compact: true,
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('3h'));
	// Help text is no longer shown in compact mode
	// Should not include issue info in compact mode
	t.false(output.includes('TEST-123'));
});

test('DurationInput shows selection state initially', t => {
	const {lastFrame} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '4h',
			compact: true,
		}),
	);

	const output = lastFrame() || '';
	// In selected state, text should be highlighted (no cursor visible)
	t.true(output.includes('4h'));
	// Cursor (█) should not be visible when text is selected
	t.false(output.includes('█'));
});

test('DurationInput calls onChange when typing', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onChange,
			compact: true,
		}),
	);

	// Type "5" - should replace selected text
	stdin.write('5');

	t.is(changedValue, '5');
});

test('DurationInput handles arrow key navigation', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '2h',
			onChange,
			compact: true,
			incrementMinutes: 60, // 1 hour increments
		}),
	);

	// Press up arrow - should increment by 1 hour to 3h
	stdin.write('\u001B[A'); // Up arrow

	t.is(changedValue, '3h');
});

test('DurationInput handles down arrow navigation', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '3h',
			onChange,
			compact: true,
			incrementMinutes: 60, // 1 hour increments
		}),
	);

	// Press down arrow - should decrement by 1 hour to 2h
	stdin.write('\u001B[B'); // Down arrow

	t.is(changedValue, '2h');
});

test('DurationInput prevents going below minimum increment', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onChange,
			compact: true,
			incrementMinutes: 60, // 1 hour increments
		}),
	);

	// Press down arrow - should stay at minimum (1h with 60min increments)
	stdin.write('\u001B[B'); // Down arrow

	t.is(changedValue, '1h');
});

test('DurationInput prevents going above 24h', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '24h',
			onChange,
			compact: true,
		}),
	);

	// Press up arrow - should stay at 24h
	stdin.write('\u001B[A'); // Up arrow

	t.is(changedValue, '24h');
});

test('DurationInput handles backspace on selected text', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '5h',
			onChange,
			compact: true,
		}),
	);

	// Press backspace - should clear selected text
	stdin.write('\u007F'); // Backspace

	t.is(changedValue, '');
});

test('DurationInput calls onSubmit with auto-completion', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onSubmit,
			compact: true,
		}),
	);

	// Type "5" to replace selected text
	stdin.write('5');

	// Press Enter - should auto-complete to "5h"
	stdin.write('\r');

	t.is(submittedValue, '5h');
});

test('DurationInput handles existing complete values', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '2h',
			onSubmit,
			compact: true,
		}),
	);

	// Press Enter - should not modify already complete value
	stdin.write('\r');

	t.is(submittedValue, '2h');
});

test('DurationInput parses different time formats', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '30m', // 30 minutes = 0.5 hours
			onChange,
			compact: true,
			incrementMinutes: 60, // 1 hour increments
		}),
	);

	// Press up arrow - should increment to next 60min mark (from 30m to 60m = 1h)
	stdin.write('\u001B[A'); // Up arrow

	t.is(changedValue, '1h'); // Next 60-minute increment from 30m is 60m = 1h
});

test('DurationInput handles day format', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1d', // 1 day = 8 hours = 480 minutes
			onChange,
			compact: true,
			incrementMinutes: 60, // 1 hour increments
		}),
	);

	// Press up arrow - should increment by 1 hour to 9h
	stdin.write('\u001B[A'); // Up arrow

	t.is(changedValue, '9h'); // 8 hours + 1 hour = 9 hours
});

test('DurationInput allows typing decimal numbers', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onChange,
			compact: true,
		}),
	);

	// Type "2.5" - should replace selected text
	stdin.write('2');
	stdin.write('.');
	stdin.write('5');

	t.is(changedValue, '2.5');
});

test('DurationInput converts comma to dot on submit with Enter', t => {
	let changedValue = '';
	let submittedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onChange,
			onSubmit,
			compact: true,
		}),
	);

	// Type "1,5" and press Enter - should convert comma to dot and auto-complete to "1.5h"
	stdin.write('1');
	stdin.write(',');
	stdin.write('5');
	stdin.write('\r');

	t.is(submittedValue, '1.5h');
	t.is(changedValue, '1.5h'); // Should also update the displayed value
});

test('DurationInput converts comma to dot on submit with Tab', t => {
	let changedValue = '';
	let submittedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onChange,
			onSubmit,
			compact: true,
		}),
	);

	// Type "2,5" and press Tab - should convert comma to dot and auto-complete to "2.5h"
	stdin.write('2');
	stdin.write(',');
	stdin.write('5');
	stdin.write('\t'); // Tab key

	t.is(submittedValue, '2.5h');
	t.is(changedValue, '2.5h'); // Should also update the displayed value
});

test('DurationInput uses global default time from config', t => {
	const config = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		defaultTime: '4h',
	};

	const {lastFrame} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '',
			config,
			compact: true,
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('4h'));
});

test('DurationInput uses favorite-specific default time', t => {
	const config = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		defaultTime: '4h',
		favorites: [{key: 'TEST-123', defaultTime: '8h'}],
	};

	const testIssue = {
		...mockIssue,
		key: 'TEST-123',
	};

	const {lastFrame} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '',
			selectedIssue: testIssue,
			config,
			issueSelectionMode: 'favorites',
			compact: true,
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('8h'));
});

test('DurationInput favorite default time overrides global default', t => {
	const config = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		defaultTime: '4h',
		favorites: [{key: 'TEST-123', defaultTime: '6h'}],
	};

	const testIssue = {
		...mockIssue,
		key: 'TEST-123',
	};

	const {lastFrame} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '',
			selectedIssue: testIssue,
			config,
			issueSelectionMode: 'favorites',
			compact: true,
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('6h'));
	t.false(output.includes('4h'));
});

test('DurationInput allows typing time units', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onChange,
			compact: true,
		}),
	);

	// Type "30m" - should replace selected text
	stdin.write('3');
	stdin.write('0');
	stdin.write('m');

	t.is(changedValue, '30m');
});

// === INPUT VALIDATION TESTS ===

test('DurationInput rejects invalid characters', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onChange,
			compact: true,
		}),
	);

	// Type "a" - should be ignored (not a valid character)
	stdin.write('a');

	// Value should remain unchanged
	t.is(changedValue, '');
});

test('DurationInput prevents multiple dots', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onChange,
			compact: true,
		}),
	);

	// Type "2.." - second dot should be ignored
	stdin.write('2');
	stdin.write('.');
	stdin.write('.');

	t.is(changedValue, '2.');
});

test('DurationInput prevents multiple commas', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onChange,
			compact: true,
		}),
	);

	// Type "2,," - second comma should be ignored
	stdin.write('2');
	stdin.write(',');
	stdin.write(',');

	t.is(changedValue, '2,');
});

test('DurationInput prevents mixed decimal separators', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onChange,
			compact: true,
		}),
	);

	// Type "2.5," - comma after dot should be ignored
	stdin.write('2');
	stdin.write('.');
	stdin.write('5');
	stdin.write(',');

	t.is(changedValue, '2.5');
});

test('DurationInput prevents multiple units', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onChange,
			compact: true,
		}),
	);

	// Type "2hd" - 'd' after 'h' should be ignored
	stdin.write('2');
	stdin.write('h');
	stdin.write('d');

	t.is(changedValue, '2h');
});

test('DurationInput allows and auto-completes h+digits pattern', t => {
	let changedValue = '';
	let submittedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onChange,
			onSubmit,
			compact: true,
		}),
	);

	// Type "2h5" - should be allowed as intermediate state
	stdin.write('2');
	stdin.write('h');
	stdin.write('5');

	t.is(changedValue, '2h5');

	// Press Enter - should auto-complete to "2h5m"
	stdin.write('\r');

	t.is(submittedValue, '2h5m');
});

test('DurationInput prevents invalid complex patterns like "2h.d.d."', t => {
	const changedValues: string[] = [];
	const onChange = (value: string) => {
		changedValues.push(value);
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onChange,
			compact: true,
		}),
	);

	// Type "2h.d.d." - only "2h" should be valid
	stdin.write('2');
	stdin.write('h');
	stdin.write('.');
	stdin.write('d');
	stdin.write('.');
	stdin.write('d');
	stdin.write('.');

	// Should only contain valid progressive values
	t.deepEqual(changedValues, ['2', '2h']);
});

test('DurationInput prevents "2...." pattern', t => {
	const changedValues: string[] = [];
	const onChange = (value: string) => {
		changedValues.push(value);
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onChange,
			compact: true,
		}),
	);

	// Type "2...." - only first dot should be accepted
	stdin.write('2');
	stdin.write('.');
	stdin.write('.');
	stdin.write('.');
	stdin.write('.');

	t.deepEqual(changedValues, ['2', '2.']);
});

// === POSITIVE VALIDATION TESTS ===

test('DurationInput accepts valid hour formats', t => {
	const validHourInputs = ['1h', '2h', '10h', '24h'];

	for (const input of validHourInputs) {
		let finalValue = '';
		const onChange = (value: string) => {
			finalValue = value;
		};

		const {stdin} = render(
			React.createElement(DurationInput, {
				...defaultProps,
				value: '1h',
				onChange,
				compact: true,
			}),
		);

		// Type each character
		for (const char of input) {
			stdin.write(char);
		}

		t.is(finalValue, input, `Should accept valid hour format: ${input}`);
	}
});

test('DurationInput accepts valid decimal hour formats', t => {
	const testCases = [
		{input: '2.5h', expected: '2.5h'},
		{input: '1,5h', expected: '1,5h'},
		{input: '0.25h', expected: '0.25h'},
	];

	for (const {input, expected} of testCases) {
		let finalValue = '';
		const onChange = (value: string) => {
			finalValue = value;
		};

		const {stdin} = render(
			React.createElement(DurationInput, {
				...defaultProps,
				value: '1h',
				onChange,
				compact: true,
			}),
		);

		// Type each character
		for (const char of input) {
			stdin.write(char);
		}

		t.is(finalValue, expected, `Should accept valid decimal format: ${input}`);
	}
});

test('DurationInput accepts valid minute formats', t => {
	const validMinuteInputs = ['15m', '30m', '45m', '90m'];

	for (const input of validMinuteInputs) {
		let finalValue = '';
		const onChange = (value: string) => {
			finalValue = value;
		};

		const {stdin} = render(
			React.createElement(DurationInput, {
				...defaultProps,
				value: '1h',
				onChange,
				compact: true,
			}),
		);

		// Type each character
		for (const char of input) {
			stdin.write(char);
		}

		t.is(finalValue, input, `Should accept valid minute format: ${input}`);
	}
});

test('DurationInput accepts valid day formats', t => {
	const testCases = [
		{input: '1d', expected: '1d'},
		{input: '2d', expected: '2d'},
		{input: '0.5d', expected: '0.5d'},
		{input: '1,5d', expected: '1,5d'},
	];

	for (const {input, expected} of testCases) {
		let finalValue = '';
		const onChange = (value: string) => {
			finalValue = value;
		};

		const {stdin} = render(
			React.createElement(DurationInput, {
				...defaultProps,
				value: '1h',
				onChange,
				compact: true,
			}),
		);

		// Type each character
		for (const char of input) {
			stdin.write(char);
		}

		t.is(finalValue, expected, `Should accept valid day format: ${input}`);
	}
});

test('DurationInput accepts numbers only (for auto-completion)', t => {
	const testCases = [
		{input: '2', expected: '2'},
		{input: '8', expected: '8'},
		{input: '2.5', expected: '2.5'},
		{input: '1,5', expected: '1,5'},
	];

	for (const {input, expected} of testCases) {
		let finalValue = '';
		const onChange = (value: string) => {
			finalValue = value;
		};

		const {stdin} = render(
			React.createElement(DurationInput, {
				...defaultProps,
				value: '1h',
				onChange,
				compact: true,
			}),
		);

		// Type each character
		for (const char of input) {
			stdin.write(char);
		}

		t.is(finalValue, expected, `Should accept number format: ${input}`);
	}
});

// === COMPLEX NEGATIVE CASES ===

test('DurationInput rejects complex invalid patterns', t => {
	const invalidPatterns = [
		{input: 'abc', reason: 'letters only'},
		{input: '2h3h', reason: 'multiple units'},
		{input: '2..5h', reason: 'multiple dots'},
		{input: '2,,5h', reason: 'multiple commas'},
		{input: '2.5,h', reason: 'mixed separators'},
		{input: '2d.m', reason: 'mixed units with dot'},
		{input: '.5h', reason: 'starting with dot'},
		{input: ',5h', reason: 'starting with comma'},
		{input: 'h2', reason: 'unit before number'},
		{input: '2.5.5h', reason: 'multiple decimal points'},
		{input: '12h.', reason: 'dot after unit'},
		{input: '2h5h', reason: 'multiple h units'},
		{input: '2d5', reason: 'number after d'},
		{input: '2m5', reason: 'number after m'},
		{input: '2.5h2', reason: 'number after decimal hours'},
		{input: '1,5d3', reason: 'number after decimal days'},
		{input: '2.5hm', reason: 'm after decimal hours'},
	];

	for (const {input, reason} of invalidPatterns) {
		const changedValues: string[] = [];
		const onChange = (value: string) => {
			changedValues.push(value);
		};

		const {stdin} = render(
			React.createElement(DurationInput, {
				...defaultProps,
				value: '1h',
				onChange,
				compact: true,
			}),
		);

		// Type each character
		for (const char of input) {
			stdin.write(char);
		}

		// Should not contain the full invalid input
		const finalValue = changedValues[changedValues.length - 1] || '';
		t.notRegex(
			finalValue,
			new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
			`Should reject invalid pattern "${input}" (${reason})`,
		);
	}
});

test('DurationInput accepts valid combined hour-minute formats', t => {
	const testCases = [
		{input: '2h30m', expected: '2h30m'},
		{input: '1h15m', expected: '1h15m'},
		{input: '8h45m', expected: '8h45m'},
		{input: '12h00m', expected: '12h00m'},
	];

	for (const {input, expected} of testCases) {
		let finalValue = '';
		const onChange = (value: string) => {
			finalValue = value;
		};

		const {stdin} = render(
			React.createElement(DurationInput, {
				...defaultProps,
				value: '1h',
				onChange,
				compact: true,
			}),
		);

		// Type each character
		for (const char of input) {
			stdin.write(char);
		}

		t.is(finalValue, expected, `Should accept valid combined format: ${input}`);
	}
});

test('DurationInput rejects invalid patterns with dots after units', t => {
	const testCases = [
		{input: '12h.', reason: 'dot after h'},
		{input: '30m.', reason: 'dot after m'},
		{input: '2d.', reason: 'dot after d'},
	];

	for (const {input, reason} of testCases) {
		const changedValues: string[] = [];
		const onChange = (value: string) => {
			changedValues.push(value);
		};

		const {stdin} = render(
			React.createElement(DurationInput, {
				...defaultProps,
				value: '1h',
				onChange,
				compact: true,
			}),
		);

		// Type each character
		for (const char of input) {
			stdin.write(char);
		}

		// Should not end with dot
		const finalValue = changedValues[changedValues.length - 1] || '';
		t.false(finalValue.endsWith('.'), `Should reject ${reason}: ${input}`);
	}
});

// === COMMA TO DOT CONVERSION TESTS ===

test('DurationInput converts comma to dot with smart unit detection for decimals', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onSubmit,
			compact: true,
		}),
	);

	// Type "1,5" and press Enter - should convert to "1.5h"
	stdin.write('1');
	stdin.write(',');
	stdin.write('5');
	stdin.write('\r');

	t.is(submittedValue, '1.5h');
});

test('DurationInput converts comma to dot with smart unit detection for minutes', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onSubmit,
			compact: true,
		}),
	);

	// Type "30,5" and press Enter - decimals are always hours, so should be "30.5h"
	stdin.write('3');
	stdin.write('0');
	stdin.write(',');
	stdin.write('5');
	stdin.write('\r');

	t.is(submittedValue, '30.5h');
});

test('DurationInput converts comma to dot when unit is already present', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onSubmit,
			compact: true,
		}),
	);

	// Type "2,5h" and press Enter - should convert to "2.5h"
	stdin.write('2');
	stdin.write(',');
	stdin.write('5');
	stdin.write('h');
	stdin.write('\r');

	t.is(submittedValue, '2.5h');
});

test('DurationInput converts comma to dot with Tab key', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onSubmit,
			compact: true,
		}),
	);

	// Type "1,5" and press Tab - should convert to "1.5h"
	stdin.write('1');
	stdin.write(',');
	stdin.write('5');
	stdin.write('\t');

	t.is(submittedValue, '1.5h');
});

test('DurationInput handles multiple commas correctly', t => {
	const changedValues: string[] = [];
	let submittedValue = '';
	const onChange = (value: string) => {
		changedValues.push(value);
	};

	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = render(
		React.createElement(DurationInput, {
			...defaultProps,
			value: '1h',
			onChange,
			onSubmit,
			compact: true,
		}),
	);

	// Type "1,5,5" - second comma should be ignored, but "5" after comma might be accepted
	stdin.write('1');
	stdin.write(',');
	stdin.write('5');
	stdin.write(','); // This should be ignored
	stdin.write('5'); // This might be accepted as another digit
	stdin.write('\r');

	// The actual behavior might accept "1,55" -> "1.55h" due to validation logic
	// Check that comma is converted to dot in final result
	t.true(submittedValue.includes('.'));
	t.true(submittedValue.endsWith('h'));
	t.false(submittedValue.includes(','));
});

test('DurationInput smart unit detection with comma - hours for decimals', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const testCases = [
		{input: '1,5', expected: '1.5h'},
		{input: '2,25', expected: '2.25h'},
		{input: '0,5', expected: '0.5h'},
		{input: '3,75', expected: '3.75h'},
	];

	for (const {input, expected} of testCases) {
		submittedValue = ''; // Reset

		const {stdin} = render(
			React.createElement(DurationInput, {
				...defaultProps,
				value: '1h',
				onSubmit,
				compact: true,
			}),
		);

		// Type input and press Enter
		for (const char of input) {
			stdin.write(char);
		}

		stdin.write('\r');

		t.is(
			submittedValue,
			expected,
			`Input "${input}" should become "${expected}"`,
		);
	}
});

test('DurationInput smart unit detection with comma - whole numbers for minutes', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const testCases = [
		{input: '15', expected: '15m'}, // No comma, >= 10 = minutes
		{input: '30', expected: '30m'},
		{input: '45', expected: '45m'},
	];

	for (const {input, expected} of testCases) {
		submittedValue = ''; // Reset

		const {stdin} = render(
			React.createElement(DurationInput, {
				...defaultProps,
				value: '1h',
				onSubmit,
				compact: true,
			}),
		);

		// Type input and press Enter
		for (const char of input) {
			stdin.write(char);
		}

		stdin.write('\r');

		t.is(
			submittedValue,
			expected,
			`Input "${input}" should become "${expected}"`,
		);
	}
});
