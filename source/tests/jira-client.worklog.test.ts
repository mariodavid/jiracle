import test from 'ava';
import {JiraClient} from '../jira-client.js';
import type {JiraConfig} from '../jira-client.js';
import {createMockResponse} from './utils/mockResponse.js';

const mockConfig: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token-123',
};

test('getIssueWorklogs builds correct request', async t => {
	const client = new JiraClient(mockConfig);
	const issueKey = 'TEST-123';

	// Mock fetch to capture the request
	const originalFetch = global.fetch;
	let capturedRequest: {url: string; options: RequestInit} | undefined;

	const mockWorklogResponse = {
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
				comment: 'Test worklog',
				started: '2024-10-19T08:00:00.000+0200',
				timeSpentSeconds: 14_400,
			},
		],
	};

	global.fetch = async (url, options) => {
		capturedRequest = {url: url as string, options: options!};
		return {
			ok: true,
			json: async () => mockWorklogResponse,
		} as Response;
	};

	try {
		const result = await client.getIssueWorklogs(issueKey);

		t.truthy(capturedRequest);
		t.is(
			capturedRequest!.url,
			'https://jira.example.com/rest/api/2/issue/TEST-123/worklog',
		);
		t.is(capturedRequest!.options.method, undefined); // GET is default

		const headers = capturedRequest!.options.headers as Record<string, string>;
		t.is(headers['Authorization'], 'Bearer test-token-123');
		t.is(headers['Accept'], 'application/json');

		t.deepEqual(result, mockWorklogResponse);
	} finally {
		global.fetch = originalFetch;
	}
});

test('getIssueWorklogs handles API errors', async t => {
	const client = new JiraClient(mockConfig);
	const issueKey = 'TEST-123';

	// Mock fetch to return error
	const originalFetch = global.fetch;
	global.fetch = async (): Promise<Response> => {
		return createMockResponse({
			ok: false,
			status: 404,
			text: async () => 'Issue not found',
		});
	};

	try {
		const error = await t.throwsAsync(client.getIssueWorklogs(issueKey));
		t.is(error?.message, 'Jira API error: 404 - Issue not found');
	} finally {
		global.fetch = originalFetch;
	}
});

test('searchIssuesWithWorklogs builds correct request', async t => {
	const client = new JiraClient(mockConfig);
	const jql = 'worklogAuthor = currentUser() AND worklogDate >= "2024-10-14"';

	// Mock fetch to capture the request
	const originalFetch = global.fetch;
	let capturedRequest: {url: string; options: RequestInit} | undefined;

	const mockSearchResponse = {
		startAt: 0,
		maxResults: 50,
		total: 1,
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
	};

	global.fetch = async (url, options) => {
		capturedRequest = {url: url as string, options: options!};
		return new Response(JSON.stringify(mockSearchResponse), {
			status: 200,
			headers: {'Content-Type': 'application/json'},
		});
	};

	try {
		const result = await client.searchIssuesWithWorklogs(jql);

		t.truthy(capturedRequest);
		t.is(capturedRequest!.url, 'https://jira.example.com/rest/api/2/search');
		t.is(capturedRequest!.options.method, 'POST');

		const headers = capturedRequest!.options.headers as Record<string, string>;
		t.is(headers['Authorization'], 'Bearer test-token-123');
		t.is(headers['Content-Type'], 'application/json');

		const body = JSON.parse(capturedRequest!.options.body as string);
		t.is(body.jql, jql);
		t.is(body.maxResults, 100);
		t.deepEqual(body.fields, ['id', 'key', 'summary']);

		// Check the transformed result structure
		t.is(result.startAt, mockSearchResponse.startAt);
		t.is(result.maxResults, mockSearchResponse.maxResults);
		t.is(result.total, mockSearchResponse.total);
		t.is(result.issues.length, 1);
		t.is(result.issues[0]!.key.toString(), 'TEST-117');
	} finally {
		global.fetch = originalFetch;
	}
});

test('searchIssuesWithWorklogs handles API errors', async t => {
	const client = new JiraClient(mockConfig);
	const jql = 'invalid jql query';

	// Mock fetch to return error
	const originalFetch = global.fetch;
	global.fetch = async () => {
		return new Response('Invalid JQL query', {
			status: 400,
			statusText: 'Bad Request',
		});
	};

	try {
		const error = await t.throwsAsync(client.searchIssuesWithWorklogs(jql));
		t.is(error?.message, 'Jira API error: 400 - Invalid JQL query');
	} finally {
		global.fetch = originalFetch;
	}
});

