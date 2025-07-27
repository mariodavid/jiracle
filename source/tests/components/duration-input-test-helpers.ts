import React from 'react';
import {render} from 'ink-testing-library';
import {IssueKey} from '../../domain/IssueKey.js';
import DurationInput from '../../components/WorklogForm/DurationInput.js';

// Shared mock data
export const mockIssue = {
	id: '12345',
	key: IssueKey.fromString('TEST-123'),
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

export const defaultProps = {
	value: '1h',
	onChange() {},
	onSubmit() {},
};

export const defaultConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token',
	defaultTime: '4h',
};

// Helper functions
export function createDurationInput(overrides: any = {}) {
	return React.createElement(DurationInput, {
		...defaultProps,
		...overrides,
	});
}

export function renderDurationInput(
	overrides: Record<string, any> = {},
): ReturnType<typeof render> {
	return render(createDurationInput(overrides));
}

export function typeString(stdin: any, text: string) {
	for (const char of text) {
		stdin.write(char);
	}
}

export function pressEnter(stdin: any) {
	stdin.write('\r');
}

export function pressTab(stdin: any) {
	stdin.write('\t');
}

export function pressUpArrow(stdin: any) {
	stdin.write('\u001B[A');
}

export function pressDownArrow(stdin: any) {
	stdin.write('\u001B[B');
}

export function pressBackspace(stdin: any) {
	stdin.write('\u007F');
}

// Test data collections
export const validHourFormats = ['1h', '2h', '10h', '24h'];

export const validDecimalHourFormats = [
	{input: '2.5h', expected: '2.5h'},
	{input: '1,5h', expected: '1,5h'},
	{input: '0.25h', expected: '0.25h'},
];

export const validMinuteFormats = ['15m', '30m', '45m', '90m'];

export const validDayFormats = [
	{input: '1d', expected: '1d'},
	{input: '2d', expected: '2d'},
	{input: '0.5d', expected: '0.5d'},
	{input: '1,5d', expected: '1,5d'},
];

export const validNumberFormats = [
	{input: '2', expected: '2'},
	{input: '8', expected: '8'},
	{input: '2.5', expected: '2.5'},
	{input: '1,5', expected: '1,5'},
];

export const validCombinedFormats = [
	{input: '2h30m', expected: '2h30m'},
	{input: '1h15m', expected: '1h15m'},
	{input: '8h45m', expected: '8h45m'},
	{input: '12h00m', expected: '12h00m'},
];

export const invalidPatterns = [
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

export const invalidDotAfterUnitPatterns = [
	{input: '12h.', reason: 'dot after h'},
	{input: '30m.', reason: 'dot after m'},
	{input: '2d.', reason: 'dot after d'},
];

export const commaToHourConversionCases = [
	{input: '1,5', expected: '1h30m'},
	{input: '2,25', expected: '2h15m'},
	{input: '0,5', expected: '30m'},
	{input: '3,75', expected: '3h45m'},
];

export const wholeNumberToMinutesCases = [
	{input: '15', expected: '15m'}, // No comma, >= 10 = minutes
	{input: '30', expected: '30m'},
	{input: '45', expected: '45m'},
];

// Test helpers for common patterns
export function testValidInputFormats(
	t: any,
	formats: Array<string | {input: string; expected: string}>,
	description: string,
) {
	for (const format of formats) {
		const input = typeof format === 'string' ? format : format.input;
		const expected = typeof format === 'string' ? format : format.expected;

		let finalValue = '';
		const onChange = (value: string) => {
			finalValue = value;
		};

		const {stdin} = renderDurationInput({
			value: '1h',
			onChange,
			compact: true,
		});

		typeString(stdin, input);
		t.is(finalValue, expected, `Should accept ${description}: ${input}`);
	}
}

export function testInvalidPatterns(
	t: any,
	patterns: Array<{input: string; reason: string}>,
) {
	for (const {input, reason} of patterns) {
		const changedValues: string[] = [];
		const onChange = (value: string) => {
			changedValues.push(value);
		};

		const {stdin} = renderDurationInput({
			value: '1h',
			onChange,
			compact: true,
		});

		typeString(stdin, input);

		// Should not contain the full invalid input
		const finalValue = changedValues[changedValues.length - 1] ?? '';
		t.notRegex(
			finalValue,
			new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
			`Should reject invalid pattern "${input}" (${reason})`,
		);
	}
}

export function testCommaConversion(
	t: any,
	testCases: Array<{input: string; expected: string}>,
	description: string,
) {
	for (const {input, expected} of testCases) {
		let submittedValue = '';
		const onSubmit = (value: string) => {
			submittedValue = value;
		};

		const {stdin} = renderDurationInput({
			value: '1h',
			onSubmit,
			compact: true,
		});

		typeString(stdin, input);
		pressEnter(stdin);

		t.is(
			submittedValue,
			expected,
			`${description}: Input "${input}" should become "${expected}"`,
		);
	}
}
