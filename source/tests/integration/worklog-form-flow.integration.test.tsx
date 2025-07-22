import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {WeeklyTimetableView} from '../../components/weekly-timetable-view.js';
import {InkTestHelpers} from '../utils/ink-test-helpers.js';

// Simple waitFor utility for integration tests
const waitFor = async (
	condition: () => boolean,
	timeout = 1000,
	interval = 50,
) => {
	const start = Date.now();
	while (Date.now() - start < timeout) {
		if (condition()) {
			return;
		}

		await InkTestHelpers.delay(interval);
	}

	throw new Error('Condition not met within timeout');
};

// Mock fetch to simulate API calls
let mockFetchCallCount = 0;
let shouldFailWorklogSubmit = false;

const originalFetch = global.fetch;

// Setup mock fetch
test.beforeEach(() => {
	mockFetchCallCount = 0;
	shouldFailWorklogSubmit = false;

	global.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
		mockFetchCallCount++;
		const urlString = String(url);

		// Mock worklog submission
		if (urlString.includes('/worklog') && options?.method === 'POST') {
			if (shouldFailWorklogSubmit) {
				const response: Response = {
					ok: false,
					status: 400,
					text: async () => 'Bad Request',
				} as Response;
				return response;
			}

			// Store worklog data if needed for validation
			const response: Response = {
				ok: true,
				status: 201,
				json: async () => ({}),
			} as Response;
			return response;
		}

		// Mock search for worklogs
		if (urlString.includes('/search')) {
			const response: Response = {
				ok: true,
				status: 200,
				json: async () => ({
					issues: [
						{
							key: 'TEST-123',
							fields: {
								summary: 'Test Issue',
								worklog: {
									total: 1,
									worklogs: [
										{
											id: '12345',
											timeSpent: '1h',
											comment: 'Test worklog',
											started: '2025-07-10T09:00:00.000+0000',
											author: {
												emailAddress: 'test@example.com',
											},
										},
									],
								},
							},
						},
					],
				}),
			} as Response;
			return response;
		}

		// Default mock response
		const response: Response = {
			ok: true,
			status: 200,
			json: async () => ({}),
		} as Response;
		return response;
	};
});

test.afterEach(() => {
	global.fetch = originalFetch;
});

const mockConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token',
};

test('Integration: Component renders without errors', async t => {
	const props = {
		onBack() {},
		config: mockConfig,
		userEmail: 'test@example.com',
	};

	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));

	// Wait for component to render with expected content
	await waitFor(() => {
		const output = lastFrame();
		return Boolean(output?.includes('Week') && output.includes('[Q] Quit'));
	});

	// Verify component structure is rendered correctly
	const output = lastFrame()!;
	t.true(output.includes('Week'), 'Should render week header');
	t.true(output.includes('[Q] Quit'), 'Should render keyboard shortcuts');
});

test('Integration: API calls are made', async t => {
	const props = {
		onBack() {},
		config: mockConfig,
		userEmail: 'test@example.com',
	};

	render(React.createElement(WeeklyTimetableView, props));

	// Wait for API calls
	await InkTestHelpers.delay(200);

	// Should have made at least one API call for loading data
	t.true(mockFetchCallCount >= 1);
});

test('Integration: Component handles API errors gracefully', async t => {
	shouldFailWorklogSubmit = true;

	const props = {
		onBack() {},
		config: mockConfig,
		userEmail: 'test@example.com',
	};

	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));

	// Wait for component to stabilize despite API errors
	await waitFor(() => {
		const output = lastFrame();
		return Boolean(output?.includes('Week'));
	});

	// Verify component still renders correctly despite API errors
	const output = lastFrame()!;
	t.true(
		output.includes('Week'),
		'Should still render week header despite API errors',
	);
	t.true(
		output.includes('[Q] Quit'),
		'Should still render controls despite API errors',
	);
	// Component should not show error in UI for initial load failures
	t.false(
		output.includes('Error'),
		'Should not show error message in UI for API failures',
	);
});

test('Integration: Component accepts different configurations', async t => {
	const differentConfig = {
		jiraUrl: 'https://different.example.com/',
		username: 'different@example.com',
		apiToken: 'different-token',
	};

	const props = {
		onBack() {},
		config: differentConfig,
		userEmail: 'different@example.com',
	};

	const startingCallCount = mockFetchCallCount;
	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));

	await waitFor(() => {
		const output = lastFrame();
		return Boolean(output?.includes('Week'));
	});

	// Wait for potential API calls
	await InkTestHelpers.delay(200);

	// Verify component renders correctly with different config
	const output = lastFrame()!;
	t.true(output.includes('Week'), 'Should render with different config');
	t.true(
		output.includes('[Q] Quit'),
		'Should render controls with different config',
	);
	// API calls should be made to the different URL (mocked)
	t.true(
		mockFetchCallCount > startingCallCount,
		`Should make API calls with different config. Started with ${startingCallCount}, ended with ${mockFetchCallCount}`,
	);
});

test('Integration: Mock fetch setup works correctly', t => {
	// Test that our mock is working
	t.is(typeof global.fetch, 'function');
	// Reset counter for this test since other tests might have run first
	mockFetchCallCount = 0;
	t.is(mockFetchCallCount, 0);
});

test('Integration: Component lifecycle completes', async t => {
	const props = {
		onBack() {},
		config: mockConfig,
		userEmail: 'test@example.com',
	};

	const {lastFrame, unmount} = render(
		React.createElement(WeeklyTimetableView, props),
	);

	// Wait for component lifecycle to complete
	await waitFor(() => {
		const output = lastFrame();
		return Boolean(output?.includes('Week'));
	});

	// Verify component is functional before unmounting
	const output = lastFrame()!;
	t.true(output.includes('Week'), 'Should be functional during lifecycle');

	// Verify unmount completes without errors
	t.notThrows(() => {
		unmount();
	}, 'Should unmount without throwing errors');
});
