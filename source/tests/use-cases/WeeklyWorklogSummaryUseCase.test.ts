import test from 'ava';
import {WeeklyWorklogSummaryUseCase} from '../../use-cases/WeeklyWorklogSummaryUseCase.js';
import {JiraClient, normalizeSlidingWindowConfig} from '../../jira-client.js';
import type {JiraConfig} from '../../jira-client.js';

const mockConfig: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token-123',
};

function createMockJiraClient(): JiraClient {
	return new JiraClient(mockConfig);
}

test('WeeklyWorklogSummaryUseCase builds correct JQL query', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekStart = new Date('2024-10-14T00:00:00.000Z'); // Monday
	const weekEnd = new Date('2024-10-20T23:59:59.999Z'); // Sunday

	// Mock the methods
	let capturedJql = '';
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});
	client.searchIssuesWithWorklogs = async jql => {
		capturedJql = jql;
		return {issues: [], startAt: 0, maxResults: 50, total: 0};
	};

	await useCase.execute(weekStart, weekEnd);

	t.is(
		capturedJql,
		'worklogAuthor = currentUser() AND worklogDate >= "2024-10-14" AND worklogDate <= "2024-10-20"',
	);
});

test('WeeklyWorklogSummaryUseCase aggregates worklogs by day', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekStart = new Date('2024-10-14T00:00:00.000Z');
	const weekEnd = new Date('2024-10-27T23:59:59.999Z');

	// Mock current user
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	// Mock search results
	client.searchIssuesWithWorklogs = async () => ({
		issues: [
			{
				id: '263906',
				key: 'TEST-117',
				fields: {
					summary: 'Test Issue Summary',
					status: {name: 'In Progress', statusCategory: {name: 'In Progress'}},
					issuetype: {name: 'Task', iconUrl: ''},
					priority: {name: 'Medium', iconUrl: ''},
					assignee: {
						displayName: 'Test User',
						emailAddress: 'user1@example.com',
					},
					created: '2024-10-01T10:00:00.000Z',
					updated: '2024-10-19T15:30:00.000Z',
				},
			},
		],
		startAt: 0,
		maxResults: 50,
		total: 1,
	});

	// Mock worklog response
	client.getIssueWorklogs = async () => ({
		startAt: 0,
		maxResults: 3,
		total: 3,
		worklogs: [
			{
				id: '111111',
				issueId: '263906',
				author: {
					displayName: 'Test User',
					emailAddress: 'user1@example.com',
				},
				comment: '',
				started: '2024-10-19T08:00:00.000+0200',
				timeSpentSeconds: 14_400, // 4 hours
			},
			{
				id: '111112',
				issueId: '263906',
				author: {
					displayName: 'Test User',
					emailAddress: 'user1@example.com',
				},
				comment: '',
				started: '2024-10-19T12:00:00.000+0200',
				timeSpentSeconds: 3600, // 1 hour
			},
			{
				id: '111113',
				issueId: '263906',
				author: {
					displayName: 'Test User',
					emailAddress: 'user1@example.com',
				},
				comment: '',
				started: '2024-10-22T09:00:00.000+0200',
				timeSpentSeconds: 7200, // 2 hours
			},
		],
	});

	const result = await useCase.execute(weekStart, weekEnd);

	// Should have 2 daily summaries (Oct 19 and Oct 22)
	t.is(result.dailySummaries.length, 2);

	// Check first day (Oct 19)
	const firstDay = result.dailySummaries[0]!;
	t.is(firstDay.totalHours, 5); // 4 + 1 hours
	t.is(firstDay.issues.length, 1); // Aggregated into single entry
	t.is(firstDay.issues[0]!.issueKey, 'TEST-117');
	t.is(firstDay.issues[0]!.hours, 5); // Combined hours

	// Check second day (Oct 22)
	const secondDay = result.dailySummaries[1]!;
	t.is(secondDay.totalHours, 2);
	t.is(secondDay.issues.length, 1);
	t.is(secondDay.issues[0]!.issueKey, 'TEST-117');
	t.is(secondDay.issues[0]!.hours, 2);

	// Check week total
	t.is(result.weekTotal, 7);
});

