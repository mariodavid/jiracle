import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import App from '../app.js';
import type {JiraConfig} from '../jira-client.js';

// Test config that will be passed directly to the App component
const testConfig: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token',
	favorites: [{key: 'TEST-123'}, {key: 'TEST-456'}],
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

test('should show weekly timetable after loading', async t => {
	const {lastFrame, unmount} = render(
		React.createElement(App, {config: testConfig}),
	);

	// Wait a bit for loading to complete
	await new Promise(resolve => setTimeout(resolve, 3000));

	const output = lastFrame();
	console.log('Test output:', output);

	// First check if we see weekly timetable or if still loading
	if (output?.includes('Loading configuration and issues')) {
		t.fail('App is still in loading state');
		unmount();
		return;
	}

	// Check if we got to the weekly timetable (BigText renders as ASCII art)
	t.true(output?.includes('Week') ?? false);
	t.true(output?.includes('Week') ?? false);
	t.true(output?.includes('[T] Today') ?? false);

	unmount();
});

test('should open worklog form when log work key is pressed', async t => {
	const {lastFrame, stdin, unmount} = render(
		React.createElement(App, {config: testConfig}),
	);

	// Wait for weekly timetable
	await new Promise(resolve => setTimeout(resolve, 3000));

	// Simulate pressing "L" - this should open the worklog form
	stdin.write('l');

	// Wait a bit
	await new Promise(resolve => setTimeout(resolve, 500));

	const output = lastFrame();

	// Should show the worklog form (inline form is opened)
	t.true(output?.includes('Issue Key:') ?? false);
	t.true(output?.includes('Time spent:') ?? false);
	t.true(output?.includes('[Submit]') ?? false);
	t.true(output?.includes('[Cancel]') ?? false);

	unmount();
});
