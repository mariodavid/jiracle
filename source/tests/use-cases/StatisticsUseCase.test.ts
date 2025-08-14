import test from 'ava';
import {StatisticsUseCase} from '../../use-cases/StatisticsUseCase.js';
import {LocalDate} from '../../domain/LocalDate.js';
import {IssueKey} from '../../domain/IssueKey.js';
import type {JiraClient} from '../../jira-client.js';
import type {AttendanceManager} from '../../attendance/AttendanceManager.js';
import type {BonusConfig} from '../../jira/types.js';

// TEST DATA
const TEST_YEAR = 2025;
const EXPECTED_JANUARY_WORKLOG_DAYS = 3;
const EXPECTED_JANUARY_ATTENDANCE_DAYS = 5;
const EXPECTED_FEBRUARY_WORKLOG_DAYS = 2;
const EXPECTED_FEBRUARY_ATTENDANCE_DAYS = 4;
const EXPECTED_TOTAL_WORKLOG_DAYS = 5;
const EXPECTED_TOTAL_ATTENDANCE_DAYS = 9;
const EXPECTED_JANUARY_VACATION_DAYS = 2;
const EXPECTED_FEBRUARY_VACATION_DAYS = 1;
const EXPECTED_TOTAL_VACATION_DAYS = 3;

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

