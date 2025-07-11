import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import figures from 'figures';
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

test('TimetableGrid sorts issues by project prefix and number', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [
			{
				date: new Date('2024-10-18T00:00:00.000Z'),
				totalHours: 12.0,
				issues: [
					{
						issueKey: 'JTS-2457',
						issueSummary: 'JTS issue 2457',
						hours: 2.0,
					},
					{
						issueKey: 'GVV-5417',
						issueSummary: 'GVV issue 5417',
						hours: 3.0,
					},
					{
						issueKey: 'JTS-2456',
						issueSummary: 'JTS issue 2456',
						hours: 1.0,
					},
					{
						issueKey: 'GVV-5420',
						issueSummary: 'GVV issue 5420',
						hours: 4.0,
					},
					{
						issueKey: 'GVV-5419',
						issueSummary: 'GVV issue 5419',
						hours: 2.0,
					},
				],
			},
		],
		weekTotal: 12.0,
	};

	const props = {
		data: sampleData,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));
	const output = lastFrame()!;

	// Split output into lines to analyze order
	const lines = output.split('\n');
	const issueLines = lines.filter(
		line => line.includes('GVV-') || line.includes('JTS-'),
	);

	// Should be sorted: GVV-5417, GVV-5419, GVV-5420, JTS-2456, JTS-2457
	t.true(issueLines.length >= 5, 'Should have at least 5 issue lines');

	// Find the indices of each issue in the output (with fixed width padding)
	const gvv5417Index = issueLines.findIndex(line => line.includes('GVV-5417'));
	const gvv5419Index = issueLines.findIndex(line => line.includes('GVV-5419'));
	const gvv5420Index = issueLines.findIndex(line => line.includes('GVV-5420'));
	const jts2456Index = issueLines.findIndex(line => line.includes('JTS-2456'));
	const jts2457Index = issueLines.findIndex(line => line.includes('JTS-2457'));

	// Verify sorting order: GVV issues come first (sorted by number), then JTS issues (sorted by number)
	t.true(gvv5417Index < gvv5419Index, 'GVV-5417 should come before GVV-5419');
	t.true(gvv5419Index < gvv5420Index, 'GVV-5419 should come before GVV-5420');
	t.true(
		gvv5420Index < jts2456Index,
		'GVV issues should come before JTS issues',
	);
	t.true(jts2456Index < jts2457Index, 'JTS-2456 should come before JTS-2457');
});

test('TimetableGrid sorts issues with different project prefixes correctly', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [
			{
				date: new Date('2024-10-18T00:00:00.000Z'),
				totalHours: 9.0,
				issues: [
					{
						issueKey: 'ZZZ-100',
						issueSummary: 'Last project issue',
						hours: 3.0,
					},
					{
						issueKey: 'AAA-200',
						issueSummary: 'First project issue',
						hours: 3.0,
					},
					{
						issueKey: 'BBB-50',
						issueSummary: 'Second project issue',
						hours: 3.0,
					},
				],
			},
		],
		weekTotal: 9.0,
	};

	const props = {
		data: sampleData,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));
	const output = lastFrame()!;

	const lines = output.split('\n');
	const issueLines = lines.filter(
		line =>
			line.includes('AAA-') || line.includes('BBB-') || line.includes('ZZZ-'),
	);

	const aaaIndex = issueLines.findIndex(line => line.includes('AAA-200'));
	const bbbIndex = issueLines.findIndex(line => line.includes('BBB-50'));
	const zzzIndex = issueLines.findIndex(line => line.includes('ZZZ-100'));

	// Should be sorted alphabetically by project prefix: AAA, BBB, ZZZ
	t.true(aaaIndex < bbbIndex, 'AAA should come before BBB');
	t.true(bbbIndex < zzzIndex, 'BBB should come before ZZZ');
});

test('TimetableGrid sorts issues numerically within same project (124 before 1029)', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [
			{
				date: new Date('2024-10-18T00:00:00.000Z'),
				totalHours: 6.0,
				issues: [
					{
						issueKey: 'GVV-1029',
						issueSummary: 'Higher number issue',
						hours: 3.0,
					},
					{
						issueKey: 'GVV-124',
						issueSummary: 'Lower number issue',
						hours: 3.0,
					},
				],
			},
		],
		weekTotal: 6.0,
	};

	const props = {
		data: sampleData,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));
	const output = lastFrame()!;

	const lines = output.split('\n');
	const issueLines = lines.filter(line => line.includes('GVV-'));

	const gvv124Index = issueLines.findIndex(line => line.includes('GVV-124'));
	const gvv1029Index = issueLines.findIndex(line => line.includes('GVV-1029'));

	// 124 should come before 1029 (numeric sort, not string sort)
	t.true(gvv124Index < gvv1029Index, 'GVV-124 should come before GVV-1029');
	t.true(gvv124Index !== -1, 'GVV-124 should be found in output');
	t.true(gvv1029Index !== -1, 'GVV-1029 should be found in output');
});

