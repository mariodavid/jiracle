import test from 'ava';
import {SAPExportService} from '../../services/SAPExportService.js';
import {MonthYear} from '../../domain/MonthYear.js';
import {PersonnelNumber} from '../../domain/PersonnelNumber.js';
import {ExportPeriod} from '../../domain/ExportPeriod.js';
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

// Mock global fetch
const originalFetch = global.fetch;

function setupSuccessfulMockFetch() {
	global.fetch = async (): Promise<Response> =>
		({
			ok: true,
			status: 200,
			text: async () =>
				'<div>Some content</div>Timesheet successfully sent to S4/Hana.<div>More content</div>',
		} as Response);
}

function teardownMockFetch() {
	global.fetch = originalFetch;
}

test.serial(
	'SAPExportService handles successful export with domain objects',
	async t => {
		// EXPLICIT TEST DATA
		const expectedSuccess = true;
		const expectedMessage = 'Timesheet successfully exported to SAP S/4HANA';
		const monthYear = new MonthYear(2024, 3);
		const period = ExportPeriod.forMonth(monthYear);
		const personnelNumber = PersonnelNumber.fromString('12345');

		// OPERATIONS
		setupSuccessfulMockFetch();
		const config = createMockConfig();
		const service = new SAPExportService(config);

		const result = await service.exportTimesheet({
			period,
			personnelNumber,
			commentPrefix: 'SAP:',
			removeExistingTimesheets: true,
		});

		teardownMockFetch();

		// SPECIFIC VALUE COMPARISONS
		t.is(result.success, expectedSuccess, 'Should indicate success');
		t.is(result.message, expectedMessage, 'Should return success message');
		t.is(result.errors, undefined, 'Should not have errors');
	},
);

test.serial(
	'SAPExportService legacy method works with primitive data',
	async t => {
		// EXPLICIT TEST DATA
		const expectedSuccess = true;
		const legacyRequest = {
			year: 2024,
			month: 3,
			persnr: '123456',
			commentPrefix: 'SAP:',
			removeExistingTimesheets: true,
		};

		// OPERATIONS
		setupSuccessfulMockFetch();
		const config = createMockConfig();
		const service = new SAPExportService(config);

		const result = await service.exportTimesheetLegacy(legacyRequest);

		teardownMockFetch();

		// SPECIFIC VALUE COMPARISONS
		t.is(result.success, expectedSuccess, 'Should indicate success');
		t.truthy(result.message, 'Should have success message');
	},
);

test.serial(
	'SAPExportService validates export period spans single month',
	async t => {
		// EXPLICIT TEST DATA
		const expectedSuccess = false;
		const expectedError = 'Export period must be within a single month';
		const startDate = MonthYear.fromString('2024-03').getStartDate();
		const endDate = MonthYear.fromString('2024-04').getEndDate();
		const crossMonthPeriod = ExportPeriod.forDateRange(startDate, endDate);
		const personnelNumber = PersonnelNumber.fromString('12345');

		// OPERATIONS
		const config = createMockConfig();
		const service = new SAPExportService(config);

		const result = await service.exportTimesheet({
			period: crossMonthPeriod,
			personnelNumber,
			commentPrefix: 'SAP:',
			removeExistingTimesheets: true,
		});

		// SPECIFIC VALUE COMPARISONS
		t.is(result.success, expectedSuccess, 'Should indicate failure');
		t.truthy(result.errors, 'Should have errors');
		t.is(
			result.errors![0],
			expectedError,
			'Should show period validation error',
		);
	},
);

test.serial(
	'SAPExportService legacy method validates personnel number format',
	async t => {
		// EXPLICIT TEST DATA
		const expectedError =
			'Personnel number (Persnr) is missing. Please configure in settings.';
		const invalidRequest = {
			year: 2024,
			month: 3,
			persnr: 'abc',
			commentPrefix: 'SAP:',
			removeExistingTimesheets: true,
		};

		// OPERATIONS
		const config = createMockConfig();
		const service = new SAPExportService(config);
		const result = await service.exportTimesheetLegacy(invalidRequest);

		// SPECIFIC VALUE COMPARISONS
		t.false(result.success, 'Should indicate failure');
		t.truthy(result.errors, 'Should have errors');
		t.is(
			result.errors![0],
			expectedError,
			'Should return personnel validation error',
		);
	},
);
