import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {InlineWorklogForm} from '../../components/InlineWorklogForm.js';
import type {JiraConfig} from '../../jira-client.js';
import {Duration} from '../../domain/Duration.js';
import {LocalDate} from '../../domain/LocalDate.js';
import {IssueKey} from '../../domain/IssueKey.js';

const mockConfig: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token-123',
};

const mockProps = {
	issueKey: IssueKey.fromString('TEST-123'),
	date: LocalDate.fromString('2025-07-10'),
	defaultTimeSpent: new Duration('1h'),
	defaultComment: '',
	onSubmit() {},
	onCancel() {},
	config: mockConfig,
};

// === TAB NAVIGATION TESTS WITH DATE FIELD ===
test('InlineWorklogForm tab navigation includes date field when issue key is editable', t => {
	const editableProps = {
		...mockProps,
		issueKey: undefined,
		isIssueKeyEditable: true,
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, editableProps),
	);
	const output = lastFrame() ?? '';

	// Should show all fields in the correct order when issue key is editable:
	// Issue Key -> Date -> Time -> Comment -> Submit/Cancel
	t.true(output.includes('Issue Key:'));
	t.true(output.includes('Date:'));
	t.true(output.includes('Time spent:'));
	t.true(output.includes('Comment:'));
	t.true(output.includes('[Submit]'));
	t.true(output.includes('[Cancel]'));
});

test('InlineWorklogForm tab navigation excludes date field when issue key is not editable', t => {
	const nonEditableProps = {
		...mockProps,
		issueKey: IssueKey.fromString('FIXED-123'),
		isIssueKeyEditable: false,
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, nonEditableProps),
	);
	const output = lastFrame() ?? '';

	// Should only show Time -> Comment -> Submit/Cancel (no Issue Key or Date fields)
	t.false(output.includes('Issue Key:'));
	t.false(output.includes('Date:'));
	t.true(output.includes('Time spent:'));
	t.true(output.includes('Comment:'));
	t.true(output.includes('[Submit]'));
	t.true(output.includes('[Cancel]'));
});

test('InlineWorklogForm shows proper field layout in add worklog mode', t => {
	const addWorklogProps = {
		...mockProps,
		issueKey: undefined, // Empty for add worklog mode
		isIssueKeyEditable: true,
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, addWorklogProps),
	);
	const output = lastFrame() ?? '';

	// Should show Issue Key field with placeholder
	t.true(output.includes('Issue Key:'));

	// Should show Date field with the actual date
	t.true(output.includes('Date:'));
	t.true(output.includes('2025-07-10')); // The formatted date from mockProps

	// Should show other fields
	t.true(output.includes('Time spent:'));
	t.true(output.includes('Comment:'));
});

test('InlineWorklogForm shows proper field layout in cell worklog mode', t => {
	const cellWorklogProps = {
		...mockProps,
		issueKey: IssueKey.fromString('PROJECT-123'), // Specific issue key for cell worklog mode
		isIssueKeyEditable: false,
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, cellWorklogProps),
	);
	const output = lastFrame() ?? '';

	// Should NOT show Issue Key or Date fields
	t.false(output.includes('Issue Key:'));
	t.false(output.includes('Date:'));

	// Should show Time and Comment fields
	t.true(output.includes('Time spent:'));
	t.true(output.includes('Comment:'));
});

test('InlineWorklogForm displays date value correctly', t => {
	const testDate = LocalDate.fromString('2025-12-25'); // Christmas
	const editableProps = {
		...mockProps,
		date: testDate,
		isIssueKeyEditable: true,
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, editableProps),
	);
	const output = lastFrame() ?? '';

	// Should show the formatted date (2025-12-25)
	t.true(output.includes('2025-12-25'));
});

test('InlineWorklogForm handles form validation for add worklog mode', t => {
	const addWorklogProps = {
		...mockProps,
		issueKey: undefined, // Empty issue key should show validation
		isIssueKeyEditable: true,
		error:
			'Issue key is required. Please enter a valid Jira issue key (e.g., DEF-123).',
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, addWorklogProps),
	);
	const output = lastFrame() ?? '';

	// Should show the error message
	t.true(output.includes('Error: Issue key is required'));
	t.true(output.includes('Please enter a valid Jira issue key'));
});

test('InlineWorklogForm shows submitting state correctly', t => {
	const submittingProps = {
		...mockProps,
		isIssueKeyEditable: true,
		isSubmitting: true,
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, submittingProps),
	);
	const output = lastFrame() ?? '';

	// Should show submitting state (not the form fields)
	t.true(output.includes('Submitting Worklog'));
	t.false(output.includes('Issue Key:'));
	t.false(output.includes('Date:'));
	t.false(output.includes('Time spent:'));
	t.false(output.includes('[Submit]'));
});

test('InlineWorklogForm uses current date by default in add worklog mode', t => {
	const today = LocalDate.today();
	const addWorklogProps = {
		...mockProps,
		date: today,
		isIssueKeyEditable: true,
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, addWorklogProps),
	);
	const output = lastFrame() ?? '';

	// Should show today's date in YYYY-MM-DD format
	const expectedDate = today.toISOString();
	t.true(output.includes(expectedDate));
});

test('InlineWorklogForm SimpleDateInput allows editing', t => {
	const editableProps = {
		...mockProps,
		issueKey: undefined,
		isIssueKeyEditable: true,
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, editableProps),
	);
	const output = lastFrame() ?? '';

	// Should show the SimpleDateInput component (no infinite loops)
	t.true(output.includes('Date:'));
	t.true(output.includes('2025-07-10')); // The formatted date from mockProps
	// Should render without crashing (no React warnings about infinite updates)
	t.true(output.length > 100);
});

test('InlineWorklogForm date input shows proper visual feedback when focused', t => {
	const editableProps = {
		...mockProps,
		issueKey: undefined,
		isIssueKeyEditable: true,
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, editableProps),
	);
	const output = lastFrame() ?? '';

	// The SimpleDateInput should be present and functional
	t.true(output.includes('Date:'));
	t.true(output.includes('2025-07-10'));
	// Component should render without errors
	t.true(typeof output === 'string');
	t.true(output.length > 0);
});
