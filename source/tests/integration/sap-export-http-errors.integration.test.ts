import test from 'ava';
import {SAPExportService} from '../../services/SAPExportService.js';
import type {JiraConfig} from '../../jira/types.js';

// Mock setup
const originalFetch = global.fetch;

function setupErrorMockFetch(error: Error) {
	global.fetch = async (): Promise<Response> => {
		throw error;
	};
}

function setupHttpErrorMockFetch(status: number, statusText: string) {
	global.fetch = async (): Promise<Response> =>
		({
			ok: false,
			status,
			statusText,
			text: async () => `<html><body>Generic server error page</body></html>`,
		} as Response);
}

function teardownMockFetch() {
	global.fetch = originalFetch;
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
	'Integration: SAP HTTP Errors - network timeout handling',
	async t => {
		// EXPLICIT TEST DATA
		const requestData = {
			year: 2025,
			month: 8,
			persnr: '12345',
			commentPrefix: 'SAP:',
			removeExistingTimesheets: true,
		};
		const timeoutError = new Error('Request timeout after 30 seconds');
		const expectedErrorPrefix = 'Network error:';

		// OPERATIONS
		setupErrorMockFetch(timeoutError);

		const config = createMockConfig();
		const service = new SAPExportService(config);
		const result = await service.exportTimesheet(requestData);

		// SPECIFIC VALUE COMPARISONS
		t.is(result.success, false, 'Should fail on network timeout');
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

test.serial(
	'Integration: SAP HTTP Errors - 401 unauthorized handling',
	async t => {
		// EXPLICIT TEST DATA
		const requestData = {
			year: 2025,
			month: 8,
			persnr: '12345',
			commentPrefix: 'SAP:',
			removeExistingTimesheets: true,
		};
		const expectedError = 'HTTP 401: Unauthorized';

		// OPERATIONS
		setupHttpErrorMockFetch(401, 'Unauthorized');

		const config = createMockConfig();
		const service = new SAPExportService(config);
		const result = await service.exportTimesheet(requestData);

		// SPECIFIC VALUE COMPARISONS
		t.is(result.success, false, 'Should fail on 401 unauthorized');
		t.true(Array.isArray(result.errors), 'Should have errors array');
		t.is(result.errors!.length, 1, 'Should have one error');
		t.is(
			result.errors![0],
			expectedError,
			'Should return HTTP 401 error message',
		);

		// Cleanup
		teardownMockFetch();
	},
);

test.serial(
	'Integration: SAP HTTP Errors - 500 internal server error handling',
	async t => {
		// EXPLICIT TEST DATA
		const requestData = {
			year: 2025,
			month: 8,
			persnr: '12345',
			commentPrefix: 'SAP:',
			removeExistingTimesheets: true,
		};
		const expectedError = 'HTTP 500: Internal Server Error';

		// OPERATIONS
		setupHttpErrorMockFetch(500, 'Internal Server Error');

		const config = createMockConfig();
		const service = new SAPExportService(config);
		const result = await service.exportTimesheet(requestData);

		// SPECIFIC VALUE COMPARISONS
		t.is(result.success, false, 'Should fail on 500 server error');
		t.true(Array.isArray(result.errors), 'Should have errors array');
		t.is(result.errors!.length, 1, 'Should have one error');
		t.is(
			result.errors![0],
			expectedError,
			'Should return HTTP 500 error message',
		);

		// Cleanup
		teardownMockFetch();
	},
);

test.serial(
	'Integration: SAP HTTP Errors - DNS resolution failure',
	async t => {
		// EXPLICIT TEST DATA
		const requestData = {
			year: 2025,
			month: 8,
			persnr: '12345',
			commentPrefix: 'SAP:',
			removeExistingTimesheets: true,
		};
		const dnsError = new Error('getaddrinfo ENOTFOUND invalid-jira-url.com');
		const expectedErrorPrefix = 'Network error:';

		// OPERATIONS
		setupErrorMockFetch(dnsError);

		const config = createMockConfig();
		const service = new SAPExportService(config);
		const result = await service.exportTimesheet(requestData);

		// SPECIFIC VALUE COMPARISONS
		t.is(result.success, false, 'Should fail on DNS resolution failure');
		t.true(Array.isArray(result.errors), 'Should have errors array');
		t.is(result.errors!.length, 1, 'Should have one error');
		t.true(
			result.errors![0]!.startsWith(expectedErrorPrefix),
			'Should indicate network error',
		);
		t.true(
			result.errors![0]!.includes('ENOTFOUND'),
			'Should mention DNS error in message',
		);

		// Cleanup
		teardownMockFetch();
	},
);
