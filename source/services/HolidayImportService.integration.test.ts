import {promises as fs} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import test from 'ava';
import type {AttendanceConfig} from '../attendance/types.js';
import {AttendanceManager} from '../attendance/AttendanceManager.js';
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

const mockHolidayApiResponse = {
	'Holiday 1': {
		datum: '2025-01-01',
		hinweis: '',
	},
	'Holiday 2': {
		datum: '2025-04-18',
		hinweis: '',
	},
	'Holiday 3': {
		datum: '2025-04-21',
		hinweis: '',
	},
	'Holiday 4': {
		datum: '2025-05-01',
		hinweis: '',
	},
	'Holiday 5': {
		datum: '2025-05-29',
		hinweis: '',
	},
};

// Mock fetch globally
const originalFetch = globalThis.fetch;

test.beforeEach(() => {
	globalThis.fetch = async () =>
		({
			ok: true,
			json: async () => mockHolidayApiResponse,
		} as Response);
});

test.afterEach(() => {
	globalThis.fetch = originalFetch;
});

async function createTemporaryCSV(): Promise<string> {
	const temporaryDir = await fs.mkdtemp(join(tmpdir(), 'jiracle-test-'));
	const csvPath = join(temporaryDir, 'attendance.csv');
	await fs.writeFile(
		csvPath,
		'Date,Type,CheckIn,CheckOut,BreakMinutes,TotalHours,Notes\n',
	);
	return csvPath;
}

async function readCSVEntries(csvPath: string): Promise<string[]> {
	const content = await fs.readFile(csvPath, 'utf8');
	const lines = content.trim().split('\n');
	return lines.slice(1); // Skip header
}

async function cleanupTemporaryFile(csvPath: string): Promise<void> {
	try {
		await fs.unlink(csvPath);
		await fs.rmdir(join(csvPath, '..'));
	} catch {
		// Ignore cleanup errors
	}
}

test('HolidayImportService integration - imports all holidays correctly with real CSV storage', async t => {
	// EXPLICIT TEST DATA
	const expectedHolidayCount = 5;
	const expectedDates = [
		'2025-01-01',
		'2025-04-18',
		'2025-04-21',
		'2025-05-01',
		'2025-05-29',
	];

	// OPERATIONS - Create real CSV file and AttendanceManager
	const csvPath = await createTemporaryCSV();
	const attendanceManager = new AttendanceManager(testConfig, csvPath);
	const holidayService = new HolidayImportService(
		attendanceManager,
		testConfig,
	);

	const importedCount = await holidayService.importHolidays(2025);

	// Read actual CSV content
	const csvEntries = await readCSVEntries(csvPath);

	// SPECIFIC VALUE COMPARISONS
	t.is(
		importedCount,
		expectedHolidayCount,
		'Should return correct import count',
	);
	t.is(
		csvEntries.length,
		expectedHolidayCount,
		'Should have all holidays in CSV',
	);

	// Verify all expected dates are present
	const actualDates = csvEntries
		.map(line => line.split(',')[0]!)
		.sort((a, b) => a.localeCompare(b));
	const sortedExpectedDates = [...expectedDates].sort((a, b) =>
		a.localeCompare(b),
	);

	t.deepEqual(
		actualDates,
		sortedExpectedDates,
		'Should have all expected holiday dates',
	);

	// Verify all entries are HOLIDAY type
	for (const line of csvEntries) {
		const csvFields = line.split(',');
		const date = csvFields[0];
		const type = csvFields[1];
		const breakMinutes = csvFields[4];
		const totalHours = csvFields[5];
		const notes = csvFields[6];
		t.is(
			type,
			'HOLIDAY',
			`Entry for ${date ?? 'unknown'} should be HOLIDAY type`,
		);
		t.is(
			breakMinutes,
			'0',
			`Entry for ${date ?? 'unknown'} should have 0 break minutes`,
		);
		t.is(
			totalHours,
			'0',
			`Entry for ${date ?? 'unknown'} should have 0 total hours`,
		);
		t.regex(
			notes ?? '',
			/^Public Holiday:/,
			`Entry for ${date ?? 'unknown'} should have holiday note format`,
		);
	}

	// Cleanup
	t.teardown(async () => {
		await cleanupTemporaryFile(csvPath);
	});
});

test('HolidayImportService integration - sequential import prevents data loss', async t => {
	// EXPLICIT TEST DATA
	const expectedHolidayCount = 5;

	// OPERATIONS - Test that sequential import doesn't lose data
	const csvPath = await createTemporaryCSV();
	const attendanceManager = new AttendanceManager(testConfig, csvPath);
	const holidayService = new HolidayImportService(
		attendanceManager,
		testConfig,
	);

	// Import holidays
	await holidayService.importHolidays(2025);

	// Read CSV immediately after import
	const csvEntries = await readCSVEntries(csvPath);

	// SPECIFIC VALUE COMPARISONS - Verify no data was lost due to race conditions
	t.is(
		csvEntries.length,
		expectedHolidayCount,
		'Sequential import should preserve all entries',
	);

	// Verify all dates are unique (no duplicates or overwrites)
	const dates = csvEntries.map(line => line.split(',')[0]);
	const uniqueDates = [...new Set(dates)];
	t.is(uniqueDates.length, dates.length, 'All holiday dates should be unique');

	// Cleanup
	t.teardown(async () => {
		await cleanupTemporaryFile(csvPath);
	});
});

test('HolidayImportService integration - conflict detection works with real storage', async t => {
	// EXPLICIT TEST DATA
	const conflictDate = '2025-01-01';
	const expectedConflictMessage =
		/Cannot import holidays: The following dates already have attendance entries: 2025-01-01/;

	// OPERATIONS - Pre-populate CSV with one entry, then try to import
	const csvPath = await createTemporaryCSV();
	const attendanceManager = new AttendanceManager(testConfig, csvPath);

	// Add a conflicting entry first
	await attendanceManager.updateAttendance({
		date: conflictDate,
		type: 'WORK',
		checkIn: '08:00',
		checkOut: '17:00',
		breakMinutes: 30,
		totalHours: 8,
		notes: 'Existing work entry',
	});

	const holidayService = new HolidayImportService(
		attendanceManager,
		testConfig,
	);

	// SPECIFIC VALUE COMPARISONS - Should throw with specific conflict message
	await t.throwsAsync(async () => holidayService.importHolidays(2025), {
		message: expectedConflictMessage,
	});

	// Verify original entry is preserved
	const csvEntries = await readCSVEntries(csvPath);
	t.is(csvEntries.length, 1, 'Should only have original conflicting entry');

	const [date, type] = csvEntries[0]!.split(',');
	t.is(date, conflictDate, 'Conflicting date should be preserved');
	t.is(type, 'WORK', 'Original entry type should be preserved');

	// Cleanup
	t.teardown(async () => {
		await cleanupTemporaryFile(csvPath);
	});
});