const MOCK_VACATION_DATES = ['2025-01-20', '2025-01-21', '2025-02-14'];

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

	const mockVacationRecords = MOCK_VACATION_DATES.map(date => ({
		date: LocalDate.fromString(date),
		type: 'VACATION' as const,
		breakMinutes: 30,
	}));

	const allRecords = [...mockAttendanceRecords, ...mockVacationRecords];

	return {
		async getAttendanceRange(startDate: LocalDate, endDate: LocalDate) {
			return allRecords.filter(record => {
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

	// Verify vacation data
	t.is(januaryStats.vacationDays, EXPECTED_JANUARY_VACATION_DAYS);
	t.is(februaryStats.vacationDays, EXPECTED_FEBRUARY_VACATION_DAYS);
	t.is(marchStats.vacationDays, 0);

	// Verify total vacation days
	t.is(result.totalVacationDays, EXPECTED_TOTAL_VACATION_DAYS);
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

// BONUS TRACKING TESTS - Test Scenario 1: Basic Bonus Tracking with Mock Data
test('bonus tracking: should calculate monthly bonus metrics correctly', async t => {
	// TEST DATA
	const testBonusConfig: BonusConfig = {
		enabled: true,
		hoursPerBonusDay: 8,
		targetDays: 190,
		targetAmount: 10_000,
		currency: 'EUR',
		targets: {
			minimum: {days: 150, label: 'Minimum', percentage: 79},
			standard: {days: 190, label: 'Standard', percentage: 100},
			stretch: {days: 210, label: 'Stretch', percentage: 128},
			maximum: {days: 230, label: 'Maximum', percentage: 148},
		},
	};

	const mockWorklogData = [
		// January: 23 work days, 184h logged (23 bonus days, high efficiency)
		{month: 1, workDays: 23, loggedHours: 184},
		// February: 20 work days, 160h logged (20 bonus days, high efficiency)
		{month: 2, workDays: 20, loggedHours: 160},
		// March: 21 work days, 168h logged (21 bonus days, high efficiency)
		{month: 3, workDays: 21, loggedHours: 168},
	];

	// OPERATIONS
	const jiraClient = createBonusTrackingMockJiraClient(mockWorklogData);
	const attendanceManager = createMockAttendanceManager();
	const useCase = new StatisticsUseCase(
		jiraClient,
		attendanceManager,
		testBonusConfig,
	);

	const result = await useCase.execute(TEST_YEAR);

	// SPECIFIC VALUE COMPARISONS
	// January assertions
	const januaryStats = result.monthlyStats[0]!;
	t.is(januaryStats.month, 'January');
	t.is(januaryStats.businessDays, 23);
	t.is(januaryStats.totalHours, 184);
	t.is(januaryStats.bonusDays, 23); // 184 ÷ 8
	t.is(januaryStats.efficiency, 100); // (184 ÷ (23 × 8)) × 100, rounded to 2 decimals

	// February assertions
	const februaryStats = result.monthlyStats[1]!;
	t.is(februaryStats.month, 'February');
	t.is(februaryStats.businessDays, 20);
	t.is(februaryStats.totalHours, 160);
	t.is(februaryStats.bonusDays, 20); // 160 ÷ 8
	t.is(februaryStats.efficiency, 100); // (160 ÷ (20 × 8)) × 100

	// March assertions
	const marchStats = result.monthlyStats[2]!;
	t.is(marchStats.month, 'March');
	t.is(marchStats.businessDays, 21);
	t.is(marchStats.totalHours, 168);
	t.is(marchStats.bonusDays, 21); // 168 ÷ 8
	t.is(marchStats.efficiency, 100); // (168 ÷ (21 × 8)) × 100, rounded to 2 decimals

	// Year-to-date totals
	t.is(result.totalHours, 512); // 184 + 160 + 168
	t.is(result.totalBonusDays, 64); // 23 + 20 + 21
	t.true(Math.abs(result.yearToDateEfficiency! - 24.521) < 0.01); // (64 ÷ 261) × 100
});

function createBonusTrackingMockJiraClient(
	mockWorklogData: Array<{
		month: number;
		workDays: number;
		loggedHours: number;
	}>,
): JiraClient {
	const mockCurrentUser = {
		emailAddress: 'test@example.com',
		displayName: 'Test User',
	};

	const mockIssues = [{key: IssueKey.fromString('PROJ-123')}];

	return {
		async getCurrentUser() {
			return mockCurrentUser;
		},

		async searchIssuesWithWorklogs() {
			return {issues: mockIssues};
		},

		async getIssueWorklogs() {
			// Generate worklogs based on test data
			const worklogs = mockWorklogData.flatMap(({month, loggedHours}) => {
				const daysToLog = Math.ceil(loggedHours / 8); // How many days to create entries for

				return Array.from({length: daysToLog}, (_, index) => ({
					id: `worklog-${month}-${index}`,
					author: mockCurrentUser,
					started: `2025-${month.toString().padStart(2, '0')}-${(index + 1)
						.toString()
						.padStart(2, '0')}T09:00:00.000Z`,
					timeSpentSeconds:
						index < daysToLog - 1 ? 8 * 3600 : (loggedHours % 8 || 8) * 3600, // Last day gets remainder
					comment: `Work on day ${index + 1}`,
				}));
			});

			return {worklogs};
		},
	} as unknown as JiraClient;
}

// BONUS TRACKING TESTS - Test Scenario 2: Target Achievement Validation
test('bonus tracking: should validate target achievement correctly', async t => {
	// TEST DATA
	const testBonusConfig: BonusConfig = {
		enabled: true,
		hoursPerBonusDay: 8,
		targetDays: 200,
		targetAmount: 10_000,
		currency: 'EUR',
		targets: {
			minimum: {days: 150, label: 'Minimum', percentage: 75},
			standard: {days: 200, label: 'Standard', percentage: 100},
			stretch: {days: 230, label: 'Stretch', percentage: 115},
			maximum: {days: 250, label: 'Maximum', percentage: 125},
		},
	};

	const mockYearlyWorklogData = [
		// Q1: 180 hours total (22.5 bonus days)
		{month: 1, workDays: 23, loggedHours: 60}, // 7.5 bonus days
		{month: 2, workDays: 20, loggedHours: 60}, // 7.5 bonus days
		{month: 3, workDays: 21, loggedHours: 60}, // 7.5 bonus days
		// Q2: 192 hours total (24 bonus days)
		{month: 4, workDays: 22, loggedHours: 64}, // 8.0 bonus days
		{month: 5, workDays: 22, loggedHours: 64}, // 8.0 bonus days
		{month: 6, workDays: 21, loggedHours: 64}, // 8.0 bonus days
		// Q3: 192 hours total (24 bonus days) - Should reach minimum target
		{month: 7, workDays: 23, loggedHours: 64}, // 8.0 bonus days
		{month: 8, workDays: 22, loggedHours: 64}, // 8.0 bonus days
		{month: 9, workDays: 21, loggedHours: 64}, // 8.0 bonus days
		// Q4: 320 hours total (40 bonus days) - Should reach all targets
		{month: 10, workDays: 23, loggedHours: 112}, // 14.0 bonus days
		{month: 11, workDays: 21, loggedHours: 104}, // 13.0 bonus days
		{month: 12, workDays: 22, loggedHours: 104}, // 13.0 bonus days
	];

	// OPERATIONS
	const jiraClient = createBonusTrackingMockJiraClient(mockYearlyWorklogData);
	const attendanceManager = createMockAttendanceManager();
	const useCase = new StatisticsUseCase(
		jiraClient,
		attendanceManager,
		testBonusConfig,
	);

	const result = await useCase.execute(TEST_YEAR);

	// SPECIFIC VALUE COMPARISONS
	// Total bonus days calculation: 22.5 + 24 + 24 + 40 = 110.5
	t.is(result.totalBonusDays, 110.5);

	// Quarterly progress validation
	const q1BonusDays = result.monthlyStats
		.slice(0, 3)
		.reduce((sum, month) => sum + (month.bonusDays ?? 0), 0);
	const q2BonusDays = result.monthlyStats
		.slice(3, 6)
		.reduce((sum, month) => sum + (month.bonusDays ?? 0), 0);
	const q3BonusDays = result.monthlyStats
		.slice(6, 9)
		.reduce((sum, month) => sum + (month.bonusDays ?? 0), 0);
	const q4BonusDays = result.monthlyStats
		.slice(9, 12)
		.reduce((sum, month) => sum + (month.bonusDays ?? 0), 0);

	t.is(q1BonusDays, 22.5); // Below minimum target
	t.is(q2BonusDays, 24); // Below minimum target
	t.is(q3BonusDays, 24); // Below minimum target
	t.is(q4BonusDays, 40); // Above stretch target per quarter

	// Target achievement validation
	const isMinimumTargetReached =
		result.totalBonusDays! >= testBonusConfig.targets.minimum.days;
	const isStandardTargetReached =
		result.totalBonusDays! >= testBonusConfig.targets.standard.days;
	const isStretchTargetReached =
		result.totalBonusDays! >= testBonusConfig.targets.stretch.days;

	t.false(isMinimumTargetReached); // 110.5 < 150
	t.false(isStandardTargetReached); // 110.5 < 200
	t.false(isStretchTargetReached); // 110.5 < 230

	// Monthly target tracking (targetDays/12 = 200/12 = 16.67 per month)
	const monthlyTarget = testBonusConfig.targetDays / 12;
	const monthsOnTrack = result.monthlyStats.filter(
		month => (month.bonusDays ?? 0) >= monthlyTarget,
	).length;

	t.is(monthsOnTrack, 0); // No months reached the monthly target of 16.67 days

	// Performance efficiency validation
	t.true(result.yearToDateEfficiency! < 60); // Should be below 60% efficiency for the year
});

// BONUS TRACKING TESTS - Test Scenario 3: Configuration Edge Cases
test('bonus tracking: should handle configuration edge cases correctly', async t => {
	// TEST DATA - Configuration without bonus enabled
	const disabledBonusConfig: BonusConfig = {
		enabled: false,
		hoursPerBonusDay: 8,
		targetDays: 190,
		targetAmount: 10_000,
		currency: 'EUR',
		targets: {
			minimum: {days: 150, label: 'Minimum', percentage: 79},
			standard: {days: 190, label: 'Standard', percentage: 100},
			stretch: {days: 210, label: 'Stretch', percentage: 128},
			maximum: {days: 230, label: 'Maximum', percentage: 148},
		},
	};

	const mockWorklogData = [
		{month: 1, workDays: 22, loggedHours: 176}, // High hours
		{month: 2, workDays: 20, loggedHours: 160}, // High hours
	];

	// OPERATIONS
	const jiraClient = createBonusTrackingMockJiraClient(mockWorklogData);
	const attendanceManager = createMockAttendanceManager();

	// Test with disabled bonus config
	const disabledUseCase = new StatisticsUseCase(
		jiraClient,
		attendanceManager,
		disabledBonusConfig,
	);

	const disabledResult = await disabledUseCase.execute(TEST_YEAR);

	// Test with no bonus config
	const noBonusUseCase = new StatisticsUseCase(
		jiraClient,
		attendanceManager,
		undefined,
	);

	const noBonusResult = await noBonusUseCase.execute(TEST_YEAR);

	// SPECIFIC VALUE COMPARISONS
	// When bonus is disabled, bonus fields should be undefined
	t.is(disabledResult.totalBonusDays, undefined);
	t.is(disabledResult.totalHours, undefined);
	t.is(disabledResult.yearToDateEfficiency, undefined);
	t.is(disabledResult.monthlyStats[0]!.bonusDays, undefined);
	t.is(disabledResult.monthlyStats[0]!.efficiency, undefined);

	// When no bonus config provided, bonus fields should be undefined
	t.is(noBonusResult.totalBonusDays, undefined);
	t.is(noBonusResult.totalHours, undefined);
	t.is(noBonusResult.yearToDateEfficiency, undefined);
	t.is(noBonusResult.monthlyStats[0]!.bonusDays, undefined);
	t.is(noBonusResult.monthlyStats[0]!.efficiency, undefined);

	// Basic worklog and attendance tracking should still work
	t.true(disabledResult.totalWorklogDays > 0);
	t.true(disabledResult.totalAttendanceDays > 0);
	t.true(noBonusResult.totalWorklogDays > 0);
	t.true(noBonusResult.totalAttendanceDays > 0);
});

// BONUS TRACKING TESTS - Test Scenario 4: Real Jira Integration with Attendance Data
test('bonus tracking: should integrate with real attendance data correctly', async t => {
	// TEST DATA
	const testBonusConfig: BonusConfig = {
		enabled: true,
		hoursPerBonusDay: 8,
		targetDays: 190,
		targetAmount: 10_000,
		currency: 'EUR',
		targets: {
			minimum: {days: 150, label: 'Minimum', percentage: 79},
			standard: {days: 190, label: 'Standard', percentage: 100},
			stretch: {days: 210, label: 'Stretch', percentage: 128},
			maximum: {days: 230, label: 'Maximum', percentage: 148},
		},
	};

	const mockWorklogData = [
		{month: 1, workDays: 23, loggedHours: 184}, // 23 bonus days
		{month: 2, workDays: 20, loggedHours: 160}, // 20 bonus days
	];

	// Extended attendance data that includes both worklog and non-worklog days
	const extendedAttendanceData = [
		// January: 23 worklog days + 3 additional attendance days
		'2025-01-01',
		'2025-01-02',
		'2025-01-03', // Non-worklog attendance days
		...Array.from(
			{length: 23},
			(_, i) => `2025-01-${(i + 4).toString().padStart(2, '0')}`,
		),
		// February: 20 worklog days + 2 additional attendance days
		'2025-02-01',
		'2025-02-02', // Non-worklog attendance days
		...Array.from(
			{length: 20},
			(_, i) => `2025-02-${(i + 3).toString().padStart(2, '0')}`,
		),
	];

	// OPERATIONS
	const jiraClient = createBonusTrackingMockJiraClient(mockWorklogData);
	const attendanceManager = createExtendedMockAttendanceManager(
		extendedAttendanceData,
	);
	const useCase = new StatisticsUseCase(
		jiraClient,
		attendanceManager,
		testBonusConfig,
	);

	const result = await useCase.execute(TEST_YEAR);

	// SPECIFIC VALUE COMPARISONS
	// Bonus calculations should be based on worklogs, not attendance
	const januaryStats = result.monthlyStats[0]!;
	const februaryStats = result.monthlyStats[1]!;

	t.is(januaryStats.bonusDays, 23); // Based on 184 logged hours ÷ 8
	t.is(februaryStats.bonusDays, 20); // Based on 160 logged hours ÷ 8

	// Attendance should include additional days beyond worklog days
	t.is(januaryStats.attendanceDays, 26); // 23 worklog + 3 attendance-only days
	t.is(februaryStats.attendanceDays, 22); // 20 worklog + 2 attendance-only days

	// Efficiency should be calculated based on business days vs bonus days
	t.is(januaryStats.efficiency, 100); // 23 bonus days ÷ 23 business days × 100
	t.is(februaryStats.efficiency, 100); // 20 bonus days ÷ 20 business days × 100

	// Year-to-date totals
	t.is(result.totalBonusDays, 43); // 23 + 20
	t.is(result.totalAttendanceDays, 48); // 26 + 22
	t.true(Math.abs(result.yearToDateEfficiency! - 16.475) < 0.01); // (43 ÷ 261) × 100
});

function createExtendedMockAttendanceManager(
	attendanceDates: string[],
): AttendanceManager {
	const mockAttendanceRecords = attendanceDates.map(date => ({
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
