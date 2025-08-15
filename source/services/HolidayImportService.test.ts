import test from 'ava';
import type {Attendance, AttendanceConfig} from '../attendance/types.js';
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

	async hasAttendanceForDate(date: string): Promise<boolean> {
		return this.existingDates.has(date);
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
	const mockManager = new MockAttendanceManager();
	const service = new HolidayImportService(mockManager, testConfig);

	const result = service.isConfigured();

	t.true(result);
});

test('HolidayImportService - isConfigured returns false when holidays config missing', t => {
	const mockManager = new MockAttendanceManager();
	const service = new HolidayImportService(mockManager, testConfigNoHolidays);

	const result = service.isConfigured();

	t.false(result);
});

test('HolidayImportService - getConfiguredLand returns correct land code', t => {
	const mockManager = new MockAttendanceManager();
	const service = new HolidayImportService(mockManager, testConfig);

	const result = service.getConfiguredLand();

	t.is(result, 'sh');
});

test('HolidayImportService - getConfiguredLand returns undefined when not configured', t => {
	const mockManager = new MockAttendanceManager();
	const service = new HolidayImportService(mockManager, testConfigNoHolidays);

	const result = service.getConfiguredLand();

	t.is(result, undefined);
});

test('HolidayImportService - importHolidays throws when land not configured', async t => {
	const mockManager = new MockAttendanceManager();
	const service = new HolidayImportService(mockManager, testConfigNoHolidays);

	await t.throwsAsync(async () => service.importHolidays(2025), {
		message: 'Holiday land configuration is missing in attendance config',
	});
});

test('HolidayImportService - importHolidays successfully imports holidays', async t => {
	const mockManager = new MockAttendanceManager();
	const service = new HolidayImportService(mockManager, testConfig);

	const result = await service.importHolidays(2025);

	t.is(result, 3);
	t.is(mockManager.updatedAttendances.length, 3);

	const expectedAttendances = [
		{
			date: '2025-01-01',
			type: 'HOLIDAY',
			breakMinutes: 0,
			notes: 'Public Holiday',
		},
		{
			date: '2025-04-18',
			type: 'HOLIDAY',
			breakMinutes: 0,
			notes: 'Public Holiday',
		},
		{
			date: '2025-04-21',
			type: 'HOLIDAY',
			breakMinutes: 0,
			notes: 'Public Holiday',
		},
	];

	for (const [index, expected] of expectedAttendances.entries()) {
		const actual = mockManager.updatedAttendances[index];
		t.truthy(actual, `Attendance at index ${index} should exist`);
		if (actual) {
			t.is(actual.date, expected.date);
			t.is(actual.type, expected.type as 'HOLIDAY');
			t.is(actual.breakMinutes, expected.breakMinutes);
			t.is(actual.notes, expected.notes);
		}
	}
});

test('HolidayImportService - importHolidays handles API errors', async t => {
	globalThis.fetch = async () =>
		({
			ok: false,
			status: 404,
			statusText: 'Not Found',
		} as Response);

	const mockManager = new MockAttendanceManager();
	const service = new HolidayImportService(mockManager, testConfig);

	await t.throwsAsync(async () => service.importHolidays(2025), {
		message: /Holiday API request failed: 404 Not Found/,
	});
});

test('HolidayImportService - importHolidays handles network errors', async t => {
	globalThis.fetch = async () => {
		throw new Error('Network error');
	};

	const mockManager = new MockAttendanceManager();
	const service = new HolidayImportService(mockManager, testConfig);

	await t.throwsAsync(async () => service.importHolidays(2025), {
		message: /Failed to import holidays: Network error/,
	});
});

test('HolidayImportService - importHolidays throws when dates already exist', async t => {
	// Setup fetch mock for this test
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
	// Set existing attendance for one of the holiday dates
	mockManager.setExistingDate('2025-01-01');
	const service = new HolidayImportService(mockManager, testConfig);

	await t.throwsAsync(async () => service.importHolidays(2025), {
		message:
			/Cannot import holidays: The following dates already have attendance entries: 2025-01-01/,
	});

	// Should not have imported any holidays
	t.is(mockManager.updatedAttendances.length, 0);
});

test('HolidayImportService - importHolidays throws when multiple dates already exist', async t => {
	// Setup fetch mock for this test
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
	// Set existing attendance for multiple holiday dates
	mockManager.setExistingDate('2025-01-01');
	mockManager.setExistingDate('2025-04-18');
	const service = new HolidayImportService(mockManager, testConfig);

	await t.throwsAsync(async () => service.importHolidays(2025), {
		message:
			/Cannot import holidays: The following dates already have attendance entries: 2025-01-01, 2025-04-18/,
	});

	// Should not have imported any holidays
	t.is(mockManager.updatedAttendances.length, 0);
});
