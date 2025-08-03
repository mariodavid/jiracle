import test from 'ava';
import {parseCSVTimesheet} from '../../services/CSVTimesheetParser.js';
import {TimesheetImportService} from '../../services/TimesheetImportService.js';
import {AttendanceCSVStorage} from '../../attendance/AttendanceCSVStorage.js';
import {LocalDate} from '../../domain/LocalDate.js';
import type {JiraClient} from '../../jira-client.js';
import type {WorklogRequest} from '../../jira/types.js';
import {
	TestPatterns,
	type TemporaryFileManager,
} from '../utils/test-helpers.js';

// Test Data - Real CSV content for end-to-end testing
const REAL_CSV_CONTENT = `Date,Start,End,Break,Work Item 1,Hours 1,Issue 1,Work Item 2,Hours 2,Issue 2,Work Item 3,Hours 3,Issue 3,Work Item 4,Hours 4,Issue 4
2025-07-15,08:00,17:30,1:00,Backend API Development,4.5,PROJ-1001,Code Review,2.0,PROJ-1002,Documentation,2.0,DOC-500,,,
2025-07-16,07:30,16:00,0:45,Frontend Work,3.5,FEAT-2001,Bug Fixes,2.5,BUG-1500,Sprint Planning,1.75,PROJ-1001,,,`;

const EXPECTED_ATTENDANCE_RECORDS = [
	{
		date: '2025-07-15',
		checkIn: '08:00',
		checkOut: '17:30',
		breakMinutes: 60,
		totalHours: 8.5,
	},
	{
		date: '2025-07-16',
		checkIn: '07:30',
		checkOut: '16:00',
		breakMinutes: 45,
		totalHours: 7.75,
	},
];

const EXPECTED_JIRA_CALLS = [
	{
		issueKey: 'PROJ-1001',
		timeSpent: '4h 30m',
		comment: 'Backend API Development',
	},
	{
		issueKey: 'PROJ-1002',
		timeSpent: '2h',
		comment: 'Code Review',
	},
	{
		issueKey: 'DOC-500',
		timeSpent: '2h',
		comment: 'Documentation',
	},
	{
		issueKey: 'FEAT-2001',
		timeSpent: '3h 30m',
		comment: 'Frontend Work',
	},
	{
		issueKey: 'BUG-1500',
		timeSpent: '2h 30m',
		comment: 'Bug Fixes',
	},
	{
		issueKey: 'PROJ-1001',
		timeSpent: '1h 45m',
		comment: 'Sprint Planning',
	},
];

// Create mock JIRA client that captures API calls
function createMockJiraClient() {
	const worklogCalls: Array<{issueKey: string; worklogData: WorklogRequest}> =
		[];

	const mockClient = {
		worklogCalls,
		async addWorklog(issueKey: string, worklogData: WorklogRequest) {
			worklogCalls.push({issueKey, worklogData});
			return {id: `worklog-${Date.now()}`};
		},
		async fetchAssignedIssues() {
			return [];
		},
		async fetchIssue() {
			return {key: 'TEST-123', fields: {summary: 'Test Issue'}};
		},
	};

	return mockClient as typeof mockClient & JiraClient;
}