test('WeeklyWorklogSummaryUseCase filters by current user email', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekStart = new Date('2024-10-14T00:00:00.000Z');
	const weekEnd = new Date('2024-10-20T23:59:59.999Z');

	// Mock current user
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	// Mock search results
	client.searchIssuesWithWorklogs = async () => ({
		issues: [
			{
				id: '263906',
				key: 'TEST-117',
				fields: {
					summary: 'Test Issue Summary',
					status: {name: 'In Progress', statusCategory: {name: 'In Progress'}},
					issuetype: {name: 'Task', iconUrl: ''},
					priority: {name: 'Medium', iconUrl: ''},
					assignee: {
						displayName: 'Test User',
						emailAddress: 'user1@example.com',
					},
					created: '2024-10-01T10:00:00.000Z',
					updated: '2024-10-19T15:30:00.000Z',
				},
			},
		],
		startAt: 0,
		maxResults: 50,
		total: 1,
	});

	// Mock worklog response with different users
	client.getIssueWorklogs = async () => ({
		startAt: 0,
		maxResults: 2,
		total: 2,
		worklogs: [
			{
				id: '111111',
				issueId: '263906',
				author: {
					displayName: 'Test User 1',
					emailAddress: 'user1@example.com', // Current user
				},
				comment: '',
				started: '2024-10-19T08:00:00.000+0200',
				timeSpentSeconds: 3600, // 1 hour
			},
			{
				id: '111112',
				issueId: '263906',
				author: {
					displayName: 'Test User 2',
					emailAddress: 'user2@example.com', // Different user
				},
				comment: '',
				started: '2024-10-19T12:00:00.000+0200',
				timeSpentSeconds: 3600, // 1 hour
			},
		],
	});

	const result = await useCase.execute(weekStart, weekEnd);

	// Should only include the current user's worklog
	t.is(result.dailySummaries.length, 1);
	t.is(result.dailySummaries[0]!.totalHours, 1);
	t.is(result.dailySummaries[0]!.issues.length, 1);
	t.is(result.weekTotal, 1);
});

test('WeeklyWorklogSummaryUseCase filters by date range', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekStart = new Date('2024-10-14T00:00:00.000Z');
	const weekEnd = new Date('2024-10-20T23:59:59.999Z');

	// Mock current user
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	// Mock search results
	client.searchIssuesWithWorklogs = async () => ({
		issues: [
			{
				id: '263906',
				key: 'TEST-117',
				fields: {
					summary: 'Test Issue Summary',
					status: {name: 'In Progress', statusCategory: {name: 'In Progress'}},
					issuetype: {name: 'Task', iconUrl: ''},
					priority: {name: 'Medium', iconUrl: ''},
					assignee: {
						displayName: 'Test User',
						emailAddress: 'user1@example.com',
					},
					created: '2024-10-01T10:00:00.000Z',
					updated: '2024-10-19T15:30:00.000Z',
				},
			},
		],
		startAt: 0,
		maxResults: 50,
		total: 1,
	});

	// Mock worklog response with dates inside and outside range
	client.getIssueWorklogs = async () => ({
		startAt: 0,
		maxResults: 3,
		total: 3,
		worklogs: [
			{
				id: '111111',
				issueId: '263906',
				author: {
					displayName: 'Test User',
					emailAddress: 'user1@example.com',
				},
				comment: '',
				started: '2024-10-19T08:00:00.000+0200', // Inside range
				timeSpentSeconds: 3600, // 1 hour
			},
			{
				id: '111112',
				issueId: '263906',
				author: {
					displayName: 'Test User',
					emailAddress: 'user1@example.com',
				},
				comment: '',
				started: '2024-10-10T12:00:00.000+0200', // Outside range (before)
				timeSpentSeconds: 3600, // 1 hour
			},
			{
				id: '111113',
				issueId: '263906',
				author: {
					displayName: 'Test User',
					emailAddress: 'user1@example.com',
				},
				comment: '',
				started: '2024-10-25T09:00:00.000+0200', // Outside range (after)
				timeSpentSeconds: 7200, // 2 hours
			},
		],
	});

	const result = await useCase.execute(weekStart, weekEnd);

	// Should only include worklogs within the date range
	t.is(result.dailySummaries.length, 1);
	t.is(result.dailySummaries[0]!.totalHours, 1);
	t.is(result.weekTotal, 1);
});

test('WeeklyWorklogSummaryUseCase handles empty results', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekStart = new Date('2024-10-14T00:00:00.000Z');
	const weekEnd = new Date('2024-10-20T23:59:59.999Z');

	// Mock current user
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	// Mock empty search results
	client.searchIssuesWithWorklogs = async () => ({
		issues: [],
		startAt: 0,
		maxResults: 50,
		total: 0,
	});

	const result = await useCase.execute(weekStart, weekEnd);

	t.is(result.dailySummaries.length, 0);
	t.is(result.weekTotal, 0);
	t.deepEqual(result.weekStart, weekStart);
	t.deepEqual(result.weekEnd, weekEnd);
});

