import test from 'ava';
import {TimesheetImportService} from '../../services/TimesheetImportService.js';
import {parseCSVTimesheet} from '../../services/CSVTimesheetParser.js';
import {AttendanceCSVStorage} from '../../attendance/AttendanceCSVStorage.js';
import {LocalDate} from '../../domain/LocalDate.js';
import type {JiraClient} from '../../jira-client.js';
import type {WorklogRequest} from '../../jira/types.js';
import {
	TestPatterns,
	type TemporaryFileManager,
} from '../utils/test-helpers.js';

// Test Data - Define expected inputs and outputs
const VALID_CSV_CONTENT = `Date,Start,End,Break,Work Item 1,Hours 1,Issue 1,Work Item 2,Hours 2,Issue 2,Work Item 3,Hours 3,Issue 3,Work Item 4,Hours 4,Issue 4
2025-06-02,08:00,18:00,00:30,Backend Development,9.5,PROJ-1234,,,,,,,,,
2025-06-03,07:30,17:00,01:00,Frontend Work,4.0,PROJ-1234,API Integration,4.0,FEAT-5678,,,,,,`;

const EXPECTED_ATTENDANCE_ENTRIES = [
	{
		date: '2025-06-02',
		checkIn: '08:00',
		checkOut: '18:00',
		breakMinutes: 30,
		totalHours: 9.5,
	},
	{
		date: '2025-06-03',
		checkIn: '07:30',
		checkOut: '17:00',
		breakMinutes: 60,
		totalHours: 8.5,
	},
];

const EXPECTED_WORKLOG_CALLS = [
	{
		issueKey: 'PROJ-1234',
		timeSpent: '9h 30m',
		comment: 'Backend Development',
	},
	{
		issueKey: 'PROJ-1234',
		timeSpent: '4h',
		comment: 'Frontend Work',
	},
	{
		issueKey: 'FEAT-5678',
		timeSpent: '4h',
		comment: 'API Integration',
	},
];

// Create mock JIRA client that captures API calls
function createMockJiraClient(): JiraClient & {
	worklogCalls: Array<{issueKey: string; worklogData: WorklogRequest}>;
} {
	const worklogCalls: Array<{issueKey: string; worklogData: WorklogRequest}> =
		[];

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return {
		worklogCalls,
		async addWorklog(issueKey: string, worklogData: WorklogRequest) {
			worklogCalls.push({issueKey, worklogData});
			return {id: `worklog-${Date.now()}`};
		},
	} as any;
}

// Tests - Verify exact expected results
test('CSV import service creates attendance records and JIRA worklogs', async t => {
	await TestPatterns.withTempFiles(async (manager: TemporaryFileManager) => {
		// Create temporary CSV file and attendance storage
		manager.writeCSV(VALID_CSV_CONTENT);
		const attendancePath = manager.createTempCSVPath();

		const attendanceStorage = new AttendanceCSVStorage(attendancePath);
		const mockJiraClient = createMockJiraClient();
		const importService = new TimesheetImportService(
			mockJiraClient,
			attendanceStorage,
			'test@example.com',
		);

		// Parse CSV and import
		const parseResult = parseCSVTimesheet(VALID_CSV_CONTENT);
		const importResult = await importService.importTimesheet(
			parseResult.entries,
		);

		// Verify import statistics
		t.is(importResult.stats.totalRows, 2);
		t.is(importResult.stats.attendanceCreated, 2);
		t.is(importResult.stats.attendanceUpdated, 0);
		t.is(importResult.stats.worklogsCreated, 3);
		t.is(importResult.stats.totalHours, 17.5);
		t.is(importResult.stats.errors.length, 0);

		// Verify attendance records were created
		const attendance1 = await attendanceStorage.getByDate(
			LocalDate.fromString('2025-06-02'),
		);
		const attendance2 = await attendanceStorage.getByDate(
			LocalDate.fromString('2025-06-03'),
		);

		t.deepEqual(attendance1, EXPECTED_ATTENDANCE_ENTRIES[0]);
		t.deepEqual(attendance2, EXPECTED_ATTENDANCE_ENTRIES[1]);

		// Verify JIRA worklog API calls
		t.is(mockJiraClient.worklogCalls.length, 3);

		const actualCalls = mockJiraClient.worklogCalls.map(call => ({
			issueKey: call.issueKey,
			timeSpent: call.worklogData.timeSpent,
			comment: call.worklogData.comment,
		}));

		t.deepEqual(actualCalls, EXPECTED_WORKLOG_CALLS);
	});
});

