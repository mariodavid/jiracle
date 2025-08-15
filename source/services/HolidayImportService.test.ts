import test from 'ava';
import type {Attendance, AttendanceConfig} from '../attendance/types.js';
import {LocalDate} from '../domain/LocalDate.js';
import {HolidayImportService} from './HolidayImportService.js';

// Test Data
const testConfig: AttendanceConfig = {
	enabled: true,
	workingHours: 8,
	breakMinutes: 30,
	defaultCheckIn: '08:00',
	defaultCheckOut: '17:00',
	defaultBreakMinutes: 30,
	holidays: {
		land: 'sh',
	},
};

const testConfigNoHolidays: AttendanceConfig = {
	enabled: true,
	workingHours: 8,
	breakMinutes: 30,
	defaultCheckIn: '08:00',
	defaultCheckOut: '17:00',
	defaultBreakMinutes: 30,
};

const mockHolidayApiResponse = {
	Neujahrstag: {
		datum: '2025-01-01',
		hinweis: '',
	},
	Karfreitag: {
		datum: '2025-04-18',
		hinweis: '',
	},
	Ostermontag: {
		datum: '2025-04-21',
		hinweis: '',
	},
};

// Mock AttendanceManager
class MockAttendanceManager {
	public updatedAttendances: Attendance[] = [];
	public existingDates = new Set<string>();

	async updateAttendance(attendance: Attendance): Promise<Attendance> {
		this.updatedAttendances.push(attendance);
		return attendance;
	}

	async hasAttendanceForDate(date: LocalDate | string): Promise<boolean> {
		const dateString = date instanceof LocalDate ? date.toISOString() : date;
		return this.existingDates.has(dateString);
	}

	setExistingDate(date: string): void {
		this.existingDates.add(date);
	}
}

// Mock fetch globally
const originalFetch = globalThis.fetch;

test.beforeEach(() => {
	globalThis.fetch = async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : (input as URL).href;
		if (url.includes('feiertage-api.de')) {
			return {
				ok: true,
				json: async () => mockHolidayApiResponse,
			} as Response;
		}

		throw new Error(`Unexpected fetch to ${url}`);
	};
});

test.afterEach(() => {
	globalThis.fetch = originalFetch;
});

// Operations and Tests
test('HolidayImportService - isConfigured returns true when holidays config exists', t => {
	// EXPLICIT TEST DATA
	const configWithHolidays = testConfig;
	const expectedResult = true;

	// OPERATIONS
	const mockManager = new MockAttendanceManager();
	const service = new HolidayImportService(mockManager, configWithHolidays);
	const result = service.isConfigured();

	// SPECIFIC VALUE COMPARISONS
	t.is(
		result,
		expectedResult,
		'Should return true when holidays config exists',
	);
});

test('HolidayImportService - isConfigured returns false when holidays config missing', t => {
	// EXPLICIT TEST DATA
	const configWithoutHolidays = testConfigNoHolidays;
	const expectedResult = false;

	// OPERATIONS
	const mockManager = new MockAttendanceManager();
	const service = new HolidayImportService(mockManager, configWithoutHolidays);
	const result = service.isConfigured();

	// SPECIFIC VALUE COMPARISONS
	t.is(
		result,
		expectedResult,
		'Should return false when holidays config missing',
	);
});

test('HolidayImportService - getConfiguredLand returns correct land code', t => {
	// EXPLICIT TEST DATA
	const configWithLand = testConfig; // Contains land: 'sh'
	const expectedLandCode = 'sh';

	// OPERATIONS
	const mockManager = new MockAttendanceManager();
	const service = new HolidayImportService(mockManager, configWithLand);
	const result = service.getConfiguredLand();

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedLandCode, 'Should return configured land code');
});

test('HolidayImportService - getConfiguredLand returns undefined when not configured', t => {
	// EXPLICIT TEST DATA
	const configWithoutHolidays = testConfigNoHolidays;
	const expectedResult = undefined;

	// OPERATIONS
	const mockManager = new MockAttendanceManager();
	const service = new HolidayImportService(mockManager, configWithoutHolidays);
	const result = service.getConfiguredLand();

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedResult, 'Should return undefined when not configured');
});

test('HolidayImportService - importHolidays throws when land not configured', async t => {
	// EXPLICIT TEST DATA
	const configWithoutHolidays = testConfigNoHolidays;
	const testYear = 2025;
	const expectedErrorMessage =
		'Holiday land configuration is missing in attendance config';

	// OPERATIONS
	const mockManager = new MockAttendanceManager();
	const service = new HolidayImportService(mockManager, configWithoutHolidays);

	// SPECIFIC VALUE COMPARISONS
	await t.throwsAsync(async () => service.importHolidays(testYear), {
		message: expectedErrorMessage,
	});
});

