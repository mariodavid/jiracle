import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {TimetableGrid} from '../../components/TimetableGrid.js';
import type {WeeklyWorklogSummary} from '../../domain/WeeklyWorklogSummary.js';

test('TimetableGrid sorts issues by project prefix and number', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [
			{
				date: new Date('2024-10-18T00:00:00.000Z'),
				totalHours: 12,
				issues: [
					{
						issueKey: 'DEF-2457',
						issueSummary: 'DEF issue 2457',
						hours: 2,
					},
					{
						issueKey: 'ABC-5417',
						issueSummary: 'ABC issue 5417',
						hours: 3,
					},
					{
						issueKey: 'DEF-2456',
						issueSummary: 'DEF issue 2456',
						hours: 1,
					},
					{
						issueKey: 'ABC-5420',
						issueSummary: 'ABC issue 5420',
						hours: 4,
					},
					{
						issueKey: 'ABC-5419',
						issueSummary: 'ABC issue 5419',
						hours: 2,
					},
				],
			},
		],
		weekTotal: 12,
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
		line => line.includes('ABC-') ?? line.includes('DEF-'),
	);

	// Should be sorted: ABC-5417, ABC-5419, ABC-5420, DEF-2456, DEF-2457
	t.true(issueLines.length >= 5, 'Should have at least 5 issue lines');

	// Find the indices of each issue in the output (with fixed width padding)
	const gvv5417Index = issueLines.findIndex(line => line.includes('ABC-5417'));
	const gvv5419Index = issueLines.findIndex(line => line.includes('ABC-5419'));
	const gvv5420Index = issueLines.findIndex(line => line.includes('ABC-5420'));
	const jts2456Index = issueLines.findIndex(line => line.includes('DEF-2456'));
	const jts2457Index = issueLines.findIndex(line => line.includes('DEF-2457'));

	// Verify sorting order: ABC issues come first (sorted by number), then DEF issues (sorted by number)
	t.true(gvv5417Index < gvv5419Index, 'ABC-5417 should come before ABC-5419');
	t.true(gvv5419Index < gvv5420Index, 'ABC-5419 should come before ABC-5420');
	t.true(
		gvv5420Index < jts2456Index,
		'ABC issues should come before DEF issues',
	);
	t.true(jts2456Index < jts2457Index, 'DEF-2456 should come before DEF-2457');
});

test('TimetableGrid sorts issues with different project prefixes correctly', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: new Date('2024-10-14T00:00:00.000Z'),
		weekEnd: new Date('2024-10-20T23:59:59.999Z'),
		dailySummaries: [
			{
				date: new Date('2024-10-18T00:00:00.000Z'),
				totalHours: 9,
				issues: [
					{
						issueKey: 'ZZZ-100',
						issueSummary: 'Last project issue',
						hours: 3,
					},
					{
						issueKey: 'AAA-200',
						issueSummary: 'First project issue',
						hours: 3,
					},
					{
						issueKey: 'BBB-50',
						issueSummary: 'Second project issue',
						hours: 3,
					},
				],
			},
		],
		weekTotal: 9,
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
			line.includes('AAA-') ?? line.includes('BBB-') ?? line.includes('ZZZ-'),
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
				totalHours: 6,
				issues: [
					{
						issueKey: 'ABC-1029',
						issueSummary: 'Higher number issue',
						hours: 3,
					},
					{
						issueKey: 'ABC-124',
						issueSummary: 'Lower number issue',
						hours: 3,
					},
				],
			},
		],
		weekTotal: 6,
	};

	const props = {
		data: sampleData,
		isLoading: false,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));
	const output = lastFrame()!;

	const lines = output.split('\n');
	const issueLines = lines.filter(line => line.includes('ABC-'));

	const gvv124Index = issueLines.findIndex(line => line.includes('ABC-124'));
	const gvv1029Index = issueLines.findIndex(line => line.includes('ABC-1029'));

	// 124 should come before 1029 (numeric sort, not string sort)
	t.true(gvv124Index < gvv1029Index, 'ABC-124 should come before ABC-1029');
	t.true(gvv124Index !== -1, 'ABC-124 should be found in output');
	t.true(gvv1029Index !== -1, 'ABC-1029 should be found in output');
});
