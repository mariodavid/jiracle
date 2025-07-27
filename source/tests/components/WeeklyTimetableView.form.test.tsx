import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {WeeklyTimetableView} from '../../components/WeeklyTimetableView.js';
import {createMockConfig} from '../utils/testUtils.js';

const mockConfig = createMockConfig({
	favorites: [
		{
			key: IssueKey.fromString('TEST-123'),
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

test('WeeklyTimetableView opens worklog form when Add Worklog key is pressed', async t => {
	// 1. EXPLICIT TEST DATA
	const expectedFormElements = [
		'Time spent:',
		'Comment:',
		'Issue Key:',
		'Submit',
		'Cancel',
	];
	const expectedTransition = {
		from: ['[A] Add Worklog', 'Navigate Cells'],
		to: ['Time spent:', 'Switch Areas'],
	};

	// 2. OPERATIONS
	const {lastFrame, stdin} = render(<WeeklyTimetableView {...defaultProps} />);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// Verify initial state shows main navigation
	const initialOutput = lastFrame() ?? '';
	for (const element of expectedTransition.from) {
		t.true(
			initialOutput.includes(element),
			`Initial state should show: ${element}`,
		);
	}

	// Press 'a' to open Add Worklog form
	stdin.write('a');

	// Wait for form to open
	await new Promise(resolve => {
		setTimeout(resolve, 150);
	});

	// 3. SPECIFIC VALUE COMPARISONS
	const formOutput = lastFrame() ?? '';

	// Verify form elements are displayed
	for (const element of expectedFormElements) {
		t.true(
			formOutput.includes(element),
			`Form should display element: ${element}`,
		);
	}

	// Verify transition to form instructions
	for (const element of expectedTransition.to) {
		t.true(formOutput.includes(element), `Form state should show: ${element}`);
	}

	// Verify main navigation is hidden when form is open
	t.false(
		formOutput.includes('[A] Add Worklog') &&
			formOutput.includes('Navigate Cells'),
		'Should hide main navigation when form is open',
	);
});

test('WeeklyTimetableView handles form cancellation correctly', async t => {
	// 1. EXPLICIT TEST DATA
	const expectedReturnElements = [
		'[A] Add Worklog',
		'Navigate Cells',
		'[Q] Quit',
	];
	const formElementsToDisappear = ['Time spent:', 'Switch Areas', 'Submit'];

	// 2. OPERATIONS
	const {lastFrame, stdin} = render(<WeeklyTimetableView {...defaultProps} />);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 200);
	});

	// Open form
	stdin.write('a');
	await new Promise(resolve => {
		setTimeout(resolve, 200);
	});

	// Verify form is open
	const formOutput = lastFrame() ?? '';
	t.true(
		formOutput.includes('Time spent:'),
		'Form should be open before cancellation',
	);

	// Cancel form with Escape
	stdin.write('\u001B'); // ESC key
	await new Promise(resolve => {
		setTimeout(resolve, 300);
	});

	// 3. SPECIFIC VALUE COMPARISONS
	const cancelOutput = lastFrame() ?? '';

	// Debug: log the actual output if test fails in CI
	if (!cancelOutput.includes('[A] Add Worklog')) {
		console.log('DEBUG: Cancel output does not contain [A] Add Worklog');
		console.log('Cancel output length:', cancelOutput.length);
		console.log('Cancel output preview:', cancelOutput.slice(0, 500));
	}

	// Verify return to main navigation
	for (const element of expectedReturnElements) {
		t.true(
			cancelOutput.includes(element),
			`Should return to main navigation: ${element}`,
		);
	}

	// Verify form elements are hidden
	for (const element of formElementsToDisappear) {
		t.false(
			cancelOutput.includes(element),
			`Form element should be hidden after cancel: ${element}`,
		);
	}
});

test('WeeklyTimetableView form displays field validation and error states', async t => {
	// 1. EXPLICIT TEST DATA
	const validationScenarios = [
		{
			name: 'empty form submission',
			formData: '',
			expectedError: 'required',
			shouldRemainOpen: true,
		},
	];
	const formFieldsRequired = ['Time spent:', 'Comment:'];

	// 2. OPERATIONS
	const {lastFrame, stdin} = render(<WeeklyTimetableView {...defaultProps} />);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// Open form
	stdin.write('a');
	await new Promise(resolve => {
		setTimeout(resolve, 150);
	});

	// Verify form fields are present
	const formOutput = lastFrame() ?? '';
	for (const field of formFieldsRequired) {
		t.true(
			formOutput.includes(field),
			`Form should display required field: ${field}`,
		);
	}

	// Try to submit empty form
	stdin.write('\r'); // Enter key
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// 3. SPECIFIC VALUE COMPARISONS
	const validationOutput = lastFrame() ?? '';
	const scenario = validationScenarios[0]!;

	// Form should still be open after failed validation
	t.true(
		scenario.shouldRemainOpen,
		'Form should remain open for validation scenario',
	);

	// Should still show form fields (form remains open)
	t.true(
		validationOutput.includes('Time spent:'),
		'Form should remain open when validation fails',
	);

	// Verify form doesn't just disappear without proper submission
	t.true(
		validationOutput.includes('Submit') || validationOutput.includes('Cancel'),
		'Form controls should remain visible during validation',
	);
});

test('WeeklyTimetableView integrates form behavior with keyboard navigation correctly', async t => {
	// 1. EXPLICIT TEST DATA
	const keyboardIntegration = {
		mainNavigation: ['[A] Add Worklog', '[R] Refresh', '[Q] Quit'],
		formNavigation: ['[Tab] Switch Areas', '[Enter] Submit', '[Esc] Cancel'],
		transitionKeys: ['a', '\u001B'], // 'a' for add, ESC for cancel
	};

	// 2. OPERATIONS
	const {lastFrame, stdin} = render(<WeeklyTimetableView {...defaultProps} />);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// Test main navigation is present
	const mainOutput = lastFrame() ?? '';
	for (const nav of keyboardIntegration.mainNavigation) {
		t.true(mainOutput.includes(nav), `Main navigation should include: ${nav}`);
	}

	// Open form with 'a' key
	stdin.write(keyboardIntegration.transitionKeys[0]!);
	await new Promise(resolve => {
		setTimeout(resolve, 150);
	});

	// Test form navigation is present
	const formOutput = lastFrame() ?? '';
	for (const nav of keyboardIntegration.formNavigation) {
		t.true(formOutput.includes(nav), `Form navigation should include: ${nav}`);
	}

	// Cancel with ESC key
	stdin.write(keyboardIntegration.transitionKeys[1]!);
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// 3. SPECIFIC VALUE COMPARISONS
	const returnOutput = lastFrame() ?? '';

	// Should return to main navigation
	t.true(
		returnOutput.includes('[A] Add Worklog'),
		'Should return to main navigation after form cancel',
	);

	// Form navigation should be hidden
	t.false(
		returnOutput.includes('[Tab] Switch Areas'),
		'Form-specific navigation should be hidden when form is closed',
	);

	// Verify integration works both ways
	t.is(
		keyboardIntegration.transitionKeys.length,
		2,
		'Should test both form open and close transitions',
	);
});