// Tests - End-to-end verification with real CSV data
test('E2E: Real CSV import creates correct attendance and JIRA worklogs', async t => {
	await TestPatterns.withTempFiles(async (manager: TemporaryFileManager) => {
		// Create real test CSV file
		manager.writeCSV(REAL_CSV_CONTENT);
		const attendancePath = manager.createTempCSVPath();

		const attendanceStorage = new AttendanceCSVStorage(attendancePath);
		const mockJiraClient = createMockJiraClient();
		const importService = new TimesheetImportService(
			mockJiraClient,
			attendanceStorage,
			'test@example.com',
		);

		// Parse and import real CSV data
		const parseResult = parseCSVTimesheet(REAL_CSV_CONTENT);
		const importResult = await importService.importTimesheet(
			parseResult.entries,
		);

		// Verify import statistics
		t.is(importResult.stats.totalRows, 2);
		t.is(importResult.stats.attendanceCreated, 2);
		t.is(importResult.stats.worklogsCreated, 6);
		t.is(importResult.stats.totalHours, 16.25);
		t.is(importResult.stats.errors.length, 0);

		// Verify JIRA API calls match expected
		t.is(mockJiraClient.worklogCalls.length, 6);

		for (const [index, expectedCall] of EXPECTED_JIRA_CALLS.entries()) {
			const actualCall = mockJiraClient.worklogCalls[index];
			t.truthy(actualCall, `JIRA call ${index + 1} should exist`);
			if (actualCall) {
				t.is(actualCall.issueKey, expectedCall.issueKey);
				t.is(actualCall.worklogData.timeSpent, expectedCall.timeSpent);
				t.is(actualCall.worklogData.comment, expectedCall.comment);
			}
		}

		// Verify attendance records in test file
		const allAttendance = await attendanceStorage.readAll();
		t.is(allAttendance.length, 2, 'Should create 2 attendance records');

		for (const [, expectedRecord] of EXPECTED_ATTENDANCE_RECORDS.entries()) {
			const actualRecord = allAttendance.find(
				record => record.date === expectedRecord.date,
			);
			t.truthy(actualRecord, `Attendance for ${expectedRecord.date} exists`);
			if (actualRecord) {
				t.is(actualRecord.checkIn, expectedRecord.checkIn);
				t.is(actualRecord.checkOut, expectedRecord.checkOut);
				t.is(actualRecord.breakMinutes, expectedRecord.breakMinutes);
				t.is(actualRecord.totalHours, expectedRecord.totalHours);
			}
		}

		// Verify records can be retrieved by date
		const record1 = await attendanceStorage.getByDate(
			LocalDate.fromString('2025-07-15'),
		);
		const record2 = await attendanceStorage.getByDate(
			LocalDate.fromString('2025-07-16'),
		);

		t.deepEqual(
			{
				date: record1?.date,
				checkIn: record1?.checkIn,
				checkOut: record1?.checkOut,
				breakMinutes: record1?.breakMinutes,
				totalHours: record1?.totalHours,
			},
			EXPECTED_ATTENDANCE_RECORDS[0],
		);

		t.deepEqual(
			{
				date: record2?.date,
				checkIn: record2?.checkIn,
				checkOut: record2?.checkOut,
				breakMinutes: record2?.breakMinutes,
				totalHours: record2?.totalHours,
			},
			EXPECTED_ATTENDANCE_RECORDS[1],
		);
	});
});

test('E2E: Real CSV dry-run shows preview without creating records', async t => {
	await TestPatterns.withTempFiles(async (manager: TemporaryFileManager) => {
		// Create real test CSV file
		manager.writeCSV(REAL_CSV_CONTENT);
		const attendancePath = manager.createTempCSVPath();

		const attendanceStorage = new AttendanceCSVStorage(attendancePath);
		const mockJiraClient = createMockJiraClient();
		const importService = new TimesheetImportService(
			mockJiraClient,
			attendanceStorage,
			'test@example.com',
		);

		// Parse and import in dry-run mode
		const parseResult = parseCSVTimesheet(REAL_CSV_CONTENT);
		const importResult = await importService.importTimesheet(
			parseResult.entries,
			{dryRun: true},
		);

		// Verify dry-run statistics
		t.is(importResult.stats.attendanceCreated, 2);
		t.is(importResult.stats.worklogsCreated, 6);
		t.is(importResult.stats.totalHours, 16.25);

		// Verify no actual JIRA calls were made
		t.is(mockJiraClient.worklogCalls.length, 0);

		// Verify no attendance records were created
		const allAttendance = await attendanceStorage.readAll();
		t.is(allAttendance.length, 0);
	});
});

test('E2E: Real CSV with existing attendance handles skip/update correctly', async t => {
	await TestPatterns.withTempFiles(async (manager: TemporaryFileManager) => {
		// Create real test CSV file
		manager.writeCSV(REAL_CSV_CONTENT);
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
			date: '2025-07-15',
			checkIn: '09:00',
			checkOut: '17:00',
			breakMinutes: 30,
			totalHours: 7.5,
		});

		// Parse and import with skip existing
		const parseResult = parseCSVTimesheet(REAL_CSV_CONTENT);
		const importResult = await importService.importTimesheet(
			parseResult.entries,
			{skipExisting: true, updateExisting: false},
		);

		// Verify skip behavior
		t.is(importResult.stats.attendanceCreated, 1); // Only second record
		t.is(importResult.stats.attendanceSkipped, 1); // First record skipped
		t.is(importResult.stats.worklogsCreated, 3); // Only second day worklogs
		t.is(importResult.skippedDates.length, 1);
		t.is(importResult.skippedDates[0], '2025-07-15');

		// Verify original record was preserved
		const existingRecord = await attendanceStorage.getByDate(
			LocalDate.fromString('2025-07-15'),
		);
		t.is(existingRecord?.checkIn, '09:00'); // Original preserved
		t.is(existingRecord?.totalHours, 7.5); // Original preserved
	});
});
