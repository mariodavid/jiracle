import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {TimetableGrid} from '../../components/TimetableGrid.js';
import type {WeeklyWorklogSummary} from '../../domain/WeeklyWorklogSummary.js';
import type {JiraConfig, FavoriteIssue} from '../../jira-client.js';
import {WorklogSummary} from '../../domain/WeeklyWorklogSummary.js';
import {LocalDate} from '../../domain/LocalDate.js';
import {IssueKey} from '../../domain/IssueKey.js';
import {Duration} from '../../domain/Duration.js';

test('TimetableGrid displays global aliases for any issue', t => {
	// EXPLICIT TEST DATA
	const expectedIssueKey1 = 'DEF-2456';
	const expectedIssueKey2 = 'ABC-5419';
	const expectedGlobalAlias1 = 'Dev Work';
	const expectedGlobalAlias2 = 'API Task';

	// Create test data using the correct structure
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-18'),
				totalHours: 12,
				issues: [
					WorklogSummary.create({
						issueKey: IssueKey.fromString(expectedIssueKey1),
						issueSummary: 'Development issue',
						duration: Duration.fromHours(8),
					}),
					WorklogSummary.create({
						issueKey: IssueKey.fromString(expectedIssueKey2),
						issueSummary: 'API issue',
						duration: Duration.fromHours(4),
					}),
				],
			},
		],
		weekTotal: 12,
	};

	// Create config with global aliases
	const testConfig: JiraConfig = {
		jiraUrl: 'https://test-jira.com',
		username: 'testuser',
		apiToken: 'test-token',
		aliases: {
			[expectedIssueKey1]: expectedGlobalAlias1,
			[expectedIssueKey2]: expectedGlobalAlias2,
		},
	};

	// OPERATIONS
	const {lastFrame} = render(
		React.createElement(TimetableGrid, {
			data: sampleData,
			isLoading: false,
			favoriteIssues: [],
			config: testConfig,
		}),
	);

	// SPECIFIC VALUE COMPARISONS
	t.true(
		lastFrame()!.includes(expectedGlobalAlias1),
		'Should display global alias "Dev Work" for DEF-2456',
	);
	t.true(
		lastFrame()!.includes(expectedGlobalAlias2),
		'Should display global alias "API Task" for ABC-5419',
	);
	t.false(
		lastFrame()!.includes(expectedIssueKey1),
		'Should not display original key DEF-2456 when global alias is set',
	);
	t.false(
		lastFrame()!.includes(expectedIssueKey2),
		'Should not display original key ABC-5419 when global alias is set',
	);
});

test('TimetableGrid prefers global aliases over favorite aliases', t => {
	// EXPLICIT TEST DATA
	const expectedIssueKey = 'DEF-2456';
	const expectedGlobalAlias = 'Global Alias';
	const expectedFavoriteAlias = 'Favorite Alias';

	// Create test data
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-18'),
				totalHours: 8,
				issues: [
					WorklogSummary.create({
						issueKey: IssueKey.fromString(expectedIssueKey),
						issueSummary: 'Test issue',
						duration: Duration.fromHours(8),
					}),
				],
			},
		],
		weekTotal: 8,
	};

	// Create favorite with alias
	const testFavorites: FavoriteIssue[] = [
		{
			key: IssueKey.fromString(expectedIssueKey),
			alias: expectedFavoriteAlias,
		},
	];

	// Create config with both global and favorite aliases
	const testConfig: JiraConfig = {
		jiraUrl: 'https://test-jira.com',
		username: 'testuser',
		apiToken: 'test-token',
		aliases: {
			[expectedIssueKey]: expectedGlobalAlias,
		},
		favorites: testFavorites,
	};

	// OPERATIONS
	const {lastFrame} = render(
		React.createElement(TimetableGrid, {
			data: sampleData,
			isLoading: false,
			favoriteIssues: testFavorites,
			config: testConfig,
		}),
	);

	// SPECIFIC VALUE COMPARISONS
	t.true(
		lastFrame()!.includes(expectedGlobalAlias),
		'Should display global alias when both global and favorite aliases exist',
	);
	t.false(
		lastFrame()!.includes(expectedFavoriteAlias),
		'Should not display favorite alias when global alias takes precedence',
	);
	t.false(
		lastFrame()!.includes(expectedIssueKey),
		'Should not display original key when alias is set',
	);
});

test('TimetableGrid falls back to favorite alias when no global alias exists', t => {
	// EXPLICIT TEST DATA
	const expectedIssueKey = 'DEF-2456';
	const expectedFavoriteAlias = 'Favorite Work';

	// Create test data
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-18'),
				totalHours: 8,
				issues: [
					WorklogSummary.create({
						issueKey: IssueKey.fromString(expectedIssueKey),
						issueSummary: 'Test issue',
						duration: Duration.fromHours(8),
					}),
				],
			},
		],
		weekTotal: 8,
	};

	// Create favorite with alias
	const testFavorites: FavoriteIssue[] = [
		{
			key: IssueKey.fromString(expectedIssueKey),
			alias: expectedFavoriteAlias,
		},
	];

	// Create config with NO global aliases but with favorites
	const testConfig: JiraConfig = {
		jiraUrl: 'https://test-jira.com',
		username: 'testuser',
		apiToken: 'test-token',
		favorites: testFavorites,
		// No aliases property - should fall back to favorite alias
	};

	// OPERATIONS
	const {lastFrame} = render(
		React.createElement(TimetableGrid, {
			data: sampleData,
			isLoading: false,
			favoriteIssues: testFavorites,
			config: testConfig,
		}),
	);

	// SPECIFIC VALUE COMPARISONS
	t.true(
		lastFrame()!.includes(expectedFavoriteAlias),
		'Should display favorite alias when no global alias exists',
	);
	t.false(
		lastFrame()!.includes(expectedIssueKey),
		'Should not display original key when favorite alias is set',
	);
});

test('TimetableGrid shows original key when no aliases are configured', t => {
	// EXPLICIT TEST DATA
	const expectedIssueKey = 'DEF-2456';

	// Create test data
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-18'),
				totalHours: 8,
				issues: [
					WorklogSummary.create({
						issueKey: IssueKey.fromString(expectedIssueKey),
						issueSummary: 'Issue without aliases',
						duration: Duration.fromHours(8),
					}),
				],
			},
		],
		weekTotal: 8,
	};

	// Create config with no aliases
	const testConfig: JiraConfig = {
		jiraUrl: 'https://test-jira.com',
		username: 'testuser',
		apiToken: 'test-token',
		// No aliases or favorites with aliases
	};

	// OPERATIONS
	const {lastFrame} = render(
		React.createElement(TimetableGrid, {
			data: sampleData,
			isLoading: false,
			favoriteIssues: [],
			config: testConfig,
		}),
	);

	// SPECIFIC VALUE COMPARISONS
	t.true(
		lastFrame()!.includes(expectedIssueKey),
		'Should display original key when no aliases are configured',
	);
});
