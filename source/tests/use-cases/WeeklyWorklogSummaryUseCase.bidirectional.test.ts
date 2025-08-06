import test from 'ava';
import {IssueKey} from '../../domain/IssueKey.js';
import {JiraClient} from '../../jira-client.js';
import type {JiraConfig} from '../../jira-client.js';
import {WeeklyWorklogSummaryUseCase} from '../../use-cases/WeeklyWorklogSummaryUseCase.js';
import {TestData} from '../utils/test-helpers.js';

const mockConfig: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token-123',
};

function createMockJiraClient(): JiraClient {
	return new JiraClient(mockConfig);
}

test('WeeklyWorklogSummaryUseCase supports bidirectional sliding window', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekRange = TestData.weekRange('2024-10-14'); // Monday
	const slidingWindowConfig = {past: 7, future: 7}; // 7 days back and forward

	// Mock current user
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	const jqlQueries: string[] = [];

	// Mock search that tracks all JQL queries
	client.searchIssuesWithWorklogs = async jql => {
		jqlQueries.push(jql);

		// Current week (no issues)
		if (jql.includes('2024-10-14') && jql.includes('2024-10-20')) {
			return {issues: [], startAt: 0, maxResults: 100, total: 0};
		}

		// Past sliding window (Oct 7-13)
		if (jql.includes('2024-10-07') && jql.includes('2024-10-13')) {
			return {
				issues: [
					{
						id: '111111',
						key: IssueKey.fromString('PAST-100'),
						fields: {
							summary: 'Past sliding window issue',
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
							created: '2024-01-01T00:00:00.000Z',
							updated: '2024-01-01T00:00:00.000Z',
						},
					},
				],
				startAt: 0,
				maxResults: 100,
				total: 1,
			};
		}

		// Future sliding window (Oct 21-27)
		if (jql.includes('2024-10-21') && jql.includes('2024-10-27')) {
			return {
				issues: [
					{
						id: '222222',
						key: IssueKey.fromString('FUTURE-100'),
						fields: {
							summary: 'Future sliding window issue',
							status: {name: 'Open', statusCategory: {name: 'To Do'}},
							issuetype: {name: 'Task', iconUrl: ''},
							priority: {name: 'Medium', iconUrl: ''},
							assignee: {
								displayName: 'Test User',
								emailAddress: 'user1@example.com',
							},
							created: '2024-01-01T00:00:00.000Z',
							updated: '2024-01-01T00:00:00.000Z',
						},
					},
				],
				startAt: 0,
				maxResults: 100,
				total: 1,
			};
		}

		return {issues: [], startAt: 0, maxResults: 100, total: 0};
	};

	// Mock worklog responses
	client.getIssueWorklogs = async issueKey => {
		const issueKeyString =
			typeof issueKey === 'string' ? issueKey : issueKey.toString();
		if (issueKeyString === 'PAST-100') {
			return {
				startAt: 0,
				maxResults: 1,
				total: 1,
				worklogs: [
					{
						id: '333333',
						issueId: '111111',
						author: {
							displayName: 'Test User',
							emailAddress: 'user1@example.com',
						},
						comment: 'Work in past period',
						started: '2024-10-10T10:00:00.000+0200', // Past period
						timeSpentSeconds: 3600, // 1 hour
					},
				],
			};
		}

		if (issueKeyString === 'FUTURE-100') {
			return {
				startAt: 0,
				maxResults: 1,
				total: 1,
				worklogs: [
					{
						id: '444444',
						issueId: '222222',
						author: {
							displayName: 'Test User',
							emailAddress: 'user1@example.com',
						},
						comment: 'Work in future period',
						started: '2024-10-25T10:00:00.000+0200', // Future period
						timeSpentSeconds: 7200, // 2 hours
					},
				],
			};
		}

		return {startAt: 0, maxResults: 1, total: 0, worklogs: []};
	};

	const result = await useCase.execute({
		weekRange,
		userEmail: 'user1@example.com',
		slidingWindowConfig,
	});

	// Should have made 3 JQL queries: current week, past window, future window
	t.is(jqlQueries.length, 3);
	t.true(
		jqlQueries[0]!.includes('2024-10-14') &&
			jqlQueries[0]!.includes('2024-10-20'),
	); // Current week
	t.true(
		jqlQueries.some(q => q.includes('2024-10-07') && q.includes('2024-10-13')),
	); // Past window
	t.true(
		jqlQueries.some(q => q.includes('2024-10-21') && q.includes('2024-10-27')),
	); // Future window

	// Should have both past and future issues as 0h entries
	t.is(result.dailySummaries.length, 1);
	t.is(result.dailySummaries[0]!.issues.length, 2);
	t.is(result.dailySummaries[0]!.totalHours, 0);

	// Both issues should appear with 0 hours since they have no worklogs in current week
	const issueKeys = new Set(
		result.dailySummaries[0]!.issues.map(issue => issue.issueKey.toString()),
	);
	t.true(issueKeys.has('PAST-100'));
	t.true(issueKeys.has('FUTURE-100'));
	t.is(result.dailySummaries[0]!.issues[0]!.hours, 0);
	t.is(result.dailySummaries[0]!.issues[1]!.hours, 0);
});

