import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import App from '../app.js';
import type {JiraConfig} from '../jira-client.js';

// Test config with favorites
const testConfig: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token',
	favorites: [{key: 'TEST-123'}, {key: 'TEST-456'}],
};

test.serial(
	'should fetch favorite issues from API when selecting favorites',
	async t => {
		const fetchCalls: Array<{url: string; method: string; body?: any}> = [];

		// Mock fetch to track API calls
		global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
			const urlString = url.toString();
			fetchCalls.push({
				url: urlString,
				method: init?.method || 'GET',
				body: init?.body ? JSON.parse(init.body as string) : undefined,
			});

			// Mock search endpoint
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
									summary: 'First Favorite Issue',
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
									summary: 'Second Favorite Issue',
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

		// Wait for app to load and fetch issues
		await new Promise(resolve => setTimeout(resolve, 3000));

		// Verify favorites API was called during initialization
		const favoritesFetchCall = fetchCalls.find(call => {
			if (!call.url.includes('/rest/api/2/search') || !call.body) {
				return false;
			}
			const jql = call.body.jql;
			return (
				jql &&
				jql.includes('key in') &&
				jql.includes('TEST-123') &&
				jql.includes('TEST-456') &&
				jql.includes('resolution = Unresolved')
			);
		});

		t.truthy(favoritesFetchCall, 'Should have fetched favorite issues on load');
		t.is(favoritesFetchCall?.method, 'POST');

		// Clear previous fetch calls
		fetchCalls.length = 0;

		// Step 1: Press "L" to log work from timetable
		stdin.write('l');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Step 2: Select "Favorites"
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 500));

		// Verify favorites are displayed with data from API
		const output = lastFrame();
		t.true(output?.includes('Favorite Issues') ?? false);
		t.true(output?.includes('TEST-123 - First Favorite Issue') ?? false);
		t.true(output?.includes('TEST-456 - Second Favorite Issue') ?? false);

		// No additional API call should be made when selecting favorites
		// since they were already fetched during initialization
		const additionalFavoritesCalls = fetchCalls.filter(call => {
			if (!call.url.includes('/rest/api/2/search') || !call.body) {
				return false;
			}
			const jql = call.body.jql;
			return jql && jql.includes('key in') && jql.includes('TEST-123');
		});

		t.is(
			additionalFavoritesCalls.length,
			0,
			'Should not fetch favorites again when selecting favorites menu',
		);

		unmount();
	},
);

test.serial('should handle empty favorites gracefully', async t => {
	const configWithNoFavorites: JiraConfig = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		favorites: [],
	};

	const fetchCalls: Array<{url: string; method: string; body?: any}> = [];

	// Mock fetch to track API calls
	global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
		const urlString = url.toString();
		fetchCalls.push({
			url: urlString,
			method: init?.method || 'GET',
			body: init?.body ? JSON.parse(init.body as string) : undefined,
		});

		// Mock search endpoint for assigned issues
		if (urlString.includes('/rest/api/2/search')) {
			await new Promise(resolve => setTimeout(resolve, 100));

			return {
				ok: true,
				status: 200,
				json: async () => ({
					issues: [
						{
							id: '1',
							key: 'ASSIGNED-1',
							fields: {
								summary: 'Assigned Issue',
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

		return {
			ok: false,
			status: 404,
			json: async () => ({error: 'Not found'}),
		} as Response;
	};

	const {lastFrame, stdin, unmount} = render(
		React.createElement(App, {config: configWithNoFavorites}),
	);

	// Wait for app to load
	await new Promise(resolve => setTimeout(resolve, 3000));

	// Verify no favorites API call was made (since favorites array is empty)
	const favoritesFetchCall = fetchCalls.find(call => {
		if (!call.url.includes('/rest/api/2/search') || !call.body) {
			return false;
		}
		const jql = call.body.jql;
		return jql && jql.includes('key in');
	});

	t.falsy(
		favoritesFetchCall,
		'Should not fetch favorites when favorites array is empty',
	);

	// Step 1: Press "L" to log work from timetable
	stdin.write('l');
	await new Promise(resolve => setTimeout(resolve, 500));

	// Step 2: Select "Favorites"
	stdin.write('\r');
	await new Promise(resolve => setTimeout(resolve, 500));

	// Should show empty favorites list
	const output = lastFrame();
	t.true(output?.includes('Favorite Issues') ?? false);
	// The select component would show an empty list or a message
	// We can't test the exact behavior without knowing the Select component implementation

	unmount();
});

test.serial('should fetch favorite issues with object format', async t => {
	const configWithComplexFavorites: JiraConfig = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		favorites: [
			{key: 'FAV-001', defaultComment: 'Working on feature'},
			{key: 'FAV-002'},
			{key: 'FAV-003', defaultComment: 'Bug fixing'},
		],
	};

	const fetchCalls: Array<{url: string; method: string; body?: any}> = [];

	// Mock fetch to track API calls
	global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
		const urlString = url.toString();
		fetchCalls.push({
			url: urlString,
			method: init?.method || 'GET',
			body: init?.body ? JSON.parse(init.body as string) : undefined,
		});

		// Mock search endpoint
		if (urlString.includes('/rest/api/2/search')) {
			await new Promise(resolve => setTimeout(resolve, 100));

			return {
				ok: true,
				status: 200,
				json: async () => ({
					issues: [
						{
							id: '1',
							key: 'FAV-001',
							fields: {
								summary: 'Feature Development',
								status: {name: 'In Progress'},
								issuetype: {name: 'Story'},
								priority: {name: 'High'},
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
							key: 'FAV-002',
							fields: {
								summary: 'Simple Task',
								status: {name: 'To Do'},
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
							id: '3',
							key: 'FAV-003',
							fields: {
								summary: 'Critical Bug',
								status: {name: 'In Progress'},
								issuetype: {name: 'Bug'},
								priority: {name: 'Critical'},
								assignee: {
									displayName: 'Test User',
									emailAddress: 'test@example.com',
								},
								created: '2025-01-01T00:00:00.000Z',
								updated: '2025-01-01T00:00:00.000Z',
							},
						},
					],
					total: 3,
					startAt: 0,
					maxResults: 50,
				}),
			} as Response;
		}

		return {
			ok: false,
			status: 404,
			json: async () => ({error: 'Not found'}),
		} as Response;
	};

	const {unmount} = render(
		React.createElement(App, {config: configWithComplexFavorites}),
	);

	// Wait for app to load and fetch issues
	await new Promise(resolve => setTimeout(resolve, 3000));

	// Verify favorites API was called with all keys extracted correctly
	const favoritesFetchCall = fetchCalls.find(call => {
		if (!call.url.includes('/rest/api/2/search') || !call.body) {
			return false;
		}
		const jql = call.body.jql;
		return (
			jql &&
			jql.includes('key in') &&
			jql.includes('FAV-001') &&
			jql.includes('FAV-002') &&
			jql.includes('FAV-003') &&
			jql.includes('resolution = Unresolved')
		);
	});

	t.truthy(
		favoritesFetchCall,
		'Should fetch all favorite issues with object format',
	);
	t.is(favoritesFetchCall?.method, 'POST');

	// Verify the JQL query format
	const jql = favoritesFetchCall?.body?.jql;
	t.truthy(jql);
	t.regex(
		jql,
		/key in \("FAV-001", "FAV-002", "FAV-003"\) AND resolution = Unresolved/,
		'JQL should have correct format with quoted keys',
	);

	unmount();
});