test('WeeklyWorklogSummaryUseCase converts time correctly', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekStart = new Date('2024-10-14T00:00:00.000Z');
	const weekEnd = new Date('2024-10-20T23:59:59.999Z');

	// Mock current user
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	// Mock search results
	client.searchIssuesWithWorklogs = async () => ({
		issues: [
			{
				id: '263906',
				key: 'TEST-117',
				fields: {
					summary: 'Test Issue Summary',
					status: {name: 'In Progress', statusCategory: {name: 'In Progress'}},
					issuetype: {name: 'Task', iconUrl: ''},
					priority: {name: 'Medium', iconUrl: ''},
					assignee: {
						displayName: 'Test User',
						emailAddress: 'user1@example.com',
					},
					created: '2024-10-01T10:00:00.000Z',
					updated: '2024-10-19T15:30:00.000Z',
				},
			},
		],
		startAt: 0,
		maxResults: 50,
		total: 1,
	});

	// Mock worklog response with various time values
	client.getIssueWorklogs = async () => ({
		startAt: 0,
		maxResults: 3,
		total: 3,
		worklogs: [
			{
				id: '111111',
				issueId: '263906',
				author: {
					displayName: 'Test User',
					emailAddress: 'user1@example.com',
				},
				comment: '',
				started: '2024-10-19T08:00:00.000+0200',
				timeSpentSeconds: 3600, // 1 hour
			},
			{
				id: '111112',
				issueId: '263906',
				author: {
					displayName: 'Test User',
					emailAddress: 'user1@example.com',
				},
				comment: '',
				started: '2024-10-19T12:00:00.000+0200',
				timeSpentSeconds: 1800, // 0.5 hours
			},
			{
				id: '111113',
				issueId: '263906',
				author: {
					displayName: 'Test User',
					emailAddress: 'user1@example.com',
				},
				comment: '',
				started: '2024-10-19T15:00:00.000+0200',
				timeSpentSeconds: 9000, // 2.5 hours
			},
		],
	});

	const result = await useCase.execute(weekStart, weekEnd);

	t.is(result.dailySummaries.length, 1);
	t.is(result.dailySummaries[0]!.totalHours, 4); // 1 + 0.5 + 2.5
	t.is(result.dailySummaries[0]!.issues.length, 1); // Aggregated into single entry
	t.is(result.dailySummaries[0]!.issues[0]!.hours, 4); // Combined hours
	t.is(result.weekTotal, 4);
});

test('WeeklyWorklogSummaryUseCase includes favorite issues without worklogs', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekStart = new Date('2024-10-14T00:00:00.000Z');
	const weekEnd = new Date('2024-10-20T23:59:59.999Z');

	// Mock current user
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	// Mock search results - only issues with worklogs
	client.searchIssuesWithWorklogs = async () => ({
		startAt: 0,
		maxResults: 50,
		total: 1,
		issues: [
			{
				id: '263906',
				key: 'TEST-117',
				fields: {
					summary: 'Issue with worklog',
					status: {name: 'In Progress', statusCategory: {name: 'In Progress'}},
					issuetype: {name: 'Task', iconUrl: ''},
					priority: {name: 'Medium', iconUrl: ''},
					assignee: {
						displayName: 'Test User',
						emailAddress: 'user1@example.com',
					},
					description: '',
					created: '2024-01-01T00:00:00.000Z',
					updated: '2024-01-01T00:00:00.000Z',
				},
			},
		],
	});

	// Mock favorite issues fetch - includes an issue without worklogs
	client.fetchFavoriteIssues = async _favorites => [
		{
			id: '999999',
			key: 'FAV-123',
			fields: {
				summary: 'Favorite issue without worklog',
				status: {name: 'Open', statusCategory: {name: 'To Do'}},
				issuetype: {name: 'Task', iconUrl: ''},
				priority: {name: 'Medium', iconUrl: ''},
				assignee: {displayName: 'Test User', emailAddress: 'user1@example.com'},
				description: '',
				created: '2024-01-01T00:00:00.000Z',
				updated: '2024-01-01T00:00:00.000Z',
			},
		},
		{
			id: '263906',
			key: 'TEST-117',
			fields: {
				summary: 'Issue with worklog',
				status: {name: 'In Progress', statusCategory: {name: 'In Progress'}},
				issuetype: {name: 'Task', iconUrl: ''},
				priority: {name: 'Medium', iconUrl: ''},
				assignee: {displayName: 'Test User', emailAddress: 'user1@example.com'},
				description: '',
				created: '2024-01-01T00:00:00.000Z',
				updated: '2024-01-01T00:00:00.000Z',
			},
		},
	];

	// Mock worklog responses
	client.getIssueWorklogs = async issueKey => {
		if (issueKey === 'TEST-117') {
			return {
				startAt: 0,
				maxResults: 20,
				total: 1,
				worklogs: [
					{
						id: '111111',
						issueId: '263906',
						author: {
							displayName: 'Test User',
							emailAddress: 'user1@example.com',
						},
						comment: '',
						started: '2024-10-19T12:00:00.000+0200',
						timeSpentSeconds: 3600, // 1 hour
					},
				],
			};
		}

		if (issueKey === 'FAV-123') {
			// No worklogs for this favorite issue
			return {
				startAt: 0,
				maxResults: 20,
				total: 0,
				worklogs: [],
			};
		}

		return {startAt: 0, maxResults: 20, total: 0, worklogs: []};
	};

	const favoriteIssues = [
		{key: 'FAV-123', defaultTime: '4h'},
		{key: 'TEST-117', defaultTime: '2h'},
	];

	const result = await useCase.execute(
		weekStart,
		weekEnd,
		'user1@example.com',
		favoriteIssues,
	);

	// Should include both issues: one with worklog and one favorite without worklog
	t.is(result.dailySummaries.length, 1);
	t.is(result.dailySummaries[0]!.totalHours, 1); // Only from TEST-117
	t.is(result.dailySummaries[0]!.issues.length, 2); // TEST-117 with worklog + FAV-123 with 0 hours

	// Find the issues in the results
	const {issues} = result.dailySummaries[0]!;
	const testIssue = issues.find(issue => issue.issueKey === 'TEST-117');
	const favIssue = issues.find(issue => issue.issueKey === 'FAV-123');

	t.truthy(testIssue, 'TEST-117 should be present');
	t.truthy(favIssue, 'FAV-123 should be present');
	t.is(testIssue!.hours, 1, 'TEST-117 should have 1 hour');
	t.is(favIssue!.hours, 0, 'FAV-123 should have 0 hours');
	t.is(
		favIssue!.issueSummary,
		'Favorite issue without worklog',
		'FAV-123 should have correct summary',
	);

	t.is(result.weekTotal, 1);
});

