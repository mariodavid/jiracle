import test from 'ava';
import {SAPExportService} from '../../services/SAPExportService.js';
import type {JiraConfig} from '../../jira/types.js';

const createMockConfig = (): JiraConfig => ({
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

test('SAPExportService parseResponse handles success message', t => {
	// EXPLICIT TEST DATA
	const successHtml =
		'<div>Some content</div>Timesheet successfully sent to S4/Hana.<div>More content</div>';
	const expectedMessage = 'Timesheet successfully exported to SAP S/4HANA';
	const expectedSuccess = true;

	// OPERATIONS
	const config = createMockConfig();
	const service = new SAPExportService(config);
	const result = (service as any).parseResponse(successHtml);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.success, expectedSuccess, 'Should indicate success');
	t.is(
		result.message,
		expectedMessage,
		'Should return correct success message',
	);
	t.is(result.errors, undefined, 'Should not have errors');
});

test('SAPExportService parseResponse handles error messages', t => {
	// EXPLICIT TEST DATA
	const errorHtml = `
		<div class="aui-message aui-message-error">
			<p>Personnel number is required</p>
		</div>
	`;
	const expectedError = 'Personnel number is required';
	const expectedSuccess = false;

	// OPERATIONS
	const config = createMockConfig();
	const service = new SAPExportService(config);
	const result = (service as any).parseResponse(errorHtml);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.success, expectedSuccess, 'Should indicate failure');
	t.true(Array.isArray(result.errors), 'Should have errors array');
	t.is(result.errors!.length, 1, 'Should have one error');
	t.is(
		result.errors![0],
		expectedError,
		'Should extract correct error message',
	);
});

test('SAPExportService parseResponse handles warning messages', t => {
	// EXPLICIT TEST DATA
	const warningHtml = `
		<div class="aui-message aui-message-warning">
			<p>Some worklogs are missing sponsor information</p>
		</div>
		<div class="aui-message aui-message-error">
			<p>Export failed</p>
		</div>
	`;
	const expectedWarning = 'Some worklogs are missing sponsor information';
	const expectedError = 'Export failed';
	const expectedSuccess = false;

	// OPERATIONS
	const config = createMockConfig();
	const service = new SAPExportService(config);
	const result = (service as any).parseResponse(warningHtml);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.success, expectedSuccess, 'Should indicate failure');
	t.true(Array.isArray(result.errors), 'Should have errors array');
	t.true(Array.isArray(result.warnings), 'Should have warnings array');
	t.is(result.errors!.length, 1, 'Should have one error');
	t.is(result.warnings!.length, 1, 'Should have one warning');
	t.is(
		result.errors![0],
		expectedError,
		'Should extract correct error message',
	);
	t.is(
		result.warnings![0],
		expectedWarning,
		'Should extract correct warning message',
	);
});

test('SAPExportService parseResponse handles personnel number missing message', t => {
	// EXPLICIT TEST DATA
	const personnelHtml = 'Please provide the personnel number for export';
	const expectedError =
		'Personnel number (Persnr) is missing. Please configure in settings.';
	const expectedSuccess = false;

	// OPERATIONS
	const config = createMockConfig();
	const service = new SAPExportService(config);
	const result = (service as any).parseResponse(personnelHtml);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.success, expectedSuccess, 'Should indicate failure');
	t.true(Array.isArray(result.errors), 'Should have errors array');
	t.is(result.errors!.length, 1, 'Should have one error');
	t.is(
		result.errors![0],
		expectedError,
		'Should return standardized personnel error message',
	);
});

test('SAPExportService parseResponse handles no worklogs message', t => {
	// EXPLICIT TEST DATA
	const noWorklogsHtml = 'No worklogs found for the selected period';
	const expectedError = 'No worklogs found for the selected period.';
	const expectedSuccess = false;

	// OPERATIONS
	const config = createMockConfig();
	const service = new SAPExportService(config);
	const result = (service as any).parseResponse(noWorklogsHtml);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.success, expectedSuccess, 'Should indicate failure');
	t.true(Array.isArray(result.errors), 'Should have errors array');
	t.is(result.errors!.length, 1, 'Should have one error');
	t.is(
		result.errors![0],
		expectedError,
		'Should return correct no worklogs error message',
	);
});

test('SAPExportService parseResponse handles unknown response', t => {
	// EXPLICIT TEST DATA
	const unknownHtml =
		'<div>Some random HTML content without success or error indicators</div>';
	const expectedError = 'Unknown response from server. Export may have failed.';
	const expectedSuccess = false;

	// OPERATIONS
	const config = createMockConfig();
	const service = new SAPExportService(config);
	const result = (service as any).parseResponse(unknownHtml);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.success, expectedSuccess, 'Should indicate failure');
	t.true(Array.isArray(result.errors), 'Should have errors array');
	t.is(result.errors!.length, 1, 'Should have one error');
	t.is(
		result.errors![0],
		expectedError,
		'Should return unknown response error message',
	);
});
