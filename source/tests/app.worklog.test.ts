import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import App from '../app.js';
import type {JiraConfig} from '../jira-client.js';

const ARROW_DOWN = '\u001B\u005B\u0042';

// Test config that will be passed directly to the App component
const testConfig: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token',
	favorites: [{key: 'TEST-123'}, {key: 'TEST-456'}],
};

// Test config with custom default comments for favorites
const testConfigWithComments: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token',
	favorites: [
		{key: 'TEST-123', defaultComment: 'Working on feature implementation'},
		{key: 'TEST-456', defaultComment: 'Bug fixing and testing'},
	],
};

// Mock fetch globally for all tests
test.beforeEach(() => {
	global.fetch = async (url: string | URL | Request) => {
		const urlString = url.toString();

		// Mock search endpoint for both favorites and assigned issues
		if (urlString.includes('/rest/api/2/search')) {
			// Small delay to simulate API call
			await new Promise(resolve => setTimeout(resolve, 100));

			return {
				ok: true,
				status: 200,
				json: async () => ({
					issues: [
						{
							id: '1',
							key: 'TEST-123',
							fields: {
								summary: 'Test Issue 1',
								status: {name: 'In Progress'},
								issuetype: {name: 'Task'},
								priority: {name: 'Medium'},
								assignee: {
									displayName: 'Test User',
									emailAddress: 'test@example.com',
								},
								created: '2025-01-01T00:00:00.000Z',
								updated: '2025-01-01T00:00:00.000Z',
							},
						},
						{
							id: '2',
							key: 'TEST-456',
							fields: {
								summary: 'Test Issue 2',
								status: {name: 'To Do'},
								issuetype: {name: 'Bug'},
								priority: {name: 'High'},
								assignee: {
									displayName: 'Test User',
									emailAddress: 'test@example.com',
								},
								created: '2025-01-01T00:00:00.000Z',
								updated: '2025-01-01T00:00:00.000Z',
							},
						},
					],
					total: 2,
					startAt: 0,
					maxResults: 50,
				}),
			} as Response;
		}

		// Mock worklog endpoint for successful submission
		if (urlString.includes('/worklog')) {
			// Small delay to simulate API call
			await new Promise(resolve => setTimeout(resolve, 100));

			return {
				ok: true,
				status: 201,
				json: async () => ({
					id: '12345',
					author: {
						displayName: 'Test User',
						emailAddress: 'test@example.com',
					},
					created: '2025-01-01T12:00:00.000Z',
					updated: '2025-01-01T12:00:00.000Z',
					started: '2025-01-01T12:00:00.000Z',
					timeSpent: '1h',
					comment: 'Test comment',
				}),
			} as Response;
		}

		// Mock getCurrentUser endpoint
		if (urlString.includes('/rest/api/2/myself')) {
			return {
				ok: true,
				status: 200,
				json: async () => ({
					emailAddress: 'test@example.com',
					displayName: 'Test User',
				}),
			} as Response;
		}

		// Default response for unknown endpoints
		return {
			ok: false,
			status: 404,
			json: async () => ({error: 'Not found'}),
		} as Response;
	};
});

// No cleanup needed since we don't touch the real config file anymore

test.serial(
	'should complete successful worklog submission (Test Case 10.1)',
	async t => {
		const {lastFrame, stdin, unmount} = render(
			React.createElement(App, {config: testConfig}),
		);

		// Wait for main menu
		await new Promise(resolve => setTimeout(resolve, 3000));

		// Step 1: Press "L" to log work from timetable
		stdin.write('l');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 2: Select "Favorites"
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 3: Select first issue (TEST-123)
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Verify we're in time selection
		let output = lastFrame();
		t.true(output?.includes('Select time to log') ?? false);

		// Step 4: Select first time option (1 hour)
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Verify we're in comment input
		output = lastFrame();
		t.true(output?.includes('Enter comment') ?? false);

		// Step 5: Enter comment
		stdin.write('Test comment for worklog');
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Verify we're in date selection
		output = lastFrame();
		t.true(output?.includes('Select date') ?? false);

		// Step 6: Select "Today"
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Wait for submission to complete and check success message
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Verify success message
		output = lastFrame();
		t.true(output?.includes('Worklog successfully added!') ?? false);

		// Wait for auto-return to main menu
		await new Promise(resolve => setTimeout(resolve, 2500));

		// Verify we're back at weekly timetable (BigText renders as ASCII art)
		output = lastFrame();
		t.true(output?.includes('Week') ?? false);

		unmount();
	},
);

