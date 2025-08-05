import test from 'ava';
import {SAPExportService} from '../../services/SAPExportService.js';
import type {JiraConfig} from '../../jira/types.js';

// Mock setup
const originalFetch = global.fetch;
let mockFetchResponse:
	| {
			status: number;
			text: () => Promise<string>;
			ok: boolean;
	  }
	| undefined;

function setupMockFetch(response: typeof mockFetchResponse) {
	mockFetchResponse = response;
	global.fetch = async (): Promise<Response> => {
		if (!mockFetchResponse) {
			throw new Error('Mock fetch response not configured');
		}

		return mockFetchResponse as Response;
	};
}

function teardownMockFetch() {
	global.fetch = originalFetch;
	mockFetchResponse = undefined;
}

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

test.serial(
	'Integration: SAP Export - Successful timesheet export with mock server',
	async t => {
		// EXPLICIT TEST DATA
		const successHtml = `
			<html>
				<body>
					<div class="page-content">
						<div class="aui-message aui-message-success">
							Timesheet successfully sent to S4/Hana.
						</div>
						<p>Your timesheet for August 2025 has been exported successfully.</p>
					</body>
				</html>
		`;
		const expectedRequestData = {
			year: 2025,
			month: 8,
			persnr: '12345',
			commentPrefix: 'SAP:',
			removeExistingTimesheets: true,
		};
		const expectedSuccessMessage =
			'Timesheet successfully exported to SAP S/4HANA';

		// OPERATIONS
		setupMockFetch({
			status: 200,
			ok: true,
			text: async () => successHtml,
		});

		const config = createMockConfig();
		const service = new SAPExportService(config);
		const result = await service.exportTimesheet(expectedRequestData);

		// SPECIFIC VALUE COMPARISONS
		t.is(result.success, true, 'Should indicate successful export');
		t.is(
			result.message,
			expectedSuccessMessage,
			'Should return correct success message',
		);
		t.is(result.errors, undefined, 'Should not have errors');
		t.is(result.warnings, undefined, 'Should not have warnings');

		// Cleanup
		teardownMockFetch();
	},
);

test.serial(
	'Integration: SAP Export - Personnel number missing error handling',
	async t => {
		// EXPLICIT TEST DATA
		const errorHtml = `
			<html>
				<body>
					<div class="page-content">
						<div class="aui-message aui-message-error" style="margin-top: 0;">Cannot find employee for 123. Please verify that the number is correct.
						</div>
					</body>
				</html>
		`;
		const requestData = {
			year: 2025,
			month: 8,
			persnr: '12345',
			commentPrefix: 'SAP:',
			removeExistingTimesheets: true,
		};
		const expectedError =
			'Personnel number (Persnr) is missing. Please configure in settings.';

		// OPERATIONS
		setupMockFetch({
			status: 200,
			ok: true,
			text: async () => errorHtml,
		});

		const config = createMockConfig();
		const service = new SAPExportService(config);
		const result = await service.exportTimesheet(requestData);

		// SPECIFIC VALUE COMPARISONS
		t.is(result.success, false, 'Should indicate failed export');
		t.true(Array.isArray(result.errors), 'Should have errors array');
		t.is(result.errors!.length, 1, 'Should have one error');
		t.is(
			result.errors![0],
			expectedError,
			'Should return standardized personnel error message',
		);

		// Cleanup
		teardownMockFetch();
	},
);

test.serial(
	'Integration: SAP Export - Multiple errors and warnings handling',
	async t => {
		// EXPLICIT TEST DATA
		const complexErrorHtml = `
			<html>
				<body>
					<div class="page-content">
						<div class="aui-message aui-message-error">
							<p>Export failed due to validation errors</p>
						</div>
						<div class="aui-message aui-message-warning">
							<p>Some worklogs are missing sponsor information</p>
						</div>
						<div class="aui-message aui-message-warning">
							<p>Time entries exceed daily limit</p>
						</div>
					</div>
				</body>
			</html>
		`;
		const requestData = {
			year: 2025,
			month: 8,
			persnr: '12345',
			commentPrefix: '',
			removeExistingTimesheets: false,
		};
		const expectedError = 'Export failed due to validation errors';
		const expectedWarnings = [
			'Some worklogs are missing sponsor information',
			'Time entries exceed daily limit',
		];

		// OPERATIONS
		setupMockFetch({
			status: 422,
			ok: false,
			text: async () => complexErrorHtml,
		});

		const config = createMockConfig();
		const service = new SAPExportService(config);
		const result = await service.exportTimesheet(requestData);

		// SPECIFIC VALUE COMPARISONS
		t.is(result.success, false, 'Should indicate failed export');
		t.true(Array.isArray(result.errors), 'Should have errors array');
		t.true(Array.isArray(result.warnings), 'Should have warnings array');
		t.is(result.errors!.length, 1, 'Should have one error');
		t.is(result.warnings!.length, 2, 'Should have two warnings');
		t.is(
			result.errors![0],
			expectedError,
			'Should extract correct error message',
		);
		t.deepEqual(
			result.warnings,
			expectedWarnings,
			'Should extract all warning messages',
		);

		// Cleanup
		teardownMockFetch();
	},
);

test.serial(
	'Integration: SAP Export - Network error handling with timeout',
	async t => {
		// EXPLICIT TEST DATA
		const requestData = {
			year: 2025,
			month: 8,
			persnr: '12345',
			commentPrefix: 'SAP:',
			removeExistingTimesheets: true,
		};
		const expectedErrorPrefix = 'Network error:';

		// OPERATIONS
		global.fetch = async (): Promise<Response> => {
			throw new Error('Network timeout after 30 seconds');
		};

		const config = createMockConfig();
		const service = new SAPExportService(config);
		const result = await service.exportTimesheet(requestData);

		// SPECIFIC VALUE COMPARISONS
		t.is(result.success, false, 'Should indicate failed export');
		t.true(Array.isArray(result.errors), 'Should have errors array');
		t.is(result.errors!.length, 1, 'Should have one error');
		t.true(
			result.errors![0]!.startsWith(expectedErrorPrefix),
			'Should indicate network error',
		);
		t.true(
			result.errors![0]!.includes('timeout'),
			'Should mention timeout in error message',
		);

		// Cleanup
		teardownMockFetch();
	},
);
