import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {WeeklyTimetableView} from '../../components/WeeklyTimetableView.js';
import type {JiraConfig} from '../../jira-client.js';
import {IssueKey} from '../../domain/IssueKey.js';

const mockConfig: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token-123',
	defaultTime: '1h',
	defaultComment: 'Test work',
};

const mockProps = {
	onBack() {},
	config: mockConfig,
	userEmail: 'test@example.com',
};

// === ADD WORKLOG HOTKEY TESTS ===
test('WeeklyTimetableView shows [A] Add Worklog hint in footer', t => {
	const {lastFrame} = render(
		React.createElement(WeeklyTimetableView, mockProps),
	);
	const output = lastFrame() ?? '';

	// Should show the [A] Add Worklog hint
	t.true(output.includes('[A] Add Worklog'));
});

test('WeeklyTimetableView includes Add Worklog in navigation hints', t => {
	const {lastFrame} = render(
		React.createElement(WeeklyTimetableView, mockProps),
	);
	const output = lastFrame() ?? '';

	// Should show navigation hints including Add Worklog
	t.true(
		output.includes('[↑↓←→] Navigate Cells [Enter] Log Work [A] Add Worklog'),
	);
});

test('WeeklyTimetableView shows comprehensive keyboard shortcuts', t => {
	const {lastFrame} = render(
		React.createElement(WeeklyTimetableView, mockProps),
	);
	const output = lastFrame() ?? '';

	// Should show all the main keyboard shortcuts
	t.true(
		output.includes('[↑↓←→] Navigate Cells [Enter] Log Work [A] Add Worklog'),
	);
	t.true(output.includes('[D] Delete Worklogs [I] Check In [O] Check Out'));
	t.true(output.includes('[T] Today [R] Refresh [Q] Quit'));
});

test('WeeklyTimetableView renders with default configuration', t => {
	const {lastFrame} = render(
		React.createElement(WeeklyTimetableView, mockProps),
	);
	const output = lastFrame() ?? '';

	// Should render the basic structure
	t.true(output.includes('[A] Add Worklog')); // Add Worklog feature should be present
	t.true(output.length > 100); // Should have substantial content
});

test('WeeklyTimetableView handles configuration with favorites', t => {
	const configWithFavorites: JiraConfig = {
		...mockConfig,
		favorites: [
			{
				key: IssueKey.fromString('FAV-123'),
				defaultTime: '2h',
				defaultComment: 'Favorite work',
			},
			{key: IssueKey.fromString('FAV-456'), defaultTime: '4h'},
		],
	};

	const propsWithFavorites = {
		...mockProps,
		config: configWithFavorites,
	};

	const {lastFrame} = render(
		React.createElement(WeeklyTimetableView, propsWithFavorites),
	);
	const output = lastFrame() ?? '';

	// Should still render properly with favorites
	t.true(output.includes('[A] Add Worklog'));
	t.true(output.length > 100);
});

test('WeeklyTimetableView handles configuration with projects', t => {
	const configWithProjects: JiraConfig = {
		...mockConfig,
		projects: [{key: 'PROJ'}],
	};

	const propsWithProjects = {
		...mockProps,
		config: configWithProjects,
	};

	const {lastFrame} = render(
		React.createElement(WeeklyTimetableView, propsWithProjects),
	);
	const output = lastFrame() ?? '';

	// Should still render properly with projects
	t.true(output.includes('[A] Add Worklog'));
	t.true(output.length > 100);
});

// Integration test to verify the add worklog feature is properly integrated
test('WeeklyTimetableView renders without errors with comprehensive config', t => {
	const comprehensiveConfig: JiraConfig = {
		jiraUrl: 'https://jira.company.com/',
		username: 'user@company.com',
		apiToken: 'token-123',
		defaultTime: '6h',
		defaultComment: 'Development work',
		favorites: [
			{
				key: IssueKey.fromString('DEV-123'),
				defaultTime: '8h',
				defaultComment: 'Main feature work',
			},
			{
				key: IssueKey.fromString('BUG-456'),
				defaultTime: '2h',
				defaultComment: 'Bug fixing',
			},
		],
		projects: [{key: 'DEV'}, {key: 'BUG'}],
		slidingWindowDays: {past: 14, future: 7},
	};

	const comprehensiveProps = {
		...mockProps,
		config: comprehensiveConfig,
		onLogWork() {},
		onCellWorklog() {},
	};

	const {lastFrame} = render(
		React.createElement(WeeklyTimetableView, comprehensiveProps),
	);
	const output = lastFrame() ?? '';

	// Should render all expected elements
	t.true(output.includes('[A] Add Worklog'));
	t.true(output.includes('[Enter] Log Work'));
	t.true(output.includes('[Q] Quit'));

	// Should handle the comprehensive configuration without errors
	t.true(output.length > 200);
});
