import test from 'ava';
import {LocalDate} from '../../domain/LocalDate.js';
import {WeeklyWorklogSummaryUseCase} from '../../use-cases/WeeklyWorklogSummaryUseCase.js';
import {createMockJiraClient} from './WeeklyWorklogSummaryUseCase.testutils.js';

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

	await useCase.execute({weekStart, weekEnd});

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

	const result = await useCase.execute({weekStart, weekEnd});

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

	const result = await useCase.execute({weekStart, weekEnd});

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

	const result = await useCase.execute({weekStart, weekEnd});

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

	const result = await useCase.execute({weekStart, weekEnd});

	t.is(result.dailySummaries.length, 0);
	t.is(result.weekTotal, 0);
	t.deepEqual(result.weekStart, LocalDate.fromDate(weekStart));
	t.deepEqual(result.weekEnd, LocalDate.fromDate(weekEnd));
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

	const result = await useCase.execute({weekStart, weekEnd});

	t.is(result.dailySummaries.length, 1);
	t.is(result.dailySummaries[0]!.totalHours, 4); // 1 + 0.5 + 2.5
	t.is(result.dailySummaries[0]!.issues.length, 1); // Aggregated into single entry
	t.is(result.dailySummaries[0]!.issues[0]!.hours, 4); // Combined hours
	t.is(result.weekTotal, 4);
});