test('WeeklyWorklogSummaryUseCase includes sliding window issues', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekStart = new Date('2024-10-14T00:00:00.000Z'); // Monday
	const weekEnd = new Date('2024-10-20T23:59:59.999Z'); // Sunday
	const slidingWindowConfig = {past: 10, future: 0}; // Look back 10 days

	// Mock current user
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	const jqlQueries: string[] = [];
	let capturedWindowStartDate = '';

	// Mock search for current week and recent lookback
	client.searchIssuesWithWorklogs = async jql => {
		jqlQueries.push(jql);

		// First call is for current week
		if (jql.includes('2024-10-14')) {
			return {
				issues: [],
				startAt: 0,
				maxResults: 50,
				total: 0,
			};
		}

		// Second call is for recent lookback period - capture the actual date used
		if (jql.includes('worklogDate >=')) {
			const match = jql.match(/worklogDate >= "([^"]+)"/);
			if (match) {
				capturedWindowStartDate = match[1]!;
			}

			return {
				issues: [
					{
						id: '263906',
						key: 'SLIDING-123',
						fields: {
							summary: 'Recent issue from last week',
							status: {
								name: 'In Progress',
								statusCategory: {name: 'In Progress'},
							},
							issuetype: {name: 'Task', iconUrl: ''},
							priority: {name: 'Medium', iconUrl: ''},
							assignee: {
								displayName: 'Test User',
								emailAddress: 'user1@example.com',
							},
							created: '2024-10-01T10:00:00.000Z',
							updated: '2024-10-10T15:30:00.000Z',
						},
					},
				],
				startAt: 0,
				maxResults: 50,
				total: 1,
			};
		}

		return {issues: [], startAt: 0, maxResults: 50, total: 0};
	};

	// Mock worklog response for the recent issue (but no worklogs in current week)
	client.getIssueWorklogs = async issueKey => {
		if (issueKey === 'SLIDING-123') {
			return {
				startAt: 0,
				maxResults: 20,
				total: 1,
				worklogs: [
					{
						id: '111111',
						issueId: '263906',
						author: {
							displayName: 'Test User',
							emailAddress: 'user1@example.com',
						},
						comment: '',
						started: '2024-10-10T08:00:00.000+0200', // Before current week
						timeSpentSeconds: 14_400, // 4 hours
					},
				],
			};
		}

		return {startAt: 0, maxResults: 20, total: 0, worklogs: []};
	};

	const result = await useCase.execute(
		weekStart,
		weekEnd,
		'user1@example.com',
		undefined,
		slidingWindowConfig,
	);

	// Should have made two JQL queries: one for current week, one for recent lookback
	t.is(jqlQueries.length, 2);
	t.true(jqlQueries[0]!.includes('2024-10-14')); // Current week

	// Verify that a lookback query was made and that it's reasonable
	t.truthy(
		capturedWindowStartDate,
		'Should have captured a lookback start date',
	);

	// The lookback start should be before the week start
	const lookbackStart = new Date(capturedWindowStartDate);
	t.true(
		lookbackStart < weekStart,
		'Lookback start should be before the current week start',
	);

	// The recent issue should be included as a 0h entry in the first day
	// since it has no worklogs in current week but was worked on recently
	t.is(result.dailySummaries.length, 1);
	t.is(result.dailySummaries[0]!.totalHours, 0);
	t.is(result.dailySummaries[0]!.issues.length, 1);
	t.is(result.dailySummaries[0]!.issues[0]!.issueKey, 'SLIDING-123');
	t.is(result.dailySummaries[0]!.issues[0]!.hours, 0);
	t.is(result.weekTotal, 0);
});

test('WeeklyWorklogSummaryUseCase skips sliding window search when window size is 0', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekStart = new Date('2024-10-14T00:00:00.000Z');
	const weekEnd = new Date('2024-10-20T23:59:59.999Z');
	const slidingWindowConfig = {past: 0, future: 0}; // No sliding window

	// Mock current user
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	const jqlQueries: string[] = [];
	client.searchIssuesWithWorklogs = async jql => {
		jqlQueries.push(jql);
		return {issues: [], startAt: 0, maxResults: 50, total: 0};
	};

	await useCase.execute(
		weekStart,
		weekEnd,
		'user1@example.com',
		undefined,
		slidingWindowConfig,
	);

	// Should only make one JQL query for current week
	t.is(jqlQueries.length, 1);
	t.true(jqlQueries[0]!.includes('2024-10-14'));
});

