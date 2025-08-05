import test from 'ava';
import {SAPExportService} from '../../services/SAPExportService.js';
import type {JiraConfig} from '../../jira/types.js';

// Mock setup
const originalFetch = global.fetch;

function setupMockFetch(response: {status: number; text: string; ok: boolean}) {
	global.fetch = async (): Promise<Response> =>
		({
			status: response.status,
			ok: response.ok,
			text: async () => response.text,
		} as Response);
}

function teardownMockFetch() {
	global.fetch = originalFetch;
}

test.serial(
	'Integration: SAP Config Validation - missing SAP configuration',
	async t => {
		// EXPLICIT TEST DATA
		const configWithoutSAP: JiraConfig = {
			jiraUrl: 'https://test.atlassian.net',
			username: 'test@example.com',
			apiToken: 'test-token',
		};
		const requestData = {
			year: 2025,
			month: 8,
			persnr: '',
			commentPrefix: '',
			removeExistingTimesheets: false,
		};
		const expectedError =
			'Personnel number (Persnr) is missing. Please configure in settings.';

		// OPERATIONS
		const errorHtml = `
			<html>
				<body>
					<div class="aui-message aui-message-error">Cannot find employee for . Please verify that the number is correct.</div>
				</body>
			</html>
		`;
		setupMockFetch({
			status: 200,
			ok: true,
			text: errorHtml,
		});

		const service = new SAPExportService(configWithoutSAP);
		const result = await service.exportTimesheet(requestData);

		// SPECIFIC VALUE COMPARISONS
		t.is(result.success, false, 'Should fail when personnel number is missing');
		t.true(Array.isArray(result.errors), 'Should have errors array');
		t.is(result.errors!.length, 1, 'Should have one error');
		t.is(
			result.errors![0],
			expectedError,
			'Should return personnel number error message',
		);

		// Cleanup
		teardownMockFetch();
	},
);

test.serial(
	'Integration: SAP Config Validation - disabled SAP configuration',
	async t => {
		// EXPLICIT TEST DATA
		const configWithDisabledSAP: JiraConfig = {
			jiraUrl: 'https://test.atlassian.net',
			username: 'test@example.com',
			apiToken: 'test-token',
			sap: {
				enabled: false,
				persnr: '12345',
				commentPrefix: 'SAP:',
				removeExistingTimesheets: true,
			},
		};
		const requestData = {
			year: 2025,
			month: 8,
			persnr: '12345',
			commentPrefix: 'SAP:',
			removeExistingTimesheets: true,
		};

		// OPERATIONS - Should work at service level even if disabled in config
		setupMockFetch({
			status: 200,
			ok: true,
			text: 'Timesheet successfully sent to S4/Hana.',
		});

		const service = new SAPExportService(configWithDisabledSAP);
		const result = await service.exportTimesheet(requestData);

		// SPECIFIC VALUE COMPARISONS - Service doesn't check enabled flag
		t.is(
			result.success,
			true,
			'Service should work regardless of enabled flag',
		);
		t.is(
			result.message,
			'Timesheet successfully exported to SAP S/4HANA',
			'Should return success message',
		);

		// Cleanup
		teardownMockFetch();
	},
);

test.serial(
	'Integration: SAP Config Validation - empty personnel number handling',
	async t => {
		// EXPLICIT TEST DATA
		const configWithEmptyPersnr: JiraConfig = {
			jiraUrl: 'https://test.atlassian.net',
			username: 'test@example.com',
			apiToken: 'test-token',
			sap: {
				enabled: true,
				persnr: '',
				commentPrefix: 'SAP:',
				removeExistingTimesheets: true,
			},
		};
		const requestData = {
			year: 2025,
			month: 8,
			persnr: '',
			commentPrefix: 'SAP:',
			removeExistingTimesheets: true,
		};
		const expectedError =
			'Personnel number (Persnr) is missing. Please configure in settings.';

		// OPERATIONS
		const errorHtml = `
			<html>
				<body>
					<div class="aui-message aui-message-error">Cannot find employee for . Please verify that the number is correct.</div>
				</body>
			</html>
		`;
		setupMockFetch({
			status: 200,
			ok: true,
			text: errorHtml,
		});

		const service = new SAPExportService(configWithEmptyPersnr);
		const result = await service.exportTimesheet(requestData);

		// SPECIFIC VALUE COMPARISONS
		t.is(result.success, false, 'Should fail when personnel number is empty');
		t.true(Array.isArray(result.errors), 'Should have errors array');
		t.is(result.errors!.length, 1, 'Should have one error');
		t.is(
			result.errors![0],
			expectedError,
			'Should return personnel number error message',
		);

		// Cleanup
		teardownMockFetch();
	},
);

test.serial(
	'Integration: SAP Config Validation - complete valid configuration',
	async t => {
		// EXPLICIT TEST DATA
		const completeValidConfig: JiraConfig = {
			jiraUrl: 'https://test.atlassian.net',
			username: 'test@example.com',
			apiToken: 'test-token',
			sap: {
				enabled: true,
				persnr: '12345',
				commentPrefix: 'SAP Export:',
				removeExistingTimesheets: true,
			},
		};
		const requestData = {
			year: 2025,
			month: 8,
			persnr: '12345',
			commentPrefix: 'SAP Export:',
			removeExistingTimesheets: true,
		};
		const expectedSuccessMessage =
			'Timesheet successfully exported to SAP S/4HANA';

		// OPERATIONS
		setupMockFetch({
			status: 200,
			ok: true,
			text: 'Timesheet successfully sent to S4/Hana.',
		});

		const service = new SAPExportService(completeValidConfig);
		const result = await service.exportTimesheet(requestData);

		// SPECIFIC VALUE COMPARISONS
		t.is(
			result.success,
			true,
			'Should succeed with complete valid configuration',
		);
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
