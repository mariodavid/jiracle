import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {WeeklyTimetableView} from '../../components/weekly-timetable-view.js';
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
		onBack() {},
		config: mockConfig,
		userEmail: undefined,
	};

	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));

	const output = lastFrame()!;

	// Should render header (BigText renders as ASCII art, so we check for basic structure)
	t.true(output.includes('Week'));

	// Should render week title in header
	t.true(output.includes('Week'));

	// Should render keyboard shortcuts (updated for new navigation)
	t.true(output.includes('[↑↓←→] Navigate Cells'));
	t.true(output.includes('[A] Add Worklog'));
	t.true(output.includes('[Shift+←→] Week Navigation'));
	t.true(output.includes('[T] Today'));
	t.true(output.includes('[R] Refresh'));
	t.true(output.includes('[D] Delete Worklogs'));
	t.true(output.includes('[Q] Quit'));
});

test('WeeklyTimetableView shows loading state initially', t => {
	const mockConfig: JiraConfig = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
	};

	const props = {
		onBack() {},
		config: mockConfig,
		userEmail: undefined,
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
