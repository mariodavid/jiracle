import test from 'ava';
import {StatisticsUseCase} from '../../use-cases/StatisticsUseCase.js';
import {LocalDate} from '../../domain/LocalDate.js';
import {IssueKey} from '../../domain/IssueKey.js';
import type {JiraClient} from '../../jira-client.js';
import type {AttendanceManager} from '../../attendance/AttendanceManager.js';

// TEST DATA
const TEST_YEAR = 2025;
const EXPECTED_JANUARY_WORKLOG_DAYS = 3;
const EXPECTED_JANUARY_ATTENDANCE_DAYS = 5;
const EXPECTED_FEBRUARY_WORKLOG_DAYS = 2;
const EXPECTED_FEBRUARY_ATTENDANCE_DAYS = 4;
const EXPECTED_TOTAL_WORKLOG_DAYS = 5;
const EXPECTED_TOTAL_ATTENDANCE_DAYS = 9;

const MOCK_WORKLOG_DATES = [
	'2025-01-15',
	'2025-01-16',
	'2025-01-17',
	'2025-02-10',
	'2025-02-11',
];

const MOCK_ATTENDANCE_DATES = [
	'2025-01-13',
	'2025-01-14',
	'2025-01-15',
	'2025-01-16',
	'2025-01-17',
	'2025-02-10',
	'2025-02-11',
	'2025-02-12',
	'2025-02-13',
];

// OPERATIONS
function createMockJiraClient(): JiraClient {
	const mockCurrentUser = {
		emailAddress: 'test@example.com',
		displayName: 'Test User',
	};

	const mockIssues = [
		{key: IssueKey.fromString('TEST-123')},
		{key: IssueKey.fromString('TEST-456')},
	];

	const mockWorklogs = MOCK_WORKLOG_DATES.map(date => ({
		id: '12345',
		author: mockCurrentUser,
		started: `${date}T09:00:00.000Z`,
		timeSpentSeconds: 28_800,
		comment: 'Test work',
	}));

	return {
		async getCurrentUser() {
			return mockCurrentUser;
		},

		async searchIssuesWithWorklogs() {
			return {issues: mockIssues};
		},

		async getIssueWorklogs() {
			return {worklogs: mockWorklogs};
		},
	} as unknown as JiraClient;
}

function createMockAttendanceManager(): AttendanceManager {
	const mockAttendanceRecords = MOCK_ATTENDANCE_DATES.map(date => ({
		date: LocalDate.fromString(date),
		checkIn: '09:00',
		checkOut: '17:00',
	}));

	return {
		async getAttendanceRange(startDate: LocalDate, endDate: LocalDate) {
			return mockAttendanceRecords.filter(record => {
				const recordDateString = record.date.toISOString();
				const startString = startDate.toISOString();
				const endString = endDate.toISOString();
				return recordDateString >= startString && recordDateString <= endString;
			});
		},
	} as unknown as AttendanceManager;
}

// SPECIFIC VALUE COMPARISONS
test('should calculate yearly statistics with all monthly data', async t => {
	const jiraClient = createMockJiraClient();
	const attendanceManager = createMockAttendanceManager();
	const useCase = new StatisticsUseCase(jiraClient, attendanceManager);

	const result = await useCase.execute(TEST_YEAR);

	t.is(result.year, TEST_YEAR);
	t.is(result.monthlyStats.length, 12);
	t.is(result.totalWorklogDays, EXPECTED_TOTAL_WORKLOG_DAYS);
	t.is(result.totalAttendanceDays, EXPECTED_TOTAL_ATTENDANCE_DAYS);

	// Verify January data
	const januaryStats = result.monthlyStats[0]!;
	t.is(januaryStats.month, 'January');
	t.is(januaryStats.worklogDays, EXPECTED_JANUARY_WORKLOG_DAYS);
	t.is(januaryStats.attendanceDays, EXPECTED_JANUARY_ATTENDANCE_DAYS);

	// Verify February data
	const februaryStats = result.monthlyStats[1]!;
	t.is(februaryStats.month, 'February');
	t.is(februaryStats.worklogDays, EXPECTED_FEBRUARY_WORKLOG_DAYS);
	t.is(februaryStats.attendanceDays, EXPECTED_FEBRUARY_ATTENDANCE_DAYS);

	// Verify months with no data have zero counts
	const marchStats = result.monthlyStats[2]!;
	t.is(marchStats.month, 'March');
	t.is(marchStats.worklogDays, 0);
	t.is(marchStats.attendanceDays, 0);
});

