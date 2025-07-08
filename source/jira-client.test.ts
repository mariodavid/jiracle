import test from 'ava';
import {JiraClient} from './jira-client.js';
import type {JiraConfig} from './jira-client.js';

const mockConfig: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token-123',
};

test('JiraClient constructor sets properties correctly', t => {
	const client = new JiraClient(mockConfig);

	t.is(client.jiraUrl, mockConfig.jiraUrl);
	t.is(client.apiToken, mockConfig.apiToken);
	t.is(client.baseUrl, 'https://jira.example.com/rest/api/2');
});

test('fetchAssignedIssues builds correct request', async t => {
	const client = new JiraClient(mockConfig);

	// Mock fetch to capture the request
	const originalFetch = global.fetch;
	let capturedRequest: {url: string; options: RequestInit} | undefined;

	global.fetch = async (url, options) => {
		capturedRequest = {url: url as string, options: options!};
		return {
			ok: true,
			json: async () => ({issues: []}),
		} as Response;
	};

	try {
		await client.fetchAssignedIssues();

		t.truthy(capturedRequest);
		t.is(capturedRequest!.url, 'https://jira.example.com/rest/api/2/search');
		t.is(capturedRequest!.options.method, 'POST');

		const headers = capturedRequest!.options.headers as Record<string, string>;
		t.is(headers['Authorization'], 'Bearer test-token-123');
		t.is(headers['Content-Type'], 'application/json');

		const body = JSON.parse(capturedRequest!.options.body as string);
		t.is(
			body.jql,
			'assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC',
		);
		t.is(body.maxResults, 50);
		t.deepEqual(body.fields, [
			'summary',
			'status',
			'issuetype',
			'priority',
			'assignee',
			'created',
			'updated',
		]);
	} finally {
		global.fetch = originalFetch;
	}
});

test('fetchAssignedIssues handles API errors', async t => {
	const client = new JiraClient(mockConfig);

	const originalFetch = global.fetch;
	global.fetch = async () =>
		({
			ok: false,
			status: 401,
			text: async () => 'Unauthorized',
		} as Response);

	try {
		await t.throwsAsync(async () => client.fetchAssignedIssues(), {
			message: 'Jira API error: 401 - Unauthorized',
		});
	} finally {
		global.fetch = originalFetch;
	}
});

test('fetchIssue builds correct request', async t => {
	const client = new JiraClient(mockConfig);
	const issueKey = 'TEST-123';

	const originalFetch = global.fetch;
	let capturedRequest: {url: string; options: RequestInit} | undefined;

	global.fetch = async (url, options) => {
		capturedRequest = {url: url as string, options: options!};
		return {
			ok: true,
			json: async () => ({key: issueKey}),
		} as Response;
	};

	try {
		await client.fetchIssue(issueKey);

		t.truthy(capturedRequest);
		t.is(
			capturedRequest!.url,
			`https://jira.example.com/rest/api/2/issue/${issueKey}`,
		);

		const headers = capturedRequest!.options.headers as Record<string, string>;
		t.is(headers['Authorization'], 'Bearer test-token-123');
		t.is(headers['Accept'], 'application/json');
	} finally {
		global.fetch = originalFetch;
	}
});
