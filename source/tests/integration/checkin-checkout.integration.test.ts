import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {WeeklyTimetableView} from '../../components/WeeklyTimetableView.js';
import type {JiraConfig} from '../../jira-client.js';

// Mock config for testing
const mockConfig: JiraConfig = {
	jiraUrl: 'https://test.atlassian.net',
	username: 'test@example.com',
	apiToken: 'test-token',
	favorites: [],
	attendance: {
		enabled: true,
		workingHours: 8,
		breakMinutes: 30,
		defaultCheckIn: '09:00',
		defaultCheckOut: '17:00',
		defaultBreakMinutes: 30,
	},
};

test('WeeklyTimetableView shows help text with checkin/checkout options', t => {
	const onBack = () => {};

	const {lastFrame} = render(
		React.createElement(WeeklyTimetableView, {
			onBack,
			config: mockConfig,
		}),
	);

	const output = lastFrame() || '';
	// Check that help text includes new checkin/checkout options
	t.true(output.includes('[I] Check In'));
	t.true(output.includes('[O] Check Out'));
});

test('WeeklyTimetableView renders without errors with attendance config', t => {
	const onBack = () => {};

	const {lastFrame} = render(
		React.createElement(WeeklyTimetableView, {
			onBack,
			config: mockConfig,
		}),
	);

	const output = lastFrame() || '';
	// Should render without crashing and show some content
	t.true(output.length > 0);
	t.true(typeof output === 'string');
});

test('WeeklyTimetableView renders help text correctly', t => {
	const onBack = () => {};

	const {lastFrame} = render(
		React.createElement(WeeklyTimetableView, {
			onBack,
			config: mockConfig,
		}),
	);

	const output = lastFrame() || '';
	// Check for the updated help text with both Check In and Check Out
	t.true(output.includes('[I] Check In'));
	t.true(output.includes('[O] Check Out'));
	t.true(output.includes('[T] Today'));
	t.true(output.includes('[R] Refresh'));
	t.true(output.includes('[Q] Quit'));
});
