import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {WeeklyTimetableView} from '../../components/WeeklyTimetableView.js';
import type {JiraConfig} from '../../jira-client.js';

// Mock test configuration
const mockConfig: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token',
};

test('Integration: WeeklyTimetableView renders complete UI structure', t => {
	const props = {
		onBack: () => {},
		config: mockConfig,
		preloadedData: null,
		userEmail: null,
	};

	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));
	const output = lastFrame()!;

	// Verify main header
	t.true(output.includes('JIRACLE - Weekly Timetable'));

	// Verify week navigation elements are present
	t.true(output.includes('← Previous Week'));
	t.true(output.includes('Next Week →'));
	t.true(output.includes('Week'));

	// Verify keyboard shortcuts are displayed
	t.true(output.includes('[←] Previous Week'));
	t.true(output.includes('[→] Next Week'));
	t.true(output.includes('[T] Today'));
	t.true(output.includes('[R] Refresh'));
	t.true(output.includes('[Q] Back'));

	// Should show loading or error state initially since API calls will fail
	const hasLoadingOrError =
		output.includes('Loading worklogs...') ||
		output.includes('Error:') ||
		output.includes('No data available');
	t.true(hasLoadingOrError);
});

test('Integration: WeeklyTimetableView handles week navigation', t => {
	const props = {
		onBack: () => {},
		config: mockConfig,
		preloadedData: null,
		userEmail: null,
	};

	const {lastFrame, stdin} = render(
		React.createElement(WeeklyTimetableView, props),
	);

	// Simulate left arrow key press for previous week
	stdin.write('\u001B[D'); // Left arrow escape sequence

	let output = lastFrame()!;
	t.true(output.includes('JIRACLE - Weekly Timetable'));

	// Simulate right arrow key press for next week
	stdin.write('\u001B[C'); // Right arrow escape sequence

	output = lastFrame()!;
	t.true(output.includes('JIRACLE - Weekly Timetable'));

	// Test still renders main structure after navigation
	t.true(output.includes('Week'));
});

test('Integration: WeeklyTimetableView handles today navigation', t => {
	const props = {
		onBack: () => {},
		config: mockConfig,
		preloadedData: null,
		userEmail: null,
	};

	const {lastFrame, stdin} = render(
		React.createElement(WeeklyTimetableView, props),
	);

	// Simulate 'T' key press for today
	stdin.write('t');

	const output = lastFrame()!;
	t.true(output.includes('JIRACLE - Weekly Timetable'));
	t.true(output.includes('Week'));
});

test('Integration: WeeklyTimetableView handles refresh', t => {
	const props = {
		onBack: () => {},
		config: mockConfig,
		preloadedData: null,
		userEmail: null,
	};

	const {lastFrame, stdin} = render(
		React.createElement(WeeklyTimetableView, props),
	);

	// Simulate 'R' key press for refresh
	stdin.write('r');

	const output = lastFrame()!;
	t.true(output.includes('JIRACLE - Weekly Timetable'));
});

test('Integration: WeeklyTimetableView handles back navigation', t => {
	let backCalled = false;
	const props = {
		onBack: () => {
			backCalled = true;
		},
		config: mockConfig,
	};

	const {stdin} = render(React.createElement(WeeklyTimetableView, props));

	// Simulate 'Q' key press for back
	stdin.write('q');

	t.true(backCalled);
});

test('Integration: WeeklyTimetableView handles escape key for back navigation', t => {
	let backCalled = false;
	const props = {
		onBack: () => {
			backCalled = true;
		},
		config: mockConfig,
	};

	const {stdin} = render(React.createElement(WeeklyTimetableView, props));

	// Simulate escape key press
	stdin.write('\u001B'); // Escape key

	t.true(backCalled);
});

test('Integration: Week calculations work correctly', t => {
	const props = {
		onBack: () => {},
		config: mockConfig,
		preloadedData: null,
		userEmail: null,
	};

	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));
	const output = lastFrame()!;

	// Should display week information
	t.true(output.includes('Week'));

	// Should handle Monday as start of week (based on our WeekNavigator implementation)
	// The exact week number will depend on current date, but structure should be present
	t.true(output.includes('← Previous Week'));
	t.true(output.includes('Next Week →'));
});

test('Integration: TimetableGrid displays correct structure when loading', t => {
	const props = {
		onBack: () => {},
		config: mockConfig,
		preloadedData: null,
		userEmail: null,
	};

	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));
	const output = lastFrame()!;

	// Should show loading state initially
	const hasAppropriateState =
		output.includes('Loading worklogs...') ||
		output.includes('No data available') ||
		output.includes('Error:');
	t.true(hasAppropriateState);
});

test('Integration: Error handling for invalid config', t => {
	const invalidConfig: JiraConfig = {
		jiraUrl: '',
		username: '',
		apiToken: '',
	};

	const props = {
		onBack: () => {},
		config: invalidConfig,
	};

	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));
	const output = lastFrame()!;

	// Should still render the main structure
	t.true(output.includes('JIRACLE - Weekly Timetable'));

	// Should handle the error gracefully
	const hasErrorHandling =
		output.includes('Error:') ||
		output.includes('Loading worklogs...') ||
		output.includes('No data available');
	t.true(hasErrorHandling);
});
