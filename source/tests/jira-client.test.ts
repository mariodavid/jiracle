import test from 'ava';
import {
	JiraClient,
	normalizeTimeFormat,
	extractIssueKeyFromInput,
} from '../jira-client.js';
import type {JiraConfig} from '../jira-client.js';
import {createMockResponse} from './utils/mockResponse.js';

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
		return createMockResponse({
			json: async () => ({issues: []}),
		});
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
		createMockResponse({
			ok: false,
			status: 401,
			text: async () => 'Unauthorized',
		});

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
		return createMockResponse({
			json: async () => ({key: issueKey}),
		});
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

test('addWorklog accepts custom time formats', async t => {
	const client = new JiraClient(mockConfig);
	const issueKey = 'TEST-123';

	const originalFetch = global.fetch;
	let capturedRequest: {url: string; options: RequestInit} | undefined;

	global.fetch = async (url, options) => {
		capturedRequest = {url: url as string, options: options!};
		return createMockResponse({
			json: async () => ({}),
		});
	};

	try {
		await client.addWorklog(issueKey, {
			timeSpent: '2h 30m',
			comment: 'Custom time test',
			started: '2025-01-08T12:00:00.000+0000',
		});

		t.truthy(capturedRequest);
		const body = JSON.parse(capturedRequest!.options.body as string);
		t.is(body.timeSpent, '2h 30m');
		t.is(body.comment, 'Custom time test');
	} finally {
		global.fetch = originalFetch;
	}
});

test('normalizeTimeFormat converts time formats correctly', t => {
	// Test ms library parsing (natural language)
	t.is(normalizeTimeFormat('2h'), '2h');
	t.is(normalizeTimeFormat('30m'), '30m');
	t.is(normalizeTimeFormat('1.5h'), '1h 30m');
	t.is(normalizeTimeFormat('90m'), '1h 30m');
	t.is(normalizeTimeFormat('2 hours'), '2h');
	t.is(normalizeTimeFormat('45 minutes'), '45m');

	// Test legacy formats
	t.is(normalizeTimeFormat('2h30m'), '2h 30m');
	t.is(normalizeTimeFormat('1h15m'), '1h 15m');
	t.is(normalizeTimeFormat('8h'), '8h');
	t.is(normalizeTimeFormat('2h 30m'), '2h 30m'); // Already normalized

	// Test German decimal separator conversion
	t.is(normalizeTimeFormat('2,5h'), '2.5h');
	t.is(normalizeTimeFormat('1,25h'), '1.25h');

	// Test invalid inputs
	t.is(normalizeTimeFormat('invalid'), '');
	t.is(normalizeTimeFormat('abc'), '');
	t.is(normalizeTimeFormat(''), '');
});

test('extractIssueKeyFromInput extracts issue keys from URLs correctly', t => {
	// Test direct issue key input
	t.is(extractIssueKeyFromInput('DEF-1234'), 'DEF-1234');
	t.is(extractIssueKeyFromInput('ABC-999'), 'ABC-999');
	t.is(extractIssueKeyFromInput('TEST-42'), 'TEST-42');

	// Test URL extraction
	t.is(
		extractIssueKeyFromInput('https://jira.example.com/browse/DEF-2457'),
		'DEF-2457',
	);
	t.is(
		extractIssueKeyFromInput('https://jira.example.com/browse/ABC-999'),
		'ABC-999',
	);
	t.is(
		extractIssueKeyFromInput('http://jira.company.com/browse/PROJ-123'),
		'PROJ-123',
	);

	// Test with different path structures
	t.is(
		extractIssueKeyFromInput('https://company.atlassian.net/browse/TEAM-456'),
		'TEAM-456',
	);
	t.is(extractIssueKeyFromInput('/browse/LOCAL-789'), 'LOCAL-789');

	// Test whitespace trimming
	t.is(extractIssueKeyFromInput('  DEF-1234  '), 'DEF-1234');
	t.is(
		extractIssueKeyFromInput('  https://jira.example.com/browse/DEF-2457  '),
		'DEF-2457',
	);

	// Test invalid inputs (should return null)
	t.is(extractIssueKeyFromInput('invalid-input'), undefined);
	t.is(extractIssueKeyFromInput('123-ABC'), undefined);
	t.is(extractIssueKeyFromInput('https://example.com/other/path'), undefined);
	t.is(extractIssueKeyFromInput(''), undefined);

	// Test edge cases
	t.is(extractIssueKeyFromInput('https://jira.example.com/browse/'), undefined);
	t.is(extractIssueKeyFromInput('browse/DEF-1234'), undefined); // Missing slash
	t.is(extractIssueKeyFromInput('https://google.com/'), undefined); // Invalid URL
});
