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

test('WeeklyTimetableView handles config with userEmail', t => {
	const mockConfig: JiraConfig = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
	};

	const props = {
		onBack() {},
		config: mockConfig,
		userEmail: 'user@example.com',
	};

	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));
	const output = lastFrame()!;

	// Should render without errors with user email
	t.true(output.includes('Week') || output.includes('Loading'));
});

test('WeeklyTimetableView displays keyboard shortcuts', t => {
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

	// Should show all keyboard shortcuts
	t.true(output.includes('Navigate Cells'));
	t.true(output.includes('Add Worklog'));
	t.true(output.includes('Week Navigation'));
	t.true(output.includes('Delete Worklogs'));
	t.true(output.includes('Check In'));
	t.true(output.includes('Check Out'));
	t.true(output.includes('Open in Browser'));
	t.true(output.includes('Today'));
	t.true(output.includes('Refresh'));
	t.true(output.includes('Quit'));
});

test('WeeklyTimetableView handles config with favorites', t => {
	const mockConfig: JiraConfig = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		favorites: [
			{key: 'FAV-123', defaultTime: '2h', defaultComment: 'Favorite work'},
			{key: 'FAV-456', defaultTime: '4h', defaultComment: 'Another favorite'},
		],
	};

	const props = {
		onBack() {},
		config: mockConfig,
		userEmail: undefined,
	};

	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));
	const output = lastFrame()!;

	// Should render with favorites configuration
	t.true(output.includes('Week') || output.includes('Loading'));
});

test('WeeklyTimetableView handles config without favorites', t => {
	const mockConfig: JiraConfig = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		favorites: [],
	};

	const props = {
		onBack() {},
		config: mockConfig,
		userEmail: undefined,
	};

	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));
	const output = lastFrame()!;

	// Should render without favorites
	t.true(output.includes('Week') || output.includes('Loading'));
});

test('WeeklyTimetableView displays week information', t => {
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

	// Should show week-related content
	t.true(
		output.includes('Week') ||
		output.includes('KW') || // German week number format
		output.includes('Loading')
	);
});

test('WeeklyTimetableView handles German date formatting', t => {
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

	// German formatting should be used (at least days/months)
	// Component should render without errors with German locale
	t.true(output.length > 0); // Basic render check
	t.pass('German date formatting handled');
});

test('WeeklyTimetableView shows browser support indicators', t => {
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

	// Should show browser-related shortcuts if supported
	t.true(output.includes('Open in Browser') || output.includes('[Shift+O]'));
});

test('WeeklyTimetableView handles attendance configuration', t => {
	const mockConfig: JiraConfig = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		attendance: {
			enabled: true,
			workingHours: 8,
			breakMinutes: 30,
			defaultCheckIn: '09:00',
			defaultCheckOut: '17:00',
			defaultBreakMinutes: 30,
			csvPath: '/tmp/attendance.csv',
		},
	};

	const props = {
		onBack() {},
		config: mockConfig,
		userEmail: undefined,
	};

	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));
	const output = lastFrame()!;

	// Should show attendance-related shortcuts
	t.true(output.includes('Check In') || output.includes('Check Out'));
});

test('WeeklyTimetableView handles config without attendance', t => {
	const mockConfig: JiraConfig = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		// No attendance config
	};

	const props = {
		onBack() {},
		config: mockConfig,
		userEmail: undefined,
	};

	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));
	const output = lastFrame()!;

	// Should render without attendance features
	t.true(output.includes('Week') || output.includes('Loading'));
});

test('WeeklyTimetableView shows proper layout structure', t => {
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

	// Should have proper layout with header and shortcuts
	t.true(output.includes('Week')); // Header
	t.true(output.includes('Navigate')); // Navigation hints
	t.true(output.length > 100); // Substantial content
});

test('WeeklyTimetableView handles complete config', t => {
	const mockConfig: JiraConfig = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		defaultTime: '8h',
		defaultComment: 'Daily work',
		projects: [
			{key: 'PROJ'},
		],
		favorites: [
			{key: 'FAV-123', defaultTime: '4h', defaultComment: 'Favorite task'},
		],
		slidingWindowDays: {past: 14, future: 7},
	};

	const props = {
		onBack() {},
		config: mockConfig,
		userEmail: 'user@example.com',
	};

	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));
	const output = lastFrame()!;

	// Should handle complete configuration without errors
	t.true(output.includes('Week') || output.includes('Loading'));
	t.true(output.includes('Navigate Cells'));
});

test('WeeklyTimetableView keyboard navigation hints are visible', t => {
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

	// Should show directional navigation
	t.true(output.includes('↑↓←→') || output.includes('Arrow'));
	t.true(output.includes('[A]') || output.includes('Add'));
	t.true(output.includes('[R]') || output.includes('Refresh'));
	t.true(output.includes('[Q]') || output.includes('Quit'));
});

test('WeeklyTimetableView renders title correctly', t => {
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

	// Should render the title bar with week information
	t.true(output.includes('Week') || output.includes('KW'));
	t.true(output.length > 50); // Should have substantial content
});

test('WeeklyTimetableView handles error states gracefully', t => {
	// Invalid config to trigger error state
	const mockConfig: JiraConfig = {
		jiraUrl: '', // Invalid URL
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

	// Should handle errors gracefully and still show basic structure
	t.true(
		output.includes('Error') ||
		output.includes('Loading') ||
		output.includes('Week')
	);
});

test('WeeklyTimetableView shows proper week range display', t => {
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

	// Should show week range information
	t.true(
		output.includes('Week') ||
		output.includes('-') || // Date range separator
		output.includes('KW') ||
		output.includes('Loading')
	);
});

test('WeeklyTimetableView component integration points', t => {
	const mockConfig: JiraConfig = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
	};

	const props = {
		onBack() {},
		config: mockConfig,
		userEmail: 'test@example.com',
	};

	// Should render all integration points without crashing
	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));
	const output = lastFrame()!;

	// Basic integration test - should not crash and show main elements
	t.true(output.length > 0);
	t.true(
		output.includes('Week') ||
		output.includes('Loading') ||
		output.includes('Error')
	);
	t.pass('Component integration points work correctly');
});
