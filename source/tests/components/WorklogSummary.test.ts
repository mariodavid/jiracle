import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import WorklogSummary from '../../components/WorklogSummary.js';
import {createMockIssue} from '../utils/testUtils.js';
import {InkTestHelpers} from '../utils/ink-test-helpers.js';

test('should render submitting variant correctly', async t => {
	const {lastFrame, unmount} = render(
		React.createElement(WorklogSummary, {
			variant: 'submitting',
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();
	t.true(output?.includes('Submitting worklog...') ?? false);

	unmount();
});

test('should render success variant with all worklog details', async t => {
	const mockIssue = createMockIssue({
		key: 'TEST-456',
		fields: {
			...createMockIssue().fields,
			summary: 'Test issue for worklog',
		},
	});

	const {lastFrame, unmount} = render(
		React.createElement(WorklogSummary, {
			variant: 'success',
			selectedIssue: mockIssue,
			selectedTime: '2h',
			comment: 'Worked on feature implementation',
			selectedDate: '2025-01-09T12:00:00.000Z',
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();
	t.true(output?.includes('✓ Worklog successfully added!') ?? false);
	t.true(output?.includes('Issue: TEST-456') ?? false);
	t.true(output?.includes('Time: 2h') ?? false);
	t.true(
		output?.includes('Comment: Worked on feature implementation') ?? false,
	);
	t.true(output?.includes('Date: 2025-01-09') ?? false);

	unmount();
});

test('should display default comment when comment is empty', async t => {
	const mockIssue = createMockIssue();

	const {lastFrame, unmount} = render(
		React.createElement(WorklogSummary, {
			variant: 'success',
			selectedIssue: mockIssue,
			selectedTime: '1h',
			comment: '',
			selectedDate: '2025-01-09T12:00:00.000Z',
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();
	t.true(output?.includes('Comment: Worked on this issue') ?? false);

	unmount();
});

test('should display default comment when comment is undefined', async t => {
	const mockIssue = createMockIssue();

	const {lastFrame, unmount} = render(
		React.createElement(WorklogSummary, {
			variant: 'success',
			selectedIssue: mockIssue,
			selectedTime: '1h',
			selectedDate: '2025-01-09T12:00:00.000Z',
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();
	t.true(output?.includes('Comment: Worked on this issue') ?? false);

	unmount();
});

test('should format date correctly (only date part)', async t => {
	const mockIssue = createMockIssue();

	const {lastFrame, unmount} = render(
		React.createElement(WorklogSummary, {
			variant: 'success',
			selectedIssue: mockIssue,
			selectedTime: '1h',
			comment: 'Test comment',
			selectedDate: '2025-12-25T15:30:45.123Z',
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();
	t.true(output?.includes('Date: 2025-12-25') ?? false);
	t.false(output?.includes('T15:30:45') ?? true);

	unmount();
});

test('should display returning to main menu message', async t => {
	const mockIssue = createMockIssue();

	const {lastFrame, unmount} = render(
		React.createElement(WorklogSummary, {
			variant: 'success',
			selectedIssue: mockIssue,
			selectedTime: '1h',
			comment: 'Test comment',
			selectedDate: '2025-01-09T12:00:00.000Z',
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();
	t.true(output?.includes('Returning to main menu...') ?? false);

	unmount();
});

test('should return null when success variant but no selectedIssue', async t => {
	const {lastFrame, unmount} = render(
		React.createElement(WorklogSummary, {
			variant: 'success',
			selectedTime: '1h',
			comment: 'Test comment',
			selectedDate: '2025-01-09T12:00:00.000Z',
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();
	// Should render nothing when no selectedIssue
	t.true(output === null || output === '');

	unmount();
});

test('should return null when success variant but selectedIssue is null', async t => {
	const {lastFrame, unmount} = render(
		React.createElement(WorklogSummary, {
			variant: 'success',
			selectedIssue: null,
			selectedTime: '1h',
			comment: 'Test comment',
			selectedDate: '2025-01-09T12:00:00.000Z',
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();
	// Should render nothing when selectedIssue is null
	t.true(output === null || output === '');

	unmount();
});

test('should handle missing selectedDate gracefully', async t => {
	const mockIssue = createMockIssue();

	const {lastFrame, unmount} = render(
		React.createElement(WorklogSummary, {
			variant: 'success',
			selectedIssue: mockIssue,
			selectedTime: '1h',
			comment: 'Test comment',
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();
	// Should still render other information
	t.true(output?.includes('✓ Worklog successfully added!') ?? false);
	t.true(output?.includes('Issue: TEST-123') ?? false);
	t.true(output?.includes('Time: 1h') ?? false);

	unmount();
});

test('should handle missing selectedTime gracefully', async t => {
	const mockIssue = createMockIssue();

	const {lastFrame, unmount} = render(
		React.createElement(WorklogSummary, {
			variant: 'success',
			selectedIssue: mockIssue,
			comment: 'Test comment',
			selectedDate: '2025-01-09T12:00:00.000Z',
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();
	// Should still render other information
	t.true(output?.includes('✓ Worklog successfully added!') ?? false);
	t.true(output?.includes('Issue: TEST-123') ?? false);
	t.true(output?.includes('Date: 2025-01-09') ?? false);

	unmount();
});

test('should handle long comments correctly', async t => {
	const mockIssue = createMockIssue();
	const longComment =
		'This is a very long comment that describes in detail what was accomplished during this work session and should be displayed correctly without breaking the layout';

	const {lastFrame, unmount} = render(
		React.createElement(WorklogSummary, {
			variant: 'success',
			selectedIssue: mockIssue,
			selectedTime: '1h',
			comment: longComment,
			selectedDate: '2025-01-09T12:00:00.000Z',
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();
	t.true(output?.includes('Comment: This is a very long comment') ?? false);

	unmount();
});

test('should handle special characters in comment', async t => {
	const mockIssue = createMockIssue();
	const specialComment =
		'Fixed bug with special chars: áéíóú, ñ, ¿¡, & < > " \'';

	const {lastFrame, unmount} = render(
		React.createElement(WorklogSummary, {
			variant: 'success',
			selectedIssue: mockIssue,
			selectedTime: '1h',
			comment: specialComment,
			selectedDate: '2025-01-09T12:00:00.000Z',
		}),
	);

	// Wait for component to render
	await InkTestHelpers.delay(100);

	const output = lastFrame();
	t.true(output?.includes('Comment: Fixed bug with special chars') ?? false);

	unmount();
});