test('WeeklyWorklogSummaryUseCase makes sliding window search even with small window periods', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekStart = new Date('2024-10-14T00:00:00.000Z'); // Monday
	const weekEnd = new Date('2024-10-20T23:59:59.999Z'); // Sunday
	const slidingWindowConfig = {past: 1, future: 0}; // 1 day window back from week start = Oct 13

	// Mock current user
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	const jqlQueries: string[] = [];
	client.searchIssuesWithWorklogs = async jql => {
		jqlQueries.push(jql);
		return {issues: [], startAt: 0, maxResults: 50, total: 0};
	};

	await useCase.execute(
		weekStart,
		weekEnd,
		'user1@example.com',
		undefined,
		slidingWindowConfig,
	);

	// Should make two JQL queries: one for current week, one for sliding window
	// (1 day back from Oct 14 = Oct 13, so sliding window period is Oct 13)
	t.is(jqlQueries.length, 2);
	t.true(jqlQueries[0]!.includes('2024-10-14')); // Current week
	t.true(jqlQueries[1]!.includes('2024-10-13')); // Sliding window
});

test('WeeklyWorklogSummaryUseCase shows sliding window issues as 0h entries when not in current week or favorites', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekStart = new Date('2024-10-14T00:00:00.000Z'); // Monday
	const weekEnd = new Date('2024-10-20T23:59:59.999Z'); // Sunday
	const slidingWindowConfig = {past: 14, future: 0}; // Look back 14 days

	// Mock current user
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	// Mock search for current week - return one issue with worklog
	client.searchIssuesWithWorklogs = async jql => {
		// Current week query
		if (jql.includes('2024-10-14')) {
			return {
				issues: [
					{
						id: '111111',
						key: 'CURRENT-456',
						fields: {
							summary: 'Issue with current week worklog',
							status: {
								name: 'In Progress',
								statusCategory: {name: 'In Progress'},
							},
							issuetype: {name: 'Task', iconUrl: ''},
							priority: {name: 'Medium', iconUrl: ''},
							assignee: {
								displayName: 'Test User',
								emailAddress: 'user1@example.com',
							},
							created: '2024-10-01T10:00:00.000Z',
							updated: '2024-10-14T15:30:00.000Z',
						},
					},
				],
				startAt: 0,
				maxResults: 50,
				total: 1,
			};
		}

		// Sliding window query
		if (jql.includes('worklogDate >=')) {
			return {
				issues: [
					{
						id: '222222',
						key: 'SLIDING-123',
						fields: {
							summary: 'Recent issue from last week',
							status: {
								name: 'In Progress',
								statusCategory: {name: 'In Progress'},
							},
							issuetype: {name: 'Task', iconUrl: ''},
							priority: {name: 'Medium', iconUrl: ''},
							assignee: {
								displayName: 'Test User',
								emailAddress: 'user1@example.com',
							},
							created: '2024-10-01T10:00:00.000Z',
							updated: '2024-10-10T15:30:00.000Z',
						},
					},
					{
						id: '333333',
						key: 'SLIDING-789',
						fields: {
							summary: 'Another sliding window issue',
							status: {name: 'Done', statusCategory: {name: 'Done'}},
							issuetype: {name: 'Bug', iconUrl: ''},
							priority: {name: 'High', iconUrl: ''},
							assignee: {
								displayName: 'Test User',
								emailAddress: 'user1@example.com',
							},
							created: '2024-09-01T10:00:00.000Z',
							updated: '2024-10-05T15:30:00.000Z',
						},
					},
				],
				startAt: 0,
				maxResults: 50,
				total: 2,
			};
		}

		return {issues: [], startAt: 0, maxResults: 50, total: 0};
	};

	// Mock favorite issues - one overlaps with recent, one doesn't
	client.fetchFavoriteIssues = async _favorites => [
		{
			id: '333333',
			key: 'SLIDING-789', // This one is both recent and favorite
			fields: {
				summary: 'Another sliding window issue',
				status: {name: 'Done', statusCategory: {name: 'Done'}},
				issuetype: {name: 'Bug', iconUrl: ''},
				priority: {name: 'High', iconUrl: ''},
				assignee: {displayName: 'Test User', emailAddress: 'user1@example.com'},
				description: '',
				created: '2024-09-01T10:00:00.000Z',
				updated: '2024-10-05T15:30:00.000Z',
			},
		},
		{
			id: '444444',
			key: 'FAV-999',
			fields: {
				summary: 'Favorite issue without recent work',
				status: {name: 'Open', statusCategory: {name: 'To Do'}},
				issuetype: {name: 'Task', iconUrl: ''},
				priority: {name: 'Medium', iconUrl: ''},
				assignee: {displayName: 'Test User', emailAddress: 'user1@example.com'},
				description: '',
				created: '2024-08-01T10:00:00.000Z',
				updated: '2024-08-15T15:30:00.000Z',
			},
		},
	];

	// Mock worklog responses
	client.getIssueWorklogs = async issueKey => {
		if (issueKey === 'CURRENT-456') {
			return {
				startAt: 0,
				maxResults: 20,
				total: 1,
				worklogs: [
					{
						id: '111111',
						issueId: '111111',
						author: {
							displayName: 'Test User',
							emailAddress: 'user1@example.com',
						},
						comment: 'Current week work',
						started: '2024-10-15T08:00:00.000+0200', // Tuesday of current week
						timeSpentSeconds: 7200, // 2 hours
					},
				],
			};
		}

		// All other issues have no worklogs in current week
		return {startAt: 0, maxResults: 20, total: 0, worklogs: []};
	};

	const favoriteIssues = [
		{key: 'SLIDING-789', defaultTime: '2h'}, // Overlaps with recent
		{key: 'FAV-999', defaultTime: '1h'}, // Favorite only
	];

	const result = await useCase.execute(
		weekStart,
		weekEnd,
		'user1@example.com',
		favoriteIssues,
		slidingWindowConfig,
	);

	// Should have one day with all issues
	t.is(result.dailySummaries.length, 1);

	const firstDay = result.dailySummaries[0]!;
	t.is(firstDay.totalHours, 2); // Only from CURRENT-456

	// Should have 4 issues total:
	// 1. CURRENT-456 with 2h (has current week worklog)
	// 2. SLIDING-123 with 0h (recent, not favorite, no current worklog)
	// 3. SLIDING-789 with 0h (recent AND favorite, but no current worklog - shown as favorite)
	// 4. FAV-999 with 0h (favorite, no current worklog)
	t.is(firstDay.issues.length, 4);

	// Find issues by key
	const currentIssue = firstDay.issues.find(
		issue => issue.issueKey === 'CURRENT-456',
	);
	const recentIssue = firstDay.issues.find(
		issue => issue.issueKey === 'SLIDING-123',
	);
	const recentFavoriteIssue = firstDay.issues.find(
		issue => issue.issueKey === 'SLIDING-789',
	);
	const favoriteIssue = firstDay.issues.find(
		issue => issue.issueKey === 'FAV-999',
	);

	// Verify all issues are present
	t.truthy(currentIssue, 'CURRENT-456 should be present');
	t.truthy(recentIssue, 'SLIDING-123 should be present');
	t.truthy(recentFavoriteIssue, 'SLIDING-789 should be present');
	t.truthy(favoriteIssue, 'FAV-999 should be present');

	// Verify hours
	t.is(currentIssue!.hours, 2, 'CURRENT-456 should have 2 hours');
	t.is(recentIssue!.hours, 0, 'SLIDING-123 should have 0 hours');
	t.is(recentFavoriteIssue!.hours, 0, 'SLIDING-789 should have 0 hours');
	t.is(favoriteIssue!.hours, 0, 'FAV-999 should have 0 hours');

	// Verify week total
	t.is(result.weekTotal, 2);
});

