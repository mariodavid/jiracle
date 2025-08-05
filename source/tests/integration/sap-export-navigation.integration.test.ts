import test from 'ava';
import {render} from 'ink-testing-library';
import React from 'react';
import {WeeklyTimetableView} from '../../components/WeeklyTimetableView.js';
import type {JiraConfig} from '../../jira/types.js';
import {TestPatterns} from '../utils/test-helpers.js';
import {InkTestHelpers} from '../utils/ink-test-helpers.js';

// Mock setup for fetch
const originalFetch = global.fetch;

function setupSuccessfulSAPMock() {
	global.fetch = async (): Promise<Response> =>
		({
			ok: true,
			status: 200,
			text: async () => 'Timesheet successfully sent to S4/Hana.',
		} as Response);
}

function teardownMockFetch() {
	global.fetch = originalFetch;
}

const createValidSAPConfig = (): JiraConfig => ({
	jiraUrl: 'https://test.atlassian.net',
	username: 'test@example.com',
	apiToken: 'test-token',
	sap: {
		enabled: true,
		persnr: '12345',
		commentPrefix: 'SAP:',
		removeExistingTimesheets: true,
	},
});

const createConfigWithoutSAP = (): JiraConfig => ({
	jiraUrl: 'https://test.atlassian.net',
	username: 'test@example.com',
	apiToken: 'test-token',
});

test.serial(
	'Integration: SAP Export navigation - e-key triggers export flow',
	async t => {
		// EXPLICIT TEST DATA
		const expectedTimetableHelp = '[E] SAP Export';
		const expectedExportScreen = 'Select Export Period';
		const mockConfig = createValidSAPConfig();

		// OPERATIONS
		await TestPatterns.withTempFiles(async () => {
			const {lastFrame, stdin} = render(
				React.createElement(WeeklyTimetableView, {
					config: mockConfig,
					userEmail: 'test@example.com',
					onBack() {},
				}),
			);

			// Wait for initial render
			await InkTestHelpers.delay(100);
			const initialOutput = lastFrame()!;

			// Press 'e' to trigger export
			stdin.write('e');
			await InkTestHelpers.delay(100);
			const exportOutput = lastFrame()!;

			// SPECIFIC VALUE COMPARISONS
			t.true(
				initialOutput.includes(expectedTimetableHelp),
				'Should show export option in help text',
			);
			t.true(
				exportOutput.includes(expectedExportScreen),
				'Should navigate to export screen after e-key',
			);
		});
	},
);

test.serial(
	'Integration: SAP Export navigation - complete flow from e-key to confirmation to result',
	async t => {
		// EXPLICIT TEST DATA
		const expectedSelectionScreen = 'Select Export Period';
		const expectedConfirmationScreen = 'Export Details';
		const expectedResultScreen = 'Export Successful';
		const mockConfig = createValidSAPConfig();

		// OPERATIONS
		setupSuccessfulSAPMock();

		await TestPatterns.withTempFiles(async () => {
			const {lastFrame, stdin} = render(
				React.createElement(WeeklyTimetableView, {
					config: mockConfig,
					userEmail: 'test@example.com',
					onBack() {},
				}),
			);

			// Step 1: Navigate to export
			stdin.write('e');
			await InkTestHelpers.delay(100);
			const selectionOutput = lastFrame()!;

			// Step 2: Confirm selection (Enter key)
			stdin.write('\r'); // Enter key
			await InkTestHelpers.delay(100);
			const confirmationOutput = lastFrame()!;

			// Step 3: Confirm export (Enter key again)
			stdin.write('\r'); // Enter key
			await InkTestHelpers.delay(200); // Allow time for async export
			const resultOutput = lastFrame()!;

			// SPECIFIC VALUE COMPARISONS
			t.true(
				selectionOutput.includes(expectedSelectionScreen),
				'Should show selection screen first',
			);
			t.true(
				confirmationOutput.includes(expectedConfirmationScreen),
				'Should show confirmation screen after selection',
			);
			t.true(
				resultOutput.includes(expectedResultScreen),
				'Should show success result after export',
			);
		});

		// Cleanup
		teardownMockFetch();
	},
);

test.serial(
	'Integration: SAP Export navigation - q-key cancellation at each step',
	async t => {
		// EXPLICIT TEST DATA
		const expectedTimetableHelp = '[E] SAP Export';
		const expectedSelectionScreen = 'Select Export Period';
		const mockConfig = createValidSAPConfig();

		// OPERATIONS
		await TestPatterns.withTempFiles(async () => {
			const {lastFrame, stdin} = render(
				React.createElement(WeeklyTimetableView, {
					config: mockConfig,
					userEmail: 'test@example.com',
					onBack() {},
				}),
			);

			// Navigate to export
			stdin.write('e');
			await InkTestHelpers.delay(100);
			const exportOutput = lastFrame()!;

			// Cancel with q-key
			stdin.write('q');
			await InkTestHelpers.delay(100);
			const backToTimetableOutput = lastFrame()!;

			// SPECIFIC VALUE COMPARISONS
			t.true(
				exportOutput.includes(expectedSelectionScreen),
				'Should show export selection screen',
			);
			t.true(
				backToTimetableOutput.includes(expectedTimetableHelp),
				'Should return to timetable after q-key cancellation',
			);
			t.false(
				backToTimetableOutput.includes(expectedSelectionScreen),
				'Should not show selection screen after cancellation',
			);
		});
	},
);

test.serial(
	'Integration: SAP Export navigation - disabled SAP shows configuration error',
	async t => {
		// EXPLICIT TEST DATA
		const expectedErrorMessage = 'SAP export is not enabled';
		const mockConfig = createConfigWithoutSAP();

		// OPERATIONS
		await TestPatterns.withTempFiles(async () => {
			const {lastFrame, stdin} = render(
				React.createElement(WeeklyTimetableView, {
					config: mockConfig,
					userEmail: 'test@example.com',
					onBack() {},
				}),
			);

			// Press 'e' to trigger export
			stdin.write('e');
			await InkTestHelpers.delay(100);

			// Should see the MonthYearSelector first
			const selectionOutput = lastFrame()!;
			t.true(
				selectionOutput.includes('Select Export Period'),
				'Should show period selection screen first',
			);

			// Press Enter to proceed to confirmation where error should be shown
			stdin.write('\r'); // Enter key
			await InkTestHelpers.delay(100);
			const errorOutput = lastFrame()!;

			// SPECIFIC VALUE COMPARISONS
			t.true(
				errorOutput.includes(expectedErrorMessage),
				'Should show SAP disabled error message in confirmation screen',
			);
		});
	},
);
