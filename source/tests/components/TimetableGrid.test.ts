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
	t.false(output.includes('Sat'));
	t.false(output.includes('Sun'));
	t.true(output.includes('Total'));
});

test('TimetableGrid renders issue data correctly', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [
			{
				date: new Date('2024-10-18T00:00:00.000Z'), // Friday
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
	t.true(output.includes('5.5')); // Aggregated hours for Friday
});

test('TimetableGrid formats hours correctly', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [
			{
				date: new Date('2024-10-18T00:00:00.000Z'), // Friday
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
				date: new Date('2024-10-18T00:00:00.000Z'), // Friday
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
	t.true(output.includes('8')); // Daily total for Friday
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
				date: new Date('2024-10-18T00:00:00.000Z'), // Only Friday has work
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
	// Should show '-' for days without work (Mon-Thu only, since Fri has work)
	const dashCount = (output.match(/-/g) || []).length;
	t.true(dashCount >= 6); // At least 6 dashes for days without work
});

// Navigation Tests - Testing the fix for empty week navigation bug
test('TimetableGrid allows week navigation even with empty data', t => {
	const navigationCalls: Array<'prev' | 'next'> = [];

	const handleWeekChange = (direction: 'prev' | 'next') => {
		navigationCalls.push(direction);
	};

	const emptyData: WeeklyWorklogSummary = {
		weekStart: new Date('2024-01-08'),
		weekEnd: new Date('2024-01-14'),
		weekTotal: 0,
		dailySummaries: [], // Empty week - no worklogs
	};

	const props = {
		data: emptyData,
		isLoading: false,
		onWeekChange: handleWeekChange,
	};

	const {stdin} = render(React.createElement(TimetableGrid, props));

	// Should show "No worklogs found for this week"
	// But navigation should still work

	// Simulate Shift+LeftArrow (previous week) - this should work
	stdin.write('\u001b[1;2D');

	// Simulate Shift+RightArrow (next week) - this should also work
	stdin.write('\u001b[1;2C');

	// Navigation should work even with empty data (this was the bug)
	t.is(navigationCalls.length, 2);
	t.is(navigationCalls[0], 'prev');
	t.is(navigationCalls[1], 'next');
});

test('TimetableGrid blocks cell interaction with empty data but allows week navigation', t => {
	const navigationCalls: Array<'prev' | 'next'> = [];
	const cellWorklogCalls: Array<{issueKey: string; date: Date}> = [];

	const handleWeekChange = (direction: 'prev' | 'next') => {
		navigationCalls.push(direction);
	};

	const handleCellWorklog = (data: {issueKey: string; date: Date}) => {
		cellWorklogCalls.push(data);
	};

	const emptyData: WeeklyWorklogSummary = {
		weekStart: new Date('2024-01-08'),
		weekEnd: new Date('2024-01-14'),
		weekTotal: 0,
		dailySummaries: [], // Empty week
	};

	const props = {
		data: emptyData,
		isLoading: false,
		onWeekChange: handleWeekChange,
		onCellWorklog: handleCellWorklog,
	};

	const {stdin} = render(React.createElement(TimetableGrid, props));

	// Try Enter key (should NOT trigger cell worklog for empty week)
	stdin.write('\r');

	// Try arrow keys (should NOT work for cell navigation with empty data)
	stdin.write('\u001b[C'); // Right arrow
	stdin.write('\u001b[A'); // Up arrow

	// Try week navigation (SHOULD work even with empty data)
	stdin.write('\u001b[1;2D'); // Shift+Left arrow

	// Cell interactions should be blocked, week navigation should work
	t.is(cellWorklogCalls.length, 0); // No cell worklog calls
	t.is(navigationCalls.length, 1); // Week navigation should work
	t.is(navigationCalls[0], 'prev');
});

test('TimetableGrid allows navigation during loading state', t => {
	const navigationCalls: Array<'prev' | 'next'> = [];

	const handleWeekChange = (direction: 'prev' | 'next') => {
		navigationCalls.push(direction);
	};

	const props = {
		data: null,
		isLoading: true,
		onWeekChange: handleWeekChange,
	};

	const {stdin} = render(React.createElement(TimetableGrid, props));

	// Navigation should work even during loading
	stdin.write('\u001b[1;2D'); // Shift+LeftArrow
	stdin.write('\u001b[1;2C'); // Shift+RightArrow

	t.is(navigationCalls.length, 2);
	t.is(navigationCalls[0], 'prev');
	t.is(navigationCalls[1], 'next');
});