test('WeeklyWorklogSummaryUseCase sliding window issues are not duplicated when already in current week', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekStart = new Date('2024-10-14T00:00:00.000Z');
	const weekEnd = new Date('2024-10-20T23:59:59.999Z');
	const slidingWindowConfig = {past: 14, future: 0};

	// Mock current user
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	// Mock search - same issue appears in both current week and recent searches
	client.searchIssuesWithWorklogs = async jql => {
		const sharedIssue = {
			id: '111111',
			key: 'SHARED-123',
			fields: {
				summary: 'Issue worked on both recently and this week',
				status: {name: 'In Progress', statusCategory: {name: 'In Progress'}},
				issuetype: {name: 'Task', iconUrl: ''},
				priority: {name: 'Medium', iconUrl: ''},
				assignee: {
					displayName: 'Test User',
					emailAddress: 'user1@example.com',
				},
				created: '2024-10-01T10:00:00.000Z',
				updated: '2024-10-15T15:30:00.000Z',
			},
		};

		// Current week query - returns the shared issue
		if (jql.includes('2024-10-14')) {
			return {
				issues: [sharedIssue],
				startAt: 0,
				maxResults: 50,
				total: 1,
			};
		}

		// Sliding window query - returns the same issue
		if (jql.includes('worklogDate >=')) {
			return {
				issues: [sharedIssue],
				startAt: 0,
				maxResults: 50,
				total: 1,
			};
		}

		return {issues: [], startAt: 0, maxResults: 50, total: 0};
	};

	// Mock worklog response - issue has worklogs in current week
	client.getIssueWorklogs = async () => ({
		startAt: 0,
		maxResults: 20,
		total: 1,
		worklogs: [
			{
				id: '111111',
				issueId: '111111',
				author: {
					displayName: 'Test User',
					emailAddress: 'user1@example.com',
				},
				comment: 'Current week work',
				started: '2024-10-15T08:00:00.000+0200',
				timeSpentSeconds: 3600, // 1 hour
			},
		],
	});

	const result = await useCase.execute(
		weekStart,
		weekEnd,
		'user1@example.com',
		undefined,
		slidingWindowConfig,
	);

	// Should have one day with only one instance of the shared issue
	t.is(result.dailySummaries.length, 1);
	t.is(result.dailySummaries[0]!.issues.length, 1);
	t.is(result.dailySummaries[0]!.issues[0]!.issueKey, 'SHARED-123');
	t.is(result.dailySummaries[0]!.issues[0]!.hours, 1);
	t.is(result.weekTotal, 1);
});

