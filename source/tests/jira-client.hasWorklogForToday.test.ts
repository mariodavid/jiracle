import test from 'ava';
import {JiraClient} from '../jira-client.js';
import type {JiraConfig} from '../jira-client.js';

const mockConfig: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token-123',
};

test('hasWorklogForToday method exists and builds correct JQL', async t => {
	const jiraClient = new JiraClient(mockConfig);

	// Mock the searchIssuesWithWorklogs method
	let capturedJql: string | undefined;
	jiraClient.searchIssuesWithWorklogs = async (jql: string) => {
		capturedJql = jql;
		return {
			issues: [],
			startAt: 0,
			maxResults: 100,
			total: 0,
		};
	};

	const result = await jiraClient.hasWorklogForToday();

	t.false(result); // Should return false when no worklogs found
	t.truthy(capturedJql);

	// Check JQL format
	const today = new Date().toISOString().split('T')[0];
	const expectedJql = `worklogDate = "${
		today ?? 'unknown'
	}" AND worklogAuthor = currentUser()`;
	t.is(capturedJql ?? '', expectedJql);
});

test('hasWorklogForToday returns true when worklogs exist', async t => {
	const jiraClient = new JiraClient(mockConfig);

	// Mock the searchIssuesWithWorklogs method to return worklogs
	jiraClient.searchIssuesWithWorklogs = async () => {
		return {
			issues: [
				{
					id: '1',
					key: IssueKey.fromString('TEST-123'),
					fields: {} as any,
				},
			],
			startAt: 0,
			maxResults: 100,
			total: 1,
		};
	};

	const result = await jiraClient.hasWorklogForToday();

	t.true(result); // Should return true when worklogs found
});

test('hasWorklogForToday handles errors correctly', async t => {
	const jiraClient = new JiraClient(mockConfig);

	// Mock the searchIssuesWithWorklogs method to throw error
	jiraClient.searchIssuesWithWorklogs = async () => {
		throw new Error('API Error');
	};

	await t.throwsAsync(
		async () => {
			await jiraClient.hasWorklogForToday();
		},
		{message: 'API Error'},
	);
});
