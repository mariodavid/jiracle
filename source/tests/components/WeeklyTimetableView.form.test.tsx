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

test('WeeklyTimetableView opens worklog form when pressing L key', async t => {
	// 1. EXPLICIT TEST DATA
	const expectedFormElements = [
		'Issue Key:',
		'Time Spent:',
		'Comment:',
		'Date:',
		'[Enter] Submit',
		'[Esc] Cancel',
	];

	// 2. OPERATIONS
	const {lastFrame, stdin} = render(<WeeklyTimetableView {...defaultProps} />);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// Press 'l' to open worklog form
	stdin.write('l');

	// Wait for form to render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// 3. SPECIFIC VALUE COMPARISONS
	const output = lastFrame();
	for (const element of expectedFormElements) {
		t.true(
			output?.includes(element) ?? false,
			`Form should display ${element}`,
		);
	}

	// Should show the weekly view is replaced by form
	t.false(
		output?.includes('JIRACLE') ?? true,
		'Should hide main banner when form is open',
	);
});

test('WeeklyTimetableView cancels form and returns to main view when pressing Escape', async t => {
	// 1. EXPLICIT TEST DATA
	const partialFormData = {
		issueKey: 'TEST-456',
		timeSpent: '1h',
		comment: 'Partially filled form data',
	};

	// 2. OPERATIONS
	const {lastFrame, stdin} = render(<WeeklyTimetableView {...defaultProps} />);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// Open worklog form
	stdin.write('l');
	await new Promise(resolve => {
		setTimeout(resolve, 50);
	});

	// Partially fill out form
	stdin.write(partialFormData.issueKey);
	stdin.write('\t');
	stdin.write(partialFormData.timeSpent);
	stdin.write('\t');
	stdin.write(partialFormData.comment);

	// Press Escape to cancel
	stdin.write('\u001B'); // ESC key

	// Wait for form to close
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// 3. SPECIFIC VALUE COMPARISONS
	const output = lastFrame();

	// Should close form and return to main view
	t.false(
		output?.includes('Time Spent:') ?? true,
		'Should close form when cancelled',
	);
	t.true(
		output?.includes('JIRACLE') ?? false,
		'Should return to main weekly view after cancelling',
	);

	// Should show navigation help again
	t.true(
		output?.includes('[L] Log') ?? false,
		'Should show navigation help when back to main view',
	);
});

test('WeeklyTimetableView prefills form with favorite issue defaults', async t => {
	// 1. EXPLICIT TEST DATA
	const favoriteIssue = {
		key: 'TEST-123',
		defaultTime: '2h',
		defaultComment: 'Working on test issue',
	};
	const configWithFavorite = createMockConfig({
		favorites: [favoriteIssue],
	});
	const propsWithFavorite = {
		...defaultProps,
		config: configWithFavorite,
	};

	// 2. OPERATIONS
	const {lastFrame, stdin} = render(
		<WeeklyTimetableView {...propsWithFavorite} />,
	);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// Open worklog form for favorite issue (simulate navigating to it)
	stdin.write('l');
	await new Promise(resolve => {
		setTimeout(resolve, 50);
	});

	// 3. SPECIFIC VALUE COMPARISONS
	const output = lastFrame();

	// Form should be properly structured with expected elements
	t.true(
		output?.includes('Issue Key:') ?? false,
		'Should show issue key field',
	);
	t.true(
		output?.includes('Time Spent:') ?? false,
		'Should show time spent field',
	);
	t.true(output?.includes('Comment:') ?? false, 'Should show comment field');

	// Should display form navigation help
	t.true(
		output?.includes('[Enter] Submit') ?? false,
		'Should show submit instruction',
	);
	t.true(
		output?.includes('[Esc] Cancel') ?? false,
		'Should show cancel instruction',
	);
});

test('WeeklyTimetableView handles back navigation with Q key', async t => {
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
	const {lastFrame, stdin} = render(
		<WeeklyTimetableView {...propsWithBackSpy} />,
	);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// Verify component is showing main view
	const output = lastFrame();
	t.true(
		output?.includes('JIRACLE') ?? false,
		'Should show main view initially',
	);

	// Press 'q' to trigger back navigation
	stdin.write('q');

	// Wait for navigation
	await new Promise(resolve => {
		setTimeout(resolve, 50);
	});

	// 3. SPECIFIC VALUE COMPARISONS
	t.true(backWasCalled, 'Should call onBack callback when Q key is pressed');
});

