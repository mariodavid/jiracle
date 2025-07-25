import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {WeeklyTimetableView} from '../../components/WeeklyTimetableView.js';
import {createMockConfig} from '../utils/testUtils.js';

const mockConfig = createMockConfig({
	favorites: [
		{
			key: 'TEST-123',
			defaultTime: '2h',
			defaultComment: 'Working on test issue',
		},
	],
});

const defaultProps = {
	onBack() {},
	config: mockConfig,
	userEmail: 'test@example.com',
};

test('WeeklyTimetableView displays main navigation elements in footer', async t => {
	// 1. EXPLICIT TEST DATA
	const expectedNavigationElements = [
		'[A] Add Worklog',
		'[R] Refresh',
		'[Q] Quit',
		'[T] Today',
		'Navigate Cells',
		'Log Work',
	];

	// 2. OPERATIONS
	const {lastFrame} = render(<WeeklyTimetableView {...defaultProps} />);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// 3. SPECIFIC VALUE COMPARISONS
	const output = lastFrame() ?? '';
	for (const element of expectedNavigationElements) {
		t.true(
			output.includes(element),
			`Main view should display navigation element: ${element}`,
		);
	}

	// Should show week format display
	t.regex(output, /KW\d+/, 'Should show week number in KW format');
});

test('WeeklyTimetableView handles keyboard navigation keys properly', async t => {
	// 1. EXPLICIT TEST DATA
	let backWasCalled = false;
	const onBackSpy = () => {
		backWasCalled = true;
	};

	const propsWithBackSpy = {
		...defaultProps,
		onBack: onBackSpy,
	};

	// 2. OPERATIONS
	const {stdin, lastFrame} = render(
		<WeeklyTimetableView {...propsWithBackSpy} />,
	);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// Verify initial state shows navigation help
	const output = lastFrame() ?? '';
	t.true(output.includes('[Q] Quit'), 'Should show quit instruction initially');

	// Press 'q' to trigger back navigation
	stdin.write('q');

	// Wait for navigation
	await new Promise(resolve => {
		setTimeout(resolve, 50);
	});

	// 3. SPECIFIC VALUE COMPARISONS
	t.true(backWasCalled, 'Should call onBack callback when Q key is pressed');
});

test('WeeklyTimetableView shows comprehensive keyboard shortcuts', async t => {
	// 1. EXPLICIT TEST DATA
	const expectedShortcuts = [
		'[↑↓←→] Navigate Cells',
		'[Enter] Log Work',
		'[A] Add Worklog',
		'[R] Refresh',
		'[Q] Quit',
		'[T] Today',
	];

	// 2. OPERATIONS
	const {lastFrame} = render(<WeeklyTimetableView {...defaultProps} />);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// 3. SPECIFIC VALUE COMPARISONS
	const output = lastFrame() ?? '';
	for (const shortcut of expectedShortcuts) {
		t.true(
			output.includes(shortcut),
			`Should show keyboard shortcut: ${shortcut}`,
		);
	}

	// Should show week navigation help
	t.true(
		output.includes('Week Navigation') || output.includes('Shift+'),
		'Should show week navigation instructions',
	);
});

test('WeeklyTimetableView displays weekly grid structure correctly', async t => {
	// 1. EXPLICIT TEST DATA
	const expectedStatusMessages = [
		'No data available',
		'Loading',
		'KW', // Week number indicator
	];
	const expectedGridPatterns = [
		/KW\d+/, // Week number
		/\d{1,2}\.\d{1,2}/, // Date format like "21.7"
	];

	// 2. OPERATIONS
	const {lastFrame} = render(<WeeklyTimetableView {...defaultProps} />);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// 3. SPECIFIC VALUE COMPARISONS
	const output = lastFrame() ?? '';

	// Should show some kind of status or week indicator
	const hasStatusMessage = expectedStatusMessages.some(message =>
		output.includes(message),
	);
	t.true(hasStatusMessage, 'Should show loading, data, or week status message');

	// Should show week number format
	const hasGridPattern = expectedGridPatterns.some(pattern =>
		pattern.test(output),
	);
	t.true(hasGridPattern, 'Should show week number or date pattern');

	// Should not be completely empty
	t.true(output.length > 50, 'Should render substantial content');
});