test('getCurrentUser builds correct request', async t => {
	const client = new JiraClient(mockConfig);

	// Mock fetch to capture the request
	const originalFetch = global.fetch;
	let capturedRequest: {url: string; options: RequestInit} | undefined;

	const mockUserResponse = {
		emailAddress: 'user1@example.com',
		displayName: 'Test User',
	};

	global.fetch = async (url, options) => {
		capturedRequest = {url: url as string, options: options!};
		const response: Response = {
			ok: true,
			json: async () => mockUserResponse,
		} as Response;
		return response;
	};

	try {
		const result = await client.getCurrentUser();

		t.truthy(capturedRequest);
		t.is(capturedRequest!.url, 'https://jira.example.com/rest/api/2/myself');
		t.is(capturedRequest!.options.method, undefined); // GET is default

		const headers = capturedRequest!.options.headers as Record<string, string>;
		t.is(headers['Authorization'], 'Bearer test-token-123');
		t.is(headers['Accept'], 'application/json');

		t.deepEqual(result, mockUserResponse);
	} finally {
		global.fetch = originalFetch;
	}
});

test('getCurrentUser handles API errors', async t => {
	const client = new JiraClient(mockConfig);

	// Mock fetch to return error
	const originalFetch = global.fetch;
	global.fetch = async () => {
		const response: Response = {
			ok: false,
			status: 401,
			text: async () => 'Unauthorized',
		} as Response;
		return response;
	};

	try {
		const error = await t.throwsAsync(client.getCurrentUser());
		t.is(error?.message, 'Jira API error: 401 - Unauthorized');
	} finally {
		global.fetch = originalFetch;
	}
});

test('getIssueWorklogs parses response correctly', async t => {
	const client = new JiraClient(mockConfig);
	const issueKey = 'TEST-123';

	const mockWorklogResponse = {
		startAt: 0,
		maxResults: 2,
		total: 2,
		worklogs: [
			{
				id: '111111',
				issueId: '263906',
				author: {
					displayName: 'Test User 1',
					emailAddress: 'user1@example.com',
				},
				comment: 'First worklog',
				started: '2024-10-19T08:00:00.000+0200',
				timeSpentSeconds: 14_400, // 4 hours
			},
			{
				id: '111112',
				issueId: '263906',
				author: {
					displayName: 'Test User 2',
					emailAddress: 'user2@example.com',
				},
				comment: 'Second worklog',
				started: '2024-10-19T12:00:00.000+0200',
				timeSpentSeconds: 3600, // 1 hour
			},
		],
	};

	const originalFetch = global.fetch;
	global.fetch = async () => {
		const response: Response = {
			ok: true,
			json: async () => mockWorklogResponse,
		} as Response;
		return response;
	};

	try {
		const result = await client.getIssueWorklogs(issueKey);

		t.is(result.worklogs.length, 2);
		t.is(result.worklogs[0]!.id, '111111');
		t.is(result.worklogs[0]!.timeSpentSeconds, 14_400);
		t.is(result.worklogs[0]!.author.emailAddress, 'user1@example.com');
		t.is(result.worklogs[1]!.id, '111112');
		t.is(result.worklogs[1]!.timeSpentSeconds, 3600);
		t.is(result.worklogs[1]!.author.emailAddress, 'user2@example.com');
	} finally {
		global.fetch = originalFetch;
	}
});