test('WeeklyWorklogSummaryUseCase sliding window issues with very large window period', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekStart = new Date('2024-10-14T00:00:00.000Z');
	const weekEnd = new Date('2024-10-20T23:59:59.999Z');
	const slidingWindowConfig = {past: 365, future: 0}; // Look back a full year

	// Mock current user
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	let capturedWindowDates: string[] = [];

	// Mock search
	client.searchIssuesWithWorklogs = async jql => {
		// Capture the date range from the JQL query
		const dateMatch = jql.match(
			/worklogDate >= "([^"]+)" AND worklogDate <= "([^"]+)"/,
		);
		if (dateMatch) {
			capturedWindowDates = [dateMatch[1]!, dateMatch[2]!];
		}

		// Current week query
		if (jql.includes('2024-10-14')) {
			return {
				issues: [],
				startAt: 0,
				maxResults: 50,
				total: 0,
			};
		}

		// Sliding window query - return some old issues
		if (jql.includes('worklogDate >=')) {
			return {
				issues: [
					{
						id: '222222',
						key: 'OLD-456',
						fields: {
							summary: 'Very old issue from months ago',
							status: {name: 'Done', statusCategory: {name: 'Done'}},
							issuetype: {name: 'Bug', iconUrl: ''},
							priority: {name: 'Low', iconUrl: ''},
							assignee: {
								displayName: 'Test User',
								emailAddress: 'user1@example.com',
							},
							created: '2024-01-01T10:00:00.000Z',
							updated: '2024-01-15T15:30:00.000Z',
						},
					},
				],
				startAt: 0,
				maxResults: 50,
				total: 1,
			};
		}

		return {issues: [], startAt: 0, maxResults: 50, total: 0};
	};

	// Mock worklog response - no worklogs in current week
	client.getIssueWorklogs = async () => ({
		startAt: 0,
		maxResults: 20,
		total: 0,
		worklogs: [],
	});

	const result = await useCase.execute(
		weekStart,
		weekEnd,
		'user1@example.com',
		undefined,
		slidingWindowConfig,
	);

	// Verify the lookback period was calculated correctly (365 days before week start)
	t.is(capturedWindowDates.length, 2);
	const windowEnd = new Date(capturedWindowDates[1]!);

	// Should be exactly 365 days before week start (2024-10-14)
	// Use milliseconds calculation for large numbers to avoid setDate() month overflow issues
	const expectedWindowStart = new Date(
		weekStart.getTime() - slidingWindowConfig.past * 24 * 60 * 60 * 1000,
	);
	const actualLookbackStartDate = expectedWindowStart
		.toISOString()
		.split('T')[0];

	// Allow some tolerance for date calculation differences due to timezones
	const actualCapturedDate = new Date(capturedWindowDates[0]!);
	const expectedDate = new Date(actualLookbackStartDate!);
	const diffInDays = Math.abs(
		(actualCapturedDate.getTime() - expectedDate.getTime()) /
			(24 * 60 * 60 * 1000),
	);

	t.true(
		diffInDays <= 4, // Allow up to 4 days difference for timezone/DST issues
		`Expected lookback start around ${actualLookbackStartDate}, got ${String(
			capturedWindowDates[0],
		)} (${diffInDays} days difference)`,
	);

	// Lookback end should be the day before week start
	const expectedWindowEnd = new Date(weekStart.getTime() - 1);
	const endDiffInDays = Math.abs(
		(windowEnd.getTime() - expectedWindowEnd.getTime()) / (24 * 60 * 60 * 1000),
	);
	t.true(
		endDiffInDays <= 1, // Allow up to 1 day difference for timezone issues
		`Expected lookback end around ${
			expectedWindowEnd.toISOString().split('T')[0]
		}, got ${String(
			capturedWindowDates[1],
		)} (${endDiffInDays} days difference)`,
	);

	// Should have the old issue as 0h entry
	t.is(result.dailySummaries.length, 1);
	t.is(result.dailySummaries[0]!.issues.length, 1);
	t.is(result.dailySummaries[0]!.issues[0]!.issueKey, 'OLD-456');
	t.is(result.dailySummaries[0]!.issues[0]!.hours, 0);
});

