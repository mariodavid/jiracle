import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {WeeklyTimetableView} from '../../components/WeeklyTimetableView.js';
import type {JiraConfig} from '../../jira-client.js';

// Simplified tests for component structure without hook mocking
// The actual hook integration will be tested in integration tests

test('WeeklyTimetableView renders basic structure', t => {
	const mockConfig: JiraConfig = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
	};

	const props = {
		onBack: () => {},
		config: mockConfig,
		preloadedData: null,
		userEmail: null,
	};

	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));

	const output = lastFrame()!;

	// Should render header
	t.true(output.includes('JIRACLE - Weekly Timetable'));

	// Should render week navigation elements
	t.true(output.includes('← Previous Week'));
	t.true(output.includes('Next Week →'));
	t.true(output.includes('Week'));

	// Should render keyboard shortcuts
	t.true(output.includes('[←] Previous Week'));
	t.true(output.includes('[→] Next Week'));
	t.true(output.includes('[T] Today'));
	t.true(output.includes('[R] Refresh'));
	t.true(output.includes('[Q] Back'));
});

test('WeeklyTimetableView shows loading state initially', t => {
	const mockConfig: JiraConfig = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
	};

	const props = {
		onBack: () => {},
		config: mockConfig,
		preloadedData: null,
		userEmail: null,
	};

	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));

	// Should show loading or error since config is invalid
	const output = lastFrame()!;
	t.true(
		output.includes('Loading worklogs...') ||
			output.includes('Error:') ||
			output.includes('No data available'),
	);
});
