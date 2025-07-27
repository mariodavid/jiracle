import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import App from '../app.js';
import type {JiraConfig} from '../jira-client.js';
import {IssueKey} from '../domain/IssueKey.js';
import {InkTestHelpers} from './utils/ink-test-helpers.js';

// Test config that will be passed directly to the App component
const testConfig: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token',
	favorites: [
		{key: IssueKey.fromString('TEST-123')},
		{key: IssueKey.fromString('TEST-456')},
	],
};

// Mock fetch globally for all tests
test.beforeEach(() => {
	global.fetch = async (url: string | URL | Request) => {
		const urlString = String(url);

		// Mock search endpoint for both favorites and assigned issues
		if (urlString.includes('/rest/api/2/search')) {
			// Small delay to simulate API call
			await InkTestHelpers.delay(100);

			return {
				ok: true,
				status: 200,
				json: async () => ({
					issues: [
						{
							id: '1',
							key: IssueKey.fromString('TEST-123'),
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
							key: IssueKey.fromString('TEST-456'),
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
	// EXPLICIT TEST DATA
	const expectedTimetableElements = [
		'█ █ █▀█ ▄▀█ █▀▀ █   █▀▀', // JIRACLE title in ASCII art
		'KW', // Week number display
		'[T] Today',
		'[Q] Quit',
		'[↑↓←→] Navigate Cells',
		'[Enter] Log Work',
	];
	const unexpectedElements = ['Loading configuration and issues'];

	// OPERATIONS
	const {lastFrame, unmount} = render(
		React.createElement(App, {config: testConfig}),
	);

	// Wait for loading to complete
	await InkTestHelpers.delay(3000);

	const output = lastFrame();

	// SPECIFIC VALUE COMPARISONS
	// Verify app is not stuck in loading state
	for (const element of unexpectedElements) {
		t.false(
			output?.includes(element) ?? true,
			`Should not display loading state: ${element}`,
		);
	}

	// Verify weekly timetable elements are present
	for (const element of expectedTimetableElements) {
		t.true(
			output?.includes(element) ?? false,
			`Should display timetable element: ${element}`,
		);
	}

	unmount();
});

test('should open worklog form when log work key is pressed', async t => {
	// EXPLICIT TEST DATA
	const keyToPress = 'l';
	const expectedWorklogFormElements = [
		'Issue Key:',
		'Time spent:',
		'[Submit]',
		'[Cancel]',
	];
	const initialElements = ['Week', '[T] Today'];

	// OPERATIONS
	const {lastFrame, stdin, unmount} = render(
		React.createElement(App, {config: testConfig}),
	);

	// Wait for weekly timetable to load
	await InkTestHelpers.delay(3000);

	// Verify we're in the timetable state first
	const initialOutput = lastFrame();
	for (const element of initialElements) {
		t.true(
			initialOutput?.includes(element) ?? false,
			`Initial state should show: ${element}`,
		);
	}

	// Simulate pressing the log work key
	stdin.write(keyToPress);

	// Wait for form to open
	await InkTestHelpers.delay(500);

	const output = lastFrame();

	// SPECIFIC VALUE COMPARISONS
	// Verify worklog form elements are present
	for (const element of expectedWorklogFormElements) {
		t.true(
			output?.includes(element) ?? false,
			`Should display worklog form element: ${element}`,
		);
	}

	unmount();
});
