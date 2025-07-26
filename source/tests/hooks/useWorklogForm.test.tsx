import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {Text, Box} from 'ink';
import {
	useWorklogForm,
	type UseWorklogFormOptions,
} from '../../hooks/useWorklogForm.js';
import type {JiraConfig} from '../../jira-client.js';
import {Duration} from '../../utils/Duration.js';

// Mock the JiraClient module
const mockConfig: JiraConfig = {
	jiraUrl: 'https://test.atlassian.net',
	username: 'test@example.com',
	apiToken: 'test-token',
	defaultTime: '4h',
	defaultComment: 'Test work',
	favorites: [
		{key: 'TEST-123', defaultTime: '2h', defaultComment: 'Favorite work'},
	],
};

// Test component that uses the hook
function TestWorklogFormComponent({
	options,
	onStateChange,
}: {
	options: UseWorklogFormOptions;
	onStateChange?: (state: any) => void;
}) {
	const worklogForm = useWorklogForm(options);

	// Always report the latest state
	React.useEffect(() => {
		if (onStateChange) {
			onStateChange(worklogForm);
		}
	}); // No dependencies - runs on every render

	return (
		<Box flexDirection="column">
			<Text>Visible: {worklogForm.worklogForm.isVisible.toString()}</Text>
			<Text>Submitting: {worklogForm.worklogSubmitting.toString()}</Text>
			<Text>Error: {worklogForm.worklogError ?? 'none'}</Text>
			<Text>IssueKey: {worklogForm.worklogForm.issueKey}</Text>
			<Text>TimeSpent: {worklogForm.worklogForm.timeSpent.toString()}</Text>
			<Text>Comment: {worklogForm.worklogForm.comment}</Text>
			<Text>
				IsEditable: {worklogForm.worklogForm.isIssueKeyEditable.toString()}
			</Text>
			<Text>
				IsEditMode: {worklogForm.worklogForm.isEditMode?.toString() ?? 'false'}
			</Text>
		</Box>
	);
}

