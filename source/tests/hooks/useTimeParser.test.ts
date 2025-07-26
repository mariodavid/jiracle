import test from 'ava';
import {useTimeParser} from '../../hooks/useTimeParser.js';

test('parseTimeToHours converts time strings to hours correctly', t => {
	// 1. EXPLICIT TEST DATA - input/output pairs for time conversion
	const testCases = [
		{input: '1h', expected: 1, description: 'simple hours'},
		{input: '2h', expected: 2, description: 'multiple hours'},
		{input: '30m', expected: 0.5, description: 'minutes to hours'},
		{input: '1h30m', expected: 1.5, description: 'hours and minutes combined'},
		{input: '1d', expected: 8, description: 'day to hours conversion'},
		{input: '90m', expected: 1.5, description: 'minutes over 60'},
		{input: '0h', expected: 0, description: 'zero hours'},
		{input: '24h', expected: 24, description: 'full day hours'},
	];

	// 2. OPERATIONS
	const {parseTimeToHours} = useTimeParser();

	// 3. SPECIFIC VALUE COMPARISONS
	for (const testCase of testCases) {
		const result = parseTimeToHours(testCase.input);
		t.is(
			result,
			testCase.expected,
			`${testCase.description}: '${testCase.input}' should equal ${testCase.expected} hours`,
		);
	}
});

test('parseTimeToHours handles edge cases and invalid input gracefully', t => {
	// 1. EXPLICIT TEST DATA - edge cases and error scenarios
	const edgeCases = [
		{input: '', expected: 1, description: 'empty string defaults to 1 hour'},
		{input: '0', expected: 0, description: 'zero as string'},
		{input: '0m', expected: 0, description: 'zero minutes'},
		{input: '2.5h', expected: 2.5, description: 'decimal hours'},
		{input: '1,5h', expected: 1.5, description: 'comma decimal hours'},
	];

	const invalidInputs = ['invalid', 'abc', 'xyz123', 'not-a-time'];

	// 2. OPERATIONS
	const {parseTimeToHours} = useTimeParser();

	// 3. SPECIFIC VALUE COMPARISONS
	// Test edge cases
	for (const testCase of edgeCases) {
		const result = parseTimeToHours(testCase.input);
		t.is(
			result,
			testCase.expected,
			`${testCase.description}: '${testCase.input}' should equal ${testCase.expected} hours`,
		);
	}

	// Test invalid inputs return safe defaults
	for (const input of invalidInputs) {
		const result = parseTimeToHours(input);
		t.true(
			typeof result === 'number' && !Number.isNaN(result),
			`Should return valid number for invalid input: '${input}'`,
		);
		t.true(result >= 0, `Should not return negative hours for: '${input}'`);
	}
});

test('normalizeTimeString formats time inputs consistently', t => {
	// 1. EXPLICIT TEST DATA - input/output pairs for normalization
	const testCases = [
		{input: '2', expected: '2h', description: 'plain number to hours'},
		{input: '30', expected: '30m', description: 'number to minutes when < 24'},
		{
			input: '2,5',
			expected: '2h30m',
			description: 'comma decimal to dot decimal',
		},
		{
			input: '2h5',
			expected: '2h5m',
			description: 'incomplete format completion',
		},
		{input: '1.5', expected: '1h30m', description: 'decimal to hours'},
		{input: '90', expected: '1h30m', description: 'large minutes'},
		{input: '0', expected: '0m', description: 'zero normalization'},
		{input: '25', expected: '25m', description: 'large number becomes minutes'},
	];

	// 2. OPERATIONS
	const {normalizeTimeString} = useTimeParser();

	// 3. SPECIFIC VALUE COMPARISONS
	for (const testCase of testCases) {
		const result = normalizeTimeString(testCase.input);
		t.is(
			result,
			testCase.expected,
			`${testCase.description}: '${testCase.input}' should normalize to '${testCase.expected}'`,
		);
	}
});

test('adjustTime modifies time values by specified increments', t => {
	// 1. EXPLICIT TEST DATA - time adjustment scenarios
	const testCases = [
		{
			input: '1h',
			direction: 'up' as const,
			increment: 15,
			expected: '1h15m',
			description: 'increase hours by minutes',
		},
		{
			input: '1h15m',
			direction: 'down' as const,
			increment: 15,
			expected: '1h',
			description: 'decrease to remove minutes',
		},
		{
			input: '30m',
			direction: 'up' as const,
			increment: 30,
			expected: '1h',
			description: 'minutes to hours conversion',
		},
		{
			input: '2h',
			direction: 'down' as const,
			increment: 30,
			expected: '1h30m',
			description: 'decrease hours to mixed format',
		},
		{
			input: '0h',
			direction: 'up' as const,
			increment: 15,
			expected: '15m',
			description: 'increase from zero',
		},
	];

	// 2. OPERATIONS
	const {adjustTime} = useTimeParser();

	// 3. SPECIFIC VALUE COMPARISONS
	for (const testCase of testCases) {
		const result = adjustTime(
			testCase.input,
			testCase.direction,
			testCase.increment,
		);
		t.is(
			result,
			testCase.expected,
			`${testCase.description}: adjustTime('${testCase.input}', '${testCase.direction}', ${testCase.increment}) should equal '${testCase.expected}'`,
		);
	}
});

test('generateTimeMarks creates correct time intervals', t => {
	// 1. EXPLICIT TEST DATA - interval generation scenarios
	const testCases = [
		{
			interval: 30,
			expectedStart: [0, 30, 60, 90, 120],
			description: '30-minute intervals',
		},
		{
			interval: 15,
			expectedStart: [0, 15, 30, 45, 60],
			description: '15-minute intervals',
		},
		{
			interval: 60,
			expectedStart: [0, 60, 120, 180, 240],
			description: '60-minute intervals',
		},
	];

	// 2. OPERATIONS
	const {generateTimeMarks} = useTimeParser();

	// 3. SPECIFIC VALUE COMPARISONS
	for (const testCase of testCases) {
		const marks = generateTimeMarks(testCase.interval);

		// Verify array structure
		t.true(
			Array.isArray(marks),
			`${testCase.description}: should return array`,
		);
		t.true(marks.length > 0, `${testCase.description}: should have marks`);

		// Verify sequence starts correctly
		for (const [index, expectedValue] of testCase.expectedStart.entries()) {
			if (index < marks.length) {
				t.is(
					marks[index],
					expectedValue,
					`${testCase.description}: mark[${index}] should be ${expectedValue}`,
				);
			}
		}

		// Verify consistent intervals
		for (let i = 1; i < Math.min(marks.length, 5); i++) {
			const current = marks[i];
			const previous = marks[i - 1];
			if (current !== undefined && previous !== undefined) {
				const actualInterval = current - previous;
				t.is(
					actualInterval,
					testCase.interval,
					`${testCase.description}: interval between marks should be ${testCase.interval}`,
				);
			}
		}
	}
});