test('searchIssuesWithWorklogs parses response correctly', async t => {
	const client = new JiraClient(mockConfig);
	const jql = 'worklogAuthor = currentUser()';

	const mockSearchResponse = {
		startAt: 0,
		maxResults: 50,
		total: 2,
		issues: [
			{
				id: '263906',
				key: 'TEST-117',
				fields: {
					summary: 'First Issue Summary',
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
			{
				id: '263907',
				key: 'TEST-118',
				fields: {
					summary: 'Second Issue Summary',
					status: {name: 'Done', statusCategory: {name: 'Done'}},
					issuetype: {name: 'Bug', iconUrl: ''},
					priority: {name: 'High', iconUrl: ''},
					assignee: {
						displayName: 'Test User',
						emailAddress: 'user1@example.com',
					},
					created: '2024-10-02T10:00:00.000Z',
					updated: '2024-10-20T15:30:00.000Z',
				},
			},
		],
	};

	const originalFetch = global.fetch;
	global.fetch = async () => {
		return new Response(JSON.stringify(mockSearchResponse), {
			status: 200,
			headers: {'Content-Type': 'application/json'},
		});
	};

	try {
		const result = await client.searchIssuesWithWorklogs(jql);

		t.is(result.issues.length, 2);
		t.is(result.issues[0]!.key.toString(), 'TEST-117');
		t.is(result.issues[0]!.fields.summary, 'First Issue Summary');
		t.is(result.issues[1]!.key.toString(), 'TEST-118');
		t.is(result.issues[1]!.fields.summary, 'Second Issue Summary');
		t.is(result.total, 2);
	} finally {
		global.fetch = originalFetch;
	}
});

test('updateWorklog builds correct request', async t => {
	const client = new JiraClient(mockConfig);
	const issueKey = 'TEST-123';
	const worklogId = '111111';
	const worklogData = {
		timeSpent: '2h',
		comment: 'Updated work description',
		started: '2024-10-19T08:00:00.000+0200',
	};

	// Mock fetch to capture the request
	const originalFetch = global.fetch;
	let capturedRequest: {url: string; options: RequestInit} | undefined;

	global.fetch = async (url, options) => {
		capturedRequest = {url: url as string, options: options!};
		const response: Response = {
			ok: true,
			json: async () => ({}),
		} as Response;
		return response;
	};

	try {
		await client.updateWorklog(issueKey, worklogId, worklogData);

		t.truthy(capturedRequest);
		t.is(
			capturedRequest!.url,
			'https://jira.example.com/rest/api/2/issue/TEST-123/worklog/111111',
		);
		t.is(capturedRequest!.options.method, 'PUT');

		const headers = capturedRequest!.options.headers as Record<string, string>;
		t.is(headers['Authorization'], 'Bearer test-token-123');
		t.is(headers['Accept'], 'application/json');
		t.is(headers['Content-Type'], 'application/json');

		const body = JSON.parse(capturedRequest!.options.body as string);
		t.deepEqual(body, worklogData);
	} finally {
		global.fetch = originalFetch;
	}
});

test('updateWorklog handles API errors', async t => {
	const client = new JiraClient(mockConfig);
	const issueKey = 'TEST-123';
	const worklogId = '111111';
	const worklogData = {
		timeSpent: '2h',
		comment: 'Updated work description',
		started: '2024-10-19T08:00:00.000+0200',
	};

	// Mock fetch to return error
	const originalFetch = global.fetch;
	global.fetch = async () => {
		return new Response('Worklog not found', {
			status: 404,
			statusText: 'Not Found',
		});
	};

	try {
		const error = await t.throwsAsync(
			client.updateWorklog(issueKey, worklogId, worklogData),
		);
		t.is(error?.message, 'Jira API error: 404 - Worklog not found');
	} finally {
		global.fetch = originalFetch;
	}
});

test('updateWorklog validates issue key', async t => {
	const client = new JiraClient(mockConfig);
	const worklogId = '111111';
	const worklogData = {
		timeSpent: '2h',
		comment: 'Updated work description',
		started: '2024-10-19T08:00:00.000+0200',
	};

	// Test empty issue key
	const error1 = await t.throwsAsync(
		client.updateWorklog('', worklogId, worklogData),
	);
	t.is(error1?.message, 'Issue key is required and cannot be empty');

	// Test invalid issue key format
	const error2 = await t.throwsAsync(
		client.updateWorklog('invalid-key', worklogId, worklogData),
	);
	t.true(error2?.message.includes('Invalid issue key format'));
});

test('updateWorklog validates worklog ID', async t => {
	const client = new JiraClient(mockConfig);
	const issueKey = 'TEST-123';
	const worklogData = {
		timeSpent: '2h',
		comment: 'Updated work description',
		started: '2024-10-19T08:00:00.000+0200',
	};

	// Test empty worklog ID
	const error = await t.throwsAsync(
		client.updateWorklog(issueKey, '', worklogData),
	);
	t.is(error?.message, 'Worklog ID is required and cannot be empty');
});

test('updateWorklog handles 405 error with helpful message', async t => {
	const client = new JiraClient(mockConfig);
	const issueKey = 'TEST-123';
	const worklogId = '111111';
	const worklogData = {
		timeSpent: '2h',
		comment: 'Updated work description',
		started: '2024-10-19T08:00:00.000+0200',
	};

	// Mock fetch to return 405 error
	const originalFetch = global.fetch;
	global.fetch = async () => {
		return new Response('Method Not Allowed', {
			status: 405,
			statusText: 'Method Not Allowed',
		});
	};

	try {
		const error = await t.throwsAsync(
			client.updateWorklog(issueKey, worklogId, worklogData),
		);
		t.true(error?.message.includes('HTTP 405 Method Not Allowed'));
		t.true(error?.message.includes('Check your Jira URL configuration'));
		t.true(error?.message.includes('https://your-jira-instance.com/'));
	} finally {
		global.fetch = originalFetch;
	}
});