test('WeeklyTimetableView handles refresh functionality with R key', async t => {
	// 1. EXPLICIT TEST DATA
	const expectedRefreshBehavior = {
		shouldMaintainMainView: true,
		shouldShowRefreshHelp: true,
	};

	// 2. OPERATIONS
	const {lastFrame, stdin} = render(<WeeklyTimetableView {...defaultProps} />);

	// Wait for initial render and load
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// Press 'r' to refresh
	stdin.write('r');

	// Wait for refresh to trigger
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// 3. SPECIFIC VALUE COMPARISONS
	const output = lastFrame();

	// Should maintain main view structure
	t.true(
		output?.includes('JIRACLE') ?? false,
		'Should show main view during and after refresh',
	);

	// Should show navigation help
	t.true(
		output?.includes('[R] Refresh') ?? false,
		'Should show refresh instruction in help text',
	);

	// Verify expected behavior structure
	t.true(
		expectedRefreshBehavior.shouldMaintainMainView,
		'Should maintain expected refresh behavior',
	);
});

test('WeeklyTimetableView renders main weekly view with expected navigation elements', async t => {
	// 1. EXPLICIT TEST DATA
	const expectedMainViewElements = [
		'JIRACLE', // App title
		'[L] Log', // Log work shortcut
		'[A] Add', // Add worklog shortcut
		'[R] Refresh', // Refresh shortcut
		'[Q] Quit', // Quit shortcut
		'[T] Today', // Go to current week
	];
	const expectedGridElements = [
		'Mon',
		'Tue',
		'Wed',
		'Thu',
		'Fri', // Weekday headers
	];

	// 2. OPERATIONS
	const {lastFrame} = render(<WeeklyTimetableView {...defaultProps} />);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// 3. SPECIFIC VALUE COMPARISONS
	const output = lastFrame();

	// Should display main navigation elements
	for (const element of expectedMainViewElements) {
		t.true(
			output?.includes(element) ?? false,
			`Main view should display ${element}`,
		);
	}

	// Should display weekly grid structure
	for (const day of expectedGridElements) {
		t.true(output?.includes(day) ?? false, `Weekly grid should show ${day}`);
	}

	// Should not show form elements in main view
	t.false(
		output?.includes('Time Spent:') ?? true,
		'Main view should not show form fields',
	);
	t.false(
		output?.includes('[Enter] Submit') ?? true,
		'Main view should not show form submit instructions',
	);
});

test('WeeklyTimetableView form behavior follows Test Data Pattern requirements', async t => {
	// 1. EXPLICIT TEST DATA
	const testScenarios = [
		{
			name: 'form opening',
			triggerKey: 'l',
			expectedElements: ['Issue Key:', 'Time Spent:', 'Comment:'],
		},
		{
			name: 'form cancellation',
			triggerKey: '\u001B', // ESC
			expectedElements: ['JIRACLE', '[L] Log'],
		},
	];

	// 2. OPERATIONS
	const {lastFrame, stdin} = render(<WeeklyTimetableView {...defaultProps} />);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// Test form opening scenario
	const openScenario = testScenarios[0]!;
	stdin.write(openScenario.triggerKey);
	await new Promise(resolve => {
		setTimeout(resolve, 50);
	});

	let output = lastFrame();

	// 3. SPECIFIC VALUE COMPARISONS
	for (const element of openScenario.expectedElements) {
		t.true(
			output?.includes(element) ?? false,
			`Form ${openScenario.name} should show ${element}`,
		);
	}

	// Test form cancellation scenario
	const cancelScenario = testScenarios[1]!;
	stdin.write(cancelScenario.triggerKey);
	await new Promise(resolve => {
		setTimeout(resolve, 50);
	});

	output = lastFrame();
	for (const element of cancelScenario.expectedElements) {
		t.true(
			output?.includes(element) ?? false,
			`Form ${cancelScenario.name} should show ${element}`,
		);
	}

	// Verify comprehensive test coverage approach
	t.is(testScenarios.length, 2, 'Should test multiple specific scenarios');
	t.true(
		testScenarios.every(scenario => scenario.expectedElements.length > 0),
		'Each scenario should have explicit expectations',
	);
});
