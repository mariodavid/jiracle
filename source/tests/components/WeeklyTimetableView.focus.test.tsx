import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {WeeklyTimetableView} from '../../components/WeeklyTimetableView.js';
import type {JiraConfig} from '../../jira-client.js';

// Mock config for testing
const mockConfig: JiraConfig = {
	jiraUrl: 'https://test.com',
	username: 'test',
	apiToken: 'token',
	favorites: [],
};

test('WeeklyTimetableView displays week navigation and keyboard shortcuts', t => {
	// 1. EXPLICIT TEST DATA
	const expectedElements = [
		'KW', // Week format
		'[↑↓←→] Navigate Cells',
		'[A] Add Worklog',
		'[Q] Quit',
		'[T] Today',
	];
	const mockOnBack = () => {};

	// 2. OPERATIONS
	const {lastFrame} = render(
		<WeeklyTimetableView
			config={mockConfig}
			userEmail="test@example.com"
			onBack={mockOnBack}
		/>,
	);

	const output = lastFrame()!;

	// 3. SPECIFIC VALUE COMPARISONS
	for (const element of expectedElements) {
		t.true(output.includes(element), `Should display ${element}`);
	}

	// Verify week display format is present
	t.regex(output, /KW\d+/, 'Should show week number in KW format');
});

test('WeeklyTimetableView renders complete keyboard shortcut help', t => {
	// 1. EXPLICIT TEST DATA
	const expectedShortcuts = [
		'[↑↓←→] Navigate Cells',
		'[Enter] Log Work',
		'[A] Add Worklog',
		'[Shift+←→] Week Navigation',
		'[T] Today',
		'[R] Refresh',
		'[Q] Quit',
	];

	// 2. OPERATIONS
	const {lastFrame} = render(
		<WeeklyTimetableView
			config={mockConfig}
			userEmail="test@example.com"
			onBack={() => {}}
		/>,
	);

	const output = lastFrame()!;

	// 3. SPECIFIC VALUE COMPARISONS
	for (const shortcut of expectedShortcuts) {
		t.true(
			output.includes(shortcut),
			`Should show keyboard shortcut: ${shortcut}`,
		);
	}

	// Verify shortcut format structure
	t.regex(output, /\[.*]/, 'Should use bracket format for shortcuts');
	t.true(output.includes('Navigate'), 'Should show navigation help');
	t.true(output.includes('Shift+'), 'Should show modifier key combinations');
});

test('WeeklyTimetableView renders main interface structure', t => {
	// 1. EXPLICIT TEST DATA
	const testUserEmail = 'testuser@example.com';
	const testConfig = {
		...mockConfig,
		defaultTime: '1h',
		defaultComment: 'Daily work',
	};
	const expectedStructureElements = [
		'█', // ASCII art header
		'KW', // Week display format
		'[Q] Quit',
		'Navigate',
	];

	// 2. OPERATIONS
	const {lastFrame} = render(
		<WeeklyTimetableView
			config={testConfig}
			userEmail={testUserEmail}
			onBack={() => {}}
		/>,
	);

	const output = lastFrame()!;

	// 3. SPECIFIC VALUE COMPARISONS
	for (const element of expectedStructureElements) {
		t.true(output.includes(element), `Should display ${element}`);
	}

	// Verify the main interface components are present
	t.regex(output, /KW\d+/, 'Should show week number');
	t.true(output.includes('█'), 'Should show ASCII art header');
	t.regex(output, /\[.*] Quit/, 'Should show quit shortcut');

	// Verify component renders without errors with valid props
	t.notThrows(() => {
		render(
			<WeeklyTimetableView
				config={testConfig}
				userEmail={testUserEmail}
				onBack={() => {}}
			/>,
		);
	}, 'Should render without errors with valid props');
});