test('WeeklyWorklogSummaryUseCase bidirectional deduplication works correctly', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekRange = TestData.weekRange('2024-10-14');
	const slidingWindowConfig = {past: 5, future: 5};

	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	// Mock search that returns the same issue in both past and future windows
	client.searchIssuesWithWorklogs = async jql => {
		// Current week (no issues)
		if (jql.includes('2024-10-14') && jql.includes('2024-10-20')) {
			return {issues: [], startAt: 0, maxResults: 100, total: 0};
		}

		// Both past and future windows return the same issue
		if (
			(jql.includes('2024-10-09') && jql.includes('2024-10-13')) ??
			(jql.includes('2024-10-21') && jql.includes('2024-10-25'))
		) {
			return {
				issues: [
					{
						id: '111111',
						key: IssueKey.fromString('SHARED-100'),
						fields: {
							summary: 'Issue in both windows',
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
							created: '2024-01-01T00:00:00.000Z',
							updated: '2024-01-01T00:00:00.000Z',
						},
					},
				],
				startAt: 0,
				maxResults: 100,
				total: 1,
			};
		}

		return {issues: [], startAt: 0, maxResults: 100, total: 0};
	};

	// Mock empty worklog response
	client.getIssueWorklogs = async () => ({
		startAt: 0,
		maxResults: 1,
		total: 0,
		worklogs: [],
	});

	const result = await useCase.execute({
		weekRange,
		userEmail: 'user1@example.com',
		slidingWindowConfig,
	});

	// Should only have the issue once, not duplicated
	t.is(result.dailySummaries.length, 1);
	t.is(result.dailySummaries[0]!.issues.length, 1);
	t.is(result.dailySummaries[0]!.issues[0]!.issueKey.toString(), 'SHARED-100');
});

test('WeeklyWorklogSummaryUseCase skips future window when future is 0', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekRange = TestData.weekRange('2024-10-14');
	const slidingWindowConfig = {past: 7, future: 0}; // Only past, no future

	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	const jqlQueries: string[] = [];

	client.searchIssuesWithWorklogs = async jql => {
		jqlQueries.push(jql);
		return {issues: [], startAt: 0, maxResults: 100, total: 0};
	};

	await useCase.execute({
		weekRange,
		userEmail: 'user1@example.com',
		slidingWindowConfig,
	});

	// Should have made 2 queries: current week + past window, but no future window
	t.is(jqlQueries.length, 2);
	t.true(
		jqlQueries[0]!.includes('2024-10-14') &&
			jqlQueries[0]!.includes('2024-10-20'),
	); // Current week
	t.true(
		jqlQueries[1]!.includes('2024-10-07') &&
			jqlQueries[1]!.includes('2024-10-13'),
	); // Past window only

	// Should not have any future window queries
	t.false(jqlQueries.some(q => q.includes('2024-10-21')));
});

test('WeeklyWorklogSummaryUseCase skips past window when past is 0', async t => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	const weekRange = TestData.weekRange('2024-10-14');
	const slidingWindowConfig = {past: 0, future: 3}; // Only future, no past

	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	const jqlQueries: string[] = [];

	client.searchIssuesWithWorklogs = async jql => {
		jqlQueries.push(jql);
		return {issues: [], startAt: 0, maxResults: 100, total: 0};
	};

	await useCase.execute({
		weekRange,
		userEmail: 'user1@example.com',
		slidingWindowConfig,
	});

	// Should have made 2 queries: current week + future window, but no past window
	t.is(jqlQueries.length, 2);
	t.true(
		jqlQueries[0]!.includes('2024-10-14') &&
			jqlQueries[0]!.includes('2024-10-20'),
	); // Current week
	t.true(
		jqlQueries[1]!.includes('2024-10-21') &&
			jqlQueries[1]!.includes('2024-10-23'),
	); // Future window only

	// Should not have any past window queries
	t.false(
		jqlQueries.some(q => q.includes('2024-10-13') && !q.includes('2024-10-14')),
	);
});