test('TimetableGrid shows favorite issues with asterisk marker', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [
			{
				date: new Date('2024-10-18T00:00:00.000Z'),
				totalHours: 6.0,
				issues: [
					{
						issueKey: 'GVV-5417',
						issueSummary: 'Favorite issue',
						hours: 3.0,
					},
					{
						issueKey: 'JTS-2456',
						issueSummary: 'Regular issue',
						hours: 3.0,
					},
				],
			},
		],
		weekTotal: 6.0,
	};

	const favoriteIssues = [
		{
			key: 'GVV-5417',
			defaultTime: '4h',
			defaultComment: 'Favorite work',
		},
	];

	const props = {
		data: sampleData,
		isLoading: false,
		favoriteIssues,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));
	const output = lastFrame()!;

	// Favorite issue should have star suffix with fixed width padding
	t.true(
		output.includes(`GVV-5417     ${figures.star}`),
		'Favorite issue should be marked with star',
	);

	// Non-favorite issue should not have star but should be padded to fixed width
	t.true(
		output.includes('JTS-2456    '),
		'Regular issue should be shown with fixed width padding',
	);
	t.false(
		output.includes(`JTS-2456     ${figures.star}`),
		'Regular issue should not have star',
	);
});

test('TimetableGrid handles favorite issues without worklogs', t => {
	// This test simulates when favorites are included via WeeklyWorklogSummaryUseCase
	// but have no worklog entries (0 hours for all days)
	const sampleData: WeeklyWorklogSummary = {
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [
			{
				date: new Date('2024-10-18T00:00:00.000Z'),
				totalHours: 3.0,
				issues: [
					{
						issueKey: 'JTS-2456',
						issueSummary: 'Issue with worklog',
						hours: 3.0,
					},
				],
			},
		],
		weekTotal: 3.0,
	};

	// This represents a scenario where a favorite issue was fetched
	// but has no worklogs, so it would appear with 0 hours
	const favoriteIssues = [
		{
			key: 'GVV-5417',
			defaultTime: '4h',
			defaultComment: 'Favorite without worklog',
		},
		{
			key: 'JTS-2456',
			defaultTime: '2h',
			defaultComment: 'Favorite with worklog',
		},
	];

	const props = {
		data: sampleData,
		isLoading: false,
		favoriteIssues,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));
	const output = lastFrame()!;

	// Both issues should appear (one with worklog, one is configured favorite)
	t.true(
		output.includes(`JTS-2456     ${figures.star}`),
		'Favorite with worklog should have star',
	);
	t.true(
		output.includes('JTS-2456    '),
		'Issue with worklog should be present',
	);

	// Note: GVV-5417 won't appear in this test because it's not in the worklog data
	// The WeeklyWorklogSummaryUseCase would need to include it in the data
	// This test validates the visual marking works correctly for favorites that do appear
});

test('TimetableGrid shows favorite issues even when no worklogs exist', t => {
	// Empty worklog data - no worklogs for this week
	const emptyData: WeeklyWorklogSummary = {
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [], // No worklogs at all
		weekTotal: 0,
	};

	const favoriteIssues = [
		{
			key: 'GVV-5417',
			defaultTime: '4h',
			defaultComment: 'Favorite work',
		},
		{
			key: 'JTS-2456',
			defaultTime: '2h',
			defaultComment: 'Other favorite',
		},
	];

	const props = {
		data: emptyData,
		isLoading: false,
		favoriteIssues,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));
	const output = lastFrame()!;

	// Both favorite issues should appear even without worklogs
	t.true(
		output.includes(`GVV-5417     ${figures.star}`),
		'Favorite GVV-5417 should be shown with star',
	);
	t.true(
		output.includes(`JTS-2456     ${figures.star}`),
		'Favorite JTS-2456 should be shown with star',
	);

	// Should show dashes for all days (no worklogs)
	t.true(output.includes('-'), 'Should show dashes for days without worklogs');

	// Should NOT show "No worklogs found" message when favorites exist
	t.false(
		output.includes('No worklogs found'),
		'Should not show no worklogs message when favorites exist',
	);
});