test('WeeklyWorklogSummaryUseCase sliding window issues work correctly when current week has no issues', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekStart = new Date('2024-10-14T00:00:00.000Z');
	const weekEnd = new Date('2024-10-20T23:59:59.999Z');
	const slidingWindowConfig = {past: 7, future: 0};

	// Mock current user
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	// Mock search
	client.searchIssuesWithWorklogs = async jql => {
		// Current week query - no issues
		if (jql.includes('2024-10-14')) {
			return {
				issues: [],
				startAt: 0,
				maxResults: 50,
				total: 0,
			};
		}

		// Sliding window query - multiple recent issues
		if (jql.includes('worklogDate >=')) {
			return {
				issues: [
					{
						id: '111111',
						key: 'SLIDING-1',
						fields: {
							summary: 'Recent issue 1',
							status: {
								name: 'In Progress',
								statusCategory: {name: 'In Progress'},
							},
							issuetype: {name: 'Task', iconUrl: ''},
							priority: {name: 'Medium', iconUrl: ''},
							assignee: {
								displayName: 'Test User',
								emailAddress: 'user1@example.com',
							},
							created: '2024-10-01T10:00:00.000Z',
							updated: '2024-10-10T15:30:00.000Z',
						},
					},
					{
						id: '222222',
						key: 'SLIDING-2',
						fields: {
							summary: 'Recent issue 2',
							status: {name: 'Done', statusCategory: {name: 'Done'}},
							issuetype: {name: 'Bug', iconUrl: ''},
							priority: {name: 'High', iconUrl: ''},
							assignee: {
								displayName: 'Test User',
								emailAddress: 'user1@example.com',
							},
							created: '2024-10-02T10:00:00.000Z',
							updated: '2024-10-09T15:30:00.000Z',
						},
					},
				],
				startAt: 0,
				maxResults: 50,
				total: 2,
			};
		}

		return {issues: [], startAt: 0, maxResults: 50, total: 0};
	};

	// Mock no favorites
	client.fetchFavoriteIssues = async () => [];

	// Mock worklog response - no worklogs in current week for any issue
	client.getIssueWorklogs = async () => ({
		startAt: 0,
		maxResults: 20,
		total: 0,
		worklogs: [],
	});

	const result = await useCase.execute(
		weekStart,
		weekEnd,
		'user1@example.com',
		[], // No favorites
		slidingWindowConfig,
	);

	// Should create a first day with all recent issues as 0h entries
	t.is(result.dailySummaries.length, 1);
	t.is(result.dailySummaries[0]!.totalHours, 0);
	t.is(result.dailySummaries[0]!.issues.length, 2);

	// Check that both recent issues are present
	const issueKeys = new Set(
		result.dailySummaries[0]!.issues.map(issue => issue.issueKey),
	);
	t.true(issueKeys.has('SLIDING-1'));
	t.true(issueKeys.has('SLIDING-2'));

	// All should have 0 hours
	for (const issue of result.dailySummaries[0]!.issues) {
		t.is(issue.hours, 0);
	}

	t.is(result.weekTotal, 0);
});

test('WeeklyWorklogSummaryUseCase sliding window calculates from week start not today', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekStart = new Date('2024-10-14T00:00:00.000Z'); // Monday
	const weekEnd = new Date('2024-10-20T23:59:59.999Z'); // Sunday
	const slidingWindowConfig = {past: 10, future: 0};

	// Mock current user
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	let capturedWindowStart = '';

	// Mock search
	client.searchIssuesWithWorklogs = async jql => {
		// Current week query
		if (jql.includes('2024-10-14')) {
			return {
				issues: [],
				startAt: 0,
				maxResults: 50,
				total: 0,
			};
		}

		// Sliding window query - capture the start date
		if (jql.includes('worklogDate >=')) {
			const match = jql.match(/worklogDate >= "([^"]+)"/);
			if (match) {
				capturedWindowStart = match[1]!;
			}

			return {
				issues: [
					{
						id: '111111',
						key: 'WEEK-SLIDING',
						fields: {
							summary: 'Recent issue from before current week',
							status: {
								name: 'In Progress',
								statusCategory: {name: 'In Progress'},
							},
							issuetype: {name: 'Task', iconUrl: ''},
							priority: {name: 'Medium', iconUrl: ''},
							assignee: {
								displayName: 'Test User',
								emailAddress: 'user1@example.com',
							},
							created: '2024-10-01T10:00:00.000Z',
							updated: '2024-10-04T15:30:00.000Z',
						},
					},
				],
				startAt: 0,
				maxResults: 50,
				total: 1,
			};
		}

		return {issues: [], startAt: 0, maxResults: 50, total: 0};
	};

	// Mock worklog response
	client.getIssueWorklogs = async () => ({
		startAt: 0,
		maxResults: 20,
		total: 0,
		worklogs: [],
	});

	const result = await useCase.execute(
		weekStart,
		weekEnd,
		'user1@example.com',
		undefined,
		slidingWindowConfig,
	);

	// Should have calculated sliding window start as 10 days before week start (Monday)
	const expectedWindowStart = new Date(weekStart);
	expectedWindowStart.setDate(weekStart.getDate() - slidingWindowConfig.past);
	const expectedDateString = expectedWindowStart.toISOString().split('T')[0]!;

	t.truthy(capturedWindowStart, 'Should have captured a lookback start date');
	t.is(
		capturedWindowStart,
		expectedDateString,
		`Expected lookback start ${expectedDateString} (10 days before week start), got ${capturedWindowStart}`,
	);

	// Should include the recent issue
	t.is(result.dailySummaries.length, 1);
	t.is(result.dailySummaries[0]!.issues.length, 1);
	t.is(result.dailySummaries[0]!.issues[0]!.issueKey, 'WEEK-SLIDING');
	t.is(result.dailySummaries[0]!.issues[0]!.hours, 0);
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
	t.is(normalized.past, 0);
	t.is(normalized.future, 0);
});
