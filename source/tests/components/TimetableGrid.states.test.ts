import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {TimetableGrid} from '../../components/TimetableGrid.js';
import type {WeeklyWorklogSummary} from '../../domain/WeeklyWorklogSummary.js';
import {LocalDate} from '../../domain/LocalDate.js';
import {IssueKey} from '../../domain/IssueKey.js';

test('TimetableGrid shows loading state', t => {
	const props = {
		data: undefined,
		isLoading: true,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));

	t.true(lastFrame()!.includes('Loading worklogs...'));
});

test('TimetableGrid shows no data state', t => {
	const props = {
		data: undefined,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));

	t.true(lastFrame()!.includes('No data available'));
});

test('TimetableGrid shows empty worklogs state', t => {
	const emptyData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [],
		weekTotal: 0,
	};

	const props = {
		data: emptyData,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));

	t.true(lastFrame()!.includes('No worklogs found for this week'));
});

test('TimetableGrid renders table header', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-19'),
				totalHours: 4,
				issues: [
					{
						issueKey: IssueKey.fromString('TEST-117'),
						issueSummary: 'Test Issue Summary',
						hours: 4,
					},
				],
			},
		],
		weekTotal: 4,
	};

	const props = {
		data: sampleData,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));

	const output = lastFrame()!;
	t.true(output.includes('Issue'));
	t.true(output.includes('Mon'));
	t.true(output.includes('Tue'));
	t.true(output.includes('Wed'));
	t.true(output.includes('Thu'));
	t.true(output.includes('Fri'));
	t.false(output.includes('Sat'));
	t.false(output.includes('Sun'));
	t.true(output.includes('Total'));
});

test('TimetableGrid displays dates in weekday headers', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'), // Monday, October 14, 2024
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-14'),
				totalHours: 8,
				issues: [
					{
						issueKey: IssueKey.fromString('TEST-123'),
						issueSummary: 'Test Issue',
						hours: 8,
					},
				],
			},
		],
		weekTotal: 8,
	};

	const props = {
		data: sampleData,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));

	const output = lastFrame()!;

	// Check that weekdays include date information
	// Week starting Oct 14, 2024: Mon (14.10), Tue (15.10), Wed (16.10), Thu (17.10), Fri (18.10)
	t.true(output.includes('Mon (14.10)'), 'Should display Monday with date');
	t.true(output.includes('Tue (15.10)'), 'Should display Tuesday with date');
	t.true(output.includes('Wed (16.10)'), 'Should display Wednesday with date');
	t.true(output.includes('Thu (17.10)'), 'Should display Thursday with date');
	t.true(output.includes('Fri (18.10)'), 'Should display Friday with date');
});

test('TimetableGrid renders issue data correctly', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-18'), // Friday
				totalHours: 5.5,
				issues: [
					{
						issueKey: IssueKey.fromString('TEST-117'),
						issueSummary: 'Test Issue Summary',
						hours: 4,
					},
					{
						issueKey: IssueKey.fromString('TEST-117'),
						issueSummary: 'Test Issue Summary',
						hours: 1.5,
					},
				],
			},
		],
		weekTotal: 5.5,
	};

	const props = {
		data: sampleData,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));

	const output = lastFrame()!;
	t.true(output.includes('TEST-117'));
	t.true(output.includes('Test Issue Summary'));
	t.true(output.includes('5.5')); // Aggregated hours for Friday
});

test('TimetableGrid formats hours correctly', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-18'), // Friday
				totalHours: 2.5,
				issues: [
					{
						issueKey: IssueKey.fromString('TEST-117'),
						issueSummary: 'Test Issue Summary',
						hours: 2.5,
					},
				],
			},
		],
		weekTotal: 2.5,
	};

	const props = {
		data: sampleData,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));

	const output = lastFrame()!;
	t.true(output.includes('2.5')); // Decimal hours
});

test('TimetableGrid shows daily totals', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-18'), // Friday
				totalHours: 8,
				issues: [
					{
						issueKey: IssueKey.fromString('TEST-117'),
						issueSummary: 'First Issue',
						hours: 4,
					},
					{
						issueKey: IssueKey.fromString('TEST-118'),
						issueSummary: 'Second Issue',
						hours: 4,
					},
				],
			},
		],
		weekTotal: 8,
	};

	const props = {
		data: sampleData,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));

	const output = lastFrame()!;
	t.true(output.includes('Worklog'));
	t.true(output.includes('8')); // Daily total for Friday
});

test('TimetableGrid shows week total', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-19'),
				totalHours: 7,
				issues: [
					{
						issueKey: IssueKey.fromString('TEST-117'),
						issueSummary: 'Test Issue',
						hours: 7,
					},
				],
			},
		],
		weekTotal: 7,
	};

	const props = {
		data: sampleData,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));

	const output = lastFrame()!;
	t.true(output.includes('7')); // Week total
});

test('TimetableGrid handles multiple issues correctly', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-19'),
				totalHours: 8,
				issues: [
					{
						issueKey: IssueKey.fromString('TEST-117'),
						issueSummary: 'First Issue',
						hours: 4,
					},
					{
						issueKey: IssueKey.fromString('TEST-118'),
						issueSummary: 'Second Issue',
						hours: 4,
					},
				],
			},
		],
		weekTotal: 8,
	};

	const props = {
		data: sampleData,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));

	const output = lastFrame()!;
	t.true(output.includes('TEST-117'));
	t.true(output.includes('TEST-118'));
	t.true(output.includes('First Issue'));
	t.true(output.includes('Second Issue'));
});

test('TimetableGrid shows dash for zero hours', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-18'), // Only Friday has work
				totalHours: 4,
				issues: [
					{
						issueKey: IssueKey.fromString('TEST-117'),
						issueSummary: 'Test Issue',
						hours: 4,
					},
				],
			},
		],
		weekTotal: 4,
	};

	const props = {
		data: sampleData,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));

	const output = lastFrame()!;
	// Should show '-' for days without work (Mon-Thu only, since Fri has work)
	const dashCount = (output.match(/-/g) ?? []).length;
	t.true(dashCount >= 6); // At least 6 dashes for days without work
});