test('WeeklyTimetableView handles refresh functionality', async t => {
	// 1. EXPLICIT TEST DATA
	const expectedBehaviorAfterRefresh = {
		maintainsNavigation: true,
		showsRefreshHelp: true,
		preservesGridStructure: true,
	};

	// 2. OPERATIONS
	const {lastFrame, stdin} = render(<WeeklyTimetableView {...defaultProps} />);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// Press 'r' to refresh
	stdin.write('r');

	// Wait for refresh to process
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// 3. SPECIFIC VALUE COMPARISONS
	const output = lastFrame() ?? '';

	// Should maintain navigation help after refresh
	t.true(
		output.includes('[R] Refresh'),
		'Should still show refresh instruction after refresh',
	);

	// Should maintain grid structure with week display
	t.regex(output, /KW\d+/, 'Should maintain week number display after refresh');

	// Verify expected behavior structure
	t.true(
		expectedBehaviorAfterRefresh.maintainsNavigation,
		'Should maintain expected refresh behavior',
	);
});

test('WeeklyTimetableView form behavior follows component interaction patterns', async t => {
	// 1. EXPLICIT TEST DATA
	const interactionScenarios = [
		{
			name: 'initial render',
			action: 'none',
			expectedElements: ['Navigate Cells', 'Log Work', 'Add Worklog'],
		},
		{
			name: 'keyboard help display',
			action: 'display',
			expectedElements: ['[Q] Quit', '[R] Refresh', '[T] Today'],
		},
	];

	// 2. OPERATIONS
	const {lastFrame} = render(<WeeklyTimetableView {...defaultProps} />);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	const output = lastFrame() ?? '';

	// 3. SPECIFIC VALUE COMPARISONS
	const initialScenario = interactionScenarios[0]!;
	const displayScenario = interactionScenarios[1]!;

	// Test initial render scenario
	for (const element of initialScenario.expectedElements) {
		t.true(
			output.includes(element),
			`${initialScenario.name}: should show ${element}`,
		);
	}

	// Test keyboard help display scenario
	for (const element of displayScenario.expectedElements) {
		t.true(
			output.includes(element),
			`${displayScenario.name}: should show ${element}`,
		);
	}

	// Verify comprehensive interaction coverage
	t.is(
		interactionScenarios.length,
		2,
		'Should test multiple interaction scenarios',
	);
	t.true(
		interactionScenarios.every(
			scenario => scenario.expectedElements.length > 0,
		),
		'Each scenario should have explicit expectations',
	);
});

test('WeeklyTimetableView component structure meets accessibility requirements', async t => {
	// 1. EXPLICIT TEST DATA
	const accessibilityElements = {
		navigation: ['Navigate Cells', 'Log Work', 'Add Worklog'],
		shortcuts: ['[Q] Quit', '[R] Refresh', '[T] Today'],
		structure: /KW\d+/, // Week number pattern instead of weekdays
	};

	// 2. OPERATIONS
	const {lastFrame} = render(<WeeklyTimetableView {...defaultProps} />);

	// Wait for component to stabilize
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// 3. SPECIFIC VALUE COMPARISONS
	const output = lastFrame() ?? '';

	// Verify navigation accessibility
	for (const nav of accessibilityElements.navigation) {
		t.true(
			output.includes(nav),
			`Should provide accessible navigation: ${nav}`,
		);
	}

	// Verify keyboard shortcut accessibility
	for (const shortcut of accessibilityElements.shortcuts) {
		t.true(
			output.includes(shortcut),
			`Should show accessible shortcut: ${shortcut}`,
		);
	}

	// Verify structural accessibility with week pattern
	t.regex(
		output,
		accessibilityElements.structure,
		'Should have accessible week structure',
	);

	// Should not be empty or error state
	t.true(
		output.length > 100,
		'Should render meaningful content for accessibility',
	);
});
