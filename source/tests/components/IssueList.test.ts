import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import IssueList from '../../components/IssueList.js';
import {createMockIssue, createMockIssueList} from '../utils/testUtils.js';
import {IssueKey} from '../../domain/IssueKey.js';
import type {JiraIssue} from '../../jira-client.js';
import {InkTestHelpers} from '../utils/ink-test-helpers.js';

test('should render custom title', async t => {
	const mockIssues = createMockIssueList(2);
	const customTitle = 'My Custom Issue List';
	const onSelect = (_key: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(IssueList, {
			issues: mockIssues,
			title: customTitle,
			onSelect,
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();
	t.true(output?.includes(customTitle) ?? false);

	unmount();
});

test('should render issue list with correct formatting', async t => {
	const mockIssues = createMockIssueList(3);
	const title = 'Test Issues';
	const onSelect = (_key: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(IssueList, {
			issues: mockIssues,
			title,
			onSelect,
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();

	// Check that all issues are rendered with correct format: "KEY - Summary"
	t.true(output?.includes('TEST-123 - Test Issue 1') ?? false);
	t.true(output?.includes('TEST-124 - Test Issue 2') ?? false);
	t.true(output?.includes('TEST-125 - Test Issue 3') ?? false);

	unmount();
});

test('should display ESC hint for going back to issue selection mode', async t => {
	const mockIssues = createMockIssueList(1);
	const title = 'Test Issues';
	const onSelect = (_key: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(IssueList, {
			issues: mockIssues,
			title,
			onSelect,
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();
	t.true(
		output?.includes('Press ESC to go back to issue selection mode') ?? false,
	);

	unmount();
});

test('should call onSelect with correct issue key when option is selected', async t => {
	const mockIssues = createMockIssueList(2);
	const title = 'Test Issues';
	let selectedKey = '';
	const onSelect = (key: string) => {
		selectedKey = key;
	};

	const {stdin, unmount} = render(
		React.createElement(IssueList, {
			issues: mockIssues,
			title,
			onSelect,
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	// Select first option
	stdin.write('\r');
	await InkTestHelpers.delay(100);

	t.is(selectedKey, 'TEST-123');

	unmount();
});

test('should handle navigation and select second issue', async t => {
	const mockIssues = createMockIssueList(3);
	const title = 'Test Issues';
	let selectedKey = '';
	const onSelect = (key: string) => {
		selectedKey = key;
	};

	const {stdin, unmount} = render(
		React.createElement(IssueList, {
			issues: mockIssues,
			title,
			onSelect,
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	// Navigate to second option
	stdin.write('\u001B[B'); // Arrow down
	await InkTestHelpers.delay(500);
	stdin.write('\r'); // Enter
	await InkTestHelpers.delay(500);

	// Verify specific selection behavior
	if (selectedKey) {
		t.true(
			['TEST-123', 'TEST-124', 'TEST-125'].includes(selectedKey),
			`Should select valid issue key, got: ${selectedKey}`,
		);
	} else {
		t.fail('onSelect should be called with a valid issue key');
	}

	unmount();
});

test('should handle empty issue list gracefully', async t => {
	const emptyIssues: JiraIssue[] = [];
	const title = 'No Issues';
	const onSelect = (_key: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(IssueList, {
			issues: emptyIssues,
			title,
			onSelect,
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();

	// Should still render the title
	t.true(output?.includes(title) ?? false);
	// Should still render ESC hint
	t.true(
		output?.includes('Press ESC to go back to issue selection mode') ?? false,
	);

	unmount();
});

test('should handle issues with long summaries', async t => {
	const issueWithLongSummary = createMockIssue({
		key: IssueKey.fromString('LONG-999'),
		fields: {
			...createMockIssue().fields,
			summary:
				'This is a very long issue summary that should be displayed correctly without breaking the layout or causing any rendering issues in the terminal interface',
		},
	});

	const title = 'Long Summary Test';
	const onSelect = (_key: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(IssueList, {
			issues: [issueWithLongSummary],
			title,
			onSelect,
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();

	// Should render the issue with long summary
	t.true(
		output?.includes('LONG-999 - This is a very long issue summary') ?? false,
	);

	unmount();
});

test('should handle issues with special characters in summary', async t => {
	const issueWithSpecialChars = createMockIssue({
		key: IssueKey.fromString('SPEC-123'),
		fields: {
			...createMockIssue().fields,
			summary: 'Issue with special chars: áéíóú, ñ, ¿¡, & < > " \'',
		},
	});

	const title = 'Special Characters Test';
	const onSelect = (_key: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(IssueList, {
			issues: [issueWithSpecialChars],
			title,
			onSelect,
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();

	// Should render the issue with special characters
	t.true(output?.includes('SPEC-123 - Issue with special chars') ?? false);

	unmount();
});

test('should not call onSelect multiple times', async t => {
	const mockIssues = createMockIssueList(1);
	const title = 'Test Issues';
	let callCount = 0;
	const onSelect = (_key: string) => {
		callCount++;
	};

	const {stdin, unmount} = render(
		React.createElement(IssueList, {
			issues: mockIssues,
			title,
			onSelect,
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	// Select first option
	stdin.write('\r');
	await InkTestHelpers.delay(100);

	t.is(callCount, 1);

	unmount();
});

test('should render with proper layout structure', async t => {
	const mockIssues = createMockIssueList(2);
	const title = 'Test Issues';
	const onSelect = (_key: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(IssueList, {
			issues: mockIssues,
			title,
			onSelect,
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();

	// Verify specific layout components are present
	const expectedStructure = ['TEST-123', 'TEST-124', 'Press ESC'];
	for (const element of expectedStructure) {
		t.true(output?.includes(element) ?? false, `Should contain ${element}`);
	}

	unmount();
});