test('CSV import service handles existing attendance with skip option', async t => {
	await TestPatterns.withTempFiles(async (manager: TemporaryFileManager) => {
		manager.writeCSV(VALID_CSV_CONTENT);
		const attendancePath = manager.createTempCSVPath();

		const attendanceStorage = new AttendanceCSVStorage(attendancePath);
		const mockJiraClient = createMockJiraClient();
		const importService = new TimesheetImportService(
			mockJiraClient,
			attendanceStorage,
			'test@example.com',
		);

		// Create existing attendance record
		await attendanceStorage.upsert({
			date: '2025-06-02',
			checkIn: '09:00',
			checkOut: '17:00',
			breakMinutes: 30,
			totalHours: 7.5,
		});

		// Parse CSV and import with skip existing option
		const parseResult = parseCSVTimesheet(VALID_CSV_CONTENT);
		const importResult = await importService.importTimesheet(
			parseResult.entries,
			{
				skipExisting: true,
				updateExisting: false,
			},
		);

		// Verify statistics
		t.is(importResult.stats.attendanceCreated, 1); // Only second entry
		t.is(importResult.stats.attendanceSkipped, 1); // First entry skipped
		t.is(importResult.stats.worklogsCreated, 2); // Only second entry's worklogs
		t.is(importResult.skippedDates.length, 1);
		t.is(importResult.skippedDates[0], '2025-06-02');

		// Verify existing attendance wasn't changed
		const existingAttendance = await attendanceStorage.getByDate(
			LocalDate.fromString('2025-06-02'),
		);
		t.is(existingAttendance?.checkIn, '09:00'); // Original value preserved
		t.is(existingAttendance?.totalHours, 7.5); // Original value preserved
	});
});

test('CSV import service updates existing attendance with update option', async t => {
	await TestPatterns.withTempFiles(async (manager: TemporaryFileManager) => {
		manager.writeCSV(VALID_CSV_CONTENT);
		const attendancePath = manager.createTempCSVPath();

		const attendanceStorage = new AttendanceCSVStorage(attendancePath);
		const mockJiraClient = createMockJiraClient();
		const importService = new TimesheetImportService(
			mockJiraClient,
			attendanceStorage,
			'test@example.com',
		);

		// Create existing attendance record
		await attendanceStorage.upsert({
			date: '2025-06-02',
			checkIn: '09:00',
			checkOut: '17:00',
			breakMinutes: 30,
			totalHours: 7.5,
		});

		// Parse CSV and import with update existing option
		const parseResult = parseCSVTimesheet(VALID_CSV_CONTENT);
		const importResult = await importService.importTimesheet(
			parseResult.entries,
			{
				skipExisting: false,
				updateExisting: true,
			},
		);

		// Verify statistics
		t.is(importResult.stats.attendanceCreated, 1); // Second entry
		t.is(importResult.stats.attendanceUpdated, 1); // First entry updated
		t.is(importResult.stats.worklogsCreated, 3); // All worklogs created

		// Verify existing attendance was updated
		const updatedAttendance = await attendanceStorage.getByDate(
			LocalDate.fromString('2025-06-02'),
		);
		t.is(updatedAttendance?.checkIn, '08:00'); // Updated value
		t.is(updatedAttendance?.totalHours, 9.5); // Updated value
	});
});

test('CSV import service dry-run mode does not create records', async t => {
	await TestPatterns.withTempFiles(async (manager: TemporaryFileManager) => {
		manager.writeCSV(VALID_CSV_CONTENT);
		const attendancePath = manager.createTempCSVPath();

		const attendanceStorage = new AttendanceCSVStorage(attendancePath);
		const mockJiraClient = createMockJiraClient();
		const importService = new TimesheetImportService(
			mockJiraClient,
			attendanceStorage,
			'test@example.com',
		);

		// Parse CSV and import in dry-run mode
		const parseResult = parseCSVTimesheet(VALID_CSV_CONTENT);
		const importResult = await importService.importTimesheet(
			parseResult.entries,
			{
				dryRun: true,
			},
		);

		// Verify statistics show what would be imported
		t.is(importResult.stats.attendanceCreated, 2);
		t.is(importResult.stats.worklogsCreated, 3);
		t.is(importResult.stats.totalHours, 17.5);

		// Verify no actual records were created
		t.is(mockJiraClient.worklogCalls.length, 0);

		const attendance1 = await attendanceStorage.getByDate(
			LocalDate.fromString('2025-06-02'),
		);
		const attendance2 = await attendanceStorage.getByDate(
			LocalDate.fromString('2025-06-03'),
		);

		t.is(attendance1, undefined);
		t.is(attendance2, undefined);
	});
});

test('CSV import service handles JIRA API errors gracefully', async t => {
	await TestPatterns.withTempFiles(async (manager: TemporaryFileManager) => {
		manager.writeCSV(VALID_CSV_CONTENT);
		const attendancePath = manager.createTempCSVPath();

		const attendanceStorage = new AttendanceCSVStorage(attendancePath);

		// Create mock that throws error on specific issue
		const mockJiraClient = {
			async addWorklog(issueKey: string, _worklogData: WorklogRequest) {
				if (issueKey === 'FEAT-5678') {
					throw new Error('Issue not found');
				}

				return {id: `worklog-${Date.now()}`};
			},
		} as any;

		const importService = new TimesheetImportService(
			mockJiraClient,
			attendanceStorage,
			'test@example.com',
		);

		// Parse CSV and import
		const parseResult = parseCSVTimesheet(VALID_CSV_CONTENT);
		const importResult = await importService.importTimesheet(
			parseResult.entries,
		);

		// Verify error handling
		t.is(importResult.stats.errors.length, 1);
		t.true(
			importResult.stats.errors[0]!.includes(
				'Failed to create worklog for FEAT-5678',
			),
		);
		t.true(importResult.stats.errors[0]!.includes('Issue not found'));

		// Verify partial success - attendance still created despite worklog error
		const attendance = await attendanceStorage.getByDate(
			LocalDate.fromString('2025-06-02'),
		);
		t.truthy(attendance);
		t.is(attendance?.checkIn, '08:00');
	});
});
