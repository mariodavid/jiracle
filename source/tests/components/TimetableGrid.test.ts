import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {TimetableGrid} from '../../components/TimetableGrid.js';
import type {WeeklyWorklogSummary} from '../../domain/WeeklyWorklogSummary.js';

test('TimetableGrid shows loading state', t => {
	const props = {
		data: null,
		isLoading: true,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));

	t.true(lastFrame()!.includes('Loading worklogs...'));
});

test('TimetableGrid shows no data state', t => {
	const props = {
		data: null,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));

	t.true(lastFrame()!.includes('No data available'));
});

test('TimetableGrid shows empty worklogs state', t => {
	const emptyData: WeeklyWorklogSummary = {
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
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
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [
			{
				date: new Date('2024-10-19T00:00:00.000Z'),
				totalHours: 4.0,
				issues: [
					{
						issueKey: 'TEST-117',
						issueSummary: 'Test Issue Summary',
						hours: 4.0,
					},
				],
			},
		],
		weekTotal: 4.0,
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
	t.true(output.includes('Sat'));
	t.true(output.includes('Sun'));
	t.true(output.includes('Total'));
});

test('TimetableGrid renders issue data correctly', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [
			{
				date: new Date('2024-10-19T00:00:00.000Z'), // Saturday
				totalHours: 5.5,
				issues: [
					{
						issueKey: 'TEST-117',
						issueSummary: 'Test Issue Summary',
						hours: 4.0,
					},
					{
						issueKey: 'TEST-117',
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
	t.true(output.includes('5.5')); // Aggregated hours for Saturday
});

test('TimetableGrid formats hours correctly', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [
			{
				date: new Date('2024-10-19T00:00:00.000Z'),
				totalHours: 2.5,
				issues: [
					{
						issueKey: 'TEST-117',
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
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [
			{
				date: new Date('2024-10-19T00:00:00.000Z'), // Saturday
				totalHours: 8.0,
				issues: [
					{
						issueKey: 'TEST-117',
						issueSummary: 'First Issue',
						hours: 4.0,
					},
					{
						issueKey: 'TEST-118',
						issueSummary: 'Second Issue',
						hours: 4.0,
					},
				],
			},
		],
		weekTotal: 8.0,
	};

	const props = {
		data: sampleData,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));

	const output = lastFrame()!;
	t.true(output.includes('Daily Total'));
	t.true(output.includes('8')); // Daily total for Saturday
});

test('TimetableGrid shows week total', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [
			{
				date: new Date('2024-10-19T00:00:00.000Z'),
				totalHours: 7.0,
				issues: [
					{
						issueKey: 'TEST-117',
						issueSummary: 'Test Issue',
						hours: 7.0,
					},
				],
			},
		],
		weekTotal: 7.0,
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
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [
			{
				date: new Date('2024-10-19T00:00:00.000Z'),
				totalHours: 8.0,
				issues: [
					{
						issueKey: 'TEST-117',
						issueSummary: 'First Issue',
						hours: 4.0,
					},
					{
						issueKey: 'TEST-118',
						issueSummary: 'Second Issue',
						hours: 4.0,
					},
				],
			},
		],
		weekTotal: 8.0,
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
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [
			{
				date: new Date('2024-10-19T00:00:00.000Z'), // Only Saturday has work
				totalHours: 4.0,
				issues: [
					{
						issueKey: 'TEST-117',
						issueSummary: 'Test Issue',
						hours: 4.0,
					},
				],
			},
		],
		weekTotal: 4.0,
	};

	const props = {
		data: sampleData,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));

	const output = lastFrame()!;
	// Should show '-' for days without work (Mon-Fri, Sun)
	const dashCount = (output.match(/-/g) || []).length;
	t.true(dashCount >= 6); // At least 6 dashes for days without work
});
