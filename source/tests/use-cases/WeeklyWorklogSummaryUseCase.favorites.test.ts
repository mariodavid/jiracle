import test from 'ava';
import {WeeklyWorklogSummaryUseCase} from '../../use-cases/WeeklyWorklogSummaryUseCase.js';
import {createMockJiraClient} from './WeeklyWorklogSummaryUseCase.testutils.js';

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
				key: IssueKey.fromString('TEST-117'),
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
			key: IssueKey.fromString('FAV-123'),
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
			key: IssueKey.fromString('TEST-117'),
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
		{key: IssueKey.fromString('FAV-123'), defaultTime: '4h'},
		{key: IssueKey.fromString('TEST-117'), defaultTime: '2h'},
	];

	const result = await useCase.execute({
		weekStart,
		weekEnd,
		userEmail: 'user1@example.com',
		favoriteIssues,
	});

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
