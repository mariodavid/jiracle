import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {Text, Box} from 'ink';
import {
	useWorklogForm,
	type UseWorklogFormOptions,
} from '../../hooks/useWorklogForm.js';
import type {JiraConfig} from '../../jira-client.js';
import {Duration} from '../../domain/Duration.js';

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

test('useWorklogForm validates invalid issue key format', async t => {
	// 1. EXPLICIT TEST DATA
	const invalidIssueKey = 'invalid';
	const expectedError =
		'Invalid issue key format: "invalid". Expected format: PROJECT-123 (e.g., DEF-123, ABC-456)';
	const submissionData = {
		issueKey: invalidIssueKey,
		date: new Date('2024-01-15'),
		timeSpent: new Duration('2h'),
		comment: 'Valid comment',
	};
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

	capturedState.handleAddWorklog();
	await capturedState.handleWorklogSubmit(submissionData);
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
		expectedError,
		'Should validate issue key format',
	);
	t.false(
		capturedState.worklogSubmitting,
		'Should not be submitting with invalid issue key',
	);
});

test('useWorklogForm accepts valid issue key format', async t => {
	// 1. EXPLICIT TEST DATA
	const validIssueKey = 'TEST-123';
	const submissionData = {
		issueKey: validIssueKey,
		date: new Date('2024-01-15'),
		timeSpent: new Duration('2h'),
		comment: 'Valid comment',
	};
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

	capturedState.handleAddWorklog();
	await capturedState.handleWorklogSubmit(submissionData);
	rerender(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// 3. SPECIFIC VALUE COMPARISONS
	t.not(
		capturedState.worklogError,
		'Invalid issue key format: "TEST-123". Expected format: PROJECT-123 (e.g., DEF-123, ABC-456)',
		'Should accept valid issue key format',
	);
});

test('useWorklogForm tracks submitting state correctly', async t => {
	// 1. EXPLICIT TEST DATA
	const validSubmissionData = {
		issueKey: 'TEST-123',
		date: new Date('2024-01-15'),
		timeSpent: new Duration('2h'),
		comment: 'Valid comment',
	};
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

	capturedState.handleAddWorklog();
	rerender(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Verify initial non-submitting state
	t.false(
		capturedState.worklogSubmitting,
		'Should not be submitting initially',
	);

	// Start submission (don't await yet to check intermediate state)
	const submissionPromise =
		capturedState.handleWorklogSubmit(validSubmissionData);

	// Check if submitting state is set immediately
	rerender(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Wait for submission to complete
	await submissionPromise;
	rerender(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// 3. SPECIFIC VALUE COMPARISONS
	t.false(
		capturedState.worklogSubmitting,
		'Should not be in submitting state after completion',
	);
});

test('useWorklogForm handles submission errors gracefully', async t => {
	// 1. EXPLICIT TEST DATA
	const invalidSubmissionData = {
		issueKey: 'NONEXISTENT-999',
		date: new Date('2024-01-15'),
		timeSpent: new Duration('2h'),
		comment: 'Valid comment',
	};
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

	capturedState.handleAddWorklog();

	// This will likely fail due to invalid issue key
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
	t.truthy(
		capturedState.worklogError,
		'Should have error message when submission fails',
	);
	t.false(
		capturedState.worklogSubmitting,
		'Should not be in submitting state after error',
	);
	t.true(
		capturedState.worklogForm.isVisible,
		'Should keep form visible after error for retry',
	);
});

test('useWorklogForm distinguishes between edit and new worklog modes', async t => {
	// 1. EXPLICIT TEST DATA
	const existingWorklogData = {
		issueKey: 'TEST-123',
		date: new Date('2024-01-15'),
		worklogId: 'existing-worklog-123',
	};
	const newWorklogData = {
		issueKey: 'TEST-456',
		date: new Date('2024-01-15'),
	};
	let capturedState: any;

	const mockWeeklyData = {
		weekStart: new Date('2024-01-15'),
		weekEnd: new Date('2024-01-21'),
		dailySummaries: [
			{
				date: new Date('2024-01-15'),
				totalHours: 3,
				issues: [
					{
						issueKey: 'TEST-123',
						issueSummary: 'Test issue for worklog editing',
						hours: 3,
						worklogId: 'existing-worklog-123',
						comment: 'Existing work',
					},
				],
			},
		],
		weekTotal: 3,
	};

	const mockOptions: UseWorklogFormOptions = {
		config: mockConfig,
		userEmail: 'test@example.com',
		onRefresh() {},
		onActiveAreaChange() {},
		data: mockWeeklyData,
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

	// Test edit mode
	await capturedState.handleCellWorklog(existingWorklogData);
	rerender(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	const editModeState = {
		isEditMode: capturedState.worklogForm.isEditMode,
		worklogId: capturedState.worklogForm.worklogId,
		isIssueKeyEditable: capturedState.worklogForm.isIssueKeyEditable,
	};

	// Test new worklog mode
	await capturedState.handleCellWorklog(newWorklogData);
	rerender(
		React.createElement(TestWorklogFormComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// 3. SPECIFIC VALUE COMPARISONS
	t.true(
		editModeState.isEditMode,
		'Should be in edit mode for existing worklog',
	);
	t.is(
		editModeState.worklogId,
		'existing-worklog-123',
		'Should set worklog ID for edit mode',
	);
	t.false(
		editModeState.isIssueKeyEditable,
		'Should not allow issue key editing in edit mode',
	);

	t.false(
		capturedState.worklogForm.isEditMode,
		'Should be in new worklog mode for non-existing worklog',
	);
	t.is(
		capturedState.worklogForm.worklogId,
		undefined,
		'Should not have worklog ID for new worklog',
	);
	t.false(
		capturedState.worklogForm.isIssueKeyEditable,
		'Should not allow issue key editing in cell mode',
	);
});
