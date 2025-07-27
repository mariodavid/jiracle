import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import figures from 'figures';
import {TimetableGrid} from '../../components/TimetableGrid.js';
import type {WeeklyWorklogSummary} from '../../domain/WeeklyWorklogSummary.js';
import {LocalDate} from '../../domain/LocalDate.js';

test('TimetableGrid shows favorite issues with asterisk marker', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-18'),
				totalHours: 6,
				issues: [
					{
						issueKey: 'ABC-5417',
						issueSummary: 'Favorite issue',
						hours: 3,
					},
					{
						issueKey: 'DEF-2456',
						issueSummary: 'Regular issue',
						hours: 3,
					},
				],
			},
		],
		weekTotal: 6,
	};

	const favoriteIssues = [
		{
			key: 'ABC-5417',
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
		output.includes(`ABC-5417     ${figures.star}`),
		'Favorite issue should be marked with star',
	);

	// Non-favorite issue should not have star but should be padded to fixed width
	t.true(
		output.includes('DEF-2456    '),
		'Regular issue should be shown with fixed width padding',
	);
	t.false(
		output.includes(`DEF-2456     ${figures.star}`),
		'Regular issue should not have star',
	);
});

test('TimetableGrid handles favorite issues without worklogs', t => {
	// This test simulates when favorites are included via WeeklyWorklogSummaryUseCase
	// but have no worklog entries (0 hours for all days)
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-18'),
				totalHours: 3,
				issues: [
					{
						issueKey: 'DEF-2456',
						issueSummary: 'Issue with worklog',
						hours: 3,
					},
				],
			},
		],
		weekTotal: 3,
	};

	// This represents a scenario where a favorite issue was fetched
	// but has no worklogs, so it would appear with 0 hours
	const favoriteIssues = [
		{
			key: 'ABC-5417',
			defaultTime: '4h',
			defaultComment: 'Favorite without worklog',
		},
		{
			key: 'DEF-2456',
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
		output.includes(`DEF-2456     ${figures.star}`),
		'Favorite with worklog should have star',
	);
	t.true(
		output.includes('DEF-2456    '),
		'Issue with worklog should be present',
	);

	// Note: ABC-5417 won't appear in this test because it's not in the worklog data
	// The WeeklyWorklogSummaryUseCase would need to include it in the data
	// This test validates the visual marking works correctly for favorites that do appear
});

test('TimetableGrid shows favorite issues even when no worklogs exist', t => {
	// Empty worklog data - no worklogs for this week
	const emptyData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [], // No worklogs at all
		weekTotal: 0,
	};

	const favoriteIssues = [
		{
			key: 'ABC-5417',
			defaultTime: '4h',
			defaultComment: 'Favorite work',
		},
		{
			key: 'DEF-2456',
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
		output.includes(`ABC-5417     ${figures.star}`),
		'Favorite ABC-5417 should be shown with star',
	);
	t.true(
		output.includes(`DEF-2456     ${figures.star}`),
		'Favorite DEF-2456 should be shown with star',
	);

	// Should show dashes for all days (no worklogs)
	t.true(output.includes('-'), 'Should show dashes for days without worklogs');

	// Should NOT show "No worklogs found" message when favorites exist
	t.false(
		output.includes('No worklogs found'),
		'Should not show no worklogs message when favorites exist',
	);
});

