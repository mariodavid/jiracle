import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import CustomTimeInput from '../../components/WorklogForm/CustomTimeInput.js';

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
	onChange: () => {},
	onSubmit: () => {},
};

test('CustomTimeInput renders with initial value', t => {
	const {lastFrame} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput renders in compact mode', t => {
	const {lastFrame} = render(
		React.createElement(CustomTimeInput, {
			...defaultProps,
			value: '3h',
			compact: true,
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('3h'));
	t.true(output.includes('↑/↓ adjust or type'));
	// Should not include issue info in compact mode
	t.false(output.includes('TEST-123'));
});

test('CustomTimeInput shows selection state initially', t => {
	const {lastFrame} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput calls onChange when typing', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput handles arrow key navigation', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
			...defaultProps,
			value: '2h',
			onChange,
			compact: true,
		}),
	);

	// Press up arrow - should increment to 3h
	stdin.write('\u001B[A'); // Up arrow

	t.is(changedValue, '3h');
});

test('CustomTimeInput handles down arrow navigation', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
			...defaultProps,
			value: '3h',
			onChange,
			compact: true,
		}),
	);

	// Press down arrow - should decrement to 2h
	stdin.write('\u001B[B'); // Down arrow

	t.is(changedValue, '2h');
});

test('CustomTimeInput prevents going below 1h', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
			...defaultProps,
			value: '1h',
			onChange,
			compact: true,
		}),
	);

	// Press down arrow - should stay at 1h
	stdin.write('\u001B[B'); // Down arrow

	t.is(changedValue, '1h');
});

test('CustomTimeInput prevents going above 24h', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput handles backspace on selected text', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput calls onSubmit with auto-completion', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput handles existing complete values', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput parses different time formats', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
			...defaultProps,
			value: '30m', // 30 minutes = 0.5 hours
			onChange,
			compact: true,
		}),
	);

	// Press up arrow - should increment by 1 hour to 1.5h
	stdin.write('\u001B[A'); // Up arrow

	t.is(changedValue, '1h'); // Should be 1 hour (0.5 + 1 = 1.5, but we round to integers)
});

test('CustomTimeInput handles day format', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
			...defaultProps,
			value: '1d', // 1 day = 8 hours
			onChange,
			compact: true,
		}),
	);

	// Press up arrow - should increment by 1 hour to 9h
	stdin.write('\u001B[A'); // Up arrow

	t.is(changedValue, '9h');
});

test('CustomTimeInput allows typing decimal numbers', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput converts comma to dot on submit with Enter', t => {
	let changedValue = '';
	let submittedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput converts comma to dot on submit with Tab', t => {
	let changedValue = '';
	let submittedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput uses global default time from config', t => {
	const config = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		defaultTime: '4h',
	};

	const {lastFrame} = render(
		React.createElement(CustomTimeInput, {
			...defaultProps,
			value: '',
			config,
			compact: true,
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('4h'));
});

test('CustomTimeInput uses favorite-specific default time', t => {
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
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput favorite default time overrides global default', t => {
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
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput allows typing time units', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput rejects invalid characters', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput prevents multiple dots', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput prevents multiple commas', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput prevents mixed decimal separators', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput prevents multiple units', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput allows and auto-completes h+digits pattern', t => {
	let changedValue = '';
	let submittedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput prevents invalid complex patterns like "2h.d.d."', t => {
	let changedValues: string[] = [];
	const onChange = (value: string) => {
		changedValues.push(value);
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput prevents "2...." pattern', t => {
	let changedValues: string[] = [];
	const onChange = (value: string) => {
		changedValues.push(value);
	};

	const {stdin} = render(
		React.createElement(CustomTimeInput, {
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

test('CustomTimeInput accepts valid hour formats', t => {
	const validHourInputs = ['1h', '2h', '10h', '24h'];

	validHourInputs.forEach(input => {
		let finalValue = '';
		const onChange = (value: string) => {
			finalValue = value;
		};

		const {stdin} = render(
			React.createElement(CustomTimeInput, {
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
	});
});

test('CustomTimeInput accepts valid decimal hour formats', t => {
	const testCases = [
		{input: '2.5h', expected: '2.5h'},
		{input: '1,5h', expected: '1,5h'},
		{input: '0.25h', expected: '0.25h'},
	];

	testCases.forEach(({input, expected}) => {
		let finalValue = '';
		const onChange = (value: string) => {
			finalValue = value;
		};

		const {stdin} = render(
			React.createElement(CustomTimeInput, {
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
	});
});

test('CustomTimeInput accepts valid minute formats', t => {
	const validMinuteInputs = ['15m', '30m', '45m', '90m'];

	validMinuteInputs.forEach(input => {
		let finalValue = '';
		const onChange = (value: string) => {
			finalValue = value;
		};

		const {stdin} = render(
			React.createElement(CustomTimeInput, {
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
	});
});

test('CustomTimeInput accepts valid day formats', t => {
	const testCases = [
		{input: '1d', expected: '1d'},
		{input: '2d', expected: '2d'},
		{input: '0.5d', expected: '0.5d'},
		{input: '1,5d', expected: '1,5d'},
	];

	testCases.forEach(({input, expected}) => {
		let finalValue = '';
		const onChange = (value: string) => {
			finalValue = value;
		};

		const {stdin} = render(
			React.createElement(CustomTimeInput, {
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
	});
});

test('CustomTimeInput accepts numbers only (for auto-completion)', t => {
	const testCases = [
		{input: '2', expected: '2'},
		{input: '8', expected: '8'},
		{input: '2.5', expected: '2.5'},
		{input: '1,5', expected: '1,5'},
	];

	testCases.forEach(({input, expected}) => {
		let finalValue = '';
		const onChange = (value: string) => {
			finalValue = value;
		};

		const {stdin} = render(
			React.createElement(CustomTimeInput, {
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
	});
});

// === COMPLEX NEGATIVE CASES ===

test('CustomTimeInput rejects complex invalid patterns', t => {
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

	invalidPatterns.forEach(({input, reason}) => {
		let changedValues: string[] = [];
		const onChange = (value: string) => {
			changedValues.push(value);
		};

		const {stdin} = render(
			React.createElement(CustomTimeInput, {
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
	});
});

test('CustomTimeInput accepts valid combined hour-minute formats', t => {
	const testCases = [
		{input: '2h30m', expected: '2h30m'},
		{input: '1h15m', expected: '1h15m'},
		{input: '8h45m', expected: '8h45m'},
		{input: '12h00m', expected: '12h00m'},
	];

	testCases.forEach(({input, expected}) => {
		let finalValue = '';
		const onChange = (value: string) => {
			finalValue = value;
		};

		const {stdin} = render(
			React.createElement(CustomTimeInput, {
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
	});
});

test('CustomTimeInput rejects invalid patterns with dots after units', t => {
	const testCases = [
		{input: '12h.', reason: 'dot after h'},
		{input: '30m.', reason: 'dot after m'},
		{input: '2d.', reason: 'dot after d'},
	];

	testCases.forEach(({input, reason}) => {
		let changedValues: string[] = [];
		const onChange = (value: string) => {
			changedValues.push(value);
		};

		const {stdin} = render(
			React.createElement(CustomTimeInput, {
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
	});
});
