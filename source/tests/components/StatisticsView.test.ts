import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {StatisticsView} from '../../components/StatisticsView.js';
import type {JiraConfig} from '../../jira-client.js';

// TEST DATA
const VALID_CONFIG_WITH_ATTENDANCE: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token',
	attendance: {
		enabled: true,
		csvPath: '/tmp/test-attendance.csv',
		workingHours: 8,
		breakMinutes: 30,
		defaultCheckIn: '09:00',
		defaultCheckOut: '17:00',
		defaultBreakMinutes: 30,
	},
};

const CONFIG_WITHOUT_ATTENDANCE: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token',
};

const DISABLED_ATTENDANCE_CONFIG: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token',
	attendance: {
		enabled: false,
		csvPath: '/tmp/test-attendance.csv',
		workingHours: 8,
		breakMinutes: 30,
		defaultCheckIn: '09:00',
		defaultCheckOut: '17:00',
		defaultBreakMinutes: 30,
	},
};

// OPERATIONS
function renderStatisticsView(config: JiraConfig) {
	let onBackCalled = false;
	const mockOnBack = () => {
		onBackCalled = true;
	};

	const {lastFrame, stdin} = render(
		React.createElement(StatisticsView, {
			config,
			onBack: mockOnBack,
		}),
	);

	return {
		output: lastFrame()!,
		stdin,
		onBackCalled: () => onBackCalled,
	};
}

// SPECIFIC VALUE COMPARISONS
test('should show loading state initially', t => {
	const {output} = renderStatisticsView(VALID_CONFIG_WITH_ATTENDANCE);

	t.true(output.includes('Loading statistics...'));
});

test('should show loading state initially even without attendance', t => {
	const {output} = renderStatisticsView(CONFIG_WITHOUT_ATTENDANCE);

	// Component shows loading initially, then switches to error asynchronously
	t.true(output.includes('Loading statistics...'));
});

test('should show loading state initially with disabled attendance', t => {
	const {output} = renderStatisticsView(DISABLED_ATTENDANCE_CONFIG);

	// Component shows loading initially, then switches to error asynchronously
	t.true(output.includes('Loading statistics...'));
});

test('should handle keyboard input for navigation', t => {
	const {stdin, onBackCalled} = renderStatisticsView(
		VALID_CONFIG_WITH_ATTENDANCE,
	);

	// Test ESC key
	stdin.write('\u001B'); // ESC
	t.true(onBackCalled());
});

test('should handle q key for quit', t => {
	const {stdin, onBackCalled} = renderStatisticsView(
		VALID_CONFIG_WITH_ATTENDANCE,
	);

	// Test q key
	stdin.write('q');
	t.true(onBackCalled());
});

test('should render with proper component structure', t => {
	const {output} = renderStatisticsView(VALID_CONFIG_WITH_ATTENDANCE);

	// Should have some basic structure (loading or error state)
	t.true(output.length > 0);
	t.true(output.includes('Loading') || output.includes('Error'));
});

test('should create jira client and attendance manager instances', t => {
	// This test verifies the component doesn't crash during initialization
	const {output} = renderStatisticsView(VALID_CONFIG_WITH_ATTENDANCE);

	// Component should render without throwing
	t.true(output.includes('Loading statistics...'));
});

test('should handle component unmount gracefully', t => {
	const {unmount} = render(
		React.createElement(StatisticsView, {
			config: VALID_CONFIG_WITH_ATTENDANCE,
			onBack() {},
		}),
	);

	// Should unmount without errors
	t.notThrows(() => {
		unmount();
	});
});