test.serial(
	'should handle API error during worklog submission (Test Case 10.2)',
	async t => {
		// Store original fetch to restore later
		const originalFetch = global.fetch;

		// Override global fetch to simulate API error
		global.fetch = async (url: string | URL | Request) => {
			const urlString = url.toString();

			// Mock search endpoint for both favorites and assigned issues
			if (urlString.includes('/rest/api/2/search')) {
				// Small delay to simulate API call
				await new Promise(resolve => setTimeout(resolve, 100));

				return {
					ok: true,
					status: 200,
					json: async () => ({
						issues: [
							{
								id: '1',
								key: 'TEST-123',
								fields: {
									summary: 'Test Issue 1',
									status: {name: 'In Progress'},
									issuetype: {name: 'Task'},
									priority: {name: 'Medium'},
									assignee: {
										displayName: 'Test User',
										emailAddress: 'test@example.com',
									},
									created: '2025-01-01T00:00:00.000Z',
									updated: '2025-01-01T00:00:00.000Z',
								},
							},
						],
						total: 1,
						startAt: 0,
						maxResults: 50,
					}),
				} as Response;
			}

			// Mock worklog endpoint to return API error
			if (urlString.includes('/worklog')) {
				// Small delay to simulate API call
				await new Promise(resolve => setTimeout(resolve, 100));

				return {
					ok: false,
					status: 400,
					text: async () =>
						JSON.stringify({
							errorMessages: ['Worklog must not be null.'],
							errors: {
								timeLogged: 'Invalid time duration entered.',
							},
						}),
				} as Response;
			}

			// Default response for unknown endpoints
			return {
				ok: false,
				status: 404,
				json: async () => ({error: 'Not found'}),
			} as Response;
		};

		const {lastFrame, stdin, unmount} = render(
			React.createElement(App, {config: testConfig}),
		);

		// Wait for main menu
		await new Promise(resolve => setTimeout(resolve, 3000));

		// Navigate through the complete workflow
		// Step 1: Press "L" to log work from timetable
		stdin.write('l');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 2: Select "Favorites"
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 3: Select first issue (TEST-123)
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 4: Select first time option (1 hour)
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 5: Enter comment
		stdin.write('Test comment for worklog');
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 6: Select "Today"
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Wait for submission to complete and check for error
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Verify error message is displayed
		let output = lastFrame();
		t.true(output?.includes('Jira API error') ?? false);
		t.true(output?.includes('400') ?? false);
		t.true(output?.includes('Worklog must not be') ?? false);

		// Verify we stay in the workflow (don't return to main menu)
		// Error should be displayed but user should be able to continue
		await new Promise(resolve => setTimeout(resolve, 1000));
		output = lastFrame();
		// Should not automatically return to main menu on error
		t.false(output?.includes('What would you like to do?') ?? false);

		// Restore original fetch
		global.fetch = originalFetch;

		unmount();
	},
);