test('HolidayImportService - importHolidays successfully imports holidays', async t => {
	// EXPLICIT TEST DATA
	const testYear = 2025;
	const expectedImportCount = 3;
	const expectedAttendances = [
		{
			date: '2025-01-01',
			type: 'HOLIDAY',
			breakMinutes: 0,
			totalHours: 0,
			notes: 'Public Holiday: Neujahrstag',
		},
		{
			date: '2025-04-18',
			type: 'HOLIDAY',
			breakMinutes: 0,
			totalHours: 0,
			notes: 'Public Holiday: Karfreitag',
		},
		{
			date: '2025-04-21',
			type: 'HOLIDAY',
			breakMinutes: 0,
			totalHours: 0,
			notes: 'Public Holiday: Ostermontag',
		},
	];

	// OPERATIONS
	const mockManager = new MockAttendanceManager();
	const service = new HolidayImportService(mockManager, testConfig);
	const result = await service.importHolidays(testYear);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedImportCount, 'Should return correct import count');
	t.deepEqual(
		mockManager.updatedAttendances,
		expectedAttendances,
		'Should import all holidays with correct data',
	);
});

test('HolidayImportService - importHolidays handles API errors', async t => {
	// EXPLICIT TEST DATA
	const testYear = 2025;
	const expectedErrorPattern = /Holiday API request failed: 404 Not Found/;
	const mockApiResponse = {
		ok: false,
		status: 404,
		statusText: 'Not Found',
	} as Response;

	// OPERATIONS
	globalThis.fetch = async () => mockApiResponse;
	const mockManager = new MockAttendanceManager();
	const service = new HolidayImportService(mockManager, testConfig);

	// SPECIFIC VALUE COMPARISONS
	await t.throwsAsync(async () => service.importHolidays(testYear), {
		message: expectedErrorPattern,
	});
});

test('HolidayImportService - importHolidays handles network errors', async t => {
	// EXPLICIT TEST DATA
	const testYear = 2025;
	const networkError = new Error('Network error');
	const expectedErrorPattern = /Failed to import holidays: Network error/;

	// OPERATIONS
	globalThis.fetch = async () => {
		throw networkError;
	};

	const mockManager = new MockAttendanceManager();
	const service = new HolidayImportService(mockManager, testConfig);

	// SPECIFIC VALUE COMPARISONS
	await t.throwsAsync(async () => service.importHolidays(testYear), {
		message: expectedErrorPattern,
	});
});

test('HolidayImportService - importHolidays throws when dates already exist', async t => {
	// EXPLICIT TEST DATA
	const testYear = 2025;
	const existingDate = '2025-01-01';
	const expectedErrorPattern =
		/Cannot import holidays: The following dates already have attendance entries: 2025-01-01/;
	const expectedImportCount = 0;

	// OPERATIONS
	globalThis.fetch = async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : (input as URL).href;
		if (url.includes('feiertage-api.de')) {
			return {
				ok: true,
				json: async () => mockHolidayApiResponse,
			} as Response;
		}

		throw new Error(`Unexpected fetch to ${url}`);
	};

	const mockManager = new MockAttendanceManager();
	mockManager.setExistingDate(existingDate);
	const service = new HolidayImportService(mockManager, testConfig);

	// SPECIFIC VALUE COMPARISONS
	await t.throwsAsync(async () => service.importHolidays(testYear), {
		message: expectedErrorPattern,
	});
	t.is(
		mockManager.updatedAttendances.length,
		expectedImportCount,
		'Should not import any holidays when conflicts exist',
	);
});

test('HolidayImportService - importHolidays throws when multiple dates already exist', async t => {
	// EXPLICIT TEST DATA
	const testYear = 2025;
	const existingDates = ['2025-01-01', '2025-04-18'];
	const expectedErrorPattern =
		/Cannot import holidays: The following dates already have attendance entries: 2025-01-01, 2025-04-18/;
	const expectedImportCount = 0;

	// OPERATIONS
	globalThis.fetch = async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : (input as URL).href;
		if (url.includes('feiertage-api.de')) {
			return {
				ok: true,
				json: async () => mockHolidayApiResponse,
			} as Response;
		}

		throw new Error(`Unexpected fetch to ${url}`);
	};

	const mockManager = new MockAttendanceManager();
	for (const date of existingDates) {
		mockManager.setExistingDate(date);
	}

	const service = new HolidayImportService(mockManager, testConfig);

	// SPECIFIC VALUE COMPARISONS
	await t.throwsAsync(async () => service.importHolidays(testYear), {
		message: expectedErrorPattern,
	});
	t.is(
		mockManager.updatedAttendances.length,
		expectedImportCount,
		'Should not import any holidays when multiple conflicts exist',
	);
});