test('TimetableGrid displays aliases for favorite issues', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-18'),
				totalHours: 6,
				issues: [
					{
						issueKey: 'DEF-2456',
						issueSummary: 'Dev work issue',
						hours: 4,
					},
					{
						issueKey: 'ABC-5419',
						issueSummary: 'Monitoring issue',
						hours: 2,
					},
				],
			},
		],
		weekTotal: 6,
	};

	const favoriteIssues = [
		{
			key: 'DEF-2456',
			alias: 'Dev Work',
			defaultTime: '8h',
			defaultComment: 'Development work',
		},
		{
			key: 'ABC-5419',
			alias: 'Monitoring API',
			defaultTime: '4h',
		},
	];

	const props = {
		data: sampleData,
		isLoading: false,
		favoriteIssues,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));
	const output = lastFrame()!;

	// Should display aliases instead of issue keys
	t.true(
		output.includes(`Dev Work     ${figures.star}`),
		'Should display alias "Dev Work" for DEF-2456',
	);
	t.true(
		output.includes(`Monitoring API ${figures.star}`),
		'Should display alias "Monitoring API" for ABC-5419',
	);

	// Should NOT display the original issue keys in the issue column
	t.false(
		output.includes(`DEF-2456     ${figures.star}`),
		'Should not display original key DEF-2456 when alias is set',
	);
	t.false(
		output.includes(`ABC-5419     ${figures.star}`),
		'Should not display original key ABC-5419 when alias is set',
	);
});

test('TimetableGrid shows original key when no alias is configured', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-18'),
				totalHours: 4,
				issues: [
					{
						issueKey: 'DEF-2456',
						issueSummary: 'Issue without alias',
						hours: 4,
					},
				],
			},
		],
		weekTotal: 4,
	};

	const favoriteIssues = [
		{
			key: 'DEF-2456',
			// No alias property set
			defaultTime: '8h',
			defaultComment: 'Development work',
		},
	];

	const props = {
		data: sampleData,
		isLoading: false,
		favoriteIssues,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));
	const output = lastFrame()!;

	// Should display original issue key when no alias
	t.true(
		output.includes(`DEF-2456     ${figures.star}`),
		'Should display original key DEF-2456 when no alias is set',
	);
});

test('TimetableGrid handles mixed alias and non-alias favorites', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-18'),
				totalHours: 6,
				issues: [
					{
						issueKey: 'DEF-2456',
						issueSummary: 'Dev work',
						hours: 3,
					},
					{
						issueKey: 'ABC-5419',
						issueSummary: 'Regular work',
						hours: 3,
					},
				],
			},
		],
		weekTotal: 6,
	};

	const favoriteIssues = [
		{
			key: 'DEF-2456',
			alias: 'Dev Work',
			defaultTime: '8h',
		},
		{
			key: 'ABC-5419',
			// No alias - should show original key
			defaultTime: '4h',
		},
	];

	const props = {
		data: sampleData,
		isLoading: false,
		favoriteIssues,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));
	const output = lastFrame()!;

	// One with alias, one without
	t.true(
		output.includes(`Dev Work     ${figures.star}`),
		'Should display alias for DEF-2456',
	);
	t.true(
		output.includes(`ABC-5419     ${figures.star}`),
		'Should display original key for ABC-5419 when no alias',
	);
	t.false(
		output.includes(`DEF-2456     ${figures.star}`),
		'Should not display original DEF-2456 when alias is set',
	);
});

test('TimetableGrid displays aliases with proper padding', t => {
	const emptyData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [],
		weekTotal: 0,
	};

	const favoriteIssues = [
		{
			key: 'DEF-2456',
			alias: 'A', // Very short alias
			defaultTime: '8h',
		},
		{
			key: 'ABC-5419',
			alias: 'Very Long Alias Name', // Long alias (longer than 12 chars)
			defaultTime: '4h',
		},
	];

	const props = {
		data: emptyData,
		isLoading: false,
		favoriteIssues,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));
	const output = lastFrame()!;

	// Check that short aliases are properly padded
	t.true(
		output.includes(`A            ${figures.star}`),
		'Short alias should be padded to 12 characters plus star',
	);

	// Long aliases should be included (the star may be on a separate line due to layout)
	t.true(
		output.includes('Very Long Alias Name'),
		'Long alias should be displayed',
	);
	// Both aliases should have stars (check that both favorite issues have stars)
	const starCount = (output.match(new RegExp(figures.star, 'g')) ?? []).length;
	t.is(starCount, 2, 'Both favorite issues should have stars');
});