test.serial(
	'should accept valid issue key input and fetch issue from API (Test Case 5.1)',
	async t => {
		const originalFetch = global.fetch;
		const fetchCalls: Array<{url: string; method: string; body?: any}> = [];

		// Mock fetch with tracking
		global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
			const urlString = url.toString();
			fetchCalls.push({
				url: urlString,
				method: init?.method || 'GET',
				body: init?.body ? JSON.parse(init.body as string) : undefined,
			});

			// Mock fetching assigned issues (empty list)
			if (urlString.includes('/search')) {
				return new Response(
					JSON.stringify({
						issues: [],
						startAt: 0,
						maxResults: 50,
						total: 0,
					}),
					{status: 200},
				);
			}

			// Mock fetching specific issue
			if (
				urlString.includes('/issue/JTS-1234') &&
				!urlString.includes('/worklog')
			) {
				return new Response(
					JSON.stringify({
						id: '12345',
						key: 'JTS-1234',
						fields: {
							summary: 'Manually entered issue',
							status: {
								name: 'In Progress',
								statusCategory: {name: 'In Progress'},
							},
							issuetype: {
								name: 'Task',
								iconUrl: 'https://example.com/icon.png',
							},
							priority: {
								name: 'Medium',
								iconUrl: 'https://example.com/priority.png',
							},
							assignee: {
								displayName: 'Test User',
								emailAddress: 'test@example.com',
							},
							created: '2025-01-01T10:00:00.000+0000',
							updated: '2025-01-09T10:00:00.000+0000',
						},
					}),
					{status: 200},
				);
			}

			// Mock worklog submission
			if (urlString.includes('/worklog')) {
				return new Response('{}', {status: 201});
			}

			return new Response('Not found', {status: 404});
		};

		const {lastFrame, stdin, unmount} = render(
			React.createElement(App, {config: testConfig}),
		);

		// Wait for main menu
		await new Promise(resolve => setTimeout(resolve, 3000));

		// Step 1: Press "L" to log work from timetable
		stdin.write('l');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 2: Select "Other" for manual input
		stdin.write(ARROW_DOWN);
		await new Promise(resolve => setTimeout(resolve, 100));
		stdin.write(ARROW_DOWN);
		await new Promise(resolve => setTimeout(resolve, 100));
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Verify we're in manual input mode
		let output = lastFrame();
		t.true(output?.includes('Enter issue key or URL') ?? false);

		// Step 3: Enter valid issue key
		stdin.write('JTS-1234');
		await new Promise(resolve => setTimeout(resolve, 500));
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Verify API was called to fetch the issue
		const issueFetchCall = fetchCalls.find(
			call =>
				call.url.includes('/issue/JTS-1234') && !call.url.includes('/worklog'),
		);
		t.truthy(issueFetchCall);
		t.is(issueFetchCall?.method, 'GET');

		// Step 4: Verify we're now in time selection
		output = lastFrame();
		t.true(output?.includes('Select time to log') ?? false);
		t.true(output?.includes('JTS-1234') ?? false);
		t.true(output?.includes('Manually entered issue') ?? false);

		// Step 5: Continue with workflow - select 2 hours
		stdin.write(ARROW_DOWN);
		await new Promise(resolve => setTimeout(resolve, 100));
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 6: Enter comment
		stdin.write('Manual issue test');
		await new Promise(resolve => setTimeout(resolve, 200));
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 7: Select Today
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Verify worklog API was called with correct data
		const worklogCall = fetchCalls.find(call => call.url.includes('/worklog'));
		t.truthy(worklogCall);
		t.is(worklogCall?.method, 'POST');
		t.true(worklogCall?.url.includes('JTS-1234'));

		// Verify worklog data
		if (worklogCall?.body) {
			t.is(worklogCall.body.timeSpent, '2h');
			t.is(worklogCall.body.comment, 'Manual issue test');
		}

		// Verify success
		output = lastFrame();
		t.true(output?.includes('Worklog successfully added!') ?? false);

		// Restore original fetch
		global.fetch = originalFetch;
		unmount();
	},
);

