import test from 'ava';
import {normalizeSlidingWindowConfig} from '../../../../jira-client.js';
import type {JiraConfig} from '../../../../jira-client.js';
import {
	setupBasicTest,
	setupJqlQueryCapture,
} from '../helpers/setup-utilities.js';
import {
	createMockIssue,
	createMockWorklog,
	createEmptySearchResponse,
	createSearchResponseWithIssues,
	createEmptyWorklogResponse,
	createWorklogResponseWithWorklogs,
	getStandardTestDates,
} from '../helpers/test-data-builders.js';
import {
	assertSingleDayResult,
	assertIssueInResult,
	assertJqlQueriesCount,
	assertDateInJqlQuery,
	assertLookbackDateCaptured,
} from '../helpers/assertion-helpers.js';

test('WeeklyWorklogSummaryUseCase includes sliding window issues', async t => {
	const {client, useCase} = setupBasicTest();
	const jqlQueries: string[] = [];

	const {weekRange} = getStandardTestDates();
	const slidingWindowConfig = {past: 10, future: 0}; // Look back 10 days

	let capturedWindowStartDate = '';

	// Mock search for current week and recent lookback
	client.searchIssuesWithWorklogs = async jql => {
		jqlQueries.push(jql);

		// First call is for current week
		if (jql.includes('2024-10-14')) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return createEmptySearchResponse() as any;
		}

		// Second call is for recent lookback period - capture the actual date used
		if (jql.includes('worklogDate >=')) {
			const match = /worklogDate >= "([^"]+)"/.exec(jql);
			if (match) {
				capturedWindowStartDate = match[1]!;
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return createSearchResponseWithIssues([
				createMockIssue({
					id: '263906',
					key: 'SLIDING-123',
					summary: 'Recent issue from last week',
				}),
			]) as any;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return createEmptySearchResponse() as any;
	};

	// Mock worklog response for the recent issue (but no worklogs in current week)
	client.getIssueWorklogs = async issueKey => {
		const issueKeyString =
			typeof issueKey === 'string' ? issueKey : issueKey.toString();
		if (issueKeyString === 'SLIDING-123') {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return createWorklogResponseWithWorklogs([
				createMockWorklog({
					id: '111111',
					issueId: '263906',
					started: '2024-10-10T08:00:00.000+0200', // Before current week
					timeSpentSeconds: 14_400, // 4 hours
				}),
			]) as any;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return createEmptyWorklogResponse() as any;
	};

	const result = await useCase.execute({
		weekRange,
		userEmail: 'user1@example.com',
		slidingWindowConfig,
	});

	// Should have made two JQL queries: one for current week, one for recent lookback
	assertJqlQueriesCount(t, jqlQueries, 2, 'Should make two JQL queries');
	assertDateInJqlQuery(
		t,
		jqlQueries[0]!,
		'2024-10-14',
		'First query should be for current week',
	);

	// Verify that a lookback query was made and that it's reasonable
	assertLookbackDateCaptured(
		t,
		capturedWindowStartDate,
		weekRange.getStartOfWeekAsDate(),
		'Should have captured a lookback start date',
	);

	// The recent issue should be included as a 0h entry in the first day
	// since it has no worklogs in current week but was worked on recently
	assertSingleDayResult(t, result, 0, 1);
	assertIssueInResult(t, result, 'SLIDING-123', 0);
	t.is(result.weekTotal, 0);
});

test('WeeklyWorklogSummaryUseCase skips sliding window search when window size is 0', async t => {
	const {client, useCase} = setupBasicTest();
	const jqlQueries = setupJqlQueryCapture(client);

	const {weekRange} = getStandardTestDates();
	const slidingWindowConfig = {past: 0, future: 0}; // No sliding window

	client.searchIssuesWithWorklogs = async jql => {
		jqlQueries.push(jql);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return createEmptySearchResponse() as any;
	};

	await useCase.execute({
		weekRange,
		userEmail: 'user1@example.com',
		slidingWindowConfig,
	});

	// Should only make one JQL query for current week
	assertJqlQueriesCount(t, jqlQueries, 1, 'Should only make one JQL query');
	assertDateInJqlQuery(
		t,
		jqlQueries[0]!,
		'2024-10-14',
		'Should query current week',
	);
});

test('WeeklyWorklogSummaryUseCase makes sliding window search even with small window periods', async t => {
	const {client, useCase} = setupBasicTest();
	const jqlQueries = setupJqlQueryCapture(client);

	const {weekRange} = getStandardTestDates();
	const slidingWindowConfig = {past: 1, future: 0}; // 1 day window back from week start = Oct 13

	client.searchIssuesWithWorklogs = async jql => {
		jqlQueries.push(jql);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return createEmptySearchResponse() as any;
	};

	await useCase.execute({
		weekRange,
		userEmail: 'user1@example.com',
		slidingWindowConfig,
	});

	// Should make two JQL queries: one for current week, one for sliding window
	// (1 day back from Oct 14 = Oct 13, so sliding window period is Oct 13)
	assertJqlQueriesCount(t, jqlQueries, 2, 'Should make two JQL queries');
	assertDateInJqlQuery(
		t,
		jqlQueries[0]!,
		'2024-10-14',
		'First query should be for current week',
	);
	assertDateInJqlQuery(
		t,
		jqlQueries[1]!,
		'2024-10-13',
		'Second query should be for sliding window',
	);
});

test('normalizeSlidingWindowConfig handles configuration formats', t => {
	// Test object format (bidirectional support)
	const objectConfig: JiraConfig = {
		jiraUrl: 'test',
		username: 'test',
		apiToken: 'test',
		slidingWindowDays: {past: 14, future: 7},
	};
	let normalized = normalizeSlidingWindowConfig(objectConfig);
	t.is(normalized.past, 14);
	t.is(normalized.future, 7);

	// Test default when nothing is configured
	const emptyConfig: JiraConfig = {
		jiraUrl: 'test',
		username: 'test',
		apiToken: 'test',
	};
	normalized = normalizeSlidingWindowConfig(emptyConfig);
	t.is(normalized.past, 7);
	t.is(normalized.future, 0);
});
