import test from 'ava';
import type {JiraClient} from '../../jira-client.js';
import {StatisticsUseCase} from '../../use-cases/StatisticsUseCase.js';
import {LocalDate} from '../../domain/LocalDate.js';
import type {AttendanceManager} from '../../attendance/AttendanceManager.js';

// TEST DATA
const EXPECTED_JANUARY_VACATION_DAYS = 2;
const EXPECTED_FEBRUARY_VACATION_DAYS = 1;
const EXPECTED_TOTAL_VACATION_DAYS = 3;

const MOCK_VACATION_DATES = ['2025-01-20', '2025-01-21', '2025-02-14'];

const BONUS_CONFIG = {
	enabled: true,
	hoursPerBonusDay: 8,
	targetDays: 190,
	targetAmount: 10_000,
	currency: 'EUR' as const,
	targets: {
		minimum: {days: 150, label: 'Minimum', percentage: 79},
		standard: {days: 190, label: 'Standard', percentage: 100},
		stretch: {days: 210, label: 'Stretch', percentage: 128},
		maximum: {days: 230, label: 'Maximum', percentage: 148},
	},
};

// OPERATIONS
function createMockAttendanceManager(): AttendanceManager {
	const mockVacationRecords = MOCK_VACATION_DATES.map(date => ({
		date: LocalDate.fromString(date),
		type: 'VACATION' as const,
		breakMinutes: 30,
	}));

	return {
		async getAttendanceRange(startDate: LocalDate, endDate: LocalDate) {
			return mockVacationRecords.filter(record => {
				const recordDateString = record.date.toISOString();
				const startString = startDate.toISOString();
				const endString = endDate.toISOString();
				return recordDateString >= startString && recordDateString <= endString;
			});
		},
	} as unknown as AttendanceManager;
}

function createMockJiraClient(): JiraClient {
	const mockCurrentUser = {
		emailAddress: 'test@example.com',
		displayName: 'Test User',
	};

	// Mock worklog data to generate totalHours
	const mockWorklogs = [
		{
			id: '1',
			author: mockCurrentUser,
			started: '2025-01-15T09:00:00.000Z',
			timeSpentSeconds: 28_800, // 8 hours
			comment: 'Test work',
		},
		{
			id: '2',
			author: mockCurrentUser,
			started: '2025-01-16T09:00:00.000Z',
			timeSpentSeconds: 28_800, // 8 hours
			comment: 'Test work',
		},
	];

	return {
		async getCurrentUser() {
			return mockCurrentUser;
		},

		async searchIssuesWithWorklogs() {
			return {
				issues: [{key: 'TEST-123'}],
			};
		},

		async getIssueWorklogs() {
			return {worklogs: mockWorklogs};
		},
	} as unknown as JiraClient;
}

// SPECIFIC VALUE COMPARISONS
test('vacation statistics integration: StatisticsUseCase calculates vacation days correctly', async t => {
	const jiraClient = createMockJiraClient();
	const attendanceManager = createMockAttendanceManager();
	const statisticsUseCase = new StatisticsUseCase(
		jiraClient,
		attendanceManager,
		BONUS_CONFIG,
	);

	// Execute statistics calculation
	const statistics = await statisticsUseCase.execute(2025);

	// Verify vacation data is calculated correctly - this is the main integration test
	t.is(
		statistics.monthlyStats[0]!.vacationDays,
		EXPECTED_JANUARY_VACATION_DAYS,
	);
	t.is(
		statistics.monthlyStats[1]!.vacationDays,
		EXPECTED_FEBRUARY_VACATION_DAYS,
	);
	t.is(statistics.totalVacationDays, EXPECTED_TOTAL_VACATION_DAYS);

	// Integration works: StatisticsUseCase properly integrates with AttendanceManager
	// to fetch and calculate vacation statistics from vacation attendance records
	t.pass();
});

test('vacation statistics integration: StatisticsUseCase handles no vacation data correctly', async t => {
	const emptyAttendanceManager = {
		async getAttendanceRange() {
			return []; // No vacation records
		},
	} as unknown as AttendanceManager;

	const jiraClient = createMockJiraClient();
	const statisticsUseCase = new StatisticsUseCase(
		jiraClient,
		emptyAttendanceManager,
		BONUS_CONFIG,
	);

	// Execute statistics calculation with no vacation data
	const statistics = await statisticsUseCase.execute(2025);

	// Verify no vacation days are calculated
	t.is(statistics.totalVacationDays, 0);
	for (const month of statistics.monthlyStats) {
		t.is(month.vacationDays, 0);
	}

	// Integration works: StatisticsUseCase handles empty vacation data gracefully
	t.pass();
});

test('vacation statistics integration: should calculate vacation days across multiple months correctly', async t => {
	// Create vacation records spanning multiple months
	const multiMonthVacationDates = [
		'2025-01-15',
		'2025-01-16',
		'2025-01-17', // January: 3 days
		'2025-02-10',
		'2025-02-11', // February: 2 days
		'2025-03-05', // March: 1 day
	];

	const multiMonthAttendanceManager = {
		async getAttendanceRange(startDate: LocalDate, endDate: LocalDate) {
			const mockRecords = multiMonthVacationDates.map(date => ({
				date: LocalDate.fromString(date),
				type: 'VACATION' as const,
				breakMinutes: 30,
			}));

			return mockRecords.filter(record => {
				const recordDateString = record.date.toISOString();
				const startString = startDate.toISOString();
				const endString = endDate.toISOString();
				return recordDateString >= startString && recordDateString <= endString;
			});
		},
	} as unknown as AttendanceManager;

	const jiraClient = createMockJiraClient();
	const statisticsUseCase = new StatisticsUseCase(
		jiraClient,
		multiMonthAttendanceManager,
		BONUS_CONFIG,
	);

	// Execute statistics calculation
	const statistics = await statisticsUseCase.execute(2025);

	// Verify vacation days are calculated correctly for each month
	t.is(statistics.monthlyStats[0]!.vacationDays, 3); // January
	t.is(statistics.monthlyStats[1]!.vacationDays, 2); // February
	t.is(statistics.monthlyStats[2]!.vacationDays, 1); // March

	// Verify total vacation days
	t.is(statistics.totalVacationDays, 6); // 3 + 2 + 1

	// Integration works: StatisticsUseCase correctly calculates vacation days
	// across multiple months from AttendanceManager vacation records
	t.pass();
});