test.serial(
	'should accept valid Jira URL input and extract issue key (Test Case 5.2)',
	async t => {
		const originalFetch = global.fetch;
		const fetchCalls: Array<{url: string; method: string; body?: any}> = [];

		// Mock fetch with tracking
		global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
			const urlString = url.toString();
			fetchCalls.push({
				url: urlString,
				method: init?.method || 'GET',
				body: init?.body ? JSON.parse(init.body as string) : undefined,
			});

			// Mock fetching assigned issues (empty list)
			if (urlString.includes('/search')) {
				return new Response(
					JSON.stringify({
						issues: [],
						startAt: 0,
						maxResults: 50,
						total: 0,
					}),
					{status: 200},
				);
			}

			// Mock fetching specific issue (URL will be converted to JTS-5678)
			if (
				urlString.includes('/issue/JTS-5678') &&
				!urlString.includes('/worklog')
			) {
				return new Response(
					JSON.stringify({
						id: '56789',
						key: 'JTS-5678',
						fields: {
							summary: 'Issue from URL input',
							status: {
								name: 'To Do',
								statusCategory: {name: 'To Do'},
							},
							issuetype: {
								name: 'Bug',
								iconUrl: 'https://example.com/bug-icon.png',
							},
							priority: {
								name: 'High',
								iconUrl: 'https://example.com/high-priority.png',
							},
							assignee: {
								displayName: 'URL Test User',
								emailAddress: 'urltest@example.com',
							},
							created: '2025-01-05T10:00:00.000+0000',
							updated: '2025-01-09T15:00:00.000+0000',
						},
					}),
					{status: 200},
				);
			}

			// Mock worklog submission
			if (urlString.includes('/worklog')) {
				return new Response('{}', {status: 201});
			}

			return new Response('Not found', {status: 404});
		};

		const {lastFrame, stdin, unmount} = render(
			React.createElement(App, {config: testConfig}),
		);

		// Wait for main menu
		await new Promise(resolve => setTimeout(resolve, 3000));

		// Step 1: Press "L" to log work from timetable
		stdin.write('l');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 2: Select "Other" for manual input
		stdin.write(ARROW_DOWN);
		await new Promise(resolve => setTimeout(resolve, 100));
		stdin.write(ARROW_DOWN);
		await new Promise(resolve => setTimeout(resolve, 100));
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Verify we're in manual input mode
		let output = lastFrame();
		t.true(output?.includes('Enter issue key or URL') ?? false);

		// Step 3: Enter valid Jira URL
		stdin.write('https://jira.example.com/browse/JTS-5678');
		await new Promise(resolve => setTimeout(resolve, 500));
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Verify API was called to fetch the issue with extracted key
		const issueFetchCall = fetchCalls.find(
			call =>
				call.url.includes('/issue/JTS-5678') && !call.url.includes('/worklog'),
		);
		t.truthy(issueFetchCall);
		t.is(issueFetchCall?.method, 'GET');

		// Step 4: Verify we're now in time selection with correct issue
		output = lastFrame();
		t.true(output?.includes('Select time to log') ?? false);
		t.true(output?.includes('JTS-5678') ?? false);
		t.true(output?.includes('Issue from URL input') ?? false);

		// Step 5: Select 30 minutes (scroll down to custom and enter)
		// First go to custom option
		for (let i = 0; i < 5; i++) {
			stdin.write(ARROW_DOWN);
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 6: Enter custom time
		stdin.write('30m');
		await new Promise(resolve => setTimeout(resolve, 200));
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 7: Enter comment
		stdin.write('Fixed via URL');
		await new Promise(resolve => setTimeout(resolve, 200));
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 8: Select Yesterday
		stdin.write(ARROW_DOWN);
		await new Promise(resolve => setTimeout(resolve, 100));
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Verify worklog API was called with correct data
		const worklogCall = fetchCalls.find(call => call.url.includes('/worklog'));
		t.truthy(worklogCall);
		t.is(worklogCall?.method, 'POST');
		t.true(worklogCall?.url.includes('JTS-5678'));

		// Verify worklog data
		if (worklogCall?.body) {
			t.is(worklogCall.body.timeSpent, '30m');
			t.is(worklogCall.body.comment, 'Fixed via URL');
			// Verify it's yesterday's date
			const startedDate = new Date(
				worklogCall.body.started.replace('+0000', 'Z'),
			);
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			t.is(startedDate.toDateString(), yesterday.toDateString());
		}

		// Verify success
		output = lastFrame();
		t.true(output?.includes('Worklog successfully added!') ?? false);

		// Restore original fetch
		global.fetch = originalFetch;
		unmount();
	},
);

test.serial(
	'should use custom default comment for favorite issue (Test Case 10.3)',
	async t => {
		const {lastFrame, stdin, unmount} = render(
			React.createElement(App, {config: testConfigWithComments}),
		);

		// Wait for main menu
		await new Promise(resolve => setTimeout(resolve, 3000));

		// Step 1: Press "L" to log work from timetable
		stdin.write('l');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 2: Select "Favorites"
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 3: Select first issue (TEST-123)
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 4: Select first time option (1 hour)
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Verify we're in comment input and the default comment is pre-filled
		const output = lastFrame();
		t.true(output?.includes('Enter comment') ?? false);
		t.true(output?.includes('Working on feature implementation') ?? false);

		// Step 5: Accept the default comment by pressing Enter
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 6: Select "Today"
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Wait for submission to complete
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Verify success message
		const finalOutput = lastFrame();
		t.true(finalOutput?.includes('Worklog successfully added!') ?? false);
		t.true(finalOutput?.includes('Working on feature implementation') ?? false);

		unmount();
	},
);