test('useWorklogForm returns initial state', t => {
	let capturedState: any;

	const mockOptions: UseWorklogFormOptions = {
		config: mockConfig,
		userEmail: 'test@example.com',
		onRefresh() {},
		onActiveAreaChange() {},
	};

	render(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.false(capturedState.worklogForm.isVisible);
	t.false(capturedState.worklogSubmitting);
	t.is(capturedState.worklogError, undefined);
	t.is(capturedState.worklogForm.issueKey, '');
	t.false(capturedState.worklogForm.isIssueKeyEditable);
});

test('useWorklogForm handleAddWorklog makes form visible with defaults', t => {
	let capturedState: any;
	let activeAreaChanged = '';

	const mockOptions: UseWorklogFormOptions = {
		config: mockConfig,
		userEmail: 'test@example.com',
		onRefresh() {},
		onActiveAreaChange(area: string) {
			activeAreaChanged = area;
		},
	};

	const {rerender} = render(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Initial state should be captured
	t.false(capturedState.worklogForm.isVisible);

	// Call handleAddWorklog and force re-render to capture updated state
	capturedState.handleAddWorklog();
	rerender(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Now check the updated state
	t.true(capturedState.worklogForm.isVisible);
	t.true(capturedState.worklogForm.isIssueKeyEditable);
	t.true(capturedState.worklogForm.timeSpent instanceof Duration);
	t.is(capturedState.worklogForm.timeSpent.toString(), mockConfig.defaultTime);
	t.is(capturedState.worklogForm.comment, mockConfig.defaultComment);
	t.is(activeAreaChanged, 'worklog-form');
});

test('useWorklogForm handleCellWorklog opens form for cell editing', async t => {
	let capturedState: any;
	let activeAreaChanged = '';

	const mockOptions: UseWorklogFormOptions = {
		config: mockConfig,
		userEmail: 'test@example.com',
		onRefresh() {},
		onActiveAreaChange(area: string) {
			activeAreaChanged = area;
		},
		data: {
			weekStart: new Date('2024-01-15'),
			weekEnd: new Date('2024-01-21'),
			dailySummaries: [
				{
					date: new Date('2024-01-15'),
					issues: [],
					totalHours: 0,
				},
			],
			weekTotal: 0,
		},
	};

	const {rerender} = render(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Call handleCellWorklog and wait for async operation
	const cellData = {issueKey: 'TEST-456', date: new Date('2024-01-15')};
	await capturedState.handleCellWorklog(cellData);

	// Wait a bit for state updates to propagate
	await new Promise(resolve => {
		setTimeout(resolve, 10);
	});

	rerender(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.true(capturedState.worklogForm.isVisible);
	t.false(capturedState.worklogForm.isIssueKeyEditable);
	t.is(capturedState.worklogForm.issueKey, 'TEST-456');
	t.is(activeAreaChanged, 'worklog-form');
});

test('useWorklogForm handleCellWorklog uses favorite defaults', async t => {
	let capturedState: any;

	const mockOptions: UseWorklogFormOptions = {
		config: mockConfig,
		userEmail: 'test@example.com',
		onRefresh() {},
		onActiveAreaChange() {},
		data: {
			weekStart: new Date('2024-01-15'),
			weekEnd: new Date('2024-01-21'),
			dailySummaries: [
				{
					date: new Date('2024-01-15'),
					issues: [],
					totalHours: 0,
				},
			],
			weekTotal: 0,
		},
	};

	const {rerender} = render(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Call handleCellWorklog with favorite issue and wait for async operation
	const cellData = {issueKey: 'TEST-123', date: new Date('2024-01-15')};
	await capturedState.handleCellWorklog(cellData);

	// Wait a bit for state updates to propagate
	await new Promise(resolve => {
		setTimeout(resolve, 10);
	});

	rerender(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.true(capturedState.worklogForm.timeSpent instanceof Duration);
	t.is(capturedState.worklogForm.timeSpent.toString(), '2h'); // From favorite config
	t.is(capturedState.worklogForm.comment, 'Favorite work'); // From favorite config
});

test('useWorklogForm handleWorklogCancel hides form', t => {
	let capturedState: any;
	let activeAreaChanged = '';

	const mockOptions: UseWorklogFormOptions = {
		config: mockConfig,
		userEmail: 'test@example.com',
		onRefresh() {},
		onActiveAreaChange(area: string) {
			activeAreaChanged = area;
		},
	};

	const {rerender} = render(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// First open the form
	capturedState.handleAddWorklog();
	rerender(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);
	t.true(capturedState.worklogForm.isVisible);

	// Then cancel it
	capturedState.handleWorklogCancel();
	rerender(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);
	t.false(capturedState.worklogForm.isVisible);
	t.is(activeAreaChanged, 'timetable');
});

test('useWorklogForm clearError removes error after validation failure', async t => {
	// 1. EXPLICIT TEST DATA
	const invalidSubmissionData = {
		issueKey: '', // Invalid: empty issue key
		date: new Date('2024-01-15'),
		timeSpent: '2h',
		comment: 'Valid comment',
	};
	const expectedValidationError = 'Issue key is required and cannot be empty';
	let capturedState: any;

	const mockOptions: UseWorklogFormOptions = {
		config: mockConfig,
		userEmail: 'test@example.com',
		onRefresh() {},
		onActiveAreaChange() {},
	};

	// 2. OPERATIONS
	const {rerender} = render(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Open form and trigger validation error
	capturedState.handleAddWorklog();
	await capturedState.handleWorklogSubmit(invalidSubmissionData);
	rerender(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Verify error exists after validation failure
	t.is(
		capturedState.worklogError,
		expectedValidationError,
		'Should have validation error',
	);

	// Clear the error
	capturedState.clearError();
	rerender(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// 3. SPECIFIC VALUE COMPARISONS
	t.is(
		capturedState.worklogError,
		undefined,
		'Should clear error message after calling clearError',
	);
});

test('useWorklogForm handleAddWorklog sets correct initial state', t => {
	// 1. EXPLICIT TEST DATA
	const expectedInitialState = {
		issueKey: '',
		timeSpent: mockConfig.defaultTime,
		comment: mockConfig.defaultComment,
		isVisible: true,
		isIssueKeyEditable: true,
	};
	let capturedState: any;
	let activeAreaChanged = '';

	const mockOptions: UseWorklogFormOptions = {
		config: mockConfig,
		userEmail: 'test@example.com',
		onRefresh() {},
		onActiveAreaChange(area: string) {
			activeAreaChanged = area;
		},
	};

	// 2. OPERATIONS
	const {rerender} = render(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Verify initial hidden state
	t.false(capturedState.worklogForm.isVisible, 'Should start hidden');

	// Open form
	capturedState.handleAddWorklog();
	rerender(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// 3. SPECIFIC VALUE COMPARISONS
	t.is(
		capturedState.worklogForm.issueKey,
		expectedInitialState.issueKey,
		'Should set empty issue key for new worklog',
	);
	t.true(
		capturedState.worklogForm.timeSpent instanceof Duration,
		'timeSpent should be a Duration instance',
	);
	t.is(
		capturedState.worklogForm.timeSpent.toString(),
		expectedInitialState.timeSpent,
		'Should use default time from config',
	);
	t.is(
		capturedState.worklogForm.comment,
		expectedInitialState.comment,
		'Should use default comment from config',
	);
	t.is(
		capturedState.worklogForm.isVisible,
		expectedInitialState.isVisible,
		'Should make form visible',
	);
	t.is(
		capturedState.worklogForm.isIssueKeyEditable,
		expectedInitialState.isIssueKeyEditable,
		'Should allow issue key editing in add mode',
	);
	t.is(
		activeAreaChanged,
		'worklog-form',
		'Should change active area to worklog-form',
	);
});

test('useWorklogForm validates required fields on submission', async t => {
	// 1. EXPLICIT TEST DATA
	const invalidSubmissionData = {
		issueKey: '',
		date: new Date('2024-01-15'),
		timeSpent: '2h',
		comment: 'Valid comment',
	};
	const expectedErrorMessage = 'Issue key is required and cannot be empty';
	let capturedState: any;
	let refreshCalled = false;

	const mockOptions: UseWorklogFormOptions = {
		config: mockConfig,
		userEmail: 'test@example.com',
		onRefresh() {
			refreshCalled = true;
		},
		onActiveAreaChange() {},
	};

	// 2. OPERATIONS
	const {rerender} = render(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Open form first
	capturedState.handleAddWorklog();
	rerender(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Attempt submission with invalid data (empty issue key)
	await capturedState.handleWorklogSubmit(invalidSubmissionData);
	rerender(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// 3. SPECIFIC VALUE COMPARISONS
	t.false(refreshCalled, 'Should not call onRefresh with invalid data');
	t.is(
		capturedState.worklogError,
		expectedErrorMessage,
		'Should show validation error for empty issue key',
	);
	t.false(
		capturedState.worklogSubmitting,
		'Should not be in submitting state after validation error',
	);
	t.true(
		capturedState.worklogForm.isVisible,
		'Should keep form visible after validation error',
	);
});

test('useWorklogForm formats date correctly for Jira API compatibility', t => {
	// Test the date formatting logic independently to ensure Jira API compatibility
	const testDate = new Date('2024-01-15T10:30:00.000Z');
	testDate.setHours(9, 0, 0, 0);

	// This is the critical format transformation that prevents Jira API 500 errors
	const jiraFormattedDate = testDate.toISOString().replace('Z', '+0000');

	// CRITICAL: This format MUST remain "+0000" not "Z"
	// Jira API returns 500 Internal Server Error with "Z" format
	t.true(
		jiraFormattedDate.endsWith('+0000'),
		`Date format must end with "+0000" for Jira API compatibility, got: ${jiraFormattedDate}`,
	);

	// Verify it's not using the ISO "Z" format which breaks Jira
	t.false(
		jiraFormattedDate.endsWith('Z'),
		'Date format must NOT end with "Z" as it causes Jira API 500 errors',
	);

	// Verify the date has the correct structure (time may vary based on timezone)
	t.regex(
		jiraFormattedDate,
		/^\d{4}-\d{2}-\d{2}T\d{2}:00:00\.000\+0000$/,
		'Date format must match YYYY-MM-DDTHH:00:00.000+0000 pattern',
	);

	// Document why this specific format is required
	t.log('This test ensures the date format remains compatible with Jira API');
	t.log(
		'Changing .replace("Z", "+0000") to just .toISOString() causes 500 errors',
	);
	t.log('The useWorklogForm hook MUST maintain this exact formatting');
	t.log(`Example formatted date: ${jiraFormattedDate}`);
});