test('should use current year when no year specified', async t => {
	const jiraClient = createMockJiraClient();
	const attendanceManager = createMockAttendanceManager();
	const useCase = new StatisticsUseCase(jiraClient, attendanceManager);
	const currentYear = new Date().getFullYear();

	const result = await useCase.execute();

	t.is(result.year, currentYear);
	t.is(result.monthlyStats.length, 12);
});

test('should handle jira client errors gracefully', async t => {
	const errorJiraClient = {
		async getCurrentUser() {
			throw new Error('Network error');
		},
		async searchIssuesWithWorklogs() {
			throw new Error('Network error');
		},
		async getIssueWorklogs() {
			throw new Error('Network error');
		},
	} as any;

	const attendanceManager = createMockAttendanceManager();
	const useCase = new StatisticsUseCase(errorJiraClient, attendanceManager);

	const result = await useCase.execute(TEST_YEAR);

	// Should return zero worklog days due to error but normal attendance days
	t.is(result.totalWorklogDays, 0);
	t.is(result.totalAttendanceDays, EXPECTED_TOTAL_ATTENDANCE_DAYS);
});

test('should handle attendance manager errors gracefully', async t => {
	const jiraClient = createMockJiraClient();
	const errorAttendanceManager = {
		async getAttendanceRange() {
			throw new Error('File read error');
		},
	} as any;

	const useCase = new StatisticsUseCase(jiraClient, errorAttendanceManager);

	const result = await useCase.execute(TEST_YEAR);

	// Should return zero attendance days due to error but normal worklog days
	t.is(result.totalWorklogDays, EXPECTED_TOTAL_WORKLOG_DAYS);
	t.is(result.totalAttendanceDays, 0);
});

test('should filter worklogs by current user email', async t => {
	const mockCurrentUser = {
		emailAddress: 'user@example.com',
		displayName: 'Current User',
	};

	const mockOtherUser = {
		emailAddress: 'other@example.com',
		displayName: 'Other User',
	};

	const jiraClientWithMultipleUsers = {
		async getCurrentUser() {
			return mockCurrentUser;
		},

		async searchIssuesWithWorklogs() {
			return {issues: [{key: IssueKey.fromString('TEST-123')}]};
		},

		async getIssueWorklogs() {
			return {
				worklogs: [
					{
						id: '1',
						author: mockCurrentUser,
						started: '2025-01-15T09:00:00.000Z',
						timeSpentSeconds: 28_800,
						comment: 'My work',
					},
					{
						id: '2',
						author: mockOtherUser,
						started: '2025-01-15T10:00:00.000Z',
						timeSpentSeconds: 14_400,
						comment: 'Other work',
					},
					{
						id: '3',
						author: mockCurrentUser,
						started: '2025-01-16T09:00:00.000Z',
						timeSpentSeconds: 28_800,
						comment: 'More of my work',
					},
				],
			};
		},
	} as any;

	const attendanceManager = createMockAttendanceManager();
	const useCase = new StatisticsUseCase(
		jiraClientWithMultipleUsers,
		attendanceManager,
	);

	const result = await useCase.execute(TEST_YEAR);

	// Should only count worklog days for current user (2 days: Jan 15, Jan 16)
	const januaryStats = result.monthlyStats[0]!;
	t.is(januaryStats.worklogDays, 2);
});
